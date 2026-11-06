import { getActiveTestimonials } from "@/lib/data";
import { TestimonialsClient } from "./testimonials-client";

// Section testimoni — hanya render bila ada data aktif.
// Menggunakan thumbnail mikro + modal pop-up sehingga tidak membebani reload halaman.
export async function TestimonialsSection({ compact = false }: { compact?: boolean }) {
  const items = await getActiveTestimonials();
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Testimoni pembeli"
      className={compact ? "pt-12 border-t border-white/10 space-y-6" : "space-y-6"}
    >
      <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
            Bukti Transaksi &amp; Ulasan Asli
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
            Testimoni Pembeli
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-zinc-400 hidden sm:inline">
          Geser atau klik bukti chat untuk memperbesar
        </span>
      </div>

      <TestimonialsClient items={items} />
    </section>
  );
}
