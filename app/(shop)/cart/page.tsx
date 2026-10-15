import { getPaymentMethods, getShippingSettingsMap } from "@/lib/data";
import { Checkout } from "./checkout";

export const dynamic = "force-dynamic";

// helper type dari checkout
export type { PaymentOption } from "./checkout";

export default async function CartPage() {
  const [methods, shippingSettings] = await Promise.all([getPaymentMethods(), getShippingSettingsMap()]);
  const paymentOptions = methods.map((m) => ({
    id: m.id,
    label: m.label,
    desc:
      m.type === "qr_pay"
        ? "Scan pakai GoPay, OVO, DANA, atau aplikasi bank apa pun"
        : m.type === "ewallet"
        ? `Transfer ke e-wallet${m.accountNumber ? ` (${m.accountNumber})` : ""}`
        : `Transfer bank${m.accountNumber ? ` (Rek: ${m.accountNumber})` : ""}`,
    badge: m.type === "qr_pay" ? "Tanpa Biaya Admin" : m.accountNumber || undefined,
  }));

  return <Checkout paymentOptions={paymentOptions} shippingSettings={shippingSettings} />;
}
