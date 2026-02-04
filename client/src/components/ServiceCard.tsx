import { useState, useEffect, useRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Star, Heart, MapPin, Medal, Play, Clock } from "lucide-react";
import { resolveApiUrl } from "../config/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// Video Thumbnail Component with Play Button (same as FeaturedServices)
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

  useEffect(() => {
    if (!videoRef.current || isPlaying) return;
    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        video.currentTime = video.duration / 2;
      }
    };
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [isPlaying]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (videoRef.current?.duration && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = videoRef.current.duration / 2;
    }
    setIsPlaying(false);
  };

  const resolvedVideoUrl = videoUrl.startsWith("http") || videoUrl.startsWith("blob:") ? videoUrl : resolveApiUrl(videoUrl);
  const resolvedPoster = thumbnail
    ? (thumbnail.startsWith("http") || thumbnail.startsWith("blob:") ? thumbnail : resolveApiUrl(thumbnail))
    : fallbackImage
      ? (fallbackImage.startsWith("http") || fallbackImage.startsWith("blob:") ? fallbackImage : resolveApiUrl(fallbackImage))
      : undefined;

  return (
    <div className={`relative ${className}`} style={style}>
      <video
        ref={videoRef}
        src={resolvedVideoUrl}
        poster={resolvedPoster}
        className="w-full h-full object-cover object-center"
        style={{ minWidth: "100%", minHeight: "100%" }}
        muted
        playsInline
        loop
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
        preload="metadata"
      />
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

const resolveMediaUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return resolveApiUrl(url);
  return url;
};

const isVerified = (service: any) => service.providerIsVerified === true;
const hasTopRated = (service: any) => (service.rating ?? 0) >= 4.8 && (service.reviewCount ?? 0) >= 50;
const isBestSeller = (service: any) => (service.soldCount ?? 0) > 100 || (service.orderCount ?? 0) > 100;

const getPurchaseStats = (service: any): string | null => {
  const sold = service.soldCount ?? 0;
  if (sold <= 0) return null;
  if (sold >= 1000) return `${Math.floor(sold / 1000)}K+ bought in past month`;
  if (sold >= 100) return `${sold}+ bought in past month`;
  return null;
};

const getCategoryTag = (service: any): string | null =>
  service.categoryName || service.subCategoryName || null;

const getPriceRange = (service: any): { min: number; max: number; formatted: string } | null => {
  if (!service.packages || !Array.isArray(service.packages) || service.packages.length === 0) return null;
  let minPackagePrice = Infinity;
  let maxPackagePrice = 0;
  let minPackageName = "";
  let maxPackageName = "";
  service.packages.forEach((pkg: any) => {
    const pkgPrice = parseFloat(String(pkg.originalPrice || pkg.price || 0).replace("£", "").replace(/,/g, "")) || 0;
    if (pkgPrice > 0) {
      if (pkgPrice < minPackagePrice) {
        minPackagePrice = pkgPrice;
        minPackageName = pkg.name || "";
      }
      if (pkgPrice > maxPackagePrice) {
        maxPackagePrice = pkgPrice;
        maxPackageName = pkg.name || "";
      }
    }
  });
  if (minPackagePrice === Infinity || maxPackagePrice === 0) return null;
  if (minPackagePrice === maxPackagePrice) {
    return { min: minPackagePrice, max: maxPackagePrice, formatted: `£${minPackagePrice.toFixed(2)}` };
  }
  return {
    min: minPackagePrice,
    max: maxPackagePrice,
    formatted: `£${minPackagePrice.toFixed(2)} to £${maxPackagePrice.toFixed(2)}`,
  };
};

export interface ServiceCardProps {
  service: any;
  onClick?: () => void;
  showHeart?: boolean;
  isLiked?: boolean;
  onLikeClick?: (e: React.MouseEvent) => void;
  renderFooter?: ReactNode;
}

export default function ServiceCard({
  service,
  onClick,
  showHeart = true,
  isLiked = false,
  onLikeClick,
  renderFooter,
}: ServiceCardProps) {
  const bestSeller = isBestSeller(service);
  const purchaseStatsText = getPurchaseStats(service);
  const categoryTag = getCategoryTag(service);
  const verified = isVerified(service);
  const topRated = hasTopRated(service);
  const displayTradingName = (service.tradingName || "").length > 10
    ? (service.tradingName || "").substring(0, 10) + "..."
    : (service.tradingName || "");
  const professionalId = service.professionalId;
  const categoryName = service.serviceCategory?.name || service.category || null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full w-full"
    >
      <div className="relative w-full overflow-hidden" style={{ height: "225px" }}>
        {(service as any).thumbnailVideo ? (
          <VideoThumbnail
            videoUrl={(service as any).thumbnailVideo.url}
            thumbnail={(service as any).thumbnailVideo.thumbnail}
            fallbackImage={service.image}
            className="w-full h-full"
            style={{ minWidth: "100%", minHeight: "100%" }}
          />
        ) : (
          <img
            src={resolveMediaUrl(service.image)}
            alt={service.description}
            className="w-full h-full object-cover object-center"
            style={{ minWidth: "100%", minHeight: "100%" }}
          />
        )}
        {showHeart && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLikeClick?.(e);
            }}
            className="absolute top-2 md:top-3 right-2 md:right-3 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
          >
            <Heart
              className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-600"}`}
            />
          </button>
        )}
      </div>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3
          className="font-['Poppins',sans-serif] text-gray-800 font-normal mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1"
          style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }}
        >
          {service.description}
        </h3>

        {(() => {
          const avgScore = service.providerRating ?? service.rating;
          const reviewsCount = service.providerReviewCount ?? service.reviewCount ?? 0;
          const hasScore = typeof avgScore === "number" && !Number.isNaN(avgScore);
          const scoreVal = hasScore ? Number(avgScore) : 0;
          if (reviewsCount <= 0 && scoreVal <= 0) return null;
          return (
            <div className="flex items-center gap-1 mb-2 md:mb-2.5">
              <span className="font-['Poppins',sans-serif] text-[13px] md:text-[15px] text-[#2c353f] font-semibold">
                {scoreVal.toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                      star <= Math.floor(scoreVal)
                        ? "fill-[#FE8A0F] text-[#FE8A0F]"
                        : star - 0.5 <= scoreVal
                          ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                          : "fill-[#E5E5E5] text-[#E5E5E5]"
                    }`}
                  />
                ))}
              </div>
              <span className="font-['Poppins',sans-serif] text-[11px] md:text-[13px] text-[#666]">
                ({reviewsCount})
              </span>
            </div>
          );
        })()}

        <div className="mb-2 md:mb-2.5">
          {(() => {
            const priceRange = getPriceRange(service);
            if (priceRange) {
              const packagesWithDiscounts =
                service.packages?.filter((pkg: any) => {
                  if (!pkg || !pkg.originalPrice) return false;
                  const discountPrice =
                    typeof pkg.originalPrice === "number"
                      ? pkg.originalPrice
                      : parseFloat(String(pkg.originalPrice).replace("£", "").replace(/,/g, "")) || 0;
                  const originalPrice =
                    typeof pkg.price === "number"
                      ? pkg.price
                      : parseFloat(String(pkg.price || 0).replace("£", "").replace(/,/g, "")) || 0;
                  return discountPrice > 0 && originalPrice > discountPrice;
                }) || [];

              return (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-gray-900 font-normal">
                      {priceRange.formatted}
                    </span>
                  </div>
                  {packagesWithDiscounts.length > 0 && (() => {
                    const discountPercentages = packagesWithDiscounts
                      .map((pkg: any) => {
                        const discountPrice =
                          typeof pkg.originalPrice === "number"
                            ? pkg.originalPrice
                            : parseFloat(String(pkg.originalPrice || 0).replace("£", "").replace(/,/g, "")) || 0;
                        const originalPrice =
                          typeof pkg.price === "number"
                            ? pkg.price
                            : parseFloat(String(pkg.price || 0).replace("£", "").replace(/,/g, "")) || 0;
                        if (originalPrice > discountPrice && discountPrice > 0) {
                          return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
                        }
                        return 0;
                      })
                      .filter((p: number) => p > 0);
                    if (discountPercentages.length === 0) return null;
                    const minDiscount = Math.min(...discountPercentages);
                    const maxDiscount = Math.max(...discountPercentages);
                    const hasTimeLimitedDiscount = packagesWithDiscounts.some((pkg: any) => {
                      const validFrom = pkg.originalPriceValidFrom ? new Date(pkg.originalPriceValidFrom) : null;
                      const validUntil = pkg.originalPriceValidUntil ? new Date(pkg.originalPriceValidUntil) : null;
                      const now = new Date();
                      return validUntil && (!validFrom || validFrom <= now) && validUntil >= now;
                    });
                    return (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                        <span
                          className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                          style={{ backgroundColor: "#CC0C39" }}
                        >
                          {minDiscount === maxDiscount ? `${minDiscount}% OFF` : `${minDiscount}% ~ ${maxDiscount}% OFF`}
                        </span>
                        {hasTimeLimitedDiscount && (
                          <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: "#CC0C39" }}>
                            Limited Time Offer
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </>
              );
            }
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
                {service.originalPrice && (() => {
                  const validFrom = service.originalPriceValidFrom ? new Date(service.originalPriceValidFrom) : null;
                  const validUntil = service.originalPriceValidUntil ? new Date(service.originalPriceValidUntil) : null;
                  const now = new Date();
                  const hasTimeLimitedDiscount =
                    validUntil && (!validFrom || validFrom <= now) && validUntil >= now;
                  return (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                      <span
                        className="inline-block text-white text-[10px] md:text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                        style={{ backgroundColor: "#CC0C39" }}
                      >
                        {Math.round(
                          ((parseFloat(String(service.price).replace("£", "")) -
                            parseFloat(String(service.originalPrice).replace("£", ""))) /
                            parseFloat(String(service.price).replace("£", ""))) *
                            100
                        )}
                        % off
                      </span>
                      {hasTimeLimitedDiscount && (
                        <span className="text-[10px] md:text-[11px] font-semibold whitespace-nowrap" style={{ color: "#CC0C39" }}>
                          Limited Time Offer
                        </span>
                      )}
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </div>

        {categoryName && (
          <div className="mb-2 md:mb-2.5">
            <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
              {categoryName}
            </span>
          </div>
        )}

        {purchaseStatsText && (
          <p className="text-[10px] md:text-[11px] text-[#666] mb-2 md:mb-2.5">{purchaseStatsText}</p>
        )}

        {bestSeller && (
          <div className="flex flex-wrap gap-1.5 mb-2 md:mb-2.5">
            <span
              style={{ backgroundColor: "#FF6B00" }}
              className="text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1"
            >
              #1 Best Seller
            </span>
          </div>
        )}

        {service.id === 1 && (
          <div className="mb-2 md:mb-2.5">
            <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666]">New Listing</p>
          </div>
        )}

        {categoryTag && (
          <div className="mb-3">
            <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
              {categoryTag}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 mt-auto">
          {professionalId ? (
            <Link to={`/profile/${professionalId}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Avatar className="w-6 h-6 md:w-7 md:h-7 self-center cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={resolveMediaUrl(service.providerImage)} alt={service.tradingName} />
                <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                  {(service.tradingName || "").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="flex-shrink-0">
              <Avatar className="w-6 h-6 md:w-7 md:h-7 self-center">
                <AvatarImage src={resolveMediaUrl(service.providerImage)} alt={service.tradingName} />
                <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                  {(service.tradingName || "").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              {professionalId ? (
                <Link
                  to={`/profile/${professionalId}`}
                  className="hover:opacity-80 transition-opacity max-w-[65%] md:max-w-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                    by <span className="inline">{displayTradingName}</span>
                  </p>
                </Link>
              ) : (
                <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                  by <span className="inline">{displayTradingName}</span>
                </p>
              )}
              {topRated && (
                <div
                  className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-1 rounded-md"
                  style={{ backgroundColor: "#FFD4A3" }}
                >
                  <Medal className="w-3 h-3 flex-shrink-0" style={{ color: "#2c353f" }} />
                  <span className="hidden md:inline font-['Poppins',sans-serif] text-[10px] font-semibold whitespace-nowrap">
                    Top Rated
                  </span>
                </div>
              )}
              {!topRated && verified && (
                <div className="inline-flex items-center gap-0.5 flex-shrink-0">
                  <div className="relative w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <circle cx="12" cy="12" r="10" fill="#1877F2" />
                      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="hidden md:inline font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#1877F2] font-medium">
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

        {renderFooter}

        <div className="flex items-center justify-between text-[9px] md:text-[10px] text-[#999]">
          <span>{service.deliveryType === "same-day" ? "Delivers in 2 days" : "Standard Delivery"}</span>
          <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#999]" />
        </div>
      </div>
    </div>
  );
}
