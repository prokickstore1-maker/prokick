import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { getAllJerseys } from "@/lib/data";
import { buildLeagueOptions } from "@/lib/leagues";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const leagues = buildLeagueOptions(await getAllJerseys());

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-black">
        Skip to content
      </a>
      <Navbar leagues={leagues} />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
