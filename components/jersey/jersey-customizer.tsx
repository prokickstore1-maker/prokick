"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Truck, Check, QrCode } from "lucide-react";
import { formatMYR } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { NormalizedJersey } from "@/lib/data";
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
}

export function JerseyCustomizer({ jersey }: JerseyCustomizerProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Size Selection
  const [selectedSize, setSelectedSize] = useState<string>(jersey.sizes[0] || "M");

  // Customization States
  const [enableNameset, setEnableNameset] = useState(false);
  const [namesetName, setNamesetName] = useState("");
  const [namesetNumber, setNamesetNumber] = useState("");

  const [enablePatch, setEnablePatch] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState(
    jersey.league === "La Liga"
      ? "La Liga Starball Patch"
      : jersey.league === "Premier League"
      ? "Premier League Golden Badge"
      : "UEFA Champions League Starball + Foundation"
  );

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Gallery Active View
  const [activeImage, setActiveImage] = useState(
    jersey.image || "/images/jerseys/madrid-home.jpg"
  );

  const basePrice = parseFloat(jersey.price);
  // fee only when a name is typed — matches server (order.ts) so display == checkout
  const hasNameset = enableNameset && namesetName.trim().length > 0;
  const namesetFee = hasNameset ? 20.0 : 0.0;
  const patchFee = enablePatch ? 10.0 : 0.0;
  const unitTotal = basePrice + namesetFee + patchFee;
  const grandTotal = unitTotal * quantity;

  // Available stock for selected size (undefined = no real count, show nothing)
  const stockForSelectedSize = jersey.stockData[selectedSize];
  const maxQty = stockForSelectedSize !== undefined ? Math.min(10, stockForSelectedSize) : 10;

  const handleAddToCart = () => {
    addItem({
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
      namesetPrice: hasNameset ? 20.0 : 0.0,
      patch: enablePatch ? selectedPatch : undefined,
      patchPrice: enablePatch ? 10.0 : 0.0,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const gallery =
    jersey.images && jersey.images.length > 0
      ? jersey.images
      : [
          { url: jersey.image || "/images/jerseys/madrid-home.jpg" },
          { url: "/images/hero/nike-hero.jpg" },
        ];

  const patchOptions = [
    "UEFA Champions League Starball + Foundation",
    "Premier League golden badge",
    "La Liga emblem",
    "FIFA World Cup Champions Badge",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 text-white">
      {/* ==========================================================================
          LEFT: MULTI-ANGLE STUDIO SHOWCASE
          ========================================================================== */}
      <div className="lg:col-span-7 space-y-4">
        {/* Main Display Container - Studio Spotlight */}
        <div className="studio-stage relative aspect-[3/4] sm:aspect-[4/3] w-full rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center p-6 sm:p-12 shadow-2xl">
          <Image
            src={activeImage}
            alt={jersey.name}
            fill
            priority
            className="object-contain p-4 sm:p-8 transition-all duration-300"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>

        {/* Multi-angle Gallery Thumbnail Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Product Images</span>
            <span>{gallery.length} Angles</span>
          </div>

          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
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
      <div className="lg:col-span-5 space-y-6 pb-28 lg:pb-0">
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
              {formatMYR(unitTotal)}
            </span>
            {unitTotal > basePrice && (
              <span className="text-xs text-zinc-400 line-through font-mono">
                Base: {formatMYR(basePrice)}
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
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white uppercase tracking-wider font-display">Select Size:</span>
            {stockForSelectedSize !== undefined && (
              <span className="text-volt font-mono text-xs font-semibold">
                {stockForSelectedSize} In Stock ({selectedSize})
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
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
                    {isOutOfStock ? "Out" : stock !== undefined ? `${stock} left` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Customizer: Nameset & Patch */}
        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-5 bg-[#121217] border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <span>Official Customization</span>
            </span>
            <span className="text-[10px] text-volt font-bold bg-volt/10 px-2 py-0.5 rounded-lg border border-volt/20">
              Free with Bundle Tiers
            </span>
          </div>

          {/* Nameset Toggle */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-zinc-200 font-semibold flex items-center gap-2">
                <Checkbox
                  checked={enableNameset}
                  onCheckedChange={(checked) => setEnableNameset(checked === true)}
                  aria-label="Add custom player name and number"
                />
                <span>Custom Player Name &amp; Number</span>
              </span>
              <span className="text-xs font-mono font-bold text-volt">
                +RM 20.00
              </span>
            </label>

            {enableNameset && (
              <div className="grid grid-cols-3 gap-2 pl-6 pt-1">
                <div className="col-span-2">
                  <Label htmlFor="nameset-name" className="sr-only">Player name</Label>
                  <Input
                    id="nameset-name"
                    type="text"
                    maxLength={12}
                    value={namesetName}
                    onChange={(e) => setNamesetName(e.target.value.toUpperCase())}
                    placeholder="NAME (E.G. BELLINGHAM)"
                    className="w-full h-auto px-3 py-2 rounded-xl bg-[#09090B] border-white/15 text-xs text-white uppercase placeholder:text-zinc-400 focus-visible:border-volt font-mono font-bold"
                  />
                </div>
                <div>
                  <Label htmlFor="nameset-number" className="sr-only">Squad number</Label>
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
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-zinc-200 font-semibold flex items-center gap-2">
                <Checkbox
                  checked={enablePatch}
                  onCheckedChange={(checked) => setEnablePatch(checked === true)}
                  aria-label="Add sleeve competition patch"
                />
                <span>Sleeve Competition Patch</span>
              </span>
              <span className="text-xs font-mono font-bold text-volt">
                +RM 10.00
              </span>
            </label>

            {enablePatch && (
              <div className="pl-6 pt-1">
                <Select value={selectedPatch} onValueChange={setSelectedPatch}>
                  <SelectTrigger className="w-full h-auto px-3 py-2 rounded-xl bg-[#09090B] border-white/15 text-xs text-white focus-visible:border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patchOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* 3. Action Buttons & Quantity */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center bg-[#121217] border border-white/10 rounded-xl px-3.5 py-2.5 gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-sm font-bold text-white px-1">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Add to Cart CTA */}
            <Button
              onClick={handleAddToCart}
              className={`hidden sm:flex flex-1 h-auto py-4 px-6 rounded-full text-xs uppercase tracking-wider font-bold shadow-lg ${
                isAdded
                  ? "bg-volt text-black hover:bg-volt scale-[1.01]"
                  : ""
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag: {formatMYR(grandTotal)}</span>
                </>
              )}
            </Button>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#121217] border border-white/8">
              <Truck className="w-4 h-4 text-volt shrink-0" />
              <span>Free Delivery on 2+ Kits</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#121217] border border-white/8">
              <QrCode className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>DuitNow QR Pay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Purchase Bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#09090B]/90 backdrop-blur-md p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          onClick={handleAddToCart}
          className={`w-full h-auto min-h-11 py-4 text-xs uppercase tracking-widest font-extrabold ${
            isAdded ? "bg-volt text-black hover:bg-volt" : ""
          }`}
        >
          {isAdded ? "Added to Bag!" : `Add to Bag · ${formatMYR(grandTotal)}`}
        </Button>
      </div>
    </div>
  );
}
