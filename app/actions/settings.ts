"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { banners, paymentMethods, settings } from "@/db/schema";
import { db, checkDbConnection } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

async function guard() {
  if (!(await isAdmin())) return "Unauthorized";
  if (!(await checkDbConnection())) return "Database unavailable";
  return null;
}

export async function updateStoreSettingAction(key: string, value: string) {
  const error = await guard();
  if (error) return { success: false, error };
  if (!/^[a-zA-Z][a-zA-Z0-9_]{1,80}$/.test(key) || value.length > 500) {
    return { success: false, error: "Invalid setting" };
  }

  await db.insert(settings).values({ key, value }).onConflictDoUpdate({
    target: settings.key,
    set: { value },
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateBannerAction(id: string, input: { title: string; subtitle: string; link: string; active: boolean; image?: string; displayOrder?: number }) {
  const error = await guard();
  if (error) return { success: false, error };
  const imageOk = !input.image || ((input.image.startsWith("/") || /^https?:\/\//.test(input.image)) && input.image.length <= 500);
  if (!id || input.title.length > 120 || input.subtitle.length > 240 || !input.link.startsWith("/") || !imageOk ||
      (input.displayOrder !== undefined && (!Number.isInteger(input.displayOrder) || input.displayOrder < 0))) {
    return { success: false, error: "Invalid banner" };
  }

  await db.update(banners).set(input).where(eq(banners.id, id));
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updatePaymentMethodAction(id: string, input: { label: string; accountName: string; accountNumber: string; isActive: boolean; qrImageUrl?: string | null }) {
  const error = await guard();
  if (error) return { success: false, error };
  if (!id || !input.label.trim() || input.label.length > 100 || input.accountName.length > 120 || input.accountNumber.length > 80 || (input.qrImageUrl && input.qrImageUrl.length > 500)) {
    return { success: false, error: "Invalid payment method" };
  }

  await db.update(paymentMethods).set(input).where(eq(paymentMethods.id, id));
  revalidatePath("/cart");
  revalidatePath("/invoice/[orderId]");
  revalidatePath("/admin/settings");
  return { success: true };
}

function validPaymentInput(input: { label: string; accountName: string; accountNumber: string; qrImageUrl?: string | null }) {
  return typeof input.label === "string" && input.label.trim().length > 0 && input.label.length <= 100 &&
    typeof input.accountName === "string" && input.accountName.length <= 120 &&
    typeof input.accountNumber === "string" && input.accountNumber.length <= 80 &&
    (typeof input.qrImageUrl !== "string" || input.qrImageUrl.length <= 500);
}

// tipe harus dikenali UI checkout — tipe asing bikin metode tak tampil/gagal di checkout
const PAYMENT_TYPES = new Set(["qr_pay", "bank_transfer", "ewallet"]);

export async function createPaymentMethodAction(type: string, input: { label: string; accountName: string; accountNumber: string; qrImageUrl?: string | null }) {
  const error = await guard();
  if (error) return { success: false, error };
  if (typeof type !== "string" || !PAYMENT_TYPES.has(type) || !input || typeof input !== "object" || !validPaymentInput(input)) {
    return { success: false, error: "Invalid payment method" };
  }
  await db.insert(paymentMethods).values({ ...input, label: input.label.trim(), type, isActive: true });
  revalidatePath("/cart");
  revalidatePath("/admin/settings");
  return { success: true };
}

// Order lama aman: paymentMethods.id di orders FK set null, snapshot tetap tampil
export async function deletePaymentMethodAction(id: string) {
  const error = await guard();
  if (error) return { success: false, error };
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { success: false, error: "Invalid payment method" };
  }
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  revalidatePath("/cart");
  revalidatePath("/admin/settings");
  return { success: true };
}
