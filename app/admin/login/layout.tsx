import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login | ProKick Store",
  description: "Masuk ke portal administrasi ProKick Store Indonesia.",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
