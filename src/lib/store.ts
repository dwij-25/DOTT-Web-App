import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Sticker } from "@prisma/client";

export interface CartItem {
  sticker: Sticker;
  quantity: number;
  customSize?: string;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  promoCode: string | null;
  discountAmount: number;
  
  addItem: (sticker: Sticker, customSize?: string) => void;
  removeItem: (stickerId: string, customSize?: string) => void;
  updateQuantity: (stickerId: string, quantity: number, customSize?: string) => void;
  clearCart: () => void;
  
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  
  setPromoCode: (code: string | null, discount: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,
      promoCode: null,
      discountAmount: 0,

      addItem: (sticker, customSize) => set((state) => {
        // If a custom size is provided, remove the default (non-defined) size sticker of the same ID
        let currentItems = state.items;
        if (customSize) {
          currentItems = currentItems.filter(i => !(i.sticker.id === sticker.id && !i.customSize));
        } else {
          // If trying to add a non-defined size, but a custom size already exists, don't add it
          const hasCustom = currentItems.some(i => i.sticker.id === sticker.id && i.customSize);
          if (hasCustom) return { items: currentItems };
        }

        const existing = currentItems.find(i => i.sticker.id === sticker.id && i.customSize === customSize);
        if (existing) {
          return {
            items: currentItems.map(i => 
              (i.sticker.id === sticker.id && i.customSize === customSize)
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          };
        }
        return { 
          items: [...currentItems, { sticker, quantity: 1, customSize }]
        };
      }),

      removeItem: (stickerId, customSize) => set((state) => ({
        items: state.items.filter(i => !(i.sticker.id === stickerId && i.customSize === customSize))
      })),

      updateQuantity: (stickerId, quantity, customSize) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter(i => !(i.sticker.id === stickerId && i.customSize === customSize)) };
        }
        return {
          items: state.items.map(i => 
            (i.sticker.id === stickerId && i.customSize === customSize)
              ? { ...i, quantity }
              : i
          )
        };
      }),

      clearCart: () => set({ items: [], promoCode: null, discountAmount: 0 }),

      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      setPromoCode: (code, discount) => set({ promoCode: code, discountAmount: discount }),
    }),
    {
      name: "dott-cart-storage",
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);

interface UIState {
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null,
  setToastMessage: (msg) => set({ toastMessage: msg })
}));

interface AppState {
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      soundEnabled: true, // Default to true
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: "dott-app-storage",
    }
  )
);
