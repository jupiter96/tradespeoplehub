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
  time: string; // "09:00", "14:30", etc. (start time)
  endTime?: string; // "17:00", etc. (end time)
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
  thumbnailVideo?: { url: string; thumbnail?: string }; // Video thumbnail for cart display
  priceUnit?: string; // "hour", "cm", "sqm", "fixed", etc.
  orderId?: string; // For custom offer: link to existing "offer created" order
  offerId?: string; // For custom offer: link to custom offer document
  deliveryDays?: number; // For custom offer: expected delivery days
}

interface CartContextType {
  cartCount: number;
  cartTotal: number;
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCartItem: (itemKeyOrId: string, updates: Partial<CartItem>) => Promise<void>;
  clearCart: () => Promise<void>;
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
  const [cartCleared, setCartCleared] = useState(false);

  // Load cart from API when user logs in
  useEffect(() => {
    const fetchCart = async () => {
      if (!isLoggedIn) {
        setCartItems([]);
        setCartCleared(false);
        return;
      }

      // Don't refetch if cart was just cleared (prevents race condition)
      if (cartCleared) {
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
        console.error("❌ [CartContext] Failed to fetch cart:", error);
        // Keep existing cart items on error
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isLoggedIn, cartCleared]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const addonsTotal = item.addons?.reduce((addonSum, addon) => addonSum + addon.price, 0) || 0;
    return sum + (item.price + addonsTotal) * item.quantity;
  }, 0);

  const addToCart = async (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    // Reset cartCleared flag since user is adding items
    setCartCleared(false);
    
    // Ensure serviceId is set (use id if serviceId is not provided for backward compatibility)
    const cartItem: Omit<CartItem, "quantity"> = {
      ...item,
      serviceId: (item as any).serviceId || item.id, // Use serviceId if provided, otherwise use id
    };
    
    const itemKey = generateItemKey(cartItem);
    // Optimistic update
    setCartItems((prev) => {
      const existingItem = prev.find((i) => {
        const existingKey = generateItemKey(i);
        const newKey = generateItemKey(cartItem);
        return existingKey === newKey;
      });
      
      if (existingItem) {
        const updatedItems = prev.map((i) => {
          const existingKey = generateItemKey(i);
          const newKey = generateItemKey(cartItem);
          if (existingKey === newKey) {
            return { ...i, quantity: i.quantity + quantity };
          }
          return i;
        });
        return updatedItems;
      }
      
      const newItems = [...prev, { ...cartItem, quantity }];
      return newItems;
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
        console.error("[CartContext] Failed to add item to cart:", error);
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    } else {
      console.log('[CartContext] User not logged in, skipping API sync');
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

    if (!itemToUpdate) {
      console.error('[CartContext] Item not found in cart for key/id:', itemKeyOrId);
      return;
    }

    const key = generateItemKey(itemToUpdate);
    
    const updatedItem = { ...itemToUpdate, ...updates };
    // Optimistic update
    setCartItems((prev) => {
      const newItems = prev.map((item) => {
        const itemKey = generateItemKey(item);
        if (itemKey === key) {
          return updatedItem;
        }
        return item;
      });
      
      return newItems;
    });

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
          body: JSON.stringify(updates),
        });

        
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
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
        // Revert optimistic update on error
        const response = await fetch(resolveApiUrl("/api/cart"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.items || []);
        }
      }
    } else {
      console.log('[CartContext] User not logged in, skipping API sync');
    }
  };

  const clearCart = async () => {
    // Set flag to prevent refetch race condition
    setCartCleared(true);
    
    // Clear local state immediately
    setCartItems([]);

    // Sync with API if logged in
    if (isLoggedIn) {
      try {
        const response = await fetch(resolveApiUrl("/api/cart"), {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Failed to clear cart on server");
        }
        // Don't set cart items from response - keep it empty
        // The server returns { items: [] } on success anyway
      } catch (error) {
        console.error("Failed to clear cart:", error);
        // Don't revert - keep cart empty locally even if server fails
        // User can refresh if needed
      }
    }
    
    // Note: cartCleared flag stays true until user adds a new item to cart
    // This prevents race conditions where the cart refetches old data
    // The addToCart function will reset the flag when user adds new items
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
