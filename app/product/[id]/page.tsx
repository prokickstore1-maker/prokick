import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJerseyById, getAllJerseys } from "@/lib/data";
import { JerseyCustomizer } from "@/components/jersey/jersey-customizer";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const jersey = await getJerseyById(id);
  if (!jersey) return { title: "Kit not found" };

  const title = `${jersey.name} | ProKick Malaysia`;
  const description = `${jersey.name} — RM ${jersey.price}. ${jersey.description || `${jersey.league} ${jersey.season} football kit.`}`;
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

  // Related jerseys from same league or bestsellers
  const allKits = await getAllJerseys();
  const relatedKits = allKits
    .filter((j) => j.id !== jersey.id && (j.league === jersey.league || j.isBestSeller))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          <Link href="/jersey" className="hover:text-white transition-colors">
            Kits
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-200 font-semibold truncate max-w-xs">{jersey.name}</span>
        </nav>

        {/* Product Customizer Section */}
        <JerseyCustomizer jersey={jersey} />

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
                href="/jersey"
                className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <span>View All Kits</span>
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
      </div>
    </div>
  );
}
