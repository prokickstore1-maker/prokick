import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ShippingZone } from "@/lib/promo";

export interface CartItem {
  id: string; // Composite key: `${jerseyId}-${size}-${namesetName || ""}-${namesetNumber || ""}-${patch || ""}`
  jerseyId: string;
  name: string;
  team: string;
  league: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
  namesetName?: string;
  namesetNumber?: string;
  namesetPrice?: number;
  patch?: string;
  patchPrice?: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  shippingZone: ShippingZone;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setShippingZone: (zone: ShippingZone) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      shippingZone: "Peninsular Malaysia",

      addItem: (newItem) => {
        const id = `${newItem.jerseyId}-${newItem.size}-${newItem.namesetName || "none"}-${newItem.namesetNumber || "none"}-${newItem.patch || "none"}`;
        set((state) => {
          const existing = state.items.find((item) => item.id === id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + newItem.quantity } : item
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...newItem, id }],
            isOpen: true,
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, delta) =>
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id === id) {
                // matches server-side qty cap (order.ts validates 1..20)
                const newQty = Math.min(20, item.quantity + delta);
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter((item): item is CartItem => item !== null),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setShippingZone: (zone) => set({ shippingZone: zone }),
    }),
    {
      name: "prokick-cart-storage",
      partialize: (state) => ({ items: state.items, shippingZone: state.shippingZone }),
      // defer localStorage read past SSR hydration — Navbar triggers rehydrate on mount
      skipHydration: true,
    }
  )
);
