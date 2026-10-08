"use server";
import { redirect } from "next/navigation";
import {
  authenticateAdmin,
  setAdminSession,
  clearAdminSession,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/admin-auth";
import { clientIp } from "@/lib/rate-limit";

export async function loginAdminAction(email: string, password: string) {
  if (!email.trim() || !password) return { success: false, error: "Enter email and password." };

  const ip = await clientIp();
  const limit = checkLoginRateLimit(ip);
  if (!limit.allowed)
    return { success: false, error: `Too many attempts. Try again in ${limit.retryAfterMinutes} min.` };

  if (!(await authenticateAdmin(email, password))) {
    recordLoginFailure(ip);
    // generic message: same for wrong email vs wrong password
    return { success: false, error: "Invalid credentials." };
  }

  clearLoginFailures(ip);
  await setAdminSession();
  return { success: true };
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
