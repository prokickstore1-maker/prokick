import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://prokickstore1.com";

// Halaman privat: admin, invoice (butuh cookie akses), API, dan hasil filter
// katalog yang tak terbatas kombinasinya.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/admin/login", "/invoice/", "/api/", "/cart"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
