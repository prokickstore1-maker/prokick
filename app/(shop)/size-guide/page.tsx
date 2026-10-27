import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Ruler, CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";
import { getSetting } from "@/lib/data";
import { toIntlPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Panduan Ukuran (Size Guide) | ProKick Store",
  description: "Panduan ukuran lengkap jersey bola Player Issue dan Fan Issue/Retro di ProKick Store Indonesia.",
};

const JERSEY_SIZES = [
  { label: "S", length: 67, width: 47, chest: 94 },
  { label: "M", length: 69, width: 49, chest: 98 },
  { label: "L", length: 72, width: 52, chest: 104 },
  { label: "XL", length: 74, width: 54, chest: 108 },
  { label: "XXL", length: 78, width: 57, chest: 114 },
  { label: "3XL", length: 80, width: 60, chest: 120 },
  { label: "4XL", length: 82, width: 63, chest: 126 },
];

export default async function SizeGuidePage() {
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
          <div className="flex items-center gap-2.5 text-[#E2F952] mb-1">
            <Ruler className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Fitting &amp; Sizing Chart</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white">
            Panduan Ukuran Jersey
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl">
            Pastikan ukuran jersey yang Anda pesan pas dan nyaman. Simak perbedaan tipe fitting serta tabel ukuran resmi ProKick Store di bawah ini.
          </p>
        </div>

        {/* 1. Comparison: Player Issue vs Fan / Retro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-[#121217] border border-[#E2F952]/30 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2F952]/10 text-[#E2F952] text-[11px] font-bold uppercase tracking-wider">
              <span>Slim Fit / Athletic</span>
            </div>
            <h2 className="text-lg font-bold text-white uppercase font-display">Player Issue (Versi Pemain)</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Didesain persis seperti jersey yang dikenakan pemain di lapangan. Bahan sangat ringan, sirkulasi udara maksimal, dan potongan lebih pas membentuk tubuh (slim fit).
            </p>
            <div className="pt-2 border-t border-white/6 flex items-start gap-2 text-xs text-[#E2F952]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Rekomendasi:</strong> Jika menyukai fitting santai/agak longgar, disarankan naik 1 ukuran (upsize).</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#121217] border border-white/10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
              <span>Regular Fit / Casual</span>
            </div>
            <h2 className="text-lg font-bold text-white uppercase font-display">Fan Issue &amp; Retro Klasik</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Potongan standar yang nyaman untuk penggunaan harian, nobar, atau jalan-jalan santai. Logo bordir kuat dan bahan poliester tahan lama.
            </p>
            <div className="pt-2 border-t border-white/6 flex items-start gap-2 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
              <span><strong>Rekomendasi:</strong> Pilih ukuran reguler yang biasa Anda gunakan untuk kaos standar.</span>
            </div>
          </div>
        </div>

        {/* 2. Official Size Chart Table */}
        <section className="rounded-2xl border border-white/10 bg-[#121217] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white font-display">
                Tabel Ukuran Resmi (cm)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dimensi diukur dalam keadaan jersey dibentangkan di bidang datar (flat measure).
              </p>
            </div>
            <span className="text-[11px] text-zinc-400 italic">Toleransi ukuran ±1–2 cm</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-zinc-300 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 text-center">Ukuran</th>
                  <th className="py-3 px-4 text-center">Panjang (cm)</th>
                  <th className="py-3 px-4 text-center">Lebar Dada (cm)</th>
                  <th className="py-3 px-4 text-center">Lingkar Dada (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {JERSEY_SIZES.map((row) => (
                  <tr key={row.label} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-black text-white text-center bg-white/2">{row.label}</td>
                    <td className="py-3 px-4 text-zinc-300 text-center font-mono">{row.length} cm</td>
                    <td className="py-3 px-4 text-zinc-300 text-center font-mono">{row.width} cm</td>
                    <td className="py-3 px-4 text-zinc-300 text-center font-mono">{row.chest} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Cara Mengukur */}
        <section className="rounded-2xl border border-white/10 bg-[#121217] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-tight text-white font-display">
            Cara Mengukur Kaos Jersey di Rumah
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-300">
            <div className="p-4 rounded-xl bg-white/5 border border-white/6 space-y-1.5">
              <span className="font-bold text-[#E2F952] block uppercase tracking-wider">1. Lebar Dada (Pit-to-Pit)</span>
              <p>
                Bentangkan kaos jersey yang paling pas Anda miliki di lantai atau meja datar. Ukur jarak lurus dari jahitan bawah ketiak kiri ke ketiak kanan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/6 space-y-1.5">
              <span className="font-bold text-[#E2F952] block uppercase tracking-wider">2. Panjang Badan</span>
              <p>
                Tarik meteran dari titik tertinggi di samping kerah leher lurus ke bawah hingga ujung keliman bawah jersey.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Jika hasil pengukuran Anda berada di antara dua ukuran, pilihlah ukuran yang lebih besar untuk kenyamanan bergerak.</span>
          </div>
        </section>

        {/* 4. Konsultasi CS Banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#121217] via-[#1a1a24] to-[#121217] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white uppercase font-display">Masih Ragu Memilih Ukuran?</h3>
            <p className="text-xs text-zinc-400">Tim customer support kami siap membantu memilihkan ukuran terbaik berdasarkan tinggi &amp; berat badan Anda.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Halo ProKick Store, saya ingin konsultasi ukuran jersey (Tinggi badan: ... cm, Berat badan: ... kg).")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tanya CS via WhatsApp</span>
            </a>
            <Link
              href="/jersey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition"
            >
              <span>Belanja Sekarang</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
