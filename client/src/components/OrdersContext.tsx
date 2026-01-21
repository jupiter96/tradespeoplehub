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
    endTime?: string;
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
  status: "open" | "responded" | "negotiation" | "admin_arbitration" | "resolved" | "closed";
  messages: OrderDisputeMessage[];
  claimantOffer?: OrderDisputeOffer;
  respondentOffer?: OrderDisputeOffer;
  createdAt: string;
  resolvedAt?: string;
  teamInterventionTime?: string;
  responseDeadline?: string;
  respondedAt?: string;
  negotiationDeadline?: string;
  arbitrationRequested?: boolean;
  arbitrationRequestedBy?: string;
  arbitrationRequestedAt?: string;
  arbitrationFeeAmount?: number;
  winnerId?: string;
  loserId?: string;
  adminDecision?: boolean;
  decisionNotes?: string;
  autoClosed?: boolean;
}

export interface Order {
  id: string;
  items: OrderItem[];
  service: string; // main service title for display
  date: string; // order creation date
  status: "In Progress" | "Completed" | "Cancelled" | "Rejected" | "disputed";
  amount: string; // formatted amount with £
  amountValue: number; // numeric value for sorting
  professional: string;
  professionalId?: string;
  professionalAvatar: string;
  professionalPhone?: string;
  professionalEmail?: string;
  client?: string; // client name for professional view
  clientId?: string;
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
    endTime?: string;
    timeSlot?: string;
  };
  disputeId?: string;
  expectedDelivery?: string; // ISO date string for expected delivery time
  subtotal?: number;
  discount?: number;
  serviceFee?: number;
  extensionRequest?: {
    status: 'pending' | 'approved' | 'rejected';
    requestedDate?: string;
    newDeliveryDate?: string;
    reason?: string;
    requestedAt?: string;
    respondedAt?: string;
  };
  acceptedByProfessional?: boolean;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  deliveryFiles?: Array<{
    url: string;
    fileName: string;
    fileType: 'image' | 'video';
    uploadedAt?: string;
  }>;
  deliveryMessage?: string;
  reviewInfo?: {
    id: string;
    rating: number;
    comment?: string;
    reviewerName: string;
    reviewer?: {
      id: string;
      name: string;
      avatar?: string;
    };
    response?: string;
    responseBy?: {
      id: string;
      name: string;
      avatar?: string;
    };
    responseAt?: string;
    hasResponded: boolean;
    createdAt: string;
  };
  disputeInfo?: {
    id?: string;
    status: 'open' | 'responded' | 'negotiation' | 'admin_arbitration' | 'closed';
    reason?: string;
    evidence?: string;
    claimantId?: string;
    respondentId?: string;
    responseDeadline?: string;
    respondedAt?: string;
    negotiationDeadline?: string;
    arbitrationRequested?: boolean;
    arbitrationRequestedBy?: string;
    arbitrationRequestedAt?: string;
    arbitrationFeeAmount?: number;
    createdAt?: string;
    closedAt?: string;
    winnerId?: string;
    loserId?: string;
    adminDecision?: boolean;
    decisionNotes?: string;
    autoClosed?: boolean;
  };
  additionalInformation?: {
    message?: string;
    files?: Array<{
      url: string;
      fileName: string;
      fileType: 'image' | 'video' | 'document';
      uploadedAt?: string;
    }>;
    submittedAt?: string;
  };
  revisionRequest?: {
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    reason: string;
    clientMessage?: string;
    clientFiles?: Array<{
      url: string;
      fileName: string;
      fileType: 'image' | 'video' | 'document';
      uploadedAt?: string;
    }>;
    requestedAt: string;
    respondedAt?: string;
    additionalNotes?: string;
  };
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
  rateOrder: (orderId: string, rating: number, review?: string) => Promise<void>;
  cancelOrder: (orderId: string) => void;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason?: string) => Promise<void>;
  startWork: (orderId: string) => void;
  deliverWork: (orderId: string, deliveryMessage?: string, files?: File[]) => Promise<void>;
  professionalComplete: (orderId: string, completionMessage?: string, files?: File[]) => Promise<void>;
  acceptDelivery: (orderId: string) => Promise<void>;
  extendDeliveryTime: (orderId: string, days: number) => void;
  requestExtension: (orderId: string, newDeliveryDate: string, reason?: string) => Promise<void>;
  respondToExtension: (orderId: string, action: 'approve' | 'reject') => Promise<void>;
  createOrderDispute: (orderId: string, reason: string, evidence?: string) => Promise<string>;
  getOrderDisputeById: (disputeId: string) => OrderDispute | undefined;
  addOrderDisputeMessage: (disputeId: string, message: string) => void;
  makeOrderDisputeOffer: (disputeId: string, amount: number) => void;
  requestCancellation: (orderId: string, reason?: string) => Promise<void>;
  respondToCancellation: (orderId: string, action: 'approve' | 'reject') => Promise<void>;
  withdrawCancellation: (orderId: string) => Promise<void>;
  requestRevision: (orderId: string, reason: string, message?: string, files?: File[]) => Promise<void>;
  respondToRevision: (orderId: string, action: 'accept' | 'reject', additionalNotes?: string) => Promise<void>;
  completeRevision: (orderId: string, deliveryMessage?: string, files?: File[]) => Promise<void>;
  respondToReview: (reviewId: string, response: string) => Promise<void>;
  fetchReviewForOrder: (orderId: string) => Promise<any>;
  respondToDispute: (orderId: string, message?: string) => Promise<void>;
  requestArbitration: (orderId: string) => Promise<void>;
  cancelDispute: (orderId: string) => Promise<void>;
  addAdditionalInfo: (orderId: string, message?: string, files?: File[]) => Promise<void>;
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

  const rateOrder = async (orderId: string, rating: number, review?: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/review`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rating, comment: review }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, rating, review } : order
      ));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Rate order error:', error);
      throw error;
    }
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: "Cancelled", deliveryStatus: "cancelled" } : order
    ));
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/accept`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept order');
      }

      const data = await response.json();
      
      // Update order with acceptance status
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            acceptedByProfessional: true,
            acceptedAt: data.order.acceptedAt,
            status: 'In Progress',
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Accept order error:', error);
      throw error;
    }
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject order');
      }

      const data = await response.json();
      
      // Update order with rejection status
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'Cancelled',
            acceptedByProfessional: false,
            rejectedAt: data.order.rejectedAt,
            rejectionReason: data.order.rejectionReason,
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Reject order error:', error);
      throw error;
    }
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

  const deliverWork = async (orderId: string, deliveryMessage?: string, files?: File[]) => {
    try {
      const formData = new FormData();
      if (deliveryMessage && deliveryMessage.trim()) {
        formData.append('deliveryMessage', deliveryMessage.trim());
      }
      
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/deliver`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark order as delivered');
      }

      const data = await response.json();
      
      // Update order status
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            deliveryStatus: 'delivered',
            deliveredDate: data.order.deliveredDate ? new Date(data.order.deliveredDate).toISOString() : new Date().toISOString(),
            deliveryFiles: data.order.deliveryFiles || [],
            deliveryMessage: data.order.deliveryMessage || undefined,
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Deliver work error:', error);
      throw error;
    }
  };

  const professionalComplete = async (orderId: string, completionMessage?: string, files?: File[]) => {
    try {
      const formData = new FormData();
      if (completionMessage && completionMessage.trim()) {
        formData.append('completionMessage', completionMessage.trim());
      }
      
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/professional-complete`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit completion request');
      }

      const data = await response.json();
      
      // Update order with completion request
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            metadata: {
              ...order.metadata,
              professionalCompleteRequest: data.completionRequest,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Professional complete error:', error);
      throw error;
    }
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/complete`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete order');
      }

      const data = await response.json();
      
      // Update order status
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'Completed',
            deliveryStatus: 'completed',
            completedDate: data.order.completedDate ? new Date(data.order.completedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Accept delivery error:', error);
      throw error;
    }
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

  const requestExtension = async (orderId: string, newDeliveryDate: string, reason?: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/extension-request`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newDeliveryDate,
          reason: reason || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request extension');
      }

      const data = await response.json();
      
      // Update order with extension request
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            extensionRequest: {
              status: 'pending',
              requestedDate: data.extensionRequest.requestedDate,
              newDeliveryDate: data.extensionRequest.newDeliveryDate,
              reason: data.extensionRequest.reason,
              requestedAt: data.extensionRequest.requestedAt,
              respondedAt: undefined,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Extension request error:', error);
      throw error;
    }
  };

  const respondToExtension = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/extension-request`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to extension request');
      }

      const data = await response.json();
      
      // Update order with extension response
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updatedExtensionRequest = {
            ...order.extensionRequest!,
            status: data.extensionRequest.status,
            respondedAt: data.extensionRequest.respondedAt,
          };

          // If approved, update scheduled date
          if (action === 'approve' && data.extensionRequest.newDeliveryDate) {
            return {
              ...order,
              scheduledDate: new Date(data.extensionRequest.newDeliveryDate).toISOString().split('T')[0],
              extensionRequest: updatedExtensionRequest,
            };
          }

          return {
            ...order,
            extensionRequest: updatedExtensionRequest,
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Extension response error:', error);
      throw error;
    }
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

  const createOrderDispute = async (orderId: string, reason: string, evidence?: string): Promise<string> => {
    try {
      // Call API to create dispute and update order status
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/dispute`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason, evidence: evidence || '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dispute');
      }

      const data = await response.json();

      // Update order status to disputed
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'disputed',
            deliveryStatus: 'dispute',
            disputeId: data.disputeId || data.dispute?.id,
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();

      return data.disputeId || data.dispute?.id || '';
    } catch (error: any) {
      console.error('Create dispute error:', error);
      throw error;
    }
  };

  const getOrderDisputeById = (disputeId: string): OrderDispute | undefined => {
    return disputes.find(d => d.id === disputeId);
  };

  // Cancellation Request Management
  const requestCancellation = async (orderId: string, reason?: string): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/cancellation-request`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request cancellation');
      }

      const data = await response.json();

      // Update order with cancellation request
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            cancellationRequest: {
              status: 'pending',
              requestedBy: data.cancellationRequest.requestedBy,
              reason: data.cancellationRequest.reason,
              requestedAt: data.cancellationRequest.requestedAt,
              responseDeadline: data.responseDeadline || data.cancellationRequest.responseDeadline,
              respondedAt: undefined,
              respondedBy: undefined,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Cancellation request error:', error);
      throw error;
    }
  };

  const respondToCancellation = async (orderId: string, action: 'approve' | 'reject'): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/cancellation-request`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to cancellation request');
      }

      const data = await response.json();

      // Update order with cancellation response
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: data.orderStatus || (action === 'approve' ? 'Cancelled' : order.status),
            cancellationRequest: {
              ...order.cancellationRequest!,
              status: data.cancellationRequest.status,
              respondedAt: data.cancellationRequest.respondedAt,
              respondedBy: data.cancellationRequest.respondedBy,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Cancellation response error:', error);
      throw error;
    }
  };

  const withdrawCancellation = async (orderId: string): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/cancellation-request`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to withdraw cancellation request');
      }

      const data = await response.json();

      // Update order - remove cancellation request and restore status
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: data.orderStatus || order.status,
            cancellationRequest: {
              ...order.cancellationRequest!,
              status: 'withdrawn',
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Withdraw cancellation error:', error);
      throw error;
    }
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

  // Revision Request Management
  const requestRevision = async (orderId: string, reason: string, message?: string, files?: File[]): Promise<void> => {
    try {
      const hasFiles = files && files.length > 0;
      const hasMessage = message && message.trim();
      const formData = new FormData();
      formData.append('reason', reason);
      if (hasMessage) {
        formData.append('message', message!.trim());
      }
      if (hasFiles) {
        files!.forEach(file => formData.append('files', file));
      }

      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/revision-request`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request revision');
      }

      const data = await response.json();

      // Update order with revision request
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            revisionRequest: {
              status: data.revisionRequest.status,
              reason: data.revisionRequest.reason,
              clientMessage: data.revisionRequest.clientMessage,
              clientFiles: data.revisionRequest.clientFiles || [],
              requestedAt: data.revisionRequest.requestedAt,
              respondedAt: undefined,
              additionalNotes: undefined,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Revision request error:', error);
      throw error;
    }
  };

  const respondToRevision = async (orderId: string, action: 'accept' | 'reject', additionalNotes?: string): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/revision-request`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, additionalNotes: additionalNotes || '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to revision request');
      }

      const data = await response.json();

      // Update order with revision response
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            revisionRequest: {
              ...order.revisionRequest!,
              status: data.revisionRequest.status,
              respondedAt: data.revisionRequest.respondedAt,
              additionalNotes: data.revisionRequest.additionalNotes,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Revision response error:', error);
      throw error;
    }
  };

  const completeRevision = async (orderId: string, deliveryMessage?: string, files?: File[]): Promise<void> => {
    try {
      const formData = new FormData();
      if (deliveryMessage && deliveryMessage.trim()) {
        formData.append('deliveryMessage', deliveryMessage.trim());
      }
      
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/revision-complete`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete revision');
      }

      const data = await response.json();

      // Update order - revision completed and re-delivered
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            deliveryStatus: 'delivered',
            deliveredDate: data.order.deliveredDate ? new Date(data.order.deliveredDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            deliveryFiles: data.order.deliveryFiles || order.deliveryFiles,
            deliveryMessage: data.order.deliveryMessage || order.deliveryMessage,
            revisionRequest: {
              ...order.revisionRequest!,
              status: 'completed',
              respondedAt: data.order.revisionRequest.respondedAt,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Complete revision error:', error);
      throw error;
    }
  };

  // Review Management
  const respondToReview = async (reviewId: string, response: string): Promise<void> => {
    try {
      const response_data = await fetch(resolveApiUrl(`/api/orders/reviews/${reviewId}/respond`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ response }),
      });

      if (!response_data.ok) {
        const error = await response_data.json();
        throw new Error(error.error || 'Failed to respond to review');
      }

      const data = await response_data.json();

      // Update order's review info
      setOrders(prev => prev.map(order => {
        if (order.reviewInfo && order.reviewInfo.id === reviewId) {
          return {
            ...order,
            reviewInfo: {
              ...order.reviewInfo,
              response: data.review.response,
              responseAt: data.review.responseAt,
              hasResponded: true,
              responseBy: {
                id: data.review.responseBy || '',
                name: '',
                avatar: '',
              },
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Review response error:', error);
      throw error;
    }
  };

  const fetchReviewForOrder = async (orderId: string): Promise<any> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/review`), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch review');
      }

      const data = await response.json();
      return data.review;
    } catch (error: any) {
      console.error('Fetch review error:', error);
      throw error;
    }
  };

  // Dispute Response
  const respondToDispute = async (orderId: string, message?: string): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/dispute/respond`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: message || '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to dispute');
      }

      const data = await response.json();

      // Update order's dispute info
      setOrders(prev => prev.map(order => {
        if (order.id === orderId && order.disputeInfo) {
          return {
            ...order,
            disputeInfo: {
              ...order.disputeInfo,
              status: 'negotiation',
              respondedAt: data.dispute.respondedAt,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Dispute response error:', error);
      throw error;
    }
  };

  // Request Admin Arbitration
  const requestArbitration = async (orderId: string): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/dispute/request-arbitration`), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request arbitration');
      }

      const data = await response.json();

      // Update order's dispute info
      setOrders(prev => prev.map(order => {
        if (order.id === orderId && order.disputeInfo) {
          return {
            ...order,
            disputeInfo: {
              ...order.disputeInfo,
              status: 'admin_arbitration',
              arbitrationRequested: true,
              arbitrationRequestedAt: data.dispute.arbitrationRequestedAt,
            },
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Request arbitration error:', error);
      throw error;
    }
  };

  // Cancel Dispute
  const cancelDispute = async (orderId: string): Promise<void> => {
    try {
      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/dispute`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel dispute');
      }

      const data = await response.json();

      // Update order - remove dispute info and restore to delivered status
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'In Progress',
            deliveryStatus: 'delivered',
            disputeInfo: undefined,
            disputeId: undefined,
          };
        }
        return order;
      }));

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Cancel dispute error:', error);
      throw error;
    }
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

  // Add additional information to an order
  const addAdditionalInfo = async (orderId: string, message?: string, files?: File[]): Promise<void> => {
    try {
      const formData = new FormData();
      if (message && message.trim()) {
        formData.append('message', message.trim());
      }

      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch(resolveApiUrl(`/api/orders/${orderId}/additional-info`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit additional information');
      }

      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error: any) {
      console.error('Add additional info error:', error);
      throw error;
    }
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
        acceptOrder,
        rejectOrder,
        startWork,
        deliverWork,
        professionalComplete,
        acceptDelivery,
        extendDeliveryTime,
        requestExtension,
        respondToExtension,
        createOrderDispute,
        getOrderDisputeById,
        addOrderDisputeMessage,
        makeOrderDisputeOffer,
        requestCancellation,
        respondToCancellation,
        withdrawCancellation,
        requestRevision,
        respondToRevision,
        completeRevision,
        respondToReview,
        fetchReviewForOrder,
        respondToDispute,
        requestArbitration,
        cancelDispute,
        addAdditionalInfo,
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