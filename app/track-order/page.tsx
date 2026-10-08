"use client";

import { useState } from "react";
import { trackOrderAction } from "@/app/actions/tracking";
import { Search, PackageCheck, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    orderNumber: string;
    status: string;
    trackingNumber?: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const r = await trackOrderAction(orderNumber.trim(), phone.trim());
      if (r.success && r.order) {
        setResult(r.order);
      } else {
        setResult(null);
        setError(r.error || "Order not found. Please check your order number and WhatsApp phone number.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] bg-[#09090B] text-white py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-volt">
            Delivery Status
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase font-display tracking-tight text-white">
            Track Your Order
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Enter your order number and WhatsApp phone number to check verification, dispatch, and courier tracking details.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="orderNumber" className="text-xs font-bold text-zinc-300">Order Number *</Label>
            <Input
              id="orderNumber"
              required
              className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-xs text-white placeholder:text-zinc-400 focus-visible:border-volt font-mono"
              placeholder="e.g. PK-20260923-8491"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trackPhone" className="text-xs font-bold text-zinc-300">WhatsApp Mobile Number *</Label>
            <Input
              id="trackPhone"
              required
              className="w-full h-auto px-4 py-3 rounded-xl bg-[#09090B] border-white/15 text-xs text-white placeholder:text-zinc-400 focus-visible:border-volt font-mono"
              placeholder="e.g. +60 12-345 6789 or 0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-auto rounded-xl px-6 py-4 text-xs uppercase tracking-wider font-black shadow-lg"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? "Searching Order..." : "Find Order"}</span>
          </Button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 bg-[#121217] border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-zinc-300" />
                <span className="font-mono font-bold text-sm text-white">{result.orderNumber}</span>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-white/10 text-zinc-300 border border-white/15">
                {result.status}
              </span>
            </div>

            {result.trackingNumber ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">Courier Tracking</span>
                  <span className="font-mono font-bold text-white text-sm">{result.trackingNumber}</span>
                </div>
                <Button asChild className="rounded-lg px-3 h-auto py-1.5 text-[11px] gap-1 font-bold">
                  <a
                    href={`https://www.pos.com.my/tracking?trackingNo=${result.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Track Pos Laju</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your order is currently in the verification stage. Tracking details will update automatically once handed to Pos Laju / J&amp;T Express.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
