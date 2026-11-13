"use client";

import { useState, useRef } from "react";
import {
  createTestimonialAction,
  updateBannerAction,
  updatePaymentMethodAction,
  updateStoreSettingAction,
  createPaymentMethodAction,
  deletePaymentMethodAction,
  updateTestimonialAction,
  deleteTestimonialAction,
} from "@/app/actions/settings";
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
  const [promoFreeShipping, setPromoFreeShipping] = useState(settingMap.promoFreeShipping === "1");
  const [promoFreeNameset, setPromoFreeNameset] = useState(settingMap.promoFreeNameset === "1");
  const [promoFreePatch, setPromoFreePatch] = useState(settingMap.promoFreePatch === "1");
  const [promoCustomizationScope, setPromoCustomizationScope] = useState<"one" | "all">(
    settingMap.promoCustomizationScope === "all" ? "all" : "one"
  );
  const [sulawesiBlocked, setSulawesiBlocked] = useState(settingMap.sulawesiBlocked === "1");
  const [whatsapp, setWhatsapp] = useState(settingMap.whatsappNumber || "6281234567890");
  const [runningBanner, setRunningBanner] = useState(settingMap.runningBannerText || "");
  const [telegramUsername, setTelegramUsername] = useState(settingMap.telegramUsername || "");
  const [invoiceChatButtons, setInvoiceChatButtons] = useState(settingMap.invoiceChatButtons || "both");
  const [instagram, setInstagram] = useState(settingMap.instagramHandle || "prokickstore");
  const [tiktok, setTiktok] = useState(settingMap.tiktokHandle || "prokickstore");

  async function saveSetting(key: string, value: string) {
    const result = await updateStoreSettingAction(key, value);
    setStatus(result.success ? "Pengaturan berhasil disimpan." : result.error || "Gagal menyimpan.");
  }

  return (
    <div className="space-y-8 text-[#FAFAFA] pb-16">
      <header className="border-b border-[#27272A] pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Store configuration</p>
        <h1 className="text-2xl sm:text-3xl font-black font-display text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage homepage content, payment methods, and delivery rules.</p>
      </header>

      {status && (
        <div
          role="status"
          className="sticky top-16 z-30 flex items-center justify-between gap-3 rounded-xl border border-[#E2F952]/30 bg-[#181820]/95 backdrop-blur px-4 py-3 text-sm font-medium text-zinc-100 shadow-lg"
        >
          <span>{status}</span>
          <button
            type="button"
            onClick={() => setStatus("")}
            className="text-xs font-bold text-zinc-400 hover:text-white px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-4 sm:p-6 space-y-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Delivery</h2>
            <p className="text-xs text-zinc-400">Aturan ongkir, fee sablon nameset/patch, dan banner pengumuman.</p>
          </div>
          <Button
            type="button"
            className="h-auto min-h-10 w-full sm:w-auto px-4 py-2.5 text-xs uppercase tracking-wider font-bold"
            onClick={async () => {
              await saveSetting("javaShippingCost", shipping);
              await saveSetting("outsideJavaShippingCost", eastShipping);
              await saveSetting("freeShippingMinItems", freeItems);
              await saveSetting("namesetFee", namesetFee);
              await saveSetting("patchFee", patchFee);
              await saveSetting("freePatchMinItems", freePatchItems);
              await saveSetting("freeNamesetMinItems", freeNamesetItems);
              await saveSetting("promoFreeShipping", promoFreeShipping ? "1" : "0");
              await saveSetting("promoFreeNameset", promoFreeNameset ? "1" : "0");
              await saveSetting("promoFreePatch", promoFreePatch ? "1" : "0");
              await saveSetting("promoCustomizationScope", promoCustomizationScope);
              await saveSetting("runningBannerText", runningBanner.slice(0, 500));
              await saveSetting("sulawesiBlocked", sulawesiBlocked ? "1" : "0");
              setStatus("Pengaturan Delivery, Promo & Ticker berhasil disimpan!");
            }}
          >
            Simpan Pengiriman &amp; Promo
          </Button>
        </div>

        {/* Saklar Promo Harian (Event 1-Klik) */}
        <div className="rounded-xl border border-[#E2F952]/25 bg-[#181820]/70 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E2F952]">
                Saklar Promo Harian (Event 1-Klik)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Aktifkan kapan saja untuk promo hari spesial (tanpa minimal beli / mulai 1 pcs). Saat dimatikan, otomatis kembali ke aturan Tier normal di bawah.
              </p>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <label
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                promoFreeShipping
                  ? "border-[#E2F952] bg-[#E2F952]/10 text-white"
                  : "border-[#27272A] bg-[#121217] text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <Checkbox
                className="mt-0.5"
                checked={promoFreeShipping}
                onCheckedChange={(c) => {
                  const on = c === true;
                  setPromoFreeShipping(on);
                  saveSetting("promoFreeShipping", on ? "1" : "0");
                }}
              />
              <div className="space-y-0.5 min-w-0">
                <span className="block text-xs font-bold">Hari Gratis Ongkir</span>
                <span className="block text-[11px] text-zinc-400 leading-snug">
                  Beli 1 item langsung Gratis Ongkir Jawa &amp; Luar Jawa.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                promoFreeNameset
                  ? "border-[#E2F952] bg-[#E2F952]/10 text-white"
                  : "border-[#27272A] bg-[#121217] text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <Checkbox
                className="mt-0.5"
                checked={promoFreeNameset}
                onCheckedChange={(c) => {
                  const on = c === true;
                  setPromoFreeNameset(on);
                  saveSetting("promoFreeNameset", on ? "1" : "0");
                }}
              />
              <div className="space-y-0.5 min-w-0">
                <span className="block text-xs font-bold">Hari Gratis Nameset</span>
                <span className="block text-[11px] text-zinc-400 leading-snug">
                  Beli 1 jersey langsung Gratis Custom Nameset.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                promoFreePatch
                  ? "border-[#E2F952] bg-[#E2F952]/10 text-white"
                  : "border-[#27272A] bg-[#121217] text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <Checkbox
                className="mt-0.5"
                checked={promoFreePatch}
                onCheckedChange={(c) => {
                  const on = c === true;
                  setPromoFreePatch(on);
                  saveSetting("promoFreePatch", on ? "1" : "0");
                }}
              />
              <div className="space-y-0.5 min-w-0">
                <span className="block text-xs font-bold">Hari Gratis Patch</span>
                <span className="block text-[11px] text-zinc-400 leading-snug">
                  Beli 1 jersey langsung Gratis Patch Lengan.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Cakupan Diskon Gratis Nameset / Patch (Saat Promo atau Tier Terbuka)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  [
                    "one",
                    "Gratis 1 Pcs per Pesanan (Order)",
                    "Potongan maksimal 1x Nameset & 1x Patch per transaksi checkout.",
                  ],
                  [
                    "all",
                    "Gratis Semua Kaos di Keranjang",
                    "Seluruh kaos yang memakai Nameset / Patch di keranjang gratis 100%.",
                  ],
                ] as const
              ).map(([val, title, desc]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setPromoCustomizationScope(val);
                    saveSetting("promoCustomizationScope", val);
                  }}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    promoCustomizationScope === val
                      ? "border-[#E2F952] bg-[#E2F952]/10 text-white"
                      : "border-[#27272A] bg-[#121217] text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <span className="block text-xs font-bold">{title}</span>
                  <span className="block text-[11px] text-zinc-400 mt-0.5 leading-snug">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {(
            [
              ["Ongkir Jawa (IDR)", "javaShippingCost", shipping, setShipping],
              ["Ongkir Luar Jawa (IDR)", "outsideJavaShippingCost", eastShipping, setEastShipping],
              ["Gratis ongkir setelah (item)", "freeShippingMinItems", freeItems, setFreeItems],
            ] as const
          ).map(([label, key, value, setter]) => (
            <div key={key} className="space-y-1.5 min-w-0">
              <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">{label}</Label>
              <Input
                className="w-full font-normal"
                value={value}
                onChange={(event) => setter(event.target.value)}
                onBlur={() => saveSetting(key, value)}
              />
            </div>
          ))}
        </div>

        <h3 className="pt-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Fee kustomisasi</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Fee nameset (IDR)", "namesetFee", namesetFee, setNamesetFee],
              ["Fee patch (IDR)", "patchFee", patchFee, setPatchFee],
              ["Gratis patch mulai (item)", "freePatchMinItems", freePatchItems, setFreePatchItems],
              ["Gratis nameset mulai (item)", "freeNamesetMinItems", freeNamesetItems, setFreeNamesetItems],
            ] as const
          ).map(([label, key, value, setter]) => (
            <div key={key} className="space-y-1.5 min-w-0">
              <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">{label}</Label>
              <Input
                className="w-full font-normal"
                type="number"
                min={0}
                value={value}
                onChange={(event) => setter(event.target.value)}
                onBlur={() => saveSetting(key, value)}
              />
            </div>
          ))}
        </div>

        <h3 className="pt-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Ticker navbar (berjalan)</h3>
        <div className="space-y-1.5 min-w-0">
          <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">Teks running banner</Label>
          <Input
            className="w-full font-normal"
            value={runningBanner}
            onChange={(event) => setRunningBanner(event.target.value)}
            onBlur={() => saveSetting("runningBannerText", runningBanner.slice(0, 500))}
            placeholder="NEW SEASON 2026/27 DROPS | GRATIS ONGKIR MIN. 2 Kaos | QRIS & E-WALLET"
          />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Pisahkan fragmen dengan tanda pipa <code>|</code> — mobile hanya menampilkan fragmen pertama. Kosongkan untuk pakai teks bawaan.
          </p>
        </div>

        <h3 className="pt-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Blokir pengiriman</h3>
        <label className="flex items-start sm:items-center gap-2.5 text-sm font-medium cursor-pointer leading-snug">
          <Checkbox
            className="mt-0.5 sm:mt-0"
            checked={sulawesiBlocked}
            onCheckedChange={(c) => {
              const on = c === true;
              setSulawesiBlocked(on);
              saveSetting("sulawesiBlocked", on ? "1" : "0");
            }}
          />
          <span>Tutup sementara pengiriman ke Sulawesi (Gorontalo termasuk) — checkout dari provinsi tersebut diarahkan ke WhatsApp Admin</span>
        </label>
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-4 sm:p-6 space-y-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Contact &amp; Social Media</h2>
            <p className="text-xs text-zinc-400">Nomor WhatsApp, Telegram, serta username Instagram &amp; TikTok untuk footer dan invoice.</p>
          </div>
          <Button
            type="button"
            className="h-auto min-h-10 w-full sm:w-auto px-4 py-2.5 text-xs uppercase tracking-wider font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={async () => {
              const cleanWa = whatsapp.replace(/\D/g, "");
              const cleanTg = telegramUsername.replace(/^@/, "");
              const cleanIg = instagram.replace(/^@/, "").trim();
              const cleanTt = tiktok.replace(/^@/, "").trim();
              await saveSetting("whatsappNumber", cleanWa);
              await saveSetting("telegramUsername", cleanTg);
              await saveSetting("invoiceChatButtons", invoiceChatButtons);
              await saveSetting("instagramHandle", cleanIg);
              await saveSetting("tiktokHandle", cleanTt);
              setStatus("Kontak WhatsApp & Akun Social Media berhasil disimpan!");
            }}
          >
            Simpan Kontak &amp; Social Media
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-1.5 min-w-0">
            <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">WhatsApp number</Label>
            <Input
              className="w-full font-normal"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              onBlur={() => saveSetting("whatsappNumber", whatsapp.replace(/\D/g, ""))}
              placeholder="6281234567890"
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">Telegram username</Label>
            <Input
              className="w-full font-normal"
              value={telegramUsername}
              onChange={(event) => setTelegramUsername(event.target.value)}
              onBlur={() => saveSetting("telegramUsername", telegramUsername.replace(/^@/, ""))}
              placeholder="prokick_admin"
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 pt-3 border-t border-[#27272A]">
          <div className="space-y-1.5 min-w-0">
            <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">Instagram Username</Label>
            <Input
              className="w-full font-normal"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              onBlur={() => saveSetting("instagramHandle", instagram.replace(/^@/, "").trim())}
              placeholder="prokickstore"
            />
            <p className="text-[11px] text-zinc-400">
              Username tanpa simbol @ (contoh: <code>prokickstore</code>)
            </p>
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">TikTok Username</Label>
            <Input
              className="w-full font-normal"
              value={tiktok}
              onChange={(event) => setTiktok(event.target.value)}
              onBlur={() => saveSetting("tiktokHandle", tiktok.replace(/^@/, "").trim())}
              placeholder="prokickstore"
            />
            <p className="text-[11px] text-zinc-400">
              Username tanpa simbol @ (contoh: <code>prokickstore</code>)
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <Label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
            Tombol chat di halaman invoice
          </Label>
          <div className="flex flex-wrap gap-4 text-sm font-normal">
            {[
              ["wa", "WhatsApp saja"],
              ["telegram", "Telegram saja"],
              ["both", "Keduanya"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer min-h-9">
                <input
                  type="radio"
                  name="invoiceChatButtons"
                  value={value}
                  checked={invoiceChatButtons === value}
                  onChange={() => {
                    setInvoiceChatButtons(value);
                    saveSetting("invoiceChatButtons", value);
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          WhatsApp: format internasional tanpa &quot;+&quot; — contoh: <strong>6281234567890</strong>. Tombol invoice hanya tampil jika nomor WA terisi.
        </p>
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-4 sm:p-6 space-y-5 overflow-hidden">
        <div>
          <h2 className="text-lg font-bold text-white">Homepage banners</h2>
          <p className="text-xs text-zinc-400">2 banner pertama tampil di Featured Editions; sisanya tampil di Hero Carousel atas.</p>
        </div>
        {initialBanners.map((banner) => (
          <BannerEditor key={banner.id} banner={banner} onStatus={setStatus} />
        ))}
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-4 sm:p-6 space-y-5 overflow-hidden">
        <div>
          <h2 className="text-lg font-bold text-white">Payment methods</h2>
          <p className="text-xs text-zinc-400">Metode pembayaran aktif yang tampil di halaman checkout.</p>
        </div>
        {initialPayments.length === 0 && <p className="text-sm text-zinc-400">Belum ada metode pembayaran.</p>}
        {initialPayments.map((payment) => (
          <PaymentEditor key={payment.id} payment={payment} onStatus={setStatus} />
        ))}
        <NewPaymentEditor onStatus={setStatus} />
      </section>

      <section className="rounded-xl border border-[#27272A] bg-[#121217] p-4 sm:p-6 space-y-5 overflow-hidden">
        <div>
          <h2 className="text-lg font-bold text-white">Testimoni pembeli</h2>
          <p className="text-xs text-zinc-400">Screenshot chat WhatsApp pembeli, diisi admin. Tampil di atas footer storefront.</p>
        </div>
        {initialTestimonials.map((t) => (
          <TestimonialEditor key={t.id} testimonial={t} onStatus={setStatus} />
        ))}
        <NewTestimonialEditor onStatus={setStatus} />
      </section>
    </div>
  );
}

// Resize sisi klien (canvas) sebelum upload
async function resizeAndUploadImage(file: File, maxDim = 1600): Promise<{ success: boolean; url?: string; error?: string }> {
  if (file.type && !file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)) {
    return { success: false, error: "File harus berupa gambar (JPEG, PNG, atau WebP)." };
  }
  try {
    const objectUrl = URL.createObjectURL(file);
    const resized = await new Promise<string>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
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
          reject(new Error("Canvas tidak tersedia"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let out = canvas.toDataURL("image/jpeg", 0.85);
        if (out.length > 4_600_000) out = canvas.toDataURL("image/jpeg", 0.72);
        if (out.length > 4_600_000) out = canvas.toDataURL("image/jpeg", 0.58);
        resolve(out);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Gambar tidak valid atau format tidak didukung"));
      };
      img.src = objectUrl;
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
      const r = await updateBannerAction(banner.id, {
        title,
        subtitle,
        link: link || "/jersey",
        image: result.url,
        displayOrder: Number(displayOrder) || 0,
        active: isActive,
      });
      onStatus(r.success ? "Gambar banner berhasil diunggah & disimpan!" : "Gambar terunggah — klik Save untuk menyimpan.");
    } else {
      onStatus(result.error || "Upload banner gagal");
    }
    setIsUploading(false);
  }

  async function save() {
    const r = await updateBannerAction(banner.id, {
      title,
      subtitle,
      link: link || "/jersey",
      image: image || undefined,
      displayOrder: Number(displayOrder) || 0,
      active: isActive,
    });
    onStatus(r.success ? "Banner berhasil disimpan!" : r.error || "Gagal menyimpan banner");
  }

  return (
    <div className="space-y-3 border-t border-[#27272A] pt-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px]">
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Judul Banner</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Banner title" />
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Subjudul</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} aria-label="Banner subtitle" />
        </div>
        <div className="space-y-1 min-w-0 sm:col-span-2 lg:col-span-1">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Link Tujuan</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/jersey" aria-label="Banner link" />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_110px_auto] items-end">
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Gambar Banner</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="URL gambar banner"
              aria-label="URL gambar banner"
              className="w-full font-normal min-w-0"
            />
            <label className="shrink-0 min-h-10 cursor-pointer rounded-lg border border-[#27272A] bg-[#181820] px-4 py-2 text-xs font-bold text-white hover:bg-[#27272A] flex items-center justify-center">
              {isUploading ? "Mengunggah…" : "Upload Foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImageUpload(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Urutan</Label>
          <Input
            className="w-full font-normal"
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </div>
        <Button className="h-auto min-h-10 w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-wider font-bold" onClick={save}>
          Save
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
        <span>Aktif (tampil di homepage)</span>
      </label>
    </div>
  );
}

function PaymentEditor({ payment, onStatus }: { payment: PaymentMethod; onStatus: (message: string) => void }) {
  const [label, setLabel] = useState(payment.label);
  const [accountName, setAccountName] = useState(payment.accountName || "");
  const [accountNumber, setAccountNumber] = useState(payment.accountNumber || "");
  const [qrImageUrl, setQrImageUrl] = useState(payment.qrImageUrl || "");
  const [isActive, setIsActive] = useState(payment.isActive);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleQrUpload(file: File) {
    setIsUploadingQr(true);
    setUploadError("");
    const result = await resizeAndUploadImage(file, 1200);
    if (result.success && result.url) {
      setQrImageUrl(result.url);
      const r = await updatePaymentMethodAction(payment.id, {
        label,
        accountName,
        accountNumber,
        isActive,
        qrImageUrl: result.url,
      });
      if (r.success) {
        onStatus("Foto QR berhasil diunggah & langsung disimpan.");
      } else {
        setUploadError("Gagal menyimpan ke database: " + (r.error || ""));
      }
    } else {
      setUploadError(result.error || "Upload QR gagal");
      onStatus(result.error || "Upload QR gagal");
    }
    setIsUploadingQr(false);
  }

  return (
    <div className="space-y-3 border-t border-[#27272A] pt-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Nama Metode</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Payment label" />
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Atas Nama</Label>
          <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} aria-label="Account name" />
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Nomor Rekening</Label>
          <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} aria-label="Account number" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {qrImageUrl ? (
            <a
              href={qrImageUrl}
              target="_blank"
              rel="noreferrer"
              className="relative w-10 h-10 shrink-0 rounded border border-white/20 overflow-hidden bg-white"
              title="Lihat gambar QR"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt="QR Preview" className="w-full h-full object-contain" />
            </a>
          ) : null}
          <Input
            value={qrImageUrl}
            onChange={(e) => setQrImageUrl(e.target.value)}
            placeholder="QR image URL (opsional)"
            aria-label="QR image URL"
            className="w-full min-w-0"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleQrUpload(f);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isUploadingQr}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none h-auto min-h-10 px-3.5 py-2 text-xs font-bold bg-[#181820] text-white hover:bg-[#27272A] border border-[#27272A]"
          >
            {isUploadingQr ? "Mengunggah…" : "Upload QR"}
          </Button>
          <Button
            className="flex-1 sm:flex-none h-auto min-h-10 px-4 py-2 text-xs uppercase tracking-wider font-bold"
            onClick={async () => {
              const r = await updatePaymentMethodAction(payment.id, {
                label,
                accountName,
                accountNumber,
                isActive,
                qrImageUrl: qrImageUrl || null,
              });
              onStatus(r.success ? "Metode pembayaran disimpan!" : r.error || "Save failed");
            }}
          >
            Save
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none h-auto min-h-10 px-3.5 py-2 text-xs uppercase tracking-wider font-bold"
            onClick={async () => {
              if (!window.confirm(`Hapus metode "${payment.label}"? Order lama tetap menampilkan snapshot pembayarannya.`)) return;
              const r = await deletePaymentMethodAction(payment.id);
              if (r.success) window.location.reload();
              else onStatus(r.error || "Delete failed");
            }}
          >
            Hapus
          </Button>
        </div>
      </div>

      {uploadError && <p className="text-xs text-red-400 font-medium">⚠️ {uploadError}</p>}
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
        <span>Aktif (tampil di halaman checkout)</span>
      </label>
    </div>
  );
}

function NewPaymentEditor({ onStatus }: { onStatus: (message: string) => void }) {
  const [type, setType] = useState("qr_pay");
  const [label, setLabel] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleQrUpload(file: File) {
    setIsUploadingQr(true);
    setUploadError("");
    const result = await resizeAndUploadImage(file, 1200);
    if (result.success && result.url) {
      setQrImageUrl(result.url);
      onStatus("Foto QR berhasil diunggah — klik Tambah untuk menyimpan metode baru.");
    } else {
      setUploadError(result.error || "Upload QR gagal");
      onStatus(result.error || "Upload QR gagal");
    }
    setIsUploadingQr(false);
  }

  return (
    <div className="space-y-3 border-t border-[#27272A] pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tambah metode pembayaran baru</h3>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <select
          className="h-10 rounded-lg border border-[#27272A] bg-[#181820] text-white px-3 text-sm w-full"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Payment type"
        >
          <option value="qr_pay">QR Pay</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="ewallet">E-wallet</option>
        </select>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nama (cth. BCA / QRIS)" aria-label="Payment label baru" />
        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Nama rekening" aria-label="Account name baru" />
        <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Nomor rekening" aria-label="Account number baru" />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {qrImageUrl ? (
            <a
              href={qrImageUrl}
              target="_blank"
              rel="noreferrer"
              className="relative w-10 h-10 shrink-0 rounded border border-white/20 overflow-hidden bg-white"
              title="Lihat gambar QR"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt="QR Preview" className="w-full h-full object-contain" />
            </a>
          ) : null}
          <Input
            value={qrImageUrl}
            onChange={(e) => setQrImageUrl(e.target.value)}
            placeholder="QR image URL (opsional)"
            aria-label="QR image URL baru"
            className="w-full min-w-0"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleQrUpload(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isUploadingQr}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none h-auto min-h-10 px-3.5 py-2 text-xs font-bold bg-[#181820] text-white hover:bg-[#27272A] border border-[#27272A]"
          >
            {isUploadingQr ? "Mengunggah…" : "Upload QR"}
          </Button>
          <Button
            className="flex-1 sm:flex-none h-auto min-h-10 px-5 py-2 text-xs uppercase tracking-wider font-bold"
            onClick={async () => {
              const r = await createPaymentMethodAction(type, {
                label,
                accountName,
                accountNumber,
                qrImageUrl: qrImageUrl || null,
              });
              if (r.success) {
                onStatus("Metode pembayaran ditambahkan");
                window.location.reload();
              } else onStatus(r.error || "Add failed");
            }}
          >
            Tambah
          </Button>
        </div>
      </div>
      {uploadError && <p className="text-xs text-red-400 font-medium">⚠️ {uploadError}</p>}
    </div>
  );
}

type TestimonialDraft = { name: string; rating: number; comment: string; club: string; proofImage: string };

function TestimonialFields({
  draft,
  setDraft,
  onStatus,
}: {
  draft: TestimonialDraft;
  setDraft: (d: TestimonialDraft) => void;
  onStatus: (m: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleProofUpload(file: File) {
    setIsUploading(true);
    const result = await resizeAndUploadImage(file, 1400);
    if (result.success && result.url) {
      setDraft({ ...draft, proofImage: result.url });
      onStatus("Screenshot terupload — klik Simpan / Tambah.");
    } else {
      onStatus(result.error || "Upload screenshot gagal");
    }
    setIsUploading(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_1fr_120px] items-end">
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Nama Pembeli</Label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nama pembeli"
            aria-label="Nama pembeli"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Klub (opsional)</Label>
          <Input
            value={draft.club}
            onChange={(e) => setDraft({ ...draft, club: e.target.value })}
            placeholder="Klub (opsional)"
            aria-label="Klub"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Rating</Label>
          <select
            value={draft.rating}
            onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}
            aria-label="Rating"
            className="w-full h-9 rounded-lg border border-[#27272A] bg-[#181820] px-3 text-sm text-white"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Bintang
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        value={draft.comment}
        onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
        placeholder="Isi testimoni (ringkas dari chat)"
        aria-label="Isi testimoni"
        className="w-full font-normal"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={draft.proofImage}
          onChange={(e) => setDraft({ ...draft, proofImage: e.target.value })}
          placeholder="URL screenshot WhatsApp (opsional)"
          aria-label="URL screenshot"
          className="w-full font-normal min-w-0"
        />
        <label className="shrink-0 min-h-10 cursor-pointer rounded-lg border border-[#27272A] bg-[#181820] px-4 py-2 text-xs font-bold text-white hover:bg-[#27272A] flex items-center justify-center">
          {isUploading ? "Mengunggah…" : "Upload Screenshot"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleProofUpload(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </div>
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
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
          <span>Tampil di storefront</span>
        </label>
        <Button
          className="h-auto min-h-10 px-4 py-2 text-xs uppercase tracking-wider font-bold"
          onClick={async () => {
            const r = await updateTestimonialAction(
              testimonial.id,
              { ...draft, club: draft.club || undefined, proofImage: draft.proofImage || undefined },
              isActive
            );
            onStatus(r.success ? "Testimoni tersimpan" : r.error || "Save failed");
          }}
        >
          Simpan
        </Button>
        <Button
          variant="outline"
          className="h-auto min-h-10 px-4 py-2 text-xs uppercase tracking-wider font-bold border-red-900 text-red-300 hover:bg-red-950/40 hover:text-red-200"
          onClick={async () => {
            if (!window.confirm(`Hapus testimoni dari ${testimonial.name}?`)) return;
            const r = await deleteTestimonialAction(testimonial.id);
            if (r.success) {
              onStatus("Testimoni dihapus");
              window.location.reload();
            } else onStatus(r.error || "Delete failed");
          }}
        >
          Hapus
        </Button>
      </div>
    </div>
  );
}

function NewTestimonialEditor({ onStatus }: { onStatus: (m: string) => void }) {
  const [draft, setDraft] = useState<TestimonialDraft>({ name: "", rating: 5, comment: "", club: "", proofImage: "" });

  return (
    <div className="space-y-3 border-t border-[#27272A] pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tambah testimoni baru</h3>
      <TestimonialFields draft={draft} setDraft={setDraft} onStatus={onStatus} />
      <Button
        variant="outline"
        className="h-auto min-h-10 w-full sm:w-auto px-5 py-2 text-xs uppercase tracking-wider font-bold"
        onClick={async () => {
          const r = await createTestimonialAction({
            ...draft,
            club: draft.club || undefined,
            proofImage: draft.proofImage || undefined,
          });
          if (r.success) {
            onStatus("Testimoni ditambahkan");
            window.location.reload();
          } else onStatus(r.error || "Add failed");
        }}
      >
        Tambah
      </Button>
    </div>
  );
}
