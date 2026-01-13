import { useState, useEffect, useMemo } from "react";
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

// Helper function to check if professional is verified
const isVerified = (service: any) => {
  return service.providerIsVerified === true;
};

// Helper function to check if service is top rated (rating >= 4.8 with at least 50 reviews)
const hasTopRated = (service: any) => {
  return service.rating >= 4.8 && service.reviewCount >= 50;
};

// Helper function to check if service is best seller (has soldCount or orderCount)
const isBestSeller = (service: any) => {
  return service.soldCount > 100 || service.orderCount > 100;
};

// Helper function to get purchase stats
const getPurchaseStats = (service: any) => {
  if (service.soldCount && service.soldCount > 0) {
    if (service.soldCount >= 1000) {
      return `${Math.floor(service.soldCount / 1000)}K+ bought in past month`;
    } else if (service.soldCount >= 100) {
      return `${service.soldCount}+ bought in past month`;
  }
  }
  return null;
};

// Helper function to get category tag
const getCategoryTag = (service: any) => {
  // Use actual service category name or subcategory name
  return service.categoryName || service.subCategoryName || null;
};

// Helper function to calculate price range when packages exist
const getPriceRange = (service: any) => {
  if (!service.packages || service.packages.length === 0) {
    return null;
  }
  
  // For package services, find min and max package prices with their names
  let minPackagePrice = Infinity;
  let maxPackagePrice = 0;
  let minPackageName = '';
  let maxPackageName = '';
  
  service.packages.forEach((pkg: any) => {
    // Use originalPrice (discount price) if available, otherwise use price (original price)
    // originalPrice = discount price (lower), price = original price (higher)
    const pkgPrice = parseFloat(String(pkg.originalPrice || pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
    if (pkgPrice > 0) {
      if (pkgPrice < minPackagePrice) {
        minPackagePrice = pkgPrice;
        minPackageName = pkg.name || '';
      }
    if (pkgPrice > maxPackagePrice) {
      maxPackagePrice = pkgPrice;
        maxPackageName = pkg.name || '';
      }
    }
  });
  
  if (minPackagePrice === Infinity || maxPackagePrice === 0) {
    return null;
  }
  
  // If all packages have the same price, show single price
  if (minPackagePrice === maxPackagePrice) {
  return {
      min: minPackagePrice,
      max: maxPackagePrice,
      formatted: `£${minPackagePrice.toFixed(2)}`
    };
  }
  
  // Format: "basic package price to premium package price"
  const minName = minPackageName.toLowerCase() || 'basic';
  const maxName = maxPackageName.toLowerCase() || 'premium';
  return {
    min: minPackagePrice,
    max: maxPackagePrice,
    formatted: `£${minPackagePrice.toFixed(2)} to £${maxPackagePrice.toFixed(2)}`
  };
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
        <h2 className="font-['Poppins',sans-serif] text-gray-700 text-[20px] md:text-[24px] font-normal">
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 justify-items-center">
          {services.slice(0, visibleCount).map((service, index) => {
            const uniqueId = `${sectionId}-${service.slug || service._id || service.id}`;
            const bestSeller = isBestSeller(service);
            const purchaseStatsText = getPurchaseStats(service);
            const categoryTag = getCategoryTag(service);
            const isLiked = likedServices.has(service.id);
            const verified = isVerified(service);
            const topRated = hasTopRated(service);
            
            // Truncate trading name to 10 characters
            const displayTradingName = service.tradingName.length > 10 
              ? service.tradingName.substring(0, 10) + '...' 
              : service.tradingName;
            
            return (
              <div
                key={uniqueId}
                onClick={() => handleServiceClick(service)}
                className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full w-full"
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
                  <h3 className="font-['Poppins',sans-serif] text-gray-800 font-normal mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1" style={{ fontSize: '16px', fontFamily: "'Poppins', sans-serif" }}>
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
                    {(() => {
                      const priceRange = getPriceRange(service);
                      if (priceRange) {
                        // Show price range when packages exist
                        // Get all packages with discounts
                        // originalPrice = discount price (lower), price = original price (higher)
                        const packagesWithDiscounts = service.packages?.filter((pkg: any) => {
                          if (!pkg || !pkg.originalPrice) return false;
                          const discountPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice).replace('£', '').replace(/,/g, '')) || 0;
                          const originalPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
                          return discountPrice > 0 && originalPrice > discountPrice;
                        }) || [];
                        
                        return (
                          <>
                          <div className="flex items-baseline gap-2">
                            <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-gray-900 font-normal">
                              {priceRange.formatted}
                              </span>
                            </div>
                            {/* Show discount badge range for packages with discounts */}
                            {packagesWithDiscounts.length > 0 && (() => {
                              // Calculate all discount percentages
                              const discountPercentages = packagesWithDiscounts.map((pkg: any) => {
                                const discountPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice || 0).replace('£', '').replace(/,/g, '')) || 0;
                                const originalPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
                                if (originalPrice > discountPrice && discountPrice > 0) {
                                  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
                                }
                                return 0;
                              }).filter(percent => percent > 0);
                              
                              if (discountPercentages.length === 0) {
                                return null;
                              }
                              
                              const minDiscount = Math.min(...discountPercentages);
                              const maxDiscount = Math.max(...discountPercentages);
                              
                              // Check if any package has a valid time-limited discount
                              // Only show "Limited Time Offer" if there's an end date (originalPriceValidUntil)
                              // No end date means offer is valid indefinitely
                              const hasTimeLimitedDiscount = packagesWithDiscounts.some((pkg: any) => {
                                const validFrom = pkg.originalPriceValidFrom ? new Date(pkg.originalPriceValidFrom) : null;
                                const validUntil = pkg.originalPriceValidUntil ? new Date(pkg.originalPriceValidUntil) : null;
                                const now = new Date();
                                
                                // Must have an end date (validUntil) to show "Limited Time Offer"
                                return validUntil && 
                                       (!validFrom || validFrom <= now) && 
                                       validUntil >= now;
                              });
                              
                              return (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                                  <span 
                                    className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                                    style={{ backgroundColor: '#CC0C39' }}
                                  >
                                    {minDiscount === maxDiscount ? `${minDiscount}% OFF` : `${minDiscount}% ~ ${maxDiscount}% OFF`}
                                  </span>
                                  {hasTimeLimitedDiscount && (
                                    <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                      Limited Time Offer
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      } else {
                        // Show regular price when no packages
                        return (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-gray-900 font-normal">
                        {service.originalPrice || service.price}
                              </span>
                              {service.originalPrice && (
                                <span className="font-['Poppins',sans-serif] text-[12px] md:text-[14px] text-[#999] line-through">
                                  Was: {service.price}
                                </span>
                              )}
                      </div>
                            {/* Discount and Limited Time Offer - Below Price */}
                            {service.originalPrice && (() => {
                              // Check if service has a valid time-limited discount
                              // Only show "Limited Time Offer" if there's an end date (originalPriceValidUntil)
                              // No end date means offer is valid indefinitely
                              const validFrom = service.originalPriceValidFrom ? new Date(service.originalPriceValidFrom) : null;
                              const validUntil = service.originalPriceValidUntil ? new Date(service.originalPriceValidUntil) : null;
                              const now = new Date();
                              // Must have an end date (validUntil) to show "Limited Time Offer"
                              const hasTimeLimitedDiscount = validUntil && 
                                                             (!validFrom || validFrom <= now) && 
                                                             validUntil >= now;
                              
                              return (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                                  <span 
                                    className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                                    style={{ backgroundColor: '#CC0C39' }}
                                  >
                                    {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
                                  </span>
                                  {hasTimeLimitedDiscount && (
                                    <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                      Limited Time Offer
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      }
                    })()}
                        </div>

                  {/* Category Badge - Below Price */}
                  {(() => {
                    const categoryName = service.serviceCategory?.name || null;
                    return categoryName ? (
                      <div className="mb-2 md:mb-2.5">
                        <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
                          {categoryName}
                        </span>
                      </div>
                    ) : null;
                  })()}

                  {/* Purchase Stats */}
                  {purchaseStatsText && (
                    <p className="text-[10px] md:text-[11px] text-[#666] mb-2 md:mb-2.5">
                      {purchaseStatsText}
                    </p>
                  )}

                  {/* Best Seller Badge - Only show if actually a best seller */}
                  {bestSeller && (
                    <div className="flex flex-wrap gap-1.5 mb-2 md:mb-2.5">
                      <span
                        style={{ backgroundColor: '#FF6B00' }}
                        className="text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1"
                      >
                        #1 Best Seller
                      </span>
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

                  {/* Category Tag - Only show if available */}
                  {categoryTag && (
                    <div className="mb-3">
                      <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
                        {categoryTag}
                          </span>
                        </div>
                  )}

                  {/* Provider Info - Pushed to bottom */}
                  <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 mt-auto">
                    <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <Avatar className="w-6 h-6 md:w-7 md:h-7 self-center cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={service.providerImage} alt={service.tradingName} />
                      <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                        {service.tradingName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    </Link>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {/* First Row: Trading name and badges */}
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} className="hover:opacity-80 transition-opacity max-w-[65%] md:max-w-none" onClick={(e) => e.stopPropagation()}>
                          <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                            by <span className="inline">{displayTradingName}</span>
                          </p>
                        </Link>
                        {topRated && (
                          <div 
                            className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-1 rounded-md"
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
                          {service.townCity || "Location not available"}
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
          {services.slice(0, visibleCount).map((service, index) => {
            const uniqueId = `${sectionId}-list-${service.id}`;
            const bestSeller = isBestSeller(service);
            const purchaseStatsText = getPurchaseStats(service);
            const categoryTag = getCategoryTag(service);
            const isLiked = likedServices.has(service.id);
            const verified = isVerified(service);
            const topRated = hasTopRated(service);
            
            // Truncate trading name to 10 characters
            const displayTradingName = service.tradingName.length > 10 
              ? service.tradingName.substring(0, 10) + '...' 
              : service.tradingName;
            
            return (
              <div
                key={uniqueId}
                onClick={() => handleServiceClick(service)}
                className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-row border border-gray-100 w-full"
              >
                {/* Image Section - Left */}
                <div className="relative w-[150px] sm:w-[200px] flex-shrink-0 overflow-hidden bg-gray-100">
                  <img
                    src={service.image}
                    alt={service.description}
                    className="w-full h-full object-cover object-center"
                    style={{ minWidth: '100%', minHeight: '100%' }}
                  />

                  {/* Heart Icon - Top Right */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleLike(e, service.id);
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </button>
                      </div>

                {/* Content Section - Right */}
                <div className="flex-1 p-3 md:p-4 flex flex-col min-w-0">
                  {/* Title/Description */}
                  <h3 className="font-['Poppins',sans-serif] text-gray-800 font-normal mb-1.5 line-clamp-2" style={{ fontSize: '16px', fontFamily: "'Poppins', sans-serif" }}>
                    {service.description}
                  </h3>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-2">
                        {service.reviewCount > 0 ? (
                      <>
                        <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#2c353f] font-semibold">
                          {service.rating.toFixed(1)}
                        </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                              className={`w-3 h-3 md:w-3.5 md:h-3.5 ${
                                    star <= Math.floor(service.rating)
                                  ? "fill-[#FFB800] text-[#FFB800]"
                                      : star - 0.5 <= service.rating
                                  ? "fill-[#FFB800] text-[#FFB800] opacity-50"
                                      : "fill-[#E5E5E5] text-[#E5E5E5]"
                                  }`}
                                />
                              ))}
                            </div>
                        <span className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666]">
                          ({service.reviewCount})
                            </span>
                      </>
                    ) : null}
                  </div>

                  {/* Price Section */}
                  <div className="mb-2">
                    {(() => {
                      const priceRange = getPriceRange(service);
                      if (priceRange) {
                        // Show price range when packages exist
                            // Get all packages with discounts
                            // originalPrice = discount price (lower), price = original price (higher)
                            const packagesWithDiscounts = service.packages?.filter((pkg: any) => {
                              if (!pkg || !pkg.originalPrice) return false;
                              const discountPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice).replace('£', '').replace(/,/g, '')) || 0;
                              const originalPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
                              return discountPrice > 0 && originalPrice > discountPrice;
                            }) || [];
                        
                        return (
                          <>
                          <div className="flex items-baseline gap-2">
                            <span className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-gray-900 font-normal">
                              {priceRange.formatted}
                              </span>
                            </div>
                            {/* Show discount badge range for packages with discounts */}
                            {packagesWithDiscounts.length > 0 && (() => {
                              // Calculate all discount percentages
                              const discountPercentages = packagesWithDiscounts.map((pkg: any) => {
                                const discountPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice || 0).replace('£', '').replace(/,/g, '')) || 0;
                                const originalPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
                                if (originalPrice > discountPrice && discountPrice > 0) {
                                  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
                                }
                                return 0;
                              }).filter(percent => percent > 0);
                              
                              if (discountPercentages.length === 0) return null;
                              
                              const minDiscount = Math.min(...discountPercentages);
                              const maxDiscount = Math.max(...discountPercentages);
                              
                              // Check if any package has a valid time-limited discount
                              // Only show "Limited Time Offer" if there's an end date (originalPriceValidUntil)
                              // No end date means offer is valid indefinitely
                              const hasTimeLimitedDiscount = packagesWithDiscounts.some((pkg: any) => {
                                const validFrom = pkg.originalPriceValidFrom ? new Date(pkg.originalPriceValidFrom) : null;
                                const validUntil = pkg.originalPriceValidUntil ? new Date(pkg.originalPriceValidUntil) : null;
                                const now = new Date();
                                // Must have an end date (validUntil) to show "Limited Time Offer"
                                return validUntil && 
                                       (!validFrom || validFrom <= now) && 
                                       validUntil >= now;
                              });
                              
                              return (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <span 
                                    className="inline-block text-white text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
                                    style={{ backgroundColor: '#CC0C39' }}
                                  >
                                    {minDiscount === maxDiscount ? `${minDiscount}% OFF` : `${minDiscount}% ~ ${maxDiscount}% OFF`}
                                  </span>
                                  {hasTimeLimitedDiscount && (
                                    <span className="text-[9px] md:text-[10px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                      Limited Time Offer
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      } else {
                        // Show regular price when no packages
                        return (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-gray-900 font-normal">
                                {service.originalPrice || service.price}
                              </span>
                              {service.originalPrice && (
                                <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#999] line-through">
                                  Was: {service.price}
                                </span>
                              )}
                            </div>
                            {/* Discount Badge */}
                            {service.originalPrice && (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span 
                                  className="inline-block text-white text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
                                  style={{ backgroundColor: '#CC0C39' }}
                                >
                                  {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
                                </span>
                            </div>
                          )}
                          </>
                        );
                      }
                    })()}
                  </div>

                  {/* Category Badge - Below Price */}
                  {(() => {
                    const categoryName = service.serviceCategory?.name || null;
                    return categoryName ? (
                      <div className="mb-2">
                        <span className="inline-block bg-gray-100 text-[#2c353f] text-[9px] md:text-[10px] px-2 py-0.5 rounded-md">
                          {categoryName}
                      </span>
                    </div>
                    ) : null;
                  })()}

                  {/* Provider Info */}
                  <div className="flex items-center gap-2 mb-2 pt-2 border-t border-gray-100 mt-auto">
                    <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <Avatar className="w-6 h-6 md:w-7 md:h-7 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={service.providerImage} alt={service.tradingName} />
                      <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                        {service.tradingName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    </Link>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} className="hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                          by {displayTradingName}
                        </p>
                        </Link>
                        {topRated && (
                          <div 
                            className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: '#FFD4A3' }}
                          >
                            <Medal className="w-3 h-3 flex-shrink-0" style={{ color: '#2c353f' }} />
                            <span className="hidden md:inline font-['Poppins',sans-serif] text-[9px] font-semibold whitespace-nowrap">
                              Top Rated
                            </span>
                    </div>
                        )}
                        {!topRated && verified && (
                          <div className="inline-flex items-center gap-0.5 flex-shrink-0">
                            <div className="relative w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                <circle cx="12" cy="12" r="10" fill="#1877F2"/>
                                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                            </div>
                            <span className="hidden md:inline font-['Poppins',sans-serif] text-[9px] text-[#1877F2] font-medium">
                              Verified
                            </span>
                                </div>
                              )}
                            </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#999] flex-shrink-0" />
                        <p className="font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#999] truncate">
                          {service.townCity || "Location not available"}
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
        <h2 className="font-['Poppins',sans-serif] text-gray-700 text-[20px] md:text-[24px] font-normal">
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
          <CarouselContent className="-ml-2 md:-ml-3 pr-2 md:pr-0">
            {services.map((service, index) => {
              const bestSeller = isBestSeller(service);
              const purchaseStatsText = getPurchaseStats(service);
              const categoryTag = getCategoryTag(service);
              const isLiked = likedServices.has(service.id);
              const verified = isVerified(service);
              const topRated = hasTopRated(service);
              
              // Truncate trading name to 10 characters
              const displayTradingName = service.tradingName.length > 10 
                ? service.tradingName.substring(0, 10) + '...' 
                : service.tradingName;

              return (
                <CarouselItem key={service.id} className="pl-2 md:pl-3 flex-shrink-0 basis-[48%] md:basis-1/4">
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
                      <h3 className="font-['Poppins',sans-serif] text-[#2c353f] mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1" style={{ fontSize: '16px', fontFamily: "'Poppins', sans-serif" }}>
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
                        {(() => {
                          const priceRange = getPriceRange(service);
                          if (priceRange) {
                            // Show price range when packages exist
                            // Get all packages with discounts
                            // originalPrice = discount price (lower), price = original price (higher)
                            const packagesWithDiscounts = service.packages?.filter((pkg: any) => {
                              if (!pkg || !pkg.originalPrice) return false;
                              const discountPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice).replace('£', '').replace(/,/g, '')) || 0;
                              const originalPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
                              return discountPrice > 0 && originalPrice > discountPrice;
                            }) || [];
                            
                            return (
                              <>
                              <div className="flex items-baseline gap-2">
                                <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                                  {priceRange.formatted}
                                </span>
                              </div>
                                {/* Show discount badge range for packages with discounts */}
                                {packagesWithDiscounts.length > 0 && (() => {
                                  // Calculate all discount percentages
                                  const discountPercentages = packagesWithDiscounts.map((pkg: any) => {
                                    const discountPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice || 0).replace('£', '').replace(/,/g, '')) || 0;
                                    const originalPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
                                    if (originalPrice > discountPrice && discountPrice > 0) {
                                      return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
                                    }
                                    return 0;
                                  }).filter(percent => percent > 0);
                                  
                                  if (discountPercentages.length === 0) return null;
                                  
                                  const minDiscount = Math.min(...discountPercentages);
                                  const maxDiscount = Math.max(...discountPercentages);
                                  
                                  // Check if any package has a valid time-limited discount
                                  // Only show "Limited Time Offer" if there's an end date (originalPriceValidUntil)
                                  // No end date means offer is valid indefinitely
                                  const hasTimeLimitedDiscount = packagesWithDiscounts.some((pkg: any) => {
                                    const validFrom = pkg.originalPriceValidFrom ? new Date(pkg.originalPriceValidFrom) : null;
                                    const validUntil = pkg.originalPriceValidUntil ? new Date(pkg.originalPriceValidUntil) : null;
                                    const now = new Date();
                                    // Must have an end date (validUntil) to show "Limited Time Offer"
                                    return validUntil && 
                                           (!validFrom || validFrom <= now) && 
                                           validUntil >= now;
                                  });
                                  
                                  return (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                                      <span 
                                        className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                                        style={{ backgroundColor: '#CC0C39' }}
                                      >
                                        {minDiscount === maxDiscount ? `${minDiscount}% OFF` : `${minDiscount}% ~ ${maxDiscount}% OFF`}
                                      </span>
                                      {hasTimeLimitedDiscount && (
                                        <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                          Limited Time Offer
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </>
                            );
                          } else {
                            // Show regular price when no packages
                            return (
                              <>
                                <div className="flex items-baseline gap-2">
                                  <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                          {service.originalPrice || service.price}
                                  </span>
                                  {service.originalPrice && (
                                    <span className="font-['Poppins',sans-serif] text-[12px] md:text-[14px] text-[#999] line-through">
                                      Was: {service.price}
                                    </span>
                                  )}
                        </div>
                                {/* Discount and Limited Time Offer - Below Price */}
                                {service.originalPrice && (() => {
                                  // Check if service has a valid time-limited discount
                                  // Only show "Limited Time Offer" if there's an end date (originalPriceValidUntil)
                                  // No end date means offer is valid indefinitely
                                  const validFrom = service.originalPriceValidFrom ? new Date(service.originalPriceValidFrom) : null;
                                  const validUntil = service.originalPriceValidUntil ? new Date(service.originalPriceValidUntil) : null;
                                  const now = new Date();
                                  // Must have an end date (validUntil) to show "Limited Time Offer"
                                  const hasTimeLimitedDiscount = validUntil && 
                                                                 (!validFrom || validFrom <= now) && 
                                                                 validUntil >= now;
                                  
                                  return (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                                      <span 
                                        className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                                        style={{ backgroundColor: '#CC0C39' }}
                                      >
                                        {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
                                      </span>
                                      {hasTimeLimitedDiscount && (
                                        <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                          Limited Time Offer
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </>
                            );
                          }
                        })()}
                          </div>

                      {/* Category Badge - Below Price */}
                      {(() => {
                        const categoryName = service.serviceCategory?.name || null;
                        return categoryName ? (
                          <div className="mb-2 md:mb-2.5">
                            <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
                              {categoryName}
                            </span>
                          </div>
                        ) : null;
                      })()}

                      {/* Purchase Stats */}
                      {purchaseStatsText && (
                        <p className="text-[10px] md:text-[11px] text-[#666] mb-2 md:mb-2.5">
                          {purchaseStatsText}
                        </p>
                      )}

                      {/* Best Seller Badge - Only show if actually a best seller */}
                      {bestSeller && (
                        <div className="flex flex-wrap gap-1.5 mb-2 md:mb-2.5">
                          <span
                            style={{ backgroundColor: '#FF6B00' }}
                            className="text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1"
                          >
                            #1 Best Seller
                          </span>
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

                      {/* Category Tag - Only show if available */}
                      {categoryTag && (
                        <div className="mb-3">
                          <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
                            {categoryTag}
                            </span>
                          </div>
                      )}

                      {/* Provider Info - Pushed to bottom */}
                      <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 mt-auto">
                        <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                          <Avatar className="w-6 h-6 md:w-7 md:h-7 self-center cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={service.providerImage} alt={service.tradingName} />
                          <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                            {service.tradingName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        </Link>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          {/* First Row: Trading name and badges */}
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} className="hover:opacity-80 transition-opacity max-w-[65%] md:max-w-none" onClick={(e) => e.stopPropagation()}>
                              <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                                by <span className="inline">{displayTradingName}</span>
                              </p>
                            </Link>
                            {topRated && (
                              <div 
                                className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-1 rounded-md"
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
                              {service.townCity || "Location not available"}
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
          
          const transformed = (data.services || []).map((s: any) => {
            const townCityValue = (() => {
              if (s.professional && typeof s.professional === 'object' && s.professional !== null) {
                const value = s.professional.townCity;
                return value !== undefined && value !== null ? String(value) : "";
              }
              return "";
            })();
            
            return {
            id: parseInt(s._id?.slice(-8), 16) || Math.floor(Math.random() * 10000),
            _id: s._id,
            slug: s.slug,
            image: s.images?.[0] || s.portfolioImages?.[0] || "",
            professionalId: typeof s.professional === 'object' 
              ? (s.professional._id || s.professional.id || s.professional)
              : (typeof s.professional === 'string' ? s.professional : null),
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
              subcategory: typeof s.serviceCategory === 'object' && s.serviceCategory
              ? s.serviceCategory.name || ""
              : "",
              serviceCategory: s.serviceCategory, // Keep original serviceCategory object for debugging
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
            originalPriceValidFrom: s.originalPriceValidFrom || null,
            originalPriceValidUntil: s.originalPriceValidUntil || null,
            priceUnit: s.priceUnit || "fixed",
            badges: s.badges || [],
            deliveryType: s.deliveryType || "standard",
            postcode: s.postcode || "",
            location: s.location || "",
              townCity: townCityValue,
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
              originalPriceValidFrom: p.originalPriceValidFrom || null,
              originalPriceValidUntil: p.originalPriceValidUntil || null,
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
            };
          });
          
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

  // Get featured services - random 8 from all approved services
  const featuredServices: Service[] = useMemo(() => {
    const shuffled = shuffleArray(allServices);
    const sliced = shuffled.slice(0, 8);
    const mapped = sliced.map(s => ({
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
      townCity: s.townCity,
      serviceCategory: s.serviceCategory,
      packages: s.packages,
    }));
    
    return mapped;
  }, [allServices]);
  // Get popular/best sellers services - sorted by actual sales/performance metrics
  const popularServices: Service[] = useMemo(() => {
    // Sort by best seller criteria: soldCount > completedTasks > rating > reviewCount
    const sorted = [...allServices].sort((a, b) => {
      // First priority: soldCount or orderCount (if available)
      const aSales = (a as any).soldCount || (a as any).orderCount || 0;
      const bSales = (b as any).soldCount || (b as any).orderCount || 0;
      if (bSales !== aSales) return bSales - aSales;
      
      // Second priority: completedTasks
      if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
      
      // Third priority: rating
      if (b.rating !== a.rating) return b.rating - a.rating;
      
      // Fourth priority: reviewCount
      return b.reviewCount - a.reviewCount;
    });
    
    // Take top 8 and map to service format
    const mapped = sorted.slice(0, 8).map(s => ({
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
      townCity: s.townCity,
      serviceCategory: s.serviceCategory,
      packages: s.packages,
    }));
    
    return mapped;
  }, [allServices]);

  return (
    <div className="w-full">
      <ServiceGrid 
        title="Featured Services" 
        services={featuredServices} 
        sectionId="featured"
        initialCount={8}
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