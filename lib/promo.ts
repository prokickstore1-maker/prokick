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
export interface ShippingSettings {
  javaRate: number;
  outsideJavaRate: number;
  freeShippingMinItems: number;
}

export function toShippingSettings(settings: Record<string, string>): ShippingSettings {
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    javaRate: num(settings.javaShippingCost ?? settings.peninsularShippingCost, BASE_SHIPPING_RATES.Jawa),
    outsideJavaRate: num(settings.outsideJavaShippingCost ?? settings.eastShippingCost, BASE_SHIPPING_RATES["Luar Jawa"]),
    freeShippingMinItems: Math.max(1, Math.floor(num(settings.freeShippingMinItems, 2))),
  };
}

export const STANDARD_NAMESET_FEE = 70000;
export const STANDARD_PATCH_FEE = 35000;

/**
 * Pure deterministic calculation function for cart bundle promotions
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
  items.forEach((item) => {
    if (item.hasNameset) {
      totalNamesetCost += (item.namesetPrice ?? STANDARD_NAMESET_FEE) * item.quantity;
    }
    if (item.hasPatch) {
      totalPatchCost += (item.patchPrice ?? STANDARD_PATCH_FEE) * item.quantity;
    }
  });

  const customizationTotal = totalNamesetCost + totalPatchCost;
  const rates: Record<ShippingZone, number> = settings
    ? { Jawa: settings.javaRate, "Luar Jawa": settings.outsideJavaRate }
    : BASE_SHIPPING_RATES;
  const baseShipping = rates[zone] ?? BASE_SHIPPING_RATES.Jawa;

  // Tier 1: Buy N+ (default 2, diatur admin) -> Free Nationwide Shipping
  const freeShippingMin = settings?.freeShippingMinItems ?? 2;
  const freeShippingUnlocked = totalQuantity >= freeShippingMin;
  const shippingDiscount = freeShippingUnlocked ? baseShipping : 0;
  const shippingCost = freeShippingUnlocked ? 0 : baseShipping;

  // Tier 2: Buy 3+ -> Free Sleeve Patch (up to standard patch fee)
  const freePatchUnlocked = totalQuantity >= 3;
  const patchDiscount = freePatchUnlocked ? Math.min(totalPatchCost, STANDARD_PATCH_FEE) : 0;

  // Tier 3: Buy 5+ -> Free Nameset (bonus jersey not implemented)
  const freeNamesetUnlocked = totalQuantity >= 5;
  const namesetDiscount = freeNamesetUnlocked ? Math.min(totalNamesetCost, STANDARD_NAMESET_FEE) : 0;
  const bonusJerseyUnlocked = false;
  const bonusJerseyDiscount = 0;

  const totalDiscount = shippingDiscount + patchDiscount + namesetDiscount + bonusJerseyDiscount;
  const grandTotal = Math.max(0, rawSubtotal + customizationTotal + shippingCost - patchDiscount - namesetDiscount - bonusJerseyDiscount);

  // Concrete, Direct Messaging (Anti-Slop)
  let nextTierMessage = "";
  let progressPercent = 0;
  let promoBadgeText = "Standard Order";

  if (totalQuantity === 0) {
    nextTierMessage = `Add jerseys to activate volume discounts.`;
    progressPercent = 0;
  } else if (totalQuantity < freeShippingMin) {
    const needed = freeShippingMin - totalQuantity;
    nextTierMessage = `Add ${needed} more jersey${needed > 1 ? "s" : ""} for free J&T delivery.`;
    progressPercent = Math.round((totalQuantity / freeShippingMin) * 50);
    promoBadgeText = `${totalQuantity} Jersey${totalQuantity > 1 ? "s" : ""}`;
  } else if (totalQuantity < 3) {
    nextTierMessage = "Free shipping active. Add 1 more jersey for a free sleeve patch.";
    progressPercent = 66;
    promoBadgeText = "Free Shipping Active";
  } else if (totalQuantity >= 3 && totalQuantity < 5) {
    const needed = 5 - totalQuantity;
    nextTierMessage = `Add ${needed} more jersey${needed > 1 ? "s" : ""} for a free custom nameset.`;
    progressPercent = totalQuantity === 3 ? 75 : 85;
    promoBadgeText = "Free Shipping + Patch Active";
  } else {
    nextTierMessage = "All volume discounts active: free delivery, free sleeve patch, and free nameset.";
    progressPercent = 100;
    promoBadgeText = "All Discounts Active";
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
