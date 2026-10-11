"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Package, ShoppingBag, ArrowLeft, Settings, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logoutAdminAction } from "@/app/actions/admin-auth";

const navItems = [
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/jerseys", label: "Inventory", icon: Package },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function Nav({ onNavigate, vertical }: { onNavigate?: () => void; vertical?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              vertical
                ? "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#57534E] hover:bg-[#F5F5F5] hover:text-black transition-colors"
                : "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors",
              !vertical &&
                (isActive
                  ? "bg-black text-white"
                  : "bg-[#F5F5F5] text-black hover:bg-black hover:text-white")
            )}
          >
            <Icon className={vertical ? "w-4 h-4" : "w-3.5 h-3.5"} />
            {item.label}
          </Link>
        );
      })}
      <form action={logoutAdminAction} className={vertical ? "" : "ml-auto"}>
        <button
          type="submit"
          className={cn(
            vertical
              ? "flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#57534E] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors text-left"
              : "flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F5F5] text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors"
          )}
        >
          <LogOut className={vertical ? "w-4 h-4" : "w-3.5 h-3.5"} />
          Log out
        </button>
      </form>
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          vertical
            ? "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#57534E] hover:bg-[#F5F5F5] hover:text-black transition-colors"
            : "flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
        )}
      >
        <ArrowLeft className={vertical ? "w-4 h-4" : "w-3.5 h-3.5"} />
        Storefront
      </Link>
    </>
  );
}

export default function AdminHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: hamburger + brand */}
      <header className="lg:hidden sticky top-0 z-40 h-14 border-b border-[#E5E5E5] bg-white px-4 flex items-center gap-3 shadow-sm">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-lg hover:bg-[#F5F5F5] transition-colors text-black"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-white border-[#E5E5E5]">
            <SheetHeader className="p-5 border-b border-[#E5E5E5]">
              <SheetTitle className="flex items-center gap-3 text-left text-black">
                <Image
                  src="/logo/prokick-dark.png"
                  alt="PROKICK MY"
                  width={120}
                  height={52}
                  className="h-7 w-auto"
                />
              </SheetTitle>
            </SheetHeader>
            <div className="p-4 flex flex-col gap-1">
              <Nav vertical onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-sm font-black text-black font-display tracking-tight">
          PROKICK ADMIN
        </h1>
      </header>

      {/* Desktop: top bar tabs */}
      <header className="hidden lg:flex items-center justify-between border-b border-[#E5E5E5] bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo/prokick-dark.png"
            alt="PROKICK MY"
            width={1709}
            height={731}
            className="h-7 w-auto"
          />
          <div>
            <h1 className="text-sm font-black text-black font-display tracking-tight">
              PROKICK ADMIN
            </h1>
            <p className="text-[10px] text-[#57534E] uppercase font-semibold">
              Indonesia Operations
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          <Nav />
        </nav>
      </header>
    </>
  );
}
