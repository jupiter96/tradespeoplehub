import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItemAddon {
  id: number;
  title: string;
  price: number;
}

export interface BookingInfo {
  date: string; // ISO date string
  time: string; // "09:00", "14:30", etc.
  timeSlot?: string; // "Morning", "Afternoon", "Evening"
}

export interface CartItem {
  id: string;
  title: string;
  seller: string;
  price: number;
  image: string;
  rating?: number;
  quantity: number;
  addons?: CartItemAddon[];
  booking?: BookingInfo;
  packageType?: string; // "basic", "standard", "premium"
}

interface CartContextType {
  cartCount: number;
  cartTotal: number;
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const addonsTotal = item.addons?.reduce((addonSum, addon) => addonSum + addon.price, 0) || 0;
    return sum + (item.price + addonsTotal) * item.quantity;
  }, 0);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartTotal,
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
