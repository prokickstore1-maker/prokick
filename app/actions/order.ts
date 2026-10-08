"use server";

import { revalidatePath } from "next/cache";
import { getJerseyById } from "@/lib/data";
import { calculatePromoEngine, ShippingZone } from "@/lib/promo";
import { getShippingZoneByState } from "@/lib/malaysia";
import { createOrderWithStock, getOrderByIdempotencyKey, updateOrderPaymentProof, updateOrderStatus, StoredOrder, getOrderById } from "@/lib/orders-store";
import { uploadToS3, getReceiptUrl } from "@/lib/s3";
import { sendTelegramNotification } from "@/lib/telegram";
import crypto from "node:crypto";
import { isAdmin } from "@/lib/admin-auth";
import { grantOrderAccess, canAccessOrder } from "@/lib/order-auth";

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  streetAddress: string;
  city: string;
  postcode: string;
  state: string;
  paymentMethodId: string;
  paymentMethodLabel: string;
  idempotencyKey?: string;
  items: Array<{
    jerseyId: string;
    name: string;
    size: string;
    quantity: number;
    namesetName?: string;
    namesetNumber?: string;
    patch?: string;
  }>;
}

// 4-digit suffix = 9000 combos; collision rolls over with a fresh draw instead of failing checkout
const seenOrderNumbers = new Set<string>();
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `PK-${date}-${crypto.randomInt(1000, 10000)}`;
    if (!seenOrderNumbers.has(candidate)) {
      seenOrderNumbers.add(candidate);
      return candidate;
    }
  }
  // exhausted same-second draws: widen to 5 digits, unique constraint still the backstop
  return `PK-${date}-${crypto.randomInt(10000, 100000)}`;
}

export async function createOrderAction(input: CreateOrderInput) {
  try {
    if (input.idempotencyKey && !/^[a-zA-Z0-9_-]{16,100}$/.test(input.idempotencyKey)) return { success: false, error: "Invalid checkout request." };
    if (!input.customerName || !input.customerPhone || !input.streetAddress || !input.state) {
      return { success: false, error: "Please complete all mandatory delivery fields." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Your shopping cart is empty." };
    }

    // 1. Authoritative Server-Side Price Verification
    const verifiedItems = [];
    const promoItemsForCalculation = [];

    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 || !item.size.trim()) {
        return { success: false, error: "Invalid item quantity or size." };
      }
      const dbJersey = await getJerseyById(item.jerseyId);
      if (!dbJersey) return { success: false, error: `Product unavailable: ${item.name}` };
      const verifiedPrice = Number(dbJersey.price);
      // stock itself is checked in createOrderWithStock (throws "Insufficient stock …")
      if (!Number.isFinite(verifiedPrice) || verifiedPrice < 0) {
        return { success: false, error: "Product unavailable." };
      }
      const verifiedName = dbJersey.name;

      verifiedItems.push({
        id: crypto.randomUUID(),
        jerseyId: item.jerseyId,
        name: verifiedName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: verifiedPrice.toFixed(2),
        namesetName: item.namesetName?.trim() || null,
        namesetNumber: item.namesetNumber?.trim() || null,
        namesetPrice: item.namesetName ? "20.00" : "0.00",
        patch: item.patch?.trim() || null,
        patchPrice: item.patch ? "10.00" : "0.00",
      });

      promoItemsForCalculation.push({
        id: item.jerseyId,
        name: verifiedName,
        price: verifiedPrice,
        quantity: item.quantity,
        hasNameset: Boolean(item.namesetName && item.namesetName.trim()),
        namesetPrice: 20.00,
        hasPatch: Boolean(item.patch && item.patch.trim()),
        patchPrice: 10.00,
      });
    }

    // 2. Authoritative Shipping Zone & Promo Calculation
    const shippingZone: ShippingZone = getShippingZoneByState(input.state);
    const promoResult = calculatePromoEngine(promoItemsForCalculation, shippingZone);

    // 3. Construct Verified Order Record
    const orderId = `pk-${crypto.randomUUID()}`;
    const orderNumber = generateOrderNumber();
    const fullAddress = `${input.streetAddress}, ${input.city}, ${input.postcode}, ${input.state}, Malaysia`;

    const newOrder: StoredOrder = {
      id: orderId,
      orderNumber,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerAddress: fullAddress,
      shippingZone,
      shippingCost: promoResult.shippingCost.toFixed(2),
      subtotal: promoResult.rawSubtotal.toFixed(2),
      totalAmount: promoResult.grandTotal.toFixed(2),
      paymentMethodId: input.paymentMethodId,
      paymentMethodLabel: input.paymentMethodLabel || "Instant QR Pay",
      paymentProofUrl: null,
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
      trackingNumber: null,
      adminNotes: null,
      idempotencyKey: input.idempotencyKey || null,
      createdAt: new Date(),
      items: verifiedItems,
    };

    // 4. Idempotent replay: same key returns the original order, no double stock deduction
    if (input.idempotencyKey) {
      const existing = await getOrderByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        await grantOrderAccess(existing.id);
        return { success: true, orderId: existing.id, orderNumber: existing.orderNumber };
      }
    }

    // 5. Reserve stock + insert order in ONE transaction (rolls back together on failure)
    await createOrderWithStock(newOrder);
    await grantOrderAccess(newOrder.id);

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    };
  } catch (error) {
    console.error("Order creation failed:", error);
    // surface actionable failures (stock, unknown product); only true unknowns get the generic line
    const message = error instanceof Error ? error.message : "";
    if (/^Insufficient stock|^Product unavailable/.test(message)) {
      return { success: false, error: message };
    }
    return { success: false, error: "An unexpected error occurred while placing order. Please try again." };
  }
}

export async function uploadReceiptAction(orderId: string, base64Data: string, mimeType: string = "image/jpeg") {
  if (!(await isAdmin()) && !(await canAccessOrder(orderId))) return { success: false, error: "Unauthorized" };
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    const match = base64Data.match(/^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || mimeType !== match[1]) return { success: false, error: "Only JPEG, PNG, or WebP receipts are allowed." };
    const buffer = Buffer.from(match[3], "base64");
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) return { success: false, error: "Receipt must be between 1 byte and 5 MB." };
    const signature = buffer.subarray(0, 12).toString("hex");
    const validSignature = (match[2] === "jpeg" && signature.startsWith("ffd8ff")) ||
      (match[2] === "png" && signature.startsWith("89504e470d0a1a0a")) ||
      (match[2] === "webp" && signature.startsWith("52494646") && buffer.subarray(8, 12).toString() === "WEBP");
    if (!validSignature) return { success: false, error: "Receipt file content is invalid." };

    // Upload to S3
    const proofUrl = await uploadToS3(buffer, `receipt-${order.orderNumber}.jpg`, mimeType);

    // Update order status to PROCESSING
    await updateOrderPaymentProof(orderId, proofUrl);

    // Dispatch Telegram alert asynchronously in background
    sendTelegramNotification({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      shippingZone: order.shippingZone,
      items: order.items.map((i) => ({
        name: i.name,
        size: i.size,
        quantity: i.quantity,
        nameset: i.namesetName ? `${i.namesetName} #${i.namesetNumber || "0"}` : undefined,
        patch: i.patch || undefined,
      })),
      totalAmount: `RM ${order.totalAmount}`,
      paymentMethod: order.paymentMethodLabel || "Instant QR Pay",
      // presign → Telegram sendPhoto needs a real URL, not the raw object key
      paymentProofUrl: await getReceiptUrl(proofUrl),
    }).catch((err) => console.error("Telegram background notification failed:", err));

    revalidatePath(`/invoice/${orderId}`);
    revalidatePath("/admin/orders");

    return { success: true, proofUrl };
  } catch (error) {
    console.error("Receipt upload failed:", error);
    return { success: false, error: "Failed to upload payment receipt." };
  }
}

export async function updateOrderStatusAction(orderId: string, status: StoredOrder["orderStatus"], tracking?: string) {
  if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
  try {
    await updateOrderStatus(orderId, status, tracking);
    revalidatePath("/admin/orders");
    revalidatePath(`/invoice/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update order status." };
  }
}
