"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { calculatePromoEngine } from "@/lib/promo";
import { formatMYR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const SHIPPING_FEE = { "Peninsular Malaysia": 8, "East Malaysia": 15 } as const;

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, shippingZone, setShippingZone } = useCartStore();

  // Convert cart items to promo calculation items
  const promoItems = items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    hasNameset: Boolean(i.namesetName && i.namesetName.trim()),
    namesetPrice: i.namesetPrice ?? 20.0,
    hasPatch: Boolean(i.patch && i.patch.trim()),
    patchPrice: i.patchPrice ?? 10.0,
  }));

  const promoResult = calculatePromoEngine(promoItems, shippingZone);
  const shippingFee = SHIPPING_FEE[shippingZone === "East Malaysia" ? "East Malaysia" : "Peninsular Malaysia"];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="w-screen sm:max-w-md p-0 gap-0 bg-[#181820] border-l-white/10 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <SheetTitle className="sr-only">Shopping Bag</SheetTitle>
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-volt" />
            <span className="text-base font-black text-white font-display uppercase tracking-tight">Shopping Bag</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-zinc-300 text-xs font-mono font-bold border border-white/10">
              {promoResult.totalQuantity} {promoResult.totalQuantity === 1 ? "Kit" : "Kits"}
            </span>
          </div>
        </div>

        {/* Dynamic Smart Promo Progress Bar Banner */}
        <div className="px-5 py-4 bg-[#181820] border-b border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-volt uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          Matchday Bundle Tier
            </span>
            <span className="font-mono text-[11px] text-zinc-400 font-semibold">
              {promoResult.totalQuantity}/5 Kits
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              className="h-full bg-volt transition-all duration-500 rounded-full"
              style={{ width: `${promoResult.progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-zinc-300 font-medium leading-tight">
            {promoResult.nextTierMessage}
          </p>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Your bag is empty</h3>
              <p className="text-xs text-zinc-400 max-w-xs mb-6">
                Add 2 or more football shirts to qualify for free nationwide delivery.
              </p>
              <Button asChild className="rounded-lg px-6 h-auto py-2.5 text-xs uppercase tracking-wider font-extrabold">
                <Link href="/jersey" onClick={closeCart}>
                  Shop Kits
                </Link>
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#181820] border border-white/8 hover:border-white/15 flex gap-3 relative group transition"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-[#09090B] relative overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-zinc-100 truncate font-display">{item.name}</h4>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1 min-w-8 min-h-8 flex items-center justify-center cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-300 border border-white/10">
                      Size: <strong className="text-white">{item.size}</strong>
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      {formatMYR(item.price)}
                    </span>
                  </div>

                  {/* Customization Details */}
                  {(item.namesetName || item.patch) && (
                    <div className="mt-1.5 space-y-0.5">
                      {item.namesetName && (
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                          <span className="text-harimau font-bold">Nameset:</span>
                          <span className="text-zinc-200 font-semibold">{item.namesetName} #{item.namesetNumber || "0"}</span>
                        </div>
                      )}
                      {item.patch && (
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                          <span className="text-zinc-300 font-bold">Patch:</span>
                          <span className="text-zinc-200 font-semibold truncate">{item.patch}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/6">
                    <span className="text-[11px] text-zinc-400">Qty</span>
                    <div className="flex items-center gap-1 bg-[#09090B] rounded-lg px-1 py-0.5 border border-white/10">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="min-w-8 min-h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold text-white px-1">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="min-w-8 min-h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {items.length > 0 && (
          <div className="p-5 bg-[#181820] border-t border-white/10 space-y-3">
            {/* Malaysian Shipping Zone Switcher */}
            <div>
              <span className="text-[11px] text-zinc-400 font-semibold block mb-1.5 font-mono">
                Shipping Destination:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setShippingZone("Peninsular Malaysia")}
                  aria-pressed={shippingZone === "Peninsular Malaysia"}
                  className={`px-3 py-2 min-h-11 rounded-lg border font-bold transition-all cursor-pointer ${
                    shippingZone === "Peninsular Malaysia"
                      ? "bg-white border-white text-black"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  Peninsular (WM)
                </button>
                <button
                  onClick={() => setShippingZone("East Malaysia")}
                  aria-pressed={shippingZone === "East Malaysia"}
                  className={`px-3 py-2 min-h-11 rounded-lg border font-bold transition-all cursor-pointer ${
                    shippingZone === "East Malaysia"
                      ? "bg-white border-white text-black"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  Sabah &amp; Sarawak (EM)
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-white/10">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-white font-semibold">{formatMYR(promoResult.rawSubtotal)}</span>
              </div>

              {promoResult.customizationTotal > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Customization (Nameset/Patch)</span>
                  <span className="font-mono text-white font-semibold">{formatMYR(promoResult.customizationTotal)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-zinc-400">
                <span>Shipping Fee</span>
                {promoResult.freeShippingUnlocked ? (
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>FREE</span>
                    <span className="line-through text-zinc-400 text-[10px]">
                      {formatMYR(shippingFee)}
                    </span>
                  </span>
                ) : (
                  <span className="font-mono text-white font-semibold">
                    {formatMYR(shippingFee)}
                  </span>
                )}
              </div>

              {promoResult.patchDiscount > 0 && (
                <div className="flex justify-between text-zinc-300 font-medium">
                  <span>Bundle Promo (Free Patch)</span>
                  <span className="font-mono">-{formatMYR(promoResult.patchDiscount)}</span>
                </div>
              )}

              {promoResult.namesetDiscount > 0 && (
                <div className="flex justify-between text-zinc-300 font-medium">
                  <span>Bundle Promo (Free Nameset)</span>
                  <span className="font-mono">-{formatMYR(promoResult.namesetDiscount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-white uppercase font-display">Total</span>
                  <p className="text-[10px] text-zinc-400">All discounts applied</p>
                </div>
                <span className="text-xl font-black text-white font-mono">
                  {formatMYR(promoResult.grandTotal)}
                </span>
              </div>
            </div>

            {/* Checkout CTA Button */}
            <Button asChild className="w-full h-auto min-h-11 rounded-full px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg">
              <Link href="/cart" onClick={closeCart}>
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
