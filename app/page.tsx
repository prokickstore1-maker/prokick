import Link from "next/link";
import Image from "next/image";
import { getAllJerseys, getActiveBanners } from "@/lib/data";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ChevronRight, ShieldCheck, QrCode, Truck } from "lucide-react";

export default async function HomePage() {
  const [allJerseys, banners] = await Promise.all([
    getAllJerseys(),
    getActiveBanners(),
  ]);
  const trending = allJerseys.filter((j) => j.isBestSeller).slice(0, 8);
  const newArrivals = allJerseys.filter((j) => j.isNew).slice(0, 8);

  const leaguePills = [
    { name: "All Kits", href: "/jersey" },
    { name: "Premier League", href: "/jersey?league=Premier+League" },
    { name: "La Liga", href: "/jersey?league=La+Liga" },
    { name: "Harimau Malaya", href: "/jersey?league=World+Cup", highlight: true },
    { name: "Retro Vault", href: "/jersey?league=Retro+Classic" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-24">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12 pt-3 sm:pt-6 space-y-12 sm:space-y-16">
        {/* 1. Cinematic Hero Carousel */}
        <HeroCarousel banners={banners} />

        {/* 2. Malaysian Store Trust & Benefit Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/8 bg-[#121217] p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E2F952]/10 border border-[#E2F952]/25 flex items-center justify-center text-[#E2F952] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white font-display">
                Free Nationwide Delivery
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Automatically waived on 2+ shirts (Pos Laju &amp; J&amp;T)
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-[#121217] p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white font-display">
                DuitNow QR &amp; eWallet
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Scan &amp; pay via Maybank MAE, CIMB OCTO &amp; TnG eWallet
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-[#121217] p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white font-display">
                Official &amp; Retro Kits
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Official club player issues &amp; vintage retro jerseys
              </p>
            </div>
          </div>
        </section>

        {/* 3. Quick Filter Selector Pills */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {leaguePills.map((comp, idx) => (
              <Link
                key={comp.name}
                href={comp.href}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  idx === 0
                    ? "bg-white text-black font-extrabold shadow-md hover:bg-zinc-200"
                    : comp.highlight
                    ? "bg-harimau/15 text-harimau border border-harimau/30 hover:bg-harimau/25"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/8"
                }`}
              >
                {comp.name}
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Best sellers 2026/27 */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
                Matchday 2026/27
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
                Best Sellers
              </h2>
            </div>
            <Link
              href="/jersey"
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {trending.map((jersey) => (
              <JerseyCard key={jersey.id} jersey={jersey} />
            ))}
          </div>
        </section>

        {/* 5. Dual Curated Bento Spotlight */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              This Season
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
              Featured Editions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Harimau Malaya 2026 */}
            <div className="relative overflow-hidden rounded-xl border border-harimau/30 bg-[#181820] aspect-[4/5] sm:aspect-[16/10] flex flex-col justify-end p-6 sm:p-10 group shadow-xl">
              <Image
                src="/images/hero/malaysia-hero-2026.jpg"
                alt="Harimau Malaya 2026 Official Jersey"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.78]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent" />
              
              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-harimau border border-harimau/40">
                  National Team Edition
                </span>
                <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight font-display text-white">
                  Harimau Malaya 2026
                </h3>
                <p className="text-xs text-zinc-300 max-w-sm line-clamp-2">
                  Official Malaysian stadium kit with tiger stripes and embroidered national crest.
                </p>
                <div className="pt-1">
                  <Button asChild className="mt-1 h-auto rounded-lg px-7 py-3 text-xs uppercase tracking-wider font-extrabold">
                    <Link href="/jersey?league=World+Cup">View Malaysia Kit</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Card 2: 90s Retro Classics Vault */}
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#181820] aspect-[4/5] sm:aspect-[16/10] flex flex-col justify-end p-6 sm:p-10 group shadow-xl">
              <Image
                src="/images/hero/retro-hero.jpg"
                alt="Classic Retro 1999 Treble Jersey"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent" />
              
              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-zinc-200 border border-white/25">
                  Treble Winners &apos;99
                </span>
                <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight font-display text-white">
                  Classic Retro Vault
                </h3>
                <p className="text-xs text-zinc-300 max-w-sm line-clamp-2">
                  Vintage 1990s football shirts with embroidered sponsor details and ribbed collars.
                </p>
                <div className="pt-1">
                  <Button asChild className="mt-1 h-auto rounded-lg px-7 py-3 text-xs uppercase tracking-wider font-extrabold">
                    <Link href="/jersey?league=Retro+Classic">View Retro Classics</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Smart Bundle Promo Bento Tile */}
        <section className="rounded-xl border border-white/10 bg-gradient-to-r from-[#121217] via-[#181820] to-[#121217] p-6 sm:p-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-white/10 text-white border border-white/15">
              Bundle Discount
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display text-white">
              Buy More, Save More
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Discount applies automatically at checkout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
              <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-1">
                <span className="text-[10px] font-bold text-[#E2F952] uppercase">Tier 1 • 2+ Kits</span>
                <h4 className="text-xs font-bold text-white uppercase">Free Delivery</h4>
                <p className="text-[11px] text-zinc-400">Save RM 8 – RM 15 shipping fee nationwide.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-1">
                <span className="text-[10px] font-bold text-[#E2F952] uppercase">Tier 2 • 3+ Kits</span>
                <h4 className="text-xs font-bold text-white uppercase">Free Official Patch</h4>
                <p className="text-[11px] text-zinc-400">UCL Starball or EPL gold badge included (RM 10 off).</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-1">
                <span className="text-[10px] font-bold text-[#E2F952] uppercase">Tier 3 • 5+ Kits</span>
                <h4 className="text-xs font-bold text-white uppercase">Free Nameset</h4>
                <p className="text-[11px] text-zinc-400">Custom player name &amp; number included (RM 20 off).</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. New Arrivals Grid */}
        {newArrivals.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Fresh Drops
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
                  New Arrivals
                </h2>
              </div>
              <Link
                href="/jersey"
                className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {newArrivals.map((jersey) => (
                <JerseyCard key={jersey.id} jersey={jersey} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
