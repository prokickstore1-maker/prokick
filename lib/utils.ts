import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numerical or string amount to standard Malaysian Ringgit display
 * Example: 89 -> "RM 89.00"
 */
export function formatMYR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "RM 0.00";
  return `RM ${num.toFixed(2)}`;
}
