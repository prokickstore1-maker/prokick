import { db, checkDbConnection } from "./db";
import { orders, orderItems, jerseys } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface StoredOrderItem {
  id: string;
  jerseyId?: string | null;
  name: string;
  size: string;
  quantity: number;
  unitPrice: string;
  namesetName?: string | null;
  namesetNumber?: string | null;
  namesetPrice?: string;
  patch?: string | null;
  patchPrice?: string;
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  shippingZone: string;
  shippingCost: string;
  subtotal: string;
  totalAmount: string;
  paymentMethodId?: string | null;
  paymentMethodLabel?: string;
  paymentMethodType?: string | null;
  paymentQrImageUrl?: string | null;
  paymentAccountName?: string | null;
  paymentAccountNumber?: string | null;
  paymentSnapshot?: string | null;
  paymentProofUrl?: string | null;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  orderStatus: "PENDING_PAYMENT" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  trackingNumber?: string | null;
  adminNotes?: string | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  items: StoredOrderItem[];
}

export async function getOrderByIdempotencyKey(key: string): Promise<StoredOrder | null> {
  try {
    const row = await db.query.orders.findFirst({ where: eq(orders.idempotencyKey, key), columns: { id: true } });
    if (row) return getOrderById(row.id);
  } catch (e) {
    console.warn("Idempotency lookup failed:", e);
  }

  return null;
}

/**
 * Reserve stock and persist the order in one transaction, so a failed insert
 * can never leave stock decremented with no order behind it.
 */
export async function createOrderWithStock(order: StoredOrder): Promise<StoredOrder> {
  const isDbOnline = await checkDbConnection();
  if (!isDbOnline) throw new Error("Database offline. Order not saved.");

  await db.transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.jerseyId) throw new Error("Product unavailable");
      // FOR UPDATE: two concurrent checkouts of the last unit must serialize here,
      // otherwise both read the same stock and both pass the check.
      const [row] = await tx.select().from(jerseys).where(eq(jerseys.id, item.jerseyId)).for("update");
      if (!row) throw new Error("Product unavailable");
      const stockData = typeof row.stockData === "string" ? JSON.parse(row.stockData) : row.stockData || {};
      const current = Number(stockData[item.size] || 0);
      if (current < item.quantity) {
        // sebutkan produk + ukuran: pembeli dengan banyak item perlu tahu mana yang kurang
        throw new Error(`Insufficient stock: ${row.name} size ${item.size} (tersisa ${current}, diminta ${item.quantity})`);
      }
      stockData[item.size] = current - item.quantity;
      const stock = Object.values(stockData).reduce((sum: number, value) => sum + Number(value || 0), 0);
      await tx.update(jerseys).set({ stockData: JSON.stringify(stockData), stock }).where(eq(jerseys.id, item.jerseyId));
    }

    await tx.insert(orders).values({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      shippingZone: order.shippingZone,
      shippingCost: order.shippingCost,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      paymentMethodId: order.paymentMethodId,
      paymentSnapshot: order.paymentSnapshot,
      paymentProofUrl: order.paymentProofUrl,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      trackingNumber: order.trackingNumber,
      adminNotes: order.adminNotes,
      idempotencyKey: order.idempotencyKey,
    });

    for (const item of order.items) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        jerseyId: item.jerseyId,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        namesetName: item.namesetName,
        namesetNumber: item.namesetNumber,
        namesetPrice: item.namesetPrice || "0.00",
        patch: item.patch,
        patchPrice: item.patchPrice || "0.00",
      });
    }
  });

  return order;
}

// Prefer paymentSnapshot (di-freeze saat checkout); fallback ke relasi live untuk order lama
function paymentFromSnapshot(order: {
  paymentSnapshot?: string | null;
  paymentMethod?: { label?: string | null; type?: string | null; qrImageUrl?: string | null; accountName?: string | null; accountNumber?: string | null } | null;
}): Pick<StoredOrder, "paymentMethodLabel" | "paymentMethodType" | "paymentQrImageUrl" | "paymentAccountName" | "paymentAccountNumber"> {
  if (order.paymentSnapshot) {
    try {
      const s = JSON.parse(order.paymentSnapshot) as {
        label?: string | null; type?: string | null;
        qrImageUrl?: string | null; accountName?: string | null; accountNumber?: string | null;
      };
      return {
        paymentMethodLabel: s.label ?? order.paymentMethod?.label ?? undefined,
        paymentMethodType: s.type ?? order.paymentMethod?.type ?? undefined,
        paymentQrImageUrl: s.qrImageUrl || order.paymentMethod?.qrImageUrl || undefined,
        paymentAccountName: s.accountName ?? order.paymentMethod?.accountName ?? undefined,
        paymentAccountNumber: s.accountNumber ?? order.paymentMethod?.accountNumber ?? undefined,
      };
    } catch {
      // snapshot rusak: jatuh ke relasi live
    }
  }
  return {
    paymentMethodLabel: order.paymentMethod?.label ?? undefined,
    paymentMethodType: order.paymentMethod?.type ?? undefined,
    paymentQrImageUrl: order.paymentMethod?.qrImageUrl ?? undefined,
    paymentAccountName: order.paymentMethod?.accountName ?? undefined,
    paymentAccountNumber: order.paymentMethod?.accountNumber ?? undefined,
  };
}

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  try {
    const cleanId = id.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    const row = await db.query.orders.findFirst({
      where: isUuid ? eq(orders.id, cleanId) : eq(orders.orderNumber, cleanId.toUpperCase()),
      with: {
        items: { with: { jersey: true } },
        paymentMethod: true,
      },
    });

    if (row) {
      return {
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        customerAddress: row.customerAddress,
        shippingZone: row.shippingZone,
        shippingCost: row.shippingCost,
        subtotal: row.subtotal,
        totalAmount: row.totalAmount,
        paymentMethodId: row.paymentMethodId,
        ...paymentFromSnapshot(row),
        paymentSnapshot: row.paymentSnapshot,
        paymentProofUrl: row.paymentProofUrl,
        paymentStatus: row.paymentStatus as StoredOrder["paymentStatus"],
        orderStatus: row.orderStatus as StoredOrder["orderStatus"],
        trackingNumber: row.trackingNumber,
        adminNotes: row.adminNotes,
        createdAt: row.createdAt || new Date(),
        items: row.items.map((i) => ({
          id: i.id,
          jerseyId: i.jerseyId,
          name: i.jersey?.name || "Jersey Edition",
          size: i.size,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          namesetName: i.namesetName,
          namesetNumber: i.namesetNumber,
          namesetPrice: i.namesetPrice,
          patch: i.patch,
          patchPrice: i.patchPrice,
        })),
      };
    }
  } catch (e) {
    console.warn("DB query order error:", e);
  }

  return null;
}

export async function getAllOrders(): Promise<StoredOrder[]> {
  try {
    const rows = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      with: {
        items: { with: { jersey: true } },
        paymentMethod: true,
      },
    });

    if (rows && rows.length > 0) {
      return rows.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        customerAddress: row.customerAddress,
        shippingZone: row.shippingZone,
        shippingCost: row.shippingCost,
        subtotal: row.subtotal,
        totalAmount: row.totalAmount,
        paymentMethodId: row.paymentMethodId,
        ...paymentFromSnapshot(row),
        paymentSnapshot: row.paymentSnapshot,
        paymentProofUrl: row.paymentProofUrl,
        paymentStatus: row.paymentStatus as StoredOrder["paymentStatus"],
        orderStatus: row.orderStatus as StoredOrder["orderStatus"],
        trackingNumber: row.trackingNumber,
        adminNotes: row.adminNotes,
        createdAt: row.createdAt || new Date(),
        items: row.items.map((i) => ({
          id: i.id,
          jerseyId: i.jerseyId,
          name: i.jersey?.name || "Jersey Edition",
          size: i.size,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          namesetName: i.namesetName,
          namesetNumber: i.namesetNumber,
          namesetPrice: i.namesetPrice,
          patch: i.patch,
          patchPrice: i.patchPrice,
        })),
      }));
    }
  } catch (e) {
    console.warn("DB query all orders error:", e);
  }

  return [];
}

// Upload bukti hanya untuk order yang masih menunggu pembayaran —
// tanpa guard ini order CANCELLED/COMPLETED bisa dinaikkan ke PROCESSING lagi oleh upload telat.
export async function updateOrderPaymentProof(orderId: string, proofUrl: string) {
  const isDbOnline = await checkDbConnection();
  if (!isDbOnline) throw new Error("Database offline. Proof not saved.");

  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error("Order tidak ditemukan.");
    if (order.orderStatus !== "PENDING_PAYMENT") {
      throw new Error(`Order berstatus ${order.orderStatus} tidak lagi menerima unggahan bukti pembayaran.`);
    }
    await tx.update(orders)
      .set({ paymentProofUrl: proofUrl, orderStatus: "PROCESSING" })
      .where(eq(orders.id, orderId));
  });
}

// Cancel hanya dari status pre-shipment; retur order SHIPPED = alur terpisah (belum ada).
const CANCELABLE: StoredOrder["orderStatus"][] = ["PENDING_PAYMENT", "PROCESSING"];

// Cancel = satu transaksi: lock order, validasi status (blokir double-cancel),
// kembalikan stok per ukuran, lalu update status + paymentStatus — semua atau tidak sama sekali.
async function cancelOrderWithStock(orderId: string) {
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error("Order tidak ditemukan.");
    if (!CANCELABLE.includes(order.orderStatus as StoredOrder["orderStatus"])) {
      throw new Error(`Order berstatus ${order.orderStatus} tidak bisa dibatalkan.`);
    }

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      if (!item.jerseyId) throw new Error("Produk untuk item order sudah tidak ada — stok tidak bisa dikembalikan.");
      const [row] = await tx.select().from(jerseys).where(eq(jerseys.id, item.jerseyId)).for("update");
      if (!row) throw new Error(`Produk untuk ukuran ${item.size} sudah tidak ada — stok tidak bisa dikembalikan.`);
      const stockData = typeof row.stockData === "string" ? JSON.parse(row.stockData) : row.stockData || {};
      stockData[item.size] = Number(stockData[item.size] || 0) + item.quantity;
      const stock = Object.values(stockData).reduce((sum: number, value) => sum + Number(value || 0), 0);
      await tx.update(jerseys).set({ stockData: JSON.stringify(stockData), stock }).where(eq(jerseys.id, item.jerseyId));
    }

    await tx.update(orders).set({ orderStatus: "CANCELLED", paymentStatus: "PENDING" }).where(eq(orders.id, orderId));
  });
}

export async function updateOrderStatus(orderId: string, status: StoredOrder["orderStatus"], tracking?: string) {
  const isDbOnline = await checkDbConnection();
  if (!isDbOnline) throw new Error("Database offline. Status not saved.");

  if (status === "CANCELLED") {
    await cancelOrderWithStock(orderId);
    return;
  }
  // PROCESSING = admin confirmed payment (the only transition that marks PAID);
  // SHIPPED/COMPLETED leave paymentStatus untouched — shipping is not payment.
  const paymentStatus = status === "PROCESSING" ? "PAID" : undefined;
  await db.update(orders)
    .set({
      orderStatus: status,
      trackingNumber: tracking || undefined,
      ...(paymentStatus ? { paymentStatus } : {}),
    })
    .where(eq(orders.id, orderId));
}

export async function updateOrderAdminNotes(orderId: string, notes: string) {
  const isDbOnline = await checkDbConnection();
  if (!isDbOnline) throw new Error("Database offline. Note not saved.");

  await db.update(orders).set({ adminNotes: notes }).where(eq(orders.id, orderId));
}
