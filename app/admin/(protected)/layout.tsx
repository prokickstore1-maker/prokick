import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import type { Metadata } from "next";
import AdminHeader from "./admin-header";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="admin-surface min-h-screen bg-[#FAFAF9] text-[#0C0A09] flex flex-col">
      <AdminHeader />
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
