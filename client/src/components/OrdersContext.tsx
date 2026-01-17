import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "./CartContext";
import { useAccount } from "./AccountContext";
import { resolveApiUrl } from "../config/api";
import defaultAvatar from "../assets/c1e5f236e69ba84c123ce1336bb460f448af2762.png";

export interface OrderItem {
  id: string;
  title: string;
  seller: string;
  price: number;
  image: string;
  rating?: number;
  quantity: number;
  addons?: {
    id: number;
    title: string;
    price: number;
  }[];
  booking?: {
    date: string;
    time: string;
    timeSlot?: string;
  };
  packageType?: string;
}

export interface DeliveryAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  phone: string;
}

export interface OrderDisputeMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  isTeamResponse?: boolean;
}

export interface OrderDisputeOffer {
  userId: string;
  amount: number;
  timestamp: string;
}

export interface OrderDispute {
  id: string;
  orderId: string;
  claimantId: string;
  claimantName: string;
  claimantAvatar?: string;
  respondentId: string;
  respondentName: string;
  respondentAvatar?: string;
  amount: number;
  reason: string;
  evidence?: string;
  status: "open" | "resolved" | "closed";
  messages: OrderDisputeMessage[];
  claimantOffer?: OrderDisputeOffer;
  respondentOffer?: OrderDisputeOffer;
  createdAt: string;
  resolvedAt?: string;
  teamInterventionTime?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  service: string; // main service title for display
  date: string; // order creation date
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  amount: string; // formatted amount with £
  amountValue: number; // numeric value for sorting
  professional: string;
  professionalAvatar: string;
  professionalPhone?: string;
  professionalEmail?: string;
  client?: string; // client name for professional view
  clientAvatar?: string;
  clientPhone?: string;
  clientEmail?: string;
  address?: DeliveryAddress;
  description?: string;
  scheduledDate?: string;
  completedDate?: string;
  deliveredDate?: string;
  rating?: number | null;
  review?: string;
  deliveryStatus?: "active" | "delivered" | "completed" | "cancelled" | "dispute";
  booking?: {
    date: string;
    time: string;
    timeSlot?: string;
  };
  disputeId?: string;
  expectedDelivery?: string; // ISO date string for expected delivery time
  subtotal?: number;
  discount?: number;
  serviceFee?: number;
}

interface OrdersContextType {
  orders: Order[];
  disputes: OrderDispute[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  addOrder: (orderData: {
    items: CartItem[];
    address?: DeliveryAddress;
    skipAddress?: boolean;
  }) => string; // returns order ID (deprecated, use API directly)
  addDirectOrder: (order: Partial<Order> & { id: string; service: string; professional: string; amount: string }) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  rateOrder: (orderId: string, rating: number, review?: string) => void;
  cancelOrder: (orderId: string) => void;
  startWork: (orderId: string) => void;
  deliverWork: (orderId: string, deliveryMessage: string) => void;
  acceptDelivery: (orderId: string) => void;
  extendDeliveryTime: (orderId: string, days: number) => void;
  createOrderDispute: (orderId: string, reason: string, evidence?: string) => string;
  getOrderDisputeById: (disputeId: string) => OrderDispute | undefined;
  addOrderDisputeMessage: (disputeId: string, message: string) => void;
  makeOrderDisputeOffer: (disputeId: string, amount: number) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAccount();
  const normalizeAvatar = (value?: string) =>
    value && !/images\.unsplash\.com/i.test(value) ? value : defaultAvatar;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch orders from API
  const refreshOrders = async () => {
    if (!isLoggedIn) {
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(resolveApiUrl("/api/orders"), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Normalize avatars
        const normalizedOrders = (data.orders || []).map((order: Order) => ({
          ...order,
          professionalAvatar: normalizeAvatar(order.professionalAvatar),
          clientAvatar: normalizeAvatar(order.clientAvatar),
        }));
        setOrders(normalizedOrders);
      } else {
        console.error("Failed to fetch orders:", response.statusText);
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Load orders when user logs in
  useEffect(() => {
    refreshOrders();
  }, [isLoggedIn]);

  // All mock data removed - orders are now loaded from API via refreshOrders()

  const addOrder = (orderData: {
    items: CartItem[];
    address?: DeliveryAddress;
    skipAddress?: boolean;
  }): string => {
    // Calculate total
    const total = orderData.items.reduce((sum, item) => {
      const addonsTotal = item.addons?.reduce((addonSum, addon) => addonSum + addon.price, 0) || 0;
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);

    // Generate order ID
    const orderNumber = orders.length + 1;
    const orderId = `ORD-${String(orderNumber).padStart(3, '0')}`;

    // Get main service name (first item's title)
    const mainService = orderData.items[0]?.title || "Service Order";

    // Get professional info from first item
    const professional = orderData.items[0]?.seller || "Professional";

    // Create booking info from first item if available
    const bookingInfo = orderData.items[0]?.booking;

    // Create new order
    const newOrder: Order = {
      id: orderId,
      items: orderData.items.map(item => ({
        id: item.id,
        title: item.title,
        seller: item.seller,
        price: item.price,
        image: item.image,
        rating: item.rating,
        quantity: item.quantity,
        addons: item.addons,
        booking: item.booking,
        packageType: item.packageType
      })),
      service: mainService,
      date: new Date().toISOString().split('T')[0],
      status: "Pending",
      amount: `£${total.toFixed(2)}`,
      amountValue: total,
      professional: professional,
      professionalAvatar: orderData.items[0]?.image || defaultAvatar,
      professionalPhone: "+44 7XXX XXXXXX",
      professionalEmail: `${professional.toLowerCase().replace(' ', '.')}@gmail.com`,
      address: orderData.address,
      description: `Order for ${mainService}`,
      scheduledDate: bookingInfo?.date ? new Date(bookingInfo.date).toISOString().split('T')[0] : undefined,
      rating: null,
      booking: bookingInfo
    };

    setOrders(prev => [newOrder, ...prev]);
    return orderId;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updates: Partial<Order> = { status };
        if (status === "Completed") {
          updates.completedDate = new Date().toISOString().split('T')[0];
        }
        return { ...order, ...updates };
      }
      return order;
    }));
  };

  const rateOrder = (orderId: string, rating: number, review?: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, rating, review } : order
    ));
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: "Cancelled", deliveryStatus: "cancelled" } : order
    ));
  };

  const startWork = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { 
        ...order, 
        status: "In Progress", 
        deliveryStatus: "active",
        scheduledDate: order.scheduledDate || new Date().toISOString().split('T')[0]
      } : order
    ));
  };

  const deliverWork = (orderId: string, deliveryMessage: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { 
        ...order, 
        deliveryStatus: "delivered",
        deliveredDate: new Date().toISOString().split('T')[0]
      } : order
    ));
  };

  const acceptDelivery = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { 
        ...order, 
        status: "Completed",
        deliveryStatus: "completed",
        completedDate: new Date().toISOString().split('T')[0]
      } : order
    ));
  };

  const extendDeliveryTime = (orderId: string, days: number) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.scheduledDate) {
        const currentDate = new Date(order.scheduledDate);
        currentDate.setDate(currentDate.getDate() + days);
        return { 
          ...order, 
          scheduledDate: currentDate.toISOString().split('T')[0]
        };
      }
      return order;
    }));
  };

  const addDirectOrder = (orderData: Partial<Order> & { id: string; service: string; professional: string; amount: string }) => {
    const amountValue = parseFloat(orderData.amount.replace(/[^0-9.]/g, ""));
    
    const newOrder: Order = {
      items: [],
      date: new Date().toISOString().split('T')[0],
      status: "Pending",
      amountValue: amountValue,
      professionalAvatar: "",
      professionalPhone: "+44 7XXX XXXXXX",
      professionalEmail: `${orderData.professional.toLowerCase().replace(' ', '.')}@gmail.com`,
      deliveryStatus: "active",
      rating: null,
      ...orderData,
    };

    setOrders(prev => [newOrder, ...prev]);
  };

  // Dispute Management
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);

  const createOrderDispute = (orderId: string, reason: string, evidence?: string): string => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return "";

    const disputeId = `DISP-${Date.now()}`;
    const now = new Date();
    const teamInterventionTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Determine who is the claimant and respondent based on current user
    // For demo purposes, we'll assume current user is the one creating the dispute
    const isClient = !order.client; // If no client property, then current user is client
    
    const newDispute: OrderDispute = {
      id: disputeId,
      orderId: orderId,
      claimantId: isClient ? "client-user" : "professional-user",
      claimantName: isClient ? "John Client" : (order.professional || "Current User"),
      claimantAvatar: isClient ? "" : order.professionalAvatar,
      respondentId: isClient ? "professional-user" : "client-user",
      respondentName: isClient ? order.professional : (order.client || "Client"),
      respondentAvatar: isClient ? order.professionalAvatar : (order.clientAvatar || ""),
      amount: order.amountValue,
      reason: reason,
      evidence: evidence,
      status: "open",
      messages: [
        {
          id: `MSG-${Date.now()}`,
          userId: isClient ? "client-user" : "professional-user",
          userName: isClient ? "John Client" : (order.professional || "Current User"),
          userAvatar: isClient ? "" : order.professionalAvatar,
          message: reason,
          timestamp: now.toISOString(),
        }
      ],
      createdAt: now.toISOString(),
      teamInterventionTime: teamInterventionTime.toISOString(),
    };

    setDisputes(prev => [newDispute, ...prev]);
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, deliveryStatus: "dispute", disputeId: disputeId }
        : o
    ));

    return disputeId;
  };

  const getOrderDisputeById = (disputeId: string): OrderDispute | undefined => {
    return disputes.find(d => d.id === disputeId);
  };

  const addOrderDisputeMessage = (disputeId: string, message: string) => {
    setDisputes(prev => prev.map(dispute => {
      if (dispute.id === disputeId) {
        // Determine current user - simplified for demo
        const order = orders.find(o => o.id === dispute.orderId);
        const isClient = !order?.client;
        
        const newMessage: OrderDisputeMessage = {
          id: `MSG-${Date.now()}`,
          userId: isClient ? "client-user" : "professional-user",
          userName: isClient ? "John Client" : (order?.professional || "Current User"),
          userAvatar: isClient ? "" : order?.professionalAvatar,
          message: message,
          timestamp: new Date().toISOString(),
        };

        return {
          ...dispute,
          messages: [...dispute.messages, newMessage]
        };
      }
      return dispute;
    }));
  };

  const makeOrderDisputeOffer = (disputeId: string, amount: number) => {
    setDisputes(prev => prev.map(dispute => {
      if (dispute.id === disputeId) {
        // Determine current user - simplified for demo
        const order = orders.find(o => o.id === dispute.orderId);
        const isClient = !order?.client;
        const userId = isClient ? "client-user" : "professional-user";

        const offer: OrderDisputeOffer = {
          userId: userId,
          amount: amount,
          timestamp: new Date().toISOString(),
        };

        if (userId === dispute.claimantId) {
          return { ...dispute, claimantOffer: offer };
        } else {
          return { ...dispute, respondentOffer: offer };
        }
      }
      return dispute;
    }));
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        disputes,
        loading,
        refreshOrders,
        addOrder,
        addDirectOrder,
        updateOrderStatus,
        rateOrder,
        cancelOrder,
        startWork,
        deliverWork,
        acceptDelivery,
        extendDeliveryTime,
        createOrderDispute,
        getOrderDisputeById,
        addOrderDisputeMessage,
        makeOrderDisputeOffer,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}