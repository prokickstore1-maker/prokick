import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // base64 receipt ~33% lebih besar dari file; 2mb kasih ruang overhead multipart
    serverActions: { bodySizeLimit: "2mb" },
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
    ],
  },
};

export default nextConfig;
