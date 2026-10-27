"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, ChevronDown } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { LeagueOption } from "@/lib/leagues";

const DEFAULT_TICKER =
  "Gratis Ongkir Se-Indonesia min. 2 Kaos | QRIS & e-Wallet Instan | J&T Express";

export function Navbar({
  leagues,
  shippingSettings,
}: {
  leagues: LeagueOption[];
  shippingSettings?: Record<string, string>;
}) {
  const freeMin = Math.max(1, Number(shippingSettings?.freeShippingMinItems) || 2);
  const banner =
    shippingSettings?.runningBannerText?.trim() ||
    DEFAULT_TICKER.replace("2+", `${freeMin}+`);
  // split | jadi fragmen; mobile hanya fragmen pertama
  const tickerParts = banner.split("|").map((s) => s.trim()).filter(Boolean);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);

  // load persisted cart after hydration so SSR/CSR first paint match
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(value ? `/jersey?search=${encodeURIComponent(value)}` : "/jersey");
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090B]/90 backdrop-blur-md border-b border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
      {/* 1. High-Impact Matchday Ticker — teks dari settings, fallback statis */}
      <div className="bg-[#181820] border-b border-white/6 py-1.5 px-4 text-center">
        <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 tracking-wider uppercase flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
          {tickerParts.map((part, i) => (
            <span key={i} className={i === 0 ? "" : i === 1 ? "hidden sm:inline text-zinc-300" : "hidden md:inline text-zinc-400"}>
              {i > 0 && <span className="text-zinc-500 mr-2">•</span>}
              {part}
            </span>
          ))}
        </p>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo/prokick-wordmark.png"
            alt="PROKICK ID"
            width={2113}
            height={658}
            priority
            className="h-7 sm:h-8 w-auto group-hover:opacity-85 transition-opacity"
          />
        </Link>

        {/* Desktop Navigation Links — liga & klub dropdown dinamis */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <Link href="/jersey" className="hover:text-white transition-colors">
            All Kits
          </Link>
          {leagues.filter((l) => l.value).map((l) => {
            const hasTeams = l.teams && l.teams.length > 0;
            const isWide = l.teams.length > 5;

            return (
              <div key={l.value} className="relative group/nav py-2">
                <Link
                  href={l.isNation ? "/jersey?league=Nation" : `/jersey?league=${encodeURIComponent(l.value)}`}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>{l.label}</span>
                  {hasTeams && (
                    <ChevronDown className="w-3 h-3 text-zinc-500 group-hover/nav:text-zinc-200 group-hover/nav:rotate-180 transition-transform duration-200" />
                  )}
                </Link>

                {hasTeams && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1.5 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 pointer-events-none group-hover/nav:pointer-events-auto z-50">
                    <div
                      className={`bg-[#121217] border border-white/10 rounded-xl p-2.5 shadow-2xl backdrop-blur-xl space-y-1.5 ${
                        isWide ? "min-w-[340px]" : "min-w-[200px]"
                      }`}
                    >
                      <div className="px-2.5 py-1 border-b border-white/6 flex items-center justify-between">
                        <Link
                          href={l.isNation ? "/jersey?league=Nation" : `/jersey?league=${encodeURIComponent(l.value)}`}
                          className="text-[10px] font-extrabold uppercase tracking-widest text-[#E2F952] hover:underline"
                        >
                          All {l.label}
                        </Link>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {l.teams.length} {l.isNation ? "Nations" : "Clubs"}
                        </span>
                      </div>
                      <div
                        className={
                          isWide
                            ? "grid grid-cols-2 gap-0.5 max-h-[320px] overflow-y-auto scrollbar-thin"
                            : "space-y-0.5 max-h-[320px] overflow-y-auto scrollbar-thin"
                        }
                      >
                        {l.teams.map((team) => (
                          <Link
                            key={team.name}
                            href={team.href}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/8 transition-colors group/item"
                          >
                            <span className="truncate">{team.name}</span>
                            <span className="text-[#E2F952] opacity-0 group-hover/item:opacity-100 transition-opacity text-[10px] ml-1 shrink-0">
                              &rarr;
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Cari jersey"
            className="sm:hidden p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Desktop Search Pill */}
          <form
            onSubmit={submitSearch}
            className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 focus-within:border-white/30 pl-3 pr-1.5 py-1.5 rounded-lg text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search club, kit..."
              aria-label="Search kits"
              className="bg-transparent border-none outline-none focus-visible:ring-1 focus-visible:ring-white/40 text-xs text-white placeholder:text-zinc-400 w-28 md:w-36 lg:w-44"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-[#E2F952] hover:text-black text-[11px] font-bold text-zinc-300 transition cursor-pointer"
            >
              Cari
            </button>
          </form>

          {/* Currency indicator (desktop) */}
          <span className="hidden sm:inline-block text-[11px] font-bold text-zinc-400 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8">
            IDR
          </span>

          {/* Shopping Bag Button */}
          <button
            onClick={openCart}
            aria-label="Open Shopping Bag"
            className="flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2 min-w-11 min-h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              {/* key = remount saat count berubah → animate-in mainkan ulang (pop) */}
              {totalItemsCount > 0 && (
                <span
                  key={totalItemsCount}
                  className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-black shadow-sm animate-in zoom-in-0 duration-300"
                >
                  {totalItemsCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-zinc-300">
              Bag
            </span>
          </button>

          {/* Mobile Menu — Sheet (portal, focus-trap, Esc, scroll-lock) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className="lg:hidden p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="top" className="bg-[#121217] border-white/10 px-5 py-5 gap-0">
              <SheetHeader className="px-0 pb-3">
                <SheetTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 text-sm font-bold text-zinc-300 overflow-y-auto max-h-[calc(100vh-120px)]">
                <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 px-3.5 py-2 mb-2">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search club, player, kit..."
                    aria-label="Search kits"
                    className="min-w-0 flex-1 text-xs text-white placeholder:text-zinc-400 bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#E2F952] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#d4eb3e] transition cursor-pointer shrink-0"
                  >
                    Cari
                  </button>
                </form>
                <Link
                  href="/jersey"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-11 border-b border-white/5 text-white hover:text-volt flex items-center justify-between"
                >
                  <span>All Football Kits</span>
                  <span className="text-[11px] text-zinc-400 font-bold">2026/27</span>
                </Link>
                {leagues.filter((l) => l.value).map((l) => {
                  const hasTeams = l.teams && l.teams.length > 0;
                  const isExpanded = expandedLeague === l.value;

                  return (
                    <div key={l.value} className="border-b border-white/5">
                      <div className="flex items-center justify-between min-h-11">
                        <Link
                          href={l.isNation ? "/jersey?league=Nation" : `/jersey?league=${encodeURIComponent(l.value)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-white hover:text-volt flex-1 py-2 font-bold"
                        >
                          <span>{l.label}</span>
                        </Link>
                        {hasTeams && (
                          <button
                            type="button"
                            onClick={() => setExpandedLeague(isExpanded ? null : l.value)}
                            className="p-2 min-w-10 min-h-10 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                            aria-label={`Toggle ${l.label} clubs`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-white" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {hasTeams && isExpanded && (
                        <div className="pl-2 pb-2.5 pt-1 grid grid-cols-2 gap-1 text-xs text-zinc-400">
                          <Link
                            href={l.isNation ? "/jersey?league=Nation" : `/jersey?league=${encodeURIComponent(l.value)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="col-span-2 py-1.5 px-2.5 rounded-lg bg-white/5 text-[#E2F952] font-bold text-[11px] flex items-center justify-between"
                          >
                            <span>All {l.label} Kits</span>
                            <span>&rarr;</span>
                          </Link>
                          {l.teams.map((team) => (
                            <Link
                              key={team.name}
                              href={team.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="py-1.5 px-2.5 rounded-lg bg-white/[0.02] hover:bg-white/8 hover:text-white truncate font-medium"
                            >
                              {team.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#121217] px-4 py-2.5">
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari klub, pemain, jersey..."
                aria-label="Search kits"
                autoFocus
                className="w-full bg-white/5 border border-white/10 focus:border-[#E2F952]/50 pl-9 pr-3 py-2 rounded-lg text-xs text-white placeholder:text-zinc-400 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-[#E2F952] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#d4eb3e] transition cursor-pointer shrink-0"
            >
              Cari
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
