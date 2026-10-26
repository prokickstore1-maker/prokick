"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { jerseys, jerseyImages } from "@/db/schema";
import { db, checkDbConnection } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { uploadProductImage } from "@/lib/s3";

export interface ProductInput {
  name: string; team: string; league: string; season: string; type: string; category: string;
  country: string; edition: string; kitType: string;
  price: string; description: string; image: string; sizes: string[];
  images?: string[];
  // stok per ukuran dari form produk — {"S":10,"M":25}; absen = 0 (konsisten perilaku lama)
  stockData?: Record<string, number>;
  isBestSeller: boolean; isFeatured: boolean; isNew: boolean;
}

// Rapikan input teks admin: trim + collapse spasi ganda, cegah "Premier  League" dsb.
function clean(input: ProductInput): ProductInput {
  const tidy = (v: string) => v.trim().replace(/\s+/g, " ");
  // Normalisasi harga Rupiah: hapus 'Rp', spasi, titik ribuan (mis. 'Rp 350.000' -> '350000')
  const cleanPrice = input.price ? input.price.replace(/[^0-9]/g, "") : "0";
  return {
    ...input,
    name: tidy(input.name), team: tidy(input.team), league: tidy(input.league), season: tidy(input.season),
    type: tidy(input.type), category: tidy(input.category), country: tidy(input.country),
    edition: tidy(input.edition), kitType: tidy(input.kitType),
    price: cleanPrice,
  };
}

function validImages(images: string[] | undefined) {
  return !images || (images.length <= 8 && images.every((u) => /^https?:\/\//.test(u) || u.startsWith("/")));
}

function valid(input: ProductInput) {
  return [input.name, input.team, input.league, input.season, input.type, input.category, input.edition, input.kitType].every((v) => v.trim()) &&
    Number.isFinite(Number(input.price)) && Number(input.price) >= 0 && input.sizes.length > 0 && input.sizes.length <= 10 &&
    input.sizes.every((size) => /^[A-Z0-9]{1,5}$/.test(size)) && input.country.length <= 40 && input.edition.length <= 20 && input.kitType.length <= 20 &&
    validImages(input.images);
}

async function guard(input: ProductInput) {
  if (!(await isAdmin())) return "Unauthorized";
  if (!(await checkDbConnection())) return "Database unavailable";
  if (!valid(input)) return "Invalid product data";
  if (input.image && !/^https?:\/\//.test(input.image) && !input.image.startsWith("/")) return "Invalid image URL";
  return null;
}

// stok per ukuran dari form; angka <0 atau non-integer dibuang. Ukuran tanpa input = 0
function buildStockData(sizes: string[], input?: Record<string, number>) {
  const entries = sizes.map((size) => {
    const v = input?.[size];
    const n = Number.isInteger(v) && (v as number) >= 0 ? (v as number) : 0;
    return [size, n] as const;
  });
  return { json: JSON.stringify(Object.fromEntries(entries)), total: entries.reduce((a, [, n]) => a + n, 0) };
}

export async function createProductAction(input: ProductInput) {
  const data = clean(input);
  const error = await guard(data);
  if (error) return { success: false, error };
  const { json: stockData, total } = buildStockData(data.sizes, data.stockData);
  const { images, stockData: _omit, ...rest } = data;
  const gallery = images ?? (data.image ? [data.image] : []);
  await db.transaction(async (tx) => {
    const [row] = await tx.insert(jerseys).values({
      ...rest, image: gallery[0] || data.image,
      price: Number(data.price).toFixed(2), sizes: JSON.stringify(data.sizes), stockData, stock: total, tags: "",
    }).returning({ id: jerseys.id });
    if (gallery.length) {
      await tx.insert(jerseyImages).values(gallery.map((url, index) => ({ jerseyId: row.id, url, displayOrder: index })));
    }
  });
  revalidatePath("/admin/products"); revalidatePath("/admin/jerseys"); revalidatePath("/jersey"); revalidatePath("/");
  return { success: true };
}

export async function updateProductAction(id: string, input: ProductInput) {
  const data = clean(input);
  const error = await guard(data);
  if (error) return { success: false, error };
  const { images, stockData: _omit, ...rest } = data;
  const gallery = images ?? (data.image ? [data.image] : []);
  // stok hanya ditimpa kalau form mengirimnya — edit dari jalur lain tak menghapus stok
  const stock = data.stockData ? buildStockData(data.sizes, data.stockData) : null;
  await db.transaction(async (tx) => {
    await tx.update(jerseys).set({
      ...rest, image: gallery[0] || data.image, price: Number(data.price).toFixed(2),
      sizes: JSON.stringify(data.sizes),
      ...(stock ? { stockData: stock.json, stock: stock.total } : {}),
    }).where(eq(jerseys.id, id));
    await tx.delete(jerseyImages).where(eq(jerseyImages.jerseyId, id));
    if (gallery.length) {
      await tx.insert(jerseyImages).values(gallery.map((url, index) => ({ jerseyId: id, url, displayOrder: index })));
    }
  });
  revalidatePath("/admin/products"); revalidatePath("/admin/jerseys"); revalidatePath("/jersey"); revalidatePath(`/product/${id}`);
  return { success: true };
}

export async function deleteProductAction(id: string) {
  if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
  if (!(await checkDbConnection())) return { success: false, error: "Database offline" };

  // Guard UUID: id non-UUID (dari URL/klik lama) bikin query ke kolom uuid error fatal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return {
      success: false,
      error: "Produk demo (mock data) tidak tersimpan di database dan tidak dapat dihapus via DB. Jalankan seed untuk mengisi database dengan produk asli.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(jerseyImages).where(eq(jerseyImages.jerseyId, id));
      await tx.delete(jerseys).where(eq(jerseys.id, id));
    });
    revalidatePath("/admin/products"); revalidatePath("/admin/jerseys");
    revalidatePath("/jersey"); revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Gagal menghapus produk:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus produk dari database." };
  }
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
    const raw = e instanceof Error ? e.message : "Upload failed.";
    const cleanError = raw === "UnknownError" || raw.includes("AccessDenied")
      ? "Gagal mengunggah ke S3: Akses ditolak (periksa izin bucket 'prokick' dan kredensial S3)."
      : raw;
    return { success: false as const, error: cleanError };
  }
}
