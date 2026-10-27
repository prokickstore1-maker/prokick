import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format amount to Indonesian Rupiah display
 * Example: 451500 -> "Rp451.500"
 */
export function formatIDR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp0";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num).replace(/^/, "Rp");
}

// "0812-3456-7890" / "+62 812 3456 7890" / "62812..." -> "62812345678"
// Dipakai untuk simpan nomor, wa.me link, dan bandingkan nomor tracking.
export function toIntlPhone(raw: string): string {
  const digits = (raw || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  return `62${digits.replace(/^0+/, "")}`;
}

// Object key S3 ("proofs/…") tidak bisa dipakai langsung sebagai <Image src>.
// Lewati route presign yang sudah mengecek akses. Data-URI (dev fallback) dipakai apa adanya.
export function receiptSrc(orderId: string, paymentProofUrl?: string | null): string | null {
  if (!paymentProofUrl) return null;
  if (paymentProofUrl.startsWith("proofs/")) return `/api/orders/${orderId}/receipt`;
  return paymentProofUrl;
}
