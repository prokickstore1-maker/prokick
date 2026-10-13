"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ExternalLink, Search } from "lucide-react";
import { NormalizedJersey } from "@/lib/data";
import { formatIDR } from "@/lib/utils";
import { updateJerseyStockAction } from "@/app/actions/jersey";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface JerseyStockTableProps {
  initialJerseys: NormalizedJersey[];
}

export function JerseyStockTable({ initialJerseys }: JerseyStockTableProps) {
  const [jerseysList, setJerseysList] = useState<NormalizedJersey[]>(initialJerseys);
  const [search, setSearch] = useState("");
  const [loadingSize, setLoadingSize] = useState<string | null>(null);

  const filtered = jerseysList.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.team.toLowerCase().includes(search.toLowerCase()) ||
      j.league.toLowerCase().includes(search.toLowerCase())
  );

  const handleStockAdjust = async (jerseyId: string, size: string, delta: number) => {
    if (delta === 0) return;
    const key = `${jerseyId}-${size}`;
    setLoadingSize(key);

    // Optimistic UI update
    setJerseysList((prev) =>
      prev.map((j) => {
        if (j.id === jerseyId) {
          const currentVal = j.stockData[size] ?? 0;
          const nextVal = Math.max(0, currentVal + delta);
          const newStockData = { ...j.stockData, [size]: nextVal };
          const newStock = Object.values(newStockData).reduce((a, b) => a + b, 0);
          return { ...j, stockData: newStockData, stock: newStock };
        }
        return j;
      })
    );

    await updateJerseyStockAction(jerseyId, size, delta);
    setLoadingSize(null);
  };

  return (
    <div className="space-y-4 text-[#FAFAFA]">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Input
            type="text"
            placeholder="Cari jersey, klub, atau kompetisi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-10 text-xs font-medium bg-[#181820] border-[#27272A] text-white placeholder:text-zinc-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs font-mono text-zinc-400 font-semibold self-end sm:self-center">
          {filtered.length} Kits Listed
        </span>
      </div>

      {/* Mobile: kartu stok — kontrol ukuran per ukuran tak tergeser keluar layar */}
      <div className="grid gap-3 sm:hidden">
        {filtered.map((j) => (
          <div key={j.id} className="rounded-xl border border-[#27272A] bg-[#121217] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black/40 relative overflow-hidden shrink-0 border border-[#27272A]">
                <Image
                  src={j.image || "/images/jerseys/madrid-home.jpg"}
                  alt={j.name}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-white truncate">{j.name}</h3>
                <p className="text-xs text-zinc-400 truncate">{j.league} · <span className="font-mono font-bold text-[#E2F952]">{j.stock}</span> pcs</p>
              </div>
              <Link
                href={`/product/${j.id}`}
                target="_blank"
                className="shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-[#27272A] bg-[#181820] text-zinc-300 active:bg-[#27272A]"
                title="Buka di toko"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            {/* Grid ukuran: tap-target ramah jempol */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272A]">
              {j.sizes.map((size) => {
                const stockVal = j.stockData[size] ?? 0;
                const key = `${j.id}-${size}`;
                const isLoading = loadingSize === key;
                return (
                  <div key={size} className="flex items-center justify-between bg-[#181820] border border-[#27272A] rounded-lg px-2.5 py-1.5 gap-1">
                    <span className="font-mono text-xs font-bold text-zinc-300">{size}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStockAdjust(j.id, size, -1)}
                        disabled={isLoading || stockVal <= 0}
                        className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                        title={`Kurangi stok ${size}`}
                        aria-label={`Kurangi stok ${size} untuk ${j.name}`}
                      >−</button>
                      <span className={`font-mono text-xs w-6 text-center font-bold ${stockVal > 0 ? "text-white" : "text-red-400"}`}>{stockVal}</span>
                      <button
                        onClick={() => handleStockAdjust(j.id, size, 1)}
                        disabled={isLoading}
                        className="w-8 h-8 rounded bg-[#E2F952] text-black hover:bg-[#d4eb3d] flex items-center justify-center font-bold disabled:opacity-50 cursor-pointer"
                        title={`Tambah stok ${size}`}
                        aria-label={`Tambah stok ${size} untuk ${j.name}`}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="rounded-xl border border-[#27272A] bg-[#121217] p-4 text-center text-sm text-zinc-400">Tidak ada jersey.</p>}
      </div>

      {/* Desktop: tabel */}
      <div className="hidden sm:block rounded-2xl bg-[#121217] border border-[#27272A] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="text-xs text-zinc-400">
            <TableHeader className="bg-[#181820] text-zinc-300 uppercase tracking-wider text-[10px] font-bold border-b border-[#27272A]">
              <TableRow className="hover:bg-transparent border-[#27272A]">
                <TableHead className="p-4">Jersey Edition</TableHead>
                <TableHead className="p-4">Competition</TableHead>
                <TableHead className="p-4">Price (IDR)</TableHead>
                <TableHead className="p-4">Per-Size Stock Control</TableHead>
                <TableHead className="p-4 text-center">Total Stock</TableHead>
                <TableHead className="p-4 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium text-zinc-200">
              {filtered.map((j) => (
                <TableRow key={j.id} className="hover:bg-[#181820] transition-colors border-[#27272A]">
                  {/* Jersey Info */}
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black/40 relative overflow-hidden shrink-0 border border-[#27272A]">
                        <Image
                          src={j.image || "/images/jerseys/madrid-home.jpg"}
                          alt={j.name}
                          fill
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{j.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {j.type} • Season {j.season}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* League */}
                  <TableCell className="p-4">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#181820] text-zinc-200 border border-[#27272A] inline-block">
                      {j.league}
                    </span>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="p-4 font-mono font-black text-white text-sm">
                    {formatIDR(j.price)}
                  </TableCell>

                  {/* Quick Adjust Buttons */}
                  <TableCell className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {j.sizes.map((size) => {
                        const stockVal = j.stockData[size] ?? 0;
                        const key = `${j.id}-${size}`;
                        const isLoading = loadingSize === key;

                        return (
                          <div
                            key={size}
                            className="flex items-center bg-[#181820] border border-[#27272A] rounded-lg px-2 py-1 gap-1.5"
                          >
                            <span className="font-mono text-[10px] text-zinc-400 font-bold">
                              {size}:
                            </span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Stok ${size} untuk ${j.name}`}
                              defaultValue={stockVal}
                              key={`${key}-${stockVal}`}
                              disabled={isLoading}
                              onBlur={(e) => {
                                const parsed = Number(e.target.value);
                                if (!Number.isInteger(parsed) || parsed < 0 || parsed === stockVal) {
                                  e.target.value = String(stockVal);
                                  return;
                                }
                                handleStockAdjust(j.id, size, parsed - stockVal);
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                              className={`w-10 rounded border-none bg-transparent text-center font-mono text-xs font-bold focus:bg-[#27272A] focus:ring-1 focus:ring-[#E2F952] ${
                                stockVal > 0 ? "text-white" : "text-red-400"
                              }`}
                            />
                            <div className="flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => handleStockAdjust(j.id, size, -1)}
                                disabled={isLoading || stockVal <= 0}
                                className="p-0.5 hover:bg-white/10 rounded text-white disabled:opacity-30 cursor-pointer"
                                title={`Subtract 1 ${size}`}
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleStockAdjust(j.id, size, 1)}
                                disabled={isLoading}
                                className="p-0.5 hover:bg-white/10 rounded text-[#E2F952] disabled:opacity-30 cursor-pointer"
                                title={`Add 1 ${size}`}
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>

                  {/* Total Stock Badge */}
                  <TableCell className="p-4 text-center">
                    <span
                      className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs border ${
                        j.stock > 10
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                          : j.stock > 0
                          ? "bg-amber-950/60 text-amber-300 border-amber-800"
                          : "bg-red-950/60 text-red-300 border-red-900"
                      }`}
                    >
                      {j.stock} units
                    </span>
                  </TableCell>

                  {/* Link Preview */}
                  <TableCell className="p-4 text-right">
                    <Link
                      href={`/product/${j.id}`}
                      target="_blank"
                      className="p-2 rounded-lg bg-[#181820] hover:bg-[#E2F952] hover:text-black text-zinc-300 border border-[#27272A] transition-colors inline-block"
                      title="View on Storefront"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
