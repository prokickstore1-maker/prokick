"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { NormalizedJersey } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { PRODUCT_LINE_JACKET, PRODUCT_LINE_JERSEY, JACKET_KINDS, JERSEY_KIT_TYPES } from "@/lib/product-lines";
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

const empty: ProductInput = {
  productLine: PRODUCT_LINE_JERSEY,
  name: "",
  team: "",
  league: "Premier League",
  season: "2026/2027",
  type: "Fans Version",
  category: "Klub",
  country: "",
  edition: "Current",
  kitType: "Home",
  price: "",
  description: "",
  image: "",
  sizes: ["S", "M", "L", "XL", "XXL"],
  isBestSeller: false,
  isFeatured: false,
  isNew: false,
};

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

// Resize sisi klien (canvas) sebelum upload — foto HP 4000px jadi max 1600px JPEG (< 3.5 MB)
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas tidak tersedia di browser ini."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      // Pastikan di bawah 3.5 MB base64 (~4.6 MB string)
      if (dataUrl.length > 4_600_000) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      }
      if (dataUrl.length > 4_600_000) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.58);
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Format gambar "${file.name}" tidak didukung browser.`));
    };
    img.src = objectUrl;
  });
}

function formatInitialPrice(price?: string): string {
  if (!price) return "";
  const trimmed = price.trim();
  if (/^\d+\.\d{1,2}$/.test(trimmed)) return trimmed.split(".")[0];
  return trimmed;
}

export function ProductForm({ initialProducts, product }: { initialProducts: NormalizedJersey[]; product?: NormalizedJersey }) {
  const [form, setForm] = useState<ProductInput>(() =>
    product
      ? {
          ...empty,
          productLine: product.productLine || PRODUCT_LINE_JERSEY,
          name: product.name,
          team: product.team,
          league: product.league,
          season: product.season,
          type: product.type,
          category: product.category,
          country: product.country,
          edition: product.edition || "Current",
          kitType: product.kitType || "Home",
          price: formatInitialPrice(product.price),
          description: product.description || "",
          image: product.image || "",
          sizes: product.sizes,
          stockData: product.stockData,
          isBestSeller: product.isBestSeller,
          isFeatured: product.isFeatured,
          isNew: product.isNew ?? false,
        }
      : empty
  );
  const [images, setImages] = useState<GalleryItem[]>(() => {
    if (!product) return [];
    const gallery = product.images?.length
      ? product.images.map((i) => ({ url: i.url }))
      : product.image
      ? [{ url: product.image }]
      : [];
    return gallery;
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const update = (key: keyof ProductInput, value: string | boolean | string[] | Record<string, number>) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isJacketLine = form.productLine === PRODUCT_LINE_JACKET;

  // ganti lini: kitType di-reset ke nilai pertama lini baru supaya tidak tertinggal "Home" di jaket
  const changeLine = (line: string) =>
    setForm((prev) => ({
      ...prev,
      productLine: line,
      kitType: line === PRODUCT_LINE_JACKET ? JACKET_KINDS[0] : JERSEY_KIT_TYPES[0],
      type: line === PRODUCT_LINE_JACKET ? "Jaket" : "Fans Version",
      edition: line === PRODUCT_LINE_JACKET ? "Current" : prev.edition,
    }));

  // Pilih file: verifikasi bisa dibuka sebagai gambar, simpan File untuk dikompres & diupload saat Simpan
  async function handleImageSelect(files: File[]) {
    setIsError(false);
    for (const file of files) {
      if (file.type && !file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)) {
        setIsError(true);
        setMessage("File harus berupa gambar (JPG, PNG, atau WebP).");
        continue;
      }
      const preview = URL.createObjectURL(file);
      const ok = await new Promise<boolean>((resolve) => {
        const probe = new window.Image();
        probe.onload = () => resolve(Math.min(probe.width, probe.height) >= 50);
        probe.onerror = () => resolve(false);
        probe.src = preview;
      });
      if (!ok) {
        URL.revokeObjectURL(preview);
        setIsError(true);
        setMessage(`Foto "${file.name}" tidak dapat dibaca atau ukurannya terlalu kecil.`);
        continue;
      }
      setImages((prev) => {
        if (prev.length >= 16) {
          URL.revokeObjectURL(preview);
          setIsError(true);
          setMessage("Maksimal 16 foto per produk.");
          return prev;
        }
        return [...prev, { file, preview }];
      });
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function setSizeStock(size: string, raw: string) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setForm((prev) => ({ ...prev, stockData: { ...prev.stockData, [size]: n } }));
  }

  async function save() {
    if (!form.name.trim()) {
      setIsError(true);
      setMessage("Nama produk wajib diisi sebelum menyimpan.");
      return;
    }
    const rawNumericPrice = form.price.trim().replace(/^\d+\.\d{1,2}$/, (m) => m.split(".")[0]).replace(/[^0-9]/g, "");
    if (!rawNumericPrice || Number(rawNumericPrice) <= 0) {
      setIsError(true);
      setMessage("Harga (Rp) wajib diisi dengan angka (contoh: 135000 atau 200000).");
      return;
    }

    setIsSaving(true);
    setIsError(false);
    try {
      const nextGallery = [...images];
      const urls: string[] = [];
      const totalToUpload = nextGallery.filter((i) => i.file).length;
      let uploadedCount = 0;

      for (let i = 0; i < nextGallery.length; i++) {
        const item = nextGallery[i];
        if (!item.file) {
          if (item.url) urls.push(item.url);
          continue;
        }
        uploadedCount++;
        setMessage(`Mengompres foto ${uploadedCount} dari ${totalToUpload}…`);
        const resized = await resizeToDataUrl(item.file);
        setMessage(`Mengunggah foto ${uploadedCount} dari ${totalToUpload}…`);
        const result = await uploadProductImageAction(resized, "image/jpeg");
        if (!result.success) {
          setIsError(true);
          setMessage(result.error || "Upload foto gagal — silakan coba klik Simpan lagi.");
          setImages(nextGallery);
          return;
        }
        if (item.preview) URL.revokeObjectURL(item.preview);
        nextGallery[i] = { url: result.url };
        urls.push(result.url);
      }

      setImages(nextGallery);
      setMessage("Menyimpan produk ke katalog…");
      const payload: ProductInput = {
        ...form,
        team: form.team.trim() || form.name.trim(),
        images: urls,
        image: urls[0] || form.image,
      };
      const result = product ? await updateProductAction(product.id, payload) : await createProductAction(payload);
      if (!result.success) {
        setIsError(true);
        setMessage(result.error || "Gagal menyimpan produk.");
        return;
      }
      setIsError(false);
      setMessage("Produk berhasil disimpan! Mengalihkan…");
      window.location.href = "/admin/products";
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "Simpan produk gagal.");
    } finally {
      setIsSaving(false);
    }
  }

  const textField = (key: keyof ProductInput, label: string, list?: string, hint?: string, placeholder?: string) => (
    <div className="space-y-1.5 min-w-0">
      <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </Label>
      <Input
        className="w-full font-normal normal-case tracking-normal text-sm"
        list={list}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={(e) => update(key, e.target.value)}
      />
      {hint && <p className="font-normal normal-case tracking-normal text-[11px] text-zinc-400 leading-snug">{hint}</p>}
    </div>
  );

  const selectField = (key: keyof ProductInput, label: string, options: string[]) => (
    <div className="space-y-1.5 min-w-0">
      <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </Label>
      <Select value={form[key] as string} onValueChange={(v) => update(key, v)}>
        <SelectTrigger className="w-full font-normal normal-case tracking-normal text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6 text-[#FAFAFA] max-w-4xl">
      <header className="border-b border-[#27272A] pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kelola katalog</p>
        <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
          {product ? "Edit produk" : "Tambah produk"}
        </h1>
      </header>

      {message && (
        <p
          role="status"
          className={`rounded-lg border p-3.5 text-sm font-medium ${
            isError
              ? "border-red-500/40 bg-red-950/40 text-red-200"
              : "border-[#E2F952]/30 bg-[#181820] text-zinc-100"
          }`}
        >
          {message}
        </p>
      )}

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-4 sm:p-6 space-y-6 overflow-hidden">
        {/* 1. Identitas produk */}
        <fieldset className="space-y-4 min-w-0">
          <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">
            1 · Identitas produk
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2 min-w-0">
              <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Lini produk
              </Label>
              <Select value={form.productLine} onValueChange={changeLine}>
                <SelectTrigger className="w-full font-normal normal-case tracking-normal text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PRODUCT_LINE_JERSEY}>Jersey</SelectItem>
                  <SelectItem value={PRODUCT_LINE_JACKET}>Jaket (Tracksuit / Jaket / Windbreaker)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {textField("name", "Nama produk *", undefined, undefined, "Contoh: Real Madrid Home 2026/2027")}
            {textField("team", "Klub / tim", undefined, "Kosongkan jika sama dengan nama produk", "Contoh: Real Madrid")}
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Deskripsi
            </Label>
            <textarea
              aria-label="Deskripsi"
              rows={3}
              placeholder="Detail bahan, edisi, atau keterangan tambahan (opsional)…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal text-white placeholder:text-zinc-500 shadow-xs resize-y focus-visible:outline-none focus-visible:border-volt"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
        </fieldset>

        {/* 2. Foto */}
        <fieldset className="space-y-3 min-w-0 border-t border-[#27272A] pt-5">
          <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-1">
            2 · Foto Produk
          </legend>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Format JPG, PNG, atau WebP. Foto otomatis dikompres saat Simpan. Maksimal 16 foto (foto pertama menjadi sampul utama).
          </p>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!isSaving) void handleImageSelect(Array.from(e.dataTransfer.files).slice(0, 16 - images.length));
            }}
            className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 sm:p-6 text-center transition-colors ${
              dragging ? "border-volt bg-volt/5" : "border-[#27272A] bg-[#181820] hover:border-[#3F3F46]"
            } ${isSaving || images.length >= 16 ? "opacity-50 pointer-events-none" : ""}`}
          >
            <ImagePlus className="h-6 w-6 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-200">Sentuh untuk pilih foto atau tarik ke sini</span>
            <span className="text-[11px] text-zinc-400">
              {images.length}/16 foto terpilih · foto pertama jadi foto utama
            </span>
            <input
              type="file"
              accept="image/*"
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
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 pt-1">
              {images.map((item, index) => (
                <div key={item.url || item.preview || index} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview || item.url}
                    alt={`Foto produk ${index + 1}`}
                    className={`h-full w-full rounded-lg object-contain bg-black/40 border ${
                      index === 0 ? "border-volt ring-2 ring-volt/30" : "border-[#27272A]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Hapus foto ${index + 1}`}
                    className="absolute -right-1.5 -top-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-black border border-white/20 text-xs font-bold text-white shadow"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-volt px-1.5 py-0.5 text-[9px] font-black text-black">
                      UTAMA
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {/* 3. Klasifikasi */}
        <fieldset className="space-y-4 min-w-0 border-t border-[#27272A] pt-5">
          <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">
            3 · Klasifikasi
          </legend>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 min-w-0">
              <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Liga / kompetisi
              </Label>
              <Input
                className="w-full font-normal normal-case tracking-normal text-sm"
                list="league-options"
                placeholder="Pilih yang sudah ada atau ketik baru"
                value={form.league}
                onChange={(e) => update("league", e.target.value)}
              />
              <p className="font-normal normal-case tracking-normal text-[11px] text-zinc-400">
                Pilih yang sudah ada, atau ketik nama baru
              </p>
              <datalist id="league-options">
                {uniqueLower(buildLeagueOptions(initialProducts).map((o) => o.value).filter(Boolean)).map((value) => {
                  const option = buildLeagueOptions(initialProducts).find(
                    (o) => o.value.toLowerCase() === value.toLowerCase()
                  )!;
                  return (
                    <option key={value.toLowerCase()} value={value}>
                      {option.label}
                    </option>
                  );
                })}
              </datalist>
            </div>
            {selectField("category", "Kategori", uniqueLower(["Klub", "Tim Nasional", ...initialProducts.map((j) => j.category)]))}
            {!isJacketLine && selectField("type", "Tipe jersey", ["Player Issue", "Fans Version", "Retro", "Kids"])}
            {!isJacketLine && selectField("edition", "Edisi", ["Current", "Vintage"])}
            {selectField("kitType", isJacketLine ? "Jenis jaket" : "Tipe kit", isJacketLine ? [...JACKET_KINDS] : [...JERSEY_KIT_TYPES])}
            {textField("season", "Musim", undefined, "Contoh: 2026/2027")}
            {textField("country", "Negara", "country-options", "Negara klub/tim (untuk filter)", "England, Spain, Indonesia…")}
          </div>
          <datalist id="country-options">
            {uniqueLower(initialProducts.map((j) => j.country))
              .sort((a, b) => a.localeCompare(b))
              .map((c) => (
                <option key={c.toLowerCase()} value={c} />
              ))}
          </datalist>
        </fieldset>

        {/* 4. Harga, ukuran & stok */}
        <fieldset className="space-y-4 min-w-0 border-t border-[#27272A] pt-5">
          <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">
            4 · Harga, ukuran &amp; stok
          </legend>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {textField("price", "Harga (Rp) *", undefined, "Contoh: 135000 atau 200000", "135000")}
            <div className="space-y-1.5 min-w-0">
              <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Ukuran tersedia
              </Label>
              <Input
                className="w-full font-normal normal-case tracking-normal text-sm"
                list="size-options"
                value={form.sizes.join(", ")}
                onChange={(e) =>
                  update(
                    "sizes",
                    e.target.value
                      .split(",")
                      .map((v) => v.trim().toUpperCase())
                      .filter(Boolean)
                  )
                }
              />
              <p className="font-normal normal-case tracking-normal text-[11px] text-zinc-400">
                Pisahkan dengan koma, contoh: S, M, L, XL, XXL
              </p>
              <datalist id="size-options">
                {[...new Set(initialProducts.flatMap((j) => j.sizes || []))].sort().map((sz) => (
                  <option key={sz} value={sz} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Stok per ukuran</span>
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-5">
              {form.sizes.map((size) => (
                <label
                  key={size}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#27272A] bg-[#181820] px-3 py-2.5"
                >
                  <span className="font-mono text-xs font-bold text-white">{size}</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Stok ukuran ${size}`}
                      value={form.stockData?.[size] ?? 0}
                      onChange={(e) => setSizeStock(size, e.target.value)}
                      className="w-14 rounded border border-white/10 bg-[#09090B] py-1 text-center font-mono text-sm font-bold text-white focus:border-volt focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-400">pcs</span>
                  </span>
                </label>
              ))}
              {form.sizes.length === 0 && <p className="text-xs text-zinc-400 col-span-full">Isi ukuran dulu di kolom atas.</p>}
            </div>
            <p className="text-[11px] text-zinc-400">Stok bisa diubah kapan saja di halaman Inventory.</p>
          </div>
        </fieldset>

        {/* 5. Sorotan */}
        <fieldset className="space-y-3 min-w-0 border-t border-[#27272A] pt-5">
          <legend className="text-xs font-black uppercase tracking-wider text-[#FAFAFA] mb-2">
            5 · Sorotan di beranda
          </legend>
          <div className="rounded-lg border border-[#27272A] bg-[#181820] p-3.5 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-sm">
            {(
              [
                ["isFeatured", "Unggulan (Featured Collection)"],
                ["isBestSeller", "Paling laris (Best Sellers)"],
                ["isNew", "Baru datang (New Arrivals)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 font-medium min-h-10 cursor-pointer">
                <Checkbox checked={form[key] as boolean} onCheckedChange={(c) => update(key, c === true)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {message && (
          <p
            role="status"
            className={`rounded-lg border p-3.5 text-sm font-medium ${
              isError
                ? "border-red-500/40 bg-red-950/40 text-red-200"
                : "border-[#E2F952]/30 bg-[#181820] text-zinc-100"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 border-t border-[#27272A] pt-4">
          <Button
            className="h-auto min-h-11 w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider font-extrabold bg-volt text-black hover:bg-[#d4eb3d]"
            disabled={isSaving}
            onClick={save}
          >
            {isSaving ? "Menyimpan…" : product ? "Simpan perubahan" : "Simpan produk"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto min-h-11 w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider font-bold border-[#27272A] bg-[#181820] text-white hover:bg-[#27272A]"
          >
            <Link href="/admin/products">Batal</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
