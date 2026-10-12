import { getAllOrders } from "@/lib/orders-store";
import { OrdersTable } from "@/components/admin/orders-table";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Order Fulfillment • Indonesia Domestic
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#FAFAFA] font-display uppercase tracking-tight">
            Orders Verification &amp; Dispatch
          </h1>
        </div>

        <Link
          href="/admin/orders"
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#121217] border border-[#27272A] text-[#FAFAFA] text-xs font-bold hover:bg-white/5 inline-flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#FAFAFA]" />
          <span>Refresh Orders</span>
        </Link>
      </div>

      <OrdersTable initialOrders={orders} />
    </div>
  );
}
