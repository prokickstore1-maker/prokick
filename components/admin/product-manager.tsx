"use client";

import { useState } from "react";
import Link from "next/link";
import { NormalizedJersey } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { createProductAction, deleteProductAction, updateProductAction, uploadProductImageAction, ProductInput } from "@/app/actions/products";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function ProductManager({ initialProducts }: { initialProducts: NormalizedJersey[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState<ProductInput>(empty);
  // Item galeri: gambar lama sudah punya URL S3, baru ditunda upload sampai Simpan (cegah file yatim)
  const [images, setImages] = useState<Array<{ url?: string; file?: File; preview?: string }>>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const filtered = products.filter((p) => `${p.name} ${p.team} ${p.league}`.toLowerCase().includes(query.toLowerCase()));
  const update = (key: keyof ProductInput, value: string | boolean | string[]) => setForm((prev) => ({ ...prev, [key]: value }));

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

  // Pilih file: hanya simpan File-nya, tanpa upload — S3 baru ditembak saat Simpan
  async function handleImageSelect(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) { setMessage("File harus berupa gambar."); continue; }
      setImages((prev) => {
        if (prev.length >= 8) { setMessage("Maksimal 8 foto per produk."); return prev; }
        return [...prev, { file, preview: URL.createObjectURL(file) }];
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

  async function save() {
    setIsSaving(true);
    try {
      // Upload foto baru sekarang; satu gagal = berhenti, DB tidak tersentuh, admin bisa retry
      const urls: string[] = [];
      const pending = images.filter((i) => i.file);
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (!item.file) { urls.push(item.url!); continue; }
        setMessage(`Mengunggah foto ${urls.length + 1} dari ${pending.length}…`);
        const resized = await resizeToDataUrl(item.file);
        const result = await uploadProductImageAction(resized, "image/jpeg");
        if (!result.success) { setMessage(result.error || "Upload gagal — produk belum disimpan, coba lagi."); return; }
        urls.push(result.url);
      }
      const payload = { ...form, images: urls, image: urls[0] || form.image };
      const result = editing ? await updateProductAction(editing, payload) : await createProductAction(payload);
      setMessage(result.success ? "Product saved" : result.error || "Save failed");
      if (result.success) window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Simpan gagal");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const result = await deleteProductAction(id);
    setMessage(result.success ? "Product deleted" : result.error || "Delete failed");
    if (result.success) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function startEdit(p: NormalizedJersey) {
    setEditing(p.id);
    const gallery = p.images?.length ? p.images.map((i) => ({ url: i.url })) : p.image ? [{ url: p.image }] : [];
    setImages(gallery);
    setForm({ ...empty, name: p.name, team: p.team, league: p.league, season: p.season, type: p.type, category: p.category, country: p.country, edition: p.edition || "Current", kitType: p.kitType || "Home", price: p.price, description: p.description || "", image: gallery[0]?.url || p.image || "", sizes: p.sizes, isBestSeller: p.isBestSeller, isFeatured: p.isFeatured, isNew: p.isNew ?? false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const textField = (key: keyof ProductInput, label: string, list?: string, hint?: string) => (
    <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-[#57534E]">
      {label}
      <Input className="font-normal normal-case tracking-normal text-sm" list={list} value={form[key] as string} onChange={(e) => update(key, e.target.value)} />
      {hint && <span className="font-normal normal-case tracking-normal text-[10px] text-[#A8A29E]">{hint}</span>}
    </Label>
  );

  const selectField = (key: keyof ProductInput, label: string, options: string[]) => (
    <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-[#57534E]">
      {label}
      <Select value={form[key] as string} onValueChange={(v) => update(key, v)}>
        <SelectTrigger className="w-full font-normal normal-case tracking-normal text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Label>
  );

  return <div className="space-y-6 text-[#0C0A09]">
    <header className="border-b border-[#E5E5E5] pb-4"><p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Kelola katalog</p><h1 className="text-3xl font-black font-display">Produk</h1></header>
    {message && <p role="status" className="rounded-lg bg-[#FAFAF9] p-3 text-sm">{message}</p>}
    <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-6">
      <h2 className="text-lg font-bold">{editing ? "Edit produk" : "Tambah produk"}</h2>

      {/* 1. Identitas produk */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#0C0A09] mb-2">1 · Identitas produk</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {textField("name", "Nama produk")}
          {textField("team", "Klub / tim")}
        </div>
        <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-[#57534E]">
          Deskripsi
          <textarea aria-label="Deskripsi" rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal shadow-xs resize-y" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </Label>
      </fieldset>

      {/* 2. Foto */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#0C0A09] mb-2">2 · Foto</legend>
        <div className="flex flex-wrap items-start gap-4">
          <div className="space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Pilih foto produk"
              disabled={isSaving || images.length >= 8}
              className="block w-full text-xs text-[#57534E] file:mr-3 file:rounded-lg file:border-0 file:bg-[#FAFAF9] file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-[#0C0A09] hover:file:bg-[#E5E5E5] file:cursor-pointer"
              onChange={(e) => {
                void handleImageSelect(Array.from(e.target.files || []).slice(0, 8 - images.length));
                e.currentTarget.value = "";
              }}
            />
            <Input
              aria-label="Atau tempel URL gambar utama"
              placeholder="Atau tempel URL gambar utama"
              className="text-sm font-normal"
              value={form.image.startsWith("data:") ? "" : form.image}
              onChange={(e) => { update("image", e.target.value); setImages(e.target.value ? [{ url: e.target.value }] : []); }}
            />
            <span className="text-xs text-[#57534E]">Maksimal 8 foto. Foto pertama menjadi foto utama. Foto diunggah saat Simpan.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((item, index) => (
              <div key={item.url || item.preview || index} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview || item.url} alt={`Foto produk ${index + 1}`} className={`h-24 w-24 rounded-lg object-cover border ${index === 0 ? "border-black ring-2 ring-black/10" : "border-[#E5E5E5]"}`} />
                <button type="button" onClick={() => removeImage(index)} aria-label={`Hapus foto ${index + 1}`} className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-xs text-white">×</button>
                {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] text-white">Utama</span>}
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* 3. Klasifikasi */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#0C0A09] mb-2">3 · Klasifikasi</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-[#57534E]">
            Liga / kompetisi
            <Input className="font-normal normal-case tracking-normal text-sm" list="league-options" placeholder="Pilih yang sudah ada atau ketik baru" value={form.league} onChange={(e) => update("league", e.target.value)} />
            <span className="font-normal normal-case tracking-normal text-[10px] text-[#A8A29E]">Pilih yang sudah ada, atau ketik nama baru</span>
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
          <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-[#57534E]">
            Negara
            <Input className="font-normal normal-case tracking-normal text-sm" list="country-options" placeholder="England, Spain, Indonesia…" value={form.country} onChange={(e) => update("country", e.target.value)} />
            <span className="font-normal normal-case tracking-normal text-[10px] text-[#A8A29E]">Negara klub/tim (untuk filter)</span>
          </Label>
        </div>
        <datalist id="country-options">
          {uniqueLower(initialProducts.map((j) => j.country)).sort((a, b) => a.localeCompare(b)).map((c) => (
            <option key={c.toLowerCase()} value={c} />
          ))}
        </datalist>
      </fieldset>

      {/* 4. Harga & ukuran */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#0C0A09] mb-4">4 · Harga &amp; ukuran</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {textField("price", "Harga (Rp)")}
          <Label className="space-y-1 text-xs font-bold uppercase tracking-wider text-[#57534E]">
            Ukuran tersedia
            <Input className="font-normal normal-case tracking-normal text-sm" list="size-options" value={form.sizes.join(", ")} onChange={(e) => update("sizes", e.target.value.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean))} />
            <span className="font-normal normal-case tracking-normal text-[10px] text-[#A8A29E]">Pisahkan dengan koma, contoh: S, M, L, XL</span>
            <datalist id="size-options">
              {[...new Set(initialProducts.flatMap((j) => j.sizes || []))].sort().map((sz) => (
                <option key={sz} value={sz} />
              ))}
            </datalist>
          </Label>
        </div>
        <p className="text-xs text-[#57534E]">Stok per ukuran diatur di halaman <Link href="/admin/jerseys" className="underline font-semibold">Inventory</Link> setelah produk disimpan.</p>
      </fieldset>

      {/* 5. Sorotan */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wider text-[#0C0A09] mb-2">5 · Sorotan di beranda</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {([["isBestSeller", "Paling laris"], ["isFeatured", "Unggulan"], ["isNew", "Baru datang"]] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 font-medium">
              <Checkbox checked={form[key] as boolean} onCheckedChange={(c) => update(key, c === true)} /> {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2 border-t border-[#E5E5E5] pt-4"><Button className="h-auto px-5 py-2 text-xs uppercase tracking-wider font-bold" disabled={isSaving} onClick={save}>{isSaving ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan produk"}</Button>{editing && <Button variant="outline" className="h-auto px-5 py-2 text-xs uppercase tracking-wider font-bold" disabled={isSaving} onClick={() => { setEditing(null); setForm(empty); setImages((prev) => { prev.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)); return []; }); }}>Batal</Button>}</div>
    </section>
    <Input aria-label="Cari produk" className="text-sm" placeholder="Cari produk…" value={query} onChange={(e) => setQuery(e.target.value)} />
    <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white">
        <Table>
          <TableHeader className="bg-[#FAFAF9]">
            <TableRow className="hover:bg-transparent border-[#E5E5E5]">
              <TableHead>Produk</TableHead>
              <TableHead>Liga</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-[#E5E5E5]">
                <TableCell className="font-semibold">{p.name}</TableCell>
                <TableCell>{p.league}</TableCell>
                <TableCell>Rp {p.price}</TableCell>
                <TableCell className="text-right space-x-2">
                  <button className="underline" onClick={() => startEdit(p)}>Edit</button>
                  <button className="text-[#DC2626] underline" onClick={() => remove(p.id)}>Delete</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  </div>;
}
