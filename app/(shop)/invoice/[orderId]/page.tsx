import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { canAccessOrder } from "@/lib/order-auth";
import { getOrderById } from "@/lib/orders-store";
import { getSetting } from "@/lib/data";
import { InvoiceView } from "@/components/order/invoice-view";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  if (!(await isAdmin()) && !(await canAccessOrder(orderId))) redirect("/");
  const order = await getOrderById(orderId);
  const waNumber = (await getSetting("whatsappNumber", "6281234567890")).replace(/[^0-9]/g, "");
  const telegramUsername = (await getSetting("telegramUsername", "")).replace(/^@/, "");
  // admin pilih: wa | telegram | both (default both selama username terisi)
  const chatButtons = (await getSetting("invoiceChatButtons", "both")) as "wa" | "telegram" | "both";

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 sm:py-12 px-4 sm:px-8 lg:px-12">
      <InvoiceView order={order} waNumber={waNumber} telegramUsername={telegramUsername} chatButtons={chatButtons} />
    </div>
  );
}
