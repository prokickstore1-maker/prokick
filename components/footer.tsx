import Link from "next/link";
import { Globe } from "lucide-react";
import { getSetting, getAllJerseys } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { toIntlPhone } from "@/lib/utils";

export default async function Footer() {
  const waNumber = toIntlPhone(await getSetting("whatsappNumber", "6281234567890"));
  const freeMin = Math.max(1, Number(await getSetting("freeShippingMinItems", "2")) || 2);
  const leagues = buildLeagueOptions(await getAllJerseys());
  return (
    <footer className="bg-[#09090B] border-t border-white/10 text-white pt-14 pb-12 text-xs">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/8">
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs font-display">
              Collections
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/jersey" className="hover:text-white transition-colors">All Football Kits</Link></li>
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
            <h4 className="font-bold text-white text-xs font-display">
              Delivery &amp; Logistics
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><span>J&amp;T Express</span></li>
              <li><span>Jawa (1–2 Hari)</span></li>
              <li><span>Luar Jawa (2–4 Hari)</span></li>
              <li className="text-volt font-semibold"><span>Free Delivery on {freeMin}+ Kits</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs font-display">
              Payment Support
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><span className="text-white font-medium">QRIS</span></li>
              <li><span>GoPay</span></li>
              <li><span>OVO</span></li>
              <li><span>DANA</span></li>
              <li><span>Online Bank Transfer</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs font-display">
              Customer Support
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  <span>WhatsApp Helpline</span>
                </a>
              </li>
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 text-[11px]">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-white font-medium">Indonesia</span>
            <span className="text-zinc-500">&bull;</span>
            <span className="font-semibold text-zinc-300">IDR (Rp)</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span>&copy; {new Date().getFullYear()} ProKick Store Indonesia. All rights reserved.</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Sale</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
