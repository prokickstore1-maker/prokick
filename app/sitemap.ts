import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { jerseys } from "@/db/schema";
import { desc } from "drizzle-orm";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://prokickstore1.com";

// Batas per sitemap: standar protokol 50.000 URL. Kalau katalog melewati ini,
// pecah pakai generateSitemaps sebelum menambah entri lagi.
const MAX_PRODUCTS = 5000;

// Halaman publik + produk aktif. Filter `/jersey?league=...` sengaja tidak
// didaftarkan: kombinasinya tak terbatas dan menduplikasi konten katalog.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/jersey`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/jaket`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/size-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const rows = await db
      .select({ id: jerseys.id, updatedAt: jerseys.updatedAt, createdAt: jerseys.createdAt })
      .from(jerseys)
      .orderBy(desc(jerseys.updatedAt))
      .limit(MAX_PRODUCTS);

    return [
      ...statics,
      ...rows.map((r) => ({
        url: `${BASE}/product/${r.id}`,
        lastModified: r.updatedAt || r.createdAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (e) {
    // DB offline saat crawler datang: tetap sajikan halaman statis, jangan 500
    console.warn("Sitemap product query failed:", e);
    return statics;
  }
}
