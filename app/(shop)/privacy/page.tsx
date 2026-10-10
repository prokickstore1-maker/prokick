import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ProKick Store Malaysia &bull; Protecting Customer Data
          </p>
        </div>

        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">1. Information We Collect</h3>
            <p>
              We collect customer name, WhatsApp contact number, street address, city, postcode, and state strictly for order fulfillment, logistics tracking, and customer communication.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">2. Storage of Payment Slips</h3>
            <p>
              Payment receipts uploaded by customers are encrypted and stored in secure, private object storage. Receipts are used exclusively by authorized administrators to verify transaction authenticity.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">3. Data Sharing</h3>
            <p>
              We never sell or disclose customer personal data to third-party advertisers. Shipping information is shared only with our official Malaysian delivery partners (Pos Laju &amp; J&amp;T Express) for consignment generation.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base font-display uppercase">4. Customer Rights</h3>
            <p>
              Customers may contact us via our WhatsApp helpline to inspect or request modification of their order records at any time.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
