// label status order untuk UI pembeli (invoice & tracking) — hindari enum mentah
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting Payment Slip",
  PROCESSING: "Receipt Uploaded • Verifying",
  SHIPPED: "Shipped & Tracking Added",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
