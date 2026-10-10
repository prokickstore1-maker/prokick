"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  ArrowRight,
  Loader2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { calculatePromoEngine } from "@/lib/promo";
import { formatMYR } from "@/lib/utils";
import { MALAYSIAN_STATES, getShippingZoneByState } from "@/lib/malaysia";
import { createOrderAction } from "@/app/actions/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaymentOption {
  id: string;
  label: string;
  desc: string;
  badge?: string;
}


export function Checkout({ paymentOptions }: { paymentOptions: PaymentOption[] }) {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState("Selangor");

  // Payment Selection
  // default = metode pertama yang aktif dari settings admin (bukan hardcode "qr-pay")
  const [paymentMethodId, setPaymentMethodId] = useState(paymentOptions[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // key stable across retries of the same checkout attempt → dedupe double-submit
  const idemKeyRef = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentZone = getShippingZoneByState(state);

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

  const promoResult = calculatePromoEngine(promoItems, currentZone);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!customerName || !customerPhone || !streetAddress || !city || !postcode || !state) {
      setErrorMessage("Please complete all delivery details.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your shopping cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedPayment = paymentOptions.find((p) => p.id === paymentMethodId);

      const result = await createOrderAction({
        customerName,
        customerPhone,
        streetAddress,
        city,
        postcode,
        state,
        paymentMethodId,
        paymentMethodLabel: selectedPayment?.label || "Instant QR Pay",
        // stable per cart contents → double-submit / retry returns the same order
        idempotencyKey: (idemKeyRef.current ||= crypto.randomUUID()),
        items: items.map((i) => ({
          jerseyId: i.jerseyId,
          name: i.name,
          size: i.size,
          quantity: i.quantity,
          namesetName: i.namesetName,
          namesetNumber: i.namesetNumber,
          patch: i.patch,
        })),
      });

      if (!result.success || !result.orderId) {
        setErrorMessage(result.error || "Failed to create order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Clear cart on successful order creation
      clearCart();
      idemKeyRef.current = null;

      // Redirect customer to invoice page
      router.push(`/invoice/${result.orderId}`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error occurred. Please try submitting again.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#09090B] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white font-display uppercase mb-2">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          Orders of 2 or more shirts qualify for free nationwide delivery.
        </p>
        <Button asChild className="rounded-lg px-7 h-auto py-3 text-xs uppercase tracking-wider font-extrabold">
          <Link href="/jersey">Shop Kits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 sm:py-12 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1280px] mx-auto space-y-8">
        {/* Page Title */}
        <div className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-400">
            <span className="font-bold text-white uppercase tracking-wider">
              Checkout
            </span>
            <span>/</span>
            <span>Delivery to Malaysia</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-display uppercase tracking-tight">
            Shipping &amp; Payment
          </h1>
        </div>

        {errorMessage && (
          <div role="alert" className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ==========================================================================
              LEFT COLUMN: DELIVERY & PAYMENT SELECTION (7 COLS)
              ========================================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Recipient Information Card */}
            <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-5">
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-300" />
                <span>1. Malaysian Delivery Address</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="customerName" className="text-sm font-bold text-zinc-300">
                    Full Recipient Name *
                  </Label>
                  <Input
                    id="customerName"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Mohd Danial Bin Azman"
                    className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-sm text-white placeholder:text-zinc-400 focus-visible:border-volt font-medium resize-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="customerPhone" className="text-sm font-bold text-zinc-300">
                    Active WhatsApp Mobile Number *
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +60 12-345 6789 or 0123456789"
                    className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-sm text-white placeholder:text-zinc-400 focus-visible:border-volt font-mono font-medium"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="streetAddress" className="text-sm font-bold text-zinc-300">
                    Street Address / House / Unit No. *
                  </Label>
                  <Textarea
                    id="streetAddress"
                    rows={2}
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. No. 25, Jalan Kemuning 2, Seksyen 3"
                    className="w-full px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-sm text-white placeholder:text-zinc-400 focus-visible:border-volt font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-sm font-bold text-zinc-300">
                    City / Town *
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Shah Alam"
                    className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-sm text-white placeholder:text-zinc-400 focus-visible:border-volt font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="postcode" className="text-sm font-bold text-zinc-300">
                    5-Digit Postcode *
                  </Label>
                  <Input
                    id="postcode"
                    type="text"
                    required
                    maxLength={5}
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="e.g. 40000"
                    className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-sm text-white placeholder:text-zinc-400 focus-visible:border-volt font-mono font-medium"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-bold text-zinc-300">
                    State / Federal Territory *
                  </Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-sm text-white focus-visible:border-volt">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MALAYSIAN_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.name}>
                          {s.name} ({s.zone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shipping Zone & Courier Indicator */}
              <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/8 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Logistics Zone:</span>
                  <span className="font-bold text-white">{currentZone}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px]">Couriers:</span>
                  <span className="text-sm font-bold text-zinc-300">Pos Laju &bull; J&amp;T Express MY</span>
                </div>
              </div>
            </div>

            {/* 2. Payment Method Card */}
            <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-4">
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
                <QrCode className="w-4 h-4 text-zinc-300" />
                <span>2. Select Payment Method</span>
              </h2>

              <RadioGroup
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                className="space-y-3"
              >
                {paymentOptions.map((opt) => {
                  const isSelected = paymentMethodId === opt.id;
                  return (
                    <Label
                      key={opt.id}
                      htmlFor={`payment-${opt.id}`}
                      className={`flex items-start p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#181820] border-volt ring-1 ring-volt/40"
                          : "bg-[#09090B] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <RadioGroupItem
                          value={opt.id}
                          id={`payment-${opt.id}`}
                          className="mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {opt.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            {opt.desc}
                          </span>
                        </div>
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-zinc-300 border border-white/10 hidden sm:inline-flex">
                          {opt.badge}
                        </span>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          {/* ==========================================================================
              RIGHT COLUMN: ORDER SUMMARY & PROMO TIERS (5 COLS)
              ========================================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-white text-base font-display uppercase tracking-wider">Order Summary</h3>
                <span className="text-xs font-mono text-zinc-300 font-bold">
                  {promoResult.totalQuantity} {promoResult.totalQuantity === 1 ? "Kit" : "Kits"}
                </span>
              </div>

              {/* Items List Preview */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs bg-[#09090B] p-2.5 rounded-xl border border-white/8">
                    <div className="w-14 h-14 rounded-lg bg-[#181820] relative overflow-hidden shrink-0 border border-white/8 flex items-center justify-center">
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate font-display">{item.name}</h4>
                      <p className="text-[11px] text-zinc-400">
                        Size: <strong className="text-white font-mono">{item.size}</strong> &times; {item.quantity}
                      </p>
                      {item.namesetName && (
                        <p className="text-[10px] text-zinc-400 font-semibold">
                          Nameset: {item.namesetName} #{item.namesetNumber || "0"}
                        </p>
                      )}
                      {item.patch && (
                        <p className="text-[10px] text-zinc-400 truncate font-semibold">
                          Patch: {item.patch}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      {formatMYR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Gamification Card */}
              <div className="p-4 rounded-xl bg-[#09090B] border border-white/8 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    Promotions &amp; Delivery
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/10">
                    {promoResult.promoBadgeText}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-volt transition-all"
                    style={{ width: `${promoResult.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  {promoResult.nextTierMessage}
                </p>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-white/10">
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
                  <span>Shipping ({currentZone})</span>
                  {promoResult.freeShippingUnlocked ? (
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>FREE</span>
                      <span className="line-through text-zinc-400 text-[10px]">
                        {formatMYR(currentZone === "East Malaysia" ? 15 : 8)}
                      </span>
                    </span>
                  ) : (
                    <span className="font-mono text-white font-semibold">
                      {formatMYR(currentZone === "East Malaysia" ? 15 : 8)}
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

                <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white uppercase font-display">Grand Total</span>
                    <p className="text-[10px] text-zinc-400">Malaysian Ringgit (MYR)</p>
                  </div>
                  <span className="text-2xl font-black text-white font-mono">
                    {formatMYR(promoResult.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-auto rounded-full px-6 py-4 text-xs uppercase tracking-wider font-black shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Pay ({formatMYR(promoResult.grandTotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Checkout via DuitNow QR &bull; Pos Laju Tracked Delivery</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
