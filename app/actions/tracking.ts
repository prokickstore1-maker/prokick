"use server";

import { getOrderById } from "@/lib/orders-store";

// "+60123456789" and "0123456789" are the same number; the UI placeholder offers both
function samePhone(a: string, b: string) {
  const strip = (p: string) => {
    const digits = p.replace(/[^0-9]/g, "");
    return digits.startsWith("60") ? `0${digits.slice(2)}` : digits;
  };
  const left = strip(a);
  return left.length > 5 && left === strip(b);
}

export async function trackOrderAction(orderNumber: string, phone: string) {
  const order = await getOrderById(orderNumber.trim());
  if (!order || !samePhone(order.customerPhone, phone)) return { success: false, error: "Order not found." };
  return { success: true, order: { orderNumber: order.orderNumber, status: order.orderStatus, trackingNumber: order.trackingNumber, createdAt: order.createdAt.toISOString() } };
}
