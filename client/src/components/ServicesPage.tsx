import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, Link, useNavigate, useParams } from "react-router-dom";
import Nav from "../imports/Nav";
import Footer from "./Footer";
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
  Car, 
  Package, 
  MapPin,
  Sparkles,
  Stethoscope,
  PawPrint,
  TruckIcon,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { allServices, type Service } from "./servicesData";
import { categoryTreeForServicesPage } from "./unifiedCategoriesData";
import { useSectors, useServiceCategories, type ServiceCategory, type ServiceSubCategory } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory } from "../hooks/useSectorsAndCategories";

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
  
  // Location-based filtering
  const [locationSearch, setLocationSearch] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number>(10);
  // Default location: Chelsea, London (51.4875° N, 0.1687° W)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 51.4875,
    longitude: -0.1687
  });
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
    mainCategories: {
      name: string;
      value: string;
      subCategories: string[];
    }[];
  };

  // Load sectors from API
  const { sectors: apiSectors, loading: sectorsLoading } = useSectors(false, false);
  
  // Load legacy categories for fallback
  const { sectors: legacySectors } = useSectors(true, true);
  
  // Load service categories for all sectors
  const [allServiceCategories, setAllServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceCategoriesLoading, setServiceCategoriesLoading] = useState(true);
  
  useEffect(() => {
    const fetchAllServiceCategories = async () => {
      try {
        setServiceCategoriesLoading(true);
        if (apiSectors.length > 0) {
          // Fetch service categories for each sector
          const { resolveApiUrl } = await import("../config/api");
          const serviceCategoriesPromises = apiSectors.map(async (sector: Sector) => {
            try {
              const response = await fetch(
                resolveApiUrl(`/api/service-categories?sectorId=${sector._id}&activeOnly=true&includeSubCategories=true&sortBy=order&sortOrder=asc`),
                { credentials: 'include' }
              );
              if (response.ok) {
                const data = await response.json();
                return data.serviceCategories || [];
              }
              return [];
            } catch (error) {
              console.error(`Error fetching service categories for sector ${sector._id}:`, error);
              return [];
            }
          });
          
          const allCategories = await Promise.all(serviceCategoriesPromises);
          const flattened = allCategories.flat();
          setAllServiceCategories(flattened);
        }
      } catch (error) {
        console.error('Error fetching service categories:', error);
      } finally {
        setServiceCategoriesLoading(false);
      }
    };
    
    if (apiSectors.length > 0) {
      fetchAllServiceCategories();
    } else {
      setServiceCategoriesLoading(false);
    }
  }, [apiSectors]);
  
  // Convert API data to categoryTree format, sorted by order
  // Priority: Service Categories (new system) > Legacy Categories > Static data
  const categoryTree: CategoryTree[] = useMemo(() => {
    if (allServiceCategories.length > 0 && apiSectors.length > 0) {
      // Use service categories (new system)
      const sortedSectors = [...apiSectors].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return sortedSectors.map((sector: Sector) => {
        // Get service categories for this sector
        const sectorServiceCategories = allServiceCategories
          .filter((sc: ServiceCategory) => {
            const sectorId = typeof sc.sector === 'object' ? sc.sector._id : sc.sector;
            return sectorId === sector._id;
          })
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        return {
          sector: sector.name,
          sectorValue: sector.slug || sector.name.toLowerCase().replace(/\s+/g, '-'),
          mainCategories: sectorServiceCategories.map((serviceCategory: ServiceCategory) => {
            // Sort subcategories by order
            const sortedSubCategories = ((serviceCategory.subCategories || []) as ServiceSubCategory[])
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            return {
              name: serviceCategory.name,
              value: serviceCategory.slug || serviceCategory.name.toLowerCase().replace(/\s+/g, '-'),
              subCategories: sortedSubCategories.map((subCat: ServiceSubCategory) => subCat.name)
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
          mainCategories: sortedCategories.map((category: Category) => {
            const sortedSubCategories = ((category.subCategories || []) as SubCategory[])
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            return {
              name: category.name,
              value: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
              subCategories: sortedSubCategories.map((subCat: SubCategory) => subCat.name)
            };
          })
        };
      });
    }
    
    // Final fallback to static data
    return categoryTreeForServicesPage;
  }, [allServiceCategories, apiSectors, legacySectors]);

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
    const filters: SelectedFilter[] = [];
    
    // Priority: New service category URL params > Legacy category params
    if (sectorSlugParam && serviceCategorySlugParam) {
      // Find the sector by slug
      const matchedSector = apiSectors.find((s: Sector) => s.slug === sectorSlugParam);
      
      if (matchedSector) {
        // Find the service category by slug
        const matchedServiceCategory = allServiceCategories.find((sc: ServiceCategory) => {
          const sectorId = typeof sc.sector === 'object' ? sc.sector._id : sc.sector;
          return sectorId === matchedSector._id && sc.slug === serviceCategorySlugParam;
        });
        
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
    } else if (categoryParam || subcategoryParam || detailedSubcategoryParam) {
      // Legacy URL params for backward compatibility
      const matchedSector = categoryTree.find(s => s.sector === categoryParam);
      
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
    
    if (filters.length > 0) {
      setSelectedFilters(filters);
    }
  }, [sectorSlugParam, serviceCategorySlugParam, serviceSubCategorySlugParams, serviceSubCategorySlugParam, categoryParam, subcategoryParam, detailedSubcategoryParam, apiSectors, allServiceCategories, categoryTree]);

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
  const filteredAndSortedServices = useMemo(() => {
    let filtered = allServices.map(service => ({
      ...service,
      distance: userCoords && service.latitude && service.longitude
        ? calculateDistance(userCoords.latitude, userCoords.longitude, service.latitude, service.longitude)
        : undefined
    })).filter((service) => {
      // Search filter - comprehensive search across multiple fields
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        // Search in service title/description
        service.description.toLowerCase().includes(searchLower) ||
        // Search in professional name
        service.providerName.toLowerCase().includes(searchLower) ||
        // Search in trading/business name
        service.tradingName.toLowerCase().includes(searchLower) ||
        // Search in category (sector)
        service.category.toLowerCase().includes(searchLower) ||
        // Search in subcategory (main category)
        (service.subcategory && service.subcategory.toLowerCase().includes(searchLower)) ||
        // Search in detailed subcategory
        (service.detailedSubcategory && service.detailedSubcategory.toLowerCase().includes(searchLower)) ||
        // Search in location
        service.location.toLowerCase().includes(searchLower) ||
        // Search in specialization
        (service.specialization && service.specialization.toLowerCase().includes(searchLower)) ||
        // Search in ideal for tags
        (service.idealFor && service.idealFor.some(tag => tag.toLowerCase().includes(searchLower))) ||
        // Search in highlights
        (service.highlights && service.highlights.some(highlight => highlight.toLowerCase().includes(searchLower)));

      // New hierarchical category filter
      const matchesCategory = selectedFilters.length === 0 || selectedFilters.some(filter => {
        // Sector filter - matches if service category matches sector
        if (filter.type === 'sector') {
          return service.category === filter.sector;
        }
        // Main Category filter - matches if service subcategory matches
        if (filter.type === 'mainCategory') {
          return service.category === filter.sector && service.subcategory === filter.mainCategory;
        }
        // Sub Category filter - matches if service detailedSubcategory matches
        if (filter.type === 'subCategory') {
          return service.category === filter.sector && 
                 service.subcategory === filter.mainCategory && 
                 service.detailedSubcategory === filter.subCategory;
        }
        return false;
      });

      // Location filter (postcode/radius)
      const matchesLocation = !userCoords || service.distance === undefined || service.distance <= radiusMiles;

      // Location text search
      const matchesLocationSearch = locationSearch === "" ||
        service.location.toLowerCase().includes(locationSearch.toLowerCase()) ||
        service.postcode.toLowerCase().includes(locationSearch.toLowerCase());

      // Delivery filter
      const matchesDelivery = selectedDelivery.length === 0 || 
        (selectedDelivery.includes("Same Day") && service.deliveryType === "same-day") ||
        (selectedDelivery.includes("Standard") && service.deliveryType === "standard");

      // Rating filter
      const matchesRating = selectedRating === 0 || service.rating >= selectedRating;

      // Price filter
      const priceValue = parseFloat(service.price);
      const matchesPrice = priceValue >= priceRange[0] && priceValue <= priceRange[1];

      return matchesSearch && matchesCategory && matchesLocation && matchesLocationSearch && 
             matchesDelivery && matchesRating && matchesPrice;
    });

    // Sort services
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
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
  }, [searchQuery, selectedFilters, selectedDelivery, selectedRating, priceRange, sortBy, userCoords, radiusMiles, locationSearch]);

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
  }, [selectedFilters]);

  // New filter management functions
  const toggleSectorExpansion = (sector: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sector)) {
        newSet.delete(sector);
      } else {
        newSet.add(sector);
      }
      return newSet;
    });
  };

  const toggleMainCategoryExpansion = (sectorValue: string, mainCategoryValue: string) => {
    const key = `${sectorValue}-${mainCategoryValue}`;
    setExpandedMainCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
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
      setSelectedFilters(prev => [...prev, filter]);
      
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
    }
  };

  const removeFilter = (index: number) => {
    setSelectedFilters(prev => prev.filter((_, i) => i !== index));
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
        
        {/* Selected Filters */}
        {selectedFilters.length > 0 && (
          <TooltipProvider>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedFilters.map((filter, index) => {
                // Get short name (last part of the path)
                const shortName = filter.subCategory || filter.mainCategory || filter.sector || "";
                const hasMultipleLevels = filter.displayName.includes(">");
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Badge
                        className="bg-[#FFF5EB] text-[#FE8A0F] border border-[#FE8A0F]/30 font-['Poppins',sans-serif] text-[12px] px-2.5 py-1 cursor-pointer hover:bg-[#FE8A0F] hover:text-white transition-colors max-w-[180px]"
                        onClick={() => removeFilter(index)}
                      >
                        <span className="truncate">{shortName}</span>
                        <X className="w-3 h-3 ml-1.5 flex-shrink-0" />
                      </Badge>
                    </TooltipTrigger>
                    {hasMultipleLevels && (
                      <TooltipContent side="top" className="font-['Poppins',sans-serif] text-[11px] bg-gray-900 text-white">
                        <p>{filter.displayName}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}

        {/* Category Tree */}
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
                          onClick={() => addFilter({
                            type: 'subCategory',
                            sector: sector.sector,
                            mainCategory: mainCat.name,
                            subCategory: subCat,
                            displayName: `${sector.sector} > ${mainCat.name} > ${subCat}`
                          })}
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
                  <button
                    onClick={() => toggleSectorExpansion(sector.sectorValue)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  >
                    <ChevronDown 
                      className={`w-4 h-4 text-[#FE8A0F] transition-transform ${
                        expandedSectors.has(sector.sectorValue) ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {getSectorIcon(sector.sector)}
                  </div>
                  <button
                    onClick={() => addFilter({
                      type: 'sector',
                      sector: sector.sector,
                      displayName: sector.sector
                    })}
                    className="flex-1 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors"
                  >
                    {sector.sector}
                  </button>
                </div>

                {/* Main Categories (shown when sector expanded) */}
                {expandedSectors.has(sector.sectorValue) && (
                  <div className="pl-4 pb-2 space-y-1">
                    {sector.mainCategories.map((mainCat) => {
                      const mainCatKey = `${sector.sectorValue}-${mainCat.value}`;
                      return (
                        <div key={mainCat.value} className="border-l-2 border-gray-200 pl-2">
                          <div className="flex items-center gap-1 py-1 hover:bg-gray-50 transition-colors">
                            <button
                              onClick={() => toggleMainCategoryExpansion(sector.sectorValue, mainCat.value)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <ChevronDown 
                                className={`w-3.5 h-3.5 text-[#FE8A0F] transition-transform ${
                                  expandedMainCategories.has(mainCatKey) ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => addFilter({
                                type: 'mainCategory',
                                sector: sector.sector,
                                mainCategory: mainCat.name,
                                displayName: `${sector.sector} > ${mainCat.name}`
                              })}
                              className="flex-1 text-left font-['Poppins',sans-serif] text-[13px] text-[#5b5b5b] hover:text-[#10B981] transition-colors"
                            >
                              {mainCat.name}
                            </button>
                          </div>

                          {/* Sub Categories (shown when main category expanded) */}
                          {expandedMainCategories.has(mainCatKey) && mainCat.subCategories.length > 0 && (
                            <div className="pl-4 space-y-0.5">
                              {mainCat.subCategories.map((subCat) => (
                                <button
                                  key={subCat}
                                  onClick={() => addFilter({
                                    type: 'subCategory',
                                    sector: sector.sector,
                                    mainCategory: mainCat.name,
                                    subCategory: subCat,
                                    displayName: `${sector.sector} > ${mainCat.name} > ${subCat}`
                                  })}
                                  className="block w-full text-left py-1 px-2 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] hover:text-[#3D78CB] hover:bg-gray-50 rounded transition-colors"
                                >
                                  • {subCat}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1.5 block">
              Min Price (£)
            </Label>
            <Input
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
            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1.5 block">
              Max Price (£)
            </Label>
            <Input
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
    const categoryName = serviceCategorySlugParam 
      ? allServiceCategories.find((sc: ServiceCategory) => sc.slug === serviceCategorySlugParam)?.name
      : categoryParam || (selectedFilters.length > 0 ? selectedFilters[0].sector : null);
    
    // Handle multiple serviceSubCategory parameters - use the last one
    const subcategoryName = serviceSubCategorySlugParams.length > 0
      ? (() => {
          const lastSlug = serviceSubCategorySlugParams[serviceSubCategorySlugParams.length - 1];
          const matchedServiceCategory = allServiceCategories.find((sc: ServiceCategory) => sc.slug === serviceCategorySlugParam);
          return matchedServiceCategory?.subCategories?.find((subCat: ServiceSubCategory) => subCat.slug === lastSlug)?.name;
        })()
      : serviceSubCategorySlugParam
      ? allServiceCategories
          .find((sc: ServiceCategory) => sc.slug === serviceCategorySlugParam)
          ?.subCategories?.find((subCat: ServiceSubCategory) => subCat.slug === serviceSubCategorySlugParam)?.name
      : subcategoryParam || (selectedFilters.length > 0 ? selectedFilters[0].mainCategory : null);
    
    if (categoryName && subcategoryName) {
      return {
        title: `${subcategoryName} in ${categoryName} - Verified UK Professionals`,
        description: `Find trusted ${subcategoryName.toLowerCase()} professionals in ${categoryName.toLowerCase()}. Browse verified service providers, compare prices, and book instantly.`
      };
    } else if (categoryName) {
      return {
        title: `${categoryName} Services - Trusted UK Professionals`,
        description: `Discover verified ${categoryName.toLowerCase()} professionals across the UK. Compare ratings, read reviews, and book quality services with confidence.`
      };
    }
    
    return {
      title: "Professional Services UK",
      description: "Browse thousands of verified professional services across 13 categories. Compare prices, read reviews, and book trusted professionals near you instantly."
    };
  };

  const seoContent = generateSEOContent();

  return (
    <div className="w-full min-h-screen bg-[#f0f0f0]">
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
            {filteredAndSortedServices.length === 0 ? (
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
                  ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              }`}>
{filteredAndSortedServices.map((service) => (
                  <div
                    key={service.id}
                    className={`bg-white rounded-[10px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 cursor-pointer ${
                      viewMode === "list" ? "flex flex-row min-h-[145px]" : "flex flex-col"
                    }`}
                    onClick={() => navigate(`/service/${service.id}`, { state: { userCoords } })}
                  >
                    {/* Image Section */}
                    <div 
                      className={`relative ${
                        viewMode === "list" ? "w-[100px] flex-shrink-0" : "h-[120px] md:h-[170px]"
                      }`}
                    >
                      <img
                        src={service.image}
                        alt={service.description}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badges */}
                      {viewMode === "list" ? (
                        service.badges && service.badges.length > 0 && (
                          <div className="absolute top-1.5 left-1.5">
                            <span className="bg-[#FE8A0F] text-white text-[8px] font-['Poppins',sans-serif] font-semibold px-1.5 py-0.5 rounded-full shadow-md">
                              {service.badges[0]}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="absolute top-3 left-3">
                          <div className="bg-white/95 backdrop-blur-sm text-[#3B82F6] font-['Poppins',sans-serif] font-medium px-2 py-1 rounded-full shadow-lg border border-[#3B82F6]/30 flex items-center gap-1 text-[10px]">
                            {getCategoryIcon(service.category)}
                            <span>{service.category}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div 
                      className={`${
                        viewMode === "list" 
                          ? "flex-1 p-3 flex flex-col" 
                          : "p-2 md:p-4 flex flex-col flex-1"
                      }`}
                    >
                      {viewMode === "list" ? (
                        // LIST VIEW LAYOUT - Compact (same as SectorPage)
                        <>
                          <div className="flex-1 flex flex-col">
                            {/* Top Section */}
                            <div className="space-y-1.5 mb-2">
                              {/* Provider Info */}
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={service.providerImage}
                                  alt={service.tradingName}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className="font-['Poppins',sans-serif] text-[11px] text-[#2c353f] truncate">
                                  {service.tradingName}
                                </span>
                              </div>

                              {/* Description */}
                              <p className="font-['Poppins',sans-serif] text-[10px] text-[#5b5b5b] line-clamp-2">
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
                          <div className="flex items-end justify-between gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Price - Left Bottom */}
                            <div className="flex flex-col">
                              {service.originalPrice && (
                                <span className="font-['Poppins',sans-serif] text-[9px] text-[#c0c0c0] line-through">
                                  £{service.originalPrice}
                                </span>
                              )}
                              <span className="font-['Poppins',sans-serif] text-[9px] text-[#5b5b5b]">
                                {service.originalPrice && "From "}
                                <span className="text-[14px] text-[#2c353f] font-medium">
                                  £{service.price}
                                </span>
                                <span className="text-[9px]">/{service.priceUnit}</span>
                              </span>
                            </div>

                            {/* Action Buttons - Right Bottom */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/service/${service.id}`, { state: { userCoords } });
                                }}
                                className="h-[28px] w-[28px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_10px_rgba(254,138,15,0.5)] text-white rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center"
                              >
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
                        </>
                      ) : (
                        // GRID VIEW LAYOUT - Minimalist Mobile Responsive
                        <div className="flex flex-col flex-1">
                          {/* Provider Info */}
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                            <Link to={`/profile/117`} className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                              <img
                                src={service.providerImage}
                                alt={service.tradingName}
                                className="w-5 h-5 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-['Poppins',sans-serif] text-[10px] md:text-[14px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors block truncate">
                                  {service.tradingName}
                                </span>
                              </div>
                            </Link>
                          </div>

                          {/* Description */}
                          <p className="font-['Poppins',sans-serif] text-[9px] md:text-[13px] text-[#5b5b5b] mb-1.5 md:mb-3 line-clamp-2">
                            {service.description}
                          </p>

                          {/* Star Rating */}
                          <div className="flex items-center mb-1.5 md:mb-3">
                            {service.reviewCount > 0 ? (
                              <div className="flex items-center gap-0.5 md:gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-2 h-2 md:w-3.5 md:h-3.5 ${
                                      star <= Math.floor(service.rating)
                                        ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                        : star - 0.5 <= service.rating
                                        ? "fill-[#FE8A0F] text-[#FE8A0F] opacity-50"
                                        : "fill-[#E5E5E5] text-[#E5E5E5]"
                                    }`}
                                  />
                                ))}
                                <span className="font-['Poppins',sans-serif] text-[8px] md:text-[13px] text-[#2c353f] ml-0.5 md:ml-1">
                                  {service.rating} <span className="text-[#8d8d8d]">({service.completedTasks})</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 md:gap-2 text-[#8d8d8d] text-[8px] md:text-[12px]">
                                <Star className="w-2 h-2 md:w-3.5 md:h-3.5 fill-[#E5E5E5] text-[#E5E5E5]" />
                                <span className="font-['Poppins',sans-serif]">New</span>
                              </div>
                            )}
                          </div>

                          {/* Price and Discount */}
                          {service.originalPrice && (
                            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                              <span className="font-['Poppins',sans-serif] text-[9px] md:text-[13px] text-[#c0c0c0] line-through">
                                £{service.originalPrice}
                              </span>
                              <div className="px-1 md:px-1.5 py-0.5 bg-[#E6F0FF] rounded">
                                <span className="font-['Poppins',sans-serif] text-[7px] md:text-[10px] text-[#3D78CB]">
                                  {Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)}% OFF
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Price Display and Delivery Badge */}
                          <div className="flex items-center justify-between gap-1 md:gap-2 mb-2 md:mb-4">
                            <span className="font-['Poppins',sans-serif] text-[9px] md:text-[13px] text-[#5b5b5b]">
                              {service.originalPrice && "From "}
                              <span className="text-[13px] md:text-[18px] text-[#2c353f] font-medium">
                                £{service.price}
                              </span>
                              <span className="text-[8px] md:text-[13px]">/{service.priceUnit}</span>
                            </span>
                            
                            {/* Delivery Badge */}
                            <div className="flex-shrink-0">
                              {service.deliveryType === "same-day" ? (
                                <div className="inline-flex items-center px-1 md:px-2 py-0.5 bg-white border border-[#FE8A0F] text-[#FE8A0F] font-['Poppins',sans-serif] text-[6px] md:text-[9px] tracking-wide uppercase rounded-sm">
                                  <span className="font-semibold">⚡ Same Day</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-0.5 px-1 md:px-2 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[6px] md:text-[9px] tracking-wide uppercase rounded-sm">
                                  <span className="font-semibold">Standard</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons - Stacked on mobile, side by side on desktop */}
                          <div className="flex flex-col md:flex-row gap-1.5 md:gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                            <button className="w-full h-[26px] md:h-[32px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_15px_rgba(254,138,15,0.6)] text-white rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-1.5 text-[10px] md:text-[13px]">
                              <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                              <span className="truncate">Buy Now!</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedServiceForCart(service);
                                setShowAddToCartModal(true);
                              }}
                              className="w-full h-[26px] md:h-[32px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_8px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-1.5 text-[10px] md:text-[13px]"
                            >
                              <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                              <span className="truncate">Add to cart</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
              id: selectedServiceForCart.id.toString(),
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
                time: data.booking.time,
                timeSlot: data.booking.timeSlot
              } : undefined,
              packageType: data.packageType
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
