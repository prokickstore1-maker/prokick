import type { Metadata } from "next";
import Link from "next/link";
import { getJerseysPaginated, getCatalogFilterOptions, getCachedJacketOptions, type CatalogSort } from "@/lib/data";
import { PRODUCT_LINE_JACKET, JACKET_KINDS } from "@/lib/product-lines";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { Search, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jaket, Tracksuit & Windbreaker | ProKick Indonesia",
  description: "Jaket, tracksuit, dan windbreaker klub serta tim nasional. Pilih per klub atau negara.",
};

const ITEMS_PER_PAGE = 16;
const BASE = "/jaket";
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "XXL", "XXXL"];

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", total];
  if (current >= total - 2) return [1, "...", total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

type Params = {
  kitType?: string;
  category?: string;
  league?: string;
  team?: string;
  country?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  sort?: string;
  page?: string;
};

export default async function JacketCatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const kitType = (JACKET_KINDS as readonly string[]).includes(p.kitType || "") ? (p.kitType as string) : "";
  const category = p.category === "Klub" || p.category === "Tim Nasional" ? p.category : "";
  const league = p.league || "";
  const team = p.team || "";
  const country = p.country || "";
  const size = p.size || "";
  const search = p.search || "";
  const minPrice = Number(p.minPrice || 0);
  const maxPrice = Number(p.maxPrice || 0);
  const requestedPage = Math.max(1, parseInt(p.page || "1", 10) || 1);
  const sort: CatalogSort = p.sort === "price-asc" || p.sort === "price-desc" ? p.sort : "featured";

  const [{ items, total }, filterOptions, leagueOptions] = await Promise.all([
    getJerseysPaginated(
      { productLine: PRODUCT_LINE_JACKET, kitType, category, league, team, country, size, minPrice, maxPrice, search },
      requestedPage,
      ITEMS_PER_PAGE,
      sort
    ),
    getCatalogFilterOptions(PRODUCT_LINE_JACKET),
    getCachedJacketOptions(),
  ]);

  const sizeOptions = filterOptions.sizes.sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const paginationRange = getPaginationRange(currentPage, totalPages);

  const withFilter = (overrides: Record<string, string>) => {
    const current: Record<string, string> = {
      kitType, category, league, team, country, size, search,
      minPrice: p.minPrice || "",
      maxPrice: p.maxPrice || "",
      sort: sort === "featured" ? "" : sort,
    };
    if (currentPage > 1 && !("page" in overrides)) current.page = String(currentPage);
    const params = new URLSearchParams(Object.entries(current).filter(([, v]) => v !== "") as [string, string][]);
    Object.entries(overrides).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    const qs = params.toString();
    return qs ? `${BASE}?${qs}` : BASE;
  };

  const filterLabels = [
    kitType && `Jenis: ${kitType}`,
    category && `Kategori: ${category}`,
    league && `Liga: ${league}`,
    team && `Klub: ${team}`,
    country && `Negara: ${country}`,
    size && `Ukuran: ${size}`,
    minPrice > 0 && `Min Rp${minPrice}`,
    maxPrice > 0 && `Max Rp${maxPrice}`,
    search && `“${search}”`,
  ].filter(Boolean) as string[];
  const hasActiveFilters = filterLabels.length > 0 || sort !== "featured";

  const pill = (active: boolean) =>
    `px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
      active
        ? "bg-white text-black font-extrabold shadow-md"
        : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/8"
    }`;
  const selectCls =
    "rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer";

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
              Tracksuit &bull; Jaket &bull; Windbreaker
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-display uppercase tracking-tight flex items-baseline gap-3">
              <span>Jaket &amp; Tracksuit</span>
              <span className="text-base sm:text-xl font-mono text-zinc-400 font-semibold">({total} item)</span>
            </h1>
            {totalPages > 1 && (
              <p className="text-xs text-zinc-400 font-sans mt-1">
                Menampilkan <span className="text-white font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> dari <span className="text-white font-semibold">{total}</span> &bull; Halaman {currentPage} dari {totalPages}
              </p>
            )}
          </div>
          {hasActiveFilters && (
            <Link href={BASE} className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </Link>
          )}
        </div>

        {/* Subjenis + kategori */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <Link href={withFilter({ kitType: "", page: "" })} className={pill(!kitType)}>Semua</Link>
            {JACKET_KINDS.map((k) => (
              <Link key={k} href={withFilter({ kitType: k, page: "" })} className={pill(kitType === k)}>{k}</Link>
            ))}
            <span className="w-px h-6 bg-white/10 mx-1 shrink-0" aria-hidden />
            <Link href={withFilter({ category: "Klub", team: "", country: "", page: "" })} className={pill(category === "Klub")}>Klub</Link>
            <Link href={withFilter({ category: "Tim Nasional", team: "", country: "", page: "" })} className={pill(category === "Tim Nasional")}>Negara</Link>
          </div>

          <form method="GET" action={BASE} className="relative w-full lg:w-80">
            {Object.entries({ kitType, category, league, team, country, size, minPrice: p.minPrice || "", maxPrice: p.maxPrice || "", sort: sort === "featured" ? "" : sort })
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            <Input
              type="text"
              name="search"
              aria-label="Cari jaket"
              defaultValue={search}
              placeholder="Cari klub, negara, jaket..."
              className="w-full h-auto rounded-lg bg-[#121217] hover:bg-[#181820] text-xs text-white placeholder:text-zinc-400 px-4 py-2.5 pl-10 border-white/10 focus-visible:border-white/30 font-sans"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
        </div>

        {/* Filter detail */}
        <form method="GET" action={BASE} className="rounded-xl border p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 bg-[#121217] border-white/8">
          <input type="hidden" name="kitType" value={kitType} />
          <input type="hidden" name="category" value={category} />
          {team && <input type="hidden" name="team" value={team} />}
          {country && <input type="hidden" name="country" value={country} />}
          {search && <input type="hidden" name="search" value={search} />}

          <select name="league" aria-label="Filter liga" defaultValue={league} className={selectCls}>
            <option value="">Semua Liga</option>
            {leagueOptions.filter((o) => o.value).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select name="size" aria-label="Filter ukuran" defaultValue={size} className={selectCls}>
            <option value="">Semua Ukuran</option>
            {sizeOptions.map((o) => (
              <option key={o} value={o}>Ukuran {o}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <Input type="number" name="minPrice" aria-label="Harga minimum dalam Rupiah" min={0} defaultValue={p.minPrice || ""} placeholder="Min Rp" className="w-full min-w-0 h-auto rounded-xl bg-[#181820] text-zinc-200 px-2.5 py-2 text-xs border-white/10 focus-visible:border-white/30 placeholder:text-zinc-400" />
            <span className="text-zinc-500 text-xs">&ndash;</span>
            <Input type="number" name="maxPrice" aria-label="Harga maksimum dalam Rupiah" min={0} defaultValue={p.maxPrice || ""} placeholder="Max Rp" className="w-full min-w-0 h-auto rounded-xl bg-[#181820] text-zinc-200 px-2.5 py-2 text-xs border-white/10 focus-visible:border-white/30 placeholder:text-zinc-400" />
          </div>

          <select name="sort" aria-label="Urutkan" defaultValue={sort} className={selectCls}>
            <option value="featured">Urut: Unggulan</option>
            <option value="price-asc">Harga: Termurah</option>
            <option value="price-desc">Harga: Termahal</option>
          </select>

          <Button type="submit" className="h-auto w-full rounded-xl px-4 py-2 text-xs gap-1.5 uppercase tracking-wider font-extrabold col-span-2 sm:col-span-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Terapkan</span>
          </Button>
        </form>

        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 pt-2">
              {items.map((item, idx) => (
                <JerseyCard key={item.id} jersey={item} priority={idx < 4} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-2 sm:gap-3 pt-12 pb-8">
                {currentPage > 1 && (
                  <Link href={withFilter({ page: String(currentPage - 1) })} aria-label="Halaman sebelumnya" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border border-white/10 bg-[#121217] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#181820] transition-all active:scale-95">
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
                {paginationRange.map((n, idx) =>
                  typeof n === "string" ? (
                    <span key={`ellipsis-${idx}`} className="w-6 sm:w-8 h-10 sm:h-11 flex items-center justify-center text-zinc-500 font-bold tracking-widest select-none text-xs">&hellip;</span>
                  ) : (
                    <Link
                      key={n}
                      href={withFilter({ page: String(n) })}
                      aria-current={n === currentPage ? "page" : undefined}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all active:scale-95 ${
                        n === currentPage
                          ? "bg-white text-zinc-950 font-black shadow-md ring-2 ring-white/20"
                          : "border border-white/10 bg-[#121217] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#181820] font-medium"
                      }`}
                    >
                      {n}
                    </Link>
                  )
                )}
                {currentPage < totalPages && (
                  <Link href={withFilter({ page: String(currentPage + 1) })} aria-label="Halaman berikutnya" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border border-white/10 bg-[#121217] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#181820] transition-all active:scale-95">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <section className="rounded-xl border py-24 text-center space-y-4 bg-[#121217] border-white/8">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display">Belum Ada Jaket</h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {filterLabels.length ? `Tidak ada jaket yang cocok dengan ${filterLabels.join(", ")}.` : "Koleksi jaket belum tersedia."}
            </p>
            {hasActiveFilters && (
              <div className="pt-2">
                <Button asChild className="rounded-lg px-7 h-auto py-3 text-xs uppercase tracking-wider font-extrabold">
                  <Link href={BASE}>Reset Filter</Link>
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

