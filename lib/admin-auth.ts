import crypto from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, checkDbConnection } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "prokick_admin";

function hmacSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  // fail-closed: forged admin tokens must be impossible when prod forgets the env
  if (process.env.NODE_ENV === "production") throw new Error("NEXTAUTH_SECRET is not set");
  return "dev-only-secret";
}

function signature(value: string) {
  return crypto.createHmac("sha256", hmacSecret()).update(value).digest("hex");
}

export function createAdminToken() {
  const value = `${crypto.randomUUID()}_${Date.now() + 86400000}`;
  return `${value}.${signature(value)}`;
}

export function isAdminToken(token: string | undefined) {
  if (!token) return false;
  const [value, supplied] = token.split(".");
  if (!value || !supplied) return false;
  const expiry = Number(value.split("_")[1]);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = signature(value);
  return supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function authenticateAdmin(email: string, password: string) {
  if (!(await checkDbConnection())) return false;
  const user = await db.query.users.findFirst({ where: eq(users.email, email.trim().toLowerCase()) });
  return Boolean(user && user.role === "ADMIN" && await bcrypt.compare(password, user.password));
}

// ponytail: in-memory per-instance throttle; swap for Redis/DB if you ever run >1 container
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; expiresAt: number }>();

export function checkLoginRateLimit(ip: string) {
  const entry = loginAttempts.get(ip);
  if (!entry || entry.expiresAt < Date.now()) return { allowed: true, retryAfterMinutes: 0 };
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMinutes: Math.ceil((entry.expiresAt - Date.now()) / 60000) };
  }
  return { allowed: true, retryAfterMinutes: 0 };
}

export function recordLoginFailure(ip: string) {
  const now = Date.now();
  // drop expired entries so a flood of unique IPs can't grow the map forever
  for (const [key, value] of loginAttempts) {
    if (value.expiresAt < now) loginAttempts.delete(key);
  }
  const entry = loginAttempts.get(ip);
  if (!entry || entry.expiresAt < now) {
    loginAttempts.set(ip, { count: 1, expiresAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(ip: string) {
  loginAttempts.delete(ip);
}

export async function setAdminSession() {
  (await cookies()).set(COOKIE_NAME, createAdminToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdmin() {
  return isAdminToken((await cookies()).get(COOKIE_NAME)?.value);
}

export const adminCookie = COOKIE_NAME;
