import React, { useState, useEffect, useRef } from "react";
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
  Landmark,
  Play,
  FileText,
  AlertTriangle,
  Image,
  Upload,
  Film,
  Info,
  StickyNote
} from "lucide-react";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Calendar as CalendarComponent } from "./ui/calendar";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { toast } from "sonner@2.0.3";
import CartPageMobileMinimalist from "./CartPageMobileMinimalist";
import AddressAutocomplete from "./AddressAutocomplete";
import { resolveApiUrl } from "../config/api";
import paypalLogo from "../assets/paypal-logo.png";
import PaymentMethodModal from "./PaymentMethodModal";

// Video Thumbnail Component with Play Button
function VideoThumbnail({
  videoUrl,
  thumbnail,
  fallbackImage,
  className = "",
  style = {},
}: {
  videoUrl: string;
  thumbnail?: string;
  fallbackImage?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set video to middle frame when metadata loads
  useEffect(() => {
    if (!videoRef.current || isPlaying) return;
    
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        // Seek to middle of video for thumbnail
        video.currentTime = video.duration / 2;
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isPlaying]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play().catch(() => {
        // Handle play error (e.g., autoplay blocked)
        setIsPlaying(false);
      });
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow clicking video to play/pause
    if (videoRef.current) {
      if (videoRef.current.paused) {
        setIsPlaying(true);
        videoRef.current.play();
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVideoEnd = () => {
    if (videoRef.current) {
      // Seek back to middle when video ends
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        videoRef.current.currentTime = videoRef.current.duration / 2;
      }
      setIsPlaying(false);
    }
  };

  // Resolve URLs for video and thumbnail
  const resolvedVideoUrl = videoUrl.startsWith("http") || videoUrl.startsWith("blob:") ? videoUrl : resolveApiUrl(videoUrl);
  const resolvedPoster = thumbnail ? (thumbnail.startsWith("http") || thumbnail.startsWith("blob:") ? thumbnail : resolveApiUrl(thumbnail)) : 
                         fallbackImage ? (fallbackImage.startsWith("http") || fallbackImage.startsWith("blob:") ? fallbackImage : resolveApiUrl(fallbackImage)) : undefined;

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Video element - always shown, plays on button click */}
      <video
        ref={videoRef}
        src={resolvedVideoUrl}
        poster={resolvedPoster}
        className="w-full h-full object-cover object-center"
        style={{ minWidth: '100%', minHeight: '100%' }}
        muted
        playsInline
        loop
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
        preload="metadata"
      />
      
      {/* Play Button Overlay - shown when video is paused */}
      {!isPlaying && (
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group z-10"
          aria-label="Play video"
        >
          <div className="bg-white/90 group-hover:bg-white rounded-full p-3 md:p-4 shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 md:w-8 md:h-8 text-[#FE8A0F] fill-[#FE8A0F]" />
          </div>
        </button>
      )}
    </div>
  );
}

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
  type: "card" | "paypal";
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  isDefault?: boolean;
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
);// Helper function to resolve media URLs (images/videos)
const resolveMediaUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return resolveApiUrl(url);
  }
  return url;
};

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
    
    // 🔍 Detailed priceUnit check for each item
    cartItems.forEach((item, index) => {
      console.log(`📋 [Cart Page] Item ${index + 1}:`, {
        title: item.title
      });
    });
  }, [cartItems, cartTotal]);

  // Fetch available promo codes from professionals who created services in cart
  useEffect(() => {
    const fetchAvailablePromoCodes = async () => {
      if (!isLoggedIn || !cartItems || cartItems.length === 0) {
        setAvailablePromoCodes([]);
        return;
      }

      try {
        const subtotal = cartTotal;
        const requestPayload = {
          items: cartItems.map(item => ({
            id: item.id,
            serviceId: (item as any).serviceId || item.id,
          })),
          subtotal: subtotal,
        };

        const response = await fetch(resolveApiUrl("/api/promo-codes/available-by-services"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestPayload),
        });

        if (response.ok) {
          const data = await response.json();
          setAvailablePromoCodes(data.promoCodes || []);
        } else {
          console.error("[CartPage] Failed to fetch available promo codes");
          setAvailablePromoCodes([]);
        }
      } catch (error) {
        setAvailablePromoCodes([]);
      }
    };

    fetchAvailablePromoCodes();
  }, [isLoggedIn, cartItems, cartTotal]);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'pro' | 'admin'; discount: number; professionalId?: string } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [availablePromoCodes, setAvailablePromoCodes] = useState<Array<{ 
    id: string; 
    code: string; 
    type: 'pro' | 'admin'; 
    discount: number;
    professional?: string;
    description?: string;
  }>>([]);

  // Address state
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [skipAddress, setSkipAddress] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Service type state - determines if address section should be shown
  const [hasInPersonService, setHasInPersonService] = useState(true); // Default to true (show address)

  // Payment method state
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [serviceFeeThreshold, setServiceFeeThreshold] = useState<number>(0);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  
  // Removed booking modal state - now using inline time slot selection
  
  // Time slot selection state - now per item with start/end time
  const [itemTimeSlots, setItemTimeSlots] = useState<{[itemId: string]: {
    date?: Date;
    time?: string; // Start time
    endTime?: string; // End time
    timeSlot?: string;
    showTimePicker?: boolean;
  }}>({});
  const [showTimeSection, setShowTimeSection] = useState(false);
  
  // Time validation errors
  const [timeValidationErrors, setTimeValidationErrors] = useState<{[itemId: string]: {
    startTimeError?: string;
    endTimeError?: string;
  }}>({});
  
  // Additional information state - per cart item
  const [showAdditionalInfoDialog, setShowAdditionalInfoDialog] = useState(false);
  const [additionalInfoPerItem, setAdditionalInfoPerItem] = useState<{[itemId: string]: {message: string; files: File[]}}>({});
  const additionalInfoFileInputRefs = useRef<{[itemId: string]: HTMLInputElement | null}>({});
  
  // Service availability data
  interface TimeBlock {
    id: string;
    from: string;
    to: string;
  }
  interface DayAvailability {
    enabled: boolean;
    blocks: TimeBlock[];
  }
  interface ServiceAvailability {
    [day: string]: DayAvailability;
  }
  const [serviceAvailabilities, setServiceAvailabilities] = useState<{[serviceId: string]: ServiceAvailability}>({});
  
  // Fetch service availability for each cart item
  useEffect(() => {
    const fetchServiceAvailabilities = async () => {
      if (!isLoggedIn || cartItems.length === 0) return;
      
      const newAvailabilities: {[serviceId: string]: ServiceAvailability} = {};
      
      for (const item of cartItems) {
        const serviceId = item.serviceId || item.id;
        if (serviceAvailabilities[serviceId]) continue; // Skip if already fetched
        
        try {
          const response = await fetch(resolveApiUrl(`/api/services/${serviceId}`), {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.service?.availability) {
              newAvailabilities[serviceId] = data.service.availability;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch availability for service ${serviceId}:`, error);
        }
      }
      
      if (Object.keys(newAvailabilities).length > 0) {
        setServiceAvailabilities(prev => ({ ...prev, ...newAvailabilities }));
      }
    };
    
    fetchServiceAvailabilities();
  }, [isLoggedIn, cartItems]);
  
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

  // Fetch service fee and threshold from payment settings
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
          setServiceFeeThreshold(data.serviceFeeThreshold || 0);
        }
      } catch (error) {
        console.error("Failed to fetch service fee:", error);
      }
    };
    
    fetchServiceFee();
  }, [isLoggedIn]);

  // Calculate actual service fee based on threshold
  const actualServiceFee = React.useMemo(() => {
    const subtotal = cartTotal;
    if (serviceFeeThreshold > 0 && subtotal >= serviceFeeThreshold) {
      return 0;
    }
    return serviceFee;
  }, [cartTotal, serviceFee, serviceFeeThreshold]);

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

  // Check service types to determine if address is needed
  useEffect(() => {
    const checkServiceTypes = async () => {
      if (!cartItems || cartItems.length === 0) {
        setHasInPersonService(true); // Default to showing address section
        return;
      }

      let foundInPersonService = false;
      
      for (const item of cartItems) {
        try {
          const serviceId = (item as any).serviceId || item.id;
          const response = await fetch(resolveApiUrl(`/api/services/${serviceId}`), {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            const serviceType = data?.service?.serviceType || "in-person";
            if (serviceType === "in-person") {
              foundInPersonService = true;
              break; // Found an in-person service, no need to check more
            }
          }
        } catch (error) {
          console.warn(`Failed to check service type for ${item.id}:`, error);
          // Assume in-person on error to be safe
          foundInPersonService = true;
          break;
        }
      }
      
      setHasInPersonService(foundInPersonService);
      
      // If all services are online, automatically skip address
      if (!foundInPersonService) {
        setSkipAddress(true);
      }
    };
    
    checkServiceTypes();
  }, [cartItems]);

  // Fetch payment methods (Stripe cards) - Made reusable
  const fetchPaymentMethods = async (selectNewCardId?: string) => {
    if (!isLoggedIn) return;
    
    try {
      setLoadingPaymentMethods(true);
      
      // Fetch both payment methods and PayPal availability
      const [methodsResponse, settingsResponse] = await Promise.all([
        fetch(resolveApiUrl("/api/payment-methods"), {
          credentials: "include",
        }),
        fetch(resolveApiUrl("/api/payment/publishable-key"), {
          credentials: "include",
        }),
      ]);
      
      let cards: PaymentMethod[] = [];
      let paypalEnabled = false;
      let stripeEnabled = false;
      
      // Parse settings response once
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        // Store publishable key for add card modal
        if (settingsData.publishableKey) {
          setPublishableKey(settingsData.publishableKey);
        }
        paypalEnabled = Boolean(settingsData.paypalEnabled);
        stripeEnabled = Boolean(settingsData.stripeEnabled);
        console.log('[Payment Methods] Payment settings:', {
          stripeEnabled,
          paypalEnabled,
          settings: settingsData
        });
      }
      
      // Parse methods response
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        cards = (methodsData.paymentMethods || []).map((pm: any) => ({
          id: pm.paymentMethodId || pm.id,
          type: "card" as const,
          cardNumber: `**** **** **** ${pm.last4 || '4242'}`,
          cardHolder: pm.billing_details?.name || "Card Holder",
          expiryDate: `${pm.card?.exp_month || 12}/${(pm.card?.exp_year || 2025) % 100}`,
          isDefault: pm.isDefault || false,
          brand: pm.card?.brand || 'visa', // Store card brand for accurate type detection
        }));
      }
      
      // Build payment methods list: Only show saved cards and PayPal if enabled
      const methods: PaymentMethod[] = [];
      
      // Add saved cards only (no generic card option)
      if (cards.length > 0) {
        methods.push(...cards);
      }
      
      // Add PayPal if enabled
      if (paypalEnabled) {
        methods.push({
          id: "paypal",
          type: "paypal",
          isDefault: false,
        });
      }
      
      console.log('[Payment Methods] Fetched methods:', {
        savedCardsCount: cards.length,
        stripeEnabled,
        paypalEnabled,
        totalMethods: methods.length,
        methods: methods.map(m => ({ id: m.id, type: m.type }))
      });
      
      setPaymentMethods(methods);
      
      // Set default payment method (first card or paypal, or newly added card)
      if (methods.length > 0) {
        // If a new card ID is provided, select it
        if (selectNewCardId && methods.find(m => m.id === selectNewCardId)) {
          setSelectedPayment(selectNewCardId);
        } else {
          // Prefer saved card, then PayPal
          const savedCard = methods.find(m => m.type === "card");
          const paypal = methods.find(m => m.type === "paypal");
          
          if (savedCard) {
            setSelectedPayment(savedCard.id);
          } else if (paypal) {
            setSelectedPayment(paypal.id);
          } else {
            setSelectedPayment(methods[0].id);
          }
        }
      } else {
        // No payment methods available
        setSelectedPayment("");
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      // Fallback: Try to show payment methods based on settings
      try {
        const settingsResponse = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
          credentials: "include",
        });
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          const paypalEnabled = Boolean(settingsData.paypalEnabled);
          const stripeEnabled = Boolean(settingsData.stripeEnabled);
          
          console.log('[Payment Methods] Fallback - Payment settings:', {
            stripeEnabled,
            paypalEnabled
          });
          
          const fallbackMethods: PaymentMethod[] = [];
          
          // Add card option if Stripe is enabled
          // Don't add generic card option - only show saved cards
          
          // Add PayPal if enabled
          if (paypalEnabled) {
            fallbackMethods.push({
              id: "paypal",
              type: "paypal",
              isDefault: false,
            });
          }
          
          setPaymentMethods(fallbackMethods);
          
          // Set default payment method
          if (fallbackMethods.length > 0) {
            const paypal = fallbackMethods.find(m => m.type === "paypal");
            const card = fallbackMethods.find(m => m.type === "card");
            setSelectedPayment(paypal ? paypal.id : (card ? card.id : fallbackMethods[0].id));
          } else {
            // No payment methods available
            setPaymentMethods([]);
            setSelectedPayment("");
          }
        } else {
          // Settings fetch failed, show empty state
          console.error('[Payment Methods] Failed to fetch payment settings');
          setPaymentMethods([]);
          setSelectedPayment("");
        }
      } catch (fallbackError) {
        console.error("Failed to fetch payment availability:", fallbackError);
        setPaymentMethods([]);
        setSelectedPayment("");
      }
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Fetch payment methods on mount
  useEffect(() => {
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

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    // Validate promo code via API
    try {
      // Fetch service details to get professional IDs for validation
      const serviceIds = cartItems.map(item => (item as any).serviceId || item.id).filter(Boolean);
      const servicePromises = serviceIds.map(serviceId => 
        fetch(resolveApiUrl(`/api/services/${serviceId}`), {
          credentials: "include",
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      );
      
      const serviceResponses = await Promise.all(servicePromises);
      const servicesWithOwners = serviceResponses
        .filter(res => res && res.service)
        .map(res => ({
          serviceId: res.service._id?.toString() || res.service.id,
          ownerId: res.service.professional?._id?.toString() || 
                   res.service.professional?.toString() || 
                   String(res.service.professional)
        }));
      
      const requestPayload = {
        code: promoCode,
        subtotal: subtotal,
        items: cartItems.map(item => {
          const serviceId = (item as any).serviceId || item.id;
          const serviceWithOwner = servicesWithOwners.find(s => s.serviceId === serviceId);
          return {
            id: item.id,
            serviceId: serviceId,
            ownerId: serviceWithOwner?.ownerId || undefined, // Include owner ID if available
          };
        }),
      };
      const response = await fetch(resolveApiUrl("/api/promo-codes/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = errorData.error || `HTTP ${response.status}: Invalid promo code`;
        console.error("[CartPage] Promo code validation failed:", {
          status: response.status,
          error: errorData,
          requestPayload
        });
        setPromoCodeError(errorMessage);
        setAppliedPromo(null);
        setDiscount(0);
        toast.error("Invalid promo code", {
          description: errorMessage
        });
        return;
      }

      const data = await response.json();
      if (data.valid && data.promoCode) {
        // For pro promo codes, verify that all services belong to the promo code owner
        if (data.promoCode.type === 'pro' && data.promoCode.professionalId) {
          try {
            // Fetch service details to get professional IDs
            const serviceIds = cartItems.map(item => (item as any).serviceId || item.id).filter(Boolean);
            const servicePromises = serviceIds.map(serviceId => 
              fetch(resolveApiUrl(`/api/services/${serviceId}`), {
                credentials: "include",
              }).then(res => res.ok ? res.json() : null).catch(() => null)
            );
            
            const serviceResponses = await Promise.all(servicePromises);
            const services = serviceResponses
              .filter(res => res && res.service)
              .map(res => res.service);
            
            // Check if all services belong to the promo code professional
            const promoProfessionalId = data.promoCode.professionalId;
            const allServicesBelongToPro = services.length > 0 && services.every(service => {
              const serviceProId = service.professional?._id?.toString() || 
                                  service.professional?.toString() || 
                                  String(service.professional);
              return serviceProId === promoProfessionalId;
            });
            
            if (!allServicesBelongToPro) {
              setPromoCodeError("This promo code can only be used for services from the professional who created it");
              setAppliedPromo(null);
              setDiscount(0);
              toast.error("Invalid promo code", {
                description: "This promo code is not applicable to the selected services"
              });
              return;
            }
          } catch (error) {
            console.error("[CartPage] Error validating service owners:", error);
            // Continue with promo code application if validation fails (trust backend)
          }
        }
        
        setAppliedPromo({
          code: data.promoCode.code,
          type: data.promoCode.type,
          discount: data.promoCode.discount,
          professionalId: data.promoCode.professionalId, // Store for reference
        });
        setDiscount(data.promoCode.discount);
        setPromoCodeError(null);
        toast.success("Promo code applied!", {
          description: `You saved £${data.promoCode.discount.toFixed(2)} on your order`
        });
      } else {
        setPromoCodeError("Invalid promo code");
        setAppliedPromo(null);
        setDiscount(0);
        toast.error("Invalid promo code", {
          description: "Please check and try again"
        });
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      setPromoCodeError("Failed to validate promo code");
      setAppliedPromo(null);
      setDiscount(0);
      toast.error("Failed to apply promo code", {
        description: "Please try again later"
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setPromoCode("");
    setPromoCodeError(null);
    toast.info("Promo code removed");
  };

  const handleOpenChangeAddress = (addressId: string) => {
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setEditingAddressId(addressId);
      setNewAddress({
        postcode: address.postcode || "",
        address: address.address || "",
        city: address.city || "",
        county: address.county || "",
        phone: address.phone || ""
      });
      setShowAddressDialog(true);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.postcode || !newAddress.address || !newAddress.city || !newAddress.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingAddressId) {
        // Update existing address
        const addressToUpdate = addresses.find(addr => addr.id === editingAddressId);
        const updateData = {
          postcode: newAddress.postcode,
          address: newAddress.address,
          city: newAddress.city,
          county: newAddress.county || "",
          phone: newAddress.phone,
          isDefault: addressToUpdate?.isDefault || false,
        };

        const response = await fetch(resolveApiUrl(`/api/auth/profile/addresses/${editingAddressId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update address");
        }

        const data = await response.json();
        const updatedAddress: Address = {
          id: data.address?.id || editingAddressId,
          postcode: data.address?.postcode || updateData.postcode,
          address: data.address?.address || updateData.address,
          city: data.address?.city || updateData.city,
          county: data.address?.county || updateData.county,
          phone: data.address?.phone || updateData.phone,
          isDefault: data.address?.isDefault || updateData.isDefault,
        };

        // Update local state
        const updatedAddresses = addresses.map(addr => 
          addr.id === editingAddressId ? updatedAddress : addr
        );
        setAddresses(updatedAddresses);
        setSelectedAddress(updatedAddress.id);
        setShowAddressDialog(false);
        setEditingAddressId(null);
        setNewAddress({
          postcode: "",
          address: "",
          city: "",
          county: "",
          phone: ""
        });
        toast.success("Address updated successfully!");
      } else {
        // Add new address (shouldn't happen in checkout, but keep for safety)
        const newAddressData = {
          postcode: newAddress.postcode,
          address: newAddress.address,
          city: newAddress.city,
          county: newAddress.county || "",
          phone: newAddress.phone,
          isDefault: addresses.length === 0,
        };

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
      }
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

  // ===== Time Slot Helper Functions (from BookingModal) =====
  
  // Get day name from date (lowercase, e.g., "monday")
  const getDayName = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Get time slot (Morning, Afternoon, Evening) for a time
  const getTimeSlot = (time: string): string => {
    const [hour] = time.split(':').map(Number);
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };
  
  // Get availability time range for a specific item and date
  const getAvailabilityRange = (itemId: string, date: Date): { minTime: string; maxTime: string } | null => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return null;
    
    const serviceId = item.serviceId || item.id;
    const availability = serviceAvailabilities[serviceId];
    
    if (!availability) {
      // Default availability if not loaded
      return { minTime: "09:00", maxTime: "17:00" };
    }
    
    const dayName = getDayName(date);
    const dayAvailability = availability[dayName];
    
    if (!dayAvailability || !dayAvailability.enabled || dayAvailability.blocks.length === 0) {
      return null;
    }
    
    // Find the overall min and max times from all blocks
    let minTime = "23:59";
    let maxTime = "00:00";
    
    dayAvailability.blocks.forEach(block => {
      if (block.from < minTime) minTime = block.from;
      if (block.to > maxTime) maxTime = block.to;
    });
    
    return { minTime, maxTime };
  };

  // Get availability blocks for a selected date
  const getAvailabilityBlocks = (itemId: string, date: Date): TimeBlock[] => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item || !date) return [];
    
    const serviceId = item.serviceId || item.id;
    const availability = serviceAvailabilities[serviceId];
    
    if (!availability) return [];
    
    const dayName = getDayName(date);
    const dayAvailability = availability[dayName];
    
    if (!dayAvailability || !dayAvailability.enabled || dayAvailability.blocks.length === 0) {
      return [];
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // For same-day booking, filter out blocks that are in the past or too soon
    if (isToday) {
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      const minTimeMinutes = currentTimeMinutes + 120; // Add 2 hours buffer
      
      return dayAvailability.blocks.filter(block => {
        const [toHour, toMin] = block.to.split(':').map(Number);
        const toMinutes = toHour * 60 + toMin;
        // Only show blocks that haven't ended yet (with 2 hour buffer)
        return toMinutes > minTimeMinutes;
      });
    }
    
    return dayAvailability.blocks;
  };
  
  // Generate time options for dropdown (every 30 minutes)
  const generateTimeOptions = (minTime: string, maxTime: string, isEndTime: boolean = false): string[] => {
    const options: string[] = [];
    const [minHour, minMin] = minTime.split(':').map(Number);
    const [maxHour, maxMin] = maxTime.split(':').map(Number);
    
    const minMinutes = minHour * 60 + minMin;
    const maxMinutes = maxHour * 60 + maxMin;
    
    // For end time, start from 30 mins after min; for start time, include min
    const startMinutes = isEndTime ? minMinutes + 30 : minMinutes;
    
    for (let minutes = startMinutes; minutes <= maxMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      options.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
    
    return options;
  };
  
  // Check if a date is available based on service availability
  const isDateAvailable = (itemId: string, date: Date): boolean => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return false;
    
    const serviceId = item.serviceId || item.id;
    const availability = serviceAvailabilities[serviceId];
    
    // If no availability data, allow all dates (fallback)
    if (!availability) return true;
    
    const dayName = getDayName(date);
    const dayAvailability = availability[dayName];
    
    return dayAvailability?.enabled && dayAvailability?.blocks?.length > 0;
  };

  // Handle date selection - only set date, let user choose time separately
  const handleDateSelect = (itemId: string, date: Date | undefined) => {
    if (!date) {
      setItemTimeSlots(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          date: undefined,
          time: "",
          endTime: "",
          timeSlot: "",
          showTimePicker: false
        }
      }));
      return;
    }
    
    // Only set the date, don't auto-fill time - user must select time manually
    setItemTimeSlots(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        date,
        time: "", // Empty - user must select
        endTime: "", // Empty - user must select
        timeSlot: "",
        showTimePicker: true
      }
    }));
  };

  // Handle start time change with validation
  const handleStartTimeChange = (itemId: string, time: string) => {
    const currentSlot = itemTimeSlots[itemId] || {};
    const date = currentSlot.date;
    
    // Clear any previous error
    setTimeValidationErrors(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], startTimeError: undefined }
    }));
    
    // Validate against availability range
    if (date) {
      const range = getAvailabilityRange(itemId, date);
      if (range) {
        // Start time must be >= minTime
        if (time < range.minTime) {
          setTimeValidationErrors(prev => ({
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              startTimeError: `Start time must be at or after ${range.minTime}` 
            }
          }));
          return; // Don't update if invalid
        }
        // Start time must be < maxTime (not equal, to leave room for end time)
        if (time >= range.maxTime) {
          setTimeValidationErrors(prev => ({
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              startTimeError: `Start time must be before ${range.maxTime}` 
            }
          }));
          return; // Don't update if invalid
        }
      }
    }
    
    setItemTimeSlots(prev => {
      // If end time is set and is before or equal to new start time, clear it
      let endTime = currentSlot.endTime || "";
      if (endTime && endTime <= time) {
        endTime = ""; // Clear end time so user must re-select
        // Clear end time error as well
        setTimeValidationErrors(prevErrors => ({
          ...prevErrors,
          [itemId]: { ...prevErrors[itemId], endTimeError: undefined }
        }));
      }
      return {
        ...prev,
        [itemId]: {
          ...currentSlot,
          time,
          endTime,
          timeSlot: getTimeSlot(time)
        }
      };
    });
  };
  
  // Handle time block selection - directly set both start and end time
  const handleTimeBlockSelect = (itemId: string, block: TimeBlock) => {
    const currentSlot = itemTimeSlots[itemId] || {};
    const date = currentSlot.date;
    
    if (!date) {
      toast.error("Please select a date first");
      return;
    }
    
    // Clear any previous errors
    setTimeValidationErrors(prev => ({
      ...prev,
      [itemId]: { startTimeError: undefined, endTimeError: undefined }
    }));
    
    // Directly set both times from the block
    setItemTimeSlots(prev => ({
      ...prev,
      [itemId]: {
        ...currentSlot,
        time: block.from,
        endTime: block.to,
        timeSlot: getTimeSlot(block.from)
      }
    }));
    
    toast.success(`Time slot selected: ${block.from} - ${block.to}`);
  };

  // Handle end time change with validation
  const handleEndTimeChange = (itemId: string, endTime: string) => {
    const currentSlot = itemTimeSlots[itemId] || {};
    const date = currentSlot.date;
    const startTime = currentSlot.time || "";
    
    // Clear any previous error
    setTimeValidationErrors(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], endTimeError: undefined }
    }));
    
    // Validate against availability range and start time
    if (date) {
      const range = getAvailabilityRange(itemId, date);
      if (range) {
        // End time must be <= maxTime
        if (endTime > range.maxTime) {
          setTimeValidationErrors(prev => ({
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              endTimeError: `End time must be at or before ${range.maxTime}` 
            }
          }));
          return; // Don't update if invalid
        }
        // End time must be < minTime is not possible if start time is valid
        if (endTime < range.minTime) {
          setTimeValidationErrors(prev => ({
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              endTimeError: `End time must be at or after ${range.minTime}` 
            }
          }));
          return; // Don't update if invalid
        }
        if (startTime && endTime <= startTime) {
          // End time must be after start time
          setTimeValidationErrors(prev => ({
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              endTimeError: `End time must be after start time (${startTime})` 
            }
          }));
          return; // Don't update if invalid
        }
      }
    }
    
    setItemTimeSlots(prev => ({
      ...prev,
      [itemId]: {
        ...currentSlot,
        endTime,
      }
    }));
  };
  
  const handleBackToCalendar = (itemId: string) => {
    setItemTimeSlots(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        time: "",
        endTime: "",
        timeSlot: "",
        showTimePicker: false
      }
    }));
  };

  // Check which services need booking (have availability data)
  const checkServicesNeedingBooking = async () => {
    const servicesToCheck: Array<{ item: any; serviceId: string; availability: any; deliveryType?: "same-day" | "standard"; serviceType?: "in-person" | "online" }> = [];
    
    for (const item of cartItems) {
      // Skip if item already has booking info
      if (item.booking) {
        continue;
      }
      
      try {
        
        // Check if item.id is a MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.id);
        
        // If it's a numeric ID (like 17629339), we can't directly find the service
        // In this case, skip the booking check (the service might not need booking or was added with old format)
        if (!isObjectId && /^\d+$/.test(item.id)) {
          continue;
        }
        
        // Fetch service details to check availability
        // Try both ObjectId and slug formats
        const serviceUrl = resolveApiUrl(`/api/services/${item.id}`);
        
        const response = await fetch(serviceUrl, {
          credentials: "include",
        });
        
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
        
        // Check if service is in-person and has availability data
        const serviceType = serviceData?.service?.serviceType || "in-person";
        if (serviceType === "online") {
        } else if (serviceData?.service?.availability && Object.keys(serviceData.service.availability).length > 0) {
          servicesToCheck.push({
            item,
            serviceId: serviceData.service._id?.toString() || serviceData.service.id || item.id,
            availability: serviceData.service.availability,
            deliveryType: serviceData.service.deliveryType || "standard",
            serviceType: serviceType,
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
    
    return servicesToCheck;
  };

  // Removed handleBookingConfirm - booking is now handled directly in handlePlaceOrder

  const proceedWithOrder = async (serviceTypeChecks?: Array<{ item: any; isOnline: boolean }>) => {
    // Check if account balance is 0
    if (walletBalance === 0 || walletBalance <= 0) {
      toast.error("Please top up account balance first.");
      return;
    }

    // Only require address for in-person services
    if (hasInPersonService && !selectedAddress) {
      console.error('[Order] No address selected for in-person service');
      toast.error("Please select a service location");
      return;
    }

    // Get selected address details (only for in-person services)
    const addressDetails = hasInPersonService 
      ? addresses.find(addr => addr.id === selectedAddress)
      : undefined;

    const subtotal = cartTotal;
    const orderTotal = subtotal - discount + actualServiceFee;
    
    // Calculate wallet deduction and remainder payment
    const walletAmount = Math.min(walletBalance, orderTotal);
    const remainderAmount = Math.max(0, orderTotal - walletBalance);
    
    // Only require payment method if remainder > 0
    if (remainderAmount > 0 && !selectedPayment) {
      console.error('[Order] No payment method selected');
      toast.error("Please select a payment method");
      return;
    }
    
    
    // Build order requests for each item with their individual time slots
    // For online services, no booking/time slot is needed
    const orderRequests = cartItems.map((item, index) => {
      const timeSlot = itemTimeSlots[item.id];
      const itemSubtotal = (item.price + (item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0)) * item.quantity;
      
      // Find if this item is online from serviceTypeChecks
      const serviceTypeCheck = serviceTypeChecks?.find(check => check.item.id === item.id);
      const isItemOnline = serviceTypeCheck?.isOnline || false;
      
      // Format date for booking - only for in-person services
      let bookingInfo: { date: string; time: string; endTime?: string; timeSlot: string } | undefined = undefined;
      // Only include booking info if service is in-person and time slot is selected
      if (!isItemOnline && timeSlot && timeSlot.date && timeSlot.time) {
        const dateStr = timeSlot.date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).split('/').reverse().join('-');
        
        bookingInfo = {
          date: dateStr,
          time: timeSlot.time,
          endTime: timeSlot.endTime || '',
          timeSlot: timeSlot.timeSlot || '',
        };
      }
      
      // Apply total discount to the first item only
      const itemDiscount = index === 0 ? discount : 0;
      
      return {
        item: {
          id: item.id,
          serviceId: item.serviceId || item.id,
          title: item.title,
          seller: item.seller,
          price: item.price,
          image: item.image,
          rating: item.rating,
          quantity: item.quantity,
          addons: item.addons || [],
          packageType: item.packageType,
        },
        booking: bookingInfo,
        subtotal: itemSubtotal,
        discount: itemDiscount, // Apply total discount to first item
        additionalInformation: undefined, // Will be set after file uploads
      };
    });
    
    try {
      // Determine payment method type for remainder (only card or paypal)
      let paymentMethodType = "card"; // Default to card
      let paymentMethodId = undefined;
      
      if (selectedPayment === "paypal") {
        paymentMethodType = "paypal";
      } else {
        // Find selected card
        const selectedMethod = paymentMethods.find(m => m.id === selectedPayment && m.type === "card");
        if (selectedMethod) {
          paymentMethodType = "card";
          paymentMethodId = selectedMethod.id;
        } else {
          // If no valid card selected, show error
          if (remainderAmount > 0) {
            toast.error("Please select a valid payment method");
            return;
          }
        }
      }
      
      // If remainder is 0, wallet covers full amount, no payment method needed
      // If remainder > 0, validate payment method is selected and valid
      if (remainderAmount > 0) {
        if (!selectedPayment) {
          toast.error("Please select a payment method");
          return;
        }
        if (paymentMethodType === "card" && !paymentMethodId) {
          toast.error("Please select a valid payment card");
          return;
        }
      }
      
      // If remainder is 0, set payment method to account_balance (will be handled by backend)
      if (remainderAmount === 0) {
        paymentMethodType = "account_balance";
        paymentMethodId = undefined;
      }
      
      // Upload files and prepare additional information per item
      for (let i = 0; i < orderRequests.length; i++) {
        const item = cartItems[i];
        const itemInfo = additionalInfoPerItem[item.id];
        
        if (itemInfo && (itemInfo.message?.trim() || itemInfo.files.length > 0)) {
          let uploadedFiles: Array<{url: string, fileName: string, fileType: string}> = [];
          
          // Upload files for this item
          if (itemInfo.files.length > 0) {
            try {
              for (const file of itemInfo.files) {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadResponse = await fetch(resolveApiUrl("/api/orders/upload-attachment"), {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                });
                
                if (uploadResponse.ok) {
                  const uploadData = await uploadResponse.json();
                  uploadedFiles.push({
                    url: uploadData.url,
                    fileName: uploadData.fileName,
                    fileType: uploadData.fileType
                  });
                } else {
                  const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
                  console.error(`Failed to upload file: ${file.name}`, errorData);
                  toast.error(`Failed to upload ${file.name}. ${errorData.error || 'Please try again.'}`);
                }
              }
            } catch (error: any) {
              console.error('File upload error:', error);
              toast.error("Failed to upload some files. Please try again.");
            }
          }
          
          // Set additional information for this order
          orderRequests[i].additionalInformation = {
            message: itemInfo.message?.trim() || '',
            files: uploadedFiles,
          };
        }
      }

      // Create bulk orders
      const response = await fetch(resolveApiUrl("/api/orders/bulk"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orders: orderRequests,
          paymentMethod: paymentMethodType,
          paymentMethodId: paymentMethodId,
          totalAmount: orderTotal,
          walletAmount: walletAmount,
          remainderAmount: remainderAmount,
          address: addressDetails,
          skipAddress: skipAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Order] Bulk order creation failed:', error);
        throw new Error(error.error || "Failed to place orders");
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
      
      // Refresh orders to show new orders in account page
      if (refreshOrders) {
        await refreshOrders();
      }
      
      // Clear cart
      clearCart();
      
      // Navigate to thank you page with all order IDs
      const orderIds = result.orderIds?.join(',') || '';
      navigate(`/thank-you?orderIds=${orderIds}`, { replace: true });
      
      toast.success(`${result.orders?.length || 1} order(s) placed successfully!`, {
        description: `£${orderTotal.toFixed(2)} total. Check your account for order details.`
      });
    } catch (error: any) {
      console.error('[Order] Error:', error);
      toast.error(error.message || "Failed to place order. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    
    // Helper function to check if a service is online
    const isServiceOnline = async (item: any): Promise<boolean> => {
      try {
        const serviceId = (item as any).serviceId || item.id;
        const response = await fetch(resolveApiUrl(`/api/services/${serviceId}`), {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          const serviceType = data?.service?.serviceType || "in-person";
          return serviceType === "online";
        }
      } catch (error) {
        console.warn(`Failed to check service type for ${item.id}:`, error);
      }
      // Default to in-person if check fails
      return false;
    };
    
    // Check service types for all items first
    const serviceTypeChecks = await Promise.all(
      cartItems.map(async (item) => ({
        item,
        isOnline: await isServiceOnline(item)
      }))
    );
    
    // Check each in-person item has a time slot selected (date, start time, and end time)
    // Online services don't need time slots
    const missingTimeSlots = serviceTypeChecks
      .filter(({ item, isOnline }) => !isOnline)
      .map(({ item }) => item)
      .filter(item => {
        const timeSlot = itemTimeSlots[item.id];
        return !timeSlot || !timeSlot.date || !timeSlot.time || !timeSlot.endTime;
      });
    
    if (missingTimeSlots.length > 0) {
      toast.error(`Please select date and time range for all in-person services (${missingTimeSlots.length} item${missingTimeSlots.length > 1 ? 's' : ''} missing)`);
      setShowTimeSection(true);
      return;
    }
    
    // Validate time slots are within availability ranges (only for in-person services)
    const invalidTimeSlots: string[] = [];
    serviceTypeChecks
      .filter(({ isOnline }) => !isOnline)
      .forEach(({ item }) => {
        const timeSlot = itemTimeSlots[item.id];
        if (timeSlot?.date && timeSlot?.time && timeSlot?.endTime) {
          const range = getAvailabilityRange(item.id, timeSlot.date);
          if (range) {
            // Start time must be >= minTime and < maxTime
            if (timeSlot.time < range.minTime) {
              invalidTimeSlots.push(`${item.title}: Start time is before minimum time (${range.minTime})`);
            }
            if (timeSlot.time >= range.maxTime) {
              invalidTimeSlots.push(`${item.title}: Start time is at or after maximum time (${range.maxTime})`);
            }
            // End time must be > startTime and <= maxTime
            if (timeSlot.endTime <= timeSlot.time) {
              invalidTimeSlots.push(`${item.title}: End time must be after start time`);
            }
            if (timeSlot.endTime > range.maxTime) {
              invalidTimeSlots.push(`${item.title}: End time exceeds maximum time (${range.maxTime})`);
            }
            if (timeSlot.endTime < range.minTime) {
              invalidTimeSlots.push(`${item.title}: End time is before minimum time (${range.minTime})`);
            }
          }
        }
      });
    
    if (invalidTimeSlots.length > 0) {
      toast.error("Invalid time slots detected", {
        description: invalidTimeSlots.join('; ')
      });
      setShowTimeSection(true);
      return;
    }
    
    
    // Proceed with creating multiple orders
    proceedWithOrder(serviceTypeChecks);
  };

    const subtotal = cartTotal;
    const total = subtotal - discount + actualServiceFee;
    
    // Calculate wallet deduction and remainder payment for display
    const walletAmount = Math.min(walletBalance, total);
    const remainderAmount = Math.max(0, total - walletBalance);

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

      {/* Add Card Modal */}
      {publishableKey && (
        <PaymentMethodModal
          isOpen={showAddCardModal}
          onClose={() => setShowAddCardModal(false)}
          onSuccess={async () => {
            // Fetch payment methods again to get the newly added card
            const response = await fetch(resolveApiUrl("/api/payment-methods"), {
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              const newCards = (data.paymentMethods || []).map((pm: any) => ({
                id: pm.paymentMethodId || pm.id,
                type: "card" as const,
                cardNumber: `**** **** **** ${pm.last4 || '4242'}`,
                cardHolder: pm.billing_details?.name || "Card Holder",
                expiryDate: `${pm.card?.exp_month || 12}/${(pm.card?.exp_year || 2025) % 100}`,
                isDefault: pm.isDefault || false,
                brand: pm.card?.brand || 'visa',
              }));
              
              // Find the most recently added card by comparing with existing cards
              const existingCardIds = paymentMethods.filter(m => m.type === "card").map(m => m.id);
              const newCard = newCards.find(card => !existingCardIds.includes(card.id));
              
              // Refresh payment methods and select the new card
              if (newCard) {
                await fetchPaymentMethods(newCard.id);
              } else {
                // If we can't find a new card, just refresh and select the first card
                await fetchPaymentMethods();
              }
            } else {
              // If fetch fails, just refresh without selecting
              await fetchPaymentMethods();
            }
          }}
          publishableKey={publishableKey}
        />
      )}
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
              subtotal={cartTotal}
              discount={discount}
              serviceFee={actualServiceFee}
              serviceFeeThreshold={serviceFeeThreshold}
              total={total}
              walletBalance={walletBalance}
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
              
              {/* Step 1: Delivery Address - Minimalist Modern (Only show for in-person services) */}
              {hasInPersonService && (
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
                        Address
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
                    {/* Change Address Dialog */}
                    <Dialog open={showAddressDialog} onOpenChange={(open) => {
                      setShowAddressDialog(open);
                      if (!open) {
                        setEditingAddressId(null);
                        setNewAddress({
                          postcode: "",
                          address: "",
                          city: "",
                          county: "",
                          phone: ""
                        });
                      }
                    }}>
                      <DialogContent className="w-full">
                        <DialogHeader>
                          <DialogTitle className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
                            {editingAddressId ? "Change Address" : "Add New Address"}
                          </DialogTitle>
                          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            {editingAddressId ? "Update your delivery address details" : "Enter your delivery address details"}
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
                                  onClick={handleSaveAddress}
                                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                                >
                                  {editingAddressId ? "Update Address" : "Save Address"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddressDialog(false);
                                    setEditingAddressId(null);
                                    setNewAddress({
                                      postcode: "",
                                      address: "",
                                      city: "",
                                      county: "",
                                      phone: ""
                                    });
                                  }}
                                  className="flex-1 font-['Poppins',sans-serif]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                    {/* Address List */}
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
                              No addresses saved. Please add an address using the button above.
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
                                  <div className="flex items-center gap-2 shrink-0">
                                    {selectedAddress === address.id && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenChangeAddress(address.id);
                                        }}
                                        className="px-3 py-1.5 md:px-4 md:py-2 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-lg transition-colors flex items-center gap-1.5 md:gap-2 shadow-md hover:shadow-lg font-['Poppins',sans-serif] text-[12px] md:text-[13px]"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        <span className="hidden md:inline">Change</span>
                                      </button>
                                    )}
                                    {!address.isDefault && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveAddress(address.id);
                                        }}
                                        className="p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          </RadioGroup>
                        )}
                  </div>
                </div>
              </div>
              )}

              {/* Step: Payment Method */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Toggle */}
                <button
                  onClick={() => setShowPaymentSection(!showPaymentSection)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-[#3B82F6] rounded-full flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">{hasInPersonService ? '2' : '1'}</span>
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
                    {loadingPaymentMethods ? (
                      <div className="text-center py-4">
                        <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b]">
                          Loading payment methods...
                        </p>
                      </div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-3">
                          No payment methods available. Please add a payment method.
                        </p>
                        <Button 
                          variant="outline" 
                          className="border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 font-['Poppins',sans-serif] text-[13px] md:text-[14px]"
                          onClick={() => navigate('/account?tab=billing&section=fund')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    ) : (
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
                                  {method.type === "card" && (
                                    <div className="flex items-center gap-2 md:gap-3">
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
                                        <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">
                                          <span className="hidden md:inline">{method.cardHolder} • </span>Exp. {method.expiryDate}
                                        </p>
                                      </div>
                                    </div>
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
                                </Label>
                              </div>
                              {method.type === "card" && selectedPayment === method.id && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowAddCardModal(true);
                                    }}
                                    className="px-3 py-1.5 md:px-4 md:py-2 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-lg transition-colors flex items-center gap-1.5 md:gap-2 shadow-md hover:shadow-lg font-['Poppins',sans-serif] text-[12px] md:text-[13px]"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span className="hidden md:inline">Change</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      </RadioGroup>
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

              {/* Step: Choose Time Slot for Each Service - Only show for in-person services */}
              {hasInPersonService && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Toggle */}
                <button
                  onClick={() => setShowTimeSection(!showTimeSection)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-[#10B981] rounded-full flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">3</span>
                      </div>
                      <h2 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium text-left">
                        Time Slot
                      </h2>
                      {/* Show completion status */}
                      <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                        ({Object.values(itemTimeSlots).filter(slot => slot.date && slot.time).length}/{cartItems.length} selected)
                      </span>
                    </div>
                    {/* Toggle Icon */}
                    <div>
                      {showTimeSection ? (
                        <ChevronUp className="w-5 h-5 text-[#6b6b6b]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Collapsible Content */}
                <div className={`${showTimeSection ? 'block' : 'hidden'}`}>
                  <div className="p-4 md:p-6">
                    {/* Info message */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-blue-700">
                        📅 Each service will be created as a separate order. Please select date and time for each.
                      </p>
                    </div>
                    
                    {/* Time Slot Picker for Each Item */}
                    <div className="space-y-4">
                      {cartItems.map((item) => {
                        const currentSlot = itemTimeSlots[item.id] || {};
                        const showPicker = currentSlot.showTimePicker;
                        
                        return (
                          <div key={item.id} className="border-2 border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50">
                            {/* Item Header */}
                            <div className="mb-3 pb-3 border-b border-gray-200">
                              <div className="flex gap-3 items-center">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                  {item.image ? (
                                    <img src={resolveMediaUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-semibold truncate">
                                    {item.title} ({item.quantity} × £{item.price.toFixed(2)})
                                  </h4>
                                </div>
                                {currentSlot.date && currentSlot.time && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                )}
                              </div>
                            </div>
                            
                            {/* Selected Time Display or Picker */}
                            {currentSlot.date && currentSlot.time && currentSlot.endTime ? (
                              // Show selected time range with edit button
                              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                    <p className="font-['Poppins',sans-serif] text-[13px] text-green-700 font-medium">
                                      {currentSlot.date.toLocaleDateString('en-GB', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })} • {currentSlot.time} - {currentSlot.endTime}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setItemTimeSlots(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], date: undefined, time: undefined, endTime: undefined, showTimePicker: false }
                                    }))}
                                    className="text-green-600 hover:text-green-700 font-['Poppins',sans-serif] text-[12px] font-medium"
                                  >
                                    Change
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Show Calendar and Time Range Picker side by side
                              <div className="flex flex-col lg:flex-row gap-4">
                                {/* Calendar Section */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-[#FE8A0F] rounded-full flex items-center justify-center">
                                      <Calendar className="w-3 h-3 text-white" />
                                    </div>
                                    <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                                      Select Date
                                    </h4>
                                  </div>
                                  <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex justify-center">
                                    <CalendarComponent
                                      mode="single"
                                      selected={currentSlot.date}
                                      onSelect={(date) => handleDateSelect(item.id, date)}
                                      disabled={(date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        
                                        // If date is before today, disable it
                                        if (date < today) return true;
                                        
                                        // If date is today, check if current time is past 6 AM
                                        const now = new Date();
                                        const isToday = date.getTime() === today.getTime();
                                        if (isToday) {
                                          const currentHour = now.getHours();
                                          // If current time is 6 AM or later, disable today
                                          if (currentHour >= 6) return true;
                                        }
                                        
                                        // Check if date is available based on service availability
                                        return !isDateAvailable(item.id, date);
                                      }}
                                      className="font-['Poppins',sans-serif]"
                                      modifiers={{
                                        available: (date) => {
                                          const today = new Date();
                                          today.setHours(0, 0, 0, 0);
                                          
                                          // If date is before today, it's not available
                                          if (date < today) return false;
                                          
                                          // If date is today, check if current time is before 6 AM
                                          const now = new Date();
                                          const isToday = date.getTime() === today.getTime();
                                          if (isToday) {
                                            const currentHour = now.getHours();
                                            // If current time is 6 AM or later, today is not available
                                            if (currentHour >= 6) return false;
                                          }
                                          
                                          return isDateAvailable(item.id, date);
                                        }
                                      }}
                                      modifiersClassNames={{
                                        available: "bg-green-50 text-green-700 hover:bg-green-100"
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Time Range Picker Section - Always visible */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center">
                                      <Clock className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                                        Select Time
                                      </h4>
                                      {currentSlot.date && (
                                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                                          {currentSlot.date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    {!currentSlot.date ? (
                                      // Placeholder when no date selected
                                      <div className="text-center py-6">
                                        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                          Please select a date first
                                        </p>
                                      </div>
                                    ) : (
                                      // Time Block Buttons - Display availability blocks directly
                                      <div className="space-y-4">
                                        <div>
                                          <label className="block font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-3">
                                            Select Time Block
                                          </label>
                                          {(() => {
                                            const blocks = getAvailabilityBlocks(item.id, currentSlot.date);
                                            if (blocks.length === 0) {
                                              return (
                                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                                    No available time blocks for this date
                                                  </p>
                                                </div>
                                              );
                                            }
                                            return (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {blocks.map((block, index) => {
                                                  const isSelected = currentSlot.time === block.from && currentSlot.endTime === block.to;
                                                  return (
                                                    <button
                                                      key={`${block.from}-${block.to}-${index}`}
                                                      type="button"
                                                      onClick={() => handleTimeBlockSelect(item.id, block)}
                                                      className={`
                                                        py-3 px-4 rounded-lg border-2 transition-all font-['Poppins',sans-serif] text-[14px] text-center
                                                        ${isSelected
                                                          ? 'border-[#3B82F6] bg-blue-50 text-[#3B82F6] font-medium shadow-sm' 
                                                          : 'border-gray-200 bg-white hover:border-[#3B82F6] hover:bg-blue-50 text-[#2c353f] cursor-pointer'
                                                        }
                                                      `}
                                                    >
                                                      {block.from} - {block.to}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                          {(timeValidationErrors[item.id]?.startTimeError || timeValidationErrors[item.id]?.endTimeError) && (
                                            <div className="mt-2 space-y-1">
                                              {timeValidationErrors[item.id]?.startTimeError && (
                                                <p className="font-['Poppins',sans-serif] text-[12px] text-red-700 flex items-center gap-1.5">
                                                  <AlertTriangle className="w-3.5 h-3.5" />
                                                  {timeValidationErrors[item.id].startTimeError}
                                                </p>
                                              )}
                                              {timeValidationErrors[item.id]?.endTimeError && (
                                                <p className="font-['Poppins',sans-serif] text-[12px] text-red-700 flex items-center gap-1.5">
                                                  <AlertTriangle className="w-3.5 h-3.5" />
                                                  {timeValidationErrors[item.id].endTimeError}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Selected Time Range Display */}
                                        {currentSlot.time && currentSlot.endTime && (
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="font-['Poppins',sans-serif] text-[13px] text-green-700">
                                              <span className="font-medium">Selected:</span> {currentSlot.time} - {currentSlot.endTime}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Step 4: Cart Items */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Toggle */}
                <button
                  onClick={() => setShowItemsSection(!showItemsSection)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-[#FE8A0F] rounded-full flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">{hasInPersonService ? '4' : '2'}</span>
                      </div>
                      <h2 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium text-left">
                        Cart Items
                      </h2>
                      <Badge className="bg-gray-100 text-[#2c353f] text-[11px] md:text-[12px]">{cartItems.length} items</Badge>
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
                          {/* Service Image/Video - Minimalist */}
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {item.thumbnailVideo && item.thumbnailVideo.url ? (
                              <VideoThumbnail
                                videoUrl={item.thumbnailVideo.url}
                                thumbnail={item.thumbnailVideo.thumbnail}
                                fallbackImage={item.image}
                                className="w-full h-full"
                              />
                            ) : item.image ? (
                              <img
                                src={resolveMediaUrl(item.image)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
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
                                  })} • {item.booking.time}{item.booking.endTime ? ` - ${item.booking.endTime}` : ''}
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
              <div className="lg:sticky lg:top-24 space-y-4 md:space-y-5">
                {/* Price Details */}
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
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
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoCodeError(null);
                        }}
                        className={`flex-1 font-['Poppins',sans-serif] text-[14px] rounded-xl ${
                          promoCodeError ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      <Button
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim()}
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
                          {appliedPromo.code} Applied - £{appliedPromo.discount.toFixed(2)} off
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
                  {promoCodeError && (
                    <p className="font-['Poppins',sans-serif] text-[11px] text-red-500 mt-2">
                      {promoCodeError}
                    </p>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Modern Invoice-Style Breakdown */}
                <div className="mb-6">
                  {/* Single Invoice Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Item-by-item breakdown */}
                      {cartItems.map((item, index) => (
                        <div key={item.id + index} className={index > 0 ? 'pt-3 border-t border-gray-300' : ''}>
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-semibold">
                              Service {index + 1} ({item.quantity} × £{item.price.toFixed(2)})
                            </p>
                            <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                              £{((item.price + (item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0)) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {item.addons && item.addons.length > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                  Addons
                                </span>
                                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                                  £{item.addons.reduce((sum, addon) => sum + addon.price, 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                            {(item.booking || (itemTimeSlots[item.id]?.date && itemTimeSlots[item.id]?.time)) && (
                              <div className="flex justify-between items-center bg-blue-50 -mx-2 px-2 py-1.5 rounded">
                                <span className="font-['Poppins',sans-serif] text-[12px] text-[#3B82F6] font-medium">
                                  Delivered by
                                </span>
                                <span className="font-['Poppins',sans-serif] text-[12px] text-[#3B82F6] font-semibold">
                                  {item.booking ? (
                                    <>
                                      {new Date(item.booking.date).toLocaleDateString('en-GB', { 
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })} • {item.booking.time}{item.booking.endTime ? ` - ${item.booking.endTime}` : ''}
                                    </>
                                  ) : itemTimeSlots[item.id]?.date ? (
                                    <>
                                      {itemTimeSlots[item.id].date!.toLocaleDateString('en-GB', { 
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })} • {itemTimeSlots[item.id]?.time}{itemTimeSlots[item.id]?.endTime ? ` - ${itemTimeSlots[item.id]?.endTime}` : ''}
                                    </>
                                  ) : null}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Discount if applied */}
                      {discount > 0 && appliedPromo && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-green-600 flex items-center gap-1 font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            Discount ({appliedPromo.code})
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[15px] text-green-600 font-semibold">
                            -£{discount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Service Fee */}
                      {actualServiceFee > 0 && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] font-medium">
                            Service Fee
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-semibold">
                            £{actualServiceFee.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Service Fee Threshold Alert */}
                      {serviceFeeThreshold > 0 && cartTotal < serviceFeeThreshold && actualServiceFee > 0 && (
                        <div className="bg-[#FFF5EB] border border-[#FE8A0F]/30 rounded-lg p-4 mt-3 mb-3">
                          <p className="font-['Poppins',sans-serif] text-[14px] md:text-[15px] text-[#FE8A0F] font-semibold text-center">
                            Add £{(serviceFeeThreshold - cartTotal).toFixed(2)} more for FREE service fee!
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-400">
                        <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-bold">
                          Total
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F] font-bold">
                          £{total.toFixed(2)}
                        </span>
                      </div>

                      {/* Wallet Balance Deduction */}
                      {walletBalance > 0 && walletAmount > 0 && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] font-medium flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#10B981]" />
                            Wallet Balance Used
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[15px] text-[#10B981] font-semibold">
                            -£{walletAmount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Remaining Amount to Pay */}
                      {remainderAmount > 0 && (
                        <div className="flex justify-between items-center pt-3 border-t-2 border-[#3B82F6] bg-blue-50/50 -mx-2 px-2 py-2 rounded">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#3B82F6] font-semibold">
                            Remaining to Pay
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[18px] text-[#3B82F6] font-bold">
                            £{remainderAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Full Payment by Wallet */}
                      {walletAmount > 0 && remainderAmount === 0 && (
                        <div className="flex justify-between items-center pt-3 border-t-2 border-[#10B981] bg-green-50/50 -mx-2 px-2 py-2 rounded">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#10B981] font-semibold">
                            Paid by Wallet
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[18px] text-[#10B981] font-bold">
                            £{walletAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button 
                  onClick={handlePlaceOrder}
                  className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white py-6 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px] mb-3"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Place Order
                </Button>

                {/* Add Remarks Button */}
                <Button 
                  onClick={() => setShowAdditionalInfoDialog(true)}
                  variant="ghost"
                  className="w-full border-0 text-[#3D78CB] hover:bg-[#3D78CB] hover:text-[#3D78CB] py-3 rounded-md transition-all duration-300 font-['Poppins',sans-serif] text-[14px] mb-3"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Add Remarks
                  {Object.keys(additionalInfoPerItem).length > 0 && (
                    <span className="ml-2 bg-[#3D78CB] text-white rounded px-1.5 py-0.5 text-xs">
                      {Object.keys(additionalInfoPerItem).length} service{Object.keys(additionalInfoPerItem).length > 1 ? 's' : ''}
                    </span>
                  )}
                </Button>

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
      </div>

      {/* Add Remarks Dialog */}
      <Dialog open={showAdditionalInfoDialog} onOpenChange={setShowAdditionalInfoDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Add Remarks
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Add any special requirements or remarks for each service
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {cartItems.map((item) => {
              const itemInfo = additionalInfoPerItem[item.id] || { message: "", files: [] };
              
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  {/* Service Name */}
                  <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f] mb-3">
                    {item.title}
                  </h3>
                  
                  {/* Message Input */}
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Message
                    </Label>
                    <Textarea
                      placeholder="Enter any special requirements, instructions, or additional information..."
                      value={itemInfo.message}
                      onChange={(e) => {
                        setAdditionalInfoPerItem(prev => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            message: e.target.value,
                            files: prev[item.id]?.files || []
                          }
                        }));
                      }}
                      rows={4}
                      className="font-['Poppins',sans-serif] text-[13px]"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Attachments (Optional) - Max 10 files
                    </Label>
                    <div 
                      className="border-2 border-dashed border-[#3D78CB] rounded-lg p-4 text-center hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => additionalInfoFileInputRefs.current[item.id]?.click()}
                    >
                      <input
                        ref={(el) => {
                          additionalInfoFileInputRefs.current[item.id] = el;
                        }}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            const validFiles = newFiles.filter(file => {
                              const type = file.type;
                              return type.startsWith('image/') || 
                                     type.startsWith('video/') || 
                                     type === 'application/pdf' ||
                                     type === 'application/msword' ||
                                     type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                     type === 'text/plain';
                            });

                            if (validFiles.length !== newFiles.length) {
                              toast.error("Some files were not added. Only images, videos, and documents are allowed.");
                            }

                            setAdditionalInfoPerItem(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                message: prev[item.id]?.message || "",
                                files: [...(prev[item.id]?.files || []), ...validFiles].slice(0, 10)
                              }
                            }));
                          }
                          // Reset input
                          if (e.target) {
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-[#3D78CB]" />
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#3D78CB] font-medium">
                          Click to upload files ({itemInfo.files.length}/10)
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                          Images, videos, PDF, DOC, DOCX, or TXT files
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files */}
                  {itemInfo.files.length > 0 && (
                    <div className="space-y-2">
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                        Selected Files:
                      </Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {itemInfo.files.map((file, index) => {
                          const getFileIcon = () => {
                            if (file.type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
                            if (file.type.startsWith('video/')) return <Film className="w-4 h-4 text-purple-500" />;
                            return <FileText className="w-4 h-4 text-gray-500" />;
                          };
                          
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                              {getFileIcon()}
                              <span className="font-['Poppins',sans-serif] text-[11px] text-[#2c353f] flex-1 truncate">
                                {file.name}
                              </span>
                              <button 
                                onClick={() => {
                                  setAdditionalInfoPerItem(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      message: prev[item.id]?.message || "",
                                      files: (prev[item.id]?.files || []).filter((_, i) => i !== index)
                                    }
                                  }));
                                }} 
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setAdditionalInfoPerItem({});
                  setShowAdditionalInfoDialog(false);
                }}
                className="font-['Poppins',sans-serif]"
              >
                Clear & Close
              </Button>
              <Button
                onClick={() => setShowAdditionalInfoDialog(false)}
                className="bg-[#3D78CB] hover:bg-[#2D5CA3] text-white font-['Poppins',sans-serif]"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>

    {/* Add Card Modal */}
    {publishableKey && (
      <PaymentMethodModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSuccess={async () => {
          // Fetch payment methods again to get the newly added card
          const response = await fetch(resolveApiUrl("/api/payment-methods"), {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            const newCards = (data.paymentMethods || []).map((pm: any) => ({
              id: pm.paymentMethodId || pm.id,
              type: "card" as const,
              cardNumber: `**** **** **** ${pm.last4 || '4242'}`,
              cardHolder: pm.billing_details?.name || "Card Holder",
              expiryDate: `${pm.card?.exp_month || 12}/${(pm.card?.exp_year || 2025) % 100}`,
              isDefault: pm.isDefault || false,
              brand: pm.card?.brand || 'visa',
            }));
            
            // Find the most recently added card by comparing with existing cards
            const existingCardIds = paymentMethods.filter(m => m.type === "card").map(m => m.id);
            const newCard = newCards.find(card => !existingCardIds.includes(card.id));
            
            // Refresh payment methods and select the new card
            if (newCard) {
              await fetchPaymentMethods(newCard.id);
            } else {
              // If we can't find a new card, just refresh and select the first card
              await fetchPaymentMethods();
            }
          } else {
            // If fetch fails, just refresh without selecting
            await fetchPaymentMethods();
          }
        }}
        publishableKey={publishableKey}
      />
    )}
    </>
  );
}