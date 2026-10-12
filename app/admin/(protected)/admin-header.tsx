"use client";

import Link from "next/link";
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
                ? "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                : "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors",
              !vertical &&
                (isActive
                  ? "bg-[#E2F952] text-[#09090B]"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white")
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
              ? "flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-left"
              : "flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
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
            ? "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            : "flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
        )}
      >
        <ArrowLeft className={vertical ? "w-4 h-4" : "w-3.5 h-3.5"} />
        Storefront
      </Link>
    </>
  );
}

function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-lg bg-[#E2F952] text-[#09090B] font-black font-display tracking-tight",
      compact ? "h-6 w-6 text-[11px]" : "h-7 w-7 text-xs"
    )}>PK</span>
  );
}

export default function AdminHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: hamburger + brand */}
      <header className="lg:hidden sticky top-0 z-40 h-14 border-b border-[#27272A] bg-[#121217]/95 backdrop-blur px-4 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-[#121217] border-[#27272A] text-[#FAFAFA]">
            <SheetHeader className="p-5 border-b border-[#27272A]">
              <SheetTitle className="flex items-center gap-3 text-left text-[#FAFAFA]">
                <BrandMark compact />
                <span className="text-sm font-black font-display tracking-tight">PROKICK ADMIN</span>
              </SheetTitle>
            </SheetHeader>
            <div className="p-4 flex flex-col gap-1">
              <Nav vertical onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <BrandMark compact />
        <h1 className="text-sm font-black text-[#FAFAFA] font-display tracking-tight truncate min-w-0">
          PROKICK ADMIN
        </h1>
      </header>

      {/* Desktop: top bar tabs */}
      <header className="hidden lg:flex items-center justify-between border-b border-[#27272A] bg-[#121217] px-8 py-4">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <h1 className="text-sm font-black text-[#FAFAFA] font-display tracking-tight">
              PROKICK ADMIN
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">
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
