import { db, checkDbConnection } from "./db";
import { orders, orderItems, jerseys } from "@/db/schema";
import { MOCK_JERSEYS } from "@/lib/mock-data";
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
  paymentQrImageUrl?: string | null;
  paymentProofUrl?: string | null;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  orderStatus: "PENDING_PAYMENT" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  trackingNumber?: string | null;
  adminNotes?: string | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  items: StoredOrderItem[];
}

// In-memory dev cache fallback
const globalOrders = globalThis as unknown as {
  mockOrders: StoredOrder[] | undefined;
  mockJerseys: typeof MOCK_JERSEYS | undefined;
};

if (!globalOrders.mockJerseys) globalOrders.mockJerseys = MOCK_JERSEYS;

if (!globalOrders.mockOrders) {
  globalOrders.mockOrders = [
    {
      id: "demo-order-1",
      orderNumber: "PK-20260922-8491",
      customerName: "Ahmad Farhan",
      customerPhone: "+60123456789",
      customerAddress: "No. 12, Jalan Telawi 3, Bangsar, 59100 Kuala Lumpur",
      shippingZone: "Peninsular Malaysia",
      shippingCost: "0.00",
      subtotal: "218.00",
      totalAmount: "218.00",
      paymentMethodId: "qr-pay",
      paymentMethodLabel: "Instant QR Pay",
      paymentProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      paymentStatus: "PAID",
      orderStatus: "PROCESSING",
      trackingNumber: null,
      adminNotes: "Customer requested UCL font style",
      createdAt: new Date(Date.now() - 3600000),
      items: [
        {
          id: "item-1",
          name: "Real Madrid Home 2026/27 Player Issue",
          size: "L",
          quantity: 1,
          unitPrice: "129.00",
          namesetName: "MBAPPE",
          namesetNumber: "9",
          namesetPrice: "20.00",
        },
        {
          id: "item-2",
          name: "Liverpool Home 2026/27 Fans Version",
          size: "M",
          quantity: 1,
          unitPrice: "89.00",
          patch: "UCL Starball + Foundation",
          patchPrice: "0.00",
        },
      ],
    },
  ];
}

export async function getOrderByIdempotencyKey(key: string): Promise<StoredOrder | null> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const row = await db.query.orders.findFirst({ where: eq(orders.idempotencyKey, key), columns: { id: true } });
      if (row) return getOrderById(row.id);
    } catch (e) {
      console.warn("Idempotency lookup failed:", e);
    }
  }

  return globalOrders.mockOrders?.find((o) => o.idempotencyKey === key) || null;
}

/**
 * Reserve stock and persist the order in one transaction, so a failed insert
 * can never leave stock decremented with no order behind it.
 */
export async function createOrderWithStock(order: StoredOrder): Promise<StoredOrder> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    await db.transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.jerseyId) throw new Error("Product unavailable");
        // FOR UPDATE: two concurrent checkouts of the last unit must serialize here,
        // otherwise both read the same stock and both pass the check.
        const [row] = await tx.select().from(jerseys).where(eq(jerseys.id, item.jerseyId)).for("update");
        if (!row) throw new Error("Product unavailable");
        const stockData = typeof row.stockData === "string" ? JSON.parse(row.stockData) : row.stockData || {};
        const current = Number(stockData[item.size] || 0);
        if (current < item.quantity) throw new Error(`Insufficient stock for size ${item.size}`);
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

  // Offline/dev: validate against the in-memory catalog, then commit both
  const snapshot = order.items.map((item) => {
    const product = globalOrders.mockJerseys?.find((j) => j.id === item.jerseyId);
    return { item, product, previous: product ? product.stockData[item.size] : undefined };
  });

  for (const { item, product } of snapshot) {
    // unknown id = forged/stale cart; block instead of creating an order for nothing
    if (!product) throw new Error("Product unavailable");
    if ((product.stockData[item.size] || 0) < item.quantity) throw new Error(`Insufficient stock for size ${item.size}`);
  }

  try {
    for (const { item, product } of snapshot) {
      if (product) product.stockData[item.size] = (product.stockData[item.size] || 0) - item.quantity;
    }
    globalOrders.mockOrders?.unshift(order);
  } catch (e) {
    for (const { item, product, previous } of snapshot) {
      if (product && previous !== undefined) product.stockData[item.size] = previous;
    }
    throw e;
  }

  return order;
}

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const row = await db.query.orders.findFirst({
        where: eq(orders.id, id),
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
          paymentMethodLabel: row.paymentMethod?.label,
          paymentQrImageUrl: row.paymentMethod?.qrImageUrl,
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
      console.warn("DB query order error, checking dev memory:", e);
    }
  }

  const found = globalOrders.mockOrders?.find((o) => o.id === id || o.orderNumber === id);
  return found || null;
}

export async function getAllOrders(): Promise<StoredOrder[]> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
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
          paymentMethodLabel: row.paymentMethod?.label,
          paymentQrImageUrl: row.paymentMethod?.qrImageUrl,
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
  }

  return globalOrders.mockOrders || [];
}

export async function updateOrderPaymentProof(orderId: string, proofUrl: string) {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    // no swallow: a failed DB write must fail the action, not report success
    await db.update(orders)
      .set({ paymentProofUrl: proofUrl, orderStatus: "PROCESSING" })
      .where(eq(orders.id, orderId));
  }

  const order = globalOrders.mockOrders?.find((o) => o.id === orderId);
  if (order) {
    order.paymentProofUrl = proofUrl;
    order.orderStatus = "PROCESSING";
  }
}

export async function updateOrderStatus(orderId: string, status: StoredOrder["orderStatus"], tracking?: string) {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    // PROCESSING = admin confirmed payment (the only transition that marks PAID);
    // SHIPPED/COMPLETED leave paymentStatus untouched — shipping is not payment.
    const paymentStatus =
      status === "PROCESSING" ? "PAID" : status === "CANCELLED" ? "PENDING" : undefined;
    await db.update(orders)
      .set({
        orderStatus: status,
        trackingNumber: tracking || undefined,
        ...(paymentStatus ? { paymentStatus } : {}),
      })
      .where(eq(orders.id, orderId));
  }

  const order = globalOrders.mockOrders?.find((o) => o.id === orderId);
  if (order) {
    order.orderStatus = status;
    if (tracking) order.trackingNumber = tracking;
    if (status === "PROCESSING") order.paymentStatus = "PAID";
    else if (status === "CANCELLED") order.paymentStatus = "PENDING";
  }
}
