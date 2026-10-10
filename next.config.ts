import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // base64 upload (receipt 1MB / foto produk 4MB) + overhead multipart
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
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
};

export default nextConfig;
