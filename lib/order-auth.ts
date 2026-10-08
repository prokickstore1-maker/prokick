import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "prokick_order_access";

function hmacSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  // fail-closed: forged order-access tokens must be impossible when prod forgets the env
  if (process.env.NODE_ENV === "production") throw new Error("NEXTAUTH_SECRET is not set");
  return "dev-only-secret";
}

function sign(orderId: string) {
  return crypto.createHmac("sha256", hmacSecret()).update(orderId).digest("hex");
}

export function createOrderAccessToken(orderId: string) {
  return `${orderId}.${sign(orderId)}`;
}

export function isOrderAccessToken(token: string | undefined, orderId: string) {
  if (!token) return false;
  const [tokenOrderId, supplied] = token.split(".");
  const expected = sign(orderId);
  return tokenOrderId === orderId && Boolean(supplied) && supplied.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

// Cookie holds "id.sig" pairs (newline-separated) so a second order never
// revokes invoice access to the first. Newest first.
export async function grantOrderAccess(orderId: string) {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value || "";
  const pair = createOrderAccessToken(orderId);
  const merged = [pair, ...existing.split("\n").filter((p) => p && p !== pair)].slice(0, 20).join("\n");
  cookieStore.set(COOKIE_NAME, merged, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function canAccessOrder(orderId: string) {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;
  // old single-pair cookie still validates as its only entry
  return raw.split("\n").some((pair) => isOrderAccessToken(pair, orderId));
}
