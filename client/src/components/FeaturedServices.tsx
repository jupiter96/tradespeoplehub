import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, Grid, List, Heart, MapPin, BadgeCheck, Medal } from "lucide-react";
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

// Badge types for random selection
const availableBadges = [
  { type: "bestSeller", label: "#1 Best Seller", bgColor: "bg-[#FF6B00]", textColor: "text-white" },
];

// Helper function to get random badges for each card (excluding verified)
const getRandomBadges = (serviceId: number) => {
  // Service ID 1 should have no badges
  if (serviceId === 1) {
    return [];
  }
  
  // Use serviceId as seed for consistent random selection per card
  const seed = serviceId;
  const numBadges = Math.floor((seed * 7919) % 4); // 0-3 badges
  const selectedBadges = [];
  
  for (let i = 0; i < numBadges; i++) {
    const index = (seed * (i + 1) * 13) % availableBadges.length;
    const badge = availableBadges[index];
    if (!selectedBadges.find(b => b.type === badge.type)) {
      selectedBadges.push(badge);
    }
  }
  
  return selectedBadges;
};

// Helper function to check if service has verified badge
const isVerified = (serviceId: number) => {
  // Service ID 1 should always have verified badge
  if (serviceId === 1) {
    return true;
  }
  return (serviceId * 11) % 3 === 0; // ~33% of cards have verified badge
};

// Helper function to check if service has "bought in past month" stat
const hasPurchaseStats = (serviceId: number) => {
  return (serviceId * 3) % 2 === 0; // ~50% of cards
};

// Helper function to get category tag
const getCategoryTag = (serviceId: number) => {
  const categories = ["Digital marketing", "Graphic Design", "Web Development", "Photography", "Content Writing"];
  return categories[(serviceId * 7) % categories.length];
};

// Helper function to get random "Top Rated" status
const hasTopRated = (serviceId: number) => {
  // Only show Top Rated on service ID 7
  return serviceId === 7;
};

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
  const [likedServices, setLikedServices] = useState<Set<number>>(new Set());

  const handleViewMore = () => {
    setVisibleCount(prev => Math.min(prev + 8, services.length));
  };

  const handleServiceClick = (service: Service) => {
    const identifier = service.slug || service._id || service.id;
    navigate(`/service/${identifier}`);
  };

  const toggleLike = (e: React.MouseEvent, serviceId: number) => {
    e.stopPropagation();
    setLikedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-items-center">
          {services.slice(0, visibleCount).map((service) => {
            const uniqueId = `${sectionId}-${service.slug || service._id || service.id}`;
            const randomBadges = getRandomBadges(service.id);
            const showPurchaseStats = hasPurchaseStats(service.id);
            const categoryTag = getCategoryTag(service.id);
            const isLiked = likedServices.has(service.id);
            const verified = isVerified(service.id);
            const topRated = hasTopRated(service.id);
            
            // Truncate trading name to 10 characters
            const displayTradingName = service.tradingName.length > 10 
              ? service.tradingName.substring(0, 10) + '...' 
              : service.tradingName;
            
            return (
              <div
                key={uniqueId}
                onClick={() => handleServiceClick(service)}
                className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full"
                style={{ maxWidth: '330px', margin: '0 auto' }}
              >
                {/* Image Section */}
                <div className="relative w-full overflow-hidden" style={{ height: '225px' }}>
                  <img
                    src={service.image}
                    alt={service.description}
                    className="w-full h-full object-cover object-center"
                    style={{ minWidth: '100%', minHeight: '100%' }}
                  />
                  
                  {/* Heart Icon - Top Right */}
                  <button
                    onClick={(e) => toggleLike(e, service.id)}
                    className="absolute top-2 md:top-3 right-2 md:right-3 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                  >
                    <Heart 
                      className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  {/* Title/Description */}
                  <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[20px] text-[#2c353f] font-bold mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1">
                    {service.description}
                  </h3>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-2 md:mb-2.5">
                    {service.reviewCount > 0 ? (
                      <>
                        <span className="font-['Poppins',sans-serif] text-[13px] md:text-[15px] text-[#2c353f] font-semibold">
                          {service.rating.toFixed(1)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                                star <= Math.floor(service.rating)
                                  ? "fill-[#FFB800] text-[#FFB800]"
                                  : star - 0.5 <= service.rating
                                  ? "fill-[#FFB800] text-[#FFB800] opacity-50"
                                  : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-['Poppins',sans-serif] text-[11px] md:text-[13px] text-[#666]">
                          ({service.reviewCount})
                        </span>
                      </>
                    ) : null}
                  </div>

                  {/* Price Section */}
                  <div className="mb-2 md:mb-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] font-semibold">
                        {service.originalPrice || service.price}
                      </span>
                      {service.originalPrice && (
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[14px] text-[#999] line-through">
                          Was: {service.price}
                        </span>
                      )}
                    </div>
                    {/* Discount and Limited Time Offer - Below Price */}
                    {service.originalPrice && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                        <span 
                          className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-[3px] whitespace-nowrap"
                          style={{ backgroundColor: '#CC0C39' }}
                        >
                          {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
                        </span>
                        <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                          Limited Time Offer
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Purchase Stats */}
                  {showPurchaseStats && (
                    <p className="text-[10px] md:text-[11px] text-[#666] mb-2 md:mb-2.5">
                      1K+ bought in past month
                    </p>
                  )}

                  {/* Random Badges - #1 Best Seller */}
                  {randomBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 md:mb-2.5">
                      {randomBadges.map((badge, idx) => (
                        <span
                          key={idx}
                          style={{ backgroundColor: '#FF6B00' }}
                          className="text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-[4px] inline-flex items-center gap-1"
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* New Listing - Only for first card (service.id === 1) */}
                  {service.id === 1 && (
                    <div className="mb-2 md:mb-2.5">
                      <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666]">
                        New Listing
                      </p>
                    </div>
                  )}

                  {/* Category Tag */}
                  <div className="mb-3">
                    <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-full">
                      {categoryTag}
                    </span>
                  </div>

                  {/* Provider Info - Pushed to bottom */}
                  <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 mt-auto">
                    <Avatar className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0 self-center">
                      <AvatarImage src={service.providerImage} alt={service.tradingName} />
                      <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                        {service.tradingName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {/* First Row: Trading name and badges */}
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <Link to={`/profile/117`} className="hover:opacity-80 transition-opacity max-w-[65%] md:max-w-none" onClick={(e) => e.stopPropagation()}>
                          <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                            by <span className="inline">{displayTradingName}</span>
                          </p>
                        </Link>
                        {topRated && (
                          <div 
                            className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-1 rounded-[3px]"
                            style={{ backgroundColor: '#FFD4A3' }}
                          >
                            <Medal className="w-3 h-3 flex-shrink-0" style={{ color: '#2c353f' }} />
                            <span className="hidden md:inline font-['Poppins',sans-serif] text-[10px] font-semibold whitespace-nowrap">
                              Top Rated
                            </span>
                          </div>
                        )}
                        {!topRated && verified && (
                          <div className="inline-flex items-center gap-0.5 flex-shrink-0">
                            <div className="relative w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                <circle cx="12" cy="12" r="10" fill="#1877F2"/>
                                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <span className="hidden md:inline font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#1877F2] font-medium">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Second Row: Location info */}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#999] flex-shrink-0" />
                        <p className="font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#999] truncate">
                          Islington, London
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex items-center justify-between text-[9px] md:text-[10px] text-[#999]">
                    <span>{service.deliveryType === "same-day" ? "Same Day Delivery" : "Standard Delivery"}</span>
                    <span className="text-[#999]">Available</span>
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
                                  <Star className="w-2.5 h-2.5 fill-[#FFB800] text-[#FFB800]" />
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
                                  <Star className="w-2.5 h-2.5 fill-[#FFB800] text-[#FFB800]" />
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
                      <p className="font-['Poppins',sans-serif] text-[18px] text-[#5b5b5b] line-clamp-2 font-bold leading-snug">
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
                                      ? "fill-[#FFB800] text-[#FFB800]"
                                      : star - 0.5 <= service.rating
                                      ? "fill-[#FFB800] text-[#FFB800] opacity-50"
                                      : "fill-[#E5E5E5] text-[#E5E5E5]"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-['Poppins',sans-serif] text-[9px] text-[#2c353f] font-semibold">
                              {service.rating.toFixed(1)}
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
function ServiceCarousel({ title, services, sectionId }: ServiceGridProps) {
  const navigate = useNavigate();
  const [likedServices, setLikedServices] = useState<Set<number>>(new Set());

  const handleServiceClick = (service: Service) => {
    const identifier = service.slug || service._id || service.id;
    navigate(`/service/${identifier}`);
  };

  const toggleLike = (e: React.MouseEvent, serviceId: number) => {
    e.stopPropagation();
    setLikedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
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
      <div className="px-2 pb-4">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-3">
            {services.map((service) => {
              const randomBadges = getRandomBadges(service.id);
              const showPurchaseStats = hasPurchaseStats(service.id);
              const categoryTag = getCategoryTag(service.id);
              const isLiked = likedServices.has(service.id);
              const verified = isVerified(service.id);
              const topRated = hasTopRated(service.id);
              
              // Truncate trading name to 10 characters
              const displayTradingName = service.tradingName.length > 10 
                ? service.tradingName.substring(0, 10) + '...' 
                : service.tradingName;

              return (
                <CarouselItem key={service.id} className="pl-2 md:pl-3 basis-[85%] sm:basis-[48%] lg:basis-[32%] xl:basis-[23%]">
                  <div 
                    onClick={() => handleServiceClick(service)}
                    className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full"
                    style={{ maxWidth: '330px', margin: '0 auto' }}
                  >
                    {/* Image Section */}
                    <div className="relative w-full overflow-hidden" style={{ height: '225px' }}>
                      <img
                        src={service.image}
                        alt={service.description}
                        className="w-full h-full object-cover object-center"
                        style={{ minWidth: '100%', minHeight: '100%' }}
                      />
                      
                      {/* Heart Icon - Top Right */}
                      <button
                        onClick={(e) => toggleLike(e, service.id)}
                        className="absolute top-2 md:top-3 right-2 md:right-3 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                      >
                        <Heart 
                          className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                        />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      {/* Title/Description */}
                      <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[20px] text-[#2c353f] font-bold mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1">
                        {service.description}
                      </h3>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mb-2 md:mb-2.5">
                        {service.reviewCount > 0 ? (
                          <>
                            <span className="font-['Poppins',sans-serif] text-[13px] md:text-[15px] text-[#2c353f] font-semibold">
                              {service.rating.toFixed(1)}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                                    star <= Math.floor(service.rating)
                                      ? "fill-[#FFB800] text-[#FFB800]"
                                      : star - 0.5 <= service.rating
                                      ? "fill-[#FFB800] text-[#FFB800] opacity-50"
                                      : "fill-[#E5E5E5] text-[#E5E5E5]"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-['Poppins',sans-serif] text-[11px] md:text-[13px] text-[#666]">
                              ({service.reviewCount})
                            </span>
                          </>
                        ) : null}
                      </div>

                      {/* Price Section */}
                      <div className="mb-2 md:mb-2.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] font-semibold">
                            {service.originalPrice || service.price}
                          </span>
                          {service.originalPrice && (
                            <span className="font-['Poppins',sans-serif] text-[12px] md:text-[14px] text-[#999] line-through">
                              Was: {service.price}
                            </span>
                          )}
                        </div>
                        {/* Discount and Limited Time Offer - Below Price */}
                        {service.originalPrice && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                            <span 
                              className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-[3px] whitespace-nowrap"
                              style={{ backgroundColor: '#CC0C39' }}
                            >
                              {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
                            </span>
                            <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                              Limited Time Offer
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Purchase Stats */}
                      {showPurchaseStats && (
                        <p className="text-[10px] md:text-[11px] text-[#666] mb-2 md:mb-2.5">
                          1K+ bought in past month
                        </p>
                      )}

                      {/* Random Badges - #1 Best Seller */}
                      {randomBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 md:mb-2.5">
                          {randomBadges.map((badge, idx) => (
                            <span
                              key={idx}
                              style={{ backgroundColor: '#FF6B00' }}
                              className="text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-[4px] inline-flex items-center gap-1"
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* New Listing - Only for first card (service.id === 1) */}
                      {service.id === 1 && (
                        <div className="mb-2 md:mb-2.5">
                          <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666]">
                            New Listing
                          </p>
                        </div>
                      )}

                      {/* Category Tag */}
                      <div className="mb-3">
                        <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-full">
                          {categoryTag}
                        </span>
                      </div>

                      {/* Provider Info - Pushed to bottom */}
                      <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 mt-auto">
                        <Avatar className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0 self-center">
                          <AvatarImage src={service.providerImage} alt={service.tradingName} />
                          <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                            {service.tradingName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          {/* First Row: Trading name and badges */}
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <Link to={`/profile/117`} className="hover:opacity-80 transition-opacity max-w-[65%] md:max-w-none" onClick={(e) => e.stopPropagation()}>
                              <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                                by <span className="inline">{displayTradingName}</span>
                              </p>
                            </Link>
                            {topRated && (
                              <div 
                                className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-1 rounded-[3px]"
                                style={{ backgroundColor: '#FFD4A3' }}
                              >
                                <Medal className="w-3 h-3 flex-shrink-0" style={{ color: '#2c353f' }} />
                                <span className="hidden md:inline font-['Poppins',sans-serif] text-[10px] font-semibold whitespace-nowrap">
                                  Top Rated
                                </span>
                              </div>
                            )}
                            {!topRated && verified && (
                              <div className="inline-flex items-center gap-0.5 flex-shrink-0">
                                <div className="relative w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0">
                                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                    <circle cx="12" cy="12" r="10" fill="#1877F2"/>
                                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span className="hidden md:inline font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#1877F2] font-medium">
                                  Verified
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Second Row: Location info */}
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#999] flex-shrink-0" />
                            <p className="font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#999] truncate">
                              Islington, London
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="flex items-center justify-between text-[9px] md:text-[10px] text-[#999]">
                        <span>{service.deliveryType === "same-day" ? "Same Day Delivery" : "Standard Delivery"}</span>
                        <span className="text-[#999]">Available</span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
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