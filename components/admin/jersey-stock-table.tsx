"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ExternalLink, Search } from "lucide-react";
import { NormalizedJersey } from "@/lib/data";
import { formatMYR } from "@/lib/utils";
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
    <div className="space-y-4 text-[#0C0A09]">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Input
            type="text"
            placeholder="Search jersey, club, or competition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-10 text-xs font-medium bg-white border-[#CCCCCC] focus-visible:border-black"
          />
          <Search className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs font-mono text-[#57534E] font-semibold self-end sm:self-center">
          {filtered.length} Kits Listed
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="text-xs text-[#57534E]">
            <TableHeader className="bg-[#FAFAF9] text-black uppercase tracking-wider text-[10px] font-bold border-b border-[#E5E5E5]">
              <TableRow className="hover:bg-transparent border-[#E5E5E5]">
                <TableHead className="p-4">Jersey Edition</TableHead>
                <TableHead className="p-4">Competition</TableHead>
                <TableHead className="p-4">Price (MYR)</TableHead>
                <TableHead className="p-4">Per-Size Stock Control</TableHead>
                <TableHead className="p-4 text-center">Total Stock</TableHead>
                <TableHead className="p-4 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium text-black">
              {filtered.map((j) => (
                <TableRow key={j.id} className="hover:bg-[#F9F9F9] transition-colors border-[#E5E5E5]">
                  {/* Jersey Info */}
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FAFAF9] relative overflow-hidden shrink-0 border border-[#E5E5E5]">
                        <Image
                          src={j.image || "/images/jerseys/madrid-home.jpg"}
                          alt={j.name}
                          fill
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-black block">{j.name}</span>
                        <span className="text-[10px] text-[#57534E] font-mono">
                          {j.type} • Season {j.season}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* League */}
                  <TableCell className="p-4">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#F5F5F5] text-black border border-[#E5E5E5] inline-block">
                      {j.league}
                    </span>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="p-4 font-mono font-black text-black text-sm">
                    {formatMYR(j.price)}
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
                            className="flex items-center bg-[#FAFAF9] border border-[#E5E5E5] rounded-lg px-2 py-1 gap-1.5"
                          >
                            <span className="font-mono text-[10px] text-[#57534E] font-bold">
                              {size}:
                            </span>
                            <span
                              className={`font-mono text-xs font-bold ${
                                stockVal > 0 ? "text-black" : "text-[#DC2626]"
                              }`}
                            >
                              {stockVal}
                            </span>
                            <div className="flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => handleStockAdjust(j.id, size, -1)}
                                disabled={isLoading || stockVal <= 0}
                                className="p-0.5 hover:bg-neutral-200 rounded text-black disabled:opacity-30 cursor-pointer"
                                title={`Subtract 1 ${size}`}
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleStockAdjust(j.id, size, 1)}
                                disabled={isLoading}
                                className="p-0.5 hover:bg-neutral-200 rounded text-black disabled:opacity-30 cursor-pointer"
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
                          ? "bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]"
                          : j.stock > 0
                          ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                          : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
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
                      className="p-2 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-black transition-colors inline-block"
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
