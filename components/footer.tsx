import Link from "next/link";
import { Globe } from "lucide-react";
import { toShippingSettings } from "@/lib/promo";
import { toIntlPhone } from "@/lib/utils";
import type { LeagueOption } from "@/lib/leagues";

export function Footer({
  settingsMap = {},
  leagues = [],
}: {
  settingsMap?: Record<string, string>;
  leagues?: LeagueOption[];
}) {
  const ship = toShippingSettings(settingsMap);
  const waNumber = toIntlPhone(settingsMap.whatsappNumber || "6281234567890");
  const instagramHandle = (settingsMap.instagramHandle || "prokickstore").replace(/^@/, "");
  const tiktokHandle = (settingsMap.tiktokHandle || "prokickstore").replace(/^@/, "");
  const freeMin = ship.freeShippingMinItems;

  return (
    <footer className="bg-[#09090B] border-t border-white/10 text-white pt-14 pb-12 text-xs">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/8">
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs font-display uppercase tracking-wider">
              Koleksi Jersey
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/jersey" className="hover:text-white transition-colors">Semua Jersey Bola</Link></li>
              {leagues.filter((l) => l.value).map((l) => (
                <li key={l.value}>
                  <Link
                    href={`/jersey?league=${encodeURIComponent(l.value)}`}
                    className="hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs font-display uppercase tracking-wider">
              Pengiriman &amp; Logistik
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><span>Pengiriman via J&amp;T Express</span></li>
              <li><span>Estimasi Jawa (1–2 Hari Kerja)</span></li>
              <li><span>Estimasi Luar Jawa (2–4 Hari Kerja)</span></li>
              <li className="text-[#E2F952] font-semibold"><span>Gratis Ongkir min. {freeMin} Kaos</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs font-display uppercase tracking-wider">
              Metode Pembayaran
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><span>QRIS (e-wallet &amp; aplikasi bank)</span></li>
              <li><span>Transfer Bank &amp; E-Wallet</span></li>
              <li><span>Verifikasi manual oleh admin</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-bold text-white text-xs font-display uppercase tracking-wider">
                Bantuan &amp; Layanan
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#E2F952] transition-colors"
                  >
                    <span>WhatsApp Helpline (Chat CS)</span>
                  </a>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-white transition-colors">
                    Lacak Pesanan (Track Order)
                  </Link>
                </li>
                <li>
                  <Link href="/size-guide" className="hover:text-white transition-colors">
                    Panduan Ukuran (Size Guide)
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-white transition-colors">
                    Kebijakan Retur &amp; Garansi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Media Links */}
            {(instagramHandle || tiktokHandle || waNumber) && (
              <div className="space-y-2 pt-2 border-t border-white/6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Social Media
                </span>
                <div className="flex items-center gap-2">
                  {instagramHandle && (
                    <a
                      href={`https://instagram.com/${instagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram ProKick Store"
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-[#E2F952]/40 hover:bg-white/10 text-zinc-400 hover:text-[#E2F952] flex items-center justify-center transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {tiktokHandle && (
                    <a
                      href={`https://tiktok.com/@${tiktokHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok ProKick Store"
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-[#E2F952]/40 hover:bg-white/10 text-zinc-400 hover:text-[#E2F952] flex items-center justify-center transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                      </svg>
                    </a>
                  )}
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp ProKick Store"
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400/40 hover:bg-white/10 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-[11px]">
          {/* Sisi Kiri: Lokasi & Hak Cipta */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-center md:text-left">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-white font-medium">Indonesia</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="font-semibold text-zinc-300">IDR (Rp)</span>
            </div>
            <span className="hidden sm:inline text-zinc-600">&bull;</span>
            <span>&copy; {new Date().getFullYear()} ProKick Store Indonesia. All rights reserved.</span>
          </div>

          {/* Sisi Kanan: Tautan Legal Sejajar & Rapi */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1.5 text-zinc-400">
            <Link href="/terms" className="hover:text-white transition-colors">Syarat &amp; Ketentuan</Link>
            <span className="text-zinc-600">&bull;</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
            <span className="text-zinc-600">&bull;</span>
            <Link href="/returns" className="hover:text-white transition-colors">Kebijakan Retur</Link>
            <span className="text-zinc-600">&bull;</span>
            <Link href="/size-guide" className="hover:text-white transition-colors">Panduan Ukuran</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
