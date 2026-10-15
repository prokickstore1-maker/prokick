"use server";

import { revalidatePath } from "next/cache";
import { db, checkDbConnection } from "@/lib/db";
import { jerseys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

function applyDelta(currentQty: number, delta: number) {
  return Math.max(0, currentQty + delta);
}

export async function updateJerseyStockAction(jerseyId: string, size: string, delta: number) {
  if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
  if (!jerseyId.trim() || !size.trim() || !Number.isInteger(delta) || Math.abs(delta) > 999) {
    return { success: false, error: "Invalid stock update" };
  }

  const isDbOnline = await checkDbConnection();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jerseyId.trim());
  if (!isDbOnline || !isUuid) {
    return { success: false, error: "Database offline. Stock not saved." };
  }

  try {
    // read-modify-write inside a row lock: two concurrent admin edits serialize
    // instead of silently overwriting each other
    await db.transaction(async (tx) => {
      const [row] = await tx.select().from(jerseys).where(eq(jerseys.id, jerseyId.trim())).for("update");
      if (!row) throw new Error("Product not found");
      const stockObj = typeof row.stockData === "string" ? JSON.parse(row.stockData) : (row.stockData || {});
      stockObj[size] = applyDelta(stockObj[size] || 0, delta);
      const totalStock = Object.values(stockObj).reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0);
      await tx.update(jerseys)
        .set({ stockData: JSON.stringify(stockObj), stock: totalStock })
        .where(eq(jerseys.id, jerseyId));
    });
    revalidatePath("/admin/jerseys");
    revalidatePath("/jersey");
    revalidatePath(`/product/${jerseyId}`);
    return { success: true };
  } catch (e) {
    // DB failed → error out; never report success for a write that didn't land
    console.error("DB update stock error:", e);
    return { success: false, error: "Stock update failed. Database did not change." };
  }
}
