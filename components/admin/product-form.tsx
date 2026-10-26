"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { NormalizedJersey } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { createProductAction, updateProductAction, uploadProductImageAction, ProductInput } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const empty: ProductInput = { name: "", team: "", league: "Premier League", season: "2026/2027", type: "Fans Version", category: "Klub", country: "", edition: "Current", kitType: "Home", price: "", description: "", image: "", sizes: ["S", "M", "L", "XL"], isBestSeller: false, isFeatured: false, isNew: false };

// Dedup case-insensitive + trim — "premier league" & "Premier League" tampil sekali (bentuk kanonik pertama)
function uniqueLower(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const v = item.trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

// Item galeri: gambar lama sudah punya URL S3, baru ditunda upload sampai Simpan (cegah file yatim)
type GalleryItem = { url?: string; file?: File; preview?: string };

// resize sisi klien (canvas) sebelum upload — foto HP 4000px jadi max 1600px JPEG
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1600;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; } else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Gambar tidak valid"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export function ProductForm({ initialProducts, product }: { initialProducts: NormalizedJersey[]; product?: NormalizedJersey }) {
  const [form, setForm] = useState<ProductInput>(() => product ? {
    ...empty, name: product.name, team: product.team, league: product.league, season: product.season, type: product.type,
    category: product.category, country: product.country, edition: product.edition || "Current", kitType: product.kitType || "Home",
    price: product.price, description: product.description || "", image: product.image || "", sizes: product.sizes,
    stockData: product.stockData, isBestSeller: product.isBestSeller, isFeatured: product.isFeatured, isNew: product.isNew ?? false,
  } : empty);
  const [images, setImages] = useState<GalleryItem[]>(() => {
    if (!product) return [];
    const gallery = product.images?.length ? product.images.map((i) => ({ url: i.url })) : product.image ? [{ url: product.image }] : [];
    return gallery;
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const update = (key: keyof ProductInput, value: string | boolean | string[] | Record<string, number>) => setForm((prev) => ({ ...prev, [key]: value }));

  // Pilih file: hanya simpan File-nya, tanpa upload — S3 baru ditembak saat Simpan
  async function handleImageSelect(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) { setMessage("File harus berupa gambar."); continue; }
      const preview = URL.createObjectURL(file);
      // Tolak hanya yang rusak/kekecilan — resizeToDataUrl merampingkan foto besar saat Simpan
      const ok = await new Promise<boolean>((resolve) => {
        const probe = new window.Image();
        probe.onload = () => resolve(Math.min(probe.width, probe.height) >= 300);
        probe.onerror = () => resolve(false);
        probe.src = preview;
      });
      if (!ok) {
        URL.revokeObjectURL(preview);
        setMessage(`Foto "${file.name}" rusak atau terlalu kecil (min. 300px). Dilewati.`);
        continue;
      }
      setImages((prev) => {
        if (prev.length >= 16) { URL.revokeObjectURL(preview); setMessage("Maksimal 16 foto per produk."); return prev; }
        return [...prev, { file, preview }];
      });
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const item = prev[index];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function setSizeStock(size: string, raw: string) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setForm((prev) => ({ ...prev, stockData: { ...prev.stockData, [size]: n } }));
  }

  async function save() {
    setIsSaving(true);
    try {
      // Upload foto baru sekarang; satu gagal = berhenti, DB tidak tersentuh, admin bisa retry
      const urls: string[] = [];
      const pending = images.filter((i) => i.file);
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (!item.file) { urls.push(item.url!); continue; }
        setMessage(`Mengompres foto ${urls.length + 1} dari ${pending.length}…`);
        const resized = await resizeToDataUrl(item.file);
        setMessage(`Mengunggah foto ${urls.length + 1} dari ${pending.length}…`);
        const result = await uploadProductImageAction(resized, "image/jpeg");
        if (!result.success) { setMessage(result.error || "Upload gagal — produk belum disimpan, coba lagi."); return; }
        urls.push(result.url);
      }
      setMessage("Menyimpan produk…");
      const payload = { ...form, images: urls, image: urls[0] || form.image };
      const result = product ? await updateProductAction(product.id, payload) : await createProductAction(payload);
      if (!result.success) { setMessage(result.error || "Gagal menyimpan"); return; }
      setMessage("Produk tersimpan");
      window.location.href = "/admin/products";
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Simpan gagal");
    } finally {
      setIsSaving(false);
    }
  }

  const textField = (key: keyof ProductInput, label: string, list?: string, hint?: string) => (
    <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
      {label}
      <Input className="font-normal normal-case tracking-normal text-sm" list={list} value={form[key] as string} onChange={(e) => update(key, e.target.value)} />
      {hint && <span className="font-normal normal-case tracking-normal text-[10px] text-zinc-400">{hint}</span>}
    </Label>
  );

  const selectField = (key: keyof ProductInput, label: string, options: string[]) => (
    <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
      {label}
      <Select value={form[key] as string} onValueChange={(v) => update(key, v)}>
        <SelectTrigger className="w-full font-normal normal-case tracking-normal text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Label>
  );

  return <div className="space-y-6 text-[#FAFAFA]">
    <header className="border-b border-[#27272A] pb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kelola katalog</p>
      <h1 className="text-3xl font-black font-display text-white">{product ? "Edit produk" : "Tambah produk"}</h1>
    </header>
    {message && <p role="status" className="rounded-lg border border-[#27272A] bg-[#181820] p-3 text-sm text-zinc-200">{message}</p>}
    <section className="rounded-xl border border-[#27272A] bg-[#121217] p-5 space-y-6">

      {/* 1. Identitas produk */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">1 · Identitas produk</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {textField("name", "Nama produk")}
          {textField("team", "Klub / tim")}
        </div>
        <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Deskripsi
          <textarea aria-label="Deskripsi" rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal shadow-xs resize-y" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </Label>
      </fieldset>

      {/* 2. Foto */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-1">2 · Foto Produk</legend>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Format JPG/PNG/WebP. Foto otomatis dioptimasi saat Simpan. Potret 3:4 disarankan; semua rasio diterima. Maksimal 8 foto.
        </p>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!isSaving) void handleImageSelect(Array.from(e.dataTransfer.files).slice(0, 8 - images.length)); }}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-volt bg-volt/5" : "border-[#27272A] bg-[#181820] hover:border-[#3F3F46]"} ${isSaving || images.length >= 8 ? "opacity-50" : ""}`}
        >
          <ImagePlus className="h-6 w-6 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-200">Sentuh atau tarik foto produk ke sini</span>
          <span className="text-[11px] text-zinc-400">Maksimal 16 foto · foto pertama jadi foto utama</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-label="Pilih foto produk"
            disabled={isSaving || images.length >= 16}
            className="hidden"
            onChange={(e) => {
              void handleImageSelect(Array.from(e.target.files || []).slice(0, 16 - images.length));
              e.currentTarget.value = "";
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {images.map((item, index) => (
            <div key={item.url || item.preview || index} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview || item.url} alt={`Foto produk ${index + 1}`} className={`h-24 w-24 rounded-lg object-contain bg-black/40 border ${index === 0 ? "border-volt ring-2 ring-volt/30" : "border-[#27272A]"}`} />
              <button type="button" onClick={() => removeImage(index)} aria-label={`Hapus foto ${index + 1}`} className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-xs text-white">×</button>
              {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-volt px-1.5 py-0.5 text-[9px] font-black text-black">UTAMA</span>}
            </div>
          ))}
        </div>
      </fieldset>

      {/* 3. Klasifikasi */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">3 · Klasifikasi</legend>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-400 col-span-2 sm:col-span-3">
            Liga / kompetisi
            <Input className="font-normal normal-case tracking-normal text-sm" list="league-options" placeholder="Pilih yang sudah ada atau ketik baru" value={form.league} onChange={(e) => update("league", e.target.value)} />
            <span className="font-normal normal-case tracking-normal text-[10px] text-zinc-400">Pilih yang sudah ada, atau ketik nama baru</span>
            <datalist id="league-options">
              {uniqueLower(buildLeagueOptions(initialProducts).map((o) => o.value).filter(Boolean)).map((value) => {
                const option = buildLeagueOptions(initialProducts).find((o) => o.value.toLowerCase() === value.toLowerCase())!;
                return <option key={value.toLowerCase()} value={value}>{option.label}</option>;
              })}
            </datalist>
          </Label>
          {selectField("category", "Kategori", uniqueLower(["Klub", "Tim Nasional", ...initialProducts.map((j) => j.category)]))}
          {selectField("type", "Tipe jersey", ["Player Issue", "Fans Version", "Retro", "Kids"])}
          {selectField("edition", "Edisi", ["Current", "Vintage"])}
          {selectField("kitType", "Tipe kit", ["Home", "Away", "Third", "Training"])}
          {textField("season", "Musim", undefined, "Contoh: 2026/2027")}
          <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Negara
            <Input className="font-normal normal-case tracking-normal text-sm" list="country-options" placeholder="England, Spain, Indonesia…" value={form.country} onChange={(e) => update("country", e.target.value)} />
            <span className="font-normal normal-case tracking-normal text-[10px] text-zinc-400">Negara klub/tim (untuk filter)</span>
          </Label>
        </div>
        <datalist id="country-options">
          {uniqueLower(initialProducts.map((j) => j.country)).sort((a, b) => a.localeCompare(b)).map((c) => (
            <option key={c.toLowerCase()} value={c} />
          ))}
        </datalist>
      </fieldset>

      {/* 4. Harga, ukuran & stok */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-4">4 · Harga, ukuran &amp; stok</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {textField("price", "Harga (Rp)")}
          <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Ukuran tersedia
            <Input className="font-normal normal-case tracking-normal text-sm" list="size-options" value={form.sizes.join(", ")} onChange={(e) => update("sizes", e.target.value.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean))} />
            <span className="font-normal normal-case tracking-normal text-[10px] text-zinc-400">Pisahkan dengan koma, contoh: S, M, L, XL</span>
            <datalist id="size-options">
              {[...new Set(initialProducts.flatMap((j) => j.sizes || []))].sort().map((sz) => (
                <option key={sz} value={sz} />
              ))}
            </datalist>
          </Label>
        </div>
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Stok per ukuran</span>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {form.sizes.map((size) => (
              <label key={size} className="flex items-center justify-between gap-2 rounded-lg border border-[#27272A] bg-[#181820] px-3 py-2">
                <span className="font-mono text-xs font-bold text-white">{size}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label={`Stok ukuran ${size}`}
                    value={form.stockData?.[size] ?? 0}
                    onChange={(e) => setSizeStock(size, e.target.value)}
                    className="w-14 rounded border-none bg-transparent text-center font-mono text-sm font-bold text-white focus:bg-[#27272A] focus:ring-1 focus:ring-volt focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400">pcs</span>
                </span>
              </label>
            ))}
            {form.sizes.length === 0 && <p className="text-xs text-zinc-400">Isi ukuran dulu di kolom atas.</p>}
          </div>
          <p className="text-[10px] text-zinc-400">Stok bisa diubah kapan saja di halaman Inventory.</p>
        </div>
      </fieldset>

      {/* 5. Sorotan */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">5 · Sorotan di beranda</legend>
        <div className="rounded-lg border border-[#27272A] bg-[#181820] p-3 flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm">
          {([["isBestSeller", "Paling laris"], ["isFeatured", "Unggulan"], ["isNew", "Baru datang"]] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 font-medium min-h-11 cursor-pointer">
              <Checkbox checked={form[key] as boolean} onCheckedChange={(c) => update(key, c === true)} /> {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2 border-t border-[#27272A] pt-4">
        <Button className="h-auto min-h-11 flex-1 sm:flex-none px-5 py-3 sm:py-2 text-xs uppercase tracking-wider font-bold bg-volt text-black hover:bg-[#d4eb3d]" disabled={isSaving} onClick={save}>{isSaving ? "Menyimpan…" : product ? "Simpan perubahan" : "Simpan produk"}</Button>
        <Button asChild variant="outline" className="h-auto min-h-11 flex-1 sm:flex-none px-5 py-3 sm:py-2 text-xs uppercase tracking-wider font-bold border-[#27272A] bg-[#181820] text-white hover:bg-[#27272A]">
          <Link href="/admin/products">Batal</Link>
        </Button>
      </div>
    </section>
  </div>;
}
