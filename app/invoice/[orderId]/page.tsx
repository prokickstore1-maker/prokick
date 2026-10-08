import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { canAccessOrder } from "@/lib/order-auth";
import { getOrderById } from "@/lib/orders-store";
import { InvoiceView } from "@/components/order/invoice-view";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  if (!(await isAdmin()) && !(await canAccessOrder(orderId))) redirect("/");
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 sm:py-12 px-4 sm:px-8 lg:px-12">
      <InvoiceView order={order} />
    </div>
  );
}
