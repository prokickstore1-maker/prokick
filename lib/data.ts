import { db, client } from "./db";
import { jerseys, jerseyImages, banners, paymentMethods, settings, testimonials } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq, desc, asc, inArray, and, or, ne, ilike, gte, lte, sql, count, type SQL } from "drizzle-orm";
import { buildLeagueOptions, type LeagueOption } from "@/lib/leagues";
import { PRODUCT_LINE_JERSEY, PRODUCT_LINE_JACKET } from "@/lib/product-lines";

export interface BannerView {
  id: string;
  image: string;
  title: string;
  badge?: string;
  subtitle?: string;
  link: string;
  cta: string;
}

export interface NormalizedJersey {
  id: string;
  productLine: string;
  name: string;
  team: string;
  league: string;
  season: string;
  type: string;
  category: string;
  country: string;
  edition: string;
  kitType: string;
  price: string;
  description: string | null;
  image: string | null;
  images?: Array<{ url: string }>;
  sizes: string[];
  stockData: Record<string, number>;
  stock: number;
  tags: string;
  isBestSeller: boolean;
  isFeatured: boolean;
  isNew?: boolean;
}

type JerseyRow = typeof jerseys.$inferSelect;

// Galeri angle produk dari jersey_images (urut displayOrder); kosong = fallback single image
async function loadImages(jerseyIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (jerseyIds.length === 0) return map;
  try {
    const rows = await db.select().from(jerseyImages)
      .where(inArray(jerseyImages.jerseyId, jerseyIds))
      .orderBy(jerseyImages.displayOrder);
    for (const r of rows) {
      const list = map.get(r.jerseyId) || [];
      list.push(r.url);
      map.set(r.jerseyId, list);
    }
  } catch (e) {
    console.warn("Load jersey images failed:", e);
  }
  return map;
}

// Normalisasi row → shape seragam (sizes/stockData JSON parse + fallback field).
// gallery diisi hanya oleh getJerseyById — listing kartu cukup primary image.
function normalizeJerseyRow(r: JerseyRow, gallery?: { url: string }[]): NormalizedJersey {
  const images = gallery?.length ? gallery : undefined;
  return {
    ...r,
    productLine: r.productLine || PRODUCT_LINE_JERSEY,
    image: images?.[0]?.url || r.image,
    images,
    sizes: typeof r.sizes === "string" ? JSON.parse(r.sizes) : (r.sizes || []),
    stockData: typeof r.stockData === "string" ? JSON.parse(r.stockData) : (r.stockData || {}),
    category: r.category || (r.league === "World Cup" || r.league === "Nation" ? "Tim Nasional" : "Klub"),
    country: r.country || "England",
    edition: r.edition || (r.type === "Retro" ? "Vintage" : "Current"),
    kitType: r.kitType || "Home",
    isNew: r.isNew ?? false,
  };
}

// Listing admin & opsi filter — tanpa galeri 7k foto (kartu cukup image depan)
// Tanpa checkDbConnection pre-check: query asli sudah try/catch → gagal = []
// productLine kosong = semua lini (admin); diisi = hanya lini itu (navbar/filter storefront)
export async function getAllJerseys(filterLeague?: string, productLine?: string): Promise<NormalizedJersey[]> {
  try {
    const rows = await db.query.jerseys.findMany({
      where: and(
        filterLeague ? eq(jerseys.league, filterLeague) : undefined,
        productLine ? eq(jerseys.productLine, productLine) : undefined
      ),
      orderBy: [desc(jerseys.createdAt)],
    });
    return rows.map((r) => normalizeJerseyRow(r));
  } catch (e) {
    console.warn("DB query jerseys failed:", e);
    return [];
  }
}

export async function getJerseyById(id: string): Promise<NormalizedJersey | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
  if (!isUuid) return null;

  try {
    const row = await db.query.jerseys.findFirst({
      where: eq(jerseys.id, id.trim()),
    });
    if (row) {
      const imageMap = await loadImages([row.id]);
      const gallery = imageMap.get(row.id)?.map((url) => ({ url }));
      return normalizeJerseyRow(row, gallery);
    }
  } catch (e) {
    console.warn("DB findFirst jersey error:", e);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Katalog: filter + sort + pagination di level SQL (bukan .filter() di RAM)
// ---------------------------------------------------------------------------

export interface CatalogFilter {
  productLine?: string; // default "Jersey" — jaket hanya muncul bila diminta eksplisit
  league?: string;
  team?: string;
  category?: string;
  country?: string;
  type?: string;
  season?: string;
  edition?: string;
  kitType?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export type CatalogSort = "featured" | "price-asc" | "price-desc";

function buildCatalogWhere(f: CatalogFilter): SQL | undefined {
  const conds: (SQL | undefined)[] = [eq(jerseys.productLine, f.productLine || PRODUCT_LINE_JERSEY)];
  if (f.league) conds.push(ilike(jerseys.league, f.league));
  if (f.team) conds.push(ilike(jerseys.team, f.team));
  if (f.category) conds.push(ilike(jerseys.category, f.category));
  if (f.country) conds.push(ilike(jerseys.country, f.country));
  if (f.type) conds.push(ilike(jerseys.type, f.type));
  if (f.season) conds.push(eq(jerseys.season, f.season));
  if (f.edition) conds.push(ilike(jerseys.edition, f.edition));
  if (f.kitType) conds.push(ilike(jerseys.kitType, f.kitType));
  if (f.size) {
    // sizes = JSON array string; kecocokan elemen persis (XL tidak match XXL)
    conds.push(sql`EXISTS (SELECT 1 FROM json_array_elements_text(${jerseys.sizes}::json) AS sz WHERE sz = ${f.size})`);
  }
  if (f.minPrice && f.minPrice > 0) conds.push(gte(jerseys.price, String(f.minPrice)));
  if (f.maxPrice && f.maxPrice > 0) conds.push(lte(jerseys.price, String(f.maxPrice)));
  if (f.search) {
    const q = `%${f.search}%`;
    conds.push(or(ilike(jerseys.name, q), ilike(jerseys.team, q), ilike(jerseys.tags, q)));
  }
  const active = conds.filter(Boolean) as SQL[];
  return active.length ? and(...active) : undefined;
}

function catalogOrderBy(sort: CatalogSort): SQL[] {
  if (sort === "price-asc") return [asc(jerseys.price)];
  if (sort === "price-desc") return [desc(jerseys.price)];
  // "featured": Season DESC → Current dulu → Home/Away dulu → terbaru
  return [
    desc(jerseys.season),
    sql`CASE WHEN ${jerseys.edition} = 'Current' THEN 0 ELSE 1 END`,
    sql`CASE ${jerseys.kitType} WHEN 'Home' THEN 1 WHEN 'Away' THEN 2 WHEN 'Third' THEN 3 ELSE 4 END`,
    desc(jerseys.createdAt),
  ];
}

// Paginasi katalog: WHERE + ORDER BY + LIMIT/OFFSET di SQL. Tanpa galeri foto.
export async function getJerseysPaginated(
  filter: CatalogFilter,
  page: number,
  pageSize: number,
  sort: CatalogSort = "featured"
): Promise<{ items: NormalizedJersey[]; total: number }> {
  try {
    const where = buildCatalogWhere(filter);
    const [totalRow, rows] = await Promise.all([
      db.select({ value: count() }).from(jerseys).where(where),
      db.query.jerseys.findMany({
        where,
        orderBy: catalogOrderBy(sort),
        limit: pageSize,
        offset: Math.max(0, (page - 1) * pageSize),
      }),
    ]);
    return {
      items: rows.map((r) => normalizeJerseyRow(r)),
      total: totalRow?.[0]?.value ?? 0,
    };
  } catch (e) {
    console.warn("DB paginated query failed:", e);
    return { items: [], total: 0 };
  }
}

// Homepage: 8 best seller tanpa tarik seluruh tabel (auto-fill jika kurang dari limit)
export async function getBestSellers(limit = 8): Promise<NormalizedJersey[]> {
  try {
    const rows = await db.query.jerseys.findMany({
      where: and(eq(jerseys.isBestSeller, true), eq(jerseys.productLine, PRODUCT_LINE_JERSEY)),
      orderBy: [desc(jerseys.createdAt)],
      limit,
    });
    // Jika jumlah jersey berlabel isBestSeller kurang dari limit, lengkapi dengan jersey terbaru agar grid selalu penuh
    if (rows.length < limit) {
      const existingIds = new Set(rows.map((r) => r.id));
      const fallbacks = await db.query.jerseys.findMany({
        where: and(ne(jerseys.type, "Retro"), eq(jerseys.productLine, PRODUCT_LINE_JERSEY)),
        orderBy: [desc(jerseys.isFeatured), desc(jerseys.isNew), desc(jerseys.createdAt)],
        limit: limit * 2,
      });
      for (const f of fallbacks) {
        if (!existingIds.has(f.id)) {
          rows.push(f);
          existingIds.add(f.id);
          if (rows.length >= limit) break;
        }
      }
    }
    return rows.map((r) => normalizeJerseyRow(r));
  } catch (e) {
    console.warn("DB best sellers failed:", e);
    return [];
  }
}

// Homepage: 8 new arrival tanpa tarik seluruh tabel
export async function getNewArrivals(limit = 8): Promise<NormalizedJersey[]> {
  try {
    const rows = await db.query.jerseys.findMany({
      where: and(eq(jerseys.isNew, true), eq(jerseys.productLine, PRODUCT_LINE_JERSEY)),
      orderBy: [desc(jerseys.createdAt)],
      limit,
    });
    return rows.map((r) => normalizeJerseyRow(r));
  } catch (e) {
    console.warn("DB new arrivals failed:", e);
    return [];
  }
}

// Homepage: 8 retro / vintage jerseys tanpa tarik seluruh tabel
export async function getRetroJerseys(limit = 8): Promise<NormalizedJersey[]> {
  try {
    const rows = await db.query.jerseys.findMany({
      where: and(
        eq(jerseys.productLine, PRODUCT_LINE_JERSEY),
        or(
          eq(jerseys.edition, "Vintage"),
          ilike(jerseys.type, "%Retro%"),
          ilike(jerseys.league, "%Retro%")
        )
      ),
      orderBy: [desc(jerseys.createdAt)],
      limit,
    });
    return rows.map((r) => normalizeJerseyRow(r));
  } catch (e) {
    console.warn("DB retro jerseys failed:", e);
    return [];
  }
}

// Homepage: daftar negara tim nasional (distinct, bukan scan semua jersey)
export async function getNationalCountries(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ country: jerseys.country })
      .from(jerseys)
      .where(and(eq(jerseys.category, "Tim Nasional"), eq(jerseys.productLine, PRODUCT_LINE_JERSEY)))
      .orderBy(jerseys.country);
    return rows.map((r) => r.country).filter(Boolean);
  } catch (e) {
    console.warn("DB national countries failed:", e);
    return [];
  }
}

// Halaman detail: related = liga sama ATAU best seller, limit 4
export async function getRelatedKits(league: string, excludeId: string, limit = 4, productLine: string = PRODUCT_LINE_JERSEY): Promise<NormalizedJersey[]> {
  try {
    const rows = await db.query.jerseys.findMany({
      where: and(
        ne(jerseys.id, excludeId),
        eq(jerseys.productLine, productLine),
        or(eq(jerseys.league, league), eq(jerseys.isBestSeller, true))
      ),
      orderBy: [desc(jerseys.isBestSeller), desc(jerseys.createdAt)],
      limit,
    });
    return rows.map((r) => normalizeJerseyRow(r));
  } catch (e) {
    console.warn("DB related kits failed:", e);
    return [];
  }
}

// Opsi dropdown filter katalog (distinct) — tanpa load seluruh tabel
export async function getCatalogFilterOptions(productLine: string = PRODUCT_LINE_JERSEY): Promise<{
  categories: string[];
  types: string[];
  editions: string[];
  seasons: string[];
  sizes: string[];
}> {
  const empty = { categories: [], types: [], editions: [], seasons: [], sizes: [] };
  try {
    const line = eq(jerseys.productLine, productLine);
    const [cats, types, editions, seasons, sizeRows] = await Promise.all([
      db.selectDistinct({ v: jerseys.category }).from(jerseys).where(line).orderBy(jerseys.category),
      db.selectDistinct({ v: jerseys.type }).from(jerseys).where(line).orderBy(jerseys.type),
      db.selectDistinct({ v: jerseys.edition }).from(jerseys).where(line).orderBy(jerseys.edition),
      db.selectDistinct({ v: jerseys.season }).from(jerseys).where(line).orderBy(desc(jerseys.season)),
      // sizes = JSON array; unnest ke elemen lalu distinct
      client`SELECT DISTINCT sz FROM jerseys, json_array_elements_text(sizes::json) AS sz WHERE product_line = ${productLine} ORDER BY 1` as Promise<{ sz: string }[]>,
    ]);
    return {
      categories: cats.map((r) => r.v).filter(Boolean),
      types: types.map((r) => r.v).filter(Boolean),
      editions: editions.map((r) => r.v).filter(Boolean),
      seasons: seasons.map((r) => r.v).filter(Boolean),
      sizes: sizeRows.map((r) => r.sz).filter(Boolean),
    };
  } catch (e) {
    console.warn("DB filter options failed:", e);
    return empty;
  }
}

// Opsi liga/klub untuk navbar & footer — cached 60 detik, di-invalidate admin via revalidateTag("jerseys-all")
export const getCachedLeagueOptions: () => Promise<LeagueOption[]> = unstable_cache(
  async () => {
    const rows = await getAllJerseys(undefined, PRODUCT_LINE_JERSEY);
    return buildLeagueOptions(rows);
  },
  ["league-options"],
  { tags: ["jerseys-all"], revalidate: 60 }
);

// Opsi liga/klub/negara khusus jaket (navbar & filter /jaket)
export const getCachedJacketOptions: () => Promise<LeagueOption[]> = unstable_cache(
  async () => {
    const rows = await getAllJerseys(undefined, PRODUCT_LINE_JACKET);
    return buildLeagueOptions(rows, "/jaket");
  },
  ["jacket-options"],
  { tags: ["jerseys-all"], revalidate: 60 }
);

// Homepage: jaket unggulan/terbaru tanpa tarik seluruh tabel
export async function getLatestJackets(limit = 8): Promise<NormalizedJersey[]> {
  try {
    const rows = await db.query.jerseys.findMany({
      where: eq(jerseys.productLine, PRODUCT_LINE_JACKET),
      orderBy: [desc(jerseys.isFeatured), desc(jerseys.createdAt)],
      limit,
    });
    return rows.map((r) => normalizeJerseyRow(r));
  } catch (e) {
    console.warn("DB latest jackets failed:", e);
    return [];
  }
}

// Banner aktif — cached 60 detik; admin invalidasi via revalidateTag("banners", "max")
export const getActiveBanners = unstable_cache(
  async (): Promise<BannerView[]> => {
    try {
      const rows = await db.query.banners.findMany({
        where: eq(banners.active, true),
        orderBy: [banners.displayOrder],
      });
      return rows.map((r) => {
        const link = r.link || "/jersey";
        const isJacketBanner = link.startsWith("/jaket") || /jaket|tracksuit|windbreaker/i.test(r.title || "");
        const isRetroBanner = /vintage|retro/i.test(link) || /retro|vintage|klasik/i.test(r.title || "");
        return {
          id: r.id,
          image: r.image,
          badge: isJacketBanner ? "Jaket & Tracksuit" : isRetroBanner ? "Retro Classic" : "2026/27",
          title: r.title || "KOLEKSI MUSIM INI",
          subtitle: r.subtitle || "Koleksi pilihan untuk suporter sepak bola Indonesia.",
          link,
          cta: isJacketBanner ? "Lihat Jaket" : "Lihat Koleksi",
        };
      });
    } catch (e) {
      console.warn("DB query banners failed:", e);
      return [];
    }
  },
  ["active-banners"],
  { tags: ["banners"], revalidate: 60 }
);

// Satu-satunya query tabel settings — cache 60 detik di tag "settings".
// Setting individual dibaca dari map ini, bukan query terpisah.
export const getShippingSettingsMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const rows = await db.select().from(settings);
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch (e) {
      console.warn("Falling back to default shipping settings:", e);
      return {};
    }
  },
  ["shipping-settings"],
  { tags: ["settings"], revalidate: 60 }
);

export async function getSetting(key: string, fallback: string) {
  const map = await getShippingSettingsMap();
  return map[key] ?? fallback;
}

// Metode bayar aktif untuk checkout & verifikasi order — cache 60 detik,
// admin invalidate via revalidateTag("payment-methods", { expire: 0 })
export const getPaymentMethods = unstable_cache(
  async () => {
    try {
      return await db.query.paymentMethods.findMany({
        where: eq(paymentMethods.isActive, true),
      });
    } catch (e) {
      console.warn("DB query payment methods failed:", e);
      return [];
    }
  },
  ["payment-methods"],
  { tags: ["payment-methods"], revalidate: 60 }
);

// Validasi saat checkout: query langsung, tanpa cache — metode yang baru
// dinonaktifkan/dihapus admin tidak boleh lolos (BUG-05).
export async function getPaymentMethodById(id: string) {
  try {
    return await db.query.paymentMethods.findFirst({
      where: and(eq(paymentMethods.id, id), eq(paymentMethods.isActive, true)),
    });
  } catch (e) {
    console.warn("DB query payment method failed:", e);
    return undefined;
  }
}

export interface TestimonialView {
  id: string;
  name: string;
  rating: number;
  comment: string;
  club: string | null;
  proofImage: string | null;
}

// Testimoni aktif untuk section di atas footer. Cache 60 detik.
export const getActiveTestimonials = unstable_cache(
  async (): Promise<TestimonialView[]> => {
    try {
      const rows = await db.query.testimonials.findMany({
        where: eq(testimonials.active, true),
        orderBy: [desc(testimonials.createdAt)],
        limit: 12,
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        comment: r.comment,
        club: r.club,
        proofImage: r.proofImage,
      }));
    } catch (e) {
      console.warn("Gagal memuat testimoni:", e);
      return [];
    }
  },
  ["active-testimonials"],
  { tags: ["testimonials"], revalidate: 60 }
);
