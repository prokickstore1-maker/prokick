"use client";

import { useState } from "react";
import { updateBannerAction, updatePaymentMethodAction, updateStoreSettingAction } from "@/app/actions/settings";
import { uploadProductImageAction } from "@/app/actions/products";
import type { Banner, PaymentMethod, Setting } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [shipping, setShipping] = useState(settingMap.javaShippingCost || "15000");
  const [eastShipping, setEastShipping] = useState(settingMap.outsideJavaShippingCost || "30000");
  const [freeItems, setFreeItems] = useState(settingMap.freeShippingMinItems || "2");
  const [whatsapp, setWhatsapp] = useState(settingMap.whatsappNumber || "6281234567890");
  const [telegramUsername, setTelegramUsername] = useState(settingMap.telegramUsername || "");
  const [invoiceChatButtons, setInvoiceChatButtons] = useState(settingMap.invoiceChatButtons || "both");

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
          {[['Ongkir Jawa (IDR)', 'javaShippingCost', shipping, setShipping], ['Ongkir Luar Jawa (IDR)', 'outsideJavaShippingCost', eastShipping, setEastShipping], ['Gratis ongkir setelah', 'freeShippingMinItems', freeItems, setFreeItems]].map(([label, key, value, setter]) => (
            <Label key={key as string} className="space-y-1 text-sm font-semibold">
              {label as string}
              <Input className="font-normal" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} onBlur={() => saveSetting(key as string, value as string)} />
            </Label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
        <h2 className="text-lg font-bold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Label className="space-y-1 text-sm font-semibold">
            WhatsApp number
            <Input className="font-normal" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} onBlur={() => saveSetting("whatsappNumber", whatsapp.replace(/\D/g, ""))} placeholder="6281234567890" />
          </Label>
          <Label className="space-y-1 text-sm font-semibold">
            Telegram username
            <Input className="font-normal" value={telegramUsername} onChange={(event) => setTelegramUsername(event.target.value)} onBlur={() => saveSetting("telegramUsername", telegramUsername.replace(/^@/, ""))} placeholder="prokick_admin" />
          </Label>
        </div>
        <Label className="space-y-1 text-sm font-semibold">
          Tombol chat di halaman invoice
          <div className="flex flex-wrap gap-4 pt-1 text-sm font-normal">
            {[["wa", "WhatsApp saja"], ["telegram", "Telegram saja"], ["both", "Keduanya"]].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="radio" name="invoiceChatButtons" value={value} checked={invoiceChatButtons === value} onChange={() => { setInvoiceChatButtons(value); saveSetting("invoiceChatButtons", value); }} /> {label}
              </label>
            ))}
          </div>
        </Label>
        <p className="text-xs text-[#57534E]">WhatsApp: format internasional tanpa &quot;+&quot; — 6281234567890. Telegram: username tanpa @. Tombol invoice hanya tampil kalau kontaknya terisi.</p>
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
  const [image, setImage] = useState(banner.image || "");
  const [displayOrder, setDisplayOrder] = useState(String(banner.displayOrder ?? 0));
  const [isActive, setIsActive] = useState(banner.active);
  const [isUploading, setIsUploading] = useState(false);

  // resize sisi klien (canvas) sebelum upload — pola sama dengan product-manager
  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) { onStatus("File harus gambar."); return; }
    setIsUploading(true);
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
      if (result.success) { setImage(result.url); onStatus("Gambar banner terupload — jangan lupa simpan."); }
      else onStatus(result.error || "Upload failed");
    } catch (e) {
      onStatus(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function save() {
    const r = await updateBannerAction(banner.id, {
      title, subtitle, link,
      image: image || undefined,
      displayOrder: Number(displayOrder),
      active: isActive,
    });
    onStatus(r.success ? "Banner saved" : r.error || "Save failed");
  }

  return <div className="grid gap-3 border-t border-[#E5E5E5] pt-4">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Banner title" />
      <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} aria-label="Banner subtitle" />
      <Input value={link} onChange={(e) => setLink(e.target.value)} aria-label="Banner link" />
      <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={save}>Save</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
      <div className="flex gap-2">
        <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL gambar banner" aria-label="URL gambar banner" className="font-normal" />
        <label className="shrink-0 cursor-pointer rounded-lg border border-[#E5E5E5] bg-[#FAFAF9] px-3 py-2 text-xs font-bold hover:bg-[#F5F5F5]">
          {isUploading ? "..." : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ""; }} />
        </label>
      </div>
      <Label className="space-y-1 text-xs font-semibold text-[#57534E]">
        Urutan
        <Input className="font-normal" type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
      </Label>
    </div>
    <label className="flex items-center gap-2 text-sm font-medium">
      <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} /> Aktif (tampil di homepage)
    </label>
  </div>;
}

function PaymentEditor({ payment, onStatus }: { payment: PaymentMethod; onStatus: (message: string) => void }) {
  const [label, setLabel] = useState(payment.label);
  const [accountName, setAccountName] = useState(payment.accountName || "");
  const [accountNumber, setAccountNumber] = useState(payment.accountNumber || "");
  const [qrImageUrl, setQrImageUrl] = useState(payment.qrImageUrl || "");
  const [isActive, setIsActive] = useState(payment.isActive);
  return <div className="grid gap-3 border-t border-[#E5E5E5] pt-4">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Payment label" />
      <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} aria-label="Account name" />
      <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} aria-label="Account number" />
      <Input value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} placeholder="QR image URL" aria-label="QR image URL" />
      <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => { const r = await updatePaymentMethodAction(payment.id, { label, accountName, accountNumber, isActive, qrImageUrl: qrImageUrl || null }); onStatus(r.success ? "Payment method saved" : r.error || "Save failed"); }}>Save</Button>
    </div>
    <label className="flex items-center gap-2 text-sm font-medium">
      <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} /> Aktif (tampil di halaman checkout)
    </label>
  </div>;
}
