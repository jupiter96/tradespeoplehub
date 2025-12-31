import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import ServicesBannerSection from "./ServicesBannerSection";
import type { Service as ServiceDataType } from "./servicesData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// Smart image renderer for service cards
// - Foreground: object-contain (preserves portrait/landscape ratio, centered)
// - Background: blurred version of the same image to fill leftover space
function SmartImageLayers({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  if (!src) {
    return <div className="absolute inset-0 bg-gray-200" aria-hidden="true" />;
  }

  return (
    <>
      {/* Blurred background layer */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover scale-110 blur-3xl opacity-85"
        decoding="async"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-black/15"
        aria-hidden="true"
      />
      {/* Foreground image with proper aspect ratio */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
        decoding="async"
        loading="lazy"
      />
    </>
  );
}

interface Service {
  id: number;
  _id?: string;
  slug?: string;
  image: string;
  providerName: string;
  tradingName: string;
  providerImage: string;
  providerRating?: number;
  providerReviewCount?: number;
  providerIsVerified?: boolean;
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
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(initialCount);
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
                className="relative flex flex-col cursor-pointer"
              >
                <div className="bg-white rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 flex flex-col">
                  {/* Image Section */}
                  <div className="relative w-full overflow-hidden bg-gray-100" style={{ height: '220px' }}>
                    <img
                      src={service.image}
                      alt={service.description}
                      className="w-full h-full object-cover"
                      style={{ minWidth: '100%', minHeight: '100%', objectFit: 'cover' }}
                    />
                    {/* Emergency Badge - Top Right */}
                    {service.badges && service.badges.length > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-[#FE8A0F] text-white text-[11px] font-['Poppins',sans-serif] font-semibold px-3 py-1 rounded-[6px]">
                          {service.badges[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4 pt-8 flex flex-col gap-2 flex-1">
                  {/* Provider Info with Rating */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f] leading-tight">
                      {service.tradingName.length > 12 ? `${service.tradingName.slice(0, 12)}...` : service.tradingName}
                    </h3>
                    {service.providerIsVerified && (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-[#E6F0FF] text-[#3D78CB] rounded text-[8px] font-['Poppins',sans-serif] font-medium">
                        ✓ Verified
                      </span>
                    )}
                    {/* Rating */}
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#FE8A0F] text-[#FE8A0F]" />
                      <span className="font-['Poppins',sans-serif] text-[12px] font-semibold text-[#2c353f]">
                        {service.rating || 0}
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[11px] text-[#999999]">
                        ({service.reviewCount || 0})
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-['Poppins',sans-serif] text-[20px] text-[#666666] leading-snug line-clamp-2 py-4">
                    {service.description}
                  </p>

                  {/* Delivery Badge and Price */}
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    {/* Delivery Badge - Left */}
                    <div className="flex-shrink-0">
                      {service.deliveryType === "same-day" ? (
                        <div className="px-2 py-1 border-2 border-[#FE8A0F] rounded-[6px]">
                          <span className="font-['Poppins',sans-serif] text-[9px] font-semibold text-[#FE8A0F] uppercase tracking-wide">
                            ⚡ Same day delivery
                          </span>
                        </div>
                      ) : (
                        <div className="px-2 py-1 border border-[#3D78CB] bg-[#E6F0FF] rounded-[6px] flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#3D78CB" strokeWidth="2">
                            <path d="M3 9h4l3 9 3-16 3 9h4"/>
                          </svg>
                          <span className="font-['Poppins',sans-serif] text-[9px] font-semibold text-[#3D78CB] uppercase tracking-wide">
                            Standard delivery
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Price Section - Right */}
                    <div className="flex items-center gap-2">
                      {service.originalPrice && (
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#999999] line-through">
                          {service.price}
                        </span>
                      )}
                      <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                        {service.originalPrice || service.price}/{service.priceUnit}
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
                
                {/* Avatar positioned at bottom of image, overlapping */}
                <div className="absolute left-4 z-10" style={{ top: '190px' }}>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white" style={{ padding: '4px' }}>
                      <div className="w-full h-full rounded-full" style={{ 
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)' 
                      }}></div>
                    </div>
                    <Avatar className="w-14 h-14 flex-shrink-0 relative" style={{
                      boxShadow: '0 0 0 4px white, 0 0 0 6px rgba(255,255,255,0.4), 0 4px 16px rgba(0,0,0,0.25)'
                    }}>
                      <AvatarImage src={service.providerImage} alt={service.tradingName} />
                      <AvatarFallback className="bg-[#FE8A0F] text-white text-[16px] font-semibold">
                        {service.tradingName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Discount Ribbon - Bottom Right on image */}
                {service.originalPrice && (
                  <div className="absolute right-0 z-10" style={{ top: '190px' }}>
                    {/* Ribbon shadow layer */}
                    <div className="absolute inset-0 bg-black/20 blur-sm translate-y-0.5"></div>
                    
                    {/* Main ribbon */}
                    <div className="relative overflow-hidden" style={{ 
                      background: 'linear-gradient(135deg, #FFB366 0%, #FF8C42 50%, #FF6B35 100%)',
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)'
                    }}>
                      {/* Shine effect */}
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                      }}></div>
                      
                      {/* Content */}
                      <div className="relative px-3 py-1.5 pr-4 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 drop-shadow-sm" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        <span className="font-['Poppins',sans-serif] text-[11px] font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                          {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% OFF
                        </span>
                      </div>
                      
                      {/* Ribbon fold/cut effect */}
                      <div className="absolute bottom-0 left-0 w-3 h-3" style={{
                        background: 'linear-gradient(135deg, #D94A1A 0%, #B83D15 100%)',
                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                        boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.3)'
                      }}></div>
                    </div>
                    
                    {/* Bottom stripe accent */}
                    <div className="absolute bottom-0 right-0 left-3 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                  </div>
                )}
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
                          <Avatar className="w-5 h-5 flex-shrink-0">
                            <AvatarImage src={service.providerImage} alt={service.tradingName} />
                            <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                              {service.tradingName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-['Poppins',sans-serif] text-[9px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors">
                              {service.tradingName.length > 8 ? `${service.tradingName.slice(0, 8)}...` : service.tradingName}
                            </span>
                            {service.providerIsVerified && (
                              <span className="inline-flex items-center px-1 py-0.5 bg-[#E6F0FF] text-[#3D78CB] rounded text-[7px] font-['Poppins',sans-serif] font-medium">
                                ✓ Verified
                              </span>
                            )}
                            {service.providerRating && service.providerRating > 0 ? (
                              <>
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-[#FE8A0F] text-[#FE8A0F]" />
                                  <span className="font-['Poppins',sans-serif] text-[8px] text-[#2c353f]">
                                    {service.providerRating.toFixed(1)}
                                  </span>
                                </div>
                                {service.providerReviewCount && service.providerReviewCount > 0 && (
                                  <span className="font-['Poppins',sans-serif] text-[7px] text-[#8d8d8d]">
                                    ({service.providerReviewCount} reviews)
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-[#FE8A0F] text-[#FE8A0F]" />
                                  <span className="font-['Poppins',sans-serif] text-[8px] text-[#2c353f]">
                                    0.0
                                  </span>
                                </div>
                                <span className="font-['Poppins',sans-serif] text-[8px] text-[#8d8d8d]">
                                  (0 reviews)
                                </span>
                              </>
                            )}
                          </div>
                        </Link>
                      </div>

                      {/* Description */}
                      <p className="font-['Poppins',sans-serif] text-[16px] text-[#5b5b5b] line-clamp-2 font-bold leading-snug">
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
                              <span className="font-medium">⚡ Same day delivery</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
                              <svg className="w-1.5 h-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9h4l3 9 3-16 3 9h4"/>
                              </svg>
                              <span className="font-medium">Standard delivery</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                          {/* Bottom Section - Price with Delivery Badge */}
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

                            {/* Delivery Badge - Right Bottom */}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

// Service Carousel Component for Best Sellers
function ServiceCarousel({ title, services }: ServiceGridProps) {
  const navigate = useNavigate();

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
                <div className="relative flex flex-col w-full">
                  <div 
                    onClick={() => handleServiceClick(service)}
                    className="bg-white rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Image Section */}
                    <div className="relative w-full overflow-hidden bg-gray-100" style={{ height: '220px' }}>
                      <img
                        src={service.image}
                        alt={service.description}
                        className="w-full h-full object-cover"
                        style={{ minWidth: '100%', minHeight: '100%', objectFit: 'cover' }}
                      />
                      {/* Emergency Badge - Top Right */}
                      {service.badges && service.badges.length > 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-[#FE8A0F] text-white text-[11px] font-['Poppins',sans-serif] font-semibold px-3 py-1 rounded-[6px]">
                            {service.badges[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4 pt-8 flex flex-col gap-2 flex-1">
                    {/* Provider Info with Rating */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f] leading-tight">
                        {service.tradingName.length > 12 ? `${service.tradingName.slice(0, 12)}...` : service.tradingName}
                      </h3>
                      {service.providerIsVerified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-[#E6F0FF] text-[#3D78CB] rounded text-[8px] font-['Poppins',sans-serif] font-medium">
                          ✓ Verified
                        </span>
                      )}
                      {/* Rating */}
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-[#FE8A0F] text-[#FE8A0F]" />
                        <span className="font-['Poppins',sans-serif] text-[12px] font-semibold text-[#2c353f]">
                          {service.rating || 0}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#999999]">
                          ({service.reviewCount || 0})
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#666666] leading-snug line-clamp-2 py-4">
                      {service.description}
                    </p>

                    {/* Delivery Badge and Price */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      {/* Delivery Badge - Left */}
                      <div className="flex-shrink-0">
                        {service.deliveryType === "same-day" ? (
                          <div className="px-2 py-1 border-2 border-[#FE8A0F] rounded-[6px]">
                            <span className="font-['Poppins',sans-serif] text-[9px] font-semibold text-[#FE8A0F] uppercase tracking-wide">
                              ⚡ Same day delivery
                            </span>
                          </div>
                        ) : (
                          <div className="px-2 py-1 border border-[#3D78CB] bg-[#E6F0FF] rounded-[6px] flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#3D78CB" strokeWidth="2">
                              <path d="M3 9h4l3 9 3-16 3 9h4"/>
                            </svg>
                            <span className="font-['Poppins',sans-serif] text-[9px] font-semibold text-[#3D78CB] uppercase tracking-wide">
                              Standard delivery
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Price Section - Right */}
                      <div className="flex items-center gap-2">
                        {service.originalPrice && (
                          <span className="font-['Poppins',sans-serif] text-[12px] text-[#999999] line-through">
                            {service.price}
                          </span>
                        )}
                        <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                          {service.originalPrice || service.price}/{service.priceUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  {/* Avatar positioned at bottom of image, overlapping */}
                  <div className="absolute left-4 z-10" style={{ top: '190px' }}>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-white" style={{ padding: '4px' }}>
                        <div className="w-full h-full rounded-full" style={{ 
                          boxShadow: '0 0 0 2px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)' 
                        }}></div>
                      </div>
                      <Avatar className="w-14 h-14 flex-shrink-0 relative" style={{
                        boxShadow: '0 0 0 4px white, 0 0 0 6px rgba(255,255,255,0.4), 0 4px 16px rgba(0,0,0,0.25)'
                      }}>
                        <AvatarImage src={service.providerImage} alt={service.tradingName} />
                        <AvatarFallback className="bg-[#FE8A0F] text-white text-[16px] font-semibold">
                          {service.tradingName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Discount Ribbon - Bottom Right on image */}
                  {service.originalPrice && (
                    <div className="absolute right-0 z-10" style={{ top: '190px' }}>
                      {/* Ribbon shadow layer */}
                      <div className="absolute inset-0 bg-black/20 blur-sm translate-y-0.5"></div>
                      
                      {/* Main ribbon */}
                      <div className="relative overflow-hidden" style={{ 
                        background: 'linear-gradient(135deg, #FFB366 0%, #FF8C42 50%, #FF6B35 100%)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)'
                      }}>
                        {/* Shine effect */}
                        <div className="absolute inset-0" style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                        }}></div>
                        
                        {/* Content */}
                        <div className="relative px-3 py-1.5 pr-4 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 drop-shadow-sm" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                          </svg>
                          <span className="font-['Poppins',sans-serif] text-[11px] font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                            {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% OFF
                          </span>
                        </div>
                        
                        {/* Ribbon fold/cut effect */}
                        <div className="absolute bottom-0 left-0 w-3 h-3" style={{
                          background: 'linear-gradient(135deg, #D94A1A 0%, #B83D15 100%)',
                          clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.3)'
                        }}></div>
                      </div>
                      
                      {/* Bottom stripe accent */}
                      <div className="absolute bottom-0 right-0 left-3 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                    </div>
                  )}
                </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-white hover:bg-[#FFF5EB] border-2 border-[#FE8A0F] text-[#FE8A0F] hover:text-[#FE8A0F]" />
        <CarouselNext className="hidden md:flex -right-4 bg-white hover:bg-[#FFF5EB] border-2 border-[#FE8A0F] text-[#FE8A0F] hover:text-[#FE8A0F]" />
      </Carousel>
      </div>
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
            providerRating: typeof s.professional === 'object' 
              ? s.professional.rating || 0
              : 0,
            providerReviewCount: typeof s.professional === 'object' 
              ? s.professional.reviewCount || 0
              : 0,
            providerIsVerified: (() => {
              if (typeof s.professional !== 'object') {
                return false;
              }
              
              return s.professional.isVerified || false;
            })(),
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
      providerRating: s.providerRating,
      providerReviewCount: s.providerReviewCount,
      providerIsVerified: s.providerIsVerified,
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
      providerRating: s.providerRating,
      providerReviewCount: s.providerReviewCount,
      providerIsVerified: s.providerIsVerified,
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