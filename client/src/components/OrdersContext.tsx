import { createContext, useContext, useState, ReactNode } from "react";
import { CartItem } from "./CartContext";

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
}

interface OrdersContextType {
  orders: Order[];
  disputes: OrderDispute[];
  addOrder: (orderData: {
    items: CartItem[];
    address?: DeliveryAddress;
    skipAddress?: boolean;
  }) => string; // returns order ID
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
  const [orders, setOrders] = useState<Order[]>([
    // Mock data for demonstration
    {
      id: "ORD-001",
      items: [],
      service: "Plumbing Repair",
      date: "2024-11-05",
      status: "Completed",
      amount: "£150",
      amountValue: 150,
      professional: "John Smith",
      professionalAvatar: "https://images.unsplash.com/photo-1737574821698-862e77f044c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzc21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzI3OTI1Mnww&ixlib=rb-4.1.0&q=80&w=1080",
      professionalPhone: "+44 7123 456789",
      professionalEmail: "john.smith@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "123 Main Street",
        city: "London",
        postcode: "SW1A 1AA",
        phone: "+44 7123 456789"
      },
      description: "Fix leaking kitchen sink and replace worn-out washers. The issue has been ongoing for 2 weeks.",
      completedDate: "2024-11-06",
      rating: 5,
      booking: {
        date: "2024-11-05T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-002",
      items: [],
      service: "Electrical Installation",
      date: "2024-11-08",
      status: "In Progress",
      amount: "£320",
      amountValue: 320,
      professional: "Sarah Johnson",
      professionalAvatar: "https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzI5MjAyNXww&ixlib=rb-4.1.0&q=80&w=1080",
      professionalPhone: "+44 7987 654321",
      professionalEmail: "sarah.j@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "456 Park Avenue",
        city: "London",
        postcode: "W1B 2AA",
        phone: "+44 7123 456789"
      },
      description: "Install new ceiling lights in living room and bedroom. Includes LED downlights and dimmer switches.",
      scheduledDate: "2024-11-11",
      rating: null,
      booking: {
        date: "2024-11-11T00:00:00.000Z",
        time: "14:00",
        timeSlot: "Afternoon"
      },
      deliveryStatus: "active",
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000 + 27 * 60 * 1000).toISOString() // 3 days, 1 hour, 27 minutes from now
    },
    {
      id: "ORD-003",
      items: [],
      service: "Painting Service",
      date: "2024-11-10",
      status: "Pending",
      amount: "£200",
      amountValue: 200,
      professional: "Mike Brown",
      professionalAvatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjMyOTQxMjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      professionalPhone: "+44 7555 123456",
      professionalEmail: "mike.brown@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "789 Oak Road",
        city: "London",
        postcode: "E1 6AN",
        phone: "+44 7123 456789"
      },
      description: "Paint two bedrooms with neutral colors. Preparation work included.",
      scheduledDate: "2024-11-15",
      deliveryStatus: "pending",
      rating: null,
      booking: {
        date: "2024-11-15T00:00:00.000Z",
        time: "09:30",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString() // 5 days, 12 hours from now
    },
    // Additional Client Orders - Active
    {
      id: "ORD-004",
      items: [],
      service: "Carpentry Work",
      date: "2024-11-12",
      status: "In Progress",
      amount: "£275",
      amountValue: 275,
      professional: "David Wilson",
      professionalAvatar: "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzMzMzU4OXww&ixlib=rb-4.1.0&q=80&w=1080",
      professionalPhone: "+44 7444 999888",
      professionalEmail: "david.w@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "321 High Street",
        city: "London",
        postcode: "NW1 2BB",
        phone: "+44 7123 456789"
      },
      description: "Build custom shelving units in home office.",
      scheduledDate: "2024-11-14",
      deliveryStatus: "active",
      rating: null,
      booking: {
        date: "2024-11-14T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString() // 2 days, 8 hours from now
    },
    {
      id: "ORD-005",
      items: [],
      service: "Garden Maintenance",
      date: "2024-11-11",
      status: "In Progress",
      amount: "£95",
      amountValue: 95,
      professional: "Emma Taylor",
      professionalAvatar: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90fGVufDF8fHx8MTc2MzMzNTgyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      professionalPhone: "+44 7222 555777",
      professionalEmail: "emma.t@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "567 Green Lane",
        city: "London",
        postcode: "SE1 4CC",
        phone: "+44 7123 456789"
      },
      description: "Lawn mowing and hedge trimming.",
      scheduledDate: "2024-11-14",
      deliveryStatus: "active",
      rating: null,
      booking: {
        date: "2024-11-14T00:00:00.000Z",
        time: "14:00",
        timeSlot: "Afternoon"
      },
      expectedDelivery: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours overdue
    },
    // Additional Client Orders - Delivered
    {
      id: "ORD-006",
      items: [],
      service: "Bathroom Cleaning",
      date: "2024-11-09",
      status: "In Progress",
      amount: "£85",
      amountValue: 85,
      professional: "Rachel Green",
      professionalAvatar: "https://images.unsplash.com/photo-1762505464553-1f4eb1578f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MzMzODQ3MXww&ixlib=rb-4.1.0&q=80&w=1080",
      professionalPhone: "+44 7111 222333",
      professionalEmail: "rachel.green@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "234 Queen's Road",
        city: "London",
        postcode: "W2 3AA",
        phone: "+44 7123 456789"
      },
      description: "Deep clean bathroom including tiles and fixtures.",
      scheduledDate: "2024-11-10",
      deliveredDate: "2024-11-10",
      deliveryStatus: "delivered",
      rating: null,
      booking: {
        date: "2024-11-10T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-007",
      items: [],
      service: "Locksmith Service",
      date: "2024-11-08",
      status: "In Progress",
      amount: "£120",
      amountValue: 120,
      professional: "Tom Baker",
      professionalAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      professionalPhone: "+44 7333 444555",
      professionalEmail: "tom.baker@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "789 Crown Street",
        city: "London",
        postcode: "EC1 2BB",
        phone: "+44 7123 456789"
      },
      description: "Change front door lock and provide new keys.",
      scheduledDate: "2024-11-09",
      deliveredDate: "2024-11-09",
      deliveryStatus: "delivered",
      rating: null,
      booking: {
        date: "2024-11-09T00:00:00.000Z",
        time: "11:00",
        timeSlot: "Morning"
      }
    },
    // Additional Client Orders - Completed
    {
      id: "ORD-008",
      items: [],
      service: "Window Cleaning",
      date: "2024-10-22",
      status: "Completed",
      amount: "£65",
      amountValue: 65,
      professional: "Mark Stevens",
      professionalAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      professionalPhone: "+44 7555 666777",
      professionalEmail: "mark.stevens@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "123 Main Street",
        city: "London",
        postcode: "SW1A 1AA",
        phone: "+44 7123 456789"
      },
      description: "Clean all exterior and interior windows.",
      scheduledDate: "2024-10-23",
      completedDate: "2024-10-23",
      deliveredDate: "2024-10-23",
      deliveryStatus: "completed",
      rating: 5,
      booking: {
        date: "2024-10-23T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-009",
      items: [],
      service: "Gutter Cleaning",
      date: "2024-10-19",
      status: "Completed",
      amount: "£110",
      amountValue: 110,
      professional: "Chris Evans",
      professionalAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      professionalPhone: "+44 7777 888999",
      professionalEmail: "chris.evans@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "456 Park Avenue",
        city: "London",
        postcode: "W1B 2AA",
        phone: "+44 7123 456789"
      },
      description: "Clear all gutters and downpipes.",
      scheduledDate: "2024-10-20",
      completedDate: "2024-10-20",
      deliveredDate: "2024-10-20",
      deliveryStatus: "completed",
      rating: 4,
      booking: {
        date: "2024-10-20T00:00:00.000Z",
        time: "14:00",
        timeSlot: "Afternoon"
      }
    },
    // Additional Client Orders - Cancelled
    {
      id: "ORD-010",
      items: [],
      service: "Furniture Assembly",
      date: "2024-11-02",
      status: "Cancelled",
      amount: "£75",
      amountValue: 75,
      professional: "Paul Mitchell",
      professionalAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      professionalPhone: "+44 7888 999000",
      professionalEmail: "paul.mitchell@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "789 Oak Road",
        city: "London",
        postcode: "E1 6AN",
        phone: "+44 7123 456789"
      },
      description: "Assemble IKEA wardrobe and bedside tables.",
      scheduledDate: "2024-11-04",
      deliveryStatus: "cancelled",
      rating: null,
      booking: {
        date: "2024-11-04T00:00:00.000Z",
        time: "15:00",
        timeSlot: "Afternoon"
      }
    },
    // Additional Client Orders - Dispute
    {
      id: "ORD-011",
      items: [],
      service: "Pest Control",
      date: "2024-11-06",
      status: "In Progress",
      amount: "£165",
      amountValue: 165,
      professional: "Simon Wright",
      professionalAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      professionalPhone: "+44 7999 000111",
      professionalEmail: "simon.wright@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "321 High Street",
        city: "London",
        postcode: "NW1 2BB",
        phone: "+44 7123 456789"
      },
      description: "Treat house for ant infestation in kitchen.",
      scheduledDate: "2024-11-07",
      deliveryStatus: "dispute",
      rating: null,
      booking: {
        date: "2024-11-07T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      }
    },
    // Professional view orders (orders received by professionals)
    {
      id: "ORD-P001",
      items: [],
      service: "Emergency Plumbing - Basic Package",
      date: "2024-11-12",
      status: "In Progress",
      amount: "£180",
      amountValue: 180,
      professional: "Current User",
      professionalAvatar: "",
      client: "Emma Watson",
      clientAvatar: "https://images.unsplash.com/photo-1762505464553-1f4eb1578f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MzMzODQ3MXww&ixlib=rb-4.1.0&q=80&w=1080",
      clientPhone: "+44 7234 567890",
      clientEmail: "emma.watson@gmail.com",
      address: {
        name: "Emma Watson",
        addressLine1: "42 Baker Street",
        city: "London",
        postcode: "NW1 6XE",
        phone: "+44 7234 567890"
      },
      description: "Fix bathroom sink leak and check water pressure issues.",
      scheduledDate: "2024-11-13",
      deliveryStatus: "active",
      rating: null,
      booking: {
        date: "2024-11-13T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString() // 1 day, 15 hours from now
    },
    {
      id: "ORD-P002",
      items: [],
      service: "Kitchen Installation - Premium Package",
      date: "2024-11-09",
      status: "In Progress",
      amount: "£450",
      amountValue: 450,
      professional: "Current User",
      professionalAvatar: "",
      client: "James Anderson",
      clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      clientPhone: "+44 7345 678901",
      clientEmail: "james.anderson@gmail.com",
      address: {
        name: "James Anderson",
        addressLine1: "15 Oxford Street",
        city: "Manchester",
        postcode: "M1 4BT",
        phone: "+44 7345 678901"
      },
      description: "Complete kitchen cabinet installation with new fixtures.",
      scheduledDate: "2024-11-14",
      deliveryStatus: "active",
      rating: null,
      booking: {
        date: "2024-11-14T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours overdue
    },
    {
      id: "ORD-P003",
      items: [],
      service: "Electrical Repair - Standard Package",
      date: "2024-11-11",
      status: "In Progress",
      amount: "£220",
      amountValue: 220,
      professional: "Current User",
      professionalAvatar: "",
      client: "Sophie Taylor",
      clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      clientPhone: "+44 7456 789012",
      clientEmail: "sophie.taylor@gmail.com",
      address: {
        name: "Sophie Taylor",
        addressLine1: "88 High Street",
        city: "Birmingham",
        postcode: "B1 1AA",
        phone: "+44 7456 789012"
      },
      description: "Replace old circuit breakers and test all outlets.",
      scheduledDate: "2024-11-12",
      deliveredDate: "2024-11-12",
      deliveryStatus: "delivered",
      rating: null,
      booking: {
        date: "2024-11-12T00:00:00.000Z",
        time: "14:00",
        timeSlot: "Afternoon"
      }
    },
    {
      id: "ORD-P004",
      items: [],
      service: "Bathroom Renovation - Premium Package",
      date: "2024-10-28",
      status: "Completed",
      amount: "£850",
      amountValue: 850,
      professional: "Current User",
      professionalAvatar: "",
      client: "Oliver Brown",
      clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      clientPhone: "+44 7567 890123",
      clientEmail: "oliver.brown@gmail.com",
      address: {
        name: "Oliver Brown",
        addressLine1: "23 Victoria Road",
        city: "Leeds",
        postcode: "LS1 2TW",
        phone: "+44 7567 890123"
      },
      description: "Full bathroom renovation including tiling, fixtures, and plumbing.",
      scheduledDate: "2024-10-29",
      completedDate: "2024-11-02",
      deliveredDate: "2024-11-02",
      deliveryStatus: "completed",
      rating: 5,
      booking: {
        date: "2024-10-29T00:00:00.000Z",
        time: "08:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P005",
      items: [],
      service: "Boiler Service - Basic Package",
      date: "2024-10-25",
      status: "Completed",
      amount: "£125",
      amountValue: 125,
      professional: "Current User",
      professionalAvatar: "",
      client: "Amelia Wilson",
      clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      clientPhone: "+44 7678 901234",
      clientEmail: "amelia.wilson@gmail.com",
      address: {
        name: "Amelia Wilson",
        addressLine1: "67 Church Lane",
        city: "Bristol",
        postcode: "BS1 5TR",
        phone: "+44 7678 901234"
      },
      description: "Annual boiler service and safety check.",
      scheduledDate: "2024-10-26",
      completedDate: "2024-10-26",
      deliveredDate: "2024-10-26",
      deliveryStatus: "completed",
      rating: 4,
      booking: {
        date: "2024-10-26T00:00:00.000Z",
        time: "11:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P006",
      items: [],
      service: "Garden Landscaping - Standard Package",
      date: "2024-11-01",
      status: "Cancelled",
      amount: "£380",
      amountValue: 380,
      professional: "Current User",
      professionalAvatar: "",
      client: "Harry Johnson",
      clientAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      clientPhone: "+44 7789 012345",
      clientEmail: "harry.johnson@gmail.com",
      address: {
        name: "Harry Johnson",
        addressLine1: "12 Green Avenue",
        city: "Edinburgh",
        postcode: "EH1 3EG",
        phone: "+44 7789 012345"
      },
      description: "Lawn maintenance and flower bed redesign.",
      scheduledDate: "2024-11-05",
      deliveryStatus: "cancelled",
      rating: null,
      booking: {
        date: "2024-11-05T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P007",
      items: [],
      service: "Painting Service - Premium Package",
      date: "2024-11-08",
      status: "In Progress",
      amount: "£290",
      amountValue: 290,
      professional: "David James",
      professionalAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      client: "MatJohn LTD",
      clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      clientPhone: "+44 7890 123456",
      clientEmail: "matjohn@gmail.com",
      disputeId: "DISP-1757607480",
      address: {
        name: "Isabella Martinez",
        addressLine1: "34 Park Lane",
        city: "Glasgow",
        postcode: "G1 1AA",
        phone: "+44 7890 123456"
      },
      description: "Paint living room and hallway with premium paint.",
      scheduledDate: "2024-11-10",
      deliveryStatus: "dispute",
      rating: null,
      booking: {
        date: "2024-11-10T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      }
    },
    // Additional Professional Orders - Active
    {
      id: "ORD-P008",
      items: [],
      service: "Carpentry Work - Custom Package",
      date: "2024-11-13",
      status: "In Progress",
      amount: "£520",
      amountValue: 520,
      professional: "Current User",
      professionalAvatar: "",
      client: "William Davis",
      clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      clientPhone: "+44 7901 234567",
      clientEmail: "william.davis@gmail.com",
      address: {
        name: "William Davis",
        addressLine1: "78 Richmond Road",
        city: "Liverpool",
        postcode: "L1 1AA",
        phone: "+44 7901 234567"
      },
      description: "Build custom bookshelf unit and install floating shelves.",
      scheduledDate: "2024-11-15",
      deliveryStatus: "active",
      rating: null,
      booking: {
        date: "2024-11-15T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // 6 days, 4 hours, 30 minutes from now
    },
    {
      id: "ORD-P009",
      items: [],
      service: "Roof Repair - Basic Package",
      date: "2024-11-12",
      status: "In Progress",
      amount: "£680",
      amountValue: 680,
      professional: "Current User",
      professionalAvatar: "",
      client: "Charlotte Thompson",
      clientAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
      clientPhone: "+44 7012 345678",
      clientEmail: "charlotte.thompson@gmail.com",
      address: {
        name: "Charlotte Thompson",
        addressLine1: "56 Maple Street",
        city: "Cardiff",
        postcode: "CF10 1AA",
        phone: "+44 7012 345678"
      },
      description: "Fix damaged roof tiles and check for leaks.",
      scheduledDate: "2024-11-16",
      deliveryStatus: "active",
      rating: null,
      booking: {
        date: "2024-11-16T00:00:00.000Z",
        time: "08:00",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString() // 7 days, 2 hours from now
    },
    // Additional Professional Orders - Delivered
    {
      id: "ORD-P010",
      items: [],
      service: "Window Installation - Standard Package",
      date: "2024-11-09",
      status: "In Progress",
      amount: "£395",
      amountValue: 395,
      professional: "Current User",
      professionalAvatar: "",
      client: "George Harris",
      clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      clientPhone: "+44 7123 456780",
      clientEmail: "george.harris@gmail.com",
      address: {
        name: "George Harris",
        addressLine1: "29 Castle View",
        city: "Newcastle",
        postcode: "NE1 1AA",
        phone: "+44 7123 456780"
      },
      description: "Install double-glazed windows in two bedrooms.",
      scheduledDate: "2024-11-10",
      deliveredDate: "2024-11-11",
      deliveryStatus: "delivered",
      rating: null,
      booking: {
        date: "2024-11-10T00:00:00.000Z",
        time: "10:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P011",
      items: [],
      service: "Flooring Installation - Premium Package",
      date: "2024-11-08",
      status: "In Progress",
      amount: "£740",
      amountValue: 740,
      professional: "Current User",
      professionalAvatar: "",
      client: "Lily Robinson",
      clientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      clientPhone: "+44 7234 567891",
      clientEmail: "lily.robinson@gmail.com",
      address: {
        name: "Lily Robinson",
        addressLine1: "91 Forest Drive",
        city: "Sheffield",
        postcode: "S1 2AA",
        phone: "+44 7234 567891"
      },
      description: "Install hardwood flooring in living room and dining area.",
      scheduledDate: "2024-11-09",
      deliveredDate: "2024-11-10",
      deliveryStatus: "delivered",
      rating: null,
      booking: {
        date: "2024-11-09T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P011B",
      items: [],
      service: "Emergency Heating Repair - Basic Package",
      date: "2024-11-10",
      status: "In Progress",
      amount: "£195",
      amountValue: 195,
      professional: "Current User",
      professionalAvatar: "",
      client: "Thomas White",
      clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      clientPhone: "+44 7345 678902",
      clientEmail: "thomas.white@gmail.com",
      address: {
        name: "Thomas White",
        addressLine1: "45 Station Road",
        city: "York",
        postcode: "YO1 6AA",
        phone: "+44 7345 678902"
      },
      description: "Urgent boiler repair - no heating in property.",
      scheduledDate: "2024-11-11",
      deliveryStatus: "pending",
      rating: null,
      booking: {
        date: "2024-11-11T00:00:00.000Z",
        time: "08:00",
        timeSlot: "Morning"
      },
      expectedDelivery: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours overdue
    },
    // Additional Professional Orders - Completed
    {
      id: "ORD-P012",
      items: [],
      service: "HVAC Service - Standard Package",
      date: "2024-10-20",
      status: "Completed",
      amount: "£275",
      amountValue: 275,
      professional: "Current User",
      professionalAvatar: "",
      client: "Jack Walker",
      clientAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      clientPhone: "+44 7345 678902",
      clientEmail: "jack.walker@gmail.com",
      address: {
        name: "Jack Walker",
        addressLine1: "14 Riverside Walk",
        city: "Nottingham",
        postcode: "NG1 1AA",
        phone: "+44 7345 678902"
      },
      description: "Service and clean heating system before winter.",
      scheduledDate: "2024-10-21",
      completedDate: "2024-10-21",
      deliveredDate: "2024-10-21",
      deliveryStatus: "completed",
      rating: 5,
      booking: {
        date: "2024-10-21T00:00:00.000Z",
        time: "14:00",
        timeSlot: "Afternoon"
      }
    },
    {
      id: "ORD-P013",
      items: [],
      service: "Fence Installation - Basic Package",
      date: "2024-10-18",
      status: "Completed",
      amount: "£420",
      amountValue: 420,
      professional: "Current User",
      professionalAvatar: "",
      client: "Grace Lewis",
      clientAvatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150",
      clientPhone: "+44 7456 789013",
      clientEmail: "grace.lewis@gmail.com",
      address: {
        name: "Grace Lewis",
        addressLine1: "47 Garden Road",
        city: "Plymouth",
        postcode: "PL1 3AA",
        phone: "+44 7456 789013"
      },
      description: "Install new wooden fence panels around back garden.",
      scheduledDate: "2024-10-19",
      completedDate: "2024-10-20",
      deliveredDate: "2024-10-20",
      deliveryStatus: "completed",
      rating: 4,
      booking: {
        date: "2024-10-19T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P014",
      items: [],
      service: "Appliance Repair - Basic Package",
      date: "2024-10-15",
      status: "Completed",
      amount: "£145",
      amountValue: 145,
      professional: "Current User",
      professionalAvatar: "",
      client: "Noah Clark",
      clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      clientPhone: "+44 7567 890124",
      clientEmail: "noah.clark@gmail.com",
      address: {
        name: "Noah Clark",
        addressLine1: "82 Station Road",
        city: "York",
        postcode: "YO1 6AA",
        phone: "+44 7567 890124"
      },
      description: "Fix washing machine - not spinning properly.",
      scheduledDate: "2024-10-16",
      completedDate: "2024-10-16",
      deliveredDate: "2024-10-16",
      deliveryStatus: "completed",
      rating: 5,
      booking: {
        date: "2024-10-16T00:00:00.000Z",
        time: "11:00",
        timeSlot: "Morning"
      }
    },
    // Additional Professional Orders - Cancelled
    {
      id: "ORD-P015",
      items: [],
      service: "Deck Building - Premium Package",
      date: "2024-10-30",
      status: "Cancelled",
      amount: "£890",
      amountValue: 890,
      professional: "Current User",
      professionalAvatar: "",
      client: "Mia Turner",
      clientAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150",
      clientPhone: "+44 7678 901235",
      clientEmail: "mia.turner@gmail.com",
      address: {
        name: "Mia Turner",
        addressLine1: "33 Woodland Close",
        city: "Cambridge",
        postcode: "CB1 2AA",
        phone: "+44 7678 901235"
      },
      description: "Build raised deck with railings in back garden.",
      scheduledDate: "2024-11-03",
      deliveryStatus: "cancelled",
      rating: null,
      booking: {
        date: "2024-11-03T00:00:00.000Z",
        time: "08:00",
        timeSlot: "Morning"
      }
    },
    {
      id: "ORD-P016",
      items: [],
      service: "Driveway Paving - Standard Package",
      date: "2024-10-28",
      status: "Cancelled",
      amount: "£1250",
      amountValue: 1250,
      professional: "Current User",
      professionalAvatar: "",
      client: "Lucas White",
      clientAvatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150",
      clientPhone: "+44 7789 012346",
      clientEmail: "lucas.white@gmail.com",
      address: {
        name: "Lucas White",
        addressLine1: "19 Hillside Avenue",
        city: "Southampton",
        postcode: "SO14 0AA",
        phone: "+44 7789 012346"
      },
      description: "Replace old driveway with block paving.",
      scheduledDate: "2024-11-02",
      deliveryStatus: "cancelled",
      rating: null,
      booking: {
        date: "2024-11-02T00:00:00.000Z",
        time: "08:00",
        timeSlot: "Morning"
      }
    },
    // Additional Professional Orders - Dispute
    {
      id: "ORD-P017",
      items: [],
      service: "Plastering Service - Standard Package",
      date: "2024-11-05",
      status: "In Progress",
      amount: "£340",
      amountValue: 340,
      professional: "Current User",
      professionalAvatar: "",
      client: "Ava Moore",
      clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      clientPhone: "+44 7890 123457",
      clientEmail: "ava.moore@gmail.com",
      address: {
        name: "Ava Moore",
        addressLine1: "61 Valley Road",
        city: "Leicester",
        postcode: "LE1 1AA",
        phone: "+44 7890 123457"
      },
      description: "Plaster walls in two rooms after removing old wallpaper.",
      scheduledDate: "2024-11-07",
      deliveryStatus: "dispute",
      rating: null,
      booking: {
        date: "2024-11-07T00:00:00.000Z",
        time: "09:00",
        timeSlot: "Morning"
      }
    },
    // Additional Client Order - Completed without review
    {
      id: "ORD-012",
      items: [],
      service: "Appliance Installation",
      date: "2024-10-27",
      status: "Completed",
      amount: "£185",
      amountValue: 185,
      professional: "Andrew Collins",
      professionalAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      professionalPhone: "+44 7666 777888",
      professionalEmail: "andrew.collins@gmail.com",
      address: {
        name: "John Client",
        addressLine1: "567 Green Lane",
        city: "London",
        postcode: "SE1 4CC",
        phone: "+44 7123 456789"
      },
      description: "Install new dishwasher and connect to water supply and drainage.",
      scheduledDate: "2024-10-28",
      completedDate: "2024-10-28",
      deliveredDate: "2024-10-28",
      deliveryStatus: "completed",
      rating: null,
      booking: {
        date: "2024-10-28T00:00:00.000Z",
        time: "13:00",
        timeSlot: "Afternoon"
      }
    }
  ]);

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
      professionalAvatar: orderData.items[0]?.image || "https://images.unsplash.com/photo-1635221798248-8a3452ad07cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicml0aXNoJTIwcGx1bWJlciUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjI3ODE3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
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
  const [disputes, setDisputes] = useState<OrderDispute[]>([
    {
      id: "DISP-1757607480",
      orderId: "ORD-P007",
      claimantId: "client-user",
      claimantName: "MatJohn LTD",
      claimantAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      respondentId: "professional-user",
      respondentName: "David James",
      respondentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      amount: 290,
      reason: "Define the terms of your offer and what it includes.",
      status: "closed",
      messages: [
        {
          id: "MSG-1",
          userId: "client-user",
          userName: "MatJohn LTD",
          userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          message: "Define the terms of your offer and what it includes.",
          timestamp: "2025-09-11T16:18:00.000Z",
        },
        {
          id: "MSG-2",
          userId: "professional-user",
          userName: "David James",
          userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
          message: "Define the terms of your offer and what it includes.",
          timestamp: "2025-09-11T16:19:11.000Z",
        },
        {
          id: "MSG-3",
          userId: "client-user",
          userName: "MatJohn LTD",
          userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          message: "xcxxc",
          timestamp: "2025-09-11T16:20:29.000Z",
        },
      ],
      claimantOffer: {
        userId: "client-user",
        amount: 44.00,
        timestamp: "2025-09-11T16:19:00.000Z",
      },
      respondentOffer: {
        userId: "professional-user",
        amount: 46.00,
        timestamp: "2025-09-11T16:19:30.000Z",
      },
      createdAt: "2025-09-11T16:18:00.000Z",
      resolvedAt: "2025-09-11T16:21:00.000Z",
      teamInterventionTime: "2025-09-12T16:18:00.000Z",
    }
  ]);

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
