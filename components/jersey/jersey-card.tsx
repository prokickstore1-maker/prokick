"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { formatMYR } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { NormalizedJersey } from "@/lib/data";

interface JerseyCardProps {
  jersey: NormalizedJersey;
}

export function JerseyCard({ jersey }: JerseyCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultSize = jersey.sizes[0] || "M";
    addItem({
      jerseyId: jersey.id,
      name: jersey.name,
      team: jersey.team,
      league: jersey.league,
      price: parseFloat(jersey.price),
      image: jersey.image || "/images/jerseys/madrid-home.jpg",
      size: defaultSize,
      quantity: 1,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const imageSrc = jersey.image || "/images/jerseys/madrid-home.jpg";

  // Derive contextual badge
  const isHarimau = jersey.team.toLowerCase().includes("malaysia") || jersey.league.toLowerCase().includes("world cup");
  const isRetro = jersey.edition?.toLowerCase() === "vintage" || jersey.league.toLowerCase().includes("retro");
  const isPlayerIssue = jersey.type?.toLowerCase().includes("player");

  return (
    <div className="group flex flex-col justify-between h-full bg-[#121217] hover:bg-[#181820] border border-white/8 hover:border-white/20 rounded-xl overflow-hidden transition-all duration-300 select-none shadow-sm hover:shadow-md">
      <Link href={`/product/${jersey.id}`} className="block relative">
        {/* Studio Jersey Stage with Radial Ambiance */}
        <div className="studio-stage relative aspect-[3/4] w-full p-2 sm:p-6">
          <Image
            src={imageSrc}
            alt={jersey.name}
            fill
            className="object-contain p-0.5 sm:p-4 group-hover:scale-108 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Top-Left Authentic Tag */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {isHarimau ? (
              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-black/80 text-harimau border border-harimau/40">
                Harimau Malaya
              </span>
            ) : isRetro ? (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-black/80 text-zinc-100 border border-white/25">
                Retro &apos;99
              </span>
            ) : isPlayerIssue ? (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-black/80 text-zinc-100 border border-white/25">
                Player Issue
              </span>
            ) : jersey.isBestSeller ? (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-black/80 text-zinc-100 border border-white/25">
                Best Seller
              </span>
            ) : null}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            className={`absolute bottom-3 right-3 min-w-11 min-h-11 p-2 sm:px-3 sm:py-1.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer z-10 ${
              justAdded
                ? "bg-volt text-black"
                : "bg-white text-black hover:bg-zinc-200 active:scale-95 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            }`}
            title="Quick add to bag"
            aria-label="Quick add to bag"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-bold">Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-bold">Add</span>
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Card Info Area */}
      <div className="p-3.5 sm:p-4 space-y-1.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            <span className="truncate">{jersey.league}</span>
            <span className="hidden sm:inline shrink-0">{jersey.season}</span>
          </div>

          <Link href={`/product/${jersey.id}`} className="block py-1.5 -my-1.5">
            <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-white transition-colors line-clamp-1 font-display">
              {jersey.name}
            </h3>
          </Link>
        </div>

        {/* Available Sizes & Price */}
        <div className="pt-2 border-t border-white/6">
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono mb-1.5">
            {jersey.sizes.slice(0, 4).map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                {s}
              </span>
            ))}
            {jersey.sizes.length > 4 && <span className="text-zinc-400">+{jersey.sizes.length - 4}</span>}
          </div>

          <div className="font-mono font-black text-sm text-white">
            {formatMYR(jersey.price)}
          </div>
        </div>
      </div>
    </div>
  );
}
