"use client";

import { useState } from "react";
import { createTestimonialAction, updateBannerAction, updatePaymentMethodAction, updateStoreSettingAction, createPaymentMethodAction, deletePaymentMethodAction, updateTestimonialAction, deleteTestimonialAction } from "@/app/actions/settings";
import { uploadProductImageAction } from "@/app/actions/products";
import type { Banner, PaymentMethod, Setting, Testimonial } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialSettings: Setting[];
  initialBanners: Banner[];
  initialPayments: PaymentMethod[];
  initialTestimonials: Testimonial[];
}

export function SettingsForm({ initialSettings, initialBanners, initialPayments, initialTestimonials }: Props) {
  const [status, setStatus] = useState("");
  const settingMap = Object.fromEntries(initialSettings.map((item) => [item.key, item.value]));
  const [shipping, setShipping] = useState(settingMap.javaShippingCost || "15000");
  const [eastShipping, setEastShipping] = useState(settingMap.outsideJavaShippingCost || "30000");
  const [freeItems, setFreeItems] = useState(settingMap.freeShippingMinItems || "2");
  const [namesetFee, setNamesetFee] = useState(settingMap.namesetFee || "70000");
  const [patchFee, setPatchFee] = useState(settingMap.patchFee || "35000");
  const [freePatchItems, setFreePatchItems] = useState(settingMap.freePatchMinItems || "3");
  const [freeNamesetItems, setFreeNamesetItems] = useState(settingMap.freeNamesetMinItems || "5");
  const [sulawesiBlocked, setSulawesiBlocked] = useState(settingMap.sulawesiBlocked === "1");
  const [whatsapp, setWhatsapp] = useState(settingMap.whatsappNumber || "6281234567890");
  const [runningBanner, setRunningBanner] = useState(settingMap.runningBannerText || "");
  const [telegramUsername, setTelegramUsername] = useState(settingMap.telegramUsername || "");
  const [invoiceChatButtons, setInvoiceChatButtons] = useState(settingMap.invoiceChatButtons || "both");

  async function saveSetting(key: string, value: string) {
    const result = await updateStoreSettingAction(key, value);
    setStatus(result.success ? "Settings saved" : result.error || "Save failed");
  }

  return (
    <div className="space-y-8 text-[#FAFAFA]">
      <header className="border-b border-[#27272A] pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Store configuration</p>
        <h1 className="text-3xl font-black font-display text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage homepage content, payment methods, and delivery rules.</p>
      </header>

      {status && <p role="status" className="rounded-lg border border-[#27272A] bg-[#181820] p-3 text-sm text-zinc-200">{status}</p>}

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">Delivery</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[['Ongkir Jawa (IDR)', 'javaShippingCost', shipping, setShipping], ['Ongkir Luar Jawa (IDR)', 'outsideJavaShippingCost', eastShipping, setEastShipping], ['Gratis ongkir setelah', 'freeShippingMinItems', freeItems, setFreeItems]].map(([label, key, value, setter]) => (
            <Label key={key as string} className="space-y-1 text-sm font-semibold">
              {label as string}
              <Input className="font-normal" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} onBlur={() => saveSetting(key as string, value as string)} />
            </Label>
          ))}
        </div>
        <h3 className="pt-2 text-sm font-bold uppercase tracking-wider text-zinc-400">Fee kustomisasi</h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[['Fee nameset (IDR)', 'namesetFee', namesetFee, setNamesetFee], ['Fee patch (IDR)', 'patchFee', patchFee, setPatchFee], ['Gratis patch mulai', 'freePatchMinItems', freePatchItems, setFreePatchItems], ['Gratis nameset mulai', 'freeNamesetMinItems', freeNamesetItems, setFreeNamesetItems]].map(([label, key, value, setter]) => (
            <Label key={key as string} className="space-y-1 text-sm font-semibold">
              {label as string}
              <Input className="font-normal" type="number" min={0} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} onBlur={() => saveSetting(key as string, value as string)} />
            </Label>
          ))}
        </div>
        <h3 className="pt-2 text-sm font-bold uppercase tracking-wider text-zinc-400">Ticker navbar (berjalan)</h3>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Teks running banner</Label>
          <Input
            className="w-full font-normal"
            value={runningBanner}
            onChange={(event) => setRunningBanner(event.target.value)}
            onBlur={() => saveSetting("runningBannerText", runningBanner.slice(0, 500))}
            placeholder="NEW SEASON 2026/27 DROPS | GRATIS ONGKIR MIN. 2 Kaos | QRIS & E-WALLET"
          />
          <p className="text-[11px] text-zinc-400">Pisahkan fragmen dengan tanda pipa <code>|</code> — mobile hanya menampilkan fragmen pertama. Kosongkan untuk pakai teks bawaan.</p>
        </div>
        <h3 className="pt-2 text-sm font-bold uppercase tracking-wider text-zinc-400">Blokir pengiriman</h3>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={sulawesiBlocked} onCheckedChange={(c) => { const on = c === true; setSulawesiBlocked(on); saveSetting("sulawesiBlocked", on ? "1" : "0"); }} />
          Tutup sementara pengiriman ke Sulawesi (Gorontalo termasuk) — checkout dari provinsi tersebut ditolak
        </label>
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">Contact</h2>
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
        <p className="text-xs text-zinc-400">WhatsApp: format internasional tanpa &quot;+&quot; — 6281234567890. Telegram: username tanpa @. Tombol invoice hanya tampil kalau kontaknya terisi.</p>
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">Homepage banners</h2>
        {initialBanners.map((banner) => <BannerEditor key={banner.id} banner={banner} onStatus={setStatus} />)}
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">Payment methods</h2>
        {initialPayments.length === 0 && <p className="text-sm text-zinc-400">Belum ada metode pembayaran.</p>}
        {initialPayments.map((payment) => <PaymentEditor key={payment.id} payment={payment} onStatus={setStatus} />)}
        <NewPaymentEditor onStatus={setStatus} />
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">Testimoni pembeli</h2>
        <p className="text-xs text-zinc-400">Screenshot chat WhatsApp pembeli, diisi admin. Tampil di atas footer storefront.</p>
        {initialTestimonials.map((t) => <TestimonialEditor key={t.id} testimonial={t} onStatus={setStatus} />)}
        <NewTestimonialEditor onStatus={setStatus} />
      </section>
    </div>
  );
}

// Resize sisi klien (canvas) sebelum upload
async function resizeAndUploadImage(file: File, maxDim = 1600): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) return { success: false, error: "File harus berupa gambar (JPEG, PNG, WebP)." };
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
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; } else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Gambar tidak valid"));
      img.src = dataUrl;
    });
    return await uploadProductImageAction(resized, "image/jpeg");
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Upload gagal" };
  }
}

function BannerEditor({ banner, onStatus }: { banner: Banner; onStatus: (message: string) => void }) {
  const [title, setTitle] = useState(banner.title || "");
  const [subtitle, setSubtitle] = useState(banner.subtitle || "");
  const [link, setLink] = useState(banner.link || "/jersey");
  const [image, setImage] = useState(banner.image || "");
  const [displayOrder, setDisplayOrder] = useState(String(banner.displayOrder ?? 0));
  const [isActive, setIsActive] = useState(banner.active);
  const [isUploading, setIsUploading] = useState(false);

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    const result = await resizeAndUploadImage(file, 1920);
    if (result.success && result.url) {
      setImage(result.url);
      onStatus("Gambar banner terupload — jangan lupa klik Save.");
    } else {
      onStatus(result.error || "Upload banner gagal");
    }
    setIsUploading(false);
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

  return <div className="grid gap-3 border-t border-[#27272A] pt-4">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Banner title" />
      <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} aria-label="Banner subtitle" />
      <Input value={link} onChange={(e) => setLink(e.target.value)} aria-label="Banner link" />
      <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={save}>Save</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
      <div className="flex gap-2">
        <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL gambar banner" aria-label="URL gambar banner" className="font-normal" />
        <label className="shrink-0 cursor-pointer rounded-lg border border-[#27272A] bg-[#181820] px-3 py-2 text-xs font-bold text-white hover:bg-[#27272A]">
          {isUploading ? "..." : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ""; }} />
        </label>
      </div>
      <Label className="space-y-1 text-xs font-semibold text-zinc-400">
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
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  async function handleQrUpload(file: File) {
    setIsUploadingQr(true);
    const result = await resizeAndUploadImage(file, 1200);
    if (result.success && result.url) {
      setQrImageUrl(result.url);
      const r = await updatePaymentMethodAction(payment.id, { label, accountName, accountNumber, isActive, qrImageUrl: result.url });
      if (r.success) {
        onStatus("Foto QR berhasil diunggah & langsung disimpan.");
      } else {
        onStatus("Foto QR diunggah, tapi gagal auto-save: " + (r.error || ""));
      }
    } else {
      onStatus(result.error || "Upload QR gagal");
    }
    setIsUploadingQr(false);
  }

  return <div className="grid gap-3 border-t border-[#27272A] pt-4">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1.3fr_auto]">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Payment label" />
      <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} aria-label="Account name" />
      <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} aria-label="Account number" />
      <div className="flex items-center gap-2">
        {qrImageUrl ? (
          <a href={qrImageUrl} target="_blank" rel="noreferrer" className="relative w-9 h-9 shrink-0 rounded border border-white/20 overflow-hidden bg-white" title="Lihat gambar QR">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="QR Preview" className="w-full h-full object-contain" />
          </a>
        ) : null}
        <Input value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} placeholder="QR image URL" aria-label="QR image URL" />
        <label className="shrink-0 cursor-pointer rounded-lg border border-[#27272A] bg-[#181820] px-2.5 py-2 text-xs font-bold text-white hover:bg-[#27272A] flex items-center">
          {isUploadingQr ? "..." : "Upload QR"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.currentTarget.value = ""; }} />
        </label>
      </div>
      <div className="flex gap-2">
        <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => { const r = await updatePaymentMethodAction(payment.id, { label, accountName, accountNumber, isActive, qrImageUrl: qrImageUrl || null }); onStatus(r.success ? "Payment method saved" : r.error || "Save failed"); }}>Save</Button>
        <Button variant="outline" className="h-auto px-3 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => {
          if (!window.confirm(`Hapus metode "${payment.label}"? Order lama tetap menampilkan snapshot pembayarannya.`)) return;
          const r = await deletePaymentMethodAction(payment.id);
          if (r.success) window.location.reload();
          else onStatus(r.error || "Delete failed");
        }}>Hapus</Button>
      </div>
    </div>
    <label className="flex items-center gap-2 text-sm font-medium">
      <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} /> Aktif (tampil di halaman checkout)
    </label>
  </div>;
}

function NewPaymentEditor({ onStatus }: { onStatus: (message: string) => void }) {
  const [type, setType] = useState("qr_pay");
  const [label, setLabel] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  async function handleQrUpload(file: File) {
    setIsUploadingQr(true);
    const result = await resizeAndUploadImage(file, 1200);
    if (result.success && result.url) {
      setQrImageUrl(result.url);
      onStatus("Foto QR berhasil diunggah.");
    } else {
      onStatus(result.error || "Upload QR gagal");
    }
    setIsUploadingQr(false);
  }

  return <div className="grid gap-3 border-t border-[#27272A] pt-4">
    <div className="grid gap-3 sm:grid-cols-[140px_1fr_1fr_1fr_1.3fr_auto]">
      <select className="h-9 rounded-lg border border-[#27272A] bg-[#181820] text-white px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Payment type">
        <option value="qr_pay">QR Pay</option>
        <option value="bank_transfer">Bank transfer</option>
        <option value="ewallet">E-wallet</option>
      </select>
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nama (cth. BCA / QRIS)" aria-label="Payment label baru" />
      <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Nama rekening" aria-label="Account name baru" />
      <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Nomor rekening" aria-label="Account number baru" />
      <div className="flex items-center gap-2">
        {qrImageUrl ? (
          <a href={qrImageUrl} target="_blank" rel="noreferrer" className="relative w-9 h-9 shrink-0 rounded border border-white/20 overflow-hidden bg-white" title="Lihat gambar QR">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="QR Preview" className="w-full h-full object-contain" />
          </a>
        ) : null}
        <Input value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} placeholder="QR image URL (opsional)" aria-label="QR image URL baru" />
        <label className="shrink-0 cursor-pointer rounded-lg border border-[#27272A] bg-[#181820] px-2.5 py-2 text-xs font-bold text-white hover:bg-[#27272A] flex items-center">
          {isUploadingQr ? "..." : "Upload QR"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.currentTarget.value = ""; }} />
        </label>
      </div>
      <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => {
        const r = await createPaymentMethodAction(type, { label, accountName, accountNumber, qrImageUrl: qrImageUrl || null });
        if (r.success) { onStatus("Metode pembayaran ditambahkan"); window.location.reload(); }
        else onStatus(r.error || "Add failed");
      }}>Tambah</Button>
    </div>
  </div>;
}

type TestimonialDraft = { name: string; rating: number; comment: string; club: string; proofImage: string };

function TestimonialFields({ draft, setDraft, onStatus }: { draft: TestimonialDraft; setDraft: (d: TestimonialDraft) => void; onStatus: (m: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleProofUpload(file: File) {
    setIsUploading(true);
    const result = await resizeAndUploadImage(file, 1400);
    if (result.success && result.url) {
      setDraft({ ...draft, proofImage: result.url });
      onStatus("Screenshot terupload — klik Simpan.");
    } else {
      onStatus(result.error || "Upload screenshot gagal");
    }
    setIsUploading(false);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nama pembeli" aria-label="Nama pembeli" />
        <Input value={draft.club} onChange={(e) => setDraft({ ...draft, club: e.target.value })} placeholder="Klub (opsional)" aria-label="Klub" />
        <Label className="space-y-1 text-xs font-semibold text-zinc-400">
          Rating
          <select
            value={draft.rating}
            onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}
            aria-label="Rating"
            className="w-full rounded-lg border border-[#27272A] bg-[#181820] px-3 py-2 text-sm text-white"
          >
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Label>
      </div>
      <Input value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} placeholder="Isi testimoni (ringkas dari chat)" aria-label="Isi testimoni" className="font-normal" />
      <div className="flex gap-2">
        <Input value={draft.proofImage} onChange={(e) => setDraft({ ...draft, proofImage: e.target.value })} placeholder="URL screenshot WhatsApp (opsional)" aria-label="URL screenshot" className="font-normal" />
        <label className="shrink-0 cursor-pointer rounded-lg border border-[#27272A] bg-[#181820] px-3 py-2 text-xs font-bold text-white hover:bg-[#27272A] flex items-center">
          {isUploading ? "..." : "Upload screenshot"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProofUpload(f); e.currentTarget.value = ""; }} />
        </label>
      </div>
    </>
  );
}

function TestimonialEditor({ testimonial, onStatus }: { testimonial: Testimonial; onStatus: (m: string) => void }) {
  const [draft, setDraft] = useState<TestimonialDraft>({
    name: testimonial.name,
    rating: testimonial.rating,
    comment: testimonial.comment,
    club: testimonial.club || "",
    proofImage: testimonial.proofImage || "",
  });
  const [isActive, setIsActive] = useState(testimonial.active);

  return (
    <div className="space-y-3 border-t border-[#27272A] pt-4">
      <TestimonialFields draft={draft} setDraft={setDraft} onStatus={onStatus} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} /> Tampil di storefront
        </label>
        <Button className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => {
          const r = await updateTestimonialAction(testimonial.id, { ...draft, club: draft.club || undefined, proofImage: draft.proofImage || undefined }, isActive);
          onStatus(r.success ? "Testimoni tersimpan" : r.error || "Save failed");
        }}>Simpan</Button>
        <Button variant="outline" className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold border-red-900 text-red-300 hover:bg-red-950/40 hover:text-red-200" onClick={async () => {
          if (!window.confirm(`Hapus testimoni dari ${testimonial.name}?`)) return;
          const r = await deleteTestimonialAction(testimonial.id);
          if (r.success) { onStatus("Testimoni dihapus"); window.location.reload(); }
          else onStatus(r.error || "Delete failed");
        }}>Hapus</Button>
      </div>
    </div>
  );
}

function NewTestimonialEditor({ onStatus }: { onStatus: (m: string) => void }) {
  const [draft, setDraft] = useState<TestimonialDraft>({ name: "", rating: 5, comment: "", club: "", proofImage: "" });

  return (
    <div className="space-y-3 border-t border-[#27272A] pt-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Tambah testimoni</h3>
      <TestimonialFields draft={draft} setDraft={setDraft} onStatus={onStatus} />
      <Button variant="outline" className="h-auto px-4 py-2 text-xs uppercase tracking-wider font-bold" onClick={async () => {
        const r = await createTestimonialAction({ ...draft, club: draft.club || undefined, proofImage: draft.proofImage || undefined });
        if (r.success) { onStatus("Testimoni ditambahkan"); window.location.reload(); }
        else onStatus(r.error || "Add failed");
      }}>Tambah</Button>
    </div>
  );
}
