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

export async function updateBannerAction(id: string, input: { title: string; subtitle: string; link: string; active: boolean }) {
  const error = await guard();
  if (error) return { success: false, error };
  if (!id || input.title.length > 120 || input.subtitle.length > 240 || !input.link.startsWith("/")) {
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
