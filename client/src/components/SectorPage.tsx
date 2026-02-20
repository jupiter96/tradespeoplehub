import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner@2.0.3";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
// Removed static import - will fetch from API
import { 
  getSectorByName,
  getSectorBySlug,
  getMainCategoriesBySector, 
  getMainCategoryById,
  nameToSlug,
  mainCategories
} from "./unifiedCategoriesData";
import { useSector, useCategories, useServiceCategories, useServiceCategory, type ServiceCategory } from "../hooks/useSectorsAndCategories";
import { resolveApiUrl } from "../config/api";
import type { SubCategory } from "./unifiedCategoriesData";
import { SEOHead } from "./SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { Star, Heart, MapPin, Medal, Play, Clock } from "lucide-react";

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

// Define MainCategory type for compatibility
type MainCategory = {
  id: string;
  name: string;
  sectorName: string;
  subCategories: SubCategory[];
};
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Award, 
  TrendingUp,
  Wrench,
  Hammer,
  Paintbrush,
  Droplets,
  Zap,
  Home,
  Trees,
  ShowerHead,
  PenTool,
  Package,
  Scissors,
  Sparkles,
  Plug,
  Wind,
  DoorOpen,
  HardHat,
  Sofa,
  Fan,
  Globe,
  Briefcase,
  GraduationCap,
  Users,
  Car,
  TruckIcon,
  LucideIcon,
  SquareStack,
  ChefHat,
  Lock,
  Square,
  Layers,
  Frame,
  ShoppingCart,
  CheckCircle,
  X,
  Filter,
  Search,
  Grid,
  List,
  Settings,
  ClipboardCheck,
  Code,
  Calculator,
  Megaphone,
  BookOpen,
  Activity,
  Camera,
  Music,
  Calendar,
  Dog,
  Scale,
  FileText,
  Archive,
  Building2,
  Flame,
  UtensilsCrossed,
  Radio,
  ClipboardList,
  Footprints,
  Receipt,
  LineChart,
  Palette,
  Stethoscope,
  Laptop,
  PenLine,
  BarChart3,
  MessageSquare,
  Video,
  Dumbbell,
  Smile,
  Phone,
  Mail,
  Warehouse,
  Box,
  Apple,
  Brain,
  Flower2,
  Smartphone
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { useCart } from "./CartContext";
import AddToCartModal from "./AddToCartModal";
import { getPageIcons } from "./categoryIconMappings";

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

// Category icon mapping - All categories with appropriate icons (Orange color scheme)
const categoryIcons: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  // Home & Garden Sector
  "Plumbing": { icon: Droplets, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Electrical Work": { icon: Zap, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Carpentry": { icon: Hammer, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Painting & Decorating": { icon: Paintbrush, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Gardening & Landscaping": { icon: Trees, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Bathroom Fitting": { icon: ShowerHead, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Kitchen Fitting": { icon: ChefHat, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Home Cleaning": { icon: Sparkles, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Business Services Sector
  "Business Consulting": { icon: Briefcase, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Marketing & Advertising": { icon: Megaphone, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Web Development": { icon: Code, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Graphic Design": { icon: Palette, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Accounting Services": { icon: Calculator, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Legal Advice": { icon: Scale, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Personal Services Sector
  "Personal Training": { icon: Dumbbell, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Life Coaching": { icon: Brain, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Massage Therapy": { icon: Heart, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Professional Organizing": { icon: ClipboardList, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Repair & Maintenance Sector
  "Handyman Services": { icon: Wrench, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Appliance Repair": { icon: Settings, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "HVAC Repair": { icon: Wind, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Locksmith Services": { icon: Lock, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Technology Services Sector
  "Computer Repair": { icon: Laptop, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "IT Support": { icon: Settings, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "App Development": { icon: Code, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Education & Tutoring Sector
  "Math Tutoring": { icon: Calculator, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "English Tutoring": { icon: BookOpen, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Music Lessons": { icon: Music, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Language Tutoring": { icon: MessageSquare, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Beauty & Wellness Sector
  "Hair Styling": { icon: Scissors, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Makeup Services": { icon: Smile, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Nail Services": { icon: Sparkles, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Spa Treatments": { icon: Flower2, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Health & Wellness Sector
  "Nutrition Counseling": { icon: Apple, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Physiotherapy": { icon: Stethoscope, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Yoga & Pilates": { icon: Activity, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Mental Health Support": { icon: Brain, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Legal & Financial Sector
  "Legal Services": { icon: Scale, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Tax Services": { icon: Receipt, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Financial Planning": { icon: LineChart, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Wedding & Events Sector
  "Wedding Planning": { icon: Heart, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Event Photography": { icon: Camera, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Event Videography": { icon: Video, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Catering Services": { icon: UtensilsCrossed, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "DJ Services": { icon: Radio, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Event Planning": { icon: Calendar, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Pet Services Sector
  "Pet Grooming": { icon: Scissors, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Pet Sitting": { icon: Home, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Dog Walking": { icon: Footprints, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Pet Training": { icon: Award, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Automotive Services Sector
  "Car Repair": { icon: Wrench, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Car Maintenance": { icon: Settings, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Car Detailing": { icon: Sparkles, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Bodywork & Paint": { icon: Paintbrush, color: "#FE8A0F", bgColor: "#FFF5EB" },
  
  // Moving & Storage Sector
  "Moving Services": { icon: TruckIcon, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Packing Services": { icon: Box, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Storage Solutions": { icon: Warehouse, color: "#FE8A0F", bgColor: "#FFF5EB" },
  "Furniture Assembly": { icon: Hammer, color: "#FE8A0F", bgColor: "#FFF5EB" },
};

// Note: Category icon mappings moved to ./categoryIconMappings.ts
// Icons now change dynamically based on current page (sector/main category/subcategory)

export default function SectorPage() {
  /*
   * OLD IMAGE CONFIGURATION CODE - REMOVED
   * This section contained Unsplash image URLs for each category
   * Now using minimal geometric design instead
   */
  
  const location = useLocation();
  const { sectorSlug, serviceCategorySlug, categorySlug, subCategorySlug, '*': splat } = useParams<{ 
    sectorSlug?: string; 
    serviceCategorySlug?: string;
    categorySlug?: string; 
    subCategorySlug?: string;
    '*': string;
  }>();
  
  // Parse all subcategory slugs from URL path (supports unlimited nesting)
  const subCategorySlugs = useMemo(() => {
    if (splat) {
      // Split by '/' and filter out empty strings
      return splat.split('/').filter(s => s.length > 0);
    }
    return [];
  }, [splat]);
  
  // Get the current (last) subcategory slug for display
  const currentSubCategorySlug = subCategorySlugs.length > 0 ? subCategorySlugs[subCategorySlugs.length - 1] : undefined;
  
  // Get the parent subcategory path (all but the last)
  const parentSubCategoryPath = subCategorySlugs.length > 1 
    ? subCategorySlugs.slice(0, -1).join('/')
    : '';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Add to Cart Modal
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedServiceForCart, setSelectedServiceForCart] = useState<any>(null);

  const { isLoggedIn, userRole } = useAccount();
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
    e.preventDefault();
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

  // Fetch sector data from API if we have a sectorSlug
  const { sector: apiSector, loading: sectorLoading } = useSector(sectorSlug || '', false);
  
  // Fetch services from API - state declarations
  const [allServices, setAllServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  // Filter state - declare early to avoid initialization errors
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [subCategoriesWithNested, setSubCategoriesWithNested] = useState<any[]>([]);
  const [nestedSubCategoriesLoading, setNestedSubCategoriesLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Reduced from 3 to 2
  const retryDelay = 1000; // Reduced from 2000ms to 1000ms (1 second)
  
  // Fetch service categories for the sector
  const { serviceCategories: apiServiceCategories, loading: serviceCategoriesLoading } = useServiceCategories(
    apiSector?._id,
    sectorSlug,
    true // includeSubCategories
  );
  
  // Fetch service category data from API if we have a serviceCategorySlug
  const { serviceCategory: apiServiceCategory, loading: serviceCategoryLoading } = useServiceCategory(
    serviceCategorySlug || '',
    true // includeSubCategories
  );
  
  // Legacy: Fetch category data from API if we have a categorySlug (for backward compatibility)
  const [apiCategory, setApiCategory] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // Legacy: Fetch categories for the sector if we have apiSector (for backward compatibility)
  const { categories: apiCategories } = useCategories(
    apiSector?._id,
    undefined,
    true // includeSubCategories
  );
  
  // Fetch subcategories for current service subcategory if we have one
  const [currentServiceSubCategoryData, setCurrentServiceSubCategoryData] = useState<any>(null);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);
  
  // Recursively fetch subcategory chain based on URL path
  useEffect(() => {
    const fetchSubCategoryChain = async () => {
      if (currentSubCategorySlug && apiServiceCategory && subCategorySlugs.length > 0) {
        try {
          setSubCategoryLoading(true);
          
          // Start from service category's subcategories
          let foundSubCategory: any = null;
          
          // First, find the first level subcategory
          const firstLevelSubCategory = apiServiceCategory.subCategories?.find((subCat: any) =>
            subCat.slug === subCategorySlugs[0] || nameToSlug(subCat.name) === subCategorySlugs[0]
          );
          
          if (!firstLevelSubCategory) {
            setCurrentServiceSubCategoryData(null);
            setSubCategoryLoading(false);
            return;
          }
          
          // If we have multiple levels, traverse the chain
          if (subCategorySlugs.length === 1) {
            foundSubCategory = firstLevelSubCategory;
          } else {
            // Traverse nested subcategories
            let currentSubCategory = firstLevelSubCategory;
            for (let i = 1; i < subCategorySlugs.length; i++) {
              if (!currentSubCategory) break;
              
              // Fetch subcategories of current subcategory
              const response = await fetch(
                resolveApiUrl(`/api/service-subcategories?parentSubCategoryId=${currentSubCategory._id}&activeOnly=true&sortBy=order&sortOrder=asc`),
                { credentials: 'include' }
              );
              
              if (response.ok) {
                const data = await response.json();
                const nextSubCategory = data.serviceSubCategories?.find((subCat: any) =>
                  subCat.slug === subCategorySlugs[i] || nameToSlug(subCat.name) === subCategorySlugs[i]
                );
                
                if (nextSubCategory) {
                  currentSubCategory = nextSubCategory;
                  if (i === subCategorySlugs.length - 1) {
                    foundSubCategory = nextSubCategory;
                  }
                } else {
                  break;
                }
              } else {
                break;
              }
            }
          }
          
          if (foundSubCategory) {
            // Recursively fetch all nested subcategories
            const fetchAllSubCategories = async (parentId: string): Promise<any[]> => {
            const response = await fetch(
                resolveApiUrl(`/api/service-subcategories?parentSubCategoryId=${parentId}&activeOnly=true&sortBy=order&sortOrder=asc&limit=1000`),
              { credentials: 'include' }
            );
            if (response.ok) {
              const data = await response.json();
                const subCategories = data.serviceSubCategories || [];
                // Recursively fetch subcategories for each subcategory
                const subCategoriesWithNested = await Promise.all(
                  subCategories.map(async (subCat: any) => {
                    const nested = await fetchAllSubCategories(subCat._id);
                    return {
                      ...subCat,
                      subCategories: nested
                    };
                  })
                );
                return subCategoriesWithNested;
              }
              return [];
            };
            
            const allSubCategories = await fetchAllSubCategories(foundSubCategory._id);
              setCurrentServiceSubCategoryData({
                ...foundSubCategory,
              subCategories: allSubCategories
              });
          } else {
            setCurrentServiceSubCategoryData(null);
          }
        } catch (error) {
          // console.error('Error fetching subcategory chain:', error);
          setCurrentServiceSubCategoryData(null);
        } finally {
          setSubCategoryLoading(false);
        }
      } else {
        setCurrentServiceSubCategoryData(null);
      }
    };
    
    fetchSubCategoryChain();
  }, [currentSubCategorySlug, subCategorySlugs, apiServiceCategory]);
  
  // Recursively fetch all nested subcategories for service category's subcategories with retry logic
  useEffect(() => {
    const fetchNestedSubCategories = async (attempt: number = 0): Promise<void> => {
      if (apiServiceCategory && apiServiceCategory.subCategories && apiServiceCategory.subCategories.length > 0 && serviceCategorySlug) {
        try {
          setNestedSubCategoriesLoading(true);
          // Recursively fetch subcategories for each Level 2 subcategory
          const fetchAllSubCategories = async (parentId: string): Promise<any[]> => {
            const response = await fetch(
              resolveApiUrl(`/api/service-subcategories?parentSubCategoryId=${parentId}&activeOnly=true&sortBy=order&sortOrder=asc&limit=1000`),
              { credentials: 'include' }
            );
            if (response.ok) {
              const data = await response.json();
              const subCategories = data.serviceSubCategories || [];
              // Recursively fetch subcategories for each subcategory
              const subCategoriesWithNested = await Promise.all(
                subCategories.map(async (subCat: any) => {
                  const nested = await fetchAllSubCategories(subCat._id);
                  return {
                    ...subCat,
                    subCategories: nested
                  };
                })
              );
              return subCategoriesWithNested;
            }
            throw new Error(`Failed to fetch subcategories for parent ${parentId}`);
          };
          
          // Filter Level 2 subcategories first
          const level2SubCategories = apiServiceCategory.subCategories.filter((subCat: any) => subCat.level === 2 && !subCat.parentSubCategory);
          
          // Fetch nested subcategories for all Level 2 subcategories
          const subCategoriesWithNestedData = await Promise.all(
            level2SubCategories.map(async (subCat: any) => {
              const nested = await fetchAllSubCategories(subCat._id);
              return {
                ...subCat,
                subCategories: nested
              };
            })
          );
          
          setSubCategoriesWithNested(subCategoriesWithNestedData);
          setNestedSubCategoriesLoading(false);
          setRetryCount(0);
        } catch (error) {
          // console.error(`Error fetching nested subcategories (attempt ${attempt + 1}/${maxRetries}):`, error);
          if (attempt < maxRetries - 1) {
            // Retry after delay
            setTimeout(() => {
              fetchNestedSubCategories(attempt + 1);
            }, retryDelay);
          } else {
            // Max retries reached, show error
            // console.error('Failed to fetch nested subcategories after all retries');
            setNestedSubCategoriesLoading(false);
            setSubCategoriesWithNested([]);
          }
        }
      } else {
        setSubCategoriesWithNested([]);
        setNestedSubCategoriesLoading(false);
      }
    };
    
    if (apiServiceCategory && serviceCategorySlug) {
      fetchNestedSubCategories(0);
    } else {
      setSubCategoriesWithNested([]);
      setNestedSubCategoriesLoading(false);
    }
  }, [apiServiceCategory, serviceCategorySlug, retryCount]);
  
  useEffect(() => {
    if (categorySlug) {
      const fetchCategory = async () => {
        try {
          setCategoryLoading(true);
          const response = await fetch(
            resolveApiUrl(`/api/categories/${categorySlug}?includeSector=true&activeOnly=true`),
            { credentials: 'include' }
          );
          if (response.ok) {
            const data = await response.json();
            setApiCategory(data.category);
          }
        } catch (error) {
          // console.error('Error fetching category:', error);
        } finally {
          setCategoryLoading(false);
        }
      };
      fetchCategory();
    }
  }, [categorySlug]);
  
  // Determine if we're on a service category page, legacy category page, or sector page
  let sector;
  let currentServiceCategory: ServiceCategory | null = null;
  let currentServiceSubCategory: any = null;
  let currentMainCategory = null;
  let currentSubCategory = null;
  let categoryBannerImage: string | null = null;
  
  // Check for service category first (new system)
  if (serviceCategorySlug && apiServiceCategory) {
    currentServiceCategory = apiServiceCategory;
    sector = typeof apiServiceCategory.sector === 'object' ? apiServiceCategory.sector : null;
    categoryBannerImage = apiServiceCategory.bannerImage || null;
    
    // If currentSubCategorySlug is provided, use the fetched subcategory data
    if (currentSubCategorySlug && currentServiceSubCategoryData) {
      currentServiceSubCategory = currentServiceSubCategoryData;
      // Update banner image if subcategory has one
      if (currentServiceSubCategory.bannerImage) {
        categoryBannerImage = currentServiceSubCategory.bannerImage;
      }
    }
  } else if (categorySlug) {
    // We're on /category/:categorySlug or /category/:categorySlug/:subCategorySlug route
    // Use API category data only - no fallback to static data
    if (apiCategory) {
      currentMainCategory = { 
        id: apiCategory._id, 
        name: apiCategory.name,
        sectorName: typeof apiCategory.sector === 'object' ? apiCategory.sector.name : '',
        subCategories: []
      };
      sector = typeof apiCategory.sector === 'object' ? apiCategory.sector : null;
      categoryBannerImage = apiCategory.bannerImage || null;
    }
  } else if (sectorSlug) {
    // We're on /sector/:sectorSlug route
    // Use API data only - no fallback to static data
    if (apiSector) {
      sector = apiSector;
    }
  }
  
  // Determine what to show in the categories slider
  // Priority: Service Categories (new system) > Legacy Categories > Static data
  let categoriesToShow;
  if (currentServiceSubCategory && currentServiceSubCategoryData) {
    // Show sub-categories of current service subcategory
    if (currentServiceSubCategoryData.subCategories) {
      // Sort subcategories by order
      categoriesToShow = [...currentServiceSubCategoryData.subCategories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else {
      categoriesToShow = [];
    }
  } else if (currentServiceCategory) {
    // Show sub-categories if we're in a service category
    // Use subCategoriesWithNested if available (with all nested subcategories), otherwise use apiServiceCategory.subCategories
    if (subCategoriesWithNested.length > 0) {
      // Sort subcategories by order
      categoriesToShow = [...subCategoriesWithNested].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else if (apiServiceCategory && apiServiceCategory.subCategories) {
      // Filter Level 2 subcategories (direct children)
      const level2SubCategories = apiServiceCategory.subCategories.filter((subCat: any) => subCat.level === 2 && !subCat.parentSubCategory);
      // Sort subcategories by order
      categoriesToShow = [...level2SubCategories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else {
      categoriesToShow = [];
    }
  } else if (currentMainCategory) {
    // Legacy: Show sub-categories if we're in a main category
    if (apiCategory && apiCategory.subCategories) {
      // Sort subcategories by order
      categoriesToShow = [...apiCategory.subCategories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else {
      categoriesToShow = currentMainCategory.subCategories;
    }
  } else if (sector) {
    // Show service categories if we're in a sector (new system)
    if (apiServiceCategories && apiServiceCategories.length > 0) {
      // Use API service categories, sorted by order
      categoriesToShow = [...apiServiceCategories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else if (apiSector && apiSector.categories && apiSector.categories.length > 0) {
      // Legacy: Use API categories, sorted by order
      categoriesToShow = [...apiSector.categories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else if (apiCategories && apiCategories.length > 0) {
      // Legacy: Use categories from useCategories hook, sorted by order
      categoriesToShow = [...apiCategories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else {
      // No data available - wait for API to load
      categoriesToShow = [];
    }
  } else {
    categoriesToShow = [];
  }
  
  // Current page title
  const currentTitle = currentServiceCategory
    ? currentServiceCategory.name
    : currentSubCategory 
      ? currentSubCategory.name 
      : currentMainCategory 
        ? currentMainCategory.name 
        : (sector?.name || "");

  // Current page description
  const currentDescription = currentServiceCategory
    ? (currentServiceCategory as any).metaDescription || (currentServiceCategory as any).description
    : currentSubCategory 
      ? (currentSubCategory as any).metaDescription || (currentSubCategory as any).description
      : currentMainCategory 
        ? (currentMainCategory as any).metaDescription || (currentMainCategory as any).description
        : (sector && ((sector as any).metaDescription || (sector as any).description)) || "";

  useEffect(() => {
    // Only redirect if we're not loading and sector is still not found
    // Wait for all API calls to complete before redirecting
    // No fallback to static data - redirect if API data is not available
    // nestedSubCategoriesLoading is not required to decide if the page slug is valid; don't let it block redirects.
    if (!sectorLoading && !serviceCategoryLoading && !categoryLoading && !serviceCategoriesLoading && !subCategoryLoading) {
      if (sectorSlug && !sector && !apiSector) {
        // If API didn't find it, redirect
          navigate("/all-categories");
      } else if (serviceCategorySlug && !currentServiceCategory && !apiServiceCategory) {
        // For service category pages, if no category found, redirect
        navigate(sectorSlug ? `/sector/${sectorSlug}` : "/all-categories");
      } else if (categorySlug && !sector && !apiCategory) {
        // Legacy: For category pages, if no category found, redirect
        navigate("/all-categories");
      }
    }
  }, [sector, sectorLoading, serviceCategoryLoading, categoryLoading, serviceCategoriesLoading, subCategoryLoading, sectorSlug, serviceCategorySlug, categorySlug, apiCategory, apiServiceCategory, apiSector, currentServiceCategory, navigate]);

  // Fetch services from API based on current page context
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const { resolveApiUrl } = await import("../config/api");
        
        const params = new URLSearchParams();
        
        // Build filter parameters based on current page context
        // Priority: subcategory > category > sector
        if (currentServiceSubCategoryData?._id) {
          // We're on a subcategory page - filter by subcategory ID
          params.append('serviceSubCategoryId', currentServiceSubCategoryData._id);
        } else if (apiServiceCategory?._id) {
          // We're on a service category page - filter by category ID
          params.append('serviceCategoryId', apiServiceCategory._id);
        } else if (apiSector?._id) {
          // We're on a sector page - filter by sector ID
          params.append('sectorId', apiSector._id);
        }
        
        // Fetch services using the public endpoint with proper filters
        const servicesResponse = await fetch(
          resolveApiUrl(`/api/services/public?${params.toString()}`),
          { credentials: 'include' }
        );
        
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          // Transform API data
          const transformed = (servicesData.services || []).map((s: any) => ({
            id: parseInt(s._id?.slice(-8), 16) || Math.floor(Math.random() * 10000),
            slug: s.slug,
            // Determine thumbnail image/video - prioritize gallery first item if it's a video
            ...(() => {
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
                image: thumbnailImage,
                thumbnailVideo: thumbnailVideo,
              };
            })(),
            professionalId: typeof s.professional === 'object' 
              ? (s.professional._id || s.professional.id || s.professional)
              : (typeof s.professional === 'string' ? s.professional : null),
            providerName: typeof s.professional === 'object' 
              ? (s.professional.tradingName || 'Professional')
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
              deliveryTime: p.deliveryDays ? `${p.deliveryDays} ${p.deliveryDays <= 1 ? "day" : "days"}` : undefined,
              revisions: p.revisions || "",
            })) || [],
            skills: s.skills || [],
            responseTime: s.responseTime || "",
            portfolioImages: s.portfolioImages || [],
            _id: s._id,
          }));
          setAllServices(transformed);
        } else {
          setAllServices([]);
        }
      } catch (error) {
        // console.error("Error fetching services:", error);
        setAllServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [apiSector?._id, apiServiceCategory?._id, currentServiceSubCategoryData?._id]);

  // Helpers to build navigation URLs for categories/subcategories
  const getSlug = (obj: any) => obj?.slug || nameToSlug(obj?.name || "");
  const buildSubCategoryUrl = (slugChain: string[]) => {
    if (sectorSlug && serviceCategorySlug) {
      return `/sector/${sectorSlug}/${serviceCategorySlug}/${slugChain.join("/")}`;
    }
    if (categorySlug) {
      return `/category/${categorySlug}/${slugChain.join("/")}`;
    }
    return "#";
  };
  const buildServiceCategoryUrl = (serviceCategorySlugParam: string) => {
    if (sectorSlug) {
      return `/sector/${sectorSlug}/${serviceCategorySlugParam}`;
    }
    return "#";
  };

  // Recursive component to render subcategory tree
  const renderSubCategoryTree = useCallback((subCategory: any, depth: number = 0, parentPath: string[] = []): JSX.Element => {
    const subCatId = subCategory._id || subCategory.id || subCategory.name;
    const subCatName = subCategory.name;
    const subCatSlug = getSlug(subCategory);
    const isExpanded = expandedCategories.has(subCatId);
    const hasNestedSubCategories = subCategory.subCategories && subCategory.subCategories.length > 0;
    // Calculate indentation: base 7 (1.75rem) + 4 (1rem) per depth level
    const indentPx = 28 + (depth * 16); // 28px = 7*4px (ml-7), 16px = 4*4px per level
    
    return (
      <div key={subCatId} className="space-y-0.5">
        <div className="flex items-center gap-2">
          {hasNestedSubCategories && (
            <button
              onClick={() => {
                setExpandedCategories(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(subCatId)) {
                    newSet.delete(subCatId);
                  } else {
                    newSet.add(subCatId);
                  }
                  return newSet;
                });
              }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-[#FE8A0F] transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasNestedSubCategories ? (
            <div className="w-5" /> // Spacer
          ) : null}
          <button
            onClick={() => {
              if (subCatSlug) {
                const url = buildSubCategoryUrl([...parentPath, subCatSlug]);
                navigate(url);
              }
            }}
            className={`flex-1 text-left px-2 py-1.5 rounded font-['Poppins',sans-serif] text-[12px] transition-colors ${
              selectedSubCategories.includes(subCatName)
                ? "bg-[#FFF5EB] text-[#FE8A0F] font-medium"
                : "hover:bg-gray-50 text-[#5b5b5b]"
            }`}
          >
            {subCatName}
          </button>
        </div>
        
        {/* Recursively render nested subcategories */}
        {isExpanded && hasNestedSubCategories && (
          <div style={{ marginLeft: `${indentPx}px` }}>
            <div className="space-y-0.5">
              {subCategory.subCategories.map((nestedSubCat: any) => 
                renderSubCategoryTree(nestedSubCat, depth + 1, [...parentPath, subCatSlug])
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [expandedCategories, selectedSubCategories, sectorSlug, serviceCategorySlug, categorySlug, navigate]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'pane' | 'list'>('pane');
  
  // Location search state
  const [locationSearch, setLocationSearch] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number>(10);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 51.4875,
    longitude: -0.1687
  });
  const [showRadiusSlider, setShowRadiusSlider] = useState(false);

  // Location search handler
  const handleLocationSearch = () => {
    if (locationSearch.trim()) {
      const coords = geocodePostcode(locationSearch);
      if (coords) {
        setUserCoords(coords);
        setShowRadiusSlider(true);
      }
    } else {
      // Reset to default Chelsea, London coordinates
      setUserCoords({ latitude: 51.4875, longitude: -0.1687 });
      setShowRadiusSlider(false);
    }
  };

  // Get services for this sector or category with distance calculation
  // For now, display all services regardless of sector/category filters
  const sectorServices = allServices.map((service) => {
    // Calculate distance if user location is available
    if (userCoords && service.latitude && service.longitude) {
      const distance = calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        service.latitude,
        service.longitude
      );
      return { ...service, distance };
    }
    return service;
  });
  
  // TODO: Re-enable sector/category filtering when needed
  // .filter((service) => {
  //   if (!sector) return true; // Show all services if no sector selected
  //   
  //   // If we're in a subcategory (3rd level), filter by subcategory
  //   if (currentSubCategory) {
  //     return service.category === sector.name && 
  //            service.subcategory === currentMainCategory?.name &&
  //            service.detailedSubcategory === currentSubCategory.name;
  //   }
  //   
  //   // If we're in a main category (2nd level), filter by that category
  //   if (currentMainCategory) {
  //     return service.category === sector.name && 
  //            service.subcategory === currentMainCategory.name;
  //   }
  //   
  //   // Otherwise, show all services for the sector
  //   return service.category === sector.name;
  // });

  // Apply filters
  const filteredServices = sectorServices.filter((service) => {
    // Search filter
    if (searchQuery && !service.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !service.tradingName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Location/Distance filter
    if (locationSearch && showRadiusSlider && userCoords) {
      if (service.distance === undefined || service.distance > radiusMiles) {
        return false;
      }
    }

    // Main Category filter (for 2nd level - sector page)
    if (selectedMainCategories.length > 0 && !currentMainCategory) {
      if (!service.subcategory || !selectedMainCategories.includes(service.subcategory)) {
        return false;
      }
    }

    // SubCategory filter (for 3rd level - main category page)
    if (selectedSubCategories.length > 0) {
      if (!service.detailedSubcategory || !selectedSubCategories.includes(service.detailedSubcategory)) {
        return false;
      }
    }

    // Price filter
    const servicePrice = parseFloat(service.price);
    if (servicePrice < priceRange[0] || servicePrice > priceRange[1]) {
      return false;
    }

    // Rating filter
    if (selectedRating > 0 && service.rating < selectedRating) {
      return false;
    }

    return true;
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "reviews":
        return b.reviewCount - a.reviewCount;
      default: // relevance
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
    }
  });

  // Get featured services - all approved services when no filters applied
  const featuredServices = sectorServices;
  
  // Determine which services to display
  const hasActiveFilters = selectedMainCategories.length > 0 || selectedSubCategories.length > 0 || searchQuery || selectedRating > 0 || priceRange[0] !== 0 || priceRange[1] !== 100000 || locationSearch;
  const displayServices = hasActiveFilters ? sortedServices : featuredServices;

  // Check scroll position
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  // Determine if we're still loading any required data
  const isDataLoading = 
    sectorLoading || 
    (serviceCategoryLoading && serviceCategorySlug) || 
    (categoryLoading && categorySlug) || 
    (serviceCategoriesLoading && sectorSlug && !serviceCategorySlug) ||
    (subCategoryLoading && currentSubCategorySlug);
    // Removed nestedSubCategoriesLoading from blocking render - load in background
  
  // Check if we have the minimum required data to render
  const hasRequiredData = 
    (sectorSlug && apiSector) ||
    (serviceCategorySlug && apiServiceCategory) ||
    (categorySlug && apiCategory) ||
    (!sectorSlug && !serviceCategorySlug && !categorySlug);
  
  // Never show a visible loading overlay. If we don't have enough data to render yet,
  // return a skeleton shell while requests complete in the background.
  if (isDataLoading && !hasRequiredData) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] relative" aria-busy="true">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16 py-8 md:py-16">
          {/* Banner Skeleton */}
          <div className="mb-8">
            <Skeleton className="w-full h-48 md:h-64 rounded-lg" />
          </div>
          
          {/* Subcategories Slider Skeleton */}
          <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-32 rounded-lg flex-shrink-0" />
            ))}
          </div>
          
          {/* Services Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-gray-100">
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
        </div>
        <Footer />
      </div>
    );
  }

  // If we don't have required data and not loading, redirect (handled via useEffect)
  if (!hasRequiredData && !isDataLoading) {
    return null; // Will redirect via useEffect
  }

  // Generate SEO metadata
  // For sector pages (no category selected), use sector's metadata or generate fallback
  const isMainSectorPage = !currentServiceCategory && !currentSubCategory && !currentMainCategory && sector;
  const isCategoryPage = currentServiceCategory || currentSubCategory || currentMainCategory;
  
  // Determine the SEO title
  let seoTitle: string;
  if (isMainSectorPage && sector) {
    // Main sector page: use sector's metaTitle or name
    seoTitle = (sector as any).metaTitle || sector.name;
  } else if (currentServiceCategory) {
    // Service category page: use category's metaTitle or name
    seoTitle = (currentServiceCategory as any).metaTitle || currentServiceCategory.name;
  } else if (currentSubCategory) {
    // Subcategory page: use subcategory's metaTitle or name
    seoTitle = (currentSubCategory as any).metaTitle || currentSubCategory.name;
  } else if (currentMainCategory) {
    // Main category page: use category's metaTitle or name
    seoTitle = (currentMainCategory as any).metaTitle || currentMainCategory.name;
  } else {
    seoTitle = currentTitle || 'Professional Services | Sortars';
  }

  // Determine the SEO description
  let seoDescription: string;
  if (isMainSectorPage && sector) {
    // Main sector page: use sector's metaDescription, description, or fallback
    seoDescription = (sector as any).metaDescription || 
                     (sector as any).description || 
                     `Browse ${sector.name} services and categories on Sortars.`;
  } else if (currentServiceCategory) {
    // Service category page: use category's metaDescription, description, or fallback
    const categoryName = currentServiceCategory.name;
    const sectorName = sector?.name || '';
    seoDescription = (currentServiceCategory as any).metaDescription || 
                     (currentServiceCategory as any).description || 
                     (sectorName ? `Explore ${categoryName} in ${sectorName} on Sortars.` : `Explore ${categoryName} services on Sortars.`);
  } else if (currentSubCategory) {
    // Subcategory page: use subcategory's metaDescription, description, or fallback
    const subCategoryName = currentSubCategory.name;
    const sectorName = sector?.name || '';
    seoDescription = (currentSubCategory as any).metaDescription || 
                     (currentSubCategory as any).description || 
                     (sectorName ? `Explore ${subCategoryName} in ${sectorName} on Sortars.` : `Explore ${subCategoryName} services on Sortars.`);
  } else if (currentMainCategory) {
    // Main category page: use category's metaDescription, description, or fallback
    const categoryName = currentMainCategory.name;
    const sectorName = sector?.name || '';
    seoDescription = (currentMainCategory as any).metaDescription || 
                     (currentMainCategory as any).description || 
                     (sectorName ? `Explore ${categoryName} in ${sectorName} on Sortars.` : `Explore ${categoryName} services on Sortars.`);
  } else {
    seoDescription = currentDescription ||
                     (currentTitle
                       ? `Find verified ${currentTitle.toLowerCase()} professionals on Sortars.com. Compare ratings, read reviews, and book quality services with confidence.`
                       : 'Browse verified professional services across the UK on Sortars.com. Compare prices, read reviews, and book trusted professionals near you.');
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* SEO Meta Tags */}
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogImage={categoryBannerImage || (sector && (sector as any).bannerImage) || undefined}
        ogType="website"
        robots="index,follow"
      />

      {/* Header */}
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Hero Banner - Use bannerImage if available, otherwise use default geometric gradient */}
      <div 
        className="relative h-[210px] md:h-[252px] overflow-hidden mt-[50px] md:mt-0"
        style={
          categoryBannerImage || (sector && (sector as any).bannerImage)
            ? {
                backgroundImage: `url(${categoryBannerImage || (sector as any).bannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {
                background: 'linear-gradient(to bottom right, #1e3a5f, #2a4a6f, #1a2f4d)',
              }
        }
      >
        {/* Dark overlay for better text readability when using banner image */}
        {(categoryBannerImage || (sector && (sector as any).bannerImage)) && (
          <div className="absolute inset-0 bg-black/30" />
        )}
        
        {/* Default geometric pattern - only show if no banner image */}
        {!categoryBannerImage && (!sector || !(sector as any).bannerImage) && (
          <>
            {/* Hexagon Pattern Background */}
            <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                <path d="M30 0 L45 13 L45 39 L30 52 L15 39 L15 13 Z" fill="none" stroke="#3d5a7f" strokeWidth="1" opacity="0.4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>

        {/* Dot Pattern - Top Left */}
        <div className="absolute left-[3%] top-[15%] w-20 h-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots1" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1.5" fill="#FE8A0F" opacity="0.6"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots1)" />
          </svg>
        </div>

        {/* Dot Pattern - Bottom Right */}
        <div className="absolute right-[8%] bottom-[10%] w-24 h-24">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots2" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1" fill="#3d5a7f" opacity="0.7"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots2)" />
          </svg>
        </div>

        {/* Geometric Shapes - Diamonds */}
        <div className="absolute left-[2%] top-[25%] w-4 h-4 bg-[#FE8A0F] opacity-60 rotate-45" />
        <div className="absolute left-[3%] top-[32%] w-3 h-3 bg-[#FE8A0F] opacity-50 rotate-45" />
        <div className="absolute left-[4.5%] top-[38%] w-2.5 h-2.5 bg-[#FE8A0F] opacity-40 rotate-45" />

        {/* Concentric Squares - Top Left */}
        <div className="absolute left-[15%] top-[8%] w-16 h-16">
          <div className="absolute inset-0 border-2 border-[#FE8A0F] opacity-40 rotate-45" />
          <div className="absolute inset-2 border-2 border-[#FE8A0F] opacity-50 rotate-45" />
          <div className="absolute inset-4 border-2 border-[#FE8A0F] opacity-60 rotate-45" />
        </div>

        {/* Wave Lines - Right */}
        <div className="absolute right-[5%] top-[35%] w-20 h-16 opacity-50">
          <svg className="w-full h-full" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 16 Q 10 8 20 16 T 40 16 T 60 16 T 80 16" fill="none" stroke="#FE8A0F" strokeWidth="2"/>
            <path d="M 0 28 Q 10 20 20 28 T 40 28 T 60 28 T 80 28" fill="none" stroke="#FE8A0F" strokeWidth="2"/>
            <path d="M 0 40 Q 10 32 20 40 T 40 40 T 60 40 T 80 40" fill="none" stroke="#FE8A0F" strokeWidth="2"/>
          </svg>
        </div>

        {/* Small Dots Grid - Top Right */}
        <div className="absolute right-[20%] top-[8%] flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-[#FE8A0F] rounded-full opacity-60" />
          </div>
        </div>

        {/* Plus Signs - Bottom Left */}
        <div className="absolute right-[15%] bottom-[35%] text-white opacity-40 text-xl">+</div>
        <div className="absolute right-[18%] bottom-[42%] text-white opacity-35 text-lg">+</div>
        <div className="absolute right-[12%] bottom-[38%] text-white opacity-30 text-base">+</div>

        {/* Dark Geometric Pattern - Bottom */}
        <div className="absolute left-[35%] bottom-[8%] w-28 h-20 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 112 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="darkDots" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="2" fill="#FE8A0F" opacity="0.8"/>
              </pattern>
            </defs>
            <polygon points="0,40 28,0 84,0 112,40 84,80 28,80" fill="none" stroke="#0f1c2e" strokeWidth="2"/>
            <rect x="28" y="20" width="56" height="40" fill="url(#darkDots)"/>
          </svg>
        </div>
          </>
        )}

        {/* Dynamic Tool Icons - Changes based on current page (sector/category/subcategory) */}
        {sector && (() => {
          const { leftIcon: LeftIconComponent, rightIcon: RightIconComponent } = getPageIcons(sector, currentMainCategory, currentSubCategory);
          return (
            <>
              {/* Left Icon */}
              <div className="absolute left-[8%] top-1/2 -translate-y-1/2 opacity-50 drop-shadow-[0_8px_24px_rgba(254,138,15,0.6)]">
                <LeftIconComponent className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 text-[#FE8A0F]" />
              </div>

              {/* Right Icon */}
              <div className="absolute right-[8%] top-1/2 -translate-y-1/2 opacity-50 drop-shadow-[0_8px_24px_rgba(254,138,15,0.6)]">
                <RightIconComponent className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 text-[#FE8A0F]" />
              </div>
            </>
          );
        })()}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl mx-auto text-center">
              {/* Title */}
              <h1 className="font-['Poppins',sans-serif] text-white mb-3 md:mb-4 text-[28px] md:text-[38px] lg:text-[44px] leading-tight">
                {currentTitle}
              </h1>

              {/* Simple Description */}
              <p className="font-['Poppins',sans-serif] text-white/90 text-[14px] md:text-[16px] leading-relaxed mb-5">
                Find trusted professionals for your needs
              </p>

              {/* Stats Bar - Minimal & Prominent Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="group flex items-center gap-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#FE8A0F] flex items-center justify-center shadow-sm">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#2c2c2c] font-['Poppins',sans-serif] text-[13px]">{sectorServices.length}+</span>
                    <span className="text-[#2c2c2c]/60 font-['Poppins',sans-serif] text-[10px]">Services</span>
                  </div>
                </div>

                <div className="group flex items-center gap-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#FE8A0F] flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#2c2c2c] font-['Poppins',sans-serif] text-[13px]">Verified</span>
                    <span className="text-[#2c2c2c]/60 font-['Poppins',sans-serif] text-[10px]">Pros</span>
                  </div>
                </div>

                <div className="group flex items-center gap-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#FE8A0F] flex items-center justify-center shadow-sm">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#2c2c2c] font-['Poppins',sans-serif] text-[13px]">Same-Day</span>
                    <Clock className="w-3 h-3 text-[#2c2c2c]/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-900/15 via-blue-900/5 to-transparent" />
        
        {/* Accent Bar - Orange */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#FE8A0F] to-transparent" />
      </div>

      {/* Sub-categories Slider - Show below banner */}
      {(() => {
        // Determine what to show: service categories (when viewing sector) or subcategories (when viewing category/subcategory)
        let itemsToShow: any[] = [];
        let parentPath = '';
        let isServiceCategories = false; // Flag to determine if we're showing service categories or subcategories
        
        if (currentServiceSubCategory && currentServiceSubCategory.subCategories) {
          // Show subcategories of current service subcategory
          itemsToShow = [...currentServiceSubCategory.subCategories].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          // Build parent path with all subcategory slugs
          const parentPathSlugs = subCategorySlugs.length > 0 ? subCategorySlugs.join('/') : '';
          parentPath = parentPathSlugs 
            ? `/sector/${sectorSlug}/${serviceCategorySlug}/${parentPathSlugs}`
            : `/sector/${sectorSlug}/${serviceCategorySlug}`;
        } else if (currentServiceCategory && currentServiceCategory.subCategories && subCategorySlugs.length === 0) {
          // Show Level 2 subcategories of current service category (direct children, no parent)
          itemsToShow = [...currentServiceCategory.subCategories]
            .filter((subCat: any) => subCat.level === 2 && !subCat.parentSubCategory)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          parentPath = `/sector/${sectorSlug}/${serviceCategorySlug}`;
        } else if (!serviceCategorySlug && !subCategorySlugs.length && apiServiceCategories && apiServiceCategories.length > 0) {
          // Show service categories when viewing sector page (no service category selected)
          itemsToShow = [...apiServiceCategories]
            .filter((sc: any) => sc.isActive !== false)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          parentPath = `/sector/${sectorSlug}`;
          isServiceCategories = true;
        }
        
        if (itemsToShow.length === 0) return null;
        
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 md:-mt-6 relative z-20 mb-6">
            <div className="bg-white rounded-[12px] shadow-[0px_2px_12px_rgba(0,0,0,0.08)] py-4 px-4 md:px-6">
              <div className="relative">
                {/* Left Navigation Button */}
                <button
                  onClick={() => {
                    const container = document.getElementById('subcategories-slider');
                    if (container) {
                      container.scrollBy({ left: -300, behavior: 'smooth' });
                    }
                  }}
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-[#FE8A0F] items-center justify-center shadow-md transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Slider */}
                <div
                  id="subcategories-slider"
                  className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {itemsToShow.map((item: any) => {
                    const iconData = categoryIcons[item.name] || { 
                      icon: Home, 
                      color: "#4A90E2", 
                      bgColor: "#E8F2FF" 
                    };
                    const IconComponent = iconData.icon;
                    
                    // Handle service category click
                    const handleServiceCategoryClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      const serviceCategorySlug = item.slug || nameToSlug(item.name);
                      navigate(`/sector/${sectorSlug}/${serviceCategorySlug}`);
                    };
                    
                    // Handle subcategory click
                    const handleSubCategoryClick = async (e: React.MouseEvent) => {
                      e.preventDefault();
                      
                      const subCategorySlug = item.slug || nameToSlug(item.name);
                      const hasSubCategories = item.subCategories && item.subCategories.length > 0;
                      let targetUrl = '';
                      
                      // If we already know it has subcategories, navigate directly
                      if (hasSubCategories) {
                        const currentPathSlugs = subCategorySlugs.length > 0 ? [...subCategorySlugs, subCategorySlug].join('/') : subCategorySlug;
                        navigate(`/sector/${sectorSlug}/${serviceCategorySlug}/${currentPathSlugs}`);
                        return;
                      }
                      
                      // Check via API if this subcategory has nested subcategories
                      try {
                        const response = await fetch(
                          resolveApiUrl(`/api/service-subcategories?parentSubCategoryId=${item._id}&activeOnly=true&limit=1`),
                          { credentials: 'include' }
                        );
                        
                        if (response.ok) {
                          const data = await response.json();
                          const hasNestedSubCategories = data.serviceSubCategories && data.serviceSubCategories.length > 0;
                          
                          // If this is a leaf subcategory, jump to the services filter page.
                          // The last URL segment becomes the filter option (leaf slug).
                          const currentPathSlugs = subCategorySlugs.length > 0
                            ? [...subCategorySlugs, subCategorySlug].join('/')
                            : subCategorySlug;

                          if (hasNestedSubCategories) {
                            // Keep drilling down within sector/category detail
                            navigate(`/sector/${sectorSlug}/${serviceCategorySlug}/${currentPathSlugs}`);
                          } else {
                            // Leaf: go to services filter page (SEO-friendly path)
                            navigate(`/services/${sectorSlug}/${serviceCategorySlug}/${currentPathSlugs}`);
                          }
                        } else {
                          // If API check fails, still navigate SEO-friendly.
                          const currentPathSlugs = subCategorySlugs.length > 0
                            ? [...subCategorySlugs, subCategorySlug].join('/')
                            : subCategorySlug;
                          navigate(`/sector/${sectorSlug}/${serviceCategorySlug}/${currentPathSlugs}`);
                        }
                      } catch (error) {
                        // console.error('Error checking subcategory:', error);
                        // Still navigate SEO-friendly on errors.
                        const currentPathSlugs = subCategorySlugs.length > 0
                          ? [...subCategorySlugs, subCategorySlug].join('/')
                          : subCategorySlug;
                        navigate(`/sector/${sectorSlug}/${serviceCategorySlug}/${currentPathSlugs}`);
                      }
                    };
                    
                    return (
                      <div
                        key={item._id}
                        onClick={isServiceCategories ? handleServiceCategoryClick : handleSubCategoryClick}
                        className="group flex-shrink-0 bg-white border border-gray-200 rounded-[10px] hover:border-[#FE8A0F] hover:shadow-[0px_2px_12px_rgba(254,138,15,0.15)] transition-all duration-200 cursor-pointer"
                        style={{ minWidth: "200px", maxWidth: "240px" }}
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Icon */}
                          <div 
                            className="flex-shrink-0 w-10 h-10 rounded-[8px] flex items-center justify-center group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: iconData.bgColor }}
                          >
                            {item.icon ? (
                              <img 
                                src={item.icon} 
                                alt={item.name}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <IconComponent 
                                className="w-5 h-5" 
                                style={{ color: iconData.color, stroke: iconData.color }}
                              />
                            )}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-['Poppins',sans-serif] text-[#2c2c2c] text-[13px] group-hover:text-[#FE8A0F] transition-colors truncate">
                              {item.name}
                            </h3>
                          </div>

                          {/* Arrow */}
                          <ChevronRight 
                            className="w-4 h-4 text-gray-400 group-hover:text-[#FE8A0F] group-hover:translate-x-0.5 transition-all flex-shrink-0" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Navigation Button */}
                <button
                  onClick={() => {
                    const container = document.getElementById('subcategories-slider');
                    if (container) {
                      container.scrollBy({ left: 300, behavior: 'smooth' });
                    }
                  }}
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-[#FE8A0F] items-center justify-center shadow-md transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Services Section with Sidebar */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        {/* Mobile Filter Sidebar - Hidden trigger */}
        <div className="md:hidden">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetContent side="left" className="w-[85%] max-w-[320px] overflow-y-auto px-6 pb-6">
              <SheetHeader>
                <SheetTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                  Filters
                </SheetTitle>
                <SheetDescription className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                  Refine your search results
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Clear All Button */}
                {(selectedMainCategories.length > 0 || selectedSubCategories.length > 0 || selectedRating > 0 || priceRange[0] !== 0 || priceRange[1] !== 100000 || locationSearch) && (
                  <button
                    onClick={() => {
                      setSelectedMainCategories([]);
                      setSelectedSubCategories([]);
                      setSearchQuery("");
                      setSelectedRating(0);
                      setPriceRange([0, 100000]);
                      setLocationSearch("");
                      setShowRadiusSlider(false);
                    }}
                    className="w-full text-center py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#FE8A0F] font-['Poppins',sans-serif] text-[14px] transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}

                {/* Categories Tree - Show service categories and their subcategories */}
                {Array.isArray(categoriesToShow) && categoriesToShow.length > 0 && (
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Categories
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                      {(categoriesToShow as any[]).map((item) => {
                        const itemId = item._id || item.id || item.name;
                        const itemName = item.name;
                        const isExpanded = expandedCategories.has(itemId);
                        const hasSubCategories = item.subCategories && item.subCategories.length > 0;
                        
                        // Use all subcategories (already filtered to Level 2 if needed, or includes all nested if using subCategoriesWithNested)
                        const subCategoriesToShow = hasSubCategories ? item.subCategories : [];
                        
                        return (
                          <div key={itemId} className="space-y-0.5">
                            {/* Category/Service Category Item */}
                            <div className="flex items-center gap-2">
                              {hasSubCategories && subCategoriesToShow.length > 0 && (
                          <button
                            onClick={() => {
                                    setExpandedCategories(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(itemId)) {
                                        newSet.delete(itemId);
                                      } else {
                                        newSet.add(itemId);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-[#FE8A0F] transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              {!hasSubCategories || subCategoriesToShow.length === 0 ? (
                                <div className="w-5" /> // Spacer for alignment
                              ) : null}
                              <button
                                onClick={() => {
                                  const itemSlug = getSlug(item);
                                  if (!itemSlug) return;
                                  if (currentServiceCategory) {
                                    const url = buildSubCategoryUrl([itemSlug]);
                                    navigate(url);
                                  } else if (sectorSlug) {
                                    const url = buildServiceCategoryUrl(itemSlug);
                                    navigate(url);
                                  }
                            }}
                                className={`flex-1 text-left px-2 py-1.5 rounded font-['Poppins',sans-serif] text-[13px] transition-colors ${
                                  "hover:bg-gray-50 text-[#5b5b5b]"
                            }`}
                          >
                                {itemName}
                          </button>
                            </div>
                            
                            {/* Subcategories (nested) - Recursive tree */}
                            {isExpanded && hasSubCategories && subCategoriesToShow.length > 0 && (
                              <div className="ml-7 space-y-0.5">
                                {subCategoriesToShow.map((subCat: any) => renderSubCategoryTree(subCat, 0, [getSlug(item)]))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub Categories */}
                {currentMainCategory && (currentMainCategory as MainCategory).subCategories && (currentMainCategory as MainCategory).subCategories.length > 0 && (
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Subcategories
                    </h3>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {Array.isArray((currentMainCategory as MainCategory).subCategories) && (currentMainCategory as MainCategory).subCategories.map((subCat) => {
                        const isSelected = selectedSubCategories.includes(subCat.name);
                        return (
                          <button
                            key={subCat.id || subCat.name || `subcat-${subCat._id || Math.random()}`}
                            onClick={() => {
                              setSelectedSubCategories(prev =>
                                prev.includes(subCat.name)
                                  ? prev.filter(s => s !== subCat.name)
                                  : [...prev, subCat.name]
                              );
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg font-['Poppins',sans-serif] text-[13px] transition-colors ${
                              isSelected
                                ? "bg-[#FFF5EB] text-[#FE8A0F] font-medium"
                                : "hover:bg-gray-50 text-[#5b5b5b]"
                            }`}
                          >
                            {subCat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Rating Filter */}
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                    Minimum Rating
                  </h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(rating === selectedRating ? 0 : rating)}
                        className={`w-full text-left px-3 py-2 rounded-lg font-['Poppins',sans-serif] text-[13px] transition-colors flex items-center gap-2 ${
                          selectedRating === rating
                            ? "bg-[#FFF5EB] text-[#FE8A0F]"
                            : "hover:bg-gray-50 text-[#5b5b5b]"
                        }`}
                      >
                        <div className="flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FE8A0F] text-[#FE8A0F]" />
                          ))}
                        </div>
                        <span>& up</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                    Price Range
                  </h3>
                  <div className="space-y-3">
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      max={100000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        £{priceRange[0].toLocaleString()}
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        £{priceRange[1].toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location Filter */}
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                    Location
                  </h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        type="text"
                        placeholder="Enter postcode"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                        className="pl-10 font-['Poppins',sans-serif] text-[13px] h-10"
                      />
                    </div>
                    <Button
                      onClick={handleLocationSearch}
                      className="w-full h-10 bg-[#003D82] hover:bg-[#002554] font-['Poppins',sans-serif] text-[13px]"
                    >
                      Search Location
                    </Button>
                    {showRadiusSlider && (
                      <div className="space-y-2">
                        <Label className="font-['Poppins',sans-serif] text-[13px] text-[#5b5b5b]">
                          Radius: {radiusMiles} miles
                        </Label>
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
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar Filter - Show on both 2nd and 3rd level */}
          <aside className="hidden md:block w-[280px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-[140px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  Filters
                </h2>
                {(selectedMainCategories.length > 0 || selectedSubCategories.length > 0 || selectedRating > 0 || priceRange[0] !== 0 || priceRange[1] !== 100000 || locationSearch) && (
                  <button
                    onClick={() => {
                      setSelectedMainCategories([]);
                      setSelectedSubCategories([]);
                      setSearchQuery("");
                      setSelectedRating(0);
                      setPriceRange([0, 100000]);
                      setLocationSearch("");
                      setShowRadiusSlider(false);
                    }}
                    className="text-[#FE8A0F] hover:text-[#ff9d3a] font-['Poppins',sans-serif] text-[12px] transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Categories Tree - Show service categories and their subcategories */}
                {Array.isArray(categoriesToShow) && categoriesToShow.length > 0 && (
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Categories
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                      {(categoriesToShow as any[]).map((item) => {
                        const itemId = item._id || item.id || item.name;
                        const itemName = item.name;
                        const isExpanded = expandedCategories.has(itemId);
                        const hasSubCategories = item.subCategories && item.subCategories.length > 0;
                        
                        // Use all subcategories (already filtered to Level 2 if needed, or includes all nested if using subCategoriesWithNested)
                        const subCategoriesToShow = hasSubCategories ? item.subCategories : [];
                        
                        return (
                          <div key={itemId} className="space-y-0.5">
                            {/* Category/Service Category Item */}
                            <div className="flex items-center gap-2">
                              {hasSubCategories && subCategoriesToShow.length > 0 && (
                          <button
                            onClick={() => {
                                    setExpandedCategories(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(itemId)) {
                                        newSet.delete(itemId);
                                      } else {
                                        newSet.add(itemId);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-[#FE8A0F] transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              {!hasSubCategories || subCategoriesToShow.length === 0 ? (
                                <div className="w-5" /> // Spacer for alignment
                              ) : null}
                              <button
                                onClick={() => {
                                  const itemSlug = getSlug(item);
                                  if (!itemSlug) return;
                                  if (currentServiceCategory) {
                                    const url = buildSubCategoryUrl([itemSlug]);
                                    navigate(url);
                                  } else if (sectorSlug) {
                                    const url = buildServiceCategoryUrl(itemSlug);
                                    navigate(url);
                                  }
                            }}
                                className={`flex-1 text-left px-2 py-1.5 rounded font-['Poppins',sans-serif] text-[13px] transition-colors ${
                                  'text-[#5b5b5b] hover:bg-gray-50'
                            }`}
                          >
                                {itemName}
                          </button>
                            </div>
                            
                            {/* Subcategories (nested) */}
                            {isExpanded && hasSubCategories && subCategoriesToShow.length > 0 && (
                              <div className="ml-7 space-y-0.5">
                                {subCategoriesToShow.map((subCat: any) => renderSubCategoryTree(subCat, 0, [getSlug(item)]))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub Categories (3rd level - main category page) */}
                {currentMainCategory && (
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Services
                    </h3>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {Array.isArray(currentMainCategory.subCategories) && currentMainCategory.subCategories.map((subCat) => {
                        const isSelected = selectedSubCategories.includes(subCat.name);
                        return (
                          <button
                            key={subCat.id || subCat.name || `subcat-${(subCat as any)._id || Math.random()}`}
                            onClick={() => {
                              setSelectedSubCategories(prev =>
                                prev.includes(subCat.name)
                                  ? prev.filter(s => s !== subCat.name)
                                  : [...prev, subCat.name]
                              );
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg font-['Poppins',sans-serif] text-[13px] transition-colors ${
                              isSelected
                                ? 'bg-[#FFF5EB] text-[#FE8A0F] font-medium'
                                : 'text-[#5b5b5b] hover:bg-gray-50'
                            }`}
                          >
                            {subCat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                  {/* Price Range */}
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Price Range
                    </h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Poppins',sans-serif] text-[13px]"
                        />
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 100000])}
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Poppins',sans-serif] text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Minimum Rating
                    </h3>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-['Poppins',sans-serif] text-[13px] transition-colors ${
                            selectedRating === rating
                              ? 'bg-[#FFF5EB] text-[#FE8A0F]'
                              : 'text-[#5b5b5b] hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-0.5">
                            {[...Array(rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-[#FE8A0F] text-[#FE8A0F]" />
                            ))}
                          </div>
                          <span>& up</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Sort By
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Poppins',sans-serif] text-[13px] bg-white"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="rating">Highest Rated</option>
                      <option value="reviews">Most Reviews</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>
            </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Section - Desktop only shows both, Mobile only shows postcode */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Service Search - Desktop Only */}
                <div className="hidden lg:block flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search services or providers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 border-0 border-b-2 border-gray-200 rounded-none font-['Poppins',sans-serif] text-[14px] bg-white focus-visible:ring-0 focus-visible:border-[#FE8A0F]"
                  />
                </div>

                {/* Location Search */}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Postcode or location (e.g., SW1A 1AA)"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                        className="pl-10 h-12 border-0 border-b-2 border-gray-200 rounded-none font-['Poppins',sans-serif] text-[14px] bg-white focus-visible:ring-0 focus-visible:border-[#FE8A0F]"
                      />
                    </div>
                    {locationSearch && (
                      <Button
                        onClick={handleLocationSearch}
                        className="h-12 px-6 bg-[#FE8A0F] hover:bg-[#FFB347] transition-colors font-['Poppins',sans-serif] text-[14px] whitespace-nowrap"
                      >
                        Search
                      </Button>
                    )}
                  </div>
                  
                  {/* Radius Slider */}
                  {showRadiusSlider && (
                    <div className="bg-[#FFF5EB] rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                          Within {radiusMiles} miles
                        </Label>
                        <button
                          onClick={() => {
                            setLocationSearch("");
                            setShowRadiusSlider(false);
                          }}
                          className="text-[#FE8A0F] hover:text-[#ff9d3a] font-['Poppins',sans-serif] text-[11px]"
                        >
                          Clear
                        </button>
                      </div>
                      <Slider
                        value={[radiusMiles]}
                        onValueChange={(value) => setRadiusMiles(value[0])}
                        min={1}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title Section with View Mode Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[20px] md:text-[24px] mb-1">
                  {hasActiveFilters ? 'Filtered Services' : 'Featured Services'}
                </h2>
                {/* Desktop only subtitle */}
                <p className="hidden md:block font-['Poppins',sans-serif] text-[#8d8d8d] text-[13px]">
                  {currentMainCategory 
                    ? hasActiveFilters
                      ? `Showing ${displayServices.length} services in ${currentMainCategory.name}`
                      : `Top-rated professionals in ${currentMainCategory.name}`
                    : hasActiveFilters
                      ? `Showing ${displayServices.length} services in ${sector.name}`
                      : `Top-rated professionals in ${sector.name}`
                  }
                </p>
              </div>

              {/* Filter & View Mode Toggle - Mobile Only */}
              <div className="md:hidden flex items-center gap-2">
                {/* Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="relative p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  aria-label="Filters"
                >
                  <Filter className="w-4 h-4" />
                  {(selectedMainCategories.length + selectedSubCategories.length + (selectedRating > 0 ? 1 : 0) + (locationSearch ? 1 : 0)) > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 flex items-center justify-center p-0 text-[9px]">
                      {selectedMainCategories.length + selectedSubCategories.length + (selectedRating > 0 ? 1 : 0) + (locationSearch ? 1 : 0)}
                    </Badge>
                  )}
                </button>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
              </div>
            </div>

            {displayServices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <h3 className="font-['Poppins',sans-serif] text-[24px] text-[#5a5a5a] mb-4">
                  No services found
                </h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#7a7a7a] mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <button
                  onClick={() => {
                    setSelectedMainCategories([]);
                    setSelectedSubCategories([]);
                    setSearchQuery("");
                    setSelectedRating(0);
                    setPriceRange([0, 100000]);
                    setLocationSearch("");
                    setShowRadiusSlider(false);
                  }}
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] px-8 py-3 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Pane View - Grid */}
                {viewMode === 'pane' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center">
                    {displayServices.map((service) => {
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
                      
                      return (
                        <Link
                    key={service.id}
                          to={`/service/${service.slug || service._id || service.id}`}
                          className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col border border-gray-100 h-full w-full"
                          style={{ maxWidth: '330px', margin: '0 auto' }}
                  >
                    {/* Image/Video Section */}
                          <div className="relative w-full overflow-hidden" style={{ height: '225px' }}>
                      {(service as any).thumbnailVideo ? (
                        <VideoThumbnail
                          videoUrl={(service as any).thumbnailVideo.url}
                          thumbnail={(service as any).thumbnailVideo.thumbnail}
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
                                    // Use originalPrice (discount price) if available, otherwise use price (original price)
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
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {displayServices.map((service) => (
                      <Link
                        key={`list-${service.id}`}
                        to={`/service/${service.slug || service._id || service.id}`}
                        className="bg-white rounded-lg shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_12px_0px_rgba(254,138,15,0.3)] overflow-hidden transition-shadow duration-300 cursor-pointer flex min-h-[145px]"
                      >
                        {/* Image/Video Section - Left Side */}
                        <div className="relative w-[100px] flex-shrink-0 overflow-hidden bg-gray-100">
                          {(service as any).thumbnailVideo ? (
                            <VideoThumbnail
                              videoUrl={(service as any).thumbnailVideo.url}
                              thumbnail={(service as any).thumbnailVideo.thumbnail}
                              fallbackImage={service.image}
                              className="w-full h-full"
                              style={{ minWidth: '100%', minHeight: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                          <img
                            src={resolveMediaUrl(service.image)}
                            alt={service.description}
                            className="w-full h-full object-cover"
                            style={{ minWidth: '100%', minHeight: '100%', objectFit: 'cover' }}
                          />
                          )}
                          {/* Badges */}
                          {service.badges && service.badges.length > 0 && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              <span className="bg-[#FE8A0F] text-white text-[8px] font-['Poppins',sans-serif] font-semibold px-1.5 py-0.5 rounded-md shadow-md">
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
                                <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                                  <Avatar className="w-5 h-5 cursor-pointer hover:opacity-80 transition-opacity">
                                  <AvatarImage src={service.providerImage} alt={service.tradingName} />
                                  <AvatarFallback className="bg-[#FE8A0F] text-white text-[10px] font-semibold">
                                    {service.tradingName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                </Link>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Link to={service.professionalId ? `/profile/${service.professionalId}` : '#'} className="hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                  <span className="font-['Poppins',sans-serif] text-[9px] text-[#2c353f]">
                                    {service.tradingName.length > 8 ? `${service.tradingName.slice(0, 8)}...` : service.tradingName}
                                  </span>
                                  </Link>
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
                              </div>

                              {/* Description */}
                              <p className="font-['Poppins',sans-serif] text-[16px] text-[#5b5b5b] line-clamp-2 font-bold leading-snug">
                                {service.description.length > 55 ? `${service.description.slice(0, 55)}...` : service.description}
                              </p>

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
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-2.5 h-2.5 ${
                                              star <= Math.floor(score)
                                                ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                                : star - 0.5 <= score
                                                ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                                                : "fill-[#E5E5E5] text-[#E5E5E5]"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="font-['Poppins',sans-serif] text-[9px] text-[#2c353f]">
                                        {score.toFixed(1)}
                                      </span>
                                      <span className="font-['Poppins',sans-serif] text-[8px] text-[#8d8d8d]">
                                        ({reviewsCount})
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Bottom Section - Price with Delivery Badge */}
                          <div className="flex items-end justify-between gap-2 mt-auto">
                            {/* Price - Left Bottom */}
                            <div className="flex flex-col">
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
                                    // Use originalPrice if available (discounted), otherwise use price
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
                                    <div className="flex flex-col gap-1">
                                      <span className="font-['Poppins',sans-serif] text-[9px] text-[#5b5b5b]">
                                        <span className="text-[14px] text-[#2c353f] font-medium">
                                          {priceRange.formatted}
                                        </span>
                                        <span className="text-[9px]">/{service.priceUnit}</span>
                                      </span>
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
                                          <div className="flex flex-wrap items-center gap-1 mt-1">
                                            <span 
                                              className="inline-block text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                                              style={{ backgroundColor: '#CC0C39' }}
                                            >
                                              {minDiscount === maxDiscount ? `${minDiscount}% OFF` : `${minDiscount}% ~ ${maxDiscount}% OFF`}
                                            </span>
                                            {hasTimeLimitedDiscount && (
                                              <span className="text-[8px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                                Limited Time Offer
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                } else {
                                  // Show regular price when no packages
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-baseline gap-1">
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
                                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                            <span 
                                              className="inline-block text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                                              style={{ backgroundColor: '#CC0C39' }}
                                            >
                                              {Math.round(((parseFloat(String(service.price).replace('£', '')) - parseFloat(String(service.originalPrice).replace('£', ''))) / parseFloat(String(service.price).replace('£', ''))) * 100)}% off
                                            </span>
                                            {hasTimeLimitedDiscount && (
                                              <span className="text-[8px] font-semibold whitespace-nowrap" style={{ color: '#CC0C39' }}>
                                                Limited Time Offer
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                }
                              })()}
                            </div>

                            {/* Delivery Badge - Right Bottom */}
                            <div className="flex-shrink-0">
                              {service.deliveryType === "same-day" ? (
                                <div className="inline-flex items-center px-1.5 py-0.5 bg-white border border-[#FE8A0F] text-[#FE8A0F] font-['Poppins',sans-serif] text-[7px] tracking-wide uppercase rounded-md">
                                  <span className="font-medium">⚡ Delivers in 2 days</span>
                            </div>
                              ) : (
                                <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[7px] tracking-wide uppercase rounded-md">
                                  <svg className="w-1.5 h-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9h4l3 9 3-16 3 9h4"/>
                                  </svg>
                                  <span className="font-medium">Standard delivery</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Modal */}
      {showAddToCartModal && selectedServiceForCart && (
        <AddToCartModal
          service={selectedServiceForCart}
          onClose={() => {
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
          onAddToCart={(service, options) => {
            addToCart(service, options);
            setShowAddToCartModal(false);
            setSelectedServiceForCart(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}