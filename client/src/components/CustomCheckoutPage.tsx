import React, { useState, useEffect, useMemo } from "react";
import { usePendingCustomOffer } from "./PendingCustomOfferContext";
import { useAccount } from "./AccountContext";
import { useOrders } from "./OrdersContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEOHead from "./SEOHead";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import {
  ShoppingBag,
  CheckCircle2,
  CreditCard,
  MapPin,
  Landmark,
  Truck,
  Shield,
  ChevronUp,
  ChevronDown,
  Gift,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { resolveApiUrl } from "../config/api";
import { toast } from "sonner";
import PaymentMethodModal from "./PaymentMethodModal";
import paypalLogo from "../assets/paypal-logo.png";
import { VideoThumbnail } from "./orders/VideoThumbnail";
import AddressAutocomplete from "./AddressAutocomplete";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

interface Address {
  id: string;
  postcode: string;
  address: string;
  city: string;
  county?: string;
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
  brand?: string;
}

function resolveMediaUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return resolveApiUrl(url);
  return resolveApiUrl(url);
}

const getCardType = (brand?: string, cardNumber?: string): "visa" | "mastercard" | "unknown" => {
  if (brand) {
    const b = brand.toLowerCase();
    if (b.includes("visa")) return "visa";
    if (b.includes("mastercard") || b.includes("master")) return "mastercard";
  }
  if (cardNumber) {
    const last4 = cardNumber.slice(-4);
    if (last4.startsWith("4")) return "visa";
    if (last4.startsWith("5")) return "mastercard";
  }
  return "visa";
};

const VisaLogo = () => (
  <svg width="40" height="26" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white" />
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1" />
    <path d="M22.5859 22.75H19.9609L21.7859 14H24.4109L22.5859 22.75ZM17.7109 14L15.2109 20.125L14.9109 18.375L14.0359 14.875C14.0359 14.875 13.8859 14 13.2859 14H9.08594V14.15C9.08594 14.15 10.2609 14.45 11.5859 15.175L13.9609 22.75H16.8359L20.9609 14H17.7109ZM37.8359 22.75H40.1859L38.2859 14H36.2859C35.8359 14 35.5359 14.3 35.3859 14.75L31.4609 22.75H34.3359L34.9359 21.3H38.3359L38.6359 22.75H37.8359ZM35.6359 19.125L36.9609 16.0625L37.6859 19.125H35.6359ZM31.5859 16.875L32.0359 14.875C32.0359 14.875 30.8609 14 29.6859 14C28.3609 14 25.3359 14.75 25.3359 17.5625C25.3359 20.1875 29.1859 20.1875 29.1859 21.3125C29.1859 22.4375 25.9609 22.1875 24.9359 21.4375L24.4859 23.4375C24.4859 23.4375 25.6609 24 27.4359 24C29.0609 24 31.8359 23.125 31.8359 20.5C31.8359 17.875 28.0359 17.625 28.0359 16.75C28.0359 15.75 30.5359 15.875 31.5859 16.875Z" fill="#1434CB" />
  </svg>
);

const MastercardLogo = () => (
  <svg width="40" height="26" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white" />
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1" />
    <circle cx="21" cy="18" r="8" fill="#EB001B" />
    <circle cx="35" cy="18" r="8" fill="#F79E1B" />
    <path d="M28 11.5C26.25 13 25 15.35 25 18C25 20.65 26.25 23 28 24.5C29.75 23 31 20.65 31 18C31 15.35 29.75 13 28 11.5Z" fill="#FF5F00" />
  </svg>
);

const PROFILE_ADDRESS_ID = "__profile__";

/** Display item shape for custom checkout (from pending offer, not cart). */
interface CustomOfferDisplayItem {
  id: string;
  serviceId: string;
  title: string;
  seller: string;
  price: number;
  image: string;
  quantity: number;
  deliveryDays?: number;
  offerId: string;
  addons?: { id: number; title: string; price: number }[];
}

export default function CustomCheckoutPage() {
  const { pendingOffer, setPendingOffer, clearPendingOffer } = usePendingCustomOffer();
  const { isLoggedIn, authReady, userInfo } = useAccount();
  const { refreshOrders } = useOrders();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restoringOffer, setRestoringOffer] = useState(true);

  const customOfferItems: CustomOfferDisplayItem[] = useMemo(() => {
    if (!pendingOffer) return [];
    return [
      {
        id: pendingOffer.serviceId,
        serviceId: pendingOffer.serviceId,
        title: pendingOffer.title,
        seller: pendingOffer.seller,
        price: pendingOffer.price,
        image: pendingOffer.image,
        quantity: pendingOffer.quantity,
        deliveryDays: pendingOffer.deliveryDays,
        offerId: pendingOffer.offerId,
        addons: pendingOffer.addons,
      },
    ];
  }, [pendingOffer]);

  const [showAddressSection, setShowAddressSection] = useState(true);
  const [showPaymentSection, setShowPaymentSection] = useState(true);
  const [showServicesSection, setShowServicesSection] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [skipAddress, setSkipAddress] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    postcode: "",
    address: "",
    city: "",
    county: "",
    phone: "",
  });

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [serviceFeeThreshold, setServiceFeeThreshold] = useState<number>(0);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  /** Fetched service media (only when serviceId is a real service, not custom-offer id) */
  const [serviceMedia, setServiceMedia] = useState<{ type: "image" | "video"; url: string; thumbnail?: string } | null>(null);
  const [loadingServiceMedia, setLoadingServiceMedia] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: "pro" | "admin"; discount: number } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);

  const subtotal = useMemo(
    () =>
      customOfferItems.reduce(
        (sum, item) =>
          sum + (item.price + (item.addons?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity,
        0
      ),
    [customOfferItems]
  );

  const deliveryDays =
    customOfferItems.length > 0 ? (customOfferItems[0] as any).deliveryDays ?? null : null;

  const orderSubtotal = subtotal - discount;
  const actualServiceFee = useMemo(() => {
    if (serviceFeeThreshold > 0 && orderSubtotal >= serviceFeeThreshold) return 0;
    return serviceFee;
  }, [orderSubtotal, serviceFee, serviceFeeThreshold]);

  const total = orderSubtotal + actualServiceFee;
  const walletAmount = Math.min(walletBalance, total);
  const remainderAmount = Math.max(0, total - walletBalance);

  const expectedDeliveryDate = useMemo(() => {
    if (deliveryDays == null || deliveryDays <= 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + deliveryDays);
    return d;
  }, [deliveryDays]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    setPromoCodeError(null);
    try {
      const res = await fetch(resolveApiUrl("/api/promo-codes/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          subtotal,
          items: customOfferItems.map((item) => ({ serviceId: item.serviceId })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoCodeError(data.error || "Invalid promo code");
        setAppliedPromo(null);
        setDiscount(0);
        toast.error(data.error || "Invalid promo code");
        return;
      }
      if (data.valid && data.promoCode) {
        setAppliedPromo({
          code: data.promoCode.code,
          type: data.promoCode.type || "admin",
          discount: data.promoCode.discount,
        });
        setDiscount(data.promoCode.discount);
        setPromoCodeError(null);
        toast.success("Promo code applied!", {
          description: `You saved £${data.promoCode.discount.toFixed(2)} on your order`,
        });
      } else {
        setPromoCodeError("Invalid promo code");
        setAppliedPromo(null);
        setDiscount(0);
        toast.error("Invalid promo code");
      }
    } catch (e) {
      setPromoCodeError("Failed to validate promo code");
      setAppliedPromo(null);
      setDiscount(0);
      toast.error("Failed to apply promo code");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setPromoCode("");
    setPromoCodeError(null);
    toast.info("Promo code removed");
  };

  const profileAddress: Address | null =
    addresses.length === 0 && userInfo && (userInfo.address || userInfo.postcode || userInfo.phone)
      ? {
          id: PROFILE_ADDRESS_ID,
          postcode: userInfo.postcode || "",
          address: userInfo.address || "",
          city: userInfo.townCity || "",
          county: userInfo.county || "",
          phone: userInfo.phone || "",
          isDefault: false,
        }
      : null;
  const displayAddresses: Address[] =
    addresses.length > 0 ? addresses : profileAddress ? [profileAddress] : [];

  useEffect(() => {
    if (authReady && !isLoggedIn) navigate("/login");
  }, [isLoggedIn, authReady, navigate]);

  // Restore pending offer from URL on page load/refresh
  useEffect(() => {
    const offerId = searchParams.get("offerId");
    if (!authReady) return;
    if (!isLoggedIn) {
      setRestoringOffer(false);
      return;
    }
    if (pendingOffer) {
      setRestoringOffer(false);
      return;
    }
    if (!offerId) {
      setRestoringOffer(false);
      return;
    }
    let cancelled = false;
    const restore = async () => {
      try {
        const res = await fetch(resolveApiUrl(`/api/custom-offers/${offerId}/checkout-details`), {
          credentials: "include",
        });
        if (cancelled) return;
        if (!res.ok) {
          setRestoringOffer(false);
          navigate("/account?tab=orders", { replace: true });
          return;
        }
        const data = await res.json();
        const d = data.checkoutDetails;
        if (!d || cancelled) {
          setRestoringOffer(false);
          return;
        }
        setPendingOffer({
          offerId: d.offerId,
          orderId: d.orderId,
          serviceId: d.serviceId,
          title: d.title,
          seller: d.seller,
          price: typeof d.price === "number" ? d.price : parseFloat(d.price) || 0,
          image: d.image || "",
          quantity: d.quantity || 1,
          deliveryDays: d.deliveryDays,
          packageType: d.packageType,
          priceUnit: d.priceUnit,
        });
      } catch {
        if (!cancelled) navigate("/account?tab=orders", { replace: true });
      } finally {
        if (!cancelled) setRestoringOffer(false);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [authReady, isLoggedIn, pendingOffer, searchParams, setPendingOffer, navigate]);

  useEffect(() => {
    if (restoringOffer) return;
    if (customOfferItems.length === 0) navigate("/account?tab=orders", { replace: true });
  }, [restoringOffer, customOfferItems.length, navigate]);

  // Fetch service details only when serviceId is a real service ID (not custom-offer id like "custom-OFFER-...")
  useEffect(() => {
    const serviceId = pendingOffer?.serviceId;
    if (!serviceId) {
      setServiceMedia(null);
      setLoadingServiceMedia(false);
      return;
    }
    if (String(serviceId).startsWith("custom-")) {
      setServiceMedia(null);
      setLoadingServiceMedia(false);
      return;
    }
    let cancelled = false;
    const fetchServiceMedia = async () => {
      setLoadingServiceMedia(true);
      setServiceMedia(null);
      try {
        const res = await fetch(resolveApiUrl(`/api/services/${serviceId}`), { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const service = data.service;
        if (!service || cancelled) return;
        let thumbnail: { type: "image" | "video"; url: string; thumbnail?: string } | null = null;
        if (service.gallery?.length > 0) {
          const first = service.gallery[0];
          if (first.type === "video" && first.url) thumbnail = { type: "video", url: first.url, thumbnail: first.thumbnail };
          else if (first.type === "image" && first.url) thumbnail = { type: "image", url: first.url };
        }
        if (!thumbnail && service.videos?.length > 0) {
          const v = service.videos[0];
          thumbnail = { type: "video", url: v.url || v, thumbnail: v.thumbnail };
        }
        if (!thumbnail && service.images?.length > 0) thumbnail = { type: "image", url: service.images[0] };
        if (!thumbnail && service.image) thumbnail = { type: "image", url: service.image };
        if (!cancelled && thumbnail) setServiceMedia(thumbnail);
      } catch {
        if (!cancelled) setServiceMedia(null);
      } finally {
        if (!cancelled) setLoadingServiceMedia(false);
      }
    };
    fetchServiceMedia();
    return () => { cancelled = true; };
  }, [pendingOffer?.serviceId]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isLoggedIn) return;
      try {
        setLoadingAddresses(true);
        const res = await fetch(resolveApiUrl("/api/auth/profile/addresses"), {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const list: Address[] = (data.addresses || []).map((a: any) => ({
            id: a.id || a._id?.toString() || "",
            postcode: a.postcode || "",
            address: a.address || "",
            city: a.city || "",
            county: a.county || "",
            phone: a.phone || "",
            isDefault: a.isDefault || false,
          }));
          setAddresses(list);
          if (list.length > 0 && !selectedAddress) {
            const def = list.find((x) => x.isDefault) || list[0];
            setSelectedAddress(def.id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch addresses", e);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [isLoggedIn]);

  useEffect(() => {
    if (addresses.length === 0 && profileAddress && !selectedAddress)
      setSelectedAddress(PROFILE_ADDRESS_ID);
  }, [addresses.length, profileAddress, selectedAddress]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await fetch(resolveApiUrl("/api/wallet/balance"), { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.balance || 0);
        }
      } catch (e) {
        console.error("Failed to fetch wallet balance", e);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchSettingsAndFee = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setServiceFee(data.serviceFees || 0);
          setServiceFeeThreshold(data.serviceFeeThreshold || 0);
          if (data.publishableKey) setPublishableKey(data.publishableKey);
        }
      } catch (e) {
        console.error("Failed to fetch payment settings", e);
      }
    };
    fetchSettingsAndFee();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!isLoggedIn) return;
      try {
        setLoadingPaymentMethods(true);
        const [methodsRes, settingsRes] = await Promise.all([
          fetch(resolveApiUrl("/api/payment-methods"), { credentials: "include" }),
          fetch(resolveApiUrl("/api/payment/publishable-key"), { credentials: "include" }),
        ]);
        let cards: PaymentMethod[] = [];
        let paypalEnabled = false;
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.publishableKey) setPublishableKey(settingsData.publishableKey);
          if (settingsData.serviceFeeThreshold != null) setServiceFeeThreshold(settingsData.serviceFeeThreshold);
          paypalEnabled = Boolean(settingsData.paypalEnabled);
        }
        if (methodsRes.ok) {
          const methodsData = await methodsRes.json();
          cards = (methodsData.paymentMethods || []).map((pm: any) => {
            const last4 =
              pm.card?.last4 || pm.last4 || (pm.cardNumber ? pm.cardNumber.slice(-4) : null);
            return {
              id: pm.paymentMethodId || pm.id,
              type: "card" as const,
              cardNumber: last4 ? `**** **** **** ${last4}` : "**** **** **** ****",
              cardHolder: pm.billing_details?.name || pm.cardHolder || "Card Holder",
              expiryDate:
                pm.card?.exp_month && pm.card?.exp_year
                  ? `${pm.card.exp_month}/${pm.card.exp_year % 100}`
                  : pm.expiryDate || "MM/YY",
              isDefault: pm.isDefault || false,
              brand: pm.card?.brand || pm.brand,
            };
          });
        }
        const methods: PaymentMethod[] = [...cards];
        if (paypalEnabled) methods.push({ id: "paypal", type: "paypal" });
        setPaymentMethods(methods);
        if (methods.length > 0 && !selectedPayment) {
          const card = methods.find((m) => m.type === "card");
          setSelectedPayment(card ? card.id : methods[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch payment methods", e);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };
    fetchPaymentMethods();
  }, [isLoggedIn]);

  const getAddressDetails = () => {
    if (skipAddress) return undefined;
    const addr = displayAddresses.find((a) => a.id === selectedAddress);
    if (!addr) return undefined;
    return {
      postcode: addr.postcode,
      address: addr.address,
      city: addr.city,
      county: addr.county,
      phone: addr.phone,
    };
  };

  const handleOpenChangeAddress = (addressId: string) => {
    const address =
      addressId === PROFILE_ADDRESS_ID
        ? profileAddress
        : addresses.find((addr) => addr.id === addressId);
    if (address) {
      setEditingAddressId(addressId);
      setNewAddress({
        postcode: address.postcode || "",
        address: address.address || "",
        city: address.city || "",
        county: address.county || "",
        phone: address.phone || "",
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
      if (editingAddressId && editingAddressId !== PROFILE_ADDRESS_ID) {
        const addressToUpdate = addresses.find((addr) => addr.id === editingAddressId);
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
          headers: { "Content-Type": "application/json" },
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
          isDefault: data.address?.isDefault ?? updateData.isDefault,
        };
        setAddresses((prev) => prev.map((addr) => (addr.id === editingAddressId ? updatedAddress : addr)));
        setSelectedAddress(updatedAddress.id);
        setShowAddressDialog(false);
        setEditingAddressId(null);
        setNewAddress({ postcode: "", address: "", city: "", county: "", phone: "" });
        toast.success("Address updated successfully!");
      } else {
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
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newAddressData),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save address");
        }
        const data = await response.json();
        const savedAddress: Address = {
          id: data.address?.id || data.address?._id || String(Date.now()),
          postcode: data.address?.postcode || newAddressData.postcode,
          address: data.address?.address || newAddressData.address,
          city: data.address?.city || newAddressData.city,
          county: data.address?.county || newAddressData.county,
          phone: data.address?.phone || newAddressData.phone,
          isDefault: data.address?.isDefault ?? newAddressData.isDefault,
        };
        setAddresses((prev) => [...prev, savedAddress]);
        setSelectedAddress(savedAddress.id);
        setShowAddressDialog(false);
        setNewAddress({ postcode: "", address: "", city: "", county: "", phone: "" });
        toast.success("Address added successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save address");
    }
  };

  const handleCheckout = async () => {
    if (!pendingOffer || customOfferItems.length === 0) return;
    if (remainderAmount > 0 && !selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }
    let paymentMethodType: string = remainderAmount === 0 ? "account_balance" : "card";
    let paymentMethodId: string | undefined;
    if (selectedPayment && selectedPayment !== "paypal") {
      paymentMethodType = "card";
      paymentMethodId = selectedPayment;
    } else if (selectedPayment === "paypal") {
      paymentMethodType = "paypal";
    }
    if (remainderAmount > 0 && paymentMethodType === "card" && !paymentMethodId) {
      toast.error("Please select a valid payment method");
      return;
    }
    const addressDetails = getAddressDetails();
    setCheckingOut(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/custom-offers/${pendingOffer.offerId}/accept`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          skipAddress: skipAddress || !addressDetails,
          address: addressDetails,
          paymentMethod: paymentMethodType,
          paymentMethodId: paymentMethodId || undefined,
          promoCode: appliedPromo?.code || undefined,
          discount: discount > 0 ? discount : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete checkout");
      }
      const data = await res.json();
      if (data.requiresApproval && data.approveUrl) {
        window.location.href = data.approveUrl;
        return;
      }
      clearPendingOffer();
      if (refreshOrders) await refreshOrders();
      const orderNumber = data.order?.orderNumber;
      navigate(orderNumber ? `/thank-you?orderIds=${orderNumber}` : "/account?tab=orders", { replace: true });
      toast.success("Payment completed! Redirecting to order details.");
    } catch (error: any) {
      console.error("[CustomCheckoutPage] Checkout error:", error);
      toast.error(error.message || "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (customOfferItems.length === 0) {
    return (
      <>
        <SEOHead title="Custom Checkout" description="Complete your custom offer payment" robots="noindex,nofollow" />
        <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] to-[#f0f0f0]">
          <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
            <Nav />
          </header>
          <div className="pt-[120px] pb-12 flex items-center justify-center">
            <p className="font-['Poppins',sans-serif] text-[#6b6b6b]">
              {restoringOffer ? "Loading..." : "Redirecting..."}
            </p>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Custom Checkout" description="Complete payment for your custom offer" robots="noindex,nofollow" />
      <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] to-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white shadow-sm">
          <Nav />
        </header>
        <div className="pt-[70px] md:pt-[50px] pb-12 md:pb-20">
          <div className="max-w-[480px] md:max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="mb-6 md:mb-10">
              <h1 className="font-['Poppins',sans-serif] text-[24px] md:text-[32px] text-[#2c353f]">
                Checkout
              </h1>
              <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mt-1">
                {customOfferItems.length} {customOfferItems.length === 1 ? "item" : "items"} • Custom offer
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Left Column - Same structure as cart page */}
              <div className="lg:col-span-2 space-y-4 md:space-y-5 order-2 lg:order-1">
                {/* Section 1: Address */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <div>
                        {showAddressSection ? <ChevronUp className="w-5 h-5 text-[#6b6b6b]" /> : <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />}
                      </div>
                    </div>
                  </button>
                  <div className={showAddressSection ? "block" : "hidden"}>
                    <div className="p-4 md:p-6">
                      {/* Change Address Dialog - same as Cart page */}
                      <Dialog
                        open={showAddressDialog}
                        onOpenChange={(open) => {
                          setShowAddressDialog(open);
                          if (!open) {
                            setEditingAddressId(null);
                            setNewAddress({
                              postcode: "",
                              address: "",
                              city: "",
                              county: "",
                              phone: "",
                            });
                          }
                        }}
                      >
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
                                onPostcodeChange={(value) => setNewAddress({ ...newAddress, postcode: value })}
                                address={newAddress.address || ""}
                                onAddressChange={(value) => setNewAddress({ ...newAddress, address: value })}
                                townCity={newAddress.city || ""}
                                onTownCityChange={(value) => setNewAddress({ ...newAddress, city: value })}
                                county={newAddress.county || ""}
                                onCountyChange={(value) => setNewAddress({ ...newAddress, county: value })}
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
                                value={newAddress.phone || ""}
                                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
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
                                    phone: "",
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

                      {loadingAddresses ? (
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Loading addresses...</p>
                      ) : displayAddresses.length === 0 ? (
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">No saved addresses.</p>
                      ) : (
                        <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                          {displayAddresses.map((addr) => (
                            <div key={addr.id} className="mb-2 md:mb-3">
                              <div
                                className={`relative border-2 rounded-lg md:rounded-xl p-3 md:p-4 transition-all ${
                                  selectedAddress === addr.id ? "border-[#FE8A0F] bg-[#FFF5EB]" : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-2 md:gap-3">
                                  <RadioGroupItem value={addr.id} id={addr.id} className="shrink-0" />
                                  <Label htmlFor={addr.id} className="cursor-pointer flex-1 min-w-0">
                                    <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">{addr.address}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <MapPin className="w-3.5 h-3.5 text-[#FE8A0F] shrink-0" />
                                      <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b]">
                                        {addr.city}
                                        {addr.county ? `, ${addr.county}` : ""} {addr.postcode}
                                      </span>
                                    </div>
                                    {addr.phone && (
                                      <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5 ml-5">Phone: {addr.phone}</p>
                                    )}
                                  </Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="shrink-0 font-['Poppins',sans-serif] text-[12px] md:text-[13px] bg-[#FE8A0F] hover:bg-[#FFB347] text-white shadow-md"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOpenChangeAddress(addr.id);
                                    }}
                                  >
                                    Change
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Payment Method */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <div>
                        {showPaymentSection ? <ChevronUp className="w-5 h-5 text-[#6b6b6b]" /> : <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />}
                      </div>
                    </div>
                  </button>
                  <div className={showPaymentSection ? "block" : "hidden"}>
                    <div className="p-4 md:p-6">
                      {loadingPaymentMethods ? (
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">Loading payment methods...</p>
                      ) : paymentMethods.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-3">No payment methods yet.</p>
                          {publishableKey && (
                            <Button variant="outline" className="border-2 border-dashed border-[#3B82F6] text-[#3B82F6] bg-blue-50/50 hover:bg-blue-50 font-['Poppins',sans-serif]" onClick={() => setShowAddCardModal(true)}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Add new card
                            </Button>
                          )}
                        </div>
                      ) : (
                        <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                          {paymentMethods.filter((m) => m.type === "card").map((method) => (
                            <div key={method.id} className="mb-3 md:mb-4">
                              <div
                                className={`relative border-2 rounded-lg md:rounded-xl p-3 md:p-4 transition-all ${
                                  selectedPayment === method.id ? "border-[#3B82F6] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-2 md:gap-3">
                                  <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="shrink-0" />
                                  <Label htmlFor={`payment-${method.id}`} className="cursor-pointer flex-1 min-w-0">
                                    <div className="flex items-center gap-2 md:gap-3">
                                      {getCardType(method.brand, method.cardNumber) === "visa" ? (
                                        <VisaLogo />
                                      ) : getCardType(method.brand, method.cardNumber) === "mastercard" ? (
                                        <MastercardLogo />
                                      ) : (
                                        <CreditCard className="w-8 h-6 text-gray-400 shrink-0" />
                                      )}
                                      <div>
                                        <span className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium">{method.cardNumber}</span>
                                        {method.cardHolder && (
                                          <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mt-0.5">Exp. {method.expiryDate}</p>
                                        )}
                                      </div>
                                    </div>
                                  </Label>
                                  {publishableKey && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="shrink-0 font-['Poppins',sans-serif] text-[12px] md:text-[13px] bg-[#FE8A0F] hover:bg-[#FFB347] text-white shadow-md"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowAddCardModal(true);
                                      }}
                                    >
                                      Change
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {publishableKey && paymentMethods.filter((m) => m.type === "card").length === 0 && (
                            <Button
                              variant="outline"
                              className="w-full mb-3 md:mb-4 font-['Poppins',sans-serif] border-2 border-dashed border-[#3B82F6] text-[#3B82F6] bg-blue-50/50 hover:bg-blue-50 py-3"
                              onClick={() => setShowAddCardModal(true)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Add new card
                            </Button>
                          )}
                          {paymentMethods.filter((m) => m.type === "paypal").map((method) => (
                            <div key={method.id} className="mb-3 md:mb-4">
                              <div
                                className={`relative border-2 rounded-lg md:rounded-xl p-3 md:p-4 transition-all ${
                                  selectedPayment === method.id ? "border-[#3B82F6] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start gap-2 md:gap-3">
                                  <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mt-0.5 shrink-0" />
                                  <Label htmlFor={`payment-${method.id}`} className="cursor-pointer flex-1">
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
                                  </Label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      <div className="mt-3 md:mt-4 flex items-start gap-2 bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3">
                        <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#10B981] mt-0.5 shrink-0" />
                        <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#6b6b6b] leading-relaxed">Your payment information is encrypted and secure</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Selected Service(s) - No timeslot */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setShowServicesSection(!showServicesSection)}
                    className="w-full px-4 md:px-6 py-3 md:py-4 border-b border-gray-100"
                  >
                    <div className="flex items-center justify-between gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-7 md:h-7 bg-[#10B981] rounded-full flex items-center justify-center shrink-0">
                          <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-white font-medium">3</span>
                        </div>
                        <h2 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium text-left">
                          Selected Service(s)
                        </h2>
                        <Badge className="bg-gray-100 text-[#2c353f] text-[11px] md:text-[12px]">{customOfferItems.length} items</Badge>
                      </div>
                      <div>
                        {showServicesSection ? <ChevronUp className="w-5 h-5 text-[#6b6b6b]" /> : <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />}
                      </div>
                    </div>
                  </button>
                  <div className={showServicesSection ? "block" : "hidden"}>
                    <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                      {customOfferItems.map((item: CustomOfferDisplayItem) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-gray-300 transition-all">
                          <div className="flex gap-3 md:gap-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {loadingServiceMedia ? (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center animate-pulse">
                                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                                </div>
                              ) : serviceMedia?.type === "video" ? (
                                <VideoThumbnail videoUrl={serviceMedia.url} thumbnail={serviceMedia.thumbnail} fallbackImage={item.image} className="w-full h-full" />
                              ) : serviceMedia?.type === "image" ? (
                                <img src={resolveMediaUrl(serviceMedia.url)} alt={item.title} className="w-full h-full object-cover" />
                              ) : item.image ? (
                                <img src={resolveMediaUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#2c353f] font-medium mb-0.5 line-clamp-2">{item.title}</h3>
                              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b] mb-2">by {item.seller}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                  {item.quantity} × £{(typeof item.price === "number" ? item.price : parseFloat(String(item.price || 0))).toFixed(2)}
                                </span>
                                <p className="font-['Poppins',sans-serif] text-[14px] md:text-[16px] text-[#2c353f] font-medium">
                                  £
                                  {(
                                    (item.price + (item.addons?.reduce((s, a) => s + a.price, 0) || 0)) *
                                    item.quantity
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary (same as cart page style) with delivery time */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                <div className="lg:sticky lg:top-24 space-y-4 md:space-y-5">
                  <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
                    {/* Promo Code - at top */}
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
                              promoCodeError ? "border-red-300" : "border-gray-200"
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
                          <button type="button" onClick={handleRemovePromo} className="text-red-500 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {promoCodeError && (
                        <p className="font-['Poppins',sans-serif] text-[11px] text-red-500 mt-2">{promoCodeError}</p>
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="mb-6">
                      <div className="space-y-3">
                        {customOfferItems.map((item, index) => (
                          <div key={item.id} className={index > 0 ? "pt-3 border-t border-gray-300" : ""}>
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-semibold">
                                Service {index + 1} ({item.quantity} × £{(typeof item.price === "number" ? item.price : parseFloat(String(item.price || 0))).toFixed(2)})
                              </p>
                              <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                                £
                                {(
                                  (item.price + (item.addons?.reduce((s, a) => s + a.price, 0) || 0)) *
                                  item.quantity
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {discount > 0 && appliedPromo && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-green-600 font-medium">
                            Discount ({appliedPromo.code})
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[15px] text-green-600 font-semibold">
                            -£{discount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {actualServiceFee > 0 && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] font-medium">Service Fee</span>
                          <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-semibold">£{actualServiceFee.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Service Fee Threshold Alert */}
                      {serviceFeeThreshold > 0 && orderSubtotal < serviceFeeThreshold && actualServiceFee > 0 && (
                        <div className="bg-[#FFF5EB] border border-[#FE8A0F]/30 rounded-lg p-4 mt-3 mb-3">
                          <p className="font-['Poppins',sans-serif] text-[14px] md:text-[15px] text-[#FE8A0F] font-semibold text-center">
                            Add £{(serviceFeeThreshold - orderSubtotal).toFixed(2)} more for FREE service fee!
                          </p>
                        </div>
                      )}

                      {/* Delivery time - in order summary */}
                      {deliveryDays != null && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] font-medium flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#FE8A0F]" />
                            Delivery time
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                            {deliveryDays === 1 ? "1 day" : `${deliveryDays} days`}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-400">
                        <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-bold">Total</span>
                        <span className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F] font-bold">£{total.toFixed(2)}</span>
                      </div>

                      {/* Expected delivery date - below total */}
                      {expectedDeliveryDate != null && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] font-medium flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#FE8A0F]" />
                            Expected delivery
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                            {expectedDeliveryDate.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {walletBalance > 0 && walletAmount > 0 && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] font-medium flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-[#10B981]" />
                            Wallet Balance Used
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[15px] text-[#10B981] font-semibold">-£{walletAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {walletBalance > 0 && remainderAmount > 0 && (
                        <div className="flex justify-between items-center pt-3 border-t-2 border-[#3B82F6] bg-blue-50/50 -mx-2 px-2 py-2 rounded mt-2">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#3B82F6] font-semibold">Remaining to Pay</span>
                          <span className="font-['Poppins',sans-serif] text-[18px] text-[#3B82F6] font-bold">£{remainderAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {walletAmount > 0 && remainderAmount === 0 && (
                        <div className="flex justify-between items-center pt-3 border-t-2 border-[#10B981] bg-green-50/50 -mx-2 px-2 py-2 rounded mt-2">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#10B981] font-semibold">Paid by Wallet</span>
                          <span className="font-['Poppins',sans-serif] text-[18px] text-[#10B981] font-bold">£{walletAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={checkingOut || (remainderAmount > 0 && !selectedPayment)}
                      className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white py-6 rounded-full transition-all duration-300 font-['Poppins',sans-serif] text-[16px] mb-3"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {checkingOut ? "Processing..." : "Checkout"}
                    </Button>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#10B981]" />
                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">100% Secure Payments</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">Money Back Guarantee</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#10B981]" />
                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">Professional Service Delivery</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {publishableKey && (
        <PaymentMethodModal
          isOpen={showAddCardModal}
          onClose={() => setShowAddCardModal(false)}
          onSuccess={async (newPaymentMethodId?: string) => {
            const res = await fetch(resolveApiUrl("/api/payment-methods"), { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              const cards = (data.paymentMethods || []).map((pm: any) => ({
                id: pm.paymentMethodId || pm.id,
                type: "card" as const,
                cardNumber: `**** **** **** ${pm.card?.last4 || pm.last4 || "****"}`,
                cardHolder: pm.billing_details?.name || "Card Holder",
                expiryDate: "MM/YY",
                isDefault: false,
                brand: pm.card?.brand,
              }));
              setPaymentMethods((prev) => {
                const next = prev.filter((m) => m.type !== "card");
                return [...cards, ...next];
              });
              if (newPaymentMethodId && cards.some((c) => c.id === newPaymentMethodId)) {
                setSelectedPayment(newPaymentMethodId);
              } else if (cards.length > 0) {
                setSelectedPayment(cards[0].id);
              }
            }
          }}
          publishableKey={publishableKey}
        />
      )}
    </>
  );
}
