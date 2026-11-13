export interface PromoItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  hasNameset?: boolean;
  namesetPrice?: number;
  hasPatch?: boolean;
  patchPrice?: number;
}

export type ShippingZone = "Jawa" | "Luar Jawa";

export interface PromoCalculationResult {
  totalQuantity: number;
  rawSubtotal: number;
  customizationTotal: number;
  shippingCost: number;
  shippingDiscount: number;
  patchDiscount: number;
  namesetDiscount: number;
  bonusJerseyDiscount: number;
  totalDiscount: number;
  grandTotal: number;
  freeShippingUnlocked: boolean;
  freePatchUnlocked: boolean;
  freeNamesetUnlocked: boolean;
  bonusJerseyUnlocked: boolean;
  promoBadgeText: string;
  nextTierMessage: string;
  progressPercent: number;
}

export const BASE_SHIPPING_RATES: Record<ShippingZone, number> = {
  Jawa: 15000,
  "Luar Jawa": 30000,
};

// Override dari settings admin; nilai uang dalam IDR
export type PromoCustomizationScope = "one" | "all";

export interface ShippingSettings {
  javaRate: number;
  outsideJavaRate: number;
  freeShippingMinItems: number;
  namesetFee: number;
  patchFee: number;
  freePatchMinItems: number;
  freeNamesetMinItems: number;
  promoFreeShipping: boolean;
  promoFreePatch: boolean;
  promoFreeNameset: boolean;
  promoCustomizationScope: PromoCustomizationScope;
}

export function toShippingSettings(settings?: Record<string, string>): ShippingSettings {
  const safeSettings = settings || {};
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    javaRate: num(safeSettings.javaShippingCost ?? safeSettings.peninsularShippingCost, BASE_SHIPPING_RATES.Jawa),
    outsideJavaRate: num(safeSettings.outsideJavaShippingCost ?? safeSettings.eastShippingCost, BASE_SHIPPING_RATES["Luar Jawa"]),
    freeShippingMinItems: Math.max(1, Math.floor(num(safeSettings.freeShippingMinItems, 2))),
    namesetFee: num(safeSettings.namesetFee, STANDARD_NAMESET_FEE),
    patchFee: num(safeSettings.patchFee, STANDARD_PATCH_FEE),
    freePatchMinItems: Math.max(1, Math.floor(num(safeSettings.freePatchMinItems, 3))),
    freeNamesetMinItems: Math.max(1, Math.floor(num(safeSettings.freeNamesetMinItems, 5))),
    promoFreeShipping: safeSettings.promoFreeShipping === "1",
    promoFreePatch: safeSettings.promoFreePatch === "1",
    promoFreeNameset: safeSettings.promoFreeNameset === "1",
    promoCustomizationScope: safeSettings.promoCustomizationScope === "all" ? "all" : "one",
  };
}

export const STANDARD_NAMESET_FEE = 70000;
export const STANDARD_PATCH_FEE = 35000;

/**
 * Pure deterministic calculation function for cart bundle & daily event promotions
 */
export function calculatePromoEngine(
  items: PromoItem[],
  zone: ShippingZone = "Jawa",
  settings?: ShippingSettings
): PromoCalculationResult {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Customization costs
  let totalNamesetCost = 0;
  let totalPatchCost = 0;
  const namesetFee = settings?.namesetFee ?? STANDARD_NAMESET_FEE;
  const patchFee = settings?.patchFee ?? STANDARD_PATCH_FEE;
  items.forEach((item) => {
    if (item.hasNameset) {
      totalNamesetCost += (item.namesetPrice ?? namesetFee) * item.quantity;
    }
    if (item.hasPatch) {
      totalPatchCost += (item.patchPrice ?? patchFee) * item.quantity;
    }
  });

  const customizationTotal = totalNamesetCost + totalPatchCost;
  const rates: Record<ShippingZone, number> = settings
    ? { Jawa: settings.javaRate, "Luar Jawa": settings.outsideJavaRate }
    : BASE_SHIPPING_RATES;
  const baseShipping = rates[zone] ?? BASE_SHIPPING_RATES.Jawa;

  const scope: PromoCustomizationScope = settings?.promoCustomizationScope ?? "one";

  // Effective minimum items (1 if daily promo toggle is ON, otherwise tier setting)
  const freeShippingMin = settings?.promoFreeShipping ? 1 : (settings?.freeShippingMinItems ?? 2);
  const freePatchMin = settings?.promoFreePatch ? 1 : (settings?.freePatchMinItems ?? 3);
  const freeNamesetMin = settings?.promoFreeNameset ? 1 : (settings?.freeNamesetMinItems ?? 5);

  // 1. Free Shipping Calculation
  const freeShippingUnlocked = totalQuantity > 0 && totalQuantity >= freeShippingMin;
  const shippingDiscount = freeShippingUnlocked ? baseShipping : 0;
  const shippingCost = freeShippingUnlocked ? 0 : baseShipping;

  // 2. Free Patch Calculation (never exceeds actual patch cost; respects "one" vs "all" scope)
  const freePatchUnlocked = totalQuantity > 0 && totalQuantity >= freePatchMin;
  const maxPatchCoverage = scope === "all" ? totalPatchCost : patchFee;
  const patchDiscount = freePatchUnlocked ? Math.min(totalPatchCost, maxPatchCoverage) : 0;

  // 3. Free Nameset Calculation (never exceeds actual nameset cost; respects "one" vs "all" scope)
  const freeNamesetUnlocked = totalQuantity > 0 && totalQuantity >= freeNamesetMin;
  const maxNamesetCoverage = scope === "all" ? totalNamesetCost : namesetFee;
  const namesetDiscount = freeNamesetUnlocked ? Math.min(totalNamesetCost, maxNamesetCoverage) : 0;

  const bonusJerseyUnlocked = false;
  const bonusJerseyDiscount = 0;

  const totalDiscount = shippingDiscount + patchDiscount + namesetDiscount + bonusJerseyDiscount;
  const grandTotal = Math.max(
    0,
    rawSubtotal + customizationTotal + shippingCost - patchDiscount - namesetDiscount - bonusJerseyDiscount
  );

  // Dynamic, collision-free tier & promo messaging (handles any combination of toggles & thresholds)
  const tiers = [
    { key: "shipping", min: freeShippingMin, unlocked: freeShippingUnlocked, label: "Gratis Ongkir", askLabel: "gratis ongkir J&T" },
    { key: "patch", min: freePatchMin, unlocked: freePatchUnlocked, label: "Gratis Patch", askLabel: "gratis patch lengan" },
    { key: "nameset", min: freeNamesetMin, unlocked: freeNamesetUnlocked, label: "Gratis Nameset", askLabel: "gratis custom nameset" },
  ];

  const maxTargetMin = Math.max(1, freeShippingMin, freePatchMin, freeNamesetMin);
  const unlockedLabels = tiers.filter((t) => t.unlocked).map((t) => t.label);
  const pendingTiers = tiers.filter((t) => !t.unlocked).sort((a, b) => a.min - b.min);

  let nextTierMessage = "";
  let progressPercent = 0;
  let promoBadgeText = "Standard Order";

  if (totalQuantity === 0) {
    const activeEventLabels: string[] = [];
    if (settings?.promoFreeShipping) activeEventLabels.push("Gratis Ongkir");
    if (settings?.promoFreeNameset) activeEventLabels.push("Gratis Nameset");
    if (settings?.promoFreePatch) activeEventLabels.push("Gratis Patch");

    if (activeEventLabels.length > 0) {
      nextTierMessage = `Promo Hari Ini Aktif: ${activeEventLabels.join(" + ")} tanpa minimal beli!`;
    } else {
      nextTierMessage = `Tambah produk ke keranjang untuk mengaktifkan promo gratis ongkir & kustomisasi.`;
    }
    progressPercent = 0;
  } else if (pendingTiers.length > 0) {
    const nextTarget = pendingTiers[0];
    const needed = nextTarget.min - totalQuantity;
    // Kelompokkan semua benefit yang terbuka di angka min yang sama
    const sameStepLabels = pendingTiers
      .filter((t) => t.min === nextTarget.min)
      .map((t) => t.askLabel)
      .join(" & ");

    const prefix = unlockedLabels.length > 0 ? `${unlockedLabels.join(" + ")} aktif! ` : "";
    nextTierMessage = `${prefix}Tambah ${needed} item lagi untuk ${sameStepLabels}.`;
    progressPercent = Math.min(95, Math.max(15, Math.round((totalQuantity / maxTargetMin) * 100)));
    promoBadgeText = unlockedLabels.length > 0 ? `${unlockedLabels.join(" + ")} Aktif` : `${totalQuantity} Item`;
  } else {
    nextTierMessage = "Semua promo aktif: Gratis Ongkir, Gratis Patch, dan Gratis Custom Nameset!";
    progressPercent = 100;
    promoBadgeText = "Semua Promo Aktif";
  }

  return {
    totalQuantity,
    rawSubtotal,
    customizationTotal,
    shippingCost,
    shippingDiscount,
    patchDiscount,
    namesetDiscount,
    bonusJerseyDiscount,
    totalDiscount,
    grandTotal,
    freeShippingUnlocked,
    freePatchUnlocked,
    freeNamesetUnlocked,
    bonusJerseyUnlocked,
    promoBadgeText,
    nextTierMessage,
    progressPercent,
  };
}
