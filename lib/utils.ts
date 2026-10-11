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
