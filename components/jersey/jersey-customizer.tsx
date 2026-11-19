"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Truck, Check, QrCode, ArrowRight } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { NormalizedJersey } from "@/lib/data";
import { SizeGuideModal } from "@/components/jersey/size-guide-modal";
import { getAvailablePatches } from "@/lib/patches";
import { isJacket } from "@/lib/product-lines";
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

interface JerseyCustomizerProps {
  jersey: NormalizedJersey;
  namesetFee: number;
  patchFee: number;
  freeShippingMinItems?: number;
  promoFreeShipping?: boolean;
  promoFreeNameset?: boolean;
  promoFreePatch?: boolean;
  promoCustomizationScope?: "one" | "all";
}

export function JerseyCustomizer({
  jersey,
  namesetFee,
  patchFee,
  freeShippingMinItems = 2,
  promoFreeShipping = false,
  promoFreeNameset = false,
  promoFreePatch = false,
  promoCustomizationScope = "one",
}: JerseyCustomizerProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const closeCart = useCartStore((state) => state.closeCart);
  const jacket = isJacket(jersey);

  // Size Selection — default ke ukuran pertama yang berstok (konsisten jersey-card)
  const firstInStock = jersey.sizes.find((s) => {
    const stock = jersey.stockData?.[s];
    return stock === undefined || stock > 0;
  }) || jersey.sizes[0] || "M";
  const [selectedSize, setSelectedSize] = useState<string>(firstInStock);

  // Customization States
  const [enableNameset, setEnableNameset] = useState(false);
  const [namesetName, setNamesetName] = useState("");
  const [namesetNumber, setNamesetNumber] = useState("");

  const [enablePatch, setEnablePatch] = useState(false);
  const patchOptions = getAvailablePatches(jersey);
  const [selectedPatch, setSelectedPatch] = useState(patchOptions[0].label);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  // per-gambar: "main" = foto utama, angka = index thumbnail. false = gagal load
  const [imgOk, setImgOk] = useState<Record<string, boolean>>({});

  const [activeImage, setActiveImage] = useState(jersey.image || "");

  const basePrice = parseFloat(jersey.price);
  // fee hanya saat nama diketik — sama dengan server (order.ts)
  const hasNameset = !jacket && enableNameset && namesetName.trim().length > 0;
  const rawNamesetTotal = hasNameset ? namesetFee * quantity : 0;
  const namesetDiscountPreview =
    promoFreeNameset && hasNameset
      ? promoCustomizationScope === "all"
        ? rawNamesetTotal
        : Math.min(rawNamesetTotal, namesetFee)
      : 0;
  const rawPatchTotal = !jacket && enablePatch ? patchFee * quantity : 0;
  const patchDiscountPreview =
    promoFreePatch && !jacket && enablePatch
      ? promoCustomizationScope === "all"
        ? rawPatchTotal
        : Math.min(rawPatchTotal, patchFee)
      : 0;
  const grandTotal =
    basePrice * quantity + (rawNamesetTotal - namesetDiscountPreview) + (rawPatchTotal - patchDiscountPreview);
  const unitTotal =
    basePrice +
    (hasNameset && !promoFreeNameset ? namesetFee : 0) +
    (!jacket && enablePatch && !promoFreePatch ? patchFee : 0);

  // Available stock for selected size (undefined = no real count, show nothing)
  const stockForSelectedSize = jersey.stockData[selectedSize];
  const maxQty = stockForSelectedSize !== undefined ? Math.min(10, stockForSelectedSize) : 10;

  const buildCartPayload = () => ({
    jerseyId: jersey.id,
    name: jersey.name,
    team: jersey.team,
    league: jersey.league,
    price: basePrice,
    image: jersey.image || activeImage,
    size: selectedSize,
    quantity,
    namesetName: hasNameset ? namesetName.toUpperCase().trim() : undefined,
    namesetNumber: hasNameset ? namesetNumber.trim() : undefined,
    namesetPrice: hasNameset ? namesetFee : 0,
    patch: !jacket && enablePatch ? selectedPatch : undefined,
    patchPrice: !jacket && enablePatch ? patchFee : 0,
  });

  const handleAddToCart = () => {
    addItem(buildCartPayload());
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(buildCartPayload());
    closeCart();
    router.push("/cart");
  };

  const gallery =
    jersey.images && jersey.images.length > 0
      ? jersey.images
      : jersey.image
      ? [{ url: jersey.image }]
      : [];

  const mainSrc = activeImage || jersey.image || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 text-white min-w-0 w-full max-w-full">
      {/* ==========================================================================
          LEFT: MULTI-ANGLE STUDIO SHOWCASE
          ========================================================================== */}
      <div className="lg:col-span-7 space-y-4 min-w-0 w-full max-w-full">
        {/* Main Display Container - Studio Spotlight */}
        <div className="studio-stage relative aspect-[3/4] sm:aspect-[4/3] w-full rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center p-6 sm:p-12 shadow-2xl">
          <Image
            src={mainSrc}
            alt={jersey.name}
            fill
            priority
            onError={() => setImgOk((p) => ({ ...p, main: false }))}
            className="object-contain p-4 sm:p-8 transition-all duration-300"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>

        {/* Multi-angle Gallery Thumbnail Selector */}
        <div className="space-y-2 min-w-0 w-full max-w-full">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Product Images</span>
            <span>{gallery.length} Angles</span>
          </div>

          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none min-w-0 w-full max-w-full">
            {gallery.map((img, idx) => {
              const isSelected = activeImage === img.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img.url)}
                  className={`group relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border transition-all bg-[#121217] cursor-pointer flex flex-col items-center justify-between p-1.5 ${
                    isSelected
                      ? "border-volt ring-2 ring-volt/40 bg-[#181820]"
                      : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={img.url}
                      alt={jersey.name}
                      fill
                      className="object-contain p-1"
                      sizes="96px"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==========================================================================
          RIGHT: SPECIFICATIONS & INTERACTIVE CUSTOMIZER
          ========================================================================== */}
      <div className="lg:col-span-5 space-y-6 min-w-0 w-full max-w-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/10 text-zinc-300 border border-white/15">
              {jersey.league}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {jersey.type}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display uppercase tracking-tight mb-3">
            {jersey.name}
          </h1>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatIDR(unitTotal)}
            </span>
            {unitTotal > basePrice && (
              <span className="text-xs text-zinc-400 line-through font-mono">
                Base: {formatIDR(basePrice)}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {jersey.description && (
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            {jersey.description}
          </p>
        )}

        {/* 1. Size Selector */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
            <span className="font-bold text-white uppercase tracking-wider font-display">Pilih Ukuran:</span>
            <div className="flex flex-wrap items-center gap-3">
              {stockForSelectedSize !== undefined && (
                <span className="text-volt font-mono text-xs font-semibold">
                  Tersedia {stockForSelectedSize} pcs ({selectedSize})
                </span>
              )}
              <SizeGuideModal isJacket={jacket} />
            </div>
          </div>

          <div className="grid grid-cols-3 min-[380px]:grid-cols-5 gap-2 sm:gap-2.5">
            {jersey.sizes.map((size) => {
              const stock = jersey.stockData[size];
              const isSelected = selectedSize === size;
              const isOutOfStock = stock !== undefined && stock <= 0;

              return (
                <button
                  key={size}
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl border text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-white text-black border-white shadow-lg scale-102"
                      : isOutOfStock
                      ? "bg-white/5 text-zinc-400 border-white/5 opacity-60 cursor-not-allowed line-through"
                      : "bg-[#121217] text-zinc-200 border-white/10 hover:border-white/30 hover:bg-[#181820]"
                  }`}
                >
                  <span className="text-sm font-black">{size}</span>
                  <span className={`text-[9px] ${isSelected ? "text-zinc-700 font-bold" : "text-zinc-400"}`}>
                    {isOutOfStock ? "Habis" : stock !== undefined ? `Sisa ${stock}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Customizer: Nameset & Patch (hanya jersey) */}
        {!jacket && (
        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-4 sm:p-5 bg-[#121217] border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <span>Sablon &amp; Patch (Opsional)</span>
            </span>
            <span className="text-[10px] text-volt font-bold bg-volt/10 px-2 py-0.5 rounded-lg border border-volt/20">
              Bisa Gratis Sesuai Promo
            </span>
          </div>

          {/* Nameset Toggle */}
          <div className="space-y-2.5 pt-1">
            <label className="flex flex-wrap items-center justify-between gap-2 cursor-pointer">
              <span className="text-xs text-zinc-200 font-semibold flex items-center gap-2 min-w-0">
                <Checkbox
                  checked={enableNameset}
                  onCheckedChange={(checked) => setEnableNameset(checked === true)}
                  aria-label="Tambah custom nama dan nomor punggung"
                  className="shrink-0"
                />
                <span className="leading-snug">Custom Nama &amp; Nomor Punggung</span>
              </span>
              {promoFreeNameset ? (
                <span className="text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                  <span className="line-through text-zinc-500 text-[10px]">+{formatIDR(namesetFee)}</span>
                  <span className="text-emerald-400">GRATIS{promoCustomizationScope === "one" ? " (1x)" : ""}</span>
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-volt shrink-0">
                  +{formatIDR(namesetFee)}
                </span>
              )}
            </label>

            {enableNameset && (
              <div className="grid grid-cols-3 gap-2 pl-6 pt-1">
                <div className="col-span-2">
                  <Label htmlFor="nameset-name" className="sr-only">Nama Punggung</Label>
                  <Input
                    id="nameset-name"
                    type="text"
                    maxLength={12}
                    value={namesetName}
                    onChange={(e) => setNamesetName(e.target.value.toUpperCase())}
                    placeholder="NAMA (CONTOH: BELLINGHAM)"
                    className="w-full h-auto px-3 py-2 rounded-xl bg-[#09090B] border-white/15 text-xs text-white uppercase placeholder:text-zinc-400 focus-visible:border-volt font-mono font-bold"
                  />
                </div>
                <div>
                  <Label htmlFor="nameset-number" className="sr-only">Nomor Punggung</Label>
                  <Input
                    id="nameset-number"
                    type="number"
                    min={0}
                    max={99}
                    value={namesetNumber}
                    onChange={(e) => setNamesetNumber(e.target.value)}
                    placeholder="NO (0-99)"
                    className="w-full h-auto px-3 py-2 rounded-xl bg-[#09090B] border-white/15 text-xs text-white placeholder:text-zinc-400 focus-visible:border-volt font-mono font-bold text-center"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sleeve Patch Toggle */}
          <div className="space-y-2.5 pt-2 border-t border-white/8">
            <label className="flex flex-wrap items-center justify-between gap-2 cursor-pointer">
              <span className="text-xs text-zinc-200 font-semibold flex items-center gap-2 min-w-0">
                <Checkbox
                  checked={enablePatch}
                  onCheckedChange={(checked) => setEnablePatch(checked === true)}
                  aria-label="Tambah patch lengan"
                  className="shrink-0"
                />
                <span className="leading-snug">Patch Lengan (UCL / Liga)</span>
              </span>
              {promoFreePatch ? (
                <span className="text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                  <span className="line-through text-zinc-500 text-[10px]">+{formatIDR(patchFee)}</span>
                  <span className="text-emerald-400">GRATIS{promoCustomizationScope === "one" ? " (1x)" : ""}</span>
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-volt shrink-0">
                  +{formatIDR(patchFee)}
                </span>
              )}
            </label>

            {enablePatch && (
              <div className="pl-6 pt-1">
                <Select value={selectedPatch} onValueChange={setSelectedPatch}>
                  <SelectTrigger className="w-full h-auto px-3 py-2 rounded-xl bg-[#09090B] border-white/15 text-xs text-white focus-visible:border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patchOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        )}

        {/* 3. Action Buttons & Quantity */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap min-[360px]:flex-nowrap items-center gap-2.5">
            {/* Quantity Selector */}
            <div className="flex items-center bg-[#121217] border border-white/10 rounded-xl px-2 sm:px-3.5 py-1.5 sm:py-2 gap-1.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="min-w-9 min-h-9 sm:min-w-10 sm:min-h-10 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm cursor-pointer"
                aria-label="Kurangi jumlah"
              >
                -
              </button>
              <span className="font-mono text-sm font-bold text-white px-1">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="min-w-9 min-h-9 sm:min-w-10 sm:min-h-10 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm cursor-pointer"
                aria-label="Tambah jumlah"
              >
                +
              </button>
            </div>

            {/* Tambah ke Keranjang */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddToCart}
              className={`flex-1 min-w-[140px] h-auto py-3.5 sm:py-4 px-3 sm:px-4 rounded-full text-xs uppercase tracking-wider font-bold border-white/20 bg-[#121217] text-white hover:bg-white/10 hover:text-white ${
                isAdded ? "border-volt text-volt" : ""
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Masuk Keranjang!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>+ Keranjang</span>
                </>
              )}
            </Button>
          </div>

          {/* Beli Sekarang (Langsung ke Halaman Checkout) */}
          <Button
            type="button"
            onClick={handleBuyNow}
            className="w-full h-auto py-4 px-4 sm:px-6 rounded-full text-xs uppercase tracking-wider font-black shadow-lg"
          >
            <span>Beli Sekarang • {formatIDR(grandTotal)}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>

          {/* Panduan singkat 3 langkah cara pesan */}
          <div className="rounded-xl bg-[#121217] border border-white/10 p-3 text-[11px] text-zinc-300 leading-relaxed">
            <span className="font-bold text-volt">Cara Pesan:</span> 1. Pilih ukuran → 2. Klik{" "}
            <strong className="text-white">Beli Sekarang</strong> (atau{" "}
            <strong className="text-white">+ Keranjang</strong> jika ingin tambah item lain) → 3. Isi alamat &amp; bayar via QRIS/Transfer.
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-xs text-zinc-400 pt-1">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#121217] border border-white/8">
              <Truck className="w-4 h-4 text-volt shrink-0" />
              <span>
                {promoFreeShipping
                  ? "Gratis Ongkir Tanpa Minimal!"
                  : `Gratis Ongkir Min. ${freeShippingMinItems} ${jacket ? "Item" : "Kaos"}`}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#121217] border border-white/8">
              <QrCode className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>QRIS &amp; Transfer Bank</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
