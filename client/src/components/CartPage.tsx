import { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { useAccount } from "./AccountContext";
import { useOrders } from "./OrdersContext";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "./SEOHead";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag,
  CheckCircle2,
  Truck,
  Shield,
  Gift,
  MapPin,
  CreditCard,
  Edit2,
  Home,
  Briefcase,
  ChevronRight,
  X,
  Check,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Landmark
} from "lucide-react";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { toast } from "sonner@2.0.3";
import CartPageMobileMinimalist from "./CartPageMobileMinimalist";
import AddressAutocomplete from "./AddressAutocomplete";
import { resolveApiUrl } from "../config/api";
import paypalLogo from "../assets/paypal-logo.png";
import BookingModal from "./BookingModal";

interface Address {
  id: string;
  postcode: string;
  address: string;
  city: string; // Town/City
  county?: string; // Borough/Council (optional)
  phone: string;
  isDefault?: boolean;
}

interface PaymentMethod {
  id: string;
  type: "account_balance" | "card" | "paypal" | "bank_transfer";
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  isDefault?: boolean;
  balance?: number; // For account_balance
}

// Helper function to determine card type from brand or card number
const getCardType = (brand?: string, cardNumber?: string): 'visa' | 'mastercard' | 'unknown' => {
  // First try to use brand if available
  if (brand) {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'visa';
    if (brandLower.includes('mastercard') || brandLower.includes('master')) return 'mastercard';
  }
  
  // Fallback to card number if brand is not available
  if (cardNumber) {
    const lastFourDigits = cardNumber.slice(-4);
    // Visa cards typically start with 4, Mastercard with 5
    if (lastFourDigits === '4242' || lastFourDigits.startsWith('4')) return 'visa';
    if (lastFourDigits === '5555' || lastFourDigits.startsWith('5')) return 'mastercard';
  }
  
  // Default to visa
  return 'visa';
};

// Card Logo Components
const VisaLogo = () => (
  <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white"/>
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1"/>
    <path d="M22.5859 22.75H19.9609L21.7859 14H24.4109L22.5859 22.75ZM17.7109 14L15.2109 20.125L14.9109 18.375L14.0359 14.875C14.0359 14.875 13.8859 14 13.2859 14H9.08594V14.15C9.08594 14.15 10.2609 14.45 11.5859 15.175L13.9609 22.75H16.8359L20.9609 14H17.7109ZM37.8359 22.75H40.1859L38.2859 14H36.2859C35.8359 14 35.5359 14.3 35.3859 14.75L31.4609 22.75H34.3359L34.9359 21.3H38.3359L38.6359 22.75H37.8359ZM35.6359 19.125L36.9609 16.0625L37.6859 19.125H35.6359ZM31.5859 16.875L32.0359 14.875C32.0359 14.875 30.8609 14 29.6859 14C28.3609 14 25.3359 14.75 25.3359 17.5625C25.3359 20.1875 29.1859 20.1875 29.1859 21.3125C29.1859 22.4375 25.9609 22.1875 24.9359 21.4375L24.4859 23.4375C24.4859 23.4375 25.6609 24 27.4359 24C29.0609 24 31.8359 23.125 31.8359 20.5C31.8359 17.875 28.0359 17.625 28.0359 16.75C28.0359 15.75 30.5359 15.875 31.5859 16.875Z" fill="#1434CB"/>
  </svg>
);

const MastercardLogo = () => (
  <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white"/>
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1"/>
    <circle cx="21" cy="18" r="8" fill="#EB001B"/>
    <circle cx="35" cy="18" r="8" fill="#F79E1B"/>
    <path d="M28 11.5C26.25 13 25 15.35 25 18C25 20.65 26.25 23 28 24.5C29.75 23 31 20.65 31 18C31 15.35 29.75 13 28 11.5Z" fill="#FF5F00"/>
  </svg>
);



export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, updateCartItem, cartTotal, clearCart } = useCart();
  const { isLoggedIn, authReady } = useAccount();
  const { refreshOrders } = useOrders();
  const navigate = useNavigate();
  
  // Redirect to login if not logged in (only after auth is ready)
  useEffect(() => {
    if (authReady && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, authReady, navigate]);

  // Log cart items to console whenever cartItems change
  useEffect(() => {
    console.log('[Cart Page] Cart Items Updated:', {
      totalItems: cartItems.length,
      items: cartItems.map(item => ({
        id: item.id, // Item key for uniqueness
        serviceId: (item as any).serviceId || item.id, // Actual MongoDB service ID
        title: item.title,
        seller: item.seller,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        rating: item.rating,
        addons: item.addons,
        booking: item.booking,
        packageType: item.packageType,
      })),
      cartTotal: cartTotal,
    });
  }, [cartItems, cartTotal]);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Address state
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [skipAddress, setSkipAddress] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Payment method state
  const [selectedPayment, setSelectedPayment] = useState<string>("account_balance");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [serviceFee, setServiceFee] = useState<number>(0);
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentBookingItemIndex, setCurrentBookingItemIndex] = useState<number>(0);
  const [servicesNeedingBooking, setServicesNeedingBooking] = useState<Array<{ item: any; serviceId: string; availability: any }>>([]);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  
  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isLoggedIn) return;
      
      try {
        const response = await fetch(resolveApiUrl("/api/wallet/balance"), {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.balance || 0);
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
      } finally {
        setLoadingBalance(false);
      }
    };
    
    fetchBalance();
  }, [isLoggedIn]);

  // Fetch service fee from payment settings
  useEffect(() => {
    const fetchServiceFee = async () => {
      if (!isLoggedIn) return;
      
      try {
        const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setServiceFee(data.serviceFees || 0);
        }
      } catch (error) {
        console.error("Failed to fetch service fee:", error);
      }
    };
    
    fetchServiceFee();
  }, [isLoggedIn]);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isLoggedIn) return;
      
      try {
        setLoadingAddresses(true);
        const response = await fetch(resolveApiUrl("/api/auth/profile/addresses"), {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          const fetchedAddresses: Address[] = (data.addresses || []).map((addr: any) => ({
            id: addr.id || addr._id?.toString() || Date.now().toString(),
            postcode: addr.postcode || "",
            address: addr.address || "",
            city: addr.city || "",
            county: addr.county || "",
            phone: addr.phone || "",
            isDefault: addr.isDefault || false,
          }));
          setAddresses(fetchedAddresses);
          
          // Set default address as selected if available
          const defaultAddress = fetchedAddresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress.id);
          } else if (fetchedAddresses.length > 0) {
            setSelectedAddress(fetchedAddresses[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    
    fetchAddresses();
  }, [isLoggedIn]);

  // Fetch payment methods (Stripe cards)
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!isLoggedIn) return;
      
      try {
        setLoadingPaymentMethods(true);
        const response = await fetch(resolveApiUrl("/api/payment-methods"), {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          const cards = (data.paymentMethods || []).map((pm: any) => ({
            id: pm.paymentMethodId || pm.id,
            type: "card" as const,
            cardNumber: `**** **** **** ${pm.last4 || '4242'}`,
            cardHolder: pm.billing_details?.name || "Card Holder",
            expiryDate: `${pm.card?.exp_month || 12}/${(pm.card?.exp_year || 2025) % 100}`,
            isDefault: pm.isDefault || false,
            brand: pm.card?.brand || 'visa', // Store card brand for accurate type detection
          }));
          
          // Build payment methods list: Account Balance first, then cards, PayPal, Bank Transfer
          const methods: PaymentMethod[] = [
            {
              id: "account_balance",
              type: "account_balance",
              isDefault: true,
              balance: walletBalance,
            },
            ...cards,
            {
              id: "paypal",
              type: "paypal",
              isDefault: false,
            },
            {
              id: "bank_transfer",
              type: "bank_transfer",
              isDefault: false,
            },
          ];
          
          setPaymentMethods(methods);
          
          // Set default payment method (account_balance if balance > 0, otherwise first card or paypal)
          if (walletBalance > 0) {
            setSelectedPayment("account_balance");
          } else if (cards.length > 0) {
            setSelectedPayment(cards[0].id);
          } else {
            setSelectedPayment("paypal");
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        // Fallback payment methods
        const fallbackMethods: PaymentMethod[] = [
          {
            id: "account_balance",
            type: "account_balance",
            isDefault: true,
            balance: walletBalance,
          },
          {
            id: "paypal",
            type: "paypal",
            isDefault: false,
          },
          {
            id: "bank_transfer",
            type: "bank_transfer",
            isDefault: false,
          },
        ];
        setPaymentMethods(fallbackMethods);
        setSelectedPayment("account_balance");
      } finally {
        setLoadingPaymentMethods(false);
      }
    };
    
    fetchPaymentMethods();
  }, [isLoggedIn, walletBalance]);

  // New address form state
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    postcode: "",
    address: "",
    city: "",
    county: "",
    phone: ""
  });

  // Toggle states for mobile collapsible sections
  const [showAddressSection, setShowAddressSection] = useState(true);
  const [showPaymentSection, setShowPaymentSection] = useState(true);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showItemsSection, setShowItemsSection] = useState(true);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "SAVE10") {
      setAppliedPromo("SAVE10");
      setDiscount(cartTotal * 0.1);
      toast.success("Promo code applied!", {
        description: "You saved 10% on your order"
      });
    } else if (promoCode.toUpperCase() === "WELCOME20") {
      setAppliedPromo("WELCOME20");
      setDiscount(cartTotal * 0.2);
      toast.success("Promo code applied!", {
        description: "You saved 20% on your order"
      });
    } else {
      toast.error("Invalid promo code", {
        description: "Try: SAVE10 or WELCOME20"
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setPromoCode("");
    toast.info("Promo code removed");
  };

  const handleAddAddress = async () => {
    if (!newAddress.postcode || !newAddress.address || !newAddress.city || !newAddress.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const newAddressData = {
        postcode: newAddress.postcode,
        address: newAddress.address,
        city: newAddress.city,
        county: newAddress.county || "",
        phone: newAddress.phone,
        isDefault: addresses.length === 0, // First address is default
      };

      // Save to API
      const response = await fetch(resolveApiUrl("/api/auth/profile/addresses"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newAddressData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save address");
      }

      const data = await response.json();
      const savedAddress: Address = {
        id: data.address?.id || data.address?._id || Date.now().toString(),
        postcode: data.address?.postcode || newAddressData.postcode,
        address: data.address?.address || newAddressData.address,
        city: data.address?.city || newAddressData.city,
        county: data.address?.county || newAddressData.county,
        phone: data.address?.phone || newAddressData.phone,
        isDefault: data.address?.isDefault || newAddressData.isDefault,
      };

      // Update local state
      setAddresses([...addresses, savedAddress]);
      setSelectedAddress(savedAddress.id);
      setShowAddressDialog(false);
      setNewAddress({
        postcode: "",
        address: "",
        city: "",
        county: "",
        phone: ""
      });
      toast.success("Address added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save address");
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      // Delete from API
      const response = await fetch(resolveApiUrl(`/api/auth/profile/addresses/${id}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete address");
      }

      // Update local state
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      setAddresses(updatedAddresses);
      
      if (selectedAddress === id) {
        setSelectedAddress(updatedAddresses[0]?.id || "");
      }
      
      toast.success("Address removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete address");
    }
  };

  // Check which services need booking (have availability data)
  const checkServicesNeedingBooking = async () => {
    console.log('[Booking Check] Starting to check services for booking requirements');
    console.log('[Booking Check] Cart items:', cartItems.map(item => ({ id: item.id, title: item.title, hasBooking: !!item.booking })));
    
    const servicesToCheck: Array<{ item: any; serviceId: string; availability: any }> = [];
    
    for (const item of cartItems) {
      // Skip if item already has booking info
      if (item.booking) {
        console.log(`[Booking Check] Skipping item ${item.id} - already has booking info:`, item.booking);
        continue;
      }
      
      try {
        console.log(`[Booking Check] Fetching service details for item ID: ${item.id} (Type: ${typeof item.id})`);
        
        // Check if item.id is a MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.id);
        console.log(`[Booking Check] Item ID ${item.id} is ObjectId format: ${isObjectId}`);
        
        // If it's a numeric ID (like 17629339), we can't directly find the service
        // In this case, skip the booking check (the service might not need booking or was added with old format)
        if (!isObjectId && /^\d+$/.test(item.id)) {
          console.warn(`[Booking Check] Item ID ${item.id} is numeric (not ObjectId). Cannot fetch service for booking check. Skipping.`);
          console.warn(`[Booking Check] Note: This item was likely added with an old format. Consider re-adding to cart.`);
          continue;
        }
        
        // Fetch service details to check availability
        // Try both ObjectId and slug formats
        const serviceUrl = resolveApiUrl(`/api/services/${item.id}`);
        console.log(`[Booking Check] Request URL: ${serviceUrl}`);
        
        const response = await fetch(serviceUrl, {
          credentials: "include",
        });
        
        console.log(`[Booking Check] Response status for ${item.id}:`, response.status, response.statusText);
        
        if (!response.ok) {
          // If service not found (404), skip this item silently
          // It might have been deleted or doesn't exist, but we don't want to block the order
          if (response.status === 404) {
            console.warn(`[Booking Check] Service ${item.id} not found (404), skipping booking check`);
            continue;
          }
          // For other errors (500, etc.), log but continue
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (e) {
            console.error(`[Booking Check] Failed to parse error response for ${item.id}:`, e);
          }
          console.warn(`[Booking Check] Failed to fetch service ${item.id} (${response.status}):`, errorData.error || response.statusText);
          continue;
        }
        
        const serviceData = await response.json();
        console.log(`[Booking Check] Service data received for ${item.id}:`, {
          hasService: !!serviceData?.service,
          hasAvailability: !!serviceData?.service?.availability,
          availabilityKeys: serviceData?.service?.availability ? Object.keys(serviceData.service.availability) : [],
        });
        
        // Check if service has availability data
        if (serviceData?.service?.availability && Object.keys(serviceData.service.availability).length > 0) {
          console.log(`[Booking Check] Service ${item.id} requires booking - adding to list`);
          servicesToCheck.push({
            item,
            serviceId: serviceData.service._id?.toString() || serviceData.service.id || item.id,
            availability: serviceData.service.availability,
          });
        } else {
          console.log(`[Booking Check] Service ${item.id} does not require booking (no availability data)`);
        }
      } catch (error) {
        // Network or other errors - log but continue to next item
        console.error(`[Booking Check] Error checking service ${item.id} for booking:`, error);
        // Continue to next item instead of breaking
      }
    }
    
    console.log(`[Booking Check] Completed. Services requiring booking: ${servicesToCheck.length}`, servicesToCheck.map(s => ({ id: s.item.id, title: s.item.title })));
    return servicesToCheck;
  };

  const handleBookingConfirm = (date: Date, time: string, timeSlot: string) => {
    if (currentBookingItemIndex >= servicesNeedingBooking.length) return;
    
    const currentItem = servicesNeedingBooking[currentBookingItemIndex].item;
    
    // Generate item key to find the item in cart
    const generateItemKey = (item: any) => {
      const parts = [item.id];
      if (item.packageType) {
        parts.push(item.packageType);
      }
      if (item.addons && item.addons.length > 0) {
        const addonsKey = item.addons
          .sort((a: any, b: any) => a.id - b.id)
          .map((a: any) => `${a.id}-${a.price}`)
          .join(',');
        parts.push(addonsKey);
      }
      return parts.join('|');
    };
    
    const itemKey = generateItemKey(currentItem);
    
    // Update cart item with booking info
    updateCartItem(itemKey, {
      booking: {
        date: date.toISOString(),
        time: time,
        timeSlot: timeSlot,
      },
    });
    
    // Move to next item or proceed with order
    if (currentBookingItemIndex < servicesNeedingBooking.length - 1) {
      setCurrentBookingItemIndex(currentBookingItemIndex + 1);
    } else {
      // All bookings completed, proceed with order
      setShowBookingModal(false);
      setIsProcessingBooking(false);
      proceedWithOrder();
    }
  };

  const proceedWithOrder = async () => {
    if (!skipAddress && !selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }

    // Get selected address details
    const addressDetails = skipAddress 
      ? undefined 
      : addresses.find(addr => addr.id === selectedAddress);

    const subtotal = cartTotal;
    const orderTotal = subtotal - discount + serviceFee;

    try {
      // Handle different payment methods
      if (selectedPayment === "account_balance") {
        // Check if balance is sufficient
        if (walletBalance < orderTotal) {
          toast.error("Insufficient balance", {
            description: `You need £${(orderTotal - walletBalance).toFixed(2)} more. Current balance: £${walletBalance.toFixed(2)}`
          });
          return;
        }

        // Create order with account balance payment
        const response = await fetch(resolveApiUrl("/api/orders"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            items: cartItems,
            address: addressDetails,
            skipAddress: skipAddress,
            paymentMethod: "account_balance",
            total: orderTotal,
            subtotal: subtotal,
            discount: discount,
            serviceFee: serviceFee,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to place order");
        }

        const result = await response.json();
        
        // Update local balance
        setWalletBalance(result.newBalance || 0);
        
        // Refresh orders to show new order in account page
        if (refreshOrders) {
          await refreshOrders();
        }
        
        toast.success("Order placed successfully!", {
          description: `Order ${result.orderId} created. £${orderTotal.toFixed(2)} deducted from your account balance.`
        });
        
        // Clear cart
        clearCart();
        
        // Navigate to account orders page
        setTimeout(() => {
          navigate('/account?tab=orders');
        }, 1500);
      } else if (selectedPayment === "card" || paymentMethods.find(m => m.id === selectedPayment)?.type === "card") {
        // Get selected card payment method
        const selectedMethod = paymentMethods.find(m => m.id === selectedPayment && m.type === "card");
        if (!selectedMethod) {
          toast.error("Please select a valid payment method");
          return;
        }

        // Create order with card payment (will fund wallet first, then deduct)
        const response = await fetch(resolveApiUrl("/api/orders"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            items: cartItems,
            address: addressDetails,
            skipAddress: skipAddress,
            paymentMethod: "card",
            paymentMethodId: selectedMethod.id,
            total: orderTotal,
            subtotal: subtotal,
            discount: discount,
            serviceFee: serviceFee,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to place order");
        }

        const result = await response.json();
        
        // Update local balance if returned
        if (result.newBalance !== undefined) {
          setWalletBalance(result.newBalance);
        }
        
        // Refresh orders to show new order in account page
        if (refreshOrders) {
          await refreshOrders();
        }
        
        toast.success("Order placed successfully!", {
          description: `Order ${result.orderId} created. Payment processed via card.`
        });
        
        // Clear cart
        clearCart();
        
        // Navigate to account orders page
        setTimeout(() => {
          navigate('/account?tab=orders');
        }, 1500);
      } else if (selectedPayment === "paypal") {
        // Create order with PayPal payment (will fund wallet first, then deduct)
        const response = await fetch(resolveApiUrl("/api/orders"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            items: cartItems,
            address: addressDetails,
            skipAddress: skipAddress,
            paymentMethod: "paypal",
            total: orderTotal,
            subtotal: subtotal,
            discount: discount,
            serviceFee: serviceFee,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to place order");
        }

        const result = await response.json();
        
        // If PayPal order needs approval, redirect to PayPal
        if (result.paypalOrderId && result.approveUrl) {
          window.location.href = result.approveUrl;
          return;
        }
        
        // Update local balance if returned
        if (result.newBalance !== undefined) {
          setWalletBalance(result.newBalance);
        }
        
        // Refresh orders to show new order in account page
        if (refreshOrders) {
          await refreshOrders();
        }
        
        toast.success("Order placed successfully!", {
          description: `Order ${result.orderId} created. Payment processed via PayPal.`
        });
        
        // Clear cart
        clearCart();
        
        // Navigate to account orders page
        setTimeout(() => {
          navigate('/account?tab=orders');
        }, 1500);
      } else if (selectedPayment === "bank_transfer") {
        // Create order with bank transfer payment (will create pending transaction)
        const response = await fetch(resolveApiUrl("/api/orders"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            items: cartItems,
            address: addressDetails,
            skipAddress: skipAddress,
            paymentMethod: "bank_transfer",
            total: orderTotal,
            subtotal: subtotal,
            discount: discount,
            serviceFee: serviceFee,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to place order");
        }

        const result = await response.json();
        
        // Refresh orders to show new order in account page
        if (refreshOrders) {
          await refreshOrders();
        }
        
        toast.success("Order placed successfully!", {
          description: `Order ${result.orderId} created. Please complete bank transfer to finalize payment.`
        });
        
        // Clear cart
        clearCart();
        
        // Navigate to account orders page
        setTimeout(() => {
          navigate('/account?tab=orders');
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    // Check if any services need booking
    const servicesToBook = await checkServicesNeedingBooking();
    
    if (servicesToBook.length > 0) {
      // Show booking modal for first service
      setServicesNeedingBooking(servicesToBook);
      setCurrentBookingItemIndex(0);
      setIsProcessingBooking(true);
      setShowBookingModal(true);
    } else {
      // No services need booking, proceed directly
      proceedWithOrder();
    }
  };

    const subtotal = cartTotal;
    const total = subtotal - discount + serviceFee;

  if (cartItems.length === 0) {
    return (
      <>
        <SEOHead
          title="Shopping Cart"
          description="Shopping cart page"
          robots="noindex,nofollow"
        />
      <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] to-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="pt-[50px] pb-12 md:pb-20">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.08)] p-8 md:p-12 lg:p-20 text-center">
              <div className="flex justify-center mb-6 md:mb-8">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-[#FFF5EB] rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-[#FE8A0F]" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="font-['Poppins',sans-serif] text-[24px] md:text-[32px] lg:text-[40px] text-[#2c353f] mb-4">
                Your cart is empty
              </h2>
              <p className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] lg:text-[18px] text-[#6b6b6b] mb-6 md:mb-8 max-w-[500px] mx-auto">
                Looks like you haven't added any services yet. Explore our marketplace and find the perfect professional for your needs.
              </p>
              <Link to="/services">
                <Button className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white px-8 py-6 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px]">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Shopping Cart"
        description="Shopping cart page"
        robots="noindex,nofollow"
      />
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] to-[#f0f0f0]">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>
      <div className="pt-[70px] md:pt-[50px] pb-12 md:pb-20">
        <div className="max-w-[480px] md:max-w-[1400px] mx-auto px-4 md:px-6">
          
          {/* Mobile: Minimalist Single Column Layout */}
          <div className="md:hidden">
            <CartPageMobileMinimalist
              cartItems={cartItems}
              addresses={addresses}
              paymentMethods={paymentMethods}
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              skipAddress={skipAddress}
              setSkipAddress={setSkipAddress}
              onPlaceOrder={handlePlaceOrder}
              subtotal={subtotal}
              discount={discount}
              serviceFee={serviceFee}
              total={total}
              appliedPromo={appliedPromo}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
            />
          </div>

          {/* Desktop: Original Multi-column Layout */}
          <div className="hidden md:block">
            {/* Header - Minimalist */}
            <div className="mb-6 md:mb-10">
              <h1 className="font-['Poppins',sans-serif] text-[24px] md:text-[32px] text-[#2c353f]">
                Checkout
              </h1>
              <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mt-1">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • Complete your order
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Left Column - Checkout Steps */}
              <div className="lg:col-span-2 space-y-4 md:space-y-5 order-2 lg:order-1">
              
              {/* Step 1: Delivery Address - Minimalist Modern */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Toggle - Mobile Responsive */}
                <button
                  onClick={() => setShowAddressSection(!showAddressSection)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-[#FE8A0F] rounded-full flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">1</span>
                      </div>
                      <h2 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium text-left">
                        Delivery Address
                      </h2>
                    </div>
                    {/* Toggle Icon */}
                    <div>
                      {showAddressSection ? (
                        <ChevronUp className="w-5 h-5 text-[#6b6b6b]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Collapsible Content */}
                <div className={`${showAddressSection ? 'block' : 'hidden'}`}>
                  <div className="p-4 md:p-6">
                    {/* Skip Address Option - Minimalist */}
                    <div className="mb-4 md:mb-5 p-3 md:p-4 bg-blue-50/50 border border-blue-100 rounded-lg md:rounded-xl">
                      <label className="flex items-start gap-2 md:gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skipAddress}
                          onChange={(e) => setSkipAddress(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-[#3B82F6] rounded accent-[#3B82F6]"
                        />
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">
                            Skip for now
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">
                            Discuss location with professional after booking
                          </p>
                        </div>
                      </label>
                    </div>

                    {!skipAddress && (
                      <>
                        {loadingAddresses ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8A0F] mx-auto mb-2"></div>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Loading addresses...</p>
                            </div>
                          </div>
                        ) : addresses.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                              No addresses saved. Please add an address below.
                            </p>
                          </div>
                        ) : (
                          <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                            {addresses.map((address) => (
                            <div key={address.id} className="mb-3 md:mb-4">
                              <div className={`relative border-2 rounded-lg md:rounded-xl p-3 md:p-4 transition-all ${
                                selectedAddress === address.id 
                                  ? "border-[#FE8A0F] bg-[#FFF5EB]" 
                                  : "border-gray-200 hover:border-gray-300"
                              }`}>
                                <div className="flex items-start gap-2 md:gap-3">
                                  <RadioGroupItem value={address.id} id={address.id} className="mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <Label htmlFor={address.id} className="cursor-pointer">
                                      <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FE8A0F] shrink-0" />
                                        {address.isDefault && (
                                          <Badge className="bg-[#10B981] text-white text-[9px] md:text-[10px] px-1.5 py-0">Default</Badge>
                                        )}
                                      </div>
                                      {/* Mobile: Show minimal info */}
                                      <div className="md:hidden">
                                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium truncate">
                                          {address.address}
                                        </p>
                                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] truncate">
                                          {address.city}
                                        </p>
                                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                                          {address.postcode}
                                        </p>
                                      </div>
                                      {/* Desktop: Show full info */}
                                      <div className="hidden md:block">
                                        <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-1">
                                          {address.address}
                                        </p>
                                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                          {address.city}
                                          {address.county && `, ${address.county}`}
                                        </p>
                                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                          {address.postcode}
                                        </p>
                                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mt-1">
                                          Phone: {address.phone}
                                        </p>
                                      </div>
                                    </Label>
                                  </div>
                                  {!address.isDefault && (
                                    <button
                                      onClick={() => handleRemoveAddress(address.id)}
                                      className="p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          </RadioGroup>
                        )}

                        {/* Add New Address Button */}
                        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full border-2 border-dashed border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] font-['Poppins',sans-serif] text-[13px] md:text-[14px] py-5 md:py-6"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add New Address
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-full">
                            <DialogHeader>
                              <DialogTitle className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
                                Add New Address
                              </DialogTitle>
                              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                                Enter your delivery address details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <AddressAutocomplete
                                  postcode={newAddress.postcode || ""}
                                  onPostcodeChange={(value) => setNewAddress({...newAddress, postcode: value})}
                                  address={newAddress.address || ""}
                                  onAddressChange={(value) => setNewAddress({...newAddress, address: value})}
                                  townCity={newAddress.city || ""}
                                  onTownCityChange={(value) => setNewAddress({...newAddress, city: value})}
                                  county={newAddress.county || ""}
                                  onCountyChange={(value) => setNewAddress({...newAddress, county: value})}
                                  onAddressSelect={(address) => {
                                    setNewAddress({
                                      ...newAddress,
                                      postcode: address.postcode || "",
                                      address: address.address || "",
                                      city: address.townCity || "",
                                      county: address.county || "",
                                    });
                                  }}
                                  label="Postcode"
                                  required
                                  showAddressField={true}
                                  showTownCityField={true}
                                  showCountyField={true}
                                  addressLabel="Address"
                                  className="font-['Poppins',sans-serif]"
                                />
                              </div>
                              <div>
                                <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">Phone Number *</Label>
                                <Input
                                  value={newAddress.phone}
                                  onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                                  className="mt-1 font-['Poppins',sans-serif]"
                                  placeholder="07123 456789"
                                />
                              </div>
                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={handleAddAddress}
                                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                                >
                                  Save Address
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowAddressDialog(false)}
                                  className="flex-1 font-['Poppins',sans-serif]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Toggle */}
                <button
                  onClick={() => setShowPaymentSection(!showPaymentSection)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-[#3B82F6] rounded-full flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">2</span>
                      </div>
                      <h2 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium text-left">
                        Payment Method
                      </h2>
                    </div>
                    {/* Toggle Icon */}
                    <div>
                      {showPaymentSection ? (
                        <ChevronUp className="w-5 h-5 text-[#6b6b6b]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Collapsible Content */}
                <div className={`${showPaymentSection ? 'block' : 'hidden'}`}>
                  <div className="p-4 md:p-6">
                    <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="mb-3 md:mb-4">
                          <div className={`relative border-2 rounded-lg md:rounded-xl p-3 md:p-4 transition-all ${
                            selectedPayment === method.id 
                              ? "border-[#3B82F6] bg-blue-50/50" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}>
                            <div className="flex items-start gap-2 md:gap-3">
                              <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={`payment-${method.id}`} className="cursor-pointer">
                                  {method.type === "account_balance" && (
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <div className="w-10 h-10 md:w-12 md:h-12 bg-[#10B981] rounded-full flex items-center justify-center shrink-0">
                                        <Gift className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">
                                            Account Balance
                                          </span>
                                          {method.isDefault && (
                                            <Badge className="bg-[#10B981] text-white text-[9px] md:text-[10px] px-1.5 py-0">Default</Badge>
                                          )}
                                        </div>
                                        <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">
                                          Available: £{walletBalance.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {method.type === "card" && (
                                    <>
                                      <div className="flex items-center gap-2 md:gap-3">
                                        {/* Display card brand logo - Mobile Smaller */}
                                        <div className="shrink-0 scale-90 md:scale-100">
                                          {getCardType(method.brand, method.cardNumber) === 'visa' ? (
                                            <VisaLogo />
                                          ) : getCardType(method.brand, method.cardNumber) === 'mastercard' ? (
                                            <MastercardLogo />
                                          ) : (
                                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                                              <CreditCard className="w-4 h-4 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">
                                              {method.cardNumber}
                                            </span>
                                            {method.isDefault && (
                                              <Badge className="bg-[#10B981] text-white text-[9px] md:text-[10px] px-1.5 py-0">Default</Badge>
                                            )}
                                          </div>
                                          {/* Mobile: Hide card holder, show only expiry */}
                                          <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">
                                            <span className="hidden md:inline">{method.cardHolder} • </span>Exp. {method.expiryDate}
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  {method.type === "paypal" && (
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <div className="shrink-0">
                                        <img 
                                          src={paypalLogo} 
                                          alt="PayPal" 
                                          className="h-8 w-auto object-contain"
                                          style={{ maxWidth: "100px" }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">
                                          PayPal
                                        </span>
                                        <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">
                                          Pay securely with PayPal
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {method.type === "bank_transfer" && (
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <div className="w-10 h-6 md:w-12 md:h-7 flex items-center justify-center bg-white rounded shrink-0 border border-gray-200">
                                        <Landmark className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">
                                          Bank Transfer
                                        </span>
                                        <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">
                                          Transfer funds directly from your bank
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>

                    {selectedPayment !== "account_balance" && selectedPayment !== "paypal" && selectedPayment !== "bank_transfer" && (
                      <Button 
                        variant="outline" 
                        className="w-full border-2 border-dashed border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 font-['Poppins',sans-serif] text-[13px] md:text-[14px] py-5 md:py-6 mt-1 md:mt-2"
                        onClick={() => navigate('/account?tab=billing&section=fund')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Card
                      </Button>
                    )}

                    {/* Security Note */}
                    <div className="mt-3 md:mt-4 flex items-start gap-2 bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3">
                      <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] leading-relaxed">
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Review Items - Minimalist */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Toggle */}
                <button
                  onClick={() => setShowItemsSection(!showItemsSection)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-[#10B981] rounded-full flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">3</span>
                      </div>
                      <h2 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium">
                        Review Items
                      </h2>
                      <Badge className="bg-gray-100 text-[#2c353f] text-[11px] md:text-[12px] ml-auto">{cartItems.length}</Badge>
                    </div>
                    {/* Toggle Icon */}
                    <div>
                      {showItemsSection ? (
                        <ChevronUp className="w-5 h-5 text-[#6b6b6b]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Collapsible Content */}
                <div className={`${showItemsSection ? 'block' : 'hidden'}`}>
                  <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex gap-3 md:gap-4">
                          {/* Service Image - Minimalist */}
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Service Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium mb-0.5 line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mb-2">
                              by {item.seller}
                            </p>
                            
                            {/* Selected Addons - Minimalist */}
                            {item.addons && item.addons.length > 0 && (
                              <div className="mb-2 space-y-0.5">
                                {item.addons.map((addon) => (
                                  <p key={addon.id} className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#FE8A0F]">
                                    + {addon.title} (£{addon.price})
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Booking Information - Minimalist */}
                            {item.booking && (
                              <div className="bg-blue-50/70 border border-blue-200 rounded-md md:rounded-lg p-2 mb-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Calendar className="w-3 h-3 text-[#3B82F6]" />
                                  <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#3B82F6] font-medium">
                                    Appointment Scheduled
                                  </p>
                                </div>
                                <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#2c353f]">
                                  {new Date(item.booking.date).toLocaleDateString('en-GB', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} • {item.booking.time}
                                </p>
                              </div>
                            )}

                            {/* Quantity and Price - Mobile Optimized */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] min-w-[16px] md:min-w-[20px] text-center font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2 md:gap-3">
                                <p className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] text-[#2c353f] font-medium">
                                  £{((item.price + (item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0)) * item.quantity).toFixed(2)}
                                </p>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors active:scale-95"
                                >
                                  <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sticky top-32">
                <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
                  Order Summary
                </h2>

                {/* Promo Code */}
                <div className="mb-6">
                  <label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Have a promo code?
                  </label>
                  {!appliedPromo ? (
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="text"
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 font-['Poppins',sans-serif] text-[14px] rounded-xl border-gray-200"
                      />
                      <Button
                        onClick={handleApplyPromo}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl px-4 font-['Poppins',sans-serif] text-[14px]"
                      >
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-['Poppins',sans-serif] text-[13px] text-green-700">
                          {appliedPromo} Applied
                        </span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mt-2">
                    Try: SAVE10 or WELCOME20
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                      £{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="font-['Poppins',sans-serif] text-[14px]">
                        Discount ({appliedPromo})
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[16px]">
                        -£{discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {serviceFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        Service Fee
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        £{serviceFee.toFixed(2)}
                      </span>
                    </div>
                  )}

                </div>

                <Separator className="my-6" />

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                    Total
                  </span>
                  <span className="font-['Poppins',sans-serif] text-[28px] text-[#FE8A0F]">
                    £{total.toFixed(2)}
                  </span>
                </div>

                {/* Place Order Button */}
                <Button 
                  onClick={handlePlaceOrder}
                  className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white py-6 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px] mb-3"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Place Order
                </Button>

                <Link to="/services">
                  <Button variant="outline" className="w-full border-2 border-gray-300 text-[#6b6b6b] hover:bg-gray-50 py-6 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px]">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#10B981]" />
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      100% Secure Payments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      Money Back Guarantee
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#10B981]" />
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      Professional Service Delivery
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      
      {/* Booking Modal for services requiring date/time selection */}
      {showBookingModal && servicesNeedingBooking.length > 0 && currentBookingItemIndex < servicesNeedingBooking.length && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setIsProcessingBooking(false);
            setServicesNeedingBooking([]);
            setCurrentBookingItemIndex(0);
          }}
          onConfirm={handleBookingConfirm}
          sellerName={servicesNeedingBooking[currentBookingItemIndex].item.seller}
          serviceTitle={servicesNeedingBooking[currentBookingItemIndex].item.title}
          availability={servicesNeedingBooking[currentBookingItemIndex].availability}
        />
      )}
    </div>
    </>
  );
}