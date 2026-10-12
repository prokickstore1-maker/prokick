import { getAllJerseys } from "@/lib/data";
import { JerseyStockTable } from "@/components/admin/jersey-stock-table";

export const dynamic = "force-dynamic";

export default async function AdminJerseysPage() {
  const jerseys = await getAllJerseys();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Inventory Matrix • Real-Time Stock
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#FAFAFA] font-display uppercase tracking-tight">
            Jersey Stock &amp; Inventory Controls
          </h1>
        </div>
      </div>

      <JerseyStockTable initialJerseys={jerseys} />
    </div>
  );
}
