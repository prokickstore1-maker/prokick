import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // canonical/OG absolute URL dari env; fallback domain produksi
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://prokickstore1.com"),
  title: "ProKick Store Indonesia | Jersey Bola Original & Retro",
  description: "Toko jersey bola di Indonesia. Jersey klub 2026/27, tim nasional, dan koleksi retro. Bayar dengan QRIS, transfer bank, atau e-wallet.",
  keywords: ["jersey bola", "jersey grade ori", "jersey timnas", "jersey klub", "jersey retro", "QRIS jersey"],
};

// viewportFit: "cover" wajib — tanpa ini env(safe-area-inset-*) selalu 0 di iOS,
// dan sticky bars (cart drawer / purchase bar) nabrak home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", outfit.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-[#09090B] text-[#FAFAFA]">
        {children}
      </body>
    </html>
  );
}
