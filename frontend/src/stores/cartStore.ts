import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the shape of a single item in the cart
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  businessId?: string;
  trackInventory?: boolean;
  inventoryAvailable?: number;
}

// Define the state structure for the cart
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Omit<CartItem, 'quantity'>) => { ok: boolean; message?: string };
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

// Helper to calculate totals from an array of items
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { totalItems, totalPrice };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addToCart: (product) => {
        const existingItem = get().items.find((item) => item.id === product.id);
        let updatedItems;

        if (product.trackInventory && (product.inventoryAvailable ?? 0) <= 0) {
          return { ok: false, message: "Only 0 left in stock." };
        }

        if (existingItem) {
          if (
            existingItem.trackInventory &&
            existingItem.quantity + 1 > (existingItem.inventoryAvailable ?? 0)
          ) {
            return {
              ok: false,
              message: `Only ${existingItem.inventoryAvailable ?? 0} left in stock.`,
            };
          }
          updatedItems = get().items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          updatedItems = [...get().items, { ...product, quantity: 1 }];
        }
        
        const { totalItems, totalPrice } = calculateTotals(updatedItems);
        set({ items: updatedItems, totalItems, totalPrice });
        return { ok: true };
      },

      removeFromCart: (itemId) => {
        const updatedItems = get().items.filter((item) => item.id !== itemId);
        const { totalItems, totalPrice } = calculateTotals(updatedItems);
        set({ items: updatedItems, totalItems, totalPrice });
      },

      updateQuantity: (itemId, quantity) => {
        let updatedItems;
        if (quantity > 0) {
          const currentItem = get().items.find((item) => item.id === itemId);
          if (
            currentItem?.trackInventory &&
            quantity > (currentItem.inventoryAvailable ?? 0)
          ) {
            return;
          }
          updatedItems = get().items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          );
        } else {
          // Remove the item if quantity is 0 or less
          updatedItems = get().items.filter((item) => item.id !== itemId);
        }
        const { totalItems, totalPrice } = calculateTotals(updatedItems);
        set({ items: updatedItems, totalItems, totalPrice });
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // On rehydration, recalculate totals to ensure they are in sync
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { totalItems, totalPrice } = calculateTotals(state.items);
          state.totalItems = totalItems;
          state.totalPrice = totalPrice;
        }
      },
    }
  )
);
