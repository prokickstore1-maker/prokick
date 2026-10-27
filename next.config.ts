import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // base64 upload (receipt 1MB / foto produk 4MB) + overhead multipart
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache for optimized images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // bendera negara (grid National Teams di homepage)
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "is3.cloudhost.id",
      },
      // object storage (endpoint dari env — Garage via Coolify)
      (function () {
        try {
          const u = new URL(process.env.S3_ENDPOINT || "");
          return { protocol: (u.protocol === "http:" ? "http" : "https") as "http" | "https", hostname: u.hostname };
        } catch {
          // belum dikonfigurasi — pattern dummy, tidak dipakai
          return { protocol: "http" as const, hostname: "storage.invalid" };
        }
      })(),
    ],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
