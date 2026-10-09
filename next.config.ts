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
      {
        protocol: "https",
        hostname: "is3.cloudhost.id",
      },
      // bendera negara (grid National Teams di homepage)
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      // object storage (endpoint dari env — bisa diganti ke Garage di Coolify)
      (function () {
        try {
          const u = new URL(process.env.S3_ENDPOINT || "https://is3.cloudhost.id");
          return { protocol: (u.protocol === "http:" ? "http" : "https") as "http" | "https", hostname: u.hostname };
        } catch {
          return { protocol: "https" as const, hostname: "is3.cloudhost.id" };
        }
      })(),
    ],
  },
};

export default nextConfig;
