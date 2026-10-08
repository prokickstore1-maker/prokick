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

export type ShippingZone = "Peninsular Malaysia" | "East Malaysia";

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
  "Peninsular Malaysia": 8.00,
  "East Malaysia": 15.00,
};

export const STANDARD_NAMESET_FEE = 20.00;
export const STANDARD_PATCH_FEE = 10.00;

/**
 * Pure deterministic calculation function for cart bundle promotions
 */
export function calculatePromoEngine(
  items: PromoItem[],
  zone: ShippingZone = "Peninsular Malaysia"
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
  const baseShipping = BASE_SHIPPING_RATES[zone] ?? 8.00;

  // Tier 1: Buy 2+ -> Free Nationwide Shipping
  const freeShippingUnlocked = totalQuantity >= 2;
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
    nextTierMessage = "Add jerseys to activate volume discounts.";
    progressPercent = 0;
  } else if (totalQuantity === 1) {
    nextTierMessage = "Add 1 more jersey for free Pos Laju / J&T delivery.";
    progressPercent = 50;
    promoBadgeText = "1 Jersey";
  } else if (totalQuantity === 2) {
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
