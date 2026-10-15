import { db, checkDbConnection } from "./db";
import { jerseys, jerseyImages, banners, paymentMethods, settings, testimonials } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

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

// Gambar galeri produk dari jersey_images (urut displayOrder); kosong = fallback single image
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

export async function getAllJerseys(filterLeague?: string): Promise<NormalizedJersey[]> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const rows = await db.query.jerseys.findMany({
        where: filterLeague ? eq(jerseys.league, filterLeague) : undefined,
        orderBy: [desc(jerseys.createdAt)],
      });

      if (rows && rows.length > 0) {
        const imageMap = await loadImages(rows.map((r) => r.id));
        return rows.map((r) => {
          const gallery = imageMap.get(r.id)?.map((url) => ({ url }));
          return {
            ...r,
            images: gallery,
            sizes: typeof r.sizes === "string" ? JSON.parse(r.sizes) : (r.sizes || []),
            stockData: typeof r.stockData === "string" ? JSON.parse(r.stockData) : (r.stockData || {}),
            category: r.category || (r.league === "World Cup" ? "Tim Nasional" : "Klub"),
            country: r.country || "England",
            edition: r.edition || (r.type === "Retro" ? "Vintage" : "Current"),
            kitType: r.kitType || "Home",
            isNew: r.isNew ?? false,
          };
        });
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
        const images = gallery?.length ? gallery : undefined;
        return {
          ...row,
          image: images?.[0]?.url || row.image,
          images,
          sizes: typeof row.sizes === "string" ? JSON.parse(row.sizes) : (row.sizes || []),
          stockData: typeof row.stockData === "string" ? JSON.parse(row.stockData) : (row.stockData || {}),
          category: row.category || (row.league === "World Cup" ? "Tim Nasional" : "Klub"),
          country: row.country || "England",
          edition: row.edition || (row.type === "Retro" ? "Vintage" : "Current"),
          kitType: row.kitType || "Home",
          isNew: row.isNew ?? false,
        };
      }
    } catch (e) {
      console.warn("DB findFirst jersey error:", e);
    }
  }

  return null;
}

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

