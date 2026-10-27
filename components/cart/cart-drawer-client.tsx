"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart";

// Dynamic import with ssr: false to decouple Radix Sheet & promo engine from initial page bundle
const CartDrawerDynamic = dynamic(
  () => import("@/components/cart/cart-drawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);

export function CartDrawerWrapper({
  shippingSettings,
}: {
  shippingSettings: Record<string, string>;
}) {
  const isOpen = useCartStore((state) => state.isOpen);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasOpened(true);
    }
  }, [isOpen]);

  // Hanya mount setelah cart pertama kali dibuka — menjaga initial page load bebas dari chunk cart & radix sheet.
  // Setelah pernah dibuka, tetap di-mount agar animasi slide-out Radix Sheet berjalan halus saat ditutup.
  if (!hasOpened) return null;

  return <CartDrawerDynamic shippingSettings={shippingSettings} />;
}
