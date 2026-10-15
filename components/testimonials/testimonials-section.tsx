import Image from "next/image";
import { getActiveTestimonials, type TestimonialView } from "@/lib/data";
import { MessageCircle } from "lucide-react";

// Section testimoni di atas footer — hanya render bila ada data aktif.
// Screenshot WA diambil admin dari chat pembeli, dikirim lewat Admin → Settings → Testimoni.
export async function TestimonialsSection() {
  const items = await getActiveTestimonials();
  if (items.length === 0) return null;

  return (
    <section aria-label="Testimoni pembeli" className="bg-[#09090B] border-t border-white/10 py-14 sm:py-16">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
            Real buyers, real chats
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
            Testimoni Pembeli
          </h2>
        </div>

        {/* mobile: geser · desktop: grid */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible lg:gap-6">
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: TestimonialView }) {
  return (
    <article className="snap-start shrink-0 w-[85%] sm:w-auto rounded-xl border border-white/10 bg-[#121217] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-[#181820] border border-white/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{t.name}</p>
            {t.club && <p className="text-[10px] text-zinc-400 truncate">Fan {t.club}</p>}
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs font-bold text-[#E2F952]">{t.rating}.0</span>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">{t.comment}</p>

      {t.proofImage && (
        <div className="relative mt-auto aspect-[9/16] sm:aspect-[4/3] max-h-72 overflow-hidden rounded-lg border border-white/10 bg-[#181820]">
          <Image
            src={t.proofImage}
            alt={`Screenshot WhatsApp dari ${t.name}`}
            fill
            sizes="(max-width: 640px) 85vw, 33vw"
            className="object-cover object-top"
          />
        </div>
      )}
    </article>
  );
}
