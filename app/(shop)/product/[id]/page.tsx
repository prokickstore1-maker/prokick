import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJerseyById, getRelatedKits, getShippingSettingsMap } from "@/lib/data";
import { toShippingSettings, STANDARD_NAMESET_FEE, STANDARD_PATCH_FEE } from "@/lib/promo";
import { JerseyCustomizer } from "@/components/jersey/jersey-customizer";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { TestimonialsSection } from "@/components/testimonials/testimonials-section";
import { ChevronRight } from "lucide-react";
import { isJacket } from "@/lib/product-lines";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const jersey = await getJerseyById(id);
  if (!jersey) return { title: "Kit not found" };

  const title = `${jersey.name} | ProKick Indonesia`;
  const description = `${jersey.name} — Rp${jersey.price}. ${jersey.description || `${jersey.league} ${jersey.season} football kit.`}`;
  const image = jersey.image || jersey.images?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: jersey.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jersey = await getJerseyById(id);

  if (!jersey) {
    notFound();
  }

  // Related kits: Prioritas 1 Klub sama → Prioritas 2 Liga sama → Prioritas 3 Best Seller, limit 4
  const jacket = isJacket(jersey);
  const listHref = jacket ? "/jaket" : "/jersey";
  const relatedKits = await getRelatedKits(jersey.league, jersey.id, 4, jersey.productLine, jersey.team);

  // fee nameset/patch dari settings admin — sinkron dengan server checkout
  const shipSettings = toShippingSettings(await getShippingSettingsMap());

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12 overflow-x-hidden">
      <div className="max-w-[1540px] mx-auto space-y-12 min-w-0 max-w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          <Link href={listHref} className="hover:text-white transition-colors">
            {jacket ? "Jaket" : "Kits"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-200 font-semibold truncate max-w-xs">{jersey.name}</span>
        </nav>

        {/* Product Customizer Section */}
        <JerseyCustomizer
          jersey={jersey}
          namesetFee={shipSettings.namesetFee || STANDARD_NAMESET_FEE}
          patchFee={shipSettings.patchFee || STANDARD_PATCH_FEE}
          freeShippingMinItems={shipSettings.promoFreeShipping ? 1 : shipSettings.freeShippingMinItems}
          promoFreeShipping={shipSettings.promoFreeShipping}
          promoFreeNameset={shipSettings.promoFreeNameset}
          promoFreePatch={shipSettings.promoFreePatch}
          promoCustomizationScope={shipSettings.promoCustomizationScope}
        />

        {/* Related Kits Section */}
        {relatedKits.length > 0 && (
          <div className="pt-16 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-volt block mb-1">
                  More from this collection
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight">
                  Related Kits
                </h2>
              </div>
              <Link
                href={listHref}
                className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <span>{jacket ? "Lihat Semua Jaket" : "View All Kits"}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {relatedKits.map((item) => (
                <JerseyCard key={item.id} jersey={item} />
              ))}
            </div>
          </div>
        )}

        {/* Testimoni Pembeli di bawah Related Kits */}
        <TestimonialsSection compact />
      </div>
    </div>
  );
}
