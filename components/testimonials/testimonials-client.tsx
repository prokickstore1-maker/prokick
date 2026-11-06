"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Star, ZoomIn, CheckCircle2 } from "lucide-react";
import type { TestimonialView } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TestimonialsClient({ items }: { items: TestimonialView[] }) {
  const [activeProof, setActiveProof] = useState<TestimonialView | null>(null);

  return (
    <>
      {/* Mobile: horizontal swipe carousel (82vw per card, sebelahnya mengintip) · Desktop: grid 4 kolom */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:gap-5">
        {items.map((t) => (
          <article
            key={t.id}
            className="snap-start shrink-0 w-[82vw] max-w-[300px] sm:w-auto sm:max-w-none rounded-xl border border-white/10 bg-[#121217] hover:border-white/20 p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-colors"
          >
            <div className="space-y-3">
              {/* Header Pembeli & Rating */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-[#181820] border border-white/10 flex items-center justify-center text-[#E2F952] font-display font-black text-xs uppercase">
                    {t.name.trim().slice(0, 2) || <MessageCircle className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">{t.name}</p>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-label="Pembeli Terverifikasi" />
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {t.club ? `Suporter ${t.club}` : "Verified Buyer via WhatsApp"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 inline-flex items-center gap-1 rounded-md bg-[#E2F952]/10 border border-[#E2F952]/25 px-2 py-0.5">
                  <Star className="w-3 h-3 fill-[#E2F952] text-[#E2F952]" />
                  <span className="font-mono text-[11px] font-bold text-[#E2F952]">{t.rating}.0</span>
                </div>
              </div>

              {/* Kutipan Chat */}
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                &ldquo;{t.comment}&rdquo;
              </p>
            </div>

            {/* Baris Lampiran Bukti Screenshot WA (Hanya muat thumbnail 40px ~4KB, klik untuk buka penuh) */}
            {t.proofImage && (
              <button
                type="button"
                onClick={() => setActiveProof(t)}
                className="mt-1 w-full flex items-center justify-between gap-2.5 rounded-lg border border-white/10 bg-[#181820] hover:bg-[#22222B] hover:border-[#E2F952]/40 p-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/15 bg-black">
                    <Image
                      src={t.proofImage}
                      alt={`Bukti chat ${t.name}`}
                      fill
                      loading="lazy"
                      sizes="40px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold text-white group-hover:text-[#E2F952] transition-colors truncate">
                      Bukti Chat WhatsApp
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      Ketuk untuk perbesar
                    </span>
                  </div>
                </div>
                <div className="h-7 w-7 shrink-0 rounded-md bg-white/5 flex items-center justify-center text-zinc-300 group-hover:text-white">
                  <ZoomIn className="w-3.5 h-3.5" />
                </div>
              </button>
            )}
          </article>
        ))}
      </div>

      {/* Modal Lightbox — Gambar penuh baru diunduh saat pembeli mengklik tombol di atas */}
      <Dialog open={Boolean(activeProof)} onOpenChange={(open) => !open && setActiveProof(null)}>
        <DialogContent className="max-w-md rounded-2xl border-white/15 bg-[#121217] p-4 sm:p-5 text-white">
          <DialogHeader className="border-b border-white/10 pb-3">
            <DialogTitle className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center justify-between">
              <span>Testimoni {activeProof?.name}</span>
              {activeProof?.club && (
                <span className="text-[10px] font-semibold text-[#E2F952] bg-[#E2F952]/10 border border-[#E2F952]/25 px-2 py-0.5 rounded-md">
                  {activeProof.club}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {activeProof?.proofImage && (
            <div className="relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden rounded-xl border border-white/10 bg-[#09090B]">
              <Image
                src={activeProof.proofImage}
                alt={`Screenshot WhatsApp dari ${activeProof.name}`}
                fill
                sizes="(max-width: 640px) 90vw, 420px"
                className="object-contain"
              />
            </div>
          )}

          {activeProof?.comment && (
            <p className="text-xs text-zinc-300 leading-relaxed bg-[#181820] p-3 rounded-lg border border-white/8">
              &ldquo;{activeProof.comment}&rdquo;
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

