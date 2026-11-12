"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart";
import { CartDrawer } from "@/components/cart/cart-drawer";

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

  // Hanya mount setelah cart pertama kali dibuka.
  // Setelah pernah dibuka, tetap di-mount agar animasi slide-out Radix Sheet berjalan halus saat ditutup.
  if (!hasOpened) return null;

  return <CartDrawer shippingSettings={shippingSettings} />;
}
