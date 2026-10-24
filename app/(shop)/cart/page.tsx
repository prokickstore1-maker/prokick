import { getPaymentMethods, getShippingSettingsMap } from "@/lib/data";
import { Checkout } from "./checkout";

export const dynamic = "force-dynamic";

// helper type dari checkout
export type { PaymentOption } from "./checkout";

export default async function CartPage() {
  const [methods, shippingSettings] = await Promise.all([getPaymentMethods(), getShippingSettingsMap()]);
  const paymentOptions = methods.map((m) => {
    const isQr = m.type === "qr_pay" || m.label.toLowerCase().includes("qr") || Boolean(m.qrImageUrl);
    return {
      id: m.id,
      label: m.label,
      type: m.type,
      accountName: m.accountName,
      accountNumber: m.accountNumber,
      qrImageUrl: m.qrImageUrl,
      desc: isQr
        ? "Scan pakai GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, atau bank apa pun"
        : m.type === "ewallet"
        ? `Transfer ke ${m.label}${m.accountNumber ? ` (${m.accountNumber})` : ""}${m.accountName ? ` a.n ${m.accountName}` : ""}`
        : `Transfer manual${m.accountNumber ? ` Rek: ${m.accountNumber}` : ""}${m.accountName ? ` a.n ${m.accountName}` : ""}`,
      badge: isQr ? "Bebas Biaya Admin" : (m.accountNumber ? `Rek: ${m.accountNumber}` : undefined),
    };
  });

  return <Checkout paymentOptions={paymentOptions} shippingSettings={shippingSettings} />;
}
