import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Star, ShoppingCart, Zap, ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import { useCart } from "./CartContext";
import ServicesBannerSection from "./ServicesBannerSection";
import AddToCartModal from "./AddToCartModal";
import { allServices, type Service as ServiceDataType } from "./servicesData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

interface Service {
  id: number;
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

  const handleServiceClick = (serviceId: number) => {
    navigate(`/service/${serviceId}`);
  };

  const hasMore = visibleCount < services.length;

  return (
    <div className="w-full mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-['Roboto',sans-serif] text-[#2c353f] text-[20px] md:text-[24px]">
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
              className="text-[#3d78cb] font-['Roboto',sans-serif] text-[14px] hover:text-[#2d68bb] transition-colors cursor-pointer"
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
            const uniqueId = `${sectionId}-${service.id}`;
            return (
              <div
                key={uniqueId}
                onClick={() => handleServiceClick(service.id)}
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
                          className="bg-[#FE8A0F] text-white text-[9px] md:text-[10px] font-['Roboto',sans-serif] font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-2 md:p-4 flex flex-col flex-1">
                  {/* Provider Info */}
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 min-h-[24px] md:min-h-[32px]">
                    <Link to={`/profile/117`} className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
                      <img
                        src={service.providerImage}
                        alt={service.tradingName}
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                      />
                      <span className="font-['Roboto',sans-serif] text-[11px] md:text-[14px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                        {service.tradingName}
                      </span>
                    </Link>
                  </div>

                  {/* Description */}
                  <p className="font-['Roboto',sans-serif] text-[10px] md:text-[13px] text-[#5b5b5b] mb-2 md:mb-3 h-[28px] md:h-[36px] line-clamp-2">
                    {service.description}
                  </p>

                  {/* Star Rating */}
                  <div className="flex items-center justify-between mb-2 md:mb-3 min-h-[16px] md:min-h-[20px]">
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
                          <span className="font-['Roboto',sans-serif] text-[10px] md:text-[13px] text-[#2c353f]">
                            {service.rating}
                          </span>
                          <span className="font-['Roboto',sans-serif] text-[9px] md:text-[12px] text-[#8d8d8d]">
                            ({service.completedTasks})
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full">{/* Empty space to maintain card height */}</div>
                    )}
                  </div>

                  {/* Price and Delivery Section */}
                  <div className="mb-2 md:mb-4">
                    {/* Original Price Row - Fixed Height */}
                    <div className="h-[18px] md:h-[24px] mb-0.5 md:mb-1 flex items-center">
                      {service.originalPrice ? (
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="font-['Roboto',sans-serif] text-[12px] md:text-[16px] text-[#c0c0c0] line-through">
                            £{service.originalPrice}
                          </span>
                          <div className="px-1 md:px-2 py-0.5 bg-[#E6F0FF] rounded-md">
                            <span className="font-['Roboto',sans-serif] text-[8px] md:text-[11px] text-[#3D78CB]">
                              {Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)}% OFF
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    
                    {/* Current Price and Delivery Badge */}
                    <div className="flex items-center justify-between gap-1 md:gap-2">
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="font-['Roboto',sans-serif] text-[10px] md:text-[13px] text-[#5b5b5b]">
                          {service.originalPrice && "From "}
                          <span className="text-[14px] md:text-[18px] text-[#2c353f]">
                            £{service.price}
                          </span>
                          /{service.priceUnit}
                        </span>
                      </div>
                      
                      {/* Delivery Badge */}
                      <div className="flex-shrink-0">
                        {service.deliveryType === "same-day" ? (
                          <div className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 bg-white border-2 border-[#FE8A0F] text-[#FE8A0F] font-['Roboto',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                            <span className="font-medium heartbeat-text">⚡ Same Day</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Roboto',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                            <svg className="w-2 h-2 md:w-2.5 md:h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9h4l3 9 3-16 3 9h4"/>
                            </svg>
                            <span className="font-medium">Standard</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Pushed to bottom with mt-auto */}
                  <div className="flex flex-col gap-1.5 md:gap-2 items-center mt-auto">
                    <button className="w-[80%] h-[26px] md:h-[32px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_15px_rgba(254,138,15,0.6)] text-white rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]">
                      <Zap className="w-3 h-3 md:w-4 md:h-4" />
                      Buy Now!
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServiceForCart(service);
                        setShowAddToCartModal(true);
                      }}
                      className="w-[80%] h-[26px] md:h-[32px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_8px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                    >
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                      Add to cart
                    </button>
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
                      <span className="bg-[#FE8A0F] text-white text-[8px] font-['Roboto',sans-serif] font-semibold px-1.5 py-0.5 rounded-full shadow-md">
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
                          <img
                            src={service.providerImage}
                            alt={service.tradingName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-['Roboto',sans-serif] text-[11px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                            {service.tradingName}
                          </span>
                        </Link>
                      </div>

                      {/* Description */}
                      <p className="font-['Roboto',sans-serif] text-[10px] text-[#5b5b5b] line-clamp-2">
                        {service.description}
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
                            <span className="font-['Roboto',sans-serif] text-[9px] text-[#2c353f]">
                              {service.rating}
                            </span>
                            <span className="font-['Roboto',sans-serif] text-[8px] text-[#8d8d8d]">
                              ({service.completedTasks})
                            </span>
                          </div>
                        ) : (
                          <div></div>
                        )}

                        {/* Delivery Badge */}
                        <div className="flex-shrink-0">
                          {service.deliveryType === "same-day" ? (
                            <div className="inline-flex items-center px-1.5 py-0.5 bg-white border border-[#FE8A0F] text-[#FE8A0F] font-['Roboto',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
                              <span className="font-medium">⚡ Same Day</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Roboto',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
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
                        <span className="font-['Roboto',sans-serif] text-[9px] text-[#c0c0c0] line-through">
                          £{service.originalPrice}
                        </span>
                      )}
                      <span className="font-['Roboto',sans-serif] text-[9px] text-[#5b5b5b]">
                        {service.originalPrice && "From "}
                        <span className="text-[14px] text-[#2c353f] font-medium">
                          £{service.price}
                        </span>
                        <span className="text-[9px]">/{service.priceUnit}</span>
                      </span>
                    </div>

                    {/* Action Buttons - Right Bottom */}
                    <div className="flex items-center gap-2">
                      <button className="h-[28px] w-[28px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_10px_rgba(254,138,15,0.5)] text-white rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServiceForCart(service);
                          setShowAddToCartModal(true);
                        }}
                        className="h-[28px] w-[28px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_6px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center"
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
            const fullService = allServices.find(s => s.id === selectedServiceForCart.id);
            
            const selectedAddonsData = fullService?.addons
              ?.filter(addon => data.selectedAddons.includes(addon.id))
              .map(addon => ({
                id: addon.id,
                title: addon.title,
                price: addon.price
              })) || [];

            addToCart({
              id: selectedServiceForCart.id.toString(),
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
          addons={allServices.find(s => s.id === selectedServiceForCart.id)?.addons || []}
          packages={allServices.find(s => s.id === selectedServiceForCart.id)?.packages || []}
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

  const handleServiceClick = (serviceId: number) => {
    navigate(`/service/${serviceId}`);
  };

  return (
    <div className="w-full mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-['Roboto',sans-serif] text-[#2c353f] text-[20px] md:text-[24px]">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="px-2 pb-4">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-3">
            {services.map((service) => (
              <CarouselItem key={service.id} className="pl-2 md:pl-3 basis-1/2 sm:basis-1/2 lg:basis-1/4">
                <div 
                  onClick={() => handleServiceClick(service.id)}
                  className="bg-white rounded-[8px] shadow-[0px_3px_10px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_14px_0px_rgba(254,138,15,0.35)] overflow-hidden transition-shadow duration-300 cursor-pointer h-full"
                >
                  {/* Image Section */}
                  <div className="relative h-[100px] md:h-[140px]">
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
                          className="bg-[#FE8A0F] text-white text-[9px] md:text-[10px] font-['Roboto',sans-serif] font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-2 md:p-3">
                  {/* Provider Info */}
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                    <Link to={`/profile/117`} className="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity">
                      <img
                        src={service.providerImage}
                        alt={service.tradingName}
                        className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover"
                      />
                      <span className="font-['Roboto',sans-serif] text-[10px] md:text-[12px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                        {service.tradingName}
                      </span>
                    </Link>
                  </div>

                  {/* Description */}
                  <p className="font-['Roboto',sans-serif] text-[9px] md:text-[11px] text-[#5b5b5b] mb-1.5 md:mb-2 min-h-[26px] md:min-h-[30px] line-clamp-2">
                    {service.description}
                  </p>

                  {/* Star Rating */}
                  <div className="flex items-center justify-between mb-1.5 md:mb-2">
                    {service.reviewCount > 0 ? (
                      <>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-2.5 h-2.5 md:w-3 md:h-3 ${
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
                          <span className="font-['Roboto',sans-serif] text-[9px] md:text-[11px] text-[#2c353f]">
                            {service.rating}
                          </span>
                          <span className="font-['Roboto',sans-serif] text-[8px] md:text-[10px] text-[#8d8d8d]">
                            ({service.completedTasks})
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-2.5 md:h-3 w-full">{/* Empty space to maintain card height */}</div>
                    )}
                  </div>

                  {/* Price and Delivery Section */}
                  <div className="mb-2 md:mb-3">
                    <div className="flex items-center justify-between mb-0.5 min-h-[16px] md:min-h-[20px]">
                      {service.originalPrice ? (
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <span className="font-['Roboto',sans-serif] text-[11px] md:text-[13px] text-[#c0c0c0] line-through">
                            £{service.originalPrice}
                          </span>
                          <div className="px-1 md:px-1.5 py-0.5 bg-[#E6F0FF] rounded-md">
                            <span className="font-['Roboto',sans-serif] text-[7px] md:text-[9px] text-[#3D78CB]">
                              {Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)}% OFF
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 md:gap-2">
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <span className="font-['Roboto',sans-serif] text-[9px] md:text-[11px] text-[#5b5b5b]">
                          {service.originalPrice && "From "}
                          <span className="text-[13px] md:text-[15px] text-[#2c353f]">
                            £{service.price}
                          </span>
                          /{service.priceUnit}
                        </span>
                      </div>
                      
                      {/* Delivery Badge */}
                      <div className="flex-shrink-0">
                        {service.deliveryType === "same-day" ? (
                          <div className="inline-flex items-center px-1 md:px-1.5 py-0.5 bg-white border-2 border-[#FE8A0F] text-[#FE8A0F] font-['Roboto',sans-serif] text-[7px] md:text-[8px] tracking-wide uppercase rounded-sm">
                            <span className="font-medium heartbeat-text">⚡ Same Day</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Roboto',sans-serif] text-[7px] md:text-[8px] tracking-wide uppercase rounded-sm">
                            <svg className="w-1.5 h-1.5 md:w-2 md:h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9h4l3 9 3-16 3 9h4"/>
                            </svg>
                            <span className="font-medium">Standard</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1 md:gap-1.5 items-center">
                    <button className="w-[80%] h-[24px] md:h-[28px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_12px_rgba(254,138,15,0.5)] text-white rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-1.5 text-[9px] md:text-[11px]">
                      <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Buy Now!
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServiceForCart(service);
                        setShowAddToCartModal(true);
                      }}
                      className="w-[80%] h-[24px] md:h-[28px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_6px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-1.5 text-[9px] md:text-[11px]"
                    >
                      <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Add to cart
                    </button>
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
            const fullService = allServices.find(s => s.id === selectedServiceForCart.id);
            
            const selectedAddonsData = fullService?.addons
              ?.filter(addon => data.selectedAddons.includes(addon.id))
              .map(addon => ({
                id: addon.id,
                title: addon.title,
                price: addon.price
              })) || [];

            addToCart({
              id: selectedServiceForCart.id.toString(),
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
          addons={allServices.find(s => s.id === selectedServiceForCart.id)?.addons || []}
          packages={allServices.find(s => s.id === selectedServiceForCart.id)?.packages || []}
          serviceImage={selectedServiceForCart.image}
        />
      )}
    </div>
  );
}

export default function FeaturedServices() {
  // Get featured services from allServices - mapping IDs to ensure correct data
  const featuredServiceIds = [1, 4, 7, 11, 51, 26, 31, 42]; // Selected service IDs from allServices
  const mappedFeaturedServices: Service[] = featuredServiceIds
    .map(id => {
      const service = allServices.find(s => s.id === id);
      if (!service) return null;
      return {
        id: service.id,
        image: service.image,
        providerName: service.providerName,
        tradingName: service.tradingName,
        providerImage: service.providerImage,
        description: service.description,
        rating: service.rating,
        reviewCount: service.reviewCount,
        completedTasks: service.completedTasks,
        price: service.price,
        originalPrice: service.originalPrice,
        priceUnit: service.priceUnit,
        badges: service.badges,
        deliveryType: service.deliveryType,
      };
    })
    .filter((s): s is Service => s !== null);
  
  // Ensure we have at least 8 services for the grid
  const featuredServices: Service[] = mappedFeaturedServices.length >= 8 
    ? mappedFeaturedServices 
    : [
    ...mappedFeaturedServices,
    ...allServices
      .filter(s => !featuredServiceIds.includes(s.id) && s.rating >= 4.5 && s.reviewCount > 50)
      .slice(0, 8 - mappedFeaturedServices.length)
      .map(s => ({
        id: s.id,
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
      }))
  ];

  // Get popular/best sellers services from allServices
  const popularServiceIds = [2, 6, 14, 18, 25, 30, 37, 46, 53, 60]; // High-rated service IDs
  const popularServices: Service[] = popularServiceIds
    .map(id => {
      const service = allServices.find(s => s.id === id);
      if (!service) return null;
      return {
        id: service.id,
        image: service.image,
        providerName: service.providerName,
        tradingName: service.tradingName,
        providerImage: service.providerImage,
        description: service.description,
        rating: service.rating,
        reviewCount: service.reviewCount,
        completedTasks: service.completedTasks,
        price: service.price,
        originalPrice: service.originalPrice,
        priceUnit: service.priceUnit,
        badges: service.badges,
        deliveryType: service.deliveryType,
      };
    })
    .filter((s): s is Service => s !== null);

  return (
    <div className="w-full">
      <ServiceGrid 
        title="Featured Services" 
        services={featuredServices} 
        sectionId="featured"
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