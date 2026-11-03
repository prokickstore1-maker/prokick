import { headers } from "next/headers";

// ponytail: in-memory per-instance throttle; swap for Redis/DB if you ever run >1 container
const buckets = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, retryAfterMinutes: 0 };
  }
  const now = Date.now();
  // drop expired entries so a flood of unique keys can't grow the map forever
  for (const [k, v] of buckets) {
    if (v.expiresAt < now) buckets.delete(k);
  }
  const entry = buckets.get(key);
  if (!entry || entry.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfterMinutes: 0 };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterMinutes: Math.ceil((entry.expiresAt - now) / 60000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterMinutes: 0 };
}

// trust the closest client IP: cf-connecting-ip -> x-real-ip -> first entry in x-forwarded-for
export async function clientIp() {
  const h = await headers();
  const cfIp = h.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const client = forwarded.split(",")[0]?.trim();
    if (client) return client;
  }
  return "unknown";
}
