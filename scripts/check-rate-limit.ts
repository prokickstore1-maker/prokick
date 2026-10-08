// Self-check rate-limit: npx tsx scripts/check-rate-limit.ts
import { rateLimit } from "../lib/rate-limit";

// window fresh: 10 allowed, ke-11 blocked
let blocked = 0;
for (let i = 1; i <= 11; i++) {
  const r = rateLimit("test:a", 10, 60000);
  if (i <= 10 && !r.allowed) throw new Error(`request ${i} harus allowed`);
  if (i === 11 && r.allowed) throw new Error("request 11 harus blocked");
  if (i === 11) blocked = r.retryAfterMinutes;
}
if (blocked < 1) throw new Error("retryAfterMinutes harus >= 1");

// key lain tak terpengaruh
if (!rateLimit("test:b", 10, 60000).allowed) throw new Error("key berbeda harus allowed");

// expired window reset
const r = rateLimit("test:c", 1, 1); // window 1ms
if (!r.allowed) throw new Error("request pertama harus allowed");
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5); // sleep 5ms
if (!rateLimit("test:c", 1, 1).allowed) throw new Error("window expired harus reset");

console.log("RATE_LIMIT_OK");
