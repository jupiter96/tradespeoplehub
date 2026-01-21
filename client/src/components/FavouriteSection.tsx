import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Star,
  MapPin,
  Search,
  Play,
  Medal,
  Clock,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";
import { useCart } from "./CartContext";

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
        setIsPlaying(false);
      });
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
    if (videoRef.current) {
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

// Helper function to resolve media URLs (images/videos)
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

export default function FavouriteSection() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [favourites, setFavourites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favourites from API
  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        setLoading(true);
        const response = await fetch(resolveApiUrl('/api/auth/favourites'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // Transform services to match FeaturedServices format
          const transformedFavourites = (data.favourites || []).map((service: any) => {
            // Check if first gallery item is a video
            let thumbnailVideo = null;
            if (service.gallery && service.gallery.length > 0) {
              const firstItem = service.gallery[0];
              if (firstItem.type === 'video') {
                thumbnailVideo = {
                  url: firstItem.url || firstItem.video,
                  thumbnail: firstItem.thumbnail || service.image,
                };
              }
            }

            return {
              ...service,
              id: service._id || service.id,
              _id: service._id,
              image: service.images?.[0] || service.portfolioImages?.[0] || service.image || "",
              description: service.title || "",
              title: service.title || "",
              tradingName: service.professional?.tradingName || "",
              providerImage: service.professional?.avatar || "",
              professionalId: typeof service.professional === 'object' 
                ? (service.professional._id || service.professional.id)
                : service.professional,
              townCity: service.location || service.postcode || "",
              thumbnailVideo,
            };
          });
          setFavourites(transformedFavourites);
        }
      } catch (error) {
        toast.error("Failed to load favourites");
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, []);

  const handleRemoveFavourite = async (serviceId: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/auth/favourites/${serviceId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setFavourites(favourites.filter(fav => (fav._id || fav.id) !== serviceId));
    toast.success("Removed from favourites");
      } else {
        throw new Error("Failed to remove from favourites");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove from favourites");
    }
  };

  const handleViewService = (service: any) => {
    const identifier = service.slug || service._id || service.id;
    navigate(`/service/${identifier}`);
  };

  const handleAddToCart = (service: any) => {
    addToCart(service);
    toast.success(`${service.title?.substring(0, 30) || 'Service'} added to cart`);
  };

  // Helper functions (same as FeaturedServices)
  const isVerified = (service: any) => {
    return service.providerIsVerified === true;
  };

  const hasTopRated = (service: any) => {
    return service.rating >= 4.8 && service.reviewCount >= 50;
  };

  const getPriceRange = (service: any) => {
    if (!service.packages || service.packages.length === 0) {
      return null;
    }
    
    let minPackagePrice = Infinity;
    let maxPackagePrice = 0;
    
    service.packages.forEach((pkg: any) => {
      const pkgPrice = parseFloat(String(pkg.originalPrice || pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
      if (pkgPrice > 0) {
        if (pkgPrice < minPackagePrice) {
          minPackagePrice = pkgPrice;
        }
        if (pkgPrice > maxPackagePrice) {
          maxPackagePrice = pkgPrice;
        }
      }
    });

    if (minPackagePrice === Infinity || maxPackagePrice === 0) {
      return null;
    }

    return {
      min: minPackagePrice,
      max: maxPackagePrice,
      formatted: minPackagePrice === maxPackagePrice 
        ? `£${minPackagePrice.toFixed(2)}`
        : `£${minPackagePrice.toFixed(2)} - £${maxPackagePrice.toFixed(2)}`,
    };
  };

  // Filter favourites based on search
  const filteredFavourites = favourites.filter(fav =>
    (fav.title || fav.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fav.tradingName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fav.serviceCategory?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
            My Favourites
          </h2>
          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
            Services you've saved for later
          </p>
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search favourites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full font-['Poppins',sans-serif] text-[13px]"
          />
        </div>
      </div>

      {/* Empty State */}
      {!loading && filteredFavourites.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f] mb-2">
            {searchQuery ? "No matching favourites" : "No favourites yet"}
          </h3>
          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery 
              ? "Try searching with different keywords"
              : "Start exploring and save services you like"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => navigate("/services")}
              className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Poppins',sans-serif]"
            >
              Browse Services
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-gray-100 w-full">
              <div className="w-full h-48 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Favourites Grid - Same style as FeaturedServices */}
      {!loading && filteredFavourites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {filteredFavourites.map((service) => {
            const serviceId = service._id || service.id;
            const displayTradingName = service.tradingName?.length > 10 
              ? service.tradingName.substring(0, 10) + '...' 
              : service.tradingName || "";
            const verified = isVerified(service);
            const topRated = hasTopRated(service);
            const priceRange = getPriceRange(service);

            return (
              <div
                key={serviceId}
                onClick={() => handleViewService(service)}
                className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full w-full"
            >
                {/* Image/Video Section */}
                <div className="relative w-full overflow-hidden" style={{ height: '225px' }}>
                  {service.thumbnailVideo ? (
                    <VideoThumbnail
                      videoUrl={service.thumbnailVideo.url}
                      thumbnail={service.thumbnailVideo.thumbnail}
                      fallbackImage={service.image}
                      className="w-full h-full"
                      style={{ minWidth: '100%', minHeight: '100%' }}
                    />
                  ) : (
                <img
                  src={resolveMediaUrl(service.image)}
                      alt={service.description || service.title}
                      className="w-full h-full object-cover object-center"
                      style={{ minWidth: '100%', minHeight: '100%' }}
                    />
                  )}
                  
                  {/* Heart Icon - Top Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavourite(serviceId);
                    }}
                    className="absolute top-2 md:top-3 right-2 md:right-3 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                  >
                    <Heart className="w-4 h-4 md:w-5 md:h-5 fill-[#FE8A0F] text-[#FE8A0F]" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  {/* Title/Description */}
                  <h3 className="font-['Poppins',sans-serif] text-gray-800 font-normal mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1" style={{ fontSize: '16px', fontFamily: "'Poppins', sans-serif" }}>
                    {service.description || service.title}
                </h3>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-2 md:mb-2.5">
                    {service.reviewCount > 0 ? (
                      <>
                        <span className="font-['Poppins',sans-serif] text-[13px] md:text-[15px] text-[#2c353f] font-semibold">
                          {service.rating?.toFixed(1) || '0.0'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                                star <= Math.floor(service.rating || 0)
                                  ? "fill-[#FFB800] text-[#FFB800]"
                                  : star - 0.5 <= (service.rating || 0)
                                  ? "fill-[#FFB800] text-[#FFB800] opacity-50"
                                  : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-['Poppins',sans-serif] text-[11px] md:text-[13px] text-[#666]">
                          ({service.reviewCount || 0})
                    </span>
                      </>
                    ) : null}
                  </div>

                  {/* Price Section */}
                  <div className="mb-2 md:mb-2.5">
                    {priceRange ? (
                      <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-gray-900 font-normal">
                        {priceRange.formatted}
                      </span>
                    ) : (
                      <span className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-gray-900 font-normal">
                        {service.originalPrice || service.price || '£0.00'}
                  </span>
                    )}
                </div>

                  {/* Category Badge */}
                  {service.serviceCategory?.name && (
                    <div className="mb-2 md:mb-2.5">
                      <span className="inline-block bg-gray-100 text-[#2c353f] text-[10px] md:text-[11px] px-2 md:px-3 py-1 rounded-md">
                        {service.serviceCategory.name}
                  </span>
                </div>
                  )}

                  {/* Provider Info */}
                  <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 mt-auto">
                    <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <Avatar className="w-6 h-6 md:w-7 md:h-7 self-center cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={service.providerImage} alt={service.tradingName} />
                        <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                          {service.tradingName?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} className="hover:opacity-80 transition-opacity max-w-[65%] md:max-w-none" onClick={(e) => e.stopPropagation()}>
                          <p className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666] truncate">
                            by <span className="inline">{displayTradingName}</span>
                          </p>
                        </Link>
                        {topRated && (
                          <div className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#2c353f] px-1.5 md:px-2 py-1 rounded-md" style={{ backgroundColor: '#FFD4A3' }}>
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
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#999] flex-shrink-0" />
                        <p className="font-['Poppins',sans-serif] text-[9px] md:text-[10px] text-[#999] truncate">
                          {service.townCity || service.location || "Location not available"}
                    </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex items-center justify-between text-[9px] md:text-[10px] text-[#999]">
                    <span>{service.deliveryType === "same-day" ? "Delivers in 2 days" : "Standard Delivery"}</span>
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#999]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredFavourites.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            <Heart className="w-4 h-4 inline-block mr-2 fill-[#FE8A0F] text-[#FE8A0F]" />
            You have{" "}
            <span className="font-semibold">{filteredFavourites.length}</span>{" "}
            {filteredFavourites.length === 1 ? "service" : "services"} in your favourites
          </p>
        </div>
      )}
    </div>
  );
}