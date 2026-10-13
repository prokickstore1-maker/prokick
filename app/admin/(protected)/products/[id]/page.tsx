import { notFound } from "next/navigation";
import { getAllJerseys, getJerseyById } from "@/lib/data";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, products] = await Promise.all([getJerseyById(id), getAllJerseys()]);
  if (!product) notFound();
  return <ProductForm initialProducts={products} product={product} />;
}
