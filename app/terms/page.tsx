import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-[75vh] bg-[#09090B] text-[#FAFAFA] py-12 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white">
            Terms of Sale
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ProKick Store Malaysia &bull; Last updated September 2026
          </p>
        </div>

        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">1. Orders &amp; Authenticity</h3>
            <p>
              All orders placed on ProKick Malaysia are subject to product stock verification. Prices, delivery rates across Peninsular and East Malaysia, and size availabilities are displayed accurately in Malaysian Ringgit (MYR).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">2. Delivery &amp; Couriers</h3>
            <p>
              We dispatch packages using official Malaysian courier partners: Pos Laju and J&amp;T Express. Tracking numbers are issued once orders transition to Dispatched status. Delivery to Peninsular Malaysia typically takes 1–2 business days, while East Malaysia takes 2–4 business days.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">3. DuitNow &amp; Bank Transfer Payments</h3>
            <p>
              Customers must upload a legible transfer receipt corresponding to their unique order amount. Orders are reserved and processed once payment proof is received and verified by store administration.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">4. Customer Support</h3>
            <p>
              For enquiries regarding nameset customization, order amendments, or delivery updates, please reach our administrative helpline directly on WhatsApp.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
