"use server";

import { revalidatePath } from "next/cache";
import { db, checkDbConnection } from "@/lib/db";
import { jerseys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MOCK_JERSEYS } from "@/lib/mock-data";
import { isAdmin } from "@/lib/admin-auth";

function applyDelta(currentQty: number, delta: number) {
  return Math.max(0, currentQty + delta);
}

function refreshMockStock(jerseyId: string, size: string, delta: number) {
  const mockItem = MOCK_JERSEYS.find((j) => j.id === jerseyId);
  if (mockItem) {
    mockItem.stockData[size] = applyDelta(mockItem.stockData[size] || 0, delta);
    mockItem.stock = Object.values(mockItem.stockData).reduce((sum, val) => sum + val, 0);
  }
}

export async function updateJerseyStockAction(jerseyId: string, size: string, delta: number) {
  if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
  if (!jerseyId.trim() || !size.trim() || !Number.isInteger(delta) || Math.abs(delta) > 100) {
    return { success: false, error: "Invalid stock update" };
  }

  const isDbOnline = await checkDbConnection();
  if (isDbOnline) {
    try {
      // read-modify-write inside a row lock: two concurrent admin edits serialize
      // instead of silently overwriting each other
      await db.transaction(async (tx) => {
        const [row] = await tx.select().from(jerseys).where(eq(jerseys.id, jerseyId)).for("update");
        if (!row) throw new Error("Product not found");
        const stockObj = typeof row.stockData === "string" ? JSON.parse(row.stockData) : (row.stockData || {});
        stockObj[size] = applyDelta(stockObj[size] || 0, delta);
        const totalStock = Object.values(stockObj).reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0);
        await tx.update(jerseys)
          .set({ stockData: JSON.stringify(stockObj), stock: totalStock })
          .where(eq(jerseys.id, jerseyId));
      });
      refreshMockStock(jerseyId, size, delta);
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

  refreshMockStock(jerseyId, size, delta);
  revalidatePath("/admin/jerseys");
  revalidatePath("/jersey");
  revalidatePath(`/product/${jerseyId}`);
  return { success: true };
}
