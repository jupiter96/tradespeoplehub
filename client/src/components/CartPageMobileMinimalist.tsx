import { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  Edit2, 
  Home, 
  Briefcase,
  X,
  Plus,
  CreditCard,
  Landmark,
  Play
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

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

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Video element - always shown, plays on button click */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnail || fallbackImage || undefined}
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
          <div className="bg-white/90 group-hover:bg-white rounded-full p-2 md:p-3 shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 md:w-6 md:h-6 text-[#FE8A0F] fill-[#FE8A0F]" />
          </div>
        </button>
      )}
    </div>
  );
}

interface Address {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
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
  brand?: string; // Card brand (visa, mastercard, etc.) from Stripe
}

interface CartItem {
  id: string;
  title: string;
  seller: string;
  price: number;
  quantity: number;
  image: string;
  addons?: { id: string; title: string; price: number }[];
  booking?: { date: string; time: string };
  thumbnailVideo?: { url: string; thumbnail?: string };
}

interface Props {
  cartItems: CartItem[];
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  selectedAddress: string;
  setSelectedAddress: (id: string) => void;
  selectedPayment: string;
  setSelectedPayment: (id: string) => void;
  skipAddress: boolean;
  setSkipAddress: (value: boolean) => void;
  onPlaceOrder: () => void;
  subtotal: number;
  discount: number;
  serviceFee?: number;
  total: number;
  appliedPromo: { code: string; type: 'pro' | 'admin'; discount: number } | null;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
}

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

const getCardType = (cardNumber?: string): 'visa' | 'mastercard' => {
  if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.length < 4) {
    return 'visa'; // Default to visa if cardNumber is invalid
  }
  const lastFourDigits = cardNumber.slice(-4);
  if (lastFourDigits === '4242' || lastFourDigits.startsWith('4')) return 'visa';
  return 'mastercard';
};

export default function CartPageMobileMinimalist({
  cartItems,
  addresses,
  paymentMethods,
  selectedAddress,
  setSelectedAddress,
  selectedPayment,
  setSelectedPayment,
  skipAddress,
  setSkipAddress,
  onPlaceOrder,
  subtotal,
  discount,
  serviceFee = 0,
  total,
  appliedPromo,
  onApplyPromo,
  onRemovePromo
}: Props) {
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showItemsSection, setShowItemsSection] = useState(true); // Changed to true for default expanded
  const [promoCode, setPromoCode] = useState("");

  const selectedAddressData = addresses.find(addr => addr.id === selectedAddress);
  const selectedPaymentData = paymentMethods.find(pm => pm.id === selectedPayment);

  const handleApplyPromo = () => {
    onApplyPromo(promoCode);
    setPromoCode("");
  };

  return (
    <div className="space-y-3">
      {/* Items Section - At the Top, Default Expanded */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0 border-gray-100">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {item.thumbnailVideo ? (
                  <VideoThumbnail
                    videoUrl={item.thumbnailVideo.url}
                    thumbnail={item.thumbnailVideo.thumbnail}
                    fallbackImage={item.image}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1 line-clamp-2">
                  {item.title}
                </h3>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                  {item.seller}
                </p>
                <p className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-medium">
                  £{((item.price + (item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0)) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Location address - Compact Display */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F] font-medium mb-3">
          Task Location address
        </h3>
        {skipAddress ? (
          <div className="flex items-start gap-3">
            <input
              type="radio"
              checked
              readOnly
              className="mt-1 w-5 h-5 text-[#FE8A0F] accent-[#FE8A0F]"
            />
            <div className="flex-1">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                Skip Address - Discuss with professional
              </p>
            </div>
          </div>
        ) : selectedAddressData ? (
          <div className="flex items-start gap-3">
            <input
              type="radio"
              checked
              readOnly
              className="mt-1 w-5 h-5 text-[#FE8A0F] accent-[#FE8A0F]"
            />
            <div className="flex-1 min-w-0">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                {selectedAddressData.addressLine1}, {selectedAddressData.postcode} - {selectedAddressData.city}, 
                <span className="text-[#3B82F6]"> {selectedAddressData.phone}</span>
              </p>
            </div>
          </div>
        ) : null}
        
        {/* Edit and Skip Address Options */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowAddressSection(!showAddressSection)}
            className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipAddress}
              onChange={(e) => setSkipAddress(e.target.checked)}
              className="w-4 h-4 rounded accent-[#3B82F6]"
            />
            <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Skip Address
            </span>
          </label>
          <button
            onClick={() => setShowAddressSection(!showAddressSection)}
            className="ml-auto"
          >
            <ChevronDown className={`w-5 h-5 text-[#6b6b6b] transition-transform ${showAddressSection ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Address Selection */}
        {showAddressSection && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
              {addresses.map((address) => (
                <div key={address.id} className={`border-2 rounded-xl p-3 ${
                  selectedAddress === address.id 
                    ? "border-[#FE8A0F] bg-[#FFF5EB]" 
                    : "border-gray-200"
                }`}>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value={address.id} id={address.id} className="mt-0.5" />
                    <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-1.5 mb-1">
                        {address.type === "home" ? (
                          <Home className="w-3.5 h-3.5 text-[#FE8A0F]" />
                        ) : (
                          <Briefcase className="w-3.5 h-3.5 text-[#FE8A0F]" />
                        )}
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium capitalize">
                          {address.type}
                        </span>
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] truncate">
                        {address.addressLine1}
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        {address.postcode}
                      </p>
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Paying With - Compact Display */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F] font-medium">
            Paying with
          </h3>
          <button
            onClick={() => setShowPaymentSection(!showPaymentSection)}
          >
            <ChevronDown className={`w-5 h-5 text-[#6b6b6b] transition-transform ${showPaymentSection ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Selected Payment Method */}
        {selectedPaymentData && (
          <div className="flex items-center gap-3">
            {selectedPaymentData.type === "card" && selectedPaymentData.cardNumber && (
              <>
                <div className="shrink-0 scale-75">
                  {getCardType(selectedPaymentData.brand, selectedPaymentData.cardNumber) === 'visa' ? (
                    <VisaLogo />
                  ) : (
                    <MastercardLogo />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                    •••• •••• {selectedPaymentData.cardNumber.slice(-4)}
                  </p>
                </div>
              </>
            )}
            {selectedPaymentData.type === "account_balance" && (
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                  Account Balance
                </p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                  Available: £{selectedPaymentData.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            )}
            {selectedPaymentData.type === "paypal" && (
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                  PayPal
                </p>
              </div>
            )}
            {selectedPaymentData.type === "bank_transfer" && (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-6 flex items-center justify-center bg-white rounded shrink-0 border border-gray-200">
                  <Landmark className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                    Bank Transfer
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowPaymentSection(!showPaymentSection)}
              className="font-['Poppins',sans-serif] text-[13px] text-[#3B82F6]"
            >
              Edit ✏️
            </button>
          </div>
        )}

        {/* Expandable Payment Selection */}
        {showPaymentSection && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
              {paymentMethods.map((method) => (
                <div key={method.id} className={`border-2 rounded-xl p-3 ${
                  selectedPayment === method.id 
                    ? "border-[#3B82F6] bg-blue-50/50" 
                    : "border-gray-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
                    {method.type === "card" && method.cardNumber && (
                      <>
                    <div className="shrink-0 scale-75">
                      {getCardType(method.brand, method.cardNumber) === 'visa' ? (
                        <VisaLogo />
                      ) : (
                        <MastercardLogo />
                      )}
                    </div>
                        <Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                            {method.cardNumber}
                          </p>
                          {method.expiryDate && (
                            <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                              Exp. {method.expiryDate}
                            </p>
                          )}
                        </Label>
                      </>
                    )}
                    {method.type === "account_balance" && (
                      <Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                          Account Balance
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                          Available: £{method.balance?.toFixed(2) || '0.00'}
                        </p>
                      </Label>
                    )}
                    {method.type === "paypal" && (
                      <Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                          PayPal
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                          Pay securely with PayPal
                        </p>
                      </Label>
                    )}
                    {method.type === "bank_transfer" && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-10 h-6 flex items-center justify-center bg-white rounded shrink-0 border border-gray-200">
                          <Landmark className="w-5 h-5 text-blue-600" />
                        </div>
                        <Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium">
                            Bank Transfer
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                            Transfer funds directly from your bank
                          </p>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Promo Code - Minimalist */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            Promo Code
          </h3>
          {!showPromoInput && !appliedPromo ? (
            <button
              onClick={() => setShowPromoInput(true)}
              className="font-['Poppins',sans-serif] text-[13px] text-[#3B82F6]"
            >
              Enter a Code
            </button>
          ) : appliedPromo ? (
            <div className="flex items-center gap-2">
              <span className="font-['Poppins',sans-serif] text-[13px] text-green-600">
                {appliedPromo.code} Applied
              </span>
              <button onClick={onRemovePromo}>
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : null}
        </div>

        {showPromoInput && !appliedPromo && (
          <div className="flex gap-2 mt-3">
            <Input
              type="text"
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 font-['Poppins',sans-serif] text-[14px] rounded-lg border-gray-200"
            />
            <Button
              onClick={handleApplyPromo}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg px-4 font-['Poppins',sans-serif] text-[13px]"
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Order Summary - Invoice Style */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-medium mb-4">
          Order Summary
        </h3>

        {/* Subtotal */}
        <div className="flex items-center justify-between py-3 border-b border-dotted border-gray-300">
          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            Subtotal price
          </span>
          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            £{subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between py-3 border-b border-dotted border-gray-300 text-green-600">
            <span className="font-['Poppins',sans-serif] text-[14px]">
              Coupon Discount %
            </span>
            <span className="font-['Poppins',sans-serif] text-[14px]">
              -£{discount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Service Fee */}
        {serviceFee > 0 && (
          <div className="flex items-center justify-between py-3 border-b border-dotted border-gray-300">
            <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
              Service Fee
            </span>
            <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
              £{serviceFee.toFixed(2)}
            </span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex items-center justify-between py-4">
          <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
            Grand Total
          </span>
          <span className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold">
            £{total.toFixed(2)}
          </span>
        </div>

        {/* Delivery Date */}
        {cartItems[0]?.booking && (
          <div className="flex items-center justify-between py-3 border-t border-dotted border-gray-300">
            <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
              Delivery Date
            </span>
            <span className="font-['Poppins',sans-serif] text-[14px] text-[#3B82F6]">
              {new Date(cartItems[0].booking.date).toLocaleDateString('en-GB', { 
                weekday: 'short',
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Place Order Button */}
      <Button 
        onClick={onPlaceOrder}
        className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white py-6 rounded-2xl transition-all duration-300 font-['Poppins',sans-serif] text-[16px] shadow-lg"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        Place order
      </Button>
    </div>
  );
}