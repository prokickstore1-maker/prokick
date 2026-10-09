"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { LeagueOption } from "@/lib/leagues";

export function Navbar({ leagues }: { leagues: LeagueOption[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    router.push(value ? `/jersey?search=${encodeURIComponent(value)}` : "/jersey");
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090B]/90 backdrop-blur-md border-b border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
      {/* 1. High-Impact Matchday Ticker */}
      <div className="bg-[#181820] border-b border-white/6 py-1.5 px-4 text-center">
        <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 tracking-wider uppercase flex items-center justify-center gap-2">
          <span>Free Nationwide Delivery on 2+ Kits</span>
          <span className="text-zinc-500 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-zinc-300">DuitNow QR Pay</span>
          <span className="text-zinc-500 hidden md:inline">•</span>
          <span className="hidden md:inline text-zinc-400">Pos Laju &amp; J&amp;T Express</span>
        </p>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo/prokick-wordmark.png"
            alt="PROKICK MY"
            width={2113}
            height={658}
            priority
            className="h-7 sm:h-8 w-auto group-hover:opacity-85 transition-opacity"
          />
        </Link>

        {/* Desktop Navigation Links — liga diturunkan dari data produk */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <Link href="/jersey" className="hover:text-white transition-colors">
            All Kits
          </Link>
          {leagues.filter((l) => l.value).map((l) => (
            <Link
              key={l.value}
              href={`/jersey?league=${encodeURIComponent(l.value)}`}
              className={
                l.isHarimau
                  ? "hover:text-harimau transition-colors flex items-center gap-1.5"
                  : "hover:text-white transition-colors"
              }
            >
              <span>{l.label}</span>
              {l.isHarimau && <span className="w-1.5 h-1.5 rounded-full bg-harimau"></span>}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Pill */}
          <form
            onSubmit={submitSearch}
            className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 focus-within:border-white/30 px-3.5 py-1.5 rounded-lg text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search club, player, kit..."
              aria-label="Search kits"
              className="bg-transparent border-none outline-none focus-visible:ring-1 focus-visible:ring-white/40 text-xs text-white placeholder:text-zinc-400 w-28 md:w-36"
            />
            {/* implicit submission kadang gagal tanpa tombol submit di form — ini juga tombol screen-reader */}
            <button type="submit" className="sr-only">Search</button>
          </form>

          {/* Currency indicator (desktop) */}
          <span className="hidden sm:inline-block text-[11px] font-bold text-zinc-400 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8">
            MYR
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
              <nav className="flex flex-col gap-3 text-sm font-bold text-zinc-300 overflow-y-auto">
                <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 px-3.5 py-2.5 mb-2">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search club, player, kit..."
                    aria-label="Search kits"
                    className="min-w-0 flex-1 text-xs text-white placeholder:text-zinc-400 bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                  />
                  <button type="submit" className="sr-only">Search</button>
                </form>
                <Link
                  href="/jersey"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-11 border-b border-white/5 text-white hover:text-volt flex items-center justify-between"
                >
                  <span>All Football Kits</span>
                  <span className="text-[11px] text-zinc-400 font-bold">2026/27</span>
                </Link>
                {leagues.filter((l) => l.value).map((l) => (
                  <Link
                    key={l.value}
                    href={`/jersey?league=${encodeURIComponent(l.value)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-11 flex items-center border-b border-white/5 justify-between ${
                      l.isHarimau ? "text-harimau" : "hover:text-white"
                    }`}
                  >
                    <span>{l.label}</span>
                    {l.isHarimau && (
                      <span className="text-[10px] font-bold bg-harimau/20 text-harimau px-2 py-0.5 rounded-lg border border-harimau/30">Official</span>
                    )}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
