import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lacak Pesanan | ProKick Store",
  description: "Cek status pengiriman pesanan jersey sepak bola Anda secara real-time di ProKick Store.",
  robots: { index: false, follow: false },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
