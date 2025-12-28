import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Star, ShoppingCart, Zap, ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import { useCart } from "./CartContext";
import ServicesBannerSection from "./ServicesBannerSection";
import AddToCartModal from "./AddToCartModal";
import type { Service as ServiceDataType } from "./servicesData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Service {
  id: number;
  _id?: string;
  slug?: string;
  image: string;
  providerName: string;
  tradingName: string;
  providerImage: string;
  description: string;
  rating: number;
  reviewCount: number;
  completedTasks: number;
  price: string;
  originalPrice?: string;
  priceUnit: string;
  badges?: string[];
  deliveryType: "same-day" | "standard";
}

interface ServiceGridProps {
  title: string;
  services: Service[];
  sectionId: string;
}

type ViewMode = 'pane' | 'list';

function ServiceGrid({ title, services, sectionId, initialCount = 8 }: ServiceGridProps & { initialCount?: number }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedServiceForCart, setSelectedServiceForCart] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pane');

  const handleViewMore = () => {
    setVisibleCount(prev => Math.min(prev + 8, services.length));
  };

  const handleServiceClick = (service: Service) => {
    const identifier = service.slug || service._id || service.id;
    navigate(`/service/${identifier}`);
  };

  const hasMore = visibleCount < services.length;

  return (
    <div className="w-full mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[20px] md:text-[24px]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle - Mobile Only */}
          <div className="md:hidden flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pane')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'pane'
                  ? 'bg-white text-[#FE8A0F] shadow-sm'
                  : 'text-gray-500'
              }`}
              aria-label="Pane view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#FE8A0F] shadow-sm'
                  : 'text-gray-500'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {hasMore && (
            <button 
              onClick={handleViewMore}
              className="text-[#3d78cb] font-['Poppins',sans-serif] text-[14px] hover:text-[#2d68bb] transition-colors cursor-pointer"
            >
              View more
            </button>
          )}
        </div>
      </div>

      {/* Pane View - Grid Container */}
      {viewMode === 'pane' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {services.slice(0, visibleCount).map((service) => {
            const uniqueId = `${sectionId}-${service.slug || service._id || service.id}`;
            return (
              <div
                key={uniqueId}
                onClick={() => handleServiceClick(service)}
                className="bg-white rounded-[10px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-[110px] md:h-[170px]">
                  <img
                    src={service.image}
                    alt={service.description}
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  {service.badges && service.badges.length > 0 && (
                    <div className="absolute top-2 md:top-3 right-2 md:right-3 flex flex-col gap-1">
                      {service.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="bg-[#FE8A0F] text-white text-[9px] md:text-[10px] font-['Poppins',sans-serif] font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-2 md:p-4 flex flex-col flex-1">
                  {/* Description */}
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#5b5b5b] mb-1.5 md:mb-2 line-clamp-2 font-medium leading-snug">
                    {service.description.length > 55 ? `${service.description.slice(0, 55)}...` : service.description}
                  </p>

                  {/* Star Rating */}
                  <div className="flex items-center justify-between mb-1.5 md:mb-2 min-h-[16px] md:min-h-[20px]">
                    {service.reviewCount > 0 ? (
                      <>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${
                                star <= Math.floor(service.rating)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : star - 0.5 <= service.rating
                                  ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                                  : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <span className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#2c353f]">
                            {service.rating}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[9px] md:text-[12px] text-[#8d8d8d]">
                            ({service.completedTasks})
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full">{/* Empty space to maintain card height */}</div>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="mb-2 md:mb-3">
                    {/* Current Price */}
                    <div className={service.originalPrice ? "mb-0.5" : ""}>
                      <span className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#5b5b5b]">
                        {service.originalPrice && "From "}
                        <span className="text-[14px] md:text-[18px] text-[#2c353f]">
                          {service.originalPrice || service.price}
                        </span>
                        /{service.priceUnit}
                      </span>
                    </div>
                    {/* Original Price and Discount Badge */}
                    {service.originalPrice && (
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[16px] text-[#c0c0c0] line-through">
                          {service.price}
                        </span>
                        <div className="px-1 md:px-2 py-0.5 bg-[#E6F0FF] rounded-md">
                          <span className="font-['Poppins',sans-serif] text-[8px] md:text-[11px] text-[#3D78CB]">
                            {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% OFF
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Badge and Add to Cart Button - Single Row */}
                  <div className="flex items-center justify-between gap-2 mt-auto mb-2 md:mb-3">
                    {/* Delivery Badge */}
                    <div className="flex-shrink-0">
                      {service.deliveryType === "same-day" ? (
                        <div className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 bg-white border-2 border-[#FE8A0F] text-[#FE8A0F] font-['Poppins',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                          <span className="font-medium heartbeat-text">⚡ Same Day</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                          <svg className="w-2 h-2 md:w-2.5 md:h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9h4l3 9 3-16 3 9h4"/>
                          </svg>
                          <span className="font-medium">Standard</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServiceForCart(service);
                        setShowAddToCartModal(true);
                      }}
                      className="flex-1 h-[26px] md:h-[32px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_8px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                    >
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                      Add to cart
                    </button>
                  </div>

                  {/* Provider Info - Moved to bottom */}
                  <div className="flex items-center gap-1.5 md:gap-2 pt-2 md:pt-3 border-t border-gray-100">
                    <Link to={`/profile/117`} className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
                      <Avatar className="w-6 h-6 md:w-8 md:h-8">
                        <AvatarImage src={service.providerImage} alt={service.tradingName} />
                        <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] md:text-[12px] font-semibold">
                          {service.tradingName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-['Poppins',sans-serif] text-[11px] md:text-[14px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                        {service.tradingName}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {services.slice(0, visibleCount).map((service) => {
            const uniqueId = `${sectionId}-list-${service.id}`;
            return (
              <div
                key={uniqueId}
                onClick={() => handleServiceClick(service.id)}
                className="bg-white rounded-lg shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_12px_0px_rgba(254,138,15,0.3)] overflow-hidden transition-shadow duration-300 cursor-pointer flex min-h-[120px]"
              >
                {/* Image Section - Left Side */}
                <div className="relative w-[100px] flex-shrink-0">
                  <img
                    src={service.image}
                    alt={service.description}
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  {service.badges && service.badges.length > 0 && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-[#FE8A0F] text-white text-[8px] font-['Poppins',sans-serif] font-semibold px-1.5 py-0.5 rounded-full shadow-md">
                        {service.badges[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section - Right Side */}
                <div className="flex-1 p-3 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {/* Top Section */}
                    <div className="space-y-1.5 mb-2">
                      {/* Provider Info */}
                      <div className="flex items-center gap-1.5">
                        <Link to={`/profile/117`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={service.providerImage} alt={service.tradingName} />
                            <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                              {service.tradingName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-['Poppins',sans-serif] text-[11px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                            {service.tradingName}
                          </span>
                        </Link>
                      </div>

                      {/* Description */}
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#5b5b5b] line-clamp-2 font-medium leading-snug">
                        {service.description.length > 55 ? `${service.description.slice(0, 55)}...` : service.description}
                      </p>

                      {/* Star Rating & Delivery Badge Row */}
                      <div className="flex items-center justify-between gap-2">
                        {service.reviewCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-2.5 h-2.5 ${
                                    star <= Math.floor(service.rating)
                                      ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                      : star - 0.5 <= service.rating
                                      ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                                      : "fill-[#E5E5E5] text-[#E5E5E5]"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-['Poppins',sans-serif] text-[9px] text-[#2c353f]">
                              {service.rating}
                            </span>
                            <span className="font-['Poppins',sans-serif] text-[8px] text-[#8d8d8d]">
                              ({service.completedTasks})
                            </span>
                          </div>
                        ) : (
                          <div></div>
                        )}

                        {/* Delivery Badge */}
                        <div className="flex-shrink-0">
                          {service.deliveryType === "same-day" ? (
                            <div className="inline-flex items-center px-1.5 py-0.5 bg-white border border-[#FE8A0F] text-[#FE8A0F] font-['Poppins',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
                              <span className="font-medium">⚡ Same Day</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
                              <svg className="w-1.5 h-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9h4l3 9 3-16 3 9h4"/>
                              </svg>
                              <span className="font-medium">Standard</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Price & Buttons */}
                  <div className="flex items-end justify-between gap-2 mt-auto">
                    {/* Price - Left Bottom */}
                    <div className="flex flex-col">
                      {service.originalPrice && (
                        <span className="font-['Poppins',sans-serif] text-[9px] text-[#c0c0c0] line-through">
                          {service.price}
                        </span>
                      )}
                      <span className="font-['Poppins',sans-serif] text-[9px] text-[#5b5b5b]">
                        {service.originalPrice && "From "}
                        <span className="text-[14px] text-[#2c353f] font-medium">
                          {service.originalPrice || service.price}
                        </span>
                        <span className="text-[9px]">/{service.priceUnit}</span>
                      </span>
                    </div>

                    {/* Action Buttons - Right Bottom */}
                    <div className="flex items-center gap-2">
                      <button className="h-[28px] w-[28px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_10px_rgba(254,138,15,0.5)] text-white rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServiceForCart(service);
                          setShowAddToCartModal(true);
                        }}
                        className="h-[28px] w-[28px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_6px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Cart Modal */}
      {selectedServiceForCart && (
        <AddToCartModal
          isOpen={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          onConfirm={(data) => {
            // Find the full service data from allServices to get addons and packages
            const fullService = allServices.find(s => (s._id || s.id) === (selectedServiceForCart._id || selectedServiceForCart.id));
            
            const selectedAddonsData = fullService?.addons
              ?.filter(addon => data.selectedAddons.includes(addon.id))
              .map(addon => ({
                id: addon.id,
                title: addon.title,
                price: addon.price
              })) || [];

            addToCart({
              id: (selectedServiceForCart._id || selectedServiceForCart.id).toString(),
              title: selectedServiceForCart.description,
              seller: selectedServiceForCart.tradingName,
              price: data.packageType && fullService?.packages 
                ? fullService.packages.find(p => p.type === data.packageType)?.price || parseFloat(selectedServiceForCart.price)
                : parseFloat(selectedServiceForCart.price),
              image: selectedServiceForCart.image,
              rating: selectedServiceForCart.rating,
              addons: selectedAddonsData.length > 0 ? selectedAddonsData : undefined,
              booking: data.booking ? {
                date: data.booking.date.toISOString(),
                time: data.booking.time,
                timeSlot: data.booking.timeSlot
              } : undefined,
              packageType: data.packageType
            }, data.quantity);
            
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          serviceTitle={selectedServiceForCart.description}
          sellerName={selectedServiceForCart.tradingName}
          basePrice={parseFloat(selectedServiceForCart.price)}
          addons={allServices.find(s => (s._id || s.id) === (selectedServiceForCart._id || selectedServiceForCart.id))?.addons || []}
          packages={allServices.find(s => (s._id || s.id) === (selectedServiceForCart._id || selectedServiceForCart.id))?.packages || []}
          serviceImage={selectedServiceForCart.image}
        />
      )}
    </div>
  );
}

// Service Carousel Component for Best Sellers
function ServiceCarousel({ title, services }: ServiceGridProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedServiceForCart, setSelectedServiceForCart] = useState<Service | null>(null);

  const handleServiceClick = (service: Service) => {
    const identifier = service.slug || service._id || service.id;
    navigate(`/service/${identifier}`);
  };

  return (
    <div className="w-full mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[20px] md:text-[24px]">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="px-2 pb-20">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full overflow-visible"
        >
          <CarouselContent className="-ml-2 md:-ml-3 flex items-stretch pb-4">
            {services.map((service) => (
              <CarouselItem key={service.id} className="pl-2 md:pl-3 basis-1/2 sm:basis-1/2 lg:basis-1/4 flex">
                <div 
                  onClick={() => handleServiceClick(service)}
                  className="bg-white rounded-[10px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 cursor-pointer flex flex-col w-full"
                >
                  {/* Image Section */}
                  <div className="relative h-[110px] md:h-[170px]">
                  <img
                    src={service.image}
                    alt={service.description}
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  {service.badges && service.badges.length > 0 && (
                    <div className="absolute top-2 md:top-3 right-2 md:right-3 flex flex-col gap-1">
                      {service.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="bg-[#FE8A0F] text-white text-[8px] md:text-[10px] font-['Poppins',sans-serif] font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-2 md:p-4 flex flex-col flex-1">
                  {/* Description */}
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#5b5b5b] mb-1.5 md:mb-2 line-clamp-2 font-medium leading-snug">
                    {service.description.length > 55 ? `${service.description.slice(0, 55)}...` : service.description}
                  </p>

                  {/* Star Rating */}
                  <div className="flex items-center justify-between mb-1.5 md:mb-2 min-h-[16px] md:min-h-[20px]">
                    {service.reviewCount > 0 ? (
                      <>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${
                                star <= Math.floor(service.rating)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : star - 0.5 <= service.rating
                                  ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                                  : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <span className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#2c353f]">
                            {service.rating}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[9px] md:text-[12px] text-[#8d8d8d]">
                            ({service.completedTasks})
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full">{/* Empty space to maintain card height */}</div>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="mb-2 md:mb-3">
                    {/* Current Price */}
                    <div className={service.originalPrice ? "mb-0.5" : ""}>
                      <span className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#5b5b5b]">
                        {service.originalPrice && "From "}
                        <span className="text-[14px] md:text-[18px] text-[#2c353f]">
                          {service.originalPrice || service.price}
                        </span>
                        /{service.priceUnit}
                      </span>
                    </div>
                    {/* Original Price and Discount Badge */}
                    {service.originalPrice && (
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[16px] text-[#c0c0c0] line-through">
                          {service.price}
                        </span>
                        <div className="px-1 md:px-2 py-0.5 bg-[#E6F0FF] rounded-md">
                          <span className="font-['Poppins',sans-serif] text-[8px] md:text-[11px] text-[#3D78CB]">
                            {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% OFF
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Badge and Add to Cart Button - Single Row */}
                  <div className="flex items-center justify-between gap-2 mt-auto mb-2 md:mb-3">
                    {/* Delivery Badge */}
                    <div className="flex-shrink-0">
                      {service.deliveryType === "same-day" ? (
                        <div className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 bg-white border-2 border-[#FE8A0F] text-[#FE8A0F] font-['Poppins',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                          <span className="font-medium heartbeat-text">⚡ Same Day</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                          <svg className="w-2 h-2 md:w-2.5 md:h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9h4l3 9 3-16 3 9h4"/>
                          </svg>
                          <span className="font-medium">Standard</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServiceForCart(service);
                        setShowAddToCartModal(true);
                      }}
                      className="flex-1 h-[26px] md:h-[32px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_8px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                    >
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                      Add to cart
                    </button>
                  </div>

                  {/* Provider Info - Moved to bottom */}
                  <div className="flex items-center gap-1.5 md:gap-2 pt-2 md:pt-3 border-t border-gray-100">
                    <Link to={`/profile/117`} className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
                      <Avatar className="w-6 h-6 md:w-8 md:h-8">
                        <AvatarImage src={service.providerImage} alt={service.tradingName} />
                        <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] md:text-[12px] font-semibold">
                          {service.tradingName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-['Poppins',sans-serif] text-[11px] md:text-[14px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                        {service.tradingName}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-white hover:bg-[#FFF5EB] border-2 border-[#FE8A0F] text-[#FE8A0F] hover:text-[#FE8A0F]" />
        <CarouselNext className="hidden md:flex -right-4 bg-white hover:bg-[#FFF5EB] border-2 border-[#FE8A0F] text-[#FE8A0F] hover:text-[#FE8A0F]" />
      </Carousel>
      </div>

      {/* Add to Cart Modal */}
      {selectedServiceForCart && (
        <AddToCartModal
          isOpen={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          onConfirm={(data) => {
            // Find the full service data from allServices to get addons and packages
            const fullService = allServices.find(s => (s._id || s.id) === (selectedServiceForCart._id || selectedServiceForCart.id));
            
            const selectedAddonsData = fullService?.addons
              ?.filter(addon => data.selectedAddons.includes(addon.id))
              .map(addon => ({
                id: addon.id,
                title: addon.title,
                price: addon.price
              })) || [];

            addToCart({
              id: (selectedServiceForCart._id || selectedServiceForCart.id).toString(),
              title: selectedServiceForCart.description,
              seller: selectedServiceForCart.tradingName,
              price: data.packageType && fullService?.packages 
                ? fullService.packages.find(p => p.type === data.packageType)?.price || parseFloat(selectedServiceForCart.price)
                : parseFloat(selectedServiceForCart.price),
              image: selectedServiceForCart.image,
              rating: selectedServiceForCart.rating,
              addons: selectedAddonsData.length > 0 ? selectedAddonsData : undefined,
              booking: data.booking ? {
                date: data.booking.date.toISOString(),
                time: data.booking.time,
                timeSlot: data.booking.timeSlot
              } : undefined,
              packageType: data.packageType
            }, data.quantity);
            
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          serviceTitle={selectedServiceForCart.description}
          sellerName={selectedServiceForCart.tradingName}
          basePrice={parseFloat(selectedServiceForCart.price)}
          addons={allServices.find(s => (s._id || s.id) === (selectedServiceForCart._id || selectedServiceForCart.id))?.addons || []}
          packages={allServices.find(s => (s._id || s.id) === (selectedServiceForCart._id || selectedServiceForCart.id))?.packages || []}
          serviceImage={selectedServiceForCart.image}
        />
      )}
    </div>
  );
}

export default function FeaturedServices() {
  // Fetch services from API
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { resolveApiUrl } = await import("../config/api");
        const response = await fetch(
          resolveApiUrl(`/api/services?activeOnly=true&status=approved&limit=100`),
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          const transformed = (data.services || []).map((s: any) => ({
            id: parseInt(s._id?.slice(-8), 16) || Math.floor(Math.random() * 10000),
            _id: s._id,
            slug: s.slug,
            image: s.images?.[0] || s.portfolioImages?.[0] || "",
            providerName: typeof s.professional === 'object' 
              ? `${s.professional.firstName} ${s.professional.lastName}` 
              : "",
            tradingName: typeof s.professional === 'object' 
              ? s.professional.tradingName || ""
              : "",
            providerImage: typeof s.professional === 'object' 
              ? s.professional.avatar || ""
              : "",
            description: s.title || "",
            category: typeof s.serviceCategory === 'object' && typeof s.serviceCategory.sector === 'object'
              ? s.serviceCategory.sector.name || ""
              : "",
            subcategory: typeof s.serviceCategory === 'object'
              ? s.serviceCategory.name || ""
              : "",
            detailedSubcategory: typeof s.serviceSubCategory === 'object'
              ? s.serviceSubCategory.name || ""
              : undefined,
            rating: s.rating || 0,
            reviewCount: s.reviewCount || 0,
            completedTasks: s.completedTasks || 0,
            price: `£${s.price?.toFixed(2) || '0.00'}`,
            // Only treat originalPrice as active discount if it is set and still within its valid date range
            originalPrice: (s.originalPrice && (
              (!s.originalPriceValidFrom || new Date(s.originalPriceValidFrom) <= new Date()) &&
              (!s.originalPriceValidUntil || new Date(s.originalPriceValidUntil) >= new Date())
            ))
              ? `£${s.originalPrice.toFixed(2)}`
              : undefined,
            priceUnit: s.priceUnit || "fixed",
            badges: s.badges || [],
            deliveryType: s.deliveryType || "standard",
            postcode: s.postcode || "",
            location: s.location || "",
            latitude: s.latitude,
            longitude: s.longitude,
            highlights: s.highlights || [],
            addons: s.addons?.map((a: any) => ({
              id: a.id || a._id,
              name: a.name,
              description: a.description || "",
              price: a.price,
            })) || [],
            idealFor: s.idealFor || [],
            specialization: "",
            packages: s.packages?.map((p: any) => ({
              id: p.id || p._id,
              name: p.name,
              price: `£${p.price?.toFixed(2) || '0.00'}`,
              originalPrice: p.originalPrice ? `£${p.originalPrice.toFixed(2)}` : undefined,
              priceUnit: "fixed",
              description: p.description || "",
              highlights: [],
              features: p.features || [],
              deliveryTime: p.deliveryDays ? `${p.deliveryDays} days` : undefined,
              revisions: p.revisions || "",
            })) || [],
            skills: s.skills || [],
            responseTime: s.responseTime || "",
            portfolioImages: s.portfolioImages || [],
          }));
          setAllServices(transformed);
        } else {
          setAllServices([]);
        }
      } catch (error) {
        // console.error("Error fetching services:", error);
        setAllServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Shuffle array function for random selection
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get featured services - random 4 from all approved services
  const featuredServices: Service[] = shuffleArray(allServices)
    .slice(0, 4)
    .map(s => ({
      id: s.id,
      _id: s._id,
      slug: s.slug,
      image: s.image,
      providerName: s.providerName,
      tradingName: s.tradingName,
      providerImage: s.providerImage,
      description: s.description,
      rating: s.rating,
      reviewCount: s.reviewCount,
      completedTasks: s.completedTasks,
      price: s.price,
      originalPrice: s.originalPrice,
      priceUnit: s.priceUnit,
      badges: s.badges,
      deliveryType: s.deliveryType,
      addons: s.addons,
      packages: s.packages,
    }));

  // Get popular/best sellers services - random 4 from all approved services (can overlap with featured)
  const popularServices: Service[] = shuffleArray(allServices)
    .slice(0, 4)
    .map(s => ({
      id: s.id,
      _id: s._id,
      slug: s.slug,
      image: s.image,
      providerName: s.providerName,
      tradingName: s.tradingName,
      providerImage: s.providerImage,
      description: s.description,
      rating: s.rating,
      reviewCount: s.reviewCount,
      completedTasks: s.completedTasks,
      price: s.price,
      originalPrice: s.originalPrice,
      priceUnit: s.priceUnit,
      badges: s.badges,
      deliveryType: s.deliveryType,
      addons: s.addons,
      packages: s.packages,
    }));

  return (
    <div className="w-full">
      <ServiceGrid 
        title="Featured Services" 
        services={featuredServices} 
        sectionId="featured"
        initialCount={4}
      />
      
      {/* Services Banner Section */}
      <ServicesBannerSection />
      
      <ServiceCarousel 
        title="Best Sellers" 
        services={popularServices} 
        sectionId="popular"
      />
    </div>
  );
}