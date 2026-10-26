import { db, checkDbConnection, client } from "./db";
import { jerseys, jerseyImages, banners, paymentMethods, settings, testimonials } from "@/db/schema";
import { unstable_cache } from "next/cache";
import { eq, desc, asc, inArray, and, or, ne, ilike, gte, lte, sql, count, type SQL } from "drizzle-orm";
import { buildLeagueOptions, type LeagueOption } from "@/lib/leagues";

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
export async function getAllJerseys(filterLeague?: string): Promise<NormalizedJersey[]> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const rows = await db.query.jerseys.findMany({
        where: filterLeague ? eq(jerseys.league, filterLeague) : undefined,
        orderBy: [desc(jerseys.createdAt)],
      });

      if (rows && rows.length > 0) {
        return rows.map((r) => normalizeJerseyRow(r));
      }
    } catch (e) {
      console.warn("DB query jerseys failed:", e);
    }
  }

  // DB offline / error / kosong = gagal-closed: [] bukan data mock
  return [];
}

export async function getJerseyById(id: string): Promise<NormalizedJersey | null> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
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
  }

  return null;
}

// ---------------------------------------------------------------------------
// Katalog: filter + sort + pagination di level SQL (bukan .filter() di RAM)
// ---------------------------------------------------------------------------

export interface CatalogFilter {
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
  const conds: (SQL | undefined)[] = [];
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
  if (!(await checkDbConnection())) return { items: [], total: 0 };

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
  if (!(await checkDbConnection())) return [];
  try {
    const rows = await db.query.jerseys.findMany({
      where: eq(jerseys.isBestSeller, true),
      orderBy: [desc(jerseys.createdAt)],
      limit,
    });
    // Jika jumlah jersey berlabel isBestSeller kurang dari limit, lengkapi dengan jersey terbaru agar grid selalu penuh
    if (rows.length < limit) {
      const existingIds = new Set(rows.map((r) => r.id));
      const fallbacks = await db.query.jerseys.findMany({
        where: and(ne(jerseys.type, "Retro")),
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
  if (!(await checkDbConnection())) return [];
  try {
    const rows = await db.query.jerseys.findMany({
      where: eq(jerseys.isNew, true),
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
  if (!(await checkDbConnection())) return [];
  try {
    const rows = await db.query.jerseys.findMany({
      where: or(
        eq(jerseys.edition, "Vintage"),
        ilike(jerseys.type, "%Retro%"),
        ilike(jerseys.league, "%Retro%")
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
  if (!(await checkDbConnection())) return [];
  try {
    const rows = await db
      .selectDistinct({ country: jerseys.country })
      .from(jerseys)
      .where(eq(jerseys.category, "Tim Nasional"))
      .orderBy(jerseys.country);
    return rows.map((r) => r.country).filter(Boolean);
  } catch (e) {
    console.warn("DB national countries failed:", e);
    return [];
  }
}

// Halaman detail: related = liga sama ATAU best seller, limit 4
export async function getRelatedKits(league: string, excludeId: string, limit = 4): Promise<NormalizedJersey[]> {
  if (!(await checkDbConnection())) return [];
  try {
    const rows = await db.query.jerseys.findMany({
      where: and(
        ne(jerseys.id, excludeId),
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
export async function getCatalogFilterOptions(): Promise<{
  categories: string[];
  types: string[];
  editions: string[];
  seasons: string[];
  sizes: string[];
}> {
  const empty = { categories: [], types: [], editions: [], seasons: [], sizes: [] };
  if (!(await checkDbConnection())) return empty;
  try {
    const [cats, types, editions, seasons, sizeRows] = await Promise.all([
      db.selectDistinct({ v: jerseys.category }).from(jerseys).orderBy(jerseys.category),
      db.selectDistinct({ v: jerseys.type }).from(jerseys).orderBy(jerseys.type),
      db.selectDistinct({ v: jerseys.edition }).from(jerseys).orderBy(jerseys.edition),
      db.selectDistinct({ v: jerseys.season }).from(jerseys).orderBy(desc(jerseys.season)),
      // sizes = JSON array; unnest ke elemen lalu distinct
      client`SELECT DISTINCT sz FROM jerseys, json_array_elements_text(sizes::json) AS sz ORDER BY 1` as Promise<{ sz: string }[]>,
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
    const rows = await getAllJerseys();
    return buildLeagueOptions(rows);
  },
  ["league-options"],
  { tags: ["jerseys-all"], revalidate: 60 }
);

export async function getActiveBanners(): Promise<BannerView[]> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const rows = await db.query.banners.findMany({
        where: eq(banners.active, true),
        orderBy: [banners.displayOrder],
      });
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          image: r.image,
          badge: "2026/27",
          title: r.title || "MATCHDAY SHIRTS",
          subtitle: r.subtitle || "2026/27 football shirts for supporters.",
          link: r.link || "/jersey",
          cta: "View shirts",
        }));
      }
    } catch (e) {
      console.warn("DB query banners failed:", e);
    }
  }

  return [];
}

export async function getSetting(key: string, fallback: string) {
  const isDbOnline = await checkDbConnection();
  if (isDbOnline) {
    try {
      const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      if (row) return row.value;
    } catch (e) {
      console.warn("Falling back to default setting:", e);
    }
  }
  return fallback;
}

// Ambil ongkir + threshold gratis ongkir dari settings admin
export async function getShippingSettingsMap(): Promise<Record<string, string>> {
  const isDbOnline = await checkDbConnection();
  if (isDbOnline) {
    try {
      const rows = await db.select().from(settings);
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch (e) {
      console.warn("Falling back to default shipping settings:", e);
    }
  }
  return {};
}

export async function getPaymentMethods() {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const rows = await db.query.paymentMethods.findMany({
        where: eq(paymentMethods.isActive, true),
      });
      if (rows && rows.length > 0) return rows;
    } catch (e) {
      console.warn("DB query payment methods failed:", e);
    }
  }

  return [];
}

export interface TestimonialView {
  id: string;
  name: string;
  rating: number;
  comment: string;
  club: string | null;
  proofImage: string | null;
}

// Testimoni aktif untuk section di atas footer. DB offline / kosong → [] (section disembunyikan).
export async function getActiveTestimonials(): Promise<TestimonialView[]> {
  const isDbOnline = await checkDbConnection();
  if (!isDbOnline) return [];

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
}
