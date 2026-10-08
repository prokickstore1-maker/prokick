import { getAllJerseys } from "@/lib/data";
import { ProductManager } from "@/components/admin/product-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  return <ProductManager initialProducts={await getAllJerseys()} />;
}
