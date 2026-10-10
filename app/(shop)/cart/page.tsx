import { getPaymentMethods } from "@/lib/data";
import { Checkout } from "./checkout";

export const dynamic = "force-dynamic";

// helper type dari checkout
export type { PaymentOption } from "./checkout";

export default async function CartPage() {
  const methods = await getPaymentMethods();
  const paymentOptions = methods.map((m) => ({
    id: m.id,
    label: m.label,
    desc:
      m.type === "qr_pay"
        ? "Scan & pay via Maybank MAE, CIMB OCTO, Touch 'n Go eWallet & all Malaysian banks"
        : `Direct online bank transfer${m.accountNumber ? ` — Acc: ${m.accountNumber}` : ""}`,
    badge: m.type === "qr_pay" ? "Zero Processing Fee" : m.accountNumber || undefined,
  }));

  return <Checkout paymentOptions={paymentOptions} />;
}
