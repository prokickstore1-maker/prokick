import { db, checkDbConnection } from "./db";
import { jerseys, banners, paymentMethods, settings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { MOCK_JERSEYS, MOCK_PAYMENT_METHODS, MOCK_BANNERS, MockBanner } from "./mock-data";

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

export async function getAllJerseys(filterLeague?: string): Promise<NormalizedJersey[]> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const rows = await db.query.jerseys.findMany({
        where: filterLeague ? eq(jerseys.league, filterLeague) : undefined,
        orderBy: [desc(jerseys.createdAt)],
      });

      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const mockMatch = MOCK_JERSEYS.find((m) => m.name === r.name || m.id === r.id);
          return {
            ...r,
            images: mockMatch?.images,
            sizes: typeof r.sizes === "string" ? JSON.parse(r.sizes) : (r.sizes || []),
            stockData: typeof r.stockData === "string" ? JSON.parse(r.stockData) : (r.stockData || {}),
            category: r.category || (r.league === "World Cup" ? "Tim Nasional" : "Klub"),
            country: r.country || (r.team === "Malaysia" ? "Malaysia" : "England"),
            edition: r.edition || (r.type === "Retro" ? "Vintage" : "Current"),
            kitType: r.kitType || "Home",
            isNew: r.isNew ?? false,
          };
        });
      }
    } catch (e) {
      console.warn("Falling back to mock jersey data:", e);
    }
  }

  // Fallback to mock data
  let result = MOCK_JERSEYS;
  if (filterLeague) {
    result = result.filter((j) => j.league.toLowerCase() === filterLeague.toLowerCase());
  }
  return result;
}

export async function getJerseyById(id: string): Promise<NormalizedJersey | null> {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const row = await db.query.jerseys.findFirst({
        where: eq(jerseys.id, id),
      });
      if (row) {
        const mockMatch = MOCK_JERSEYS.find((m) => m.name === row.name || m.id === row.id);
        return {
          ...row,
          images: mockMatch?.images,
          sizes: typeof row.sizes === "string" ? JSON.parse(row.sizes) : (row.sizes || []),
          stockData: typeof row.stockData === "string" ? JSON.parse(row.stockData) : (row.stockData || {}),
        };
      }
    } catch (e) {
      console.warn("DB findFirst error, checking mock fallback:", e);
    }
  }

  const mock = MOCK_JERSEYS.find((j) => j.id === id);
  return mock || null;
}

export async function getActiveBanners(): Promise<MockBanner[]> {
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
      console.warn("Falling back to default banner:", e);
    }
  }

  return MOCK_BANNERS;
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

export async function getPaymentMethods() {
  const isDbOnline = await checkDbConnection();

  if (isDbOnline) {
    try {
      const rows = await db.query.paymentMethods.findMany({
        where: eq(paymentMethods.isActive, true),
      });
      if (rows && rows.length > 0) return rows;
    } catch (e) {
      console.warn("Falling back to default payment methods:", e);
    }
  }

  return MOCK_PAYMENT_METHODS;
}

