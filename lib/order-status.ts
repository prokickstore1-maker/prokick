// label status order untuk UI pembeli (invoice & tracking) — hindari enum mentah
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Bukti Transfer",
  PROCESSING: "Bukti Diunggah • Verifikasi",
  SHIPPED: "Pesanan Dikirim",
  COMPLETED: "Pesanan Selesai",
  CANCELLED: "Pesanan Dibatalkan",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
