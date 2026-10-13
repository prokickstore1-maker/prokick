import { getAllJerseys } from "@/lib/data";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  return <ProductForm initialProducts={await getAllJerseys()} />;
}
