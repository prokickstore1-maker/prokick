import Link from "next/link";
import { Globe } from "lucide-react";
import { getSetting, getAllJerseys } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";

export default async function Footer() {
  const waNumber = (await getSetting("whatsappNumber", "60123456789")).replace(/[^0-9]/g, "");
  const leagues = buildLeagueOptions(await getAllJerseys());
  return (
    <footer className="bg-[#09090B] border-t border-white/10 text-white pt-14 pb-12 text-xs">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/8">
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-display">
              Collections
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/jersey" className="hover:text-white transition-colors">All Football Kits</Link></li>
              {leagues.filter((l) => l.value).map((l) => (
                <li key={l.value}>
                  <Link
                    href={`/jersey?league=${encodeURIComponent(l.value)}`}
                    className={l.isHarimau ? "hover:text-harimau transition-colors" : "hover:text-white transition-colors"}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-display">
              Delivery &amp; Logistics
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><span>Pos Laju Malaysia</span></li>
              <li><span>J&amp;T Express Malaysia</span></li>
              <li><span>Peninsular (1–2 Days)</span></li>
              <li><span>East Malaysia (2–4 Days)</span></li>
              <li className="text-volt font-semibold"><span>Free Delivery on 2+ Kits</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-display">
              Payment Support
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><span className="text-white font-medium">DuitNow QR Pay</span></li>
              <li><span>Maybank MAE</span></li>
              <li><span>CIMB OCTO</span></li>
              <li><span>Touch &apos;n Go eWallet</span></li>
              <li><span>Online Bank Transfer</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-display">
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
            <span className="text-white font-medium">Malaysia</span>
            <span className="text-zinc-500">&bull;</span>
            <span className="font-semibold text-zinc-300">MYR (RM)</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span>&copy; {new Date().getFullYear()} ProKick Store Malaysia. All rights reserved.</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Sale</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
