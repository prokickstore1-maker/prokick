import Link from "next/link";
import Image from "next/image";
import { getBestSellers, getNewArrivals, getRetroJerseys, getActiveBanners, getNationalCountries, getShippingSettingsMap, getCachedLeagueOptions } from "@/lib/data";
import { toShippingSettings } from "@/lib/promo";
import { formatIDR } from "@/lib/utils";
import { buildLeagueOptions } from "@/lib/leagues";
import { flagUrl } from "@/lib/countries";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ChevronRight, ShieldCheck, QrCode, Truck, Search, Award, Sparkles } from "lucide-react";
import { TOP_CLUBS } from "@/lib/clubs";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trending, newArrivals, retroJerseys, banners, rawSettings, nationalCountries, leagueOptions] = await Promise.all([
    getBestSellers(8),
    getNewArrivals(8),
    getRetroJerseys(8),
    getActiveBanners(),
    getShippingSettingsMap(),
    getNationalCountries(),
    getCachedLeagueOptions(),
  ]);
  const ship = toShippingSettings(rawSettings);

  // Featured = 2 banner pertama; hero carousel pakai sisanya (task H-5)
  const featuredBanners = banners.slice(0, 2);

  // League pills (navbar-style)
  const leaguePills = leagueOptions.map((l) => ({
    name: l.label,
    href: l.value ? `/jersey?league=${encodeURIComponent(l.value)}` : "/jersey",
  }));

  // National Teams: hanya jersey tim nasional (category "Tim Nasional") —
  // country di produk klub = asal klub (Arsenal→England), bukan identitas tim nasional

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-24">
      <h1 className="sr-only">ProKick Store Indonesia | Jersey Bola Original, Retro &amp; Player Issue</h1>
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12 pt-3 sm:pt-6 space-y-12 sm:space-y-16">
        {/* 1. Cinematic Hero Carousel */}
        {banners.length > 2 && <HeroCarousel banners={banners.slice(2)} />}

        {/* 2. Direct Search & Discovery Bar */}
        <section className="rounded-2xl border border-white/10 bg-[#121217] p-4 sm:p-5 shadow-xl">
          <form method="GET" action="/jersey" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="search"
                aria-label="Cari jersey"
                placeholder="Cari jersey klub, tim nasional, pemain, atau edisi (contoh: Real Madrid, Arsenal, Retro)..."
                className="w-full bg-[#181820] border border-white/10 focus:border-[#E2F952]/60 rounded-xl pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-400 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl bg-[#E2F952] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#d4eb3e] transition cursor-pointer shadow-md shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Cari Jersey</span>
            </button>
          </form>

          {/* Quick search chips */}
          <div className="mt-3 pt-3 border-t border-white/6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
              Populer:
            </span>
            {[
              { label: "Real Madrid 26/27", q: "Real Madrid" },
              { label: "Arsenal", q: "Arsenal" },
              { label: "Barcelona", q: "Barcelona" },
              { label: "Man United", q: "Manchester United" },
              { label: "Tim Nasional", href: "/jersey?category=Tim+Nasional" },
              { label: "Retro Vintage", href: "/jersey?edition=Vintage" },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href || `/jersey?search=${encodeURIComponent(chip.q!)}`}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/6 transition-colors"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Store Trust & Benefit Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/8 bg-[#121217] p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E2F952]/10 border border-[#E2F952]/25 flex items-center justify-center text-[#E2F952] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white font-display">
                Gratis Ongkir Se-Indonesia
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Otomatis gratis min. {ship.freeShippingMinItems} kaos (J&amp;T Express)
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-[#121217] p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white font-display">
                QRIS &amp; e-Wallet
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Scan via GoPay, OVO, DANA, ShopeePay, atau m-banking
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-[#121217] p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white font-display">
                Jersey Klub &amp; Retro Klasik
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Koleksi jersey player issue dan edisi retro legendaris
              </p>
            </div>
          </div>
        </section>

        {/* 4. National Teams — hanya jersey tim nasional (category "Tim Nasional") */}
        {nationalCountries.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Pilihan Negara</span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">National Teams</h2>
              </div>
            </div>
            {/* row geser: tile lebar tetap (kompak), sisa negara bisa di-swipe */}
            <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2.5 snap-x snap-mandatory">
              {nationalCountries.map((country) => {
                const src = flagUrl(country, 80);
                return (
                  <Link
                    key={country}
                    href={`/jersey?category=${encodeURIComponent("Tim Nasional")}&country=${encodeURIComponent(country)}`}
                    className="group snap-start w-20 sm:w-24 shrink-0 flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-[#121217] px-2 py-2.5 hover:border-white/25 hover:bg-[#181820] transition-colors"
                  >
                    <div className="h-9 w-full flex items-center justify-center overflow-hidden">
                      {src ? (
                        <Image src={src} alt={`${country} flag`} width={48} height={32} className="max-h-7 w-auto object-contain" />
                      ) : (
                        <span className="text-xs font-black text-zinc-300">{country.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="w-full truncate text-center text-[10px] font-bold text-zinc-300 group-hover:text-white">{country}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Top Clubs — Shop by Club */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Pilihan Klub
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
                Top Clubs
              </h2>
            </div>
            <Link
              href="/jersey?category=Klub"
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider transition-colors"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2.5 snap-x snap-mandatory">
            {TOP_CLUBS.map((club) => (
              <Link
                key={club.team}
                href={`/jersey?league=${encodeURIComponent(club.league)}&team=${encodeURIComponent(club.team)}`}
                className="group snap-start w-20 sm:w-24 shrink-0 flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-[#121217] px-2 py-2.5 hover:border-white/25 hover:bg-[#181820] transition-colors"
              >
                <div className="h-9 w-full flex items-center justify-center overflow-hidden">
                  <Image
                    src={club.logo}
                    alt={`${club.name} logo`}
                    width={36}
                    height={36}
                    className="max-h-8 w-auto object-contain group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] font-bold text-zinc-300 group-hover:text-white">
                  {club.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. Best sellers 2026/27 */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
                Koleksi 2026/27
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
                Best Sellers
              </h2>
            </div>
            <Link
              href="/jersey"
              className="min-h-11 flex items-center gap-1.5 -my-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {leaguePills.map((comp, idx) => (
              <Link
                key={comp.name}
                href={comp.href}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  idx === 0
                    ? "bg-white text-black font-extrabold shadow-md hover:bg-zinc-200"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/8"
                }`}
              >
                {comp.name}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {trending.map((jersey, idx) => (
              <JerseyCard key={jersey.id} jersey={jersey} priority={idx < 2} />
            ))}
          </div>
        </section>

        {/* 5. Dual Curated Bento Spotlight */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Pilihan Musim Ini
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
              Featured Editions
            </h2>
          </div>

          {featuredBanners.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredBanners.map((banner) => (
                <Link
                  key={banner.id}
                  href={banner.link || "/jersey"}
                  className="group relative overflow-hidden rounded-xl border border-white/15 bg-[#181820] aspect-[4/5] sm:aspect-[16/10] flex flex-col justify-end"
                >
                  <Image
                    src={banner.image}
                    alt={banner.title || "Featured edition"}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.78]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent" />
                  <div className="relative z-10 space-y-3 p-6">
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-white">
                      {banner.badge || "Featured"}
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight font-display text-white">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-zinc-300 max-w-sm line-clamp-2">{banner.subtitle}</p>
                    )}
                    <span className="inline-flex mt-1 h-auto rounded-lg px-7 py-3 text-xs uppercase tracking-wider font-extrabold bg-white text-black">
                      {banner.cta || "Lihat Koleksi"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 6. Retro & Vintage Classics Showcase */}
        {retroJerseys.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
                  Edisi Klasik &amp; Bersejarah
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
                  Retro &amp; Iconic Kits
                </h2>
              </div>
              <Link
                href="/jersey?edition=Vintage"
                className="min-h-11 flex items-center gap-1.5 -my-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors"
              >
                <span>Lihat Semua Retro</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {retroJerseys.map((jersey) => (
                <JerseyCard key={jersey.id} jersey={jersey} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Smart Bundle Promo Bento Tile */}
        <section className="rounded-xl border border-white/10 bg-gradient-to-r from-[#121217] via-[#181820] to-[#121217] p-6 sm:p-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-white/10 text-white border border-white/15">
              Promo Bundle
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display text-white">
              Beli Lebih Banyak, Makin Hemat
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Semua promo bersifat <strong className="text-white font-bold">akumulatif</strong> &amp; otomatis terpasang langsung saat checkout tanpa perlu voucher.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
              <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#E2F952] uppercase">Tier 1 • Min. {ship.freeShippingMinItems} Kaos</span>
                    <div className="w-7 h-7 rounded-lg bg-[#E2F952]/10 border border-[#E2F952]/20 flex items-center justify-center text-[#E2F952]">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase">Gratis Ongkir</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Hemat {formatIDR(ship.javaRate)}–{formatIDR(ship.outsideJavaRate)} ongkir via J&amp;T ke seluruh Indonesia.</p>
                </div>
                <div className="pt-2 border-t border-white/6">
                  <span className="text-[10px] font-bold text-zinc-400">Tier Pembuka</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#E2F952] uppercase">Tier 2 • Min. {ship.freePatchMinItems} Kaos</span>
                    <div className="w-7 h-7 rounded-lg bg-[#E2F952]/10 border border-[#E2F952]/20 flex items-center justify-center text-[#E2F952]">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase">Gratis Patch Resmi</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Badge UCL Starball atau EPL gold termasuk (hemat {formatIDR(ship.patchFee)}).</p>
                </div>
                <div className="pt-2 border-t border-white/6">
                  <span className="inline-flex items-center text-[10px] font-extrabold text-[#E2F952]">
                    + Tetap Gratis Ongkir
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#E2F952] uppercase">Tier 3 • Min. {ship.freeNamesetMinItems} Kaos</span>
                    <div className="w-7 h-7 rounded-lg bg-[#E2F952]/10 border border-[#E2F952]/20 flex items-center justify-center text-[#E2F952]">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase">Gratis Nameset Custom</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Custom nama &amp; nomor pemain termasuk (hemat {formatIDR(ship.namesetFee)}).</p>
                </div>
                <div className="pt-2 border-t border-white/6">
                  <span className="inline-flex items-center text-[10px] font-extrabold text-[#E2F952]">
                    + Gratis Ongkir &amp; Patch
                  </span>
                </div>
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
                  Rilis Terbaru
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display text-white">
                  New Arrivals
                </h2>
              </div>
              <Link
                href="/jersey"
                className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider transition-colors"
              >
                <span>Lihat Semua</span>
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
