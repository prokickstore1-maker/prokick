"use client";

import { Ruler } from "lucide-react";
import { JACKET_SIZES } from "@/lib/product-lines";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const JERSEY_SIZES = [
  { label: "S", length: 67, width: 47 },
  { label: "M", length: 69, width: 49 },
  { label: "L", length: 72, width: 52 },
  { label: "XL", length: 74, width: 54 },
  { label: "XXL", length: 78, width: 57 },
  { label: "3XL", length: 80, width: 60 },
  { label: "4XL", length: 82, width: 63 },
];

export function SizeGuideModal({ isJacket = false }: { isJacket?: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-volt transition-colors min-h-11 cursor-pointer">
          <Ruler className="w-3.5 h-3.5" />
          Panduan Ukuran
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] bg-[#121217] border-white/10 text-white overflow-y-auto">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-white text-xl font-bold uppercase tracking-wider">
            {isJacket ? "Panduan Ukuran — Jaket, Tracksuit & Windbreaker" : "Panduan Ukuran — Jersey"}
          </SheetTitle>
        </SheetHeader>

        <div className="w-full overflow-x-auto">
          {isJacket ? (
            <table className="w-full text-sm text-left border-collapse border border-white/10">
              <thead className="bg-[#1a1a1a] text-white font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                <tr>
                  <th className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-center">Size</th>
                  <th className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-center">Length</th>
                  <th className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-center">Bust</th>
                  <th className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-center">Height</th>
                  <th className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-center">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-[10px] sm:text-xs font-mono">
                {JACKET_SIZES.map((row) => (
                  <tr key={row.label} className="hover:bg-white/5 transition-colors">
                    <td className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 font-bold text-white bg-[#050505] text-center">
                      {row.label}
                    </td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-zinc-300 text-center">{row.length}</td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-zinc-300 text-center">{row.bust}</td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-zinc-300 text-center">{row.height}</td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-3 border border-white/10 text-zinc-300 text-center">{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left border-collapse border border-white/10">
              <thead className="bg-[#1a1a1a] text-white font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 border border-white/10 text-center">Ukuran</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 border border-white/10 text-center">Panjang (cm)</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 border border-white/10 text-center">Lebar (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-[10px] sm:text-xs">
                {JERSEY_SIZES.map((size) => (
                  <tr key={size.label} className="hover:bg-white/5 transition-colors">
                    <td className="px-2 py-2 sm:px-4 sm:py-3 border border-white/10 font-bold text-white bg-[#050505] text-center">
                      {size.label}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 border border-white/10 text-zinc-400 text-center">{size.length}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 border border-white/10 text-zinc-400 text-center">{size.width}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="text-xs text-zinc-500 mt-6 text-center italic">
            * Toleransi ukuran ±1-2 cm dari size chart
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
