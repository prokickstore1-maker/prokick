import Link from "next/link";
import { getJerseysPaginated, getCatalogFilterOptions, getCachedLeagueOptions, type CatalogSort } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";
import { JerseyCard } from "@/components/jersey/jersey-card";
import { Search, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 16;

// Urutan liga di pill filter — sama dengan lib/leagues (All Kits di depan)
const PILL_LEAGUE_ORDER = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Nation"];

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
  const currentEdition = resolvedParams.edition || "";
  // Satukan Vintage & Retro ke satu filter Tipe "Retro" agar tidak ada duplikasi konsep Retro vs Vintage
  const currentType =
    resolvedParams.type || (/^vintage|^retro/i.test(currentEdition) ? "Retro" : "");
  const currentSeason = resolvedParams.season || "";
  const currentKitType = resolvedParams.kitType || "";
  const currentSize = resolvedParams.size || "";
  const minPrice = Number(resolvedParams.minPrice || 0);
  const maxPrice = Number(resolvedParams.maxPrice || 0);
  const searchQuery = resolvedParams.search || "";
  const requestedPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const sort: CatalogSort =
    resolvedParams.sort === "price-asc" || resolvedParams.sort === "price-desc" ? resolvedParams.sort : "featured";

  // Filter + sort + LIMIT/OFFSET di SQL — tidak menarik 1.020 jersey ke RAM
  const [{ items: paginatedJerseys, total: totalItems }, filterOptions, leagueOptions] = await Promise.all([
    getJerseysPaginated(
      {
        league: currentLeague,
        team: currentTeam,
        category: currentCategory,
        country: currentCountry,
        type: currentType,
        season: currentSeason,
        edition: currentEdition,
        kitType: currentKitType,
        size: currentSize,
        minPrice,
        maxPrice,
        search: searchQuery,
      },
      requestedPage,
      ITEMS_PER_PAGE,
      sort
    ),
    getCatalogFilterOptions(),
    getCachedLeagueOptions(),
  ]);

  const categoryOptions = filterOptions.categories;
  const typeOptions = filterOptions.types;
  const editionOptions = filterOptions.editions;
  const seasonOptions = filterOptions.seasons;
  // ukuran diturunkan dari produk yang ada (ukuran anak/3XL ikut muncul sendiri)
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "XXL", "XXXL"];
  const sizeOptions = filterOptions.sizes.sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const paginationRange = getPaginationRange(currentPage, totalPages);

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

  const filterLabels: string[] = [
    currentLeague && `Liga: ${currentLeague}`,
    currentTeam && `Klub: ${currentTeam}`,
    currentCategory && `Kategori: ${currentCategory}`,
    currentCountry && `Negara: ${currentCountry}`,
    currentType && `Tipe: ${currentType}`,
    currentSeason && `Musim: ${currentSeason}`,
    currentKitType && `Kit: ${currentKitType}`,
    currentSize && `Ukuran: ${currentSize}`,
    minPrice > 0 && `Min Rp${minPrice}`,
    maxPrice > 0 && `Max Rp${maxPrice}`,
    searchQuery && `“${searchQuery}”`,
  ].filter(Boolean) as string[];

  const hasActiveFilters = filterLabels.length > 0 || sort !== "featured";

  const activeFilterChips: Array<{ label: string; clearHref: string }> = [
    ...(currentTeam ? [{ label: `Klub: ${currentTeam}`, clearHref: withFilter({ team: "", page: "" }) }] : []),
    ...(currentCountry ? [{ label: `Negara: ${currentCountry}`, clearHref: withFilter({ country: "", page: "" }) }] : []),
    ...(currentLeague && !currentTeam ? [{ label: `Liga: ${currentLeague}`, clearHref: withFilter({ league: "", page: "" }) }] : []),
    ...(currentCategory ? [{ label: `Kategori: ${currentCategory}`, clearHref: withFilter({ category: "", page: "" }) }] : []),
    ...(currentType ? [{ label: `Tipe: ${currentType}`, clearHref: withFilter({ type: "", edition: "", page: "" }) }] : []),
    ...(currentSeason ? [{ label: `Musim: ${currentSeason}`, clearHref: withFilter({ season: "", page: "" }) }] : []),
    ...(currentKitType ? [{ label: `Kit: ${currentKitType}`, clearHref: withFilter({ kitType: "", page: "" }) }] : []),
    ...(currentSize ? [{ label: `Ukuran: ${currentSize}`, clearHref: withFilter({ size: "", page: "" }) }] : []),
    ...(minPrice > 0 ? [{ label: `Min Rp${minPrice}`, clearHref: withFilter({ minPrice: "", page: "" }) }] : []),
    ...(maxPrice > 0 ? [{ label: `Max Rp${maxPrice}`, clearHref: withFilter({ maxPrice: "", page: "" }) }] : []),
    ...(searchQuery ? [{ label: `Cari: "${searchQuery}"`, clearHref: withFilter({ search: "", page: "" }) }] : []),
  ];

  const pageHeading = currentTeam
    ? `Koleksi ${currentTeam}`
    : currentCountry
    ? `Tim Nasional ${currentCountry}`
    : searchQuery
    ? `Hasil Pencarian: “${searchQuery}”`
    : /^retro$/i.test(currentType)
    ? "Koleksi Jersey Retro Klasik"
    : currentLeague
    ? `Koleksi ${currentLeague}`
    : currentCategory
    ? `Koleksi ${currentCategory}`
    : "Katalog Jersey & Kit";

  const pageSubtitle = currentTeam
    ? `${currentLeague || "Klub"} • Jersey & Jaket Resmi`
    : currentCountry
    ? "Koleksi Tim Nasional • Jersey & Jaket"
    : searchQuery
    ? "Pencarian Lintas Katalog (Jersey & Jaket)"
    : /^retro$/i.test(currentType)
    ? "Edisi Klasik & Legendaris"
    : "Musim 2026/27 • Semua Koleksi";

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2F952] block mb-1">
              {pageSubtitle}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-display uppercase tracking-tight flex flex-wrap items-baseline gap-2.5">
              <span>{pageHeading}</span>
              <span className="text-base sm:text-xl font-mono text-zinc-400 font-semibold">
                ({totalItems} Produk)
              </span>
            </h1>
            {totalPages > 1 && (
              <p className="text-xs text-zinc-400 font-sans mt-1">
                Menampilkan <span className="text-white font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> dari <span className="text-white font-semibold">{totalItems}</span> produk &bull; Halaman {currentPage} dari {totalPages}
              </p>
            )}
          </div>

          {hasActiveFilters && (
            <Link
              href="/jersey"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Produk</span>
            </Link>
          )}
        </div>

        {/* Pita Filter Aktif — Pembeli tahu persis posisi filter yang sedang terbuka */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
              Filter Aktif:
            </span>
            {activeFilterChips.map((chip) => (
              <Link
                key={chip.label}
                href={chip.clearHref}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F952]/10 border border-[#E2F952]/30 text-[#E2F952] text-xs font-bold hover:bg-[#E2F952]/20 transition-colors"
                title="Klik untuk menghapus filter ini"
              >
                <span>{chip.label}</span>
                <span aria-hidden className="text-zinc-300 font-black">&times;</span>
              </Link>
            ))}
          </div>
        )}

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

          {/* Search Input — pencarian baru tidak mengunci klub/liga lama agar hasil selalu ditemukan */}
          <form method="GET" action="/jersey" className="relative flex items-center gap-2 w-full lg:w-96">
            {sort !== "featured" && <input type="hidden" name="sort" value={sort} />}
            <div className="relative flex-1">
              <Input
                key={searchQuery}
                type="text"
                name="search"
                aria-label="Cari jersey atau jaket"
                defaultValue={searchQuery}
                placeholder="Cari klub, negara, jaket, retro..."
                className="w-full h-auto rounded-lg bg-[#121217] hover:bg-[#181820] text-xs text-white placeholder:text-zinc-400 px-4 py-2.5 pl-10 border-white/10 focus-visible:border-white/30 font-sans"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <Button
              type="submit"
              className="h-auto px-4 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider shrink-0"
            >
              Cari
            </Button>
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

          {/* Type Filter (Sudah mencakup Player Issue, Fans Version, & Retro — tanpa duplikasi dropdown Vintage) */}
          <select
            name="type"
            aria-label="Filter tipe jersey"
            defaultValue={currentType}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">Semua Tipe (Player Issue / Fans / Retro)</option>
            {Array.from(new Set(["Player Issue", "Fans Version", "Retro", ...typeOptions.filter((t) => !/^vintage$/i.test(t))])).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Size Filter */}
          <select
            name="size"
            aria-label="Filter ukuran"
            defaultValue={currentSize}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">Semua Ukuran</option>
            {sizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                Ukuran {opt}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            name="category"
            aria-label="Filter kategori"
            defaultValue={currentCategory}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Season Filter */}
          <select
            name="season"
            aria-label="Filter musim"
            defaultValue={currentSeason}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="">Semua Musim</option>
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
            aria-label="Urutkan hasil"
            defaultValue={sort}
            className="rounded-xl border border-white/10 bg-[#181820] text-zinc-200 px-3 py-2 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="featured">Urutkan: Unggulan</option>
            <option value="price-asc">Harga: Termurah</option>
            <option value="price-desc">Harga: Termahal</option>
          </select>

          {/* Submit Action */}
          <Button
            type="submit"
            className="h-auto w-full rounded-xl px-4 py-2 text-xs gap-1.5 uppercase tracking-wider font-extrabold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Terapkan Filter</span>
          </Button>
        </form>

        {/* Catalog Grid (2-Column Mobile, 4-Column Desktop) */}
        {paginatedJerseys.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 pt-2">
              {paginatedJerseys.map((jersey, idx) => (
                <JerseyCard key={jersey.id} jersey={jersey} priority={idx < 4} />
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
              Produk Tidak Ditemukan
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Belum ada produk yang cocok dengan filter {filterLabels.length ? filterLabels.join(", ") : "yang dipilih"}. Silakan hapus filter untuk melihat seluruh katalog.
            </p>
            <div className="pt-2">
              <Button asChild className="rounded-lg px-7 h-auto py-3 text-xs uppercase tracking-wider font-extrabold">
                <Link href="/jersey">Lihat Semua Katalog</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
