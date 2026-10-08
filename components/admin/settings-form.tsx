"use client";

import { useState } from "react";
import { updateBannerAction, updatePaymentMethodAction, updateStoreSettingAction } from "@/app/actions/settings";
import type { Banner, PaymentMethod, Setting } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialSettings: Setting[];
  initialBanners: Banner[];
  initialPayments: PaymentMethod[];
}

export function SettingsForm({ initialSettings, initialBanners, initialPayments }: Props) {
  const [status, setStatus] = useState("");
  const settingMap = Object.fromEntries(initialSettings.map((item) => [item.key, item.value]));
  const [shipping, setShipping] = useState(settingMap.peninsularShippingCost || "8.00");
  const [eastShipping, setEastShipping] = useState(settingMap.eastShippingCost || "15.00");
  const [freeItems, setFreeItems] = useState(settingMap.freeShippingMinItems || "2");

  async function saveSetting(key: string, value: string) {
    const result = await updateStoreSettingAction(key, value);
    setStatus(result.success ? "Settings saved" : result.error || "Save failed");
  }

  return (
    <div className="space-y-8 text-[#0C0A09]">
      <header className="border-b border-[#E5E5E5] pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Store configuration</p>
        <h1 className="text-3xl font-black font-display">Settings</h1>
        <p className="mt-1 text-sm text-[#57534E]">Manage homepage content, payment methods, and delivery rules.</p>
      </header>

      {status && <p role="status" className="rounded-lg bg-[#FAFAF9] p-3 text-sm">{status}</p>}

      <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
        <h2 className="text-lg font-bold">Delivery</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[['Peninsular rate', 'peninsularShippingCost', shipping, setShipping], ['East rate', 'eastShippingCost', eastShipping, setEastShipping], ['Free delivery after', 'freeShippingMinItems', freeItems, setFreeItems]].map(([label, key, value, setter]) => (
            <Label key={key as string} className="space-y-1 text-sm font-semibold">
              {label as string}
              <Input className="font-normal" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} onBlur={() => saveSetting(key as string, value as string)} />
            </Label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
        <h2 className="text-lg font-bold">Homepage banners</h2>
        {initialBanners.map((banner) => <BannerEditor key={banner.id} banner={banner} onStatus={setStatus} />)}
      </section>

      <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
        <h2 className="text-lg font-bold">Payment methods</h2>
        {initialPayments.map((payment) => <PaymentEditor key={payment.id} payment={payment} onStatus={setStatus} />)}
      </section>
    </div>
  );
}

function BannerEditor({ banner, onStatus }: { banner: Banner; onStatus: (message: string) => void }) {
  const [title, setTitle] = useState(banner.title || "");
  const [subtitle, setSubtitle] = useState(banner.subtitle || "");
  const [link, setLink] = useState(banner.link || "/jersey");
  return <div className="grid gap-3 border-t border-[#E5E5E5] pt-4 sm:grid-cols-[1fr_1fr_140px_auto]">
    <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Banner title" />
    <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} aria-label="Banner subtitle" />
    <Input value={link} onChange={(e) => setLink(e.target.value)} aria-label="Banner link" />
    <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => { const r = await updateBannerAction(banner.id, { title, subtitle, link, active: banner.active }); onStatus(r.success ? "Banner saved" : r.error || "Save failed"); }}>Save</Button>
  </div>;
}

function PaymentEditor({ payment, onStatus }: { payment: PaymentMethod; onStatus: (message: string) => void }) {
  const [label, setLabel] = useState(payment.label);
  const [accountName, setAccountName] = useState(payment.accountName || "");
  const [accountNumber, setAccountNumber] = useState(payment.accountNumber || "");
  const [qrImageUrl, setQrImageUrl] = useState(payment.qrImageUrl || "");
  const isActive = payment.isActive;
  return <div className="grid gap-3 border-t border-[#E5E5E5] pt-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
    <Input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Payment label" />
    <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} aria-label="Account name" />
    <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} aria-label="Account number" />
    <Input value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} placeholder="QR image URL" aria-label="QR image URL" />
    <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => { const r = await updatePaymentMethodAction(payment.id, { label, accountName, accountNumber, isActive, qrImageUrl: qrImageUrl || null }); onStatus(r.success ? "Payment method saved" : r.error || "Save failed"); }}>Save</Button>
  </div>;
}
