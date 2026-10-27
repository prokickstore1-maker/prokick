import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Pembayaran | ProKick Store",
  description: "Halaman instruksi pembayaran dan rincian pesanan ProKick Store Indonesia.",
  robots: { index: false, follow: false, nocache: true },
};

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
