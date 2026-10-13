import Link from "next/link";
import { getAllJerseys } from "@/lib/data";
import { getAllOrders } from "@/lib/orders-store";
import { formatIDR, toIntlPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Skema warna disamakan dengan orders-table: PROCESSING cyan, SHIPPED/COMPLETED emerald, sisanya zinc.
const STATUS_BADGE: Record<string, string> = {
  PENDING_PAYMENT: "bg-zinc-500/15 text-zinc-300 border-zinc-500/40",
  PROCESSING: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
  SHIPPED: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  COMPLETED: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu bayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export default async function AdminIndexPage() {
  const [orders, jerseys] = await Promise.all([getAllOrders(), getAllJerseys()]);

  const processing = orders.filter((o) => o.orderStatus === "PROCESSING").length;
  const shipped = orders.filter((o) => o.orderStatus === "SHIPPED").length;
  const critical = jerseys.filter((j) => j.stock < 3).length;
  const revenue = orders
    .filter((o) => o.orderStatus === "COMPLETED")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const completedCount = orders.filter((o) => o.orderStatus === "COMPLETED").length;
  const recent = orders.slice(0, 5);

  const cards = [
    { icon: "🔔", label: "Perlu Diproses", value: String(processing), href: "/admin/orders", hint: "order masuk" },
    { icon: "🚚", label: "Sedang Dikirim", value: String(shipped), href: "/admin/orders", hint: "dalam perjalanan" },
    { icon: "⚠️", label: "Stok Kritis", value: String(critical), href: "/admin/jerseys", hint: "< 3 pcs" },
    { icon: "💰", label: "Total Penjualan", value: formatIDR(revenue), href: "/admin/orders", hint: `${completedCount} order selesai` },
  ];

  // Satu CTA volt saja (Tambah Produk); sisanya outline — hierarki, bukan 4 tombol berteriak.
  const shortcuts = [
    { label: "+ Tambah Produk", href: "/admin/products/new", primary: true },
    { label: "📦 Cek Pesanan", href: "/admin/orders", primary: false },
    { label: "📊 Kelola Stok", href: "/admin/jerseys", primary: false },
    { label: "⚙️ Pengaturan", href: "/admin/settings", primary: false },
  ];

  return (
    <div className="space-y-6 text-[#FAFAFA]">
      <header className="border-b border-[#27272A] pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Command center</p>
        <h1 className="text-3xl font-black font-display text-white">Beranda Admin</h1>
      </header>

      {/* 4 kartu status */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-[#27272A] bg-[#121217] p-4 transition-colors hover:border-[#3F3F46] active:bg-[#181820]"
          >
            <div className="text-lg">{c.icon}</div>
            <div className="mt-1 font-mono text-xl font-black text-white break-words">{c.value}</div>
            <div className="text-xs font-bold text-zinc-300">{c.label}</div>
            <div className="text-[10px] text-zinc-400">{c.hint}</div>
          </Link>
        ))}
      </div>

      {/* Tombol pintas */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex min-h-11 items-center justify-center rounded-lg px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider ${
              s.primary
                ? "bg-volt text-black hover:bg-[#d4eb3d]"
                : "border border-[#27272A] bg-[#181820] text-white hover:bg-[#27272A]"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* 5 pesanan terkini */}
      <section className="rounded-xl border border-[#27272A] bg-[#121217]">
        <div className="flex items-center justify-between border-b border-[#27272A] px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Pesanan terkini</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-volt underline">
            Lihat semua
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-400">Belum ada pesanan.</p>
        ) : (
          <ul className="divide-y divide-[#27272A]">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">{o.customerName}</div>
                  <div className="text-xs text-zinc-400">{o.orderNumber}</div>
                </div>
                <div className="font-mono text-sm font-bold text-white">{formatIDR(Number(o.totalAmount))}</div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[o.orderStatus] || "border-[#27272A] text-zinc-400"}`}>
                  {STATUS_LABEL[o.orderStatus] || o.orderStatus}
                </span>
                <a
                  href={`https://wa.me/${toIntlPhone(o.customerPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 shrink-0 rounded-lg border border-[#27272A] bg-[#181820] px-3 py-2 text-xs font-bold text-white hover:bg-[#27272A]"
                >
                  WhatsApp
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
