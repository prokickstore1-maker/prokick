import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, MessageCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { getSetting } from "@/lib/data";
import { toIntlPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kebijakan Retur & Garansi | ProKick Store",
  description: "Ketentuan garansi 100% kepuasan, penggantian barang cacat/salah pengiriman, dan prosedur retur di ProKick Store Indonesia.",
};

export default async function ReturnsPage() {
  const waNumber = toIntlPhone(await getSetting("whatsappNumber", "6281234567890"));

  return (
    <div className="min-h-[75vh] bg-[#09090B] text-[#FAFAFA] py-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2 text-[#E2F952] mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Garansi Kepuasan Pembeli</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white">
            Kebijakan Retur &amp; Garansi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl">
            ProKick Store menjamin setiap produk jersey yang Anda terima memiliki standar kualitas terbaik. Belanja tanpa rasa waswas dengan perlindungan garansi resmi toko.
          </p>
        </div>

        {/* 1. Jaminan Garansi 100% */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121217] border border-[#E2F952]/30 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E2F952]/10 border border-[#E2F952]/20 flex items-center justify-center text-[#E2F952]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase font-display">
                Garansi Tukar Baru 100%
              </h2>
              <p className="text-xs text-zinc-400">
                Kami siap mengganti jersey Anda dengan unit baru tanpa biaya tambahan untuk kondisi berikut:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-zinc-300">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="font-bold text-[#E2F952] block">1. Salah Kirim Produk / Ukuran</span>
              <p className="text-[11px] text-zinc-400">Model, klub, atau ukuran yang tiba tidak sesuai dengan rincian invoice pemesanan Anda.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="font-bold text-[#E2F952] block">2. Cacat Cetak Nameset / Patch</span>
              <p className="text-[11px] text-zinc-400">Sablon nama/nomor salah eja atau patch lepas/miring akibat kekeliruan produksi kami.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="font-bold text-[#E2F952] block">3. Cacat Pabrik Mayor</span>
              <p className="text-[11px] text-zinc-400">Terdapat robekan kain, jahitan lepas fatal, atau noda permanen pada saat paket pertama kali dibuka.</p>
            </div>
          </div>
        </div>

        {/* 2. Syarat & Ketentuan Pengajuan */}
        <section className="rounded-2xl border border-white/10 bg-[#121217] p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold uppercase tracking-tight text-white font-display">
            Syarat &amp; Ketentuan Klaim Retur
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#E2F952] shrink-0 mt-0.5" />
              <div>
                <strong>Video Unboxing Wajib:</strong> Wajib menyertakan video saat membuka paket dari kondisi awal tersegel rapi (label resi J&amp;T Express terlihat jelas) tanpa jeda (no pause/cut).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#E2F952] shrink-0 mt-0.5" />
              <div>
                <strong>Batas Waktu Laporan 2x24 Jam:</strong> Pengajuan klaim harus dilakukan maksimal 2x24 jam sejak status paket dinyatakan &quot;Delivered / Diterima&quot; oleh sistem kurir J&amp;T Express.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#E2F952] shrink-0 mt-0.5" />
              <div>
                <strong>Kondisi Jersey Original:</strong> Hangtag label merek masih terpasang utuh, jersey belum dicuci, disetrika, atau dipakai berolahraga/beraktivitas.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3 mt-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong>Catatan untuk Jersey Custom Nameset:</strong> Jersey yang sudah dicetak dengan custom nama &amp; nomor pribadi tidak dapat diretur/ditukar ukuran karena alasan salah pilih ukuran sendiri. Pastikan memeriksa panduan ukuran sebelum konfirmasi pesanan.
            </div>
          </div>
        </section>

        {/* 3. 4 Langkah Mudah Klaim */}
        <section className="rounded-2xl border border-white/10 bg-[#121217] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-tight text-white font-display">
            Prosedur Mudah Klaim Retur
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="text-[10px] font-bold text-[#E2F952] uppercase">Langkah 1</span>
              <h3 className="font-bold text-white uppercase">Siapkan Video</h3>
              <p className="text-zinc-400 text-[11px]">Ambil rekaman video unboxing dan foto bagian yang bermasalah.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="text-[10px] font-bold text-[#E2F952] uppercase">Langkah 2</span>
              <h3 className="font-bold text-white uppercase">Hubungi CS</h3>
              <p className="text-zinc-400 text-[11px]">Kirimkan nomor invoice (#PK-...) beserta video bukti ke WhatsApp CS.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="text-[10px] font-bold text-[#E2F952] uppercase">Langkah 3</span>
              <h3 className="font-bold text-white uppercase">Verifikasi</h3>
              <p className="text-zinc-400 text-[11px]">Tim admin akan memverifikasi dalam waktu maksimal 1x24 jam kerja.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/6 space-y-1">
              <span className="text-[10px] font-bold text-[#E2F952] uppercase">Langkah 4</span>
              <h3 className="font-bold text-white uppercase">Kirim Pengganti</h3>
              <p className="text-zinc-400 text-[11px]">Jersey baru pengganti langsung dikirim via J&amp;T Express.</p>
            </div>
          </div>
        </section>

        {/* 4. Contact CS CTA */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#121217] via-[#1a1a24] to-[#121217] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white uppercase font-display">Perlu Bantuan Retur atau Garansi?</h3>
            <p className="text-xs text-zinc-400">Tim kami siap membantu proses pengajuan klaim Anda dengan cepat dan ramah.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Halo ProKick Store, saya ingin klaim garansi/retur untuk nomor pesanan: #PK-")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Klaim via WhatsApp</span>
            </a>
            <Link
              href="/track-order"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition"
            >
              <span>Lacak Pesanan</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
