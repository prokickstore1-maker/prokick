"use client";

import { useState } from "react";
import Link from "next/link";
import { NormalizedJersey } from "@/lib/data";
import { deleteProductAction } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProductManager({ initialProducts }: { initialProducts: NormalizedJersey[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const filtered = products.filter((p) => `${p.name} ${p.team} ${p.league}`.toLowerCase().includes(query.toLowerCase()));

  async function remove(id: string) {
    if (!window.confirm("Hapus produk ini?")) return;
    setIsDeletingId(id);
    try {
      const result = await deleteProductAction(id);
      setMessage(result.success ? "Produk dihapus" : result.error || "Gagal menghapus");
      if (result.success) setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setIsDeletingId(null);
    }
  }

  return <div className="space-y-6 text-[#FAFAFA]">
    <header className="border-b border-[#27272A] pb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kelola katalog</p>
      <h1 className="text-3xl font-black font-display text-white">Produk</h1>
    </header>
    {message && <p role="status" className="rounded-lg border border-[#27272A] bg-[#181820] p-3 text-sm text-zinc-200">{message}</p>}

    <Button asChild className="h-auto min-h-11 w-full sm:w-auto px-5 py-3 text-xs uppercase tracking-wider font-bold bg-volt text-black hover:bg-[#d4eb3d]">
      <Link href="/admin/products/new">+ Tambah produk baru</Link>
    </Button>

    <Input aria-label="Cari produk" className="text-sm" placeholder="Cari produk…" value={query} onChange={(e) => setQuery(e.target.value)} />

    {/* Mobile: kartu vertikal — nama tak terpotong, aksi tap-target ramah jempol */}
    <div className="space-y-2 sm:hidden">
      {filtered.map((p) => (
        <div key={p.id} className="rounded-xl border border-[#27272A] bg-[#121217] p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.image ? (
              <img src={p.image} alt={p.name} className="h-14 w-14 rounded-lg object-contain bg-black/40 border border-[#27272A] shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-black/40 border border-[#27272A] flex items-center justify-center text-[10px] text-zinc-600 font-mono shrink-0">No Pic</div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate">{p.name}</h3>
              <p className="text-xs text-zinc-400 truncate">{p.league} · {p.type}</p>
              <p className="font-mono font-black text-sm text-white mt-0.5">Rp {p.price} · <span className="text-zinc-400 font-bold">{p.stock} pcs</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/products/${p.id}`} className="flex-1 min-h-11 flex items-center justify-center rounded-lg border border-[#27272A] bg-[#181820] text-xs font-bold text-white active:bg-[#27272A]">Edit</Link>
            <button className="flex-1 min-h-11 rounded-lg border border-[#7F1D1D] bg-[#450A0A] text-xs font-bold text-red-300 disabled:opacity-50" disabled={isDeletingId !== null} onClick={() => remove(p.id)}>{isDeletingId === p.id ? "Menghapus…" : "Hapus"}</button>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="rounded-xl border border-[#27272A] bg-[#121217] p-4 text-center text-sm text-zinc-400">Tidak ada produk.</p>}
    </div>
    {/* Desktop: tabel */}
    <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#27272A] bg-[#121217]">
        <Table>
          <TableHeader className="bg-[#181820]">
            <TableRow className="hover:bg-transparent border-[#27272A] text-zinc-300">
              <TableHead>Produk</TableHead>
              <TableHead>Liga</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-zinc-200">
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-[#27272A] hover:bg-[#181820]">
                <TableCell className="font-semibold text-white">{p.name}</TableCell>
                <TableCell>{p.league}</TableCell>
                <TableCell>Rp {p.price}</TableCell>
                <TableCell className={p.stock > 0 ? "" : "text-red-400"}>{p.stock} pcs</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/admin/products/${p.id}`} className="underline">Edit</Link>
                  <button className="text-red-400 underline disabled:opacity-50" disabled={isDeletingId !== null} onClick={() => remove(p.id)}>{isDeletingId === p.id ? "Menghapus…" : "Hapus"}</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  </div>;
}

