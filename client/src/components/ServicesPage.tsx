import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import { resolveApiUrl } from "../config/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
// Import icons from lucide-react
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Grid3x3, 
  List, 
  Plus, 
  Briefcase, 
  Home, 
  Laptop, 
  Palette, 
  FileText, 
  GraduationCap, 
  Heart, 
  Scale, 
  Users, 
  Camera, 
  Wrench, 
  BookOpen, 
  Medal,
  MapPin, 
  Car, 
  Package, 
  Sparkles,
  Stethoscope,
  PawPrint,
  TruckIcon,
  Loader2,
  BadgeCheck,
  Play,
  Clock,
  type LucideIcon
} from "lucide-react";
import { useCart } from "./CartContext";
import AddToCartModal from "./AddToCartModal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";

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

// SmartImageLayers component for blur background effect
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { Service } from "./servicesData";
import { useSectors, useServiceCategories, type ServiceCategory, type ServiceSubCategory } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory } from "../hooks/useSectorsAndCategories";
import { SEOHead } from "./SEOHead";

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const EARTH_RADIUS_MILES = 3959; // Radius of Earth in miles
  const latitudeDifference = (lat2 - lat1) * Math.PI / 180;
  const longitudeDifference = (lon2 - lon1) * Math.PI / 180;
  const haversineA = 
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2);
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));
  return EARTH_RADIUS_MILES * centralAngle;
};

// Mock function to simulate postcode geocoding
const geocodePostcode = (postcode: string): { latitude: number; longitude: number } | null => {
  // In a real app, this would call a geocoding API
  // For now, return center of London as fallback
  const normalized = postcode.trim().toUpperCase();
  if (normalized.length > 0) {
    // Mock: return center of London
    return { latitude: 51.5074, longitude: -0.1278 };
  }
  return null;
};

// Note: removed unused local `_allServices` mock data (it bloated the bundle and slowed initial load).

export default function ServicesPage() {
  const { addToCart } = useCart();
  const { isLoggedIn, userRole } = useAccount();
  const navigate = useNavigate();
  const { sectorSlug: sectorSlugFromPath, serviceCategorySlug: serviceCategorySlugFromPath, '*': serviceSubCategorySplat } =
    useParams<{
      sectorSlug?: string;
      serviceCategorySlug?: string;
      '*': string;
    }>();
  const [searchParams] = useSearchParams();
  // SEO-friendly path params take precedence over query params
  const sectorSlugParam = sectorSlugFromPath || searchParams.get("sector");
  const serviceCategorySlugParam = serviceCategorySlugFromPath || searchParams.get("serviceCategory");

  // Handle nested subcategories from either:
  // - path splat: /services/:sectorSlug/:serviceCategorySlug/a/b/c
  // - legacy query: ?serviceSubCategory=a&serviceSubCategory=b&serviceSubCategory=c
  const serviceSubCategorySlugParamsFromPath =
    serviceSubCategorySplat?.split("/").filter((s) => s.length > 0) ?? [];
  const serviceSubCategorySlugParams =
    serviceSubCategorySlugParamsFromPath.length > 0
      ? serviceSubCategorySlugParamsFromPath
      : searchParams.getAll("serviceSubCategory");
  const serviceSubCategorySlugParam =
    serviceSubCategorySlugParams.length > 0
      ? serviceSubCategorySlugParams[serviceSubCategorySlugParams.length - 1]
    : null;
  // Legacy URL params for backward compatibility
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");
  const detailedSubcategoryParam = searchParams.get("detailedSubcategory");
  const searchParamFromUrl = searchParams.get("search");
  
  const [searchQuery, setSearchQuery] = useState(searchParamFromUrl || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    subcategoryParam ? [subcategoryParam] : []
  );
  const [selectedDetailedSubcategories, setSelectedDetailedSubcategories] = useState<string[]>(
    detailedSubcategoryParam ? [detailedSubcategoryParam] : []
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categorySearchRef = useRef<HTMLDivElement>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minPriceInput, setMinPriceInput] = useState<string>("0");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("100000");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Add to Cart Modal
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedServiceForCart, setSelectedServiceForCart] = useState<Service | null>(null);
  
  // Liked services
  const [likedServices, setLikedServices] = useState<Set<string>>(new Set());
  
  // Fetch favourites on mount (only for logged-in clients)
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!isLoggedIn || userRole !== 'client') return;
      
      try {
        const response = await fetch(resolveApiUrl('/api/auth/favourites'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const favouriteIds = new Set((data.favourites || []).map((fav: any) => fav._id || fav.id || fav));
          setLikedServices(favouriteIds);
        }
      } catch (error) {
        // Silently fail - favourite check is not critical
      }
    };
    
    fetchFavourites();
  }, [isLoggedIn, userRole]);
  
  const toggleLike = async (e: React.MouseEvent, service: any) => {
    e.stopPropagation();
    
    if (!isLoggedIn || userRole !== 'client') {
      toast.error("Please login as a client to add favourites", {
        action: {
          label: "Login",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }
    
    const serviceId = service._id || service.id;
    if (!serviceId) return;
    
    const serviceIdStr = String(serviceId);
    const isCurrentlyLiked = likedServices.has(serviceIdStr);
    
    // Optimistic update: immediately update UI
    setLikedServices(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(serviceIdStr);
      } else {
        newSet.add(serviceIdStr);
      }
      return newSet;
    });
    
    try {
      if (isCurrentlyLiked) {
        // Remove from favourites
        const response = await fetch(resolveApiUrl(`/api/auth/favourites/${serviceIdStr}`), {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          toast.success("Removed from favourites");
        } else {
          // Rollback on error
          setLikedServices(prev => {
            const newSet = new Set(prev);
            newSet.add(serviceIdStr);
            return newSet;
          });
          throw new Error("Failed to remove from favourites");
        }
      } else {
        // Add to favourites
        const response = await fetch(resolveApiUrl(`/api/auth/favourites/${serviceIdStr}`), {
          method: 'POST',
          credentials: 'include',
        });
        if (response.ok) {
          toast.success("Added to favourites");
        } else {
          // Rollback on error
          setLikedServices(prev => {
            const newSet = new Set(prev);
            newSet.delete(serviceIdStr);
            return newSet;
          });
          throw new Error("Failed to add to favourites");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favourites");
    }
  };
  
  // Location-based filtering
  const [locationSearch, setLocationSearch] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number>(10);
  // Default location: Chelsea, London (51.4875° N, 0.1687° W)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 51.4875,
    longitude: -0.1687
  });

  // Fetch services from API
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [showRadiusSlider, setShowRadiusSlider] = useState(false);

  // Main Sectors (Main Categories)
  const sectors = [
    "Home & Garden",
    "Business Services", 
    "Personal Services",
    "Repair & Maintenance",
    "Technology Services",
    "Education & Tutoring",
    "Beauty & Wellness",
    "Health & Wellness",
    "Legal & Financial",
    "Event Services",
    "Pet Services",
    "Automotive",
    "Moving & Storage"
  ];
  
  const deliveryTypes = ["Same Day", "Standard"];
  
  // Sector to value mapping for lookup
  const sectorToValue: { [key: string]: string } = {
    "Home & Garden": "home-garden",
    "Business Services": "business",
    "Personal Services": "personal",
    "Repair & Maintenance": "repair-maintenance",
    "Technology Services": "technology",
    "Education & Tutoring": "education",
    "Beauty & Wellness": "beauty-wellness",
    "Health & Wellness": "health-wellness",
    "Legal & Financial": "legal-financial",
    "Event Services": "events",
    "Pet Services": "pets",
    "Automotive": "automotive",
    "Moving & Storage": "moving-storage"
  };

  // Categories by sector (subcategories) - from PostJobPage
  const categoriesBySector: { [key: string]: { value: string; label: string }[] } = {
    "home-garden": [
      { value: "plumbing", label: "Plumbing" },
      { value: "electrical", label: "Electrical Work" },
      { value: "carpentry", label: "Carpentry" },
      { value: "painting", label: "Painting & Decorating" },
      { value: "gardening", label: "Gardening & Landscaping" },
      { value: "bathroom-fitting", label: "Bathroom Fitting" },
      { value: "kitchen-fitting", label: "Kitchen Fitting" },
      { value: "building", label: "Building & Construction" },
      { value: "tiling", label: "Tiling" },
      { value: "flooring", label: "Flooring" },
      { value: "roofing", label: "Roofing" },
      { value: "cleaning", label: "Home Cleaning" },
    ],
    "business": [
      { value: "consulting", label: "Business Consulting" },
      { value: "marketing", label: "Marketing & Advertising" },
      { value: "content-writing", label: "Content Writing" },
      { value: "virtual-assistant", label: "Virtual Assistant" },
      { value: "seo", label: "SEO Services" },
      { value: "web-development", label: "Web Development" },
      { value: "graphic-design", label: "Graphic Design" },
      { value: "bookkeeping", label: "Bookkeeping" },
      { value: "social-media", label: "Social Media Management" },
    ],
    "personal": [
      { value: "personal-training", label: "Personal Training" },
      { value: "life-coaching", label: "Life Coaching" },
      { value: "meal-prep", label: "Meal Preparation" },
      { value: "personal-shopping", label: "Personal Shopping" },
      { value: "organizing", label: "Professional Organizing" },
      { value: "cleaning", label: "Personal Cleaning Services" },
    ],
    "repair-maintenance": [
      { value: "handyman", label: "Handyman Services" },
      { value: "appliance-repair", label: "Appliance Repair" },
      { value: "hvac", label: "HVAC Repair" },
      { value: "locksmith", label: "Locksmith Services" },
      { value: "window-repair", label: "Window & Door Repair" },
      { value: "furniture-repair", label: "Furniture Repair" },
    ],
    "technology": [
      { value: "computer-repair", label: "Computer Repair" },
      { value: "web-development", label: "Web Development" },
      { value: "app-development", label: "App Development" },
      { value: "it-support", label: "IT Support" },
      { value: "network-setup", label: "Network Setup" },
      { value: "software-development", label: "Software Development" },
      { value: "cybersecurity", label: "Cybersecurity" },
    ],
    "education": [
      { value: "math-tutoring", label: "Math Tutoring" },
      { value: "english-tutoring", label: "English Tutoring" },
      { value: "science-tutoring", label: "Science Tutoring" },
      { value: "music-lessons", label: "Music Lessons" },
      { value: "language-tutoring", label: "Language Tutoring" },
      { value: "exam-prep", label: "Exam Preparation" },
      { value: "online-courses", label: "Online Courses" },
    ],
    "beauty-wellness": [
      { value: "hair-styling", label: "Hair Styling" },
      { value: "makeup", label: "Makeup Services" },
      { value: "nail-services", label: "Nail Services" },
      { value: "massage", label: "Massage Therapy" },
      { value: "spa-treatments", label: "Spa Treatments" },
      { value: "yoga", label: "Yoga & Pilates" },
    ],
    "health-wellness": [
      { value: "nutrition", label: "Nutrition Counseling" },
      { value: "therapy", label: "Therapy & Counseling" },
      { value: "physiotherapy", label: "Physiotherapy" },
      { value: "personal-training", label: "Personal Training" },
      { value: "meditation", label: "Meditation Coaching" },
    ],
    "legal-financial": [
      { value: "legal-advice", label: "Legal Advice" },
      { value: "accounting", label: "Accounting Services" },
      { value: "tax-services", label: "Tax Services" },
      { value: "financial-planning", label: "Financial Planning" },
      { value: "immigration", label: "Immigration Services" },
    ],
    "events": [
      { value: "photography", label: "Event Photography" },
      { value: "videography", label: "Event Videography" },
      { value: "catering", label: "Catering Services" },
      { value: "dj-services", label: "DJ Services" },
      { value: "event-planning", label: "Event Planning" },
      { value: "decoration", label: "Event Decoration" },
    ],
    "pets": [
      { value: "pet-grooming", label: "Pet Grooming" },
      { value: "pet-sitting", label: "Pet Sitting" },
      { value: "dog-walking", label: "Dog Walking" },
      { value: "pet-training", label: "Pet Training" },
      { value: "vet-services", label: "Veterinary Services" },
    ],
    "automotive": [
      { value: "car-repair", label: "Car Repair" },
      { value: "car-maintenance", label: "Car Maintenance" },
      { value: "car-detailing", label: "Car Detailing" },
      { value: "bodywork", label: "Bodywork & Paint" },
      { value: "towing", label: "Towing Services" },
    ],
    "moving-storage": [
      { value: "moving-services", label: "Moving Services" },
      { value: "packing", label: "Packing Services" },
      { value: "storage", label: "Storage Solutions" },
      { value: "delivery", label: "Delivery Services" },
      { value: "furniture-assembly", label: "Furniture Assembly" },
    ],
  };
  
  // Get available main categories based on selected sector
  const availableMainCategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }
    const selectedSector = selectedCategories[0]; // Since we now have single selection
    const sectorValue = sectorToValue[selectedSector];
    return categoriesBySector[sectorValue] || [];
  }, [selectedCategories]);

  // Complete category tree structure
  type CategoryTree = {
    sector: string;
    sectorValue: string;
    sectorId?: string; // For lazy loading
    mainCategories: {
      name: string;
      value: string;
      categoryId?: string; // For lazy loading
      subCategories: string[];
      hasSubCategories?: boolean; // Track if subcategories are loaded
    }[];
  };

  // Load sectors from API
  const { sectors: apiSectors, loading: sectorsLoading } = useSectors(false, false);
  
  // Load legacy categories for fallback
  const { sectors: legacySectors } = useSectors(true, true);
  
  // Debug: Track sectors loading
  useEffect(() => {
    console.log('[ServicesPage] Sectors loading state:', {
      sectorsLoading,
      apiSectorsCount: apiSectors.length,
      apiSectors: apiSectors,
      legacySectorsCount: legacySectors.length
    });
  }, [sectorsLoading, apiSectors, legacySectors]);
  
  // Load service categories lazily per sector (Map: sectorId -> ServiceCategory[])
  const [serviceCategoriesBySector, setServiceCategoriesBySector] = useState<Map<string, ServiceCategory[]>>(new Map());
  const [loadingSectors, setLoadingSectors] = useState<Set<string>>(new Set());
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  
  // Fetch service categories for a specific sector (lazy loading)
  const fetchServiceCategoriesForSector = async (sectorId: string) => {
    // Skip if already loaded or loading
    if (serviceCategoriesBySector.has(sectorId) || loadingSectors.has(sectorId)) {
      return;
    }
    
    try {
      setLoadingSectors(prev => new Set(prev).add(sectorId));
      const { resolveApiUrl } = await import("../config/api");
      
      const response = await fetch(
        resolveApiUrl(`/api/service-categories?sectorId=${sectorId}&activeOnly=true&includeSubCategories=false&sortBy=order&sortOrder=asc`),
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const categories = data.serviceCategories || [];
        setServiceCategoriesBySector(prev => {
          const newMap = new Map(prev);
          newMap.set(sectorId, categories);
          return newMap;
        });
      }
    } catch (error) {
      // console.error(`Error fetching service categories for sector ${sectorId}:`, error);
    } finally {
      setLoadingSectors(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectorId);
        return newSet;
      });
    }
  };
  
  // Fetch subcategories for a specific service category (lazy loading)
  const fetchSubCategoriesForCategory = async (categoryId: string, sectorId: string) => {
    // Skip if already loading
    if (loadingCategories.has(categoryId)) {
      return;
    }
    
    try {
      setLoadingCategories(prev => new Set(prev).add(categoryId));
      const { resolveApiUrl } = await import("../config/api");
      
      const response = await fetch(
        resolveApiUrl(`/api/service-categories/${categoryId}?includeSubCategories=true&activeOnly=true`),
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const category = data.serviceCategory;
        if (category && category.subCategories) {
          // Update the category in the map with subcategories
          setServiceCategoriesBySector(prev => {
            const newMap = new Map(prev);
            const categories = newMap.get(sectorId) || [];
            const updatedCategories = categories.map((cat: ServiceCategory) => 
              cat._id === categoryId ? { ...cat, subCategories: category.subCategories } : cat
            );
            newMap.set(sectorId, updatedCategories);
            return newMap;
          });
        }
      }
    } catch (error) {
      // console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    } finally {
      setLoadingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };
  
  // Convert API data to categoryTree format, sorted by order
  // Lazy loading: Only show categories for sectors that have been expanded/loaded
  const categoryTree: CategoryTree[] = useMemo(() => {
    
    if (apiSectors.length > 0) {
      const sortedSectors = [...apiSectors].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return sortedSectors.map((sector: Sector) => {
        // Get service categories for this sector (if loaded)
        const sectorServiceCategories = serviceCategoriesBySector.get(sector._id) || [];
        const sortedCategories = [...sectorServiceCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        return {
          sector: sector.name,
          sectorValue: sector.slug || sector.name.toLowerCase().replace(/\s+/g, '-'),
          sectorId: sector._id, // Add sectorId for lazy loading
          mainCategories: sortedCategories.map((serviceCategory: ServiceCategory) => {
            // Only include subcategories if they've been loaded
            const sortedSubCategories = ((serviceCategory.subCategories || []) as ServiceSubCategory[])
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            return {
              name: serviceCategory.name,
              value: serviceCategory.slug || serviceCategory.name.toLowerCase().replace(/\s+/g, '-'),
              categoryId: serviceCategory._id, // Add categoryId for lazy loading
              subCategories: sortedSubCategories.map((subCat: ServiceSubCategory) => subCat.name),
              hasSubCategories: serviceCategory.subCategories !== undefined // Track if subcategories are loaded
            };
          })
        };
      });
    }
    
    // Fallback to legacy categories if service categories are not available
    if (legacySectors.length > 0) {
      const sortedSectors = [...legacySectors].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return sortedSectors.map((sector: Sector) => {
        const sortedCategories = ((sector.categories || []) as Category[])
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        return {
          sector: sector.name,
          sectorValue: sector.slug || sector.name.toLowerCase().replace(/\s+/g, '-'),
          sectorId: sector._id,
          mainCategories: sortedCategories.map((category: Category) => {
            const sortedSubCategories = ((category.subCategories || []) as SubCategory[])
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            return {
              name: category.name,
              value: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
              subCategories: sortedSubCategories.map((subCat: SubCategory) => subCat.name),
              hasSubCategories: true
            };
          })
        };
      });
    }
    
    // Return empty array if no data available
    const result: CategoryTree[] = [];
    return result;
  }, [apiSectors, legacySectors, serviceCategoriesBySector]);
  
  // Debug: Track categoryTree changes (removed to prevent infinite loops)

  // Selected filters - new approach with type and value
  type SelectedFilter = {
    type: 'sector' | 'mainCategory' | 'subCategory';
    sector?: string;
    mainCategory?: string;
    subCategory?: string;
    displayName: string;
  };

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilter[]>([]);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedMainCategories, setExpandedMainCategories] = useState<Set<string>>(new Set());

  // Refs to prevent infinite loops and concurrent fetches
  const isFetchingRef = useRef(false);
  const prevFetchKeyRef = useRef<string>("");

  // Create stable string representations for dependency comparison
  const filtersKey = useMemo(() => JSON.stringify(selectedFilters), [selectedFilters]);
  const apiSectorsKey = useMemo(() => apiSectors.map(s => s._id).join(','), [apiSectors]);
  const allServiceCategoriesKey = useMemo(() => {
    const allCategories: ServiceCategory[] = [];
    serviceCategoriesBySector.forEach(categories => allCategories.push(...categories));
    return allCategories.map(sc => sc._id).join(',');
  }, [serviceCategoriesBySector]);
  const urlParamsKey = useMemo(() => 
    `${sectorSlugParam || ''}-${serviceCategorySlugParam || ''}-${serviceSubCategorySlugParam || ''}`, 
    [sectorSlugParam, serviceCategorySlugParam, serviceSubCategorySlugParam]
  );

  // Fetch services from API when filters change
  useEffect(() => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    // Check if anything actually changed
    const currentKey = `${filtersKey}-${searchQuery}-${urlParamsKey}-${apiSectorsKey}-${allServiceCategoriesKey}`;
    if (currentKey === prevFetchKeyRef.current) {
      return;
    }

    const fetchServices = async () => {
      if (isFetchingRef.current) {
        return;
      }
      
      try {
        isFetchingRef.current = true;
        setServicesLoading(true);
        const { resolveApiUrl } = await import("../config/api");

        // Build query params
        const params = new URLSearchParams();
        
        // Priority 1: URL params (for direct navigation to category pages)
        if (serviceSubCategorySlugParam) {
          try {
            const response = await fetch(
              resolveApiUrl(`/api/service-subcategories/${serviceSubCategorySlugParam}?activeOnly=true`),
              { credentials: 'include' }
            );
            if (response.ok) {
              const data = await response.json();
              const subcategory = data.serviceSubCategory;
              if (subcategory) {
                params.append('serviceSubCategoryId', subcategory._id);
              }
            }
          } catch (error) {
            // console.error("Error fetching subcategory:", error);
          }
        } else if (serviceCategorySlugParam) {
          try {
            const response = await fetch(
              resolveApiUrl(`/api/service-categories/${serviceCategorySlugParam}?activeOnly=true`),
              { credentials: 'include' }
            );
            if (response.ok) {
              const data = await response.json();
              const category = data.serviceCategory;
              if (category) {
                params.append('serviceCategoryId', category._id);
              }
            }
          } catch (error) {
            // console.error("Error fetching category:", error);
          }
        } else if (sectorSlugParam) {
          const sectors = await fetch(resolveApiUrl('/api/sectors?activeOnly=true'), { credentials: 'include' })
            .then(r => r.json())
            .then(d => d.sectors || []);
          const sector = sectors.find((s: any) => s.slug === sectorSlugParam);
          if (sector) {
            params.append('sectorId', sector._id);
          }
        } 
        // Priority 2: UI selected filters (when no URL params)
        else if (selectedFilters.length > 0) {
          // Convert selectedFilters to API parameters
          // Use the most specific filter available
          const subCategoryFilter = selectedFilters.find(f => f.type === 'subCategory');
          const mainCategoryFilter = selectedFilters.find(f => f.type === 'mainCategory');
          const sectorFilter = selectedFilters.find(f => f.type === 'sector');
          
          if (subCategoryFilter) {
            // Find subcategory ID by name
            for (const [sectorId, categories] of serviceCategoriesBySector.entries()) {
              const matchingCategory = categories.find(sc => 
                sc.name === subCategoryFilter.mainCategory
              );
              if (matchingCategory && matchingCategory.subCategories) {
                const matchingSubCategory = (matchingCategory.subCategories as ServiceSubCategory[]).find(
                  sub => sub.name === subCategoryFilter.subCategory
                );
                if (matchingSubCategory) {
                  params.append('serviceSubCategoryId', matchingSubCategory._id);
                  break;
                }
              }
            }
          } else if (mainCategoryFilter) {
            // Find category ID by name
            for (const [sectorId, categories] of serviceCategoriesBySector.entries()) {
              const matchingCategory = categories.find(sc => 
                sc.name === mainCategoryFilter.mainCategory
              );
              if (matchingCategory) {
                params.append('serviceCategoryId', matchingCategory._id);
                break;
              }
            }
          } else if (sectorFilter) {
            // Find sector ID by name
            const matchingSector = apiSectors.find(s => s.name === sectorFilter.sector);
            if (matchingSector) {
              params.append('sectorId', matchingSector._id);
            }
          }
        }
        
        // Add search query if present
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        // Use public endpoint - returns approved & active services
        const response = await fetch(
          resolveApiUrl(`/api/services/public?${params.toString()}`),
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          // Transform API data to match Service interface
          const transformedServices: Service[] = (data.services || []).map((s: any) => {
            // Determine thumbnail image/video - prioritize gallery first item if it's a video
            let thumbnailImage = "";
            let thumbnailVideo: { url: string; thumbnail?: string } | null = null;
            
            // Check gallery array first (new format)
            if (s.gallery && Array.isArray(s.gallery) && s.gallery.length > 0) {
              const firstItem = s.gallery[0];
              if (firstItem.type === 'video' && firstItem.url) {
                thumbnailVideo = {
                  url: firstItem.url,
                  thumbnail: firstItem.thumbnail
                };
                thumbnailImage = firstItem.thumbnail || "";
              } else if (firstItem.type === 'image' && firstItem.url) {
                thumbnailImage = firstItem.url;
              }
            }
            
            // Fallback to legacy format if gallery not available or no video found
            if (!thumbnailImage && !thumbnailVideo) {
              thumbnailImage = s.images?.[0] || s.portfolioImages?.[0] || "";
            }
            
            return {
            id: parseInt(s._id.slice(-8), 16) || Math.floor(Math.random() * 10000),
            _id: s._id,
            slug: s.slug,
            image: thumbnailImage,
            thumbnailVideo: thumbnailVideo,
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
            // Only use originalPrice if discount is still valid (within date range)
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
            townCity: (() => {
              // Check if professional is populated as an object
              if (s.professional && typeof s.professional === 'object' && s.professional !== null) {
                // Get townCity value (even if it's empty string, null, or undefined)
                const townCityValue = s.professional.townCity;
                // Return the value if it exists (including empty string), otherwise return empty string
                return townCityValue !== undefined && townCityValue !== null ? String(townCityValue) : "";
              }
              // If professional is not populated, return empty string
              return "";
            })(),
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
            thumbnailVideo: thumbnailVideo,
            _id: s._id, // Keep original ID for navigation
            _serviceCategory: s.serviceCategory,
            _serviceSubCategory: s.serviceSubCategory,
          };
          });
          setAllServices(transformedServices);
        } else {
          // console.error("Failed to fetch services");
          setAllServices([]);
        }
      } catch (error) {
        // console.error("Error fetching services:", error);
        setAllServices([]);
      } finally {
        setServicesLoading(false);
        isFetchingRef.current = false;
        prevFetchKeyRef.current = currentKey;
      }
    };

    fetchServices();
  }, [filtersKey, searchQuery, urlParamsKey, apiSectorsKey, allServiceCategoriesKey, sectorSlugParam, serviceCategorySlugParam, serviceSubCategorySlugParam]);

  // Sector icon mapping for sidebar
  const getSectorIcon = (sectorName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      "Home & Garden": <Home className="w-4 h-4 text-[#FE8A0F]" />,
      "Business Services": <Briefcase className="w-4 h-4 text-[#FE8A0F]" />,
      "Personal Services": <Users className="w-4 h-4 text-[#FE8A0F]" />,
      "Repair & Maintenance": <Wrench className="w-4 h-4 text-[#FE8A0F]" />,
      "Technology Services": <Laptop className="w-4 h-4 text-[#FE8A0F]" />,
      "Education & Tutoring": <GraduationCap className="w-4 h-4 text-[#FE8A0F]" />,
      "Beauty & Wellness": <Heart className="w-4 h-4 text-[#FE8A0F]" />,
      "Health & Wellness": <Stethoscope className="w-4 h-4 text-[#FE8A0F]" />,
      "Legal & Financial": <Scale className="w-4 h-4 text-[#FE8A0F]" />,
      "Event Services": <Camera className="w-4 h-4 text-[#FE8A0F]" />,
      "Pet Services": <PawPrint className="w-4 h-4 text-[#FE8A0F]" />,
      "Automotive": <Car className="w-4 h-4 text-[#FE8A0F]" />,
      "Moving & Storage": <TruckIcon className="w-4 h-4 text-[#FE8A0F]" />,
    };
    return iconMap[sectorName] || <Package className="w-4 h-4 text-[#FE8A0F]" />;
  };

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      "Home & Garden": <Home className="w-3 h-3" />,
      "Personal Services": <Users className="w-3 h-3" />,
      "Business Services": <Briefcase className="w-3 h-3" />,
      "Cleaning Services": <Home className="w-3 h-3" />,
      "Repair & Maintenance": <Wrench className="w-3 h-3" />,
      "Beauty & Wellness": <Heart className="w-3 h-3" />,
      "Event Services": <Camera className="w-3 h-3" />,
      "Professional Services": <Briefcase className="w-3 h-3" />,
      "Education & Tutoring": <GraduationCap className="w-3 h-3" />,
      "Pet Services": <Heart className="w-3 h-3" />,
      "Technology Services": <Laptop className="w-3 h-3" />,
      "Legal & Financial": <Scale className="w-3 h-3" />,
    };
    return iconMap[category] || <Package className="w-3 h-3" />;
  };

  // Update search query when URL parameter changes
  useEffect(() => {
    if (searchParamFromUrl) {
      setSearchQuery(searchParamFromUrl);
    }
  }, [searchParamFromUrl]);

  // Initialize filters from URL parameters and auto-expand categories
  useEffect(() => {
    // Don't run if data isn't ready yet
    if (apiSectors.length === 0) {
      return;
    }
    
    // Wait for sectors to be loaded - categories can be loaded lazily
    // No need to wait for categoryTree - we can work with apiSectors directly

    const filters: SelectedFilter[] = [];
    
    // Priority: New service category URL params > Legacy category params
    if (sectorSlugParam && serviceCategorySlugParam) {
      // Find the sector by slug
      const matchedSector = apiSectors.find((s: Sector) => s.slug === sectorSlugParam);
      
      if (matchedSector) {
        // Find the service category by slug (load if not already loaded)
        const sectorCategories = serviceCategoriesBySector.get(matchedSector._id) || [];
        let matchedServiceCategory = sectorCategories.find((sc: ServiceCategory) => 
          sc.slug === serviceCategorySlugParam
        );
        
        // If not found and not loading, trigger fetch and expand sector
        if (!matchedServiceCategory && !loadingSectors.has(matchedSector._id)) {
          const sectorValue = matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-');
          setExpandedSectors(prev => new Set(prev).add(sectorValue));
          fetchServiceCategoriesForSector(matchedSector._id);
        } else if (matchedServiceCategory) {
          // Auto-expand the sector
          const sectorValue = matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-');
          setExpandedSectors(prev => new Set(prev).add(sectorValue));
          
          // If subcategory is specified, expand main category and load subcategories
          if (serviceSubCategorySlugParams.length > 0 || serviceSubCategorySlugParam) {
            const mainCatKey = `${sectorValue}-${matchedServiceCategory.slug || matchedServiceCategory.name.toLowerCase().replace(/\s+/g, '-')}`;
            setExpandedMainCategories(prev => new Set(prev).add(mainCatKey));
            
            // Load subcategories if not already loaded
            if (!matchedServiceCategory.subCategories && !loadingCategories.has(matchedServiceCategory._id)) {
              fetchSubCategoriesForCategory(matchedServiceCategory._id, matchedSector._id);
            }
          }
        }
        
        if (matchedServiceCategory) {
          // Handle multiple serviceSubCategory parameters (nested subcategories)
          if (serviceSubCategorySlugParams.length > 0) {
            // Traverse the nested subcategory path to find the last one
            let currentSubCategory: ServiceSubCategory | null = null;
            let currentParentId: string | undefined = undefined;
            const subCategoryPath: string[] = [];
            
            // Start from the service category's subcategories
            for (let i = 0; i < serviceSubCategorySlugParams.length; i++) {
              const slug = serviceSubCategorySlugParams[i];
              
              // Find subcategory by slug
              const foundSubCategory = currentParentId
                ? null // We'll need to fetch nested subcategories via API
                : matchedServiceCategory.subCategories?.find(
                    (subCat: ServiceSubCategory) => subCat.slug === slug || subCat.name === slug
                  );
              
              if (foundSubCategory) {
                currentSubCategory = foundSubCategory;
                currentParentId = foundSubCategory._id;
                subCategoryPath.push(foundSubCategory.name);
              } else if (currentSubCategory) {
                // Try to find in nested subcategories (we'll use the last found one)
                // For now, we'll use the last subcategory found
                break;
              }
            }
            
            // Use the last subcategory in the path
            if (currentSubCategory) {
              const lastSubCategoryName = subCategoryPath[subCategoryPath.length - 1] || currentSubCategory.name;
              
              filters.push({
                type: 'subCategory',
                sector: matchedSector.name,
                mainCategory: matchedServiceCategory.name,
                subCategory: lastSubCategoryName,
                displayName: lastSubCategoryName
              });
              
              setExpandedSectors(prev => {
                const newSet = new Set(prev);
                newSet.add(matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-'));
                return newSet;
              });
              
              const key = `${matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-')}-${matchedServiceCategory.slug || matchedServiceCategory.name.toLowerCase().replace(/\s+/g, '-')}`;
              setExpandedMainCategories(prev => {
                const newSet = new Set(prev);
                newSet.add(key);
                return newSet;
              });
            } else if (serviceSubCategorySlugParam) {
              // Fallback: try to find by the last slug parameter
            const matchedSubCategory = matchedServiceCategory.subCategories?.find(
              (subCat: ServiceSubCategory) => subCat.slug === serviceSubCategorySlugParam || subCat.name === serviceSubCategorySlugParam
            );
            
            if (matchedSubCategory) {
              filters.push({
                type: 'subCategory',
                sector: matchedSector.name,
                mainCategory: matchedServiceCategory.name,
                subCategory: matchedSubCategory.name,
                displayName: matchedSubCategory.name
              });
              
              setExpandedSectors(prev => {
                const newSet = new Set(prev);
                newSet.add(matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-'));
                return newSet;
              });
              
              const key = `${matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-')}-${matchedServiceCategory.slug || matchedServiceCategory.name.toLowerCase().replace(/\s+/g, '-')}`;
              setExpandedMainCategories(prev => {
                const newSet = new Set(prev);
                newSet.add(key);
                return newSet;
              });
              }
            }
          } else {
            // Only service category selected
            filters.push({
              type: 'mainCategory',
              sector: matchedSector.name,
              mainCategory: matchedServiceCategory.name,
              displayName: matchedServiceCategory.name
            });
            
            setExpandedSectors(prev => {
              const newSet = new Set(prev);
              newSet.add(matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-'));
              return newSet;
            });
          }
        } else {
          // Only sector selected
          filters.push({
            type: 'sector',
            sector: matchedSector.name,
            displayName: matchedSector.name
          });
          
          setExpandedSectors(prev => {
            const newSet = new Set(prev);
            newSet.add(matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-'));
            return newSet;
          });
        }
      }
    } else if (sectorSlugParam) {
      // Only sector selected (e.g., /services/home-garden)
      const matchedSector = apiSectors.find((s: Sector) => s.slug === sectorSlugParam);
      if (matchedSector) {
        filters.push({
          type: 'sector',
          sector: matchedSector.name,
          displayName: matchedSector.name
        });
        
        setExpandedSectors(prev => {
          const newSet = new Set(prev);
          newSet.add(matchedSector.slug || matchedSector.name.toLowerCase().replace(/\s+/g, '-'));
          return newSet;
        });
      }
    } else if (categoryParam || subcategoryParam || detailedSubcategoryParam) {
      // Legacy URL params for backward compatibility
      // Calculate categoryTree inline to avoid dependency on categoryTree
      const currentCategoryTree: CategoryTree[] = apiSectors.length > 0
        ? apiSectors.map((sector: Sector) => ({
            sector: sector.name,
            sectorValue: sector.slug || sector.name.toLowerCase().replace(/\s+/g, '-'),
            sectorId: sector._id,
            mainCategories: (serviceCategoriesBySector.get(sector._id) || []).map((sc: ServiceCategory) => ({
              name: sc.name,
              value: sc.slug || sc.name.toLowerCase().replace(/\s+/g, '-'),
              categoryId: sc._id,
              subCategories: (sc.subCategories || []).map((subCat: ServiceSubCategory) => subCat.name),
              hasSubCategories: sc.subCategories !== undefined
            }))
          }))
        : legacySectors.length > 0
        ? legacySectors.map((sector: Sector) => ({
            sector: sector.name,
            sectorValue: sector.slug || sector.name.toLowerCase().replace(/\s+/g, '-'),
            sectorId: sector._id,
            mainCategories: ((sector.categories || []) as Category[]).map((category: Category) => ({
              name: category.name,
              value: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
              subCategories: ((category.subCategories || []) as SubCategory[]).map((subCat: SubCategory) => subCat.name),
              hasSubCategories: true
            }))
          }))
        : [];
      
      const matchedSector = currentCategoryTree.find(s => s.sector === categoryParam);
      
      if (matchedSector) {
        if (detailedSubcategoryParam && subcategoryParam) {
          const matchedMainCat = matchedSector.mainCategories.find(mc => mc.name === subcategoryParam);
          
          if (matchedMainCat) {
            filters.push({
              type: 'subCategory',
              sector: matchedSector.sector,
              mainCategory: matchedMainCat.name,
              subCategory: detailedSubcategoryParam,
              displayName: detailedSubcategoryParam
            });
            
            setExpandedSectors(prev => {
              const newSet = new Set(prev);
              newSet.add(matchedSector.sectorValue);
              return newSet;
            });
            
            const key = `${matchedSector.sectorValue}-${matchedMainCat.value}`;
            setExpandedMainCategories(prev => {
              const newSet = new Set(prev);
              newSet.add(key);
              return newSet;
            });
          }
        } else if (subcategoryParam) {
          const matchedMainCat = matchedSector.mainCategories.find(mc => mc.name === subcategoryParam);
          
          if (matchedMainCat) {
            filters.push({
              type: 'mainCategory',
              sector: matchedSector.sector,
              mainCategory: matchedMainCat.name,
              displayName: subcategoryParam
            });
            
            setExpandedSectors(prev => {
              const newSet = new Set(prev);
              newSet.add(matchedSector.sectorValue);
              return newSet;
            });
          }
        } else {
          filters.push({
            type: 'sector',
            sector: matchedSector.sector,
            displayName: categoryParam
          });
          
          setExpandedSectors(prev => {
            const newSet = new Set(prev);
            newSet.add(matchedSector.sectorValue);
            return newSet;
          });
        }
      }
    }
    
    // Only update if filters actually changed
    const newFiltersKey = JSON.stringify(filters);
    const currentFiltersKey = JSON.stringify(selectedFilters);
    
    // Use functional update to avoid dependency on selectedFilters
    // Only update filters if URL params have changed and filters need to be set
    // Don't clear filters if user manually removed them (URL will be updated by removeFilter)
    setSelectedFilters(prev => {
      const prevKey = JSON.stringify(prev);
      
      // If URL params exist and filters need to be set
      if (filters.length > 0) {
        // Only update if the new filters are different from current
        if (newFiltersKey !== prevKey) {
          return filters;
        }
      } 
      // If URL params don't exist and no filters should be generated, clear filters
      else if (filters.length === 0 && prev.length > 0) {
        // Check if URL params exist
        const hasUrlParams = !!(sectorSlugParam || serviceCategorySlugParam || serviceSubCategorySlugParam || 
                                categoryParam || subcategoryParam || detailedSubcategoryParam);
        // If no URL params, clear filters (URL was cleared by removeFilter)
        if (!hasUrlParams) {
          return [];
        }
        // URL params exist but no filters generated - this shouldn't happen, keep current filters
        return prev;
      }
      
      return prev; // No change needed
    });
  }, [sectorSlugParam, serviceCategorySlugParam, serviceSubCategorySlugParams, serviceSubCategorySlugParam, categoryParam, subcategoryParam, detailedSubcategoryParam, apiSectors, serviceCategoriesBySector]);

  // Auto-expand categories when filters change
  useEffect(() => {
    selectedFilters.forEach(filter => {
      // Find the sector in categoryTree to get the sectorValue
      const matchedSector = categoryTree.find(s => s.sector === filter.sector);
      
      if (matchedSector) {
        setExpandedSectors(prev => {
          const newSet = new Set(prev);
          newSet.add(matchedSector.sectorValue);
          return newSet;
        });
        
        // If mainCategory exists, find it and expand it
        if (filter.mainCategory) {
          const matchedMainCat = matchedSector.mainCategories.find(mc => mc.name === filter.mainCategory);
          
          if (matchedMainCat) {
            const key = `${matchedSector.sectorValue}-${matchedMainCat.value}`;
            setExpandedMainCategories(prev => {
              const newSet = new Set(prev);
              newSet.add(key);
              return newSet;
            });
          }
        }
      }
    });
  }, [selectedFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categorySearchRef.current && !categorySearchRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter and sort services with distance calculation
  // Note: Category filtering and search are done by backend API
  // Frontend applies additional filters (delivery, rating, price, location)
  const filteredAndSortedServices = useMemo(() => {
    // Calculate distance for all services
    const servicesWithDistance = allServices.map(service => ({
      ...service,
      distance: userCoords && service.latitude && service.longitude
        ? calculateDistance(userCoords.latitude, userCoords.longitude, service.latitude, service.longitude)
        : undefined
    }));

    // Apply all filters
    let filtered = servicesWithDistance.filter((service) => {
      // 0. Category/Sector filters (selectedFilters)
      // Only apply frontend filtering if URL params are not present (backend already filtered)
      const hasUrlParams = !!(sectorSlugParam || serviceCategorySlugParam || serviceSubCategorySlugParam);
      if (!hasUrlParams && selectedFilters.length > 0) {
        const matchesFilter = selectedFilters.some(filter => {
          if (filter.type === 'subCategory') {
            // Match subcategory filter
            return service.category === filter.sector &&
                   service.subcategory === filter.mainCategory &&
                   service.detailedSubcategory === filter.subCategory;
          } else if (filter.type === 'mainCategory') {
            // Match main category filter
            return service.category === filter.sector &&
                   service.subcategory === filter.mainCategory;
          } else if (filter.type === 'sector') {
            // Match sector filter
            return service.category === filter.sector;
          }
          return false;
        });
        
        if (!matchesFilter) {
          return false;
        }
      }

      // 1. Location filter (radius-based distance)
      if (userCoords && service.distance !== undefined) {
        if (service.distance > radiusMiles) {
          return false;
        }
      }

      // 2. Location text search
      if (locationSearch.trim()) {
        const locationLower = locationSearch.toLowerCase();
        const matchesLocation = 
          service.location?.toLowerCase().includes(locationLower) ||
          service.postcode?.toLowerCase().includes(locationLower) ||
          service.townCity?.toLowerCase().includes(locationLower);
        if (!matchesLocation) {
          return false;
        }
      }

      // 3. Delivery filter
      if (selectedDelivery.length > 0) {
        const matchesDelivery = 
          (selectedDelivery.includes("Same Day") && service.deliveryType === "same-day") ||
          (selectedDelivery.includes("Standard") && service.deliveryType === "standard");
        if (!matchesDelivery) {
          return false;
        }
      }

      // 4. Rating filter
      if (selectedRating > 0) {
        if (service.rating < selectedRating) {
          return false;
        }
      }

      // 5. Price filter
      const actualPrice = service.originalPrice || service.price;
      const priceValue = parseFloat(String(actualPrice).replace(/[£,]/g, ''));
      if (isNaN(priceValue) || priceValue < priceRange[0] || priceValue > priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sort services
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.originalPrice || a.price).replace('£', ''));
          const priceB = parseFloat(String(b.originalPrice || b.price).replace('£', ''));
          return priceA - priceB;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.originalPrice || a.price).replace('£', ''));
          const priceB = parseFloat(String(b.originalPrice || b.price).replace('£', ''));
          return priceB - priceA;
        });
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "distance":
        filtered.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
        break;
      case "popular":
      default:
        filtered.sort((a, b) => b.completedTasks - a.completedTasks);
        break;
    }

    // Move new professionals (no reviews/tasks) to the top for visibility
    const newProfessionals = filtered.filter(s => s.reviewCount === 0 && s.completedTasks === 0);
    const experiencedProfessionals = filtered.filter(s => s.reviewCount > 0 || s.completedTasks > 0);
    
    return [...newProfessionals, ...experiencedProfessionals];
  }, [allServices, selectedFilters, selectedDelivery, selectedRating, priceRange, sortBy, userCoords, radiusMiles, locationSearch]);

  // Filter category tree based on selected filters (show only relevant sectors)
  const filteredCategoryTree = useMemo(() => {
    // If no filters are selected, show all sectors
    if (selectedFilters.length === 0) {
      return categoryTree;
    }

    // Check if we have a subCategory filter selected
    const subCategoryFilter = selectedFilters.find(f => f.type === 'subCategory');
    
    if (subCategoryFilter) {
      // If subCategory is selected, show only the same-level subcategories
      const sector = categoryTree.find(s => s.sector === subCategoryFilter.sector);
      if (sector) {
        const mainCat = sector.mainCategories.find(mc => mc.name === subCategoryFilter.mainCategory);
        if (mainCat) {
          // Create a filtered tree with only one sector, one mainCategory, and its subCategories
          return [{
            sector: sector.sector,
            sectorValue: sector.sectorValue,
            mainCategories: [{
              name: mainCat.name,
              value: mainCat.value,
              subCategories: mainCat.subCategories
            }]
          }];
        }
      }
    }
    
    // Check if we have a mainCategory filter selected (but no subCategory)
    const mainCategoryFilter = selectedFilters.find(f => f.type === 'mainCategory');
    
    if (mainCategoryFilter) {
      // If mainCategory is selected, show only the same-level mainCategories under that sector
      const sector = categoryTree.find(s => s.sector === mainCategoryFilter.sector);
      if (sector) {
        // Return the full sector with all its mainCategories
        return [sector];
      }
    }

    // Otherwise, show all sectors that match the selected filters
    const selectedSectors = new Set(selectedFilters.map(f => f.sector));
    return categoryTree.filter(sector => selectedSectors.has(sector.sector));
  }, [selectedFilters, categoryTree]);

  // New filter management functions
  const toggleSectorExpansion = async (sectorValue: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(sectorValue);
      
      if (isExpanding) {
        newSet.add(sectorValue);
        // Find the sector and fetch its categories
        const sector = apiSectors.find((s: Sector) => 
          (s.slug || s.name.toLowerCase().replace(/\s+/g, '-')) === sectorValue
        );
        if (sector) {
          fetchServiceCategoriesForSector(sector._id);
        }
      } else {
        newSet.delete(sectorValue);
      }
      return newSet;
    });
  };

  const toggleMainCategoryExpansion = async (sectorValue: string, mainCategoryValue: string) => {
    const key = `${sectorValue}-${mainCategoryValue}`;
    setExpandedMainCategories(prev => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(key);
      
      if (isExpanding) {
        newSet.add(key);
        // Find the sector and category to fetch subcategories
        const sector = apiSectors.find((s: Sector) => 
          (s.slug || s.name.toLowerCase().replace(/\s+/g, '-')) === sectorValue
        );
        if (sector) {
          const categories = serviceCategoriesBySector.get(sector._id) || [];
          const category = categories.find((cat: ServiceCategory) => 
            (cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')) === mainCategoryValue
          );
          if (category && !category.subCategories) {
            // Fetch subcategories if not already loaded
            fetchSubCategoriesForCategory(category._id, sector._id);
          }
        }
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  };

  const addFilter = (filter: SelectedFilter) => {
    // Check if filter already exists
    const exists = selectedFilters.some(f => 
      f.type === filter.type &&
      f.sector === filter.sector &&
      f.mainCategory === filter.mainCategory &&
      f.subCategory === filter.subCategory
    );
    
    if (!exists) {
      const newFilters = [...selectedFilters, filter];
      setSelectedFilters(newFilters);
      
      // Close filter sheet when filter is added
      setIsFilterOpen(false);
      
      // Auto-expand the relevant categories when filter is added
      // Find the sector in categoryTree to get the sectorValue
      const matchedSector = categoryTree.find(s => s.sector === filter.sector);
      
      if (matchedSector) {
        setExpandedSectors(prev => {
          const newSet = new Set(prev);
          newSet.add(matchedSector.sectorValue);
          return newSet;
        });
        
        // If mainCategory exists, find it and expand it
        if (filter.mainCategory) {
          const matchedMainCat = matchedSector.mainCategories.find(mc => mc.name === filter.mainCategory);
          
          if (matchedMainCat) {
            const key = `${matchedSector.sectorValue}-${matchedMainCat.value}`;
            setExpandedMainCategories(prev => {
              const newSet = new Set(prev);
              newSet.add(key);
              return newSet;
            });
          }
        }
      }
      
      // Update URL based on filter type
      // Use setTimeout to allow other click handlers to execute first
      setTimeout(() => {
        const sectorApi = apiSectors.find((s: Sector) => s.name === filter.sector);
        if (!sectorApi) return;
        
        const sectorSlug = sectorApi.slug || sectorApi.name.toLowerCase().replace(/\s+/g, '-');
        
        if (filter.type === 'subCategory' && filter.mainCategory && filter.subCategory) {
          // Find category and subcategory slugs
          const sectorCategories = serviceCategoriesBySector.get(sectorApi._id) || [];
          const matchedCategory = sectorCategories.find((cat: ServiceCategory) => cat.name === filter.mainCategory);
          
          if (matchedCategory) {
            const categorySlug = matchedCategory.slug || matchedCategory.name.toLowerCase().replace(/\s+/g, '-');
            
            // Find subcategory slug
            if (matchedCategory.subCategories) {
              const matchedSubCategory = (matchedCategory.subCategories as ServiceSubCategory[]).find(
                (sub: ServiceSubCategory) => sub.name === filter.subCategory
              );
              
              if (matchedSubCategory) {
                const subCategorySlug = matchedSubCategory.slug || matchedSubCategory.name.toLowerCase().replace(/\s+/g, '-');
                const newSearchParams = new URLSearchParams(searchParams);
                // Keep only non-filter query params (search, etc.)
                newSearchParams.delete('sector');
                newSearchParams.delete('serviceCategory');
                newSearchParams.delete('serviceSubCategory');
                newSearchParams.delete('category');
                newSearchParams.delete('subcategory');
                newSearchParams.delete('detailedSubcategory');
                
                const queryString = newSearchParams.toString();
                const url = queryString 
                  ? `/services/${sectorSlug}/${categorySlug}/${subCategorySlug}?${queryString}`
                  : `/services/${sectorSlug}/${categorySlug}/${subCategorySlug}`;
                navigate(url, { replace: true });
                return;
              }
            }
          }
        } else if (filter.type === 'mainCategory' && filter.mainCategory) {
          // Find category slug
          const sectorCategories = serviceCategoriesBySector.get(sectorApi._id) || [];
          const matchedCategory = sectorCategories.find((cat: ServiceCategory) => cat.name === filter.mainCategory);
          
          if (matchedCategory) {
            const categorySlug = matchedCategory.slug || matchedCategory.name.toLowerCase().replace(/\s+/g, '-');
            const newSearchParams = new URLSearchParams(searchParams);
            // Keep only non-filter query params (search, etc.)
            newSearchParams.delete('sector');
            newSearchParams.delete('serviceCategory');
            newSearchParams.delete('serviceSubCategory');
            newSearchParams.delete('category');
            newSearchParams.delete('subcategory');
            newSearchParams.delete('detailedSubcategory');
            
            const queryString = newSearchParams.toString();
            const url = queryString 
              ? `/services/${sectorSlug}/${categorySlug}?${queryString}`
              : `/services/${sectorSlug}/${categorySlug}`;
            navigate(url, { replace: true });
            return;
          }
        } else if (filter.type === 'sector') {
          const newSearchParams = new URLSearchParams(searchParams);
          // Keep only non-filter query params (search, etc.)
          newSearchParams.delete('sector');
          newSearchParams.delete('serviceCategory');
          newSearchParams.delete('serviceSubCategory');
          newSearchParams.delete('category');
          newSearchParams.delete('subcategory');
          newSearchParams.delete('detailedSubcategory');
          
          const queryString = newSearchParams.toString();
          const url = queryString 
            ? `/services/${sectorSlug}?${queryString}`
            : `/services/${sectorSlug}`;
          navigate(url, { replace: true });
          return;
        }
      }, 0);
    }
  };

  const toggleFilter = (filter: SelectedFilter) => {
    // Check if filter already exists
    const existingIndex = selectedFilters.findIndex(f => 
      f.type === filter.type &&
      f.sector === filter.sector &&
      f.mainCategory === filter.mainCategory &&
      f.subCategory === filter.subCategory
    );
    
    if (existingIndex >= 0) {
      // Filter exists, remove it
      removeFilter(existingIndex);
    } else {
      // Filter doesn't exist, add it
      addFilter(filter);
    }
  };

  const removeFilter = (index: number) => {
    const filterToRemove = selectedFilters[index];
    if (!filterToRemove) return;
    
    // Calculate new filters after removal
    const newFilters = selectedFilters.filter((_, i) => i !== index);
    
    // Update state immediately
    setSelectedFilters(newFilters);
    
    // If path params exist (e.g., /services/home-garden/builders/advanced-builders),
    // always redirect to /services page with page refresh
    if (sectorSlugFromPath || serviceCategorySlugFromPath || serviceSubCategorySplat) {
      const newSearchParams = new URLSearchParams(searchParams);
      // Keep only non-filter query params (search, etc.)
      newSearchParams.delete('sector');
      newSearchParams.delete('serviceCategory');
      newSearchParams.delete('serviceSubCategory');
      newSearchParams.delete('category');
      newSearchParams.delete('subcategory');
      newSearchParams.delete('detailedSubcategory');
      
      const queryString = newSearchParams.toString();
      const redirectUrl = queryString ? `/services?${queryString}` : '/services';
      // Use window.location for full page reload
      window.location.href = redirectUrl;
      return;
    }
    
    // If all filters are removed, navigate to base services page
    if (newFilters.length === 0) {
      const newSearchParams = new URLSearchParams(searchParams);
      // Keep only non-filter query params (search, etc.)
      newSearchParams.delete('sector');
      newSearchParams.delete('serviceCategory');
      newSearchParams.delete('serviceSubCategory');
      newSearchParams.delete('category');
      newSearchParams.delete('subcategory');
      newSearchParams.delete('detailedSubcategory');
      
      const queryString = newSearchParams.toString();
      navigate(queryString ? `/services?${queryString}` : '/services', { replace: true });
      return;
    }
    
      // If only query params exist, remove the specific filter params
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (filterToRemove.type === 'subCategory') {
        newSearchParams.delete('serviceSubCategory');
        newSearchParams.delete('detailedSubcategory');
      } else if (filterToRemove.type === 'mainCategory') {
        newSearchParams.delete('serviceCategory');
        newSearchParams.delete('subcategory');
      } else if (filterToRemove.type === 'sector') {
        newSearchParams.delete('sector');
        newSearchParams.delete('category');
      }
      
      const queryString = newSearchParams.toString();
      navigate(queryString ? `/services?${queryString}` : '/services', { replace: true });
  };

  const toggleDelivery = (delivery: string) => {
    setSelectedDelivery(prev =>
      prev.includes(delivery)
        ? prev.filter(d => d !== delivery)
        : [...prev, delivery]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFilters([]);
    setSelectedDelivery([]);
    setSelectedRating(0);
    setPriceRange([0, 100000]);
    setMinPriceInput("0");
    setMaxPriceInput("100000");
    setLocationSearch("");
    // Reset to default Chelsea, London coordinates
    setUserCoords({ latitude: 51.4875, longitude: -0.1687 });
    setShowRadiusSlider(false);
  };

  const handleLocationSearch = () => {
    const trimmed = locationSearch.trim();
    if (trimmed) {
      // Check if it looks like a postcode (has numbers and is relatively short)
      const isPostcode = /\d/.test(trimmed) && trimmed.length <= 8;
      if (isPostcode) {
        const coords = geocodePostcode(trimmed);
        if (coords) {
          setUserCoords(coords);
          setShowRadiusSlider(true);
        }
      } else {
        // It's a location name, just filter by text
        // Reset to default Chelsea, London coordinates for distance calculation
        setUserCoords({ latitude: 51.4875, longitude: -0.1687 });
        setShowRadiusSlider(false);
      }
    } else {
      // Reset to default Chelsea, London coordinates
      setUserCoords({ latitude: 51.4875, longitude: -0.1687 });
      setShowRadiusSlider(false);
    }
  };



  const handleMinPriceChange = (value: string) => {
    setMinPriceInput(value);
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= priceRange[1]) {
      setPriceRange([numValue, priceRange[1]]);
    }
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceInput(value);
    const numValue = parseFloat(value) || 100000;
    if (numValue >= priceRange[0] && numValue <= 100000) {
      setPriceRange([priceRange[0], numValue]);
    }
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    setMinPriceInput(value[0].toString());
    setMaxPriceInput(value[1].toString());
  };

  const activeFiltersCount = 
    selectedFilters.length + 
    selectedDelivery.length + 
    (selectedRating > 0 ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 100000 ? 1 : 0) +
    (locationSearch ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category Tree Filter */}
      <div>
        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
          Categories
        </h3>
        
        {/* Loading state with skeleton - Show skeleton only while loading */}
        {sectorsLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 flex-1 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Category Tree - Always show sectors when loaded */}
        {!sectorsLoading && apiSectors.length > 0 && categoryTree.length > 0 && (
        <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
          {filteredCategoryTree.map((sector) => {
            // Check if we have a subCategory filter - if so, show only subcategories
            const hasSubCategoryFilter = selectedFilters.some(f => f.type === 'subCategory');
            
            if (hasSubCategoryFilter) {
              // Only show subcategories without sector/mainCategory headers
              return (
                <div key={sector.sectorValue} className="border border-gray-200 rounded-lg p-2 space-y-0.5">
                  {sector.mainCategories.map((mainCat) => (
                    mainCat.subCategories.map((subCat) => {
                      const isSelected = selectedFilters.some(f => 
                        f.type === 'subCategory' && 
                        f.subCategory === subCat &&
                        f.mainCategory === mainCat.name
                      );
                      
                      return (
                        <button
                          key={subCat}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFilter({
                            type: 'subCategory',
                            sector: sector.sector,
                            mainCategory: mainCat.name,
                            subCategory: subCat,
                            displayName: `${sector.sector} > ${mainCat.name} > ${subCat}`
                            });
                          }}
                          className={`block w-full text-left py-2 px-3 font-['Poppins',sans-serif] text-[13px] rounded transition-colors ${
                            isSelected
                              ? 'bg-[#FFF5EB] text-[#FE8A0F] font-medium'
                              : 'text-[#2c353f] hover:text-[#3D78CB] hover:bg-gray-50'
                          }`}
                        >
                          {subCat}
                        </button>
                      );
                    })
                  ))}
                </div>
              );
            }
            
            // Normal view - show full hierarchy
            return (
              <div key={sector.sectorValue} className="border border-gray-200 rounded-lg">
                {/* Sector Level */}
                <div className="flex items-center gap-1.5 p-2 hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {getSectorIcon(sector.sector)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectorExpansion(sector.sectorValue);
                      toggleFilter({
                        type: 'sector',
                        sector: sector.sector,
                        displayName: sector.sector
                      });
                    }}
                    className={`flex-1 text-left font-['Poppins',sans-serif] text-[14px] transition-colors ${
                      selectedFilters.some(f => f.type === 'sector' && f.sector === sector.sector)
                        ? 'text-[#FE8A0F] font-medium'
                        : 'text-[#2c353f] hover:text-[#FE8A0F]'
                    }`}
                  >
                    {sector.sector}
                  </button>
                </div>

                {/* Main Categories (shown when sector expanded) */}
                {expandedSectors.has(sector.sectorValue) && (
                  <div className="pl-4 pb-2 space-y-1">
                    {loadingSectors.has(sector.sectorId || '') ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-1 py-1">
                            <Skeleton className="w-3.5 h-3.5 rounded" />
                            <Skeleton className="h-3.5 flex-1 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : sector.mainCategories.length === 0 ? (
                      <div className="text-center py-2 text-[#6b6b6b] text-[12px] font-['Poppins',sans-serif]">
                        No categories available
                      </div>
                    ) : (
                      sector.mainCategories.map((mainCat) => {
                        const mainCatKey = `${sector.sectorValue}-${mainCat.value}`;
                        const isLoadingSubCategories = loadingCategories.has(mainCat.categoryId || '');
                        return (
                          <div key={mainCat.value} className="border-l-2 border-gray-200 pl-2">
                            <div className="flex items-center gap-1 py-1 hover:bg-gray-50 transition-colors">
                              {mainCat.hasSubCategories !== false && (
                                <button
                                  onClick={() => toggleMainCategoryExpansion(sector.sectorValue, mainCat.value)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  disabled={isLoadingSubCategories}
                                >
                                  {isLoadingSubCategories ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FE8A0F]" />
                                  ) : (
                                    <ChevronDown 
                                      className={`w-3.5 h-3.5 text-[#FE8A0F] transition-transform ${
                                        expandedMainCategories.has(mainCatKey) ? 'rotate-0' : '-rotate-90'
                                      }`}
                                    />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFilter({
                                  type: 'mainCategory',
                                  sector: sector.sector,
                                  mainCategory: mainCat.name,
                                  displayName: `${sector.sector} > ${mainCat.name}`
                                  });
                                }}
                                className={`flex-1 text-left font-['Poppins',sans-serif] text-[13px] transition-colors ${
                                  selectedFilters.some(f => f.type === 'mainCategory' && f.sector === sector.sector && f.mainCategory === mainCat.name)
                                    ? 'text-[#FE8A0F] font-medium bg-[#FFF5EB] rounded px-1'
                                    : 'text-[#5b5b5b] hover:text-[#10B981]'
                                }`}
                              >
                                {mainCat.name}
                              </button>
                            </div>

                            {/* Sub Categories (shown when main category expanded) */}
                            {expandedMainCategories.has(mainCatKey) && (
                              <>
                                {isLoadingSubCategories ? (
                                  <div className="pl-4 space-y-1 py-2">
                                    {[1, 2, 3].map((i) => (
                                      <Skeleton key={i} className="h-3 w-3/4 rounded" />
                                    ))}
                                  </div>
                                ) : mainCat.subCategories.length > 0 ? (
                                  <div className="pl-4 space-y-0.5">
                                    {mainCat.subCategories.map((subCat) => {
                                      const isSelected = selectedFilters.some(f => 
                                        f.type === 'subCategory' && 
                                        f.sector === sector.sector &&
                                        f.mainCategory === mainCat.name &&
                                        f.subCategory === subCat
                                      );
                                      
                                      return (
                                      <button
                                        key={subCat}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFilter({
                                          type: 'subCategory',
                                          sector: sector.sector,
                                          mainCategory: mainCat.name,
                                          subCategory: subCat,
                                          displayName: `${sector.sector} > ${mainCat.name} > ${subCat}`
                                            });
                                          }}
                                          className={`block w-full text-left py-1 px-2 font-['Poppins',sans-serif] text-[12px] rounded transition-colors ${
                                            isSelected
                                              ? 'text-[#FE8A0F] font-medium bg-[#FFF5EB]'
                                              : 'text-[#6b6b6b] hover:text-[#3D78CB] hover:bg-gray-50'
                                          }`}
                                      >
                                        • {subCat}
                                      </button>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      <Separator />

      {/* Delivery Type */}
      <div>
        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
          Delivery Type
        </h3>
        <div className="space-y-2">
          {deliveryTypes.map((delivery) => (
            <div key={delivery} className="flex items-center space-x-2">
              <Checkbox
                id={`delivery-${delivery}`}
                checked={selectedDelivery.includes(delivery)}
                onCheckedChange={() => toggleDelivery(delivery)}
                className="border-gray-300 data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F]"
              />
              <Label
                htmlFor={`delivery-${delivery}`}
                className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer"
              >
                {delivery}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
          Minimum Rating
        </h3>
        
        {/* Star Display */}
        <div className="mb-4 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => setSelectedRating(star)}
              className={`w-6 h-6 transition-all cursor-pointer hover:scale-110 ${
                star <= selectedRating
                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                  : "fill-gray-200 text-gray-200 hover:fill-[#FFB347] hover:text-[#FFB347]"
              }`}
            />
          ))}
        </div>

        {/* Rating Value Display */}
        <div className="text-center mb-3">
          <span className={`font-['Poppins',sans-serif] text-[18px] ${selectedRating > 0 ? "text-[#FE8A0F]" : "text-[#8d8d8d]"}`}>
            {selectedRating > 0 ? `${selectedRating.toFixed(1)}★ & up` : "No minimum"}
          </span>
        </div>

        {/* Slider */}
        <div className="px-2">
          <Slider
            value={[selectedRating]}
            onValueChange={(value) => setSelectedRating(value[0])}
            max={5}
            min={0}
            step={0.5}
            className="mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
              0★
            </span>
            <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
              5★
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
          Price Range
        </h3>
        
        {/* Custom Input Fields */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="min-price-filter" className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1.5 block">
              Min Price (£)
            </Label>
            <Input
              id="min-price-filter"
              name="minPrice"
              type="number"
              value={minPriceInput}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              placeholder="0"
              min="0"
              max={priceRange[1]}
              className="h-9 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-lg font-['Poppins',sans-serif] text-[13px]"
            />
          </div>
          <div>
            <Label htmlFor="max-price-filter" className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1.5 block">
              Max Price (£)
            </Label>
            <Input
              id="max-price-filter"
              name="maxPrice"
              type="number"
              value={maxPriceInput}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              placeholder="100000"
              min={priceRange[0]}
              max="100000"
              className="h-9 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-lg font-['Poppins',sans-serif] text-[13px]"
            />
          </div>
        </div>

        {/* Slider */}
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => handlePriceRangeChange(value as [number, number])}
            max={100000}
            step={100}
            className="mb-4"
          />
          <div className="flex items-center justify-between">
            <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
              £{priceRange[0].toLocaleString()}
            </span>
            <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
              £{priceRange[1].toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          onClick={clearAllFilters}
          variant="outline"
          className="w-full border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] font-['Poppins',sans-serif]"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );



  // Generate dynamic SEO content based on filters
  const generateSEOContent = () => {
    // Priority: New service category params > Legacy params > Selected filters
    let categoryName: string | null = null;
    if (serviceCategorySlugParam) {
      // Search through all loaded service categories
      for (const categories of serviceCategoriesBySector.values()) {
        const matched = categories.find((sc: ServiceCategory) => sc.slug === serviceCategorySlugParam);
        if (matched) {
          categoryName = matched.name;
          break;
        }
      }
    }
    categoryName = categoryName || categoryParam || (selectedFilters.length > 0 ? selectedFilters[0].sector : null);
    
    // Handle multiple serviceSubCategory parameters - use the last one
    let subcategoryName: string | null = null;
    if (serviceSubCategorySlugParams.length > 0 || serviceSubCategorySlugParam) {
      // Search through all loaded service categories
      for (const categories of serviceCategoriesBySector.values()) {
        const matchedServiceCategory = categories.find((sc: ServiceCategory) => sc.slug === serviceCategorySlugParam);
        if (matchedServiceCategory && matchedServiceCategory.subCategories) {
          const slugToFind = serviceSubCategorySlugParams.length > 0 
            ? serviceSubCategorySlugParams[serviceSubCategorySlugParams.length - 1]
            : serviceSubCategorySlugParam;
          const matchedSubCat = matchedServiceCategory.subCategories.find(
            (subCat: ServiceSubCategory) => subCat.slug === slugToFind
          );
          if (matchedSubCat) {
            subcategoryName = matchedSubCat.name;
            break;
          }
        }
      }
    }
    subcategoryName = subcategoryName || subcategoryParam || (selectedFilters.length > 0 ? selectedFilters[0].mainCategory : null);
    
    if (categoryName && subcategoryName) {
      return {
        title: `Hire ${subcategoryName} Professionals in ${categoryName} | Sortars UK`,
        description: `Book verified ${subcategoryName.toLowerCase()} experts in ${categoryName.toLowerCase()}. Compare quotes, read reviews, and hire trusted professionals instantly. Rated 4.9/5 by 50,000+ satisfied clients.`
      };
    } else if (categoryName) {
      return {
        title: `${categoryName} Services - Find & Hire Trusted Professionals | Sortars`,
        description: `Browse vetted ${categoryName.toLowerCase()} professionals across the UK. Get instant quotes, compare prices, read verified reviews, and book online. Quality guaranteed on every service.`
      };
    }
    
    return {
      title: "Browse All Professional Services | Hire Experts Online - Sortars UK",
      description: "Your trusted marketplace for professional services. From home repairs to business solutions - hire verified tradespeople, freelancers, and specialists. Compare quotes, read reviews, book instantly. Join 50,000+ professionals serving the UK."
    };
  };

  const seoContent = generateSEOContent();
  const thumbnailImage = "https://i.ibb.co/23knmvB9/thumbnail.jpg";

  return (
    <div className="w-full min-h-screen bg-[#f0f0f0]">
      {/* SEO Meta Tags */}
      <SEOHead
        title={seoContent.title}
        description={seoContent.description}
        ogTitle={seoContent.title}
        ogDescription={seoContent.description}
        ogImage={`${window.location.origin}${thumbnailImage}`}
        ogType="website"
      />

      {/* Header */}
      {/* Services page has NO category bar, so keep header height compact to avoid extra blank space */}
      <header className="sticky top-0 h-[73px] md:h-[78px] z-50 bg-white">
        <Nav />
      </header>

      {/* Search Section */}
      <div className="bg-[#f0f0f0] py-6">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16">
          <div className="max-w-[1200px] mx-auto">
            {/* Search and Filter Bar */}
            <div>
                  {/* Top Row - Search Fields */}
                  <div className="flex flex-col lg:flex-row gap-3 mb-2">
                    {/* Main Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="service-search-input"
                        name="serviceSearch"
                        placeholder="Search services or providers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 border-0 rounded-lg font-['Poppins',sans-serif] text-[14px] bg-white shadow-md focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>

                    {/* Location Search (Postcode or Location) */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="location-search-input"
                            name="locationSearch"
                            placeholder="Postcode or location (e.g., SW1A 1AA)"
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                            className="pl-10 h-12 border-0 rounded-lg font-['Poppins',sans-serif] text-[14px] bg-white shadow-md focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        {locationSearch && (
                          <Button
                            onClick={handleLocationSearch}
                            className="h-12 px-6 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px] whitespace-nowrap shadow-md"
                          >
                            Search
                          </Button>
                        )}
                      </div>
                      
                      {/* Radius Slider - Only shown for postcode searches */}
                      {showRadiusSlider && (
                        <div className="bg-[#FFF5EB] rounded-lg p-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="font-['Poppins',sans-serif] text-[11px] text-[#2c353f]">
                              Within {radiusMiles} miles
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLocationSearch("");
                                // Reset to default Chelsea, London coordinates
                                setUserCoords({ latitude: 51.4875, longitude: -0.1687 });
                                setShowRadiusSlider(false);
                              }}
                              className="h-5 text-[10px] text-[#FE8A0F] hover:text-[#FF6B00] hover:bg-transparent p-0"
                            >
                              <X className="w-3 h-3 mr-0.5" />
                              Clear
                            </Button>
                          </div>
                          <Slider
                            value={[radiusMiles]}
                            onValueChange={(value) => setRadiusMiles(value[0])}
                            max={50}
                            min={1}
                            step={1}
                          />
                          <div className="flex items-center justify-between">
                            <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">1 mi</span>
                            <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">50 mi</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Filter Button */}
                  <div className="md:hidden">
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                      <SheetTrigger asChild>
                        <Button className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[13px] relative shadow-md">
                          <Filter className="w-3.5 h-3.5 mr-1.5" />
                          Filters
                          {activeFiltersCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center p-0 text-[11px]">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] overflow-y-auto px-6 pb-6">
                        <SheetHeader>
                          <SheetTitle className="font-['Poppins',sans-serif] text-[20px]">
                            Filters
                          </SheetTitle>
                          <SheetDescription className="font-['Poppins',sans-serif] text-[14px]">
                            Refine your search results
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <FilterPanel />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Active Filters Display */}
                  {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        Active filters:
                      </span>
                      {locationSearch && !showRadiusSlider && (
                        <Badge
                          variant="secondary"
                          className="bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/30 font-['Poppins',sans-serif] cursor-pointer hover:bg-[#3B82F6] hover:text-white transition-colors"
                          onClick={() => setLocationSearch("")}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          {locationSearch}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      )}
                      {selectedFilters.map((filter, index) => {
                        const shortName = filter.subCategory || filter.mainCategory || filter.sector || "";
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-[#E3F2FD] text-[#1976D2] border border-[#1976D2]/30 font-['Poppins',sans-serif] cursor-pointer hover:bg-[#1976D2] hover:text-white transition-colors max-w-[200px]"
                            onClick={() => removeFilter(index)}
                            title={filter.displayName}
                          >
                            <span className="truncate">{shortName}</span>
                            <X className="w-3 h-3 ml-1 flex-shrink-0" />
                          </Badge>
                        );
                      })}
                      {selectedDelivery.map((del) => (
                        <Badge
                          key={del}
                          variant="secondary"
                          className="bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/30 font-['Poppins',sans-serif] cursor-pointer hover:bg-[#3B82F6] hover:text-white transition-colors"
                          onClick={() => toggleDelivery(del)}
                        >
                          {del}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      {selectedRating > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-[#E3F2FD] text-[#1976D2] border border-[#1976D2]/30 font-['Poppins',sans-serif] cursor-pointer hover:bg-[#1976D2] hover:text-white transition-colors"
                          onClick={() => setSelectedRating(0)}
                        >
                          {selectedRating}★ & up
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16 pb-12">

        {/* Results Count with Sort and View Mode */}
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Showing <span className="text-[#FE8A0F]">{filteredAndSortedServices.length}</span> services
          </p>
          
          <div className="flex items-center gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-10 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-lg font-['Poppins',sans-serif] text-[13px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                {userCoords && <SelectItem value="distance">Nearest First</SelectItem>}
              </SelectContent>
            </Select>

            {/* View Toggle - Now visible on mobile */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "grid"
                    ? 'bg-white text-[#FE8A0F] shadow-sm'
                    : 'text-gray-500'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "list"
                    ? 'bg-white text-[#FE8A0F] shadow-sm'
                    : 'text-gray-500'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="flex gap-6">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden md:block w-[280px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-[140px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Services Grid/List */}
          <div className="flex-1">
            {servicesLoading ? (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center" 
                  : "grid-cols-1"
              }`}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`bg-white rounded-[12px] shadow-sm overflow-hidden border border-gray-100 ${
                    viewMode === "grid" ? "w-full sm:max-w-[330px] sm:mx-auto" : "w-full"
                  }`}>
                    <Skeleton className="w-full h-48 rounded-t-[12px]" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-2/3 rounded" />
                      <div className="flex items-center gap-2 pt-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-1/2 rounded" />
                          <Skeleton className="h-3 w-1/3 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Skeleton className="h-6 w-20 rounded" />
                        <Skeleton className="h-8 w-24 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedServices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <h3 className="font-['Poppins',sans-serif] text-[24px] text-[#5a5a5a] mb-4">
                  Sorry, no services found
                </h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#7a7a7a] mb-6 max-w-[500px] mx-auto">
                  Try searching with different criteria. Can't find what you are looking for?<br />
                  Post a project and get instant quotes from our professionals.
                </p>
                <Button
                  onClick={() => navigate('/post-job')}
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] h-12 px-8 text-[15px] uppercase"
                >
                  POST A PROJECT
                </Button>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center" 
                  : "grid-cols-1"
              }`}>
{filteredAndSortedServices.map((service) => {
                  const bestSeller = isBestSeller(service);
                  const purchaseStatsText = getPurchaseStats(service);
                  const categoryTag = getCategoryTag(service);
                  const serviceId = service._id || service.id;
                  const isLiked = likedServices.has(String(serviceId));
                  const verified = isVerified(service);
                  const topRated = hasTopRated(service);
                  
                  // Truncate trading name to 10 characters
                  const displayTradingName = service.tradingName.length > 10 
                    ? service.tradingName.substring(0, 10) + '...' 
                    : service.tradingName;
                  
                  return viewMode === "grid" ? (
                    // GRID VIEW - New Design matching FeaturedServices
                  <div
                    key={service.id}
                    onClick={() => navigate(`/service/${service.slug || service._id || service.id}`, { state: { userCoords } })}
                    className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full w-full sm:max-w-[330px] sm:mx-auto"
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
                        alt={service.description}
                        className="w-full h-full object-cover object-center"
                        style={{ minWidth: '100%', minHeight: '100%' }}
                      />
                      )}
                      
                      {/* Heart Icon - Top Right */}
                      <button
                        onClick={(e) => toggleLike(e, service)}
                        className="absolute top-2 md:top-3 right-2 md:right-3 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                      >
                        <Heart 
                          className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-[#FE8A0F] text-[#FE8A0F]' : 'text-gray-600'}`}
                        />
                      </button>
                              </div>

                    {/* Content Section */}
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      {/* Title/Description */}
                      <h3 className="font-['Poppins',sans-serif] text-gray-800 font-normal mb-1 md:mb-1.5 line-clamp-2 min-h-[40px] md:min-h-[50px] -mx-2 md:-mx-3 px-1 md:px-1" style={{ fontSize: '16px', fontFamily: "'Poppins', sans-serif" }}>
                        {service.description}
                      </h3>

                      {/* Professional's average score, star score, (reviews count) - only when there is at least one review or score */}
                      {(() => {
                        const avgScore = (service as any).providerRating ?? service.rating;
                        const reviewsCount = (service as any).providerReviewCount ?? service.reviewCount;
                        const hasScore = typeof avgScore === 'number' && !Number.isNaN(avgScore);
                        const count = reviewsCount ?? 0;
                        const scoreVal = hasScore ? Number(avgScore) : 0;
                        if (count <= 0 && scoreVal <= 0) return null;
                        const score = scoreVal;
                        return (
                          <div className="flex items-center gap-1 mb-2 md:mb-2.5">
                            <span className="font-['Poppins',sans-serif] text-[13px] md:text-[15px] text-[#2c353f] font-semibold">
                              {score.toFixed(1)}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                                    star <= Math.floor(score)
                                      ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                      : star - 0.5 <= score
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

                      {/* Price Section */}
                      <div className="mb-2 md:mb-2.5">
                        {(() => {
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
                              // Use originalPrice if available (discount price), otherwise use price (original price)
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
                            return {
                              min: minPackagePrice,
                              max: maxPackagePrice,
                              formatted: `£${minPackagePrice.toFixed(2)} to £${maxPackagePrice.toFixed(2)}`
                            };
                          };
                          
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
                        <span>{service.deliveryType === "same-day" ? "Delivers in 2 days" : "Standard Delivery"}</span>
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#999]" />
                      </div>
                    </div>
                  </div>
                  ) : (
                    // LIST VIEW - Updated with new card style
                    <div
                      key={service.id}
                      className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-row border border-gray-100 w-full"
                      onClick={() => navigate(`/service/${service.slug || service._id || service.id}`, { state: { userCoords } })}
                    >
                      {/* Image/Video Section - Left */}
                      <div className="relative w-[150px] sm:w-[200px] flex-shrink-0 overflow-hidden bg-gray-100">
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
                          alt={service.description}
                          className="w-full h-full object-cover object-center"
                          style={{ minWidth: '100%', minHeight: '100%' }}
                        />
                        )}
                        
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

                          {/* Professional's average score, star score, (reviews count) - only when there is at least one review or score */}
                        {(() => {
                          const avgScore = (service as any).providerRating ?? service.rating;
                          const reviewsCount = (service as any).providerReviewCount ?? service.reviewCount;
                          const hasScore = typeof avgScore === 'number' && !Number.isNaN(avgScore);
                          const count = reviewsCount ?? 0;
                          const scoreVal = hasScore ? Number(avgScore) : 0;
                          if (count <= 0 && scoreVal <= 0) return null;
                          const score = scoreVal;
                          return (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#2c353f] font-semibold">
                                {score.toFixed(1)}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 md:w-3.5 md:h-3.5 ${
                                      star <= Math.floor(score)
                                        ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                        : star - 0.5 <= score
                                        ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                                        : "fill-[#E5E5E5] text-[#E5E5E5]"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-['Poppins',sans-serif] text-[10px] md:text-[11px] text-[#666]">
                                ({reviewsCount})
                              </span>
                            </div>
                          );
                        })()}

                            {/* Price Section */}
                        <div className="mb-2">
                          {(() => {
                            // Helper function to calculate price range when packages exist
                            const getPriceRange = (service: any) => {
                              if (!service.packages || service.packages.length === 0) {
                                return null;
                              }
                              
                              let minPackagePrice = Infinity;
                              let maxPackagePrice = 0;
                              
                              service.packages.forEach((pkg: any) => {
                                  // originalPrice = discount price, price = original price
                                  const pkgPrice = typeof pkg.originalPrice === 'number' ? pkg.originalPrice : parseFloat(String(pkg.originalPrice || pkg.price || 0).replace('£', '').replace(/,/g, '')) || 0;
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
                              
                              if (minPackagePrice === maxPackagePrice) {
                                return {
                                  min: minPackagePrice,
                                  max: maxPackagePrice,
                                  formatted: `£${minPackagePrice.toFixed(2)}`
                                };
                              }
                              
                              return {
                                min: minPackagePrice,
                                max: maxPackagePrice,
                                formatted: `£${minPackagePrice.toFixed(2)} to £${maxPackagePrice.toFixed(2)}`
                              };
                            };
                            
                            const priceRange = getPriceRange(service);
                            if (priceRange) {
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
                                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <span 
                                          className="inline-block text-white text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
                                          style={{ backgroundColor: '#CC0C39' }}
                                        >
                                          {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
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
                          <span>{service.deliveryType === "same-day" ? "Delivers in 2 days" : "Standard Delivery"}</span>
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#999]" />
                    </div>
                  </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="w-full h-[60px] md:h-[120px] lg:h-[200px]"></div>

      {/* Footer */}
      <Footer />

      {/* Add to Cart Modal */}
      {selectedServiceForCart && (
        <AddToCartModal
          isOpen={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          onConfirm={(data) => {
            const selectedAddonsData = selectedServiceForCart.addons
              ?.filter(addon => data.selectedAddons.includes(addon.id))
              .map(addon => ({
                id: addon.id,
                title: addon.title,
                price: addon.price
              })) || [];

            addToCart({
              id: (selectedServiceForCart._id || selectedServiceForCart.id).toString(),
              serviceId: (selectedServiceForCart._id || selectedServiceForCart.id).toString(),
              title: selectedServiceForCart.description,
              seller: selectedServiceForCart.providerName,
              price: data.packageType && selectedServiceForCart.packages 
                ? selectedServiceForCart.packages.find(p => p.type === data.packageType)?.price || parseFloat(selectedServiceForCart.price)
                : parseFloat(selectedServiceForCart.price),
              image: selectedServiceForCart.image,
              rating: selectedServiceForCart.rating,
              addons: selectedAddonsData.length > 0 ? selectedAddonsData : undefined,
              booking: data.booking ? {
                date: data.booking.date.toISOString(),
                starttime: data.booking.time,
                endtime: data.booking.time,
                timeSlot: data.booking.timeSlot
              } : undefined,
              packageType: data.packageType,
              priceUnit: selectedServiceForCart.priceUnit || 'fixed'
            }, data.quantity);
            
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          serviceTitle={selectedServiceForCart.description}
          sellerName={selectedServiceForCart.providerName}
          basePrice={parseFloat(selectedServiceForCart.price)}
          addons={selectedServiceForCart.addons || []}
          packages={selectedServiceForCart.packages || []}
          serviceImage={selectedServiceForCart.image}
        />
      )}
    </div>
  );
}

