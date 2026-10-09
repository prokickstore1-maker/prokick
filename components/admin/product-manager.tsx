"use client";

import { useState } from "react";
import { NormalizedJersey } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { createProductAction, deleteProductAction, updateProductAction, uploadProductImageAction, ProductInput } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

const empty: ProductInput = { name: "", team: "", league: "Premier League", season: "2026/2027", type: "Fans Version", category: "Klub", country: "England", price: "", description: "", image: "", sizes: ["S", "M", "L", "XL"], isBestSeller: false, isFeatured: false, isNew: false };

export function ProductManager({ initialProducts }: { initialProducts: NormalizedJersey[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState<ProductInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const filtered = products.filter((p) => `${p.name} ${p.team} ${p.league}`.toLowerCase().includes(query.toLowerCase()));
  const update = (key: keyof ProductInput, value: string | boolean | string[]) => setForm((prev) => ({ ...prev, [key]: value }));

  // resize sisi klien (canvas) sebelum upload — foto HP 4000px jadi max 1600px JPEG
  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) { setMessage("File must be an image."); return; }
    setIsUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      const resized = await new Promise<string>((resolve, reject) => {
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
        img.onerror = () => reject(new Error("Invalid image"));
        img.src = dataUrl;
      });
      const result = await uploadProductImageAction(resized, "image/jpeg");
      if (result.success) { update("image", result.url); setMessage("Image uploaded ✓"); }
      else setMessage(result.error || "Upload failed");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function save() {
    const result = editing ? await updateProductAction(editing, form) : await createProductAction(form);
    setMessage(result.success ? "Product saved" : result.error || "Save failed");
    if (result.success) window.location.reload();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const result = await deleteProductAction(id);
    setMessage(result.success ? "Product deleted" : result.error || "Delete failed");
    if (result.success) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return <div className="space-y-6 text-[#0C0A09]">
    <header className="border-b border-[#E5E5E5] pb-4"><p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Catalog management</p><h1 className="text-3xl font-black font-display">Products</h1></header>
    {message && <p role="status" className="rounded-lg bg-[#FAFAF9] p-3 text-sm">{message}</p>}
    <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
      <h2 className="text-lg font-bold">{editing ? "Edit product" : "Add product"}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {([['name','Product name'],['team','Team'],['season','Season'],['price','Price'],['description','Description']] as const).map(([key, label]) => <Input key={key} aria-label={label} placeholder={label} value={form[key] as string} onChange={(e) => update(key, e.target.value)} />)}
        {/* Foto produk: upload dari komputer (otomatis resize + kompres), atau tempel URL manual */}
        <div className="space-y-1.5">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Upload product photo"
            disabled={isUploadingImage}
            className="block w-full text-xs text-[#57534E] file:mr-3 file:rounded-lg file:border-0 file:bg-[#FAFAF9] file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-[#0C0A09] hover:file:bg-[#E5E5E5] file:cursor-pointer"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ""; }}
          />
          <Input
            aria-label="Image URL (manual)"
            placeholder="Atau tempel URL gambar"
            value={form.image.startsWith("data:") ? "" : form.image}
            onChange={(e) => update("image", e.target.value)}
          />
          {form.image && !form.image.startsWith("data:") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-[#E5E5E5]" />
          )}
          {isUploadingImage && <span className="text-xs text-[#57534E]">Mengunggah foto…</span>}
        </div>
        {/* Liga: input + datalist — pilih yang sudah ada ATAU ketik nama liga baru;
            liga baru otomatis muncul di filter & menu (baca dari data produk) */}
        <Input
          aria-label="League"
          list="league-options"
          placeholder="League (e.g. Bundesliga)"
          value={form.league}
          onChange={(e) => update("league", e.target.value)}
        />
        <datalist id="league-options">
          {buildLeagueOptions(initialProducts).filter((o) => o.value).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </datalist>
        {/* Ukuran: pisahkan dengan koma — pilihan dari ukuran produk yang ada */}
        <Input
          aria-label="Sizes"
          list="size-options"
          placeholder="Sizes (e.g. S,M,L,XL)"
          value={form.sizes.join(", ")}
          onChange={(e) => update("sizes", e.target.value.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean))}
        />
        <datalist id="size-options">
          {[...new Set(initialProducts.flatMap((j) => j.sizes || []))].sort().map((sz) => (
            <option key={sz} value={sz} />
          ))}
        </datalist>
        {/* Category: Klub / Tim Nasional / lain. Country hanya relevan utk Tim Nasional
            (mengisi grid "National Teams" di homepage) */}
        <Input
          aria-label="Category"
          list="category-options"
          placeholder="Category (Klub / Tim Nasional)"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
        />
        <datalist id="category-options">
          {["Klub", "Tim Nasional", ...new Set(initialProducts.map((j) => j.category))].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input
          aria-label="Country"
          list="country-options"
          placeholder="Country (untuk Tim Nasional)"
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
        />
        <datalist id="country-options">
          {[...new Set(initialProducts.map((j) => j.country).filter(Boolean))].sort().map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Select aria-label="Type" value={form.type} onValueChange={(v) => update("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Player Issue">Player Issue</SelectItem><SelectItem value="Fans Version">Fans Version</SelectItem><SelectItem value="Retro">Retro</SelectItem><SelectItem value="Kids">Kids</SelectItem></SelectContent></Select>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {([["isBestSeller", "Best seller"], ["isFeatured", "Featured"], ["isNew", "New arrival"]] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 font-medium">
            <Checkbox checked={form[key] as boolean} onCheckedChange={(c) => update(key, c === true)} /> {label}
          </label>
        ))}
      </div>
      <div className="flex gap-2"><Button className="h-auto px-5 py-2 text-xs uppercase tracking-wider font-bold" onClick={save}>Save product</Button>{editing && <Button variant="outline" className="h-auto px-5 py-2 text-xs uppercase tracking-wider font-bold" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button>}</div>
    </section>
    <Input aria-label="Search products" className="text-sm" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
    <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white">
        <Table>
          <TableHeader className="bg-[#FAFAF9]">
            <TableRow className="hover:bg-transparent border-[#E5E5E5]">
              <TableHead>Product</TableHead>
              <TableHead>League</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-[#E5E5E5]">
                <TableCell className="font-semibold">{p.name}</TableCell>
                <TableCell>{p.league}</TableCell>
                <TableCell>RM {p.price}</TableCell>
                <TableCell className="text-right space-x-2">
                  <button className="underline" onClick={() => { setEditing(p.id); setForm({ ...empty, name: p.name, team: p.team, league: p.league, season: p.season, type: p.type, category: p.category, country: p.country, price: p.price, description: p.description || "", image: p.image || "", sizes: p.sizes, isBestSeller: p.isBestSeller, isFeatured: p.isFeatured, isNew: p.isNew ?? false }); }}>Edit</button>
                  <button className="text-[#DC2626] underline" onClick={() => remove(p.id)}>Delete</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  </div>;
}
