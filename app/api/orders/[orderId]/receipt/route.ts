import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders-store";
import { getReceiptUrl } from "@/lib/s3";
import { isAdmin } from "@/lib/admin-auth";
import { canAccessOrder } from "@/lib/order-auth";

export async function GET(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!(await isAdmin()) && !(await canAccessOrder(orderId))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const order = await getOrderById(orderId);
  if (!order?.paymentProofUrl) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  return NextResponse.redirect(await getReceiptUrl(order.paymentProofUrl));
}
