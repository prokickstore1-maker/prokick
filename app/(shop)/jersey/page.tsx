import Link from "next/link";
import { getAllJerseys } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { Search, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 16;

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default async function JerseyCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    league?: string;
    category?: string;
    country?: string;
    type?: string;
    season?: string;
    edition?: string;
    kitType?: string;
    size?: string;
    team?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const currentLeague = resolvedParams.league || "";
  const currentCategory = resolvedParams.category || "";
  const currentCountry = resolvedParams.country || "";
  const currentTeam = resolvedParams.team || "";
  const currentType = resolvedParams.type || "";
  const currentSeason = resolvedParams.season || "";
  const currentEdition = resolvedParams.edition || "";
  const currentKitType = resolvedParams.kitType || "";
  const currentSize = resolvedParams.size || "";
  const minPrice = Number(resolvedParams.minPrice || 0);
  const maxPrice = Number(resolvedParams.maxPrice || 0);
  const searchQuery = resolvedParams.search || "";
  const sort = resolvedParams.sort || "featured";
  const requestedPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const allJerseys = await getAllJerseys();
  let jerseys = allJerseys;

  // Filter by League
  if (currentLeague) {
    jerseys = jerseys.filter(
      (j) => j.league.toLowerCase() === currentLeague.toLowerCase()
    );
  }

  if (currentTeam) jerseys = jerseys.filter((j) => j.team.toLowerCase() === currentTeam.toLowerCase());
  if (currentCategory) jerseys = jerseys.filter((j) => j.category.toLowerCase() === currentCategory.toLowerCase());
  if (currentCountry) jerseys = jerseys.filter((j) => j.country.toLowerCase() === currentCountry.toLowerCase());
  if (currentType) jerseys = jerseys.filter((j) => j.type.toLowerCase() === currentType.toLowerCase());
  if (currentSeason) jerseys = jerseys.filter((j) => j.season === currentSeason);
  if (currentEdition) jerseys = jerseys.filter((j) => j.edition.toLowerCase() === currentEdition.toLowerCase());
  if (currentKitType) jerseys = jerseys.filter((j) => j.kitType.toLowerCase() === currentKitType.toLowerCase());
  if (currentSize) jerseys = jerseys.filter((j) => j.sizes.includes(currentSize));
  if (Number.isFinite(minPrice) && minPrice > 0) jerseys = jerseys.filter((j) => Number(j.price) >= minPrice);
  if (Number.isFinite(maxPrice) && maxPrice > 0) jerseys = jerseys.filter((j) => Number(j.price) <= maxPrice);

  // Filter by Search Query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    jerseys = jerseys.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.team.toLowerCase().includes(q) ||
        j.tags.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sort === "price-asc") {
    jerseys.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sort === "price-desc") {
    jerseys.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else {
    // Default / "featured": Season descending (2026/27 first), Current edition before Vintage, Home/Away first
    jerseys.sort((a, b) => {
      // 1. Season DESC (e.g. "2026/2027" > "2010/2011" > "1994/1995")
      const seasonDiff = (b.season || "").localeCompare(a.season || "");
      if (seasonDiff !== 0) return seasonDiff;

      // 2. Current edition before Vintage/Retro
      if (a.edition === "Current" && b.edition !== "Current") return -1;
      if (b.edition === "Current" && a.edition !== "Current") return 1;

      // 3. Kit priority: Home (1) > Away (2) > Third (3) > others (4)
      const kitPriority: Record<string, number> = { Home: 1, Away: 2, Third: 3 };
      const aPriority = kitPriority[a.kitType] || 4;
      const bPriority = kitPriority[b.kitType] || 4;
      if (aPriority !== bPriority) return aPriority - bPriority;

      return 0;
    });
  }

  // Pagination calculation
  const totalItems = jerseys.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const paginatedJerseys = jerseys.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginationRange = getPaginationRange(currentPage, totalPages);

  const categoryOptions = [...new Set(allJerseys.map((j) => j.category))].filter(Boolean);
  const typeOptions = [...new Set(allJerseys.map((j) => j.type))].filter(Boolean);
  const editionOptions = [...new Set(allJerseys.map((j) => j.edition))].filter(Boolean);
  const seasonOptions = [...new Set(allJerseys.map((j) => j.season))].filter(Boolean);
  // ukuran diturunkan dari produk yang ada (ukuran anak/3XL ikut muncul sendiri)
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "XXL", "XXXL"];
  const sizeOptions = [...new Set(allJerseys.flatMap((j) => j.sizes || []))]
    .filter(Boolean)
    .sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a.toUpperCase());
      const ib = SIZE_ORDER.indexOf(b.toUpperCase());
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });

  // Rebuild query keeping every other active filter; used by league pills so
  // they don't silently drop type/size/price selections.
  const withFilter = (overrides: Record<string, string>) => {
    const currentParams: Record<string, string> = {
      league: currentLeague,
      team: currentTeam,
      category: currentCategory,
      country: currentCountry,
      type: currentType,
      season: currentSeason,
      edition: currentEdition,
      kitType: currentKitType,
      size: currentSize,
      minPrice: resolvedParams.minPrice || "",
      maxPrice: resolvedParams.maxPrice || "",
      search: searchQuery,
      sort: sort === "featured" ? "" : sort,
    };

    if (currentPage > 1 && !("page" in overrides)) {
      currentParams.page = String(currentPage);
    }

    const params = new URLSearchParams(
      Object.entries(currentParams).filter(([, v]) => v !== "") as [string, string][]
    );
    Object.entries(overrides).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    const qs = params.toString();
    return qs ? `/jersey?${qs}` : "/jersey";
  };

  const leagueOptions = buildLeagueOptions(allJerseys);

  const filterLabels: string[] = [
    currentLeague && `League: ${currentLeague}`,
    currentTeam && `Team: ${currentTeam}`,
    currentCategory && `Category: ${currentCategory}`,
    currentCountry && `Country: ${currentCountry}`,
    currentType && `Type: ${currentType}`,
    currentSeason && `Season: ${currentSeason}`,
    currentEdition && `Edition: ${currentEdition}`,
    currentKitType && `Kit: ${currentKitType}`,
    currentSize && `Size: ${currentSize}`,
    minPrice > 0 && `Min Rp${minPrice}`,
    maxPrice > 0 && `Max Rp${maxPrice}`,
    searchQuery && `“${searchQuery}”`,
  ].filter(Boolean) as string[];

  const hasActiveFilters = filterLabels.length > 0 || sort !== "featured";

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
              2026/27 Season &bull; All Kits
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-display uppercase tracking-tight flex items-baseline gap-3">
              <span>Football Shirts &amp; Kits</span>
              <span className="text-base sm:text-xl font-mono text-zinc-400 font-semibold">
                ({totalItems} {totalItems === 1 ? "Kit" : "Kits"})
              </span>
            </h1>
            {totalPages > 1 && (
              <p className="text-xs text-zinc-400 font-sans mt-1">
                Showing <span className="text-white font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="text-white font-semibold">{totalItems}</span> kits &bull; Page {currentPage} of {totalPages}
              </p>
            )}
          </div>

          {hasActiveFilters && (
            <Link
              href="/jersey"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </Link>
          )}
        </div>

        {/* Top Control Bar: League Pills & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* League Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {leagueOptions.map((opt) => {
              const active = currentLeague === opt.value;

              return (
                <Link
                  key={opt.label}
                  href={withFilter({ league: opt.value, team: "", page: "" })}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-white text-black font-extrabold shadow-md"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/8"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>

          {/* Search Input — carries every other active filter */}
          <form method="GET" action="/jersey" className="relative w-full lg:w-80">
            {Object.entries({
              league: currentLeague,
              team: currentTeam,
              category: currentCategory,
              country: currentCountry,
              type: currentType,
              season: currentSeason,
              edition: currentEdition,
              kitType: currentKitType,
              size: currentSize,
              minPrice: resolvedParams.minPrice || "",
              maxPrice: resolvedParams.maxPrice || "",
              sort: sort === "featured" ? "" : sort,
            })
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            <Input
              type="text"
              name="search"
              aria-label="Search kits"
              defaultValue={searchQuery}
              placeholder="Search club, player, kit..."
              className="w-full h-auto rounded-lg bg-[#121217] hover:bg-[#181820] text-xs text-white placeholder:text-zinc-400 px-4 py-2.5 pl-10 border-white/10 focus-visible:border-white/30 font-sans"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
        </div>

        {/* Detailed Filter Grid Bar */}
        <form
          method="GET"
          action="/jersey"
          className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 bg-[#121217] border-white/8"
        >          {/* Preserve Current League & Search */}
          <input type="hidden" name="league" value={currentLeague} />
          {currentTeam && <input type="hidden" name="team" value={currentTeam} />}
          {searchQuery && <input type="hidden" name="search" value={searchQuery} />}
          <input type="hidden" name="country" value={currentCountry} />
          <input type="hidden" name="kitType" value={currentKitType} />

          {/* Type Filter */}
          <select
            name="type"
            aria-label="Filter by type"
            defaultValue={currentType}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">All Types</option>
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Edition Filter */}
          <select
            name="edition"
            aria-label="Filter by edition"
            defaultValue={currentEdition}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">All Editions</option>
            {editionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Size Filter */}
          <select
            name="size"
            aria-label="Filter by size"
            defaultValue={currentSize}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">All Sizes</option>
            {sizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                Size {opt}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            name="category"
            aria-label="Filter by category"
            defaultValue={currentCategory}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Season Filter */}
          <select
            name="season"
            aria-label="Filter by season"
            defaultValue={currentSeason}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">All Seasons</option>
            {seasonOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Price Range (IDR) */}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              name="minPrice"
              aria-label="Harga minimum dalam Rupiah"
              min={0}
              defaultValue={resolvedParams.minPrice || ""}
              placeholder="Min Rp"
              className="w-full min-w-0 h-auto rounded-xl bg-[#181820] text-zinc-200 px-2.5 py-2 text-xs border-white/10 focus-visible:border-white/30 placeholder:text-zinc-400"
            />
            <span className="text-zinc-500 text-xs">&ndash;</span>
            <Input
              type="number"
              name="maxPrice"
              aria-label="Harga maksimum dalam Rupiah"
              min={0}
              defaultValue={resolvedParams.maxPrice || ""}
              placeholder="Max Rp"
              className="w-full min-w-0 h-auto rounded-xl bg-[#181820] text-zinc-200 px-2.5 py-2 text-xs border-white/10 focus-visible:border-white/30 placeholder:text-zinc-400"
            />
          </div>

          {/* Sort Filter */}
          <select
            name="sort"
            aria-label="Sort results"
            defaultValue={sort}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          {/* Submit Action */}
          <Button
            type="submit"
            className="h-auto w-full rounded-xl px-4 py-2 text-xs gap-1.5 uppercase tracking-wider font-extrabold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Apply</span>
          </Button>
        </form>

        {/* Catalog Grid (2-Column Mobile, 4-Column Desktop) */}
        {paginatedJerseys.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 pt-2">
              {paginatedJerseys.map((jersey) => (
                <JerseyCard key={jersey.id} jersey={jersey} />
              ))}
            </div>

            {/* Circular Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-2 sm:gap-3 pt-12 pb-8">
                {/* Previous Page Button (<) */}
                {currentPage > 1 && (
                  <Link
                    href={withFilter({ page: String(currentPage - 1) })}
                    aria-label="Previous page"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border border-white/10 bg-[#121217] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#181820] transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}

                {/* Page Number Circles & Ellipsis */}
                {paginationRange.map((p, idx) => {
                  if (typeof p === "string") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-6 sm:w-8 h-10 sm:h-11 flex items-center justify-center text-zinc-500 font-bold tracking-widest select-none text-xs"
                      >
                        &hellip;
                      </span>
                    );
                  }

                  const isActive = p === currentPage;
                  return (
                    <Link
                      key={p}
                      href={withFilter({ page: String(p) })}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all active:scale-95 ${
                        isActive
                          ? "bg-white text-zinc-950 font-black shadow-md ring-2 ring-white/20"
                          : "border border-white/10 bg-[#121217] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#181820] font-medium"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}

                {/* Next Page Button (>) */}
                {currentPage < totalPages && (
                  <Link
                    href={withFilter({ page: String(currentPage + 1) })}
                    aria-label="Next page"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border border-white/10 bg-[#121217] text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#181820] transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <section className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 py-24 text-center space-y-4 bg-[#121217] border-white/8">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display">
              No Football Kits Found
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No kits match {filterLabels.length ? filterLabels.join(", ") : "the selected sort order"}. Adjust your filters or reset to explore the full collection.
            </p>
            <div className="pt-2">
              <Button asChild className="rounded-lg px-7 h-auto py-3 text-xs uppercase tracking-wider font-extrabold">
                <Link href="/jersey">Reset All Filters</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
