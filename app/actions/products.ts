"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { jerseys } from "@/db/schema";
import { db, checkDbConnection } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { uploadProductImage } from "@/lib/s3";

export interface ProductInput {
  name: string; team: string; league: string; season: string; type: string; category: string;
  country: string;
  price: string; description: string; image: string; sizes: string[];
  isBestSeller: boolean; isFeatured: boolean; isNew: boolean;
}

function valid(input: ProductInput) {
  return [input.name, input.team, input.league, input.season, input.type, input.category].every((v) => v.trim()) &&
    Number.isFinite(Number(input.price)) && Number(input.price) >= 0 && input.sizes.length > 0 && input.sizes.length <= 10 &&
    input.sizes.every((size) => /^[A-Z0-9]{1,5}$/.test(size)) && input.country.length <= 40;
}

async function guard(input: ProductInput) {
  if (!(await isAdmin())) return "Unauthorized";
  if (!(await checkDbConnection())) return "Database unavailable";
  if (!valid(input)) return "Invalid product data";
  if (input.image && !/^https?:\/\//.test(input.image) && !input.image.startsWith("/")) return "Invalid image URL";
  return null;
}

export async function createProductAction(input: ProductInput) {
  const error = await guard(input);
  if (error) return { success: false, error };
  // sizes start at 0 so the storefront shows "Out" instead of an unbuyable size
  const stockData = JSON.stringify(Object.fromEntries(input.sizes.map((size) => [size, 0])));
  await db.insert(jerseys).values({ ...input, price: Number(input.price).toFixed(2), sizes: JSON.stringify(input.sizes), stockData, stock: 0, tags: "" });
  revalidatePath("/admin/products"); revalidatePath("/jersey"); revalidatePath("/");
  return { success: true };
}

export async function updateProductAction(id: string, input: ProductInput) {
  const error = await guard(input);
  if (error) return { success: false, error };
  await db.update(jerseys).set({ ...input, price: Number(input.price).toFixed(2), sizes: JSON.stringify(input.sizes) }).where(eq(jerseys.id, id));
  revalidatePath("/admin/products"); revalidatePath("/jersey"); revalidatePath(`/product/${id}`);
  return { success: true };
}

export async function deleteProductAction(id: string) {
  if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
  if (!(await checkDbConnection())) return { success: false, error: "Database unavailable" };
  await db.delete(jerseys).where(eq(jerseys.id, id));
  revalidatePath("/admin/products"); revalidatePath("/jersey");
  return { success: true };
}

// Upload foto produk ke object storage. Sama ketatnya dengan receipt:
// whitelist MIME + magic bytes + cap ukuran, supaya file aneh tak pernah masuk bucket.
export async function uploadProductImageAction(base64Data: string, mimeType: string = "image/jpeg") {
  if (!(await isAdmin())) return { success: false as const, error: "Unauthorized" };

  const match = base64Data.match(/^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || mimeType !== match[1]) return { success: false as const, error: "Only JPEG, PNG, or WebP images are allowed." };

  const buffer = Buffer.from(match[3], "base64");
  if (buffer.length === 0 || buffer.length > 4 * 1024 * 1024) {
    return { success: false as const, error: "Image must be under 4 MB." };
  }

  const sig = buffer.subarray(0, 12).toString("hex");
  const validSig =
    (match[2] === "jpeg" && sig.startsWith("ffd8ff")) ||
    (match[2] === "png" && sig.startsWith("89504e470d0a1a0a")) ||
    (match[2] === "webp" && sig.startsWith("52494646") && buffer.subarray(8, 12).toString() === "WEBP");
  if (!validSig) return { success: false as const, error: "File content is not a valid image." };

  try {
    const url = await uploadProductImage(buffer, `product.${match[2]}`, mimeType);
    return { success: true as const, url };
  } catch (e) {
    console.error("Product image upload failed:", e);
    return { success: false as const, error: e instanceof Error ? e.message : "Upload failed." };
  }
}
