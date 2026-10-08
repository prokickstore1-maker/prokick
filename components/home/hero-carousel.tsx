"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MockBanner } from "@/lib/mock-data";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroCarouselProps {
  banners: MockBanner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    // WCAG 2.2.2: hormati "reduce motion" OS, jangan ganti konten otomatis
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(nextSlide, 6500);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  if (!banners.length) return null;

  const banner = banners[currentIndex];
  const link = banner.link.startsWith("/") && !banner.link.startsWith("//") && !banner.link.includes("\\")
    ? banner.link
    : "/jersey";

  return (
    <section className="relative isolate h-[420px] sm:h-[520px] overflow-hidden rounded-3xl bg-[#09090B] border border-white/10 shadow-2xl group">
      {/* Background Hero Image with Dynamic Vignette */}
      <Image
        key={banner.id}
        src={banner.image}
        alt={banner.title}
        fill
        priority
        sizes="(max-width: 1540px) 100vw, 1540px"
        className="object-cover object-[center_25%] brightness-[0.72] transition-transform duration-1000 ease-out group-hover:scale-105"
      />
      {/* Scrim: lebih pekat di kiri/bawah agar copy terbaca di semua slide (M-04) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090B]/90 via-[#09090B]/35 to-transparent sm:w-2/3" />

      {/* Hero Content */}
      <div className="absolute inset-x-6 bottom-24 sm:inset-x-12 sm:bottom-12 max-w-2xl text-white z-10 space-y-3 sm:space-y-4">
        {banner.badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-white">
            {banner.badge}
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.98] tracking-tight font-display text-white">
          {/* non-breaking space sebelum tahun: cegah orphan "2026" di 390px */}
          {banner.title.replace(/ (20\d{2})/g, " $1")}
        </h1>

        {banner.subtitle && (
          <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-lg leading-relaxed line-clamp-2">
            {banner.subtitle}
          </p>
        )}

        <div className="pt-2 flex items-center gap-4">
          <Button
            asChild
            className="h-auto rounded-full px-7 py-3 gap-2 uppercase tracking-wider font-extrabold text-[13px]"
          >
            <Link href={link} className="group/btn">
              <span>{banner.cta}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="hidden sm:inline-flex h-auto rounded-xl px-7 py-3 uppercase tracking-wider font-bold text-[13px] bg-white/6 text-white border-white/14 hover:bg-white/12 hover:text-white hover:border-white/28"
          >
            <Link href="/jersey">All Kits</Link>
          </Button>
        </div>
      </div>

      {/* Manual Controls & Indicator Pills */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-12 z-20 flex items-center gap-3">
          {/* Prev/Next buttons on desktop */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={prevSlide}
              aria-label="Previous banner"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white transition active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next banner"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white transition active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dots Indicator — visual dot kecil, area sentuh tiap tombol 44×44 */}
          <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-md px-1 py-0.5 rounded-full border border-white/10">
            {banners.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
                className="group/dot min-w-11 min-h-11 flex items-center justify-center cursor-pointer"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/30 group-hover/dot:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
