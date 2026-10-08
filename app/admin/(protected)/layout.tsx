import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { logoutAdminAction } from "@/app/actions/admin-auth";
import { Package, ShoppingBag, ArrowLeft, Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="admin-surface min-h-screen bg-[#FAFAF9] text-[#0C0A09] flex flex-col">
      {/* Admin Top Header */}
      <header className="border-b border-[#E5E5E5] bg-white px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
            PK
          </div>
          <div>
            <h1 className="text-sm font-black text-black font-display tracking-tight">
              PROKICK ADMIN
            </h1>
            <p className="text-[10px] text-[#57534E] uppercase font-semibold">
              Malaysia Operations
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-black transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Orders</span>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-black transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Products</span>
          </Link>

          <Link
            href="/admin/jerseys"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-black transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inventory</span>
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-black transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <form action={logoutAdminAction}>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-black transition-colors">Log out</button>
          </form>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </Link>
        </nav>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
