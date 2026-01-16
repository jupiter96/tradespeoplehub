import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount } from "./AccountContext";
import { resolveApiUrl } from "../config/api";

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
  id: string; // Item key for uniqueness (serviceId|packageType|addons)
  serviceId: string; // Actual MongoDB service ID
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
  updateCartItem: (itemKeyOrId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to generate item key for uniqueness (must match server logic)
function generateItemKey(item: Omit<CartItem, "quantity">) {
  // Use serviceId if available, otherwise use id (for backward compatibility)
  const serviceId = (item as any).serviceId || item.id;
  const parts = [serviceId];
  if (item.packageType) {
    parts.push(item.packageType);
  }
  if (item.addons && item.addons.length > 0) {
    const addonsKey = item.addons
      .sort((a, b) => a.id - b.id)
      .map(a => `${a.id}-${a.price}`)
      .join(',');
    parts.push(addonsKey);
  }
  return parts.join('|');
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAccount();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cart from API when user logs in
  useEffect(() => {
    const fetchCart = async () => {
      if (!isLoggedIn) {
        setCartItems([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          // If cart doesn't exist yet, it will be created on first add
          setCartItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch cart:", error);
        // Keep existing cart items on error
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isLoggedIn]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const addonsTotal = item.addons?.reduce((addonSum, addon) => addonSum + addon.price, 0) || 0;
    return sum + (item.price + addonsTotal) * item.quantity;
  }, 0);

  const addToCart = async (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    // Ensure serviceId is set (use id if serviceId is not provided for backward compatibility)
    const cartItem: Omit<CartItem, "quantity"> = {
      ...item,
      serviceId: (item as any).serviceId || item.id, // Use serviceId if provided, otherwise use id
    };
    
    // Optimistic update
    setCartItems((prev) => {
      const existingItem = prev.find((i) => {
        const existingKey = generateItemKey(i);
        const newKey = generateItemKey(cartItem);
        return existingKey === newKey;
      });
      if (existingItem) {
        return prev.map((i) => {
          const existingKey = generateItemKey(i);
          const newKey = generateItemKey(cartItem);
          if (existingKey === newKey) {
            return { ...i, quantity: i.quantity + quantity };
          }
          return i;
        });
      }
      return [...prev, { ...cartItem, quantity }];
    });

    // Sync with API if logged in
    if (isLoggedIn) {
      try {
        const response = await fetch(resolveApiUrl("/api/cart/items"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ item: cartItem, quantity }),
        });

        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          // Revert optimistic update on error
          const response = await fetch(resolveApiUrl("/api/cart"), {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCartItems(data.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to add item to cart:", error);
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    }
  };

  const removeFromCart = async (itemKey: string) => {
    // Find item by itemKey
    const itemToRemove = cartItems.find((i) => {
      const key = generateItemKey(i);
      return key === itemKey;
    });

    if (!itemToRemove) {
      // Fallback: try to find by id
      const itemById = cartItems.find((i) => i.id === itemKey);
      if (itemById) {
        const key = generateItemKey(itemById);
        await removeFromCart(key);
      }
      return;
    }

    const key = generateItemKey(itemToRemove);

    // Optimistic update
    setCartItems((prev) => prev.filter((item) => {
      const itemKey = generateItemKey(item);
      return itemKey !== key;
    }));

    // Sync with API if logged in
    if (isLoggedIn) {
      try {
        const response = await fetch(resolveApiUrl(`/api/cart/items/${encodeURIComponent(key)}`), {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          // Revert optimistic update on error
          const response = await fetch(resolveApiUrl("/api/cart"), {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCartItems(data.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to remove item from cart:", error);
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    }
  };

  const updateQuantity = async (itemKeyOrId: string, quantity: number) => {
    if (quantity < 1) return;

    // Find item by itemKey or id
    const itemToUpdate = cartItems.find((i) => {
      const key = generateItemKey(i);
      return key === itemKeyOrId || i.id === itemKeyOrId;
    });

    if (!itemToUpdate) return;

    const key = generateItemKey(itemToUpdate);

    // Optimistic update
    setCartItems((prev) =>
      prev.map((item) => {
        const itemKey = generateItemKey(item);
        if (itemKey === key) {
          return { ...item, quantity };
        }
        return item;
      })
    );

    // Sync with API if logged in
    if (isLoggedIn) {
      try {
        const response = await fetch(resolveApiUrl(`/api/cart/items/${encodeURIComponent(key)}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ quantity }),
        });

        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          // Revert optimistic update on error
          const response = await fetch(resolveApiUrl("/api/cart"), {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCartItems(data.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to update cart item:", error);
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    }
  };

  const updateCartItem = async (itemKeyOrId: string, updates: Partial<CartItem>) => {
    // Find item by itemKey or id
    const itemToUpdate = cartItems.find((i) => {
      const key = generateItemKey(i);
      return key === itemKeyOrId || i.id === itemKeyOrId;
    });

    if (!itemToUpdate) return;

    const key = generateItemKey(itemToUpdate);
    const updatedItem = { ...itemToUpdate, ...updates };

    // Optimistic update
    setCartItems((prev) =>
      prev.map((item) => {
        const itemKey = generateItemKey(item);
        if (itemKey === key) {
          return updatedItem;
        }
        return item;
      })
    );

    // Sync with API if logged in
    if (isLoggedIn) {
      try {
        // Update cart item via API
        const response = await fetch(resolveApiUrl(`/api/cart/items/${encodeURIComponent(key)}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updatedItem),
        });

        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          // Revert optimistic update on error
          const response = await fetch(resolveApiUrl("/api/cart"), {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCartItems(data.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to update cart item:", error);
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    }
  };

  const clearCart = async () => {
    // Optimistic update
    setCartItems([]);

    // Sync with API if logged in
    if (isLoggedIn) {
      try {
        const response = await fetch(resolveApiUrl("/api/cart"), {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          // Revert optimistic update on error
          const response = await fetch(resolveApiUrl("/api/cart"), {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCartItems(data.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to clear cart:", error);
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    }
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
        updateCartItem,
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
