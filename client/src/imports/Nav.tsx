import logoImage from "figma:asset/71632be70905a17fd389a8d053249645c4e8a4df.png";
import appIcon from "figma:asset/e0cd63eca847c922f306abffb67a5c6de3fd7001.png";
import { categoryTree, mainCategories } from "../components/unifiedCategoriesData";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, Bell, User, Search, Heart, ShoppingBag, Briefcase, CreditCard, Lock, Settings, MessageCircle, HelpCircle, Gift, FileText, Wallet, Shield, Ticket, LogOut } from "lucide-react";
import { useCart } from "../components/CartContext";
import { useAccount } from "../components/AccountContext";
import { useSectors, useServiceCategories, type Sector, type Category, type ServiceCategory, type ServiceSubCategory } from "../hooks/useSectorsAndCategories";
import { useAllServiceCategories } from "../hooks/useAllServiceCategories";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import svgPaths from "./svg-fomenmyfjn";

// Helper function to convert sector name to URL slug
const sectorToSlug = (sectorName: string): string => {
  return sectorName
    .toLowerCase()
    .replace(/ & /g, '-')
    .replace(/ /g, '-');
};

// Helper function to convert main category name to URL slug
const mainCategoryToSlug = (categoryName: string): string => {
  return categoryName
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/ /g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// Helper function to get category ID by sector and category name
// This will be used as a fallback when API data is not available
const getCategoryId = (sectorName: string, categoryName: string, sectors?: Sector[]): string => {
  // Try to find category in API data first
  if (sectors) {
    const sector = sectors.find(s => s.name === sectorName);
    if (sector && sector.categories) {
      const category = sector.categories.find(cat => cat.name === categoryName);
      if (category) {
        return category._id || category.slug || mainCategoryToSlug(categoryName);
      }
    }
  }
  
  // Fallback to static data
  const category = mainCategories.find(cat => 
    cat.sectorName === sectorName && cat.name === categoryName
  );
  return category?.id || mainCategoryToSlug(categoryName);
};

function Frame({ isServicesPage }: { isServicesPage?: boolean }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[10px] items-start left-0 p-[10px] top-0 w-full bg-white">
      <div className={`bg-white shrink-0 w-full ${
        // Desktop heights
        isServicesPage ? 'hidden md:block md:h-[58px]' : 'hidden md:block md:h-[102px]'
      } ${
        // Mobile heights - adjusted based on page type
        isServicesPage ? 'block md:hidden h-[73px]' : 
        !isHomePage ? 'block md:hidden h-[217px]' : 'block md:hidden h-[100px]'
      }`} />
    </div>
  );
}

function Component() {
  return (
    <div
      className="h-[7px] w-[11px]"
      data-name="17248848271579697358 (2) 1"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 11 7"
      >
        <g
          clipPath="url(#clip0_2_1042)"
          id="17248848271579697358 (2) 1"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p3201b980}
            fill="var(--fill-0, #E77802)"
            fillRule="evenodd"
            id="Vector"
          />
        </g>
        <defs>
          <clipPath id="clip0_2_1042">
            <rect fill="white" height="7" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function GetQuote() {
  return (
    <Link to="/post-job">
      <button
        className="bg-[#fe8a0f] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 rounded-[20px] px-[20px] py-[9px] cursor-pointer"
        data-name="Get quote"
      >
        <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic text-[15px] text-center text-white whitespace-nowrap">
          Get Quote
        </p>
      </button>
    </Link>
  );
}

// Desktop Login Button - White background, smaller, no badge
function LoginButton() {
  const { isLoggedIn, userInfo, userRole } = useAccount();

  if (isLoggedIn && userInfo) {
    return (
      <Link
        to="/account"
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer group"
        data-name="Login"
      >
        <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-[#FE8A0F] transition-all">
          <AvatarImage
            src={userInfo.avatar}
            alt={userInfo.name}
          />
          <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
            {userInfo.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] leading-tight">
            Welcome
          </span>
          <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors leading-tight">
            {userInfo.name.split(" ")[0]}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer group"
      data-name="Login"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F5] group-hover:bg-[#FFF5EB] transition-colors">
        <User className="w-5 h-5 text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors" />
      </div>
      <div className="flex flex-col items-start">
        <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] leading-tight">
          My Account
        </span>
        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors leading-tight">
          Login/Register
        </span>
      </div>
    </Link>
  );
}

// Mobile Login Button - Blue gradient background with badge
function MobileLoginButton() {
  const { isLoggedIn, userInfo, userRole } = useAccount();

  if (isLoggedIn && userInfo) {
    return (
      <Link
        to="/account"
        className="block"
        data-name="Login"
      >
        <div className="px-4 py-4 bg-gradient-to-br from-[#3D78CB] to-[#2c5aa0] rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-4 border-white/20">
              <AvatarImage
                src={userInfo.avatar}
                alt={userInfo.name}
              />
              <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[18px]">
                {userInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Poppins',sans-serif] text-[17px] text-white mb-1 truncate">
                {userInfo.name}
              </h3>
              <Badge className="bg-white/20 text-white border-0 font-['Poppins',sans-serif] text-[11px] hover:bg-white/30">
                {userRole === "client" ? "Client" : "Professional"}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer group"
      data-name="Login"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F5] group-hover:bg-[#FFF5EB] transition-colors">
        <User className="w-5 h-5 text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors" />
      </div>
      <div className="flex flex-col items-start">
        <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] leading-tight">
          My Account
        </span>
        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors leading-tight">
          Login/Register
        </span>
      </div>
    </Link>
  );
}

function Component1() {
  return (
    <div
      className="h-[7px] relative w-[11px]"
      data-name="17248848271579697358 (2) 2"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 11 7"
      >
        <g
          clipPath="url(#clip0_2_1039)"
          id="17248848271579697358 (2) 2"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p3201b980}
            fill="var(--fill-0, #8D8D8D)"
            fillRule="evenodd"
            id="Vector"
          />
        </g>
        <defs>
          <clipPath id="clip0_2_1039">
            <rect fill="white" height="7" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

// Dropdown data will be generated dynamically from API data



// Sample notification data
const notificationsData = [
  {
    id: 1,
    title: "New service booking",
    message: "John Smith booked your plumbing service",
    time: "5 min ago",
    read: false,
    type: "booking"
  },
  {
    id: 2,
    title: "Payment received",
    message: "£250 payment confirmed for Garden Landscaping",
    time: "1 hour ago",
    read: false,
    type: "payment"
  },
  {
    id: 3,
    title: "New review",
    message: "Sarah left a 5-star review on your service",
    time: "2 hours ago",
    read: false,
    type: "review"
  },
  {
    id: 4,
    title: "Service completed",
    message: "Your electrical repair service was marked complete",
    time: "1 day ago",
    read: true,
    type: "service"
  },
  {
    id: 5,
    title: "Special offer",
    message: "Get 20% off on featured listing this week",
    time: "2 days ago",
    read: true,
    type: "promotion"
  },
];

export default function Nav() {
  const { cartCount, cartTotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, userRole, logout } = useAccount();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, width: 0 });
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [browseCategoriesOpen, setBrowseCategoriesOpen] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Check if current page is home page
  const isHomePage = location.pathname === '/';

  // Track mobile screen size
  useEffect(() => {
    const checkMobileScreen = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobileScreen();
    
    // Add resize listener
    window.addEventListener('resize', checkMobileScreen);
    return () => window.removeEventListener('resize', checkMobileScreen);
  }, []);

  // Show modal on every refresh if on home page and mobile device
  useEffect(() => {
    if (isHomePage) {
      // Check if it's a mobile device
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Show modal after a short delay
        const timer = setTimeout(() => {
          setShowAppModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isHomePage]);

  const handleDismissAppBanner = () => {
    setShowAppBanner(false);
    localStorage.setItem('appBannerDismissed', 'true');
  };

  const handleAppModalOk = () => {
    setShowAppModal(false);
    
    // Detect device type and redirect to appropriate app store
    const userAgent = navigator.userAgent || navigator.vendor;
    
    // Check if iOS
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      // Redirect to Apple App Store
      window.location.href = 'https://apps.apple.com/app/tradespeoplehub/id123456789';
    } 
    // Check if Android or other devices
    else {
      // Redirect to Google Play Store
      window.location.href = 'https://play.google.com/store/apps/details?id=com.tradespeoplehub';
    }
  };

  const handleAppModalCancel = () => {
    setShowAppModal(false);
  };

  const handleCategoryHover = (category: string) => {
    setActiveDropdown(category);
    const element = categoryRefs.current[category];
    if (element) {
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Calculate category center point
      let leftPosition = rect.left + rect.width / 2;
      
      // Expected dropdown width (responsive) - based on min-w-[600px]
      const dropdownWidth = viewportWidth >= 1280 ? 800 : viewportWidth >= 1024 ? 700 : 600;
      const dropdownHalfWidth = dropdownWidth / 2;
      const padding = 30; // Increased padding for better edge spacing
      
      // Check left boundary - move center to the right if too close to screen left
      if (leftPosition - dropdownHalfWidth < padding) {
        leftPosition = dropdownHalfWidth + padding;
      }
      
      // Check right boundary - move center to the left if too close to screen right
      if (leftPosition + dropdownHalfWidth > viewportWidth - padding) {
        leftPosition = viewportWidth - dropdownHalfWidth - padding;
      }
      
      setDropdownPosition({
        left: leftPosition,
        width: rect.width,
      });
    }
  };

  // Adjust dropdown position based on actual dropdown width
  useEffect(() => {
    if (activeDropdown && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const padding = 30;
      
      let newLeft = dropdownPosition.left;
      
      // Check if dropdown overflows on the left
      if (dropdownRect.left < padding) {
        const overflow = padding - dropdownRect.left;
        newLeft = dropdownPosition.left + overflow;
      }
      
      // Check if dropdown overflows on the right
      if (dropdownRect.right > viewportWidth - padding) {
        const overflow = dropdownRect.right - (viewportWidth - padding);
        newLeft = dropdownPosition.left - overflow;
      }
      
      // Update position if needed
      if (newLeft !== dropdownPosition.left) {
        setDropdownPosition(prev => ({ ...prev, left: newLeft }));
      }
    }
  }, [activeDropdown, dropdownPosition.left]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }
  };

  // Touch swipe handler - uses smooth native scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSignificantSwipe = Math.abs(distance) > 50;
    
    // Additional scroll for fast swipes
    if (isSignificantSwipe) {
      const isLeftSwipe = distance > 0;
      
      if (scrollContainerRef.current) {
        const currentScroll = scrollContainerRef.current.scrollLeft;
        const swipeVelocity = distance * 2; // Scroll further based on swipe velocity
        
        scrollContainerRef.current.scrollTo({
          left: currentScroll + swipeVelocity,
          behavior: "smooth",
        });
      }
    }
  };

  // Close mobile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setMobileDropdownOpen(false);
      setExpandedCategory(null);
    };

    if (mobileDropdownOpen && window.innerWidth < 768) {
      // Add a slight delay to add listener after current click event completes
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [mobileDropdownOpen]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  // Handle notification dropdown hover with delay
  const handleNotificationMouseEnter = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setShowNotifications(true);
  };

  const handleNotificationMouseLeave = () => {
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotifications(false);
    }, 200);
  };

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    if (showSearchSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSearchSuggestions]);

  // Sample search suggestions based on query
  const getSearchSuggestions = () => {
    if (!searchQuery) return [];
    
    // Use service categories if available, otherwise fallback to categoryTree
    let allCategories: Array<{ name: string; sectorName: string; sectorSlug: string; serviceCategorySlug?: string; type: 'category' }> = [];
    
    if (apiSectors.length > 0 && Object.keys(serviceCategoriesBySector).length > 0) {
      // Use service categories
      allCategories = apiSectors.flatMap(sector => {
        const serviceCategories = serviceCategoriesBySector[sector._id] || [];
        return serviceCategories.map(serviceCategory => ({
          name: serviceCategory.name,
          sectorName: sector.name,
          sectorSlug: sector.slug || sector.name.toLowerCase().replace(/\s+/g, '-'),
          serviceCategorySlug: serviceCategory.slug,
          type: 'category' as const
        }));
      });
    } else {
      // Fallback to categoryTree
      allCategories = categoryTree.flatMap(sector => 
        sector.mainCategories.map(cat => ({
          name: cat.name,
          sectorName: sector.name,
          sectorSlug: sector.sectorValue,
          type: 'category' as const
        }))
      );
    }
    
    const filtered = allCategories.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.slice(0, 5);
  };

  // Handle search enter key
  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchSuggestions(false);
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Get sectors from API
  const { sectors: apiSectors, loading: sectorsLoading } = useSectors(false, false);
  
  // Fetch service categories for all sectors using optimized hook
  const { serviceCategoriesBySector, loading: serviceCategoriesLoading } = useAllServiceCategories(apiSectors, {
    includeSubCategories: true,
  });
  
  // Use API sectors if available, otherwise fall back to categoryTree
  const sectorsToUse = apiSectors.length > 0 ? apiSectors : categoryTree.map(s => ({ name: s.name, slug: s.sectorValue, order: s.id }));
  
  // Sort by order field (ascending)
  const sortedSectors = [...sectorsToUse].sort((a, b) => {
    const orderA = 'order' in a ? a.order : (a as any).id || 0;
    const orderB = 'order' in b ? b.order : (b as any).id || 0;
    return orderA - orderB;
  });
  
  const categories = sortedSectors.map(sector => sector.name);
  
  // Create a mapping from sector name to sector slug
  const sectorNameToSlug: Record<string, string> = sortedSectors.reduce((acc, sector) => {
    const slug = 'slug' in sector ? sector.slug : (sector as any).sectorValue || '';
    acc[sector.name] = slug;
    return acc;
  }, {} as Record<string, string>);
  
  // Generate categoryDropdownData from service categories, sorted by order
  const categoryDropdownData: { [key: string]: { title: string; items: string[]; serviceCategorySlug?: string; subCategorySlugs?: string[] }[] } = {};
  
  if (apiSectors.length > 0 && Object.keys(serviceCategoriesBySector).length > 0) {
    // Use service categories (new system)
    sortedSectors.forEach((sector: Sector) => {
      const serviceCategories = serviceCategoriesBySector[sector._id] || [];
      if (serviceCategories.length > 0) {
        // Sort service categories by order
        const sortedServiceCategories = [...serviceCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        categoryDropdownData[sector.name] = sortedServiceCategories.map((serviceCategory: ServiceCategory) => {
          // Sort subcategories by order - show all subcategories (no limit)
          const sortedSubCategories = serviceCategory.subCategories 
            ? [...serviceCategory.subCategories]
                .filter((subCat: ServiceSubCategory) => subCat.level === 2 && !subCat.parentSubCategory) // Only Level 2 subcategories (direct children)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
            : [];
          
          return {
            title: serviceCategory.name,
            items: sortedSubCategories.map((subCat: ServiceSubCategory) => subCat.name),
            serviceCategorySlug: serviceCategory.slug,
            subCategorySlugs: sortedSubCategories.map((subCat: ServiceSubCategory) => subCat.slug)
          };
        });
      }
    });
  } else if (apiSectors.length > 0) {
    // Fallback to legacy categories if service categories not loaded yet
    sortedSectors.forEach((sector: Sector) => {
      if (sector.categories && sector.categories.length > 0) {
        const sortedCategories = [...sector.categories].sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0));
        
        categoryDropdownData[sector.name] = sortedCategories.map((category: Category) => {
          const sortedSubCategories = category.subCategories 
            ? [...category.subCategories].sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 4)
            : [];
          
          return {
            title: category.name,
            items: sortedSubCategories.map(subCat => subCat.name)
          };
        });
      }
    });
  } else {
    // Fallback to static data
    categoryTree.forEach(sector => {
      categoryDropdownData[sector.name] = sector.mainCategories.map(mainCat => ({
        title: mainCat.name,
        items: mainCat.subCategories.slice(0, 4)
      }));
    });
  }

  // Hide category bar on Services listing pages. Handle trailing slash and nested routes.
  const isServicesPage =
    location.pathname === "/services" ||
    location.pathname.startsWith("/services/") ||
    location.pathname.replace(/\/+$/, "") === "/services";

  return (
    <div
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isServicesPage ? 'md:h-[78px]' : 'md:h-[122px]'
      } ${
        isServicesPage ? 'h-[73px] md:h-auto' :
        !isHomePage ? 'h-[148px] md:h-auto' : 'h-[73px] md:h-auto'
      }`}
      data-name="Nav"
    >
      {/* White background layer - absolute positioning to cover entire header */}
      <div className="absolute inset-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-0"></div>
      

      
      {/* Mobile Header - New Layout */}
      <div className="md:hidden bg-white">
        {/* Top Row: Menu Button, Logo, Login */}
        <div className={`relative ${isHomePage ? 'h-[100px]' : 'h-[100px]'} flex items-center justify-between px-4 bg-white`}>
          {/* Left: Menu Button */}
          <button
            className="z-20 cursor-pointer flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#5b5b5b]" />
            ) : (
              <Menu className="w-6 h-6 text-[#5b5b5b]" />
            )}
          </button>

          {/* Center: Logo */}
          <Link 
            to="/" 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:opacity-90 transition-opacity"
          >
            <img 
              src={logoImage} 
              alt="Professional Services Platform" 
              className="h-[50px] w-auto"
            />
          </Link>

          {/* Right: Login Text - Only show when not logged in */}
          {!isLoggedIn && (
            <Link
              to="/login"
              className="z-20 cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="font-['Poppins',sans-serif] text-[15px] text-[#5b5b5b] hover:text-[#FE8A0F] transition-colors">
                Login
              </span>
            </Link>
          )}
        </div>

        {/* Search Bar Below Logo - Hidden on Home Page and Services Page - Using Normal Flow */}
        {!isHomePage && !isServicesPage && (
          <div className="px-4 pb-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8d8d8d] z-10" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(e.target.value.length > 0);
                }}
                onKeyDown={handleSearchEnter}
                className="w-full h-[48px] pl-11 pr-14 rounded-full border-2 border-[#4A90E2] bg-white font-['Poppins',sans-serif] text-[15px] text-[#2c353f] placeholder:text-[#ACACAC] focus:outline-none focus:border-[#FE8A0F] transition-all duration-200"
              />
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full hover:bg-[#FFF5EB] transition-colors z-10"
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
                    setShowSearchSuggestions(false);
                  }
                }}
              >
                <Search className="w-5 h-5 text-[#4A90E2]" />
              </button>

              {/* Search Suggestions for Mobile */}
              {showSearchSuggestions && searchQuery && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] z-[9999] overflow-hidden border border-[#E5E5E5] max-h-[300px] overflow-y-auto">
                  {getSearchSuggestions().length > 0 ? (
                    <div className="py-2">
                      {getSearchSuggestions().map((suggestion, index) => (
                        <Link
                          key={index}
                          to={suggestion.serviceCategorySlug
                            ? `/sector/${suggestion.sectorSlug}/${suggestion.serviceCategorySlug}`
                            : `/sector/${suggestion.sectorSlug}?category=${getCategoryId(suggestion.sectorName, suggestion.name, sortedSectors)}`}
                          onClick={() => {
                            setShowSearchSuggestions(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                        >
                          <Search className="w-4 h-4 text-[#8d8d8d]" />
                          <div className="flex-1">
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              {suggestion.name}
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                              in {suggestion.sectorName}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-center">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                        No services found
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Desktop Main navigation - New Layout */}
      <div className="hidden md:flex absolute left-4 lg:left-8 right-4 lg:right-8 top-[20px] items-center z-10 bg-white">
        {/* Logo - Left Aligned */}
        <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
          <img 
            src={logoImage} 
            alt="Professional Services Platform" 
            className="h-[40px] lg:h-[48px] w-auto"
          />
        </Link>
        
        {/* Search Bar - Centered (Hidden on Home Page and Services Page) */}
        {!isHomePage && !isServicesPage && (
          <div className="flex-grow flex justify-center items-center mx-4 lg:mx-8" ref={searchRef}>
            <div className="relative group">
              <div className="relative flex justify-center">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8d8d8d] transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within:text-[#FE8A0F] group-focus-within:w-5 group-focus-within:h-5 group-focus-within:left-4 z-10" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleSearchEnter}
                  onFocus={(e) => {
                    e.target.placeholder = "Search for services...";
                    searchQuery.length > 0 && setShowSearchSuggestions(true);
                  }}
                  onBlur={(e) => {
                    if (!searchQuery) {
                      e.target.placeholder = "Search...";
                    }
                  }}
                  className="w-[160px] h-[38px] pl-10 pr-4 rounded-full border-2 border-[#E5E5E5] bg-white font-['Poppins',sans-serif] text-[14px] text-[#2c353f] placeholder:text-[#8d8d8d] focus:outline-none focus:border-[#FE8A0F] focus:shadow-[0_0_0_4px_rgba(254,138,15,0.12)] focus:w-[500px] focus:h-[46px] focus:pl-14 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-[width,height]"
                  style={{ margin: '0 auto' }}
                />
              </div>

            {/* Search Suggestions Dropdown */}
            {showSearchSuggestions && searchQuery && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] z-[9999] overflow-hidden border border-[#E5E5E5]">
                {getSearchSuggestions().length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] uppercase tracking-wider">
                        Popular Services
                      </p>
                    </div>
                    {getSearchSuggestions().map((suggestion, index) => (
                      <Link
                        key={index}
                        to={`/sector/${suggestion.sectorSlug}?category=${getCategoryId(suggestion.sectorName, suggestion.name, sortedSectors)}`}
                        onClick={() => {
                          setShowSearchSuggestions(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5EB] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F5] group-hover:bg-[#FE8A0F]/10 transition-colors">
                          <Search className="w-4 h-4 text-[#8d8d8d] group-hover:text-[#FE8A0F] transition-colors" />
                        </div>
                        <div className="flex-1">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors">
                            {suggestion.name}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                            in {suggestion.sectorName}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                      No services found for "{searchQuery}"
                    </p>
                    <Link
                      to="/services"
                      className="inline-block mt-3 font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F] hover:text-[#FFB347] transition-colors"
                      onClick={() => {
                        setShowSearchSuggestions(false);
                        setSearchQuery("");
                      }}
                    >
                      Browse all services →
                    </Link>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {/* Spacer when search is hidden on home page */}
        {isHomePage && <div className="flex-grow"></div>}
        
        {/* Spacer when search is hidden on services page */}
        {isServicesPage && <div className="flex-grow"></div>}

        {/* Navigation Items - Right Aligned with Equal Spacing */}
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 flex-shrink-0">
          <GetQuote />

          <Link
            to="/services"
            className="font-['Poppins:Regular',sans-serif] text-[15px] text-[#5b5b5b] hover:text-[#FE8A0F] cursor-pointer transition-colors whitespace-nowrap"
          >
            Services
          </Link>

          <Link
            to="/how-it-work-pro"
            className="font-['Poppins:Regular',sans-serif] text-[15px] text-[#5b5b5b] hover:text-[#FE8A0F] cursor-pointer transition-colors whitespace-nowrap"
          >
            Become a Seller
          </Link>

          {/* Notification Icon with Badge and Dropdown */}
          <div 
            ref={notificationRef}
            className="relative"
            onMouseEnter={handleNotificationMouseEnter}
            onMouseLeave={handleNotificationMouseLeave}
          >
            <button className="relative hover:opacity-80 transition-opacity cursor-pointer group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F5] group-hover:bg-[#FFF5EB] transition-colors">
                <Bell className="w-5 h-5 text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors" />
                {notificationsData.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FE8A0F] text-white text-[10px] font-['Poppins',sans-serif] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {notificationsData.filter(n => !n.read).length}
                  </span>
                )}
              </div>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-[380px] bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.15)] z-[9999999] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-[#003D82] to-[#0052AC] flex items-center justify-between">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-white text-[16px]">
                    Notifications
                  </h3>
                  {notificationsData.filter(n => !n.read).length > 0 && (
                    <span className="bg-[#FE8A0F] text-white text-[11px] font-['Poppins',sans-serif] font-semibold px-2.5 py-1 rounded-full">
                      {notificationsData.filter(n => !n.read).length} New
                    </span>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notificationsData.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-[#FFF5EB] transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'booking' ? 'bg-blue-100' :
                          notification.type === 'payment' ? 'bg-green-100' :
                          notification.type === 'review' ? 'bg-orange-100' :
                          notification.type === 'service' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {notification.type === 'booking' && (
                            <svg className="w-5 h-5 text-[#003D82]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {notification.type === 'payment' && (
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {notification.type === 'review' && (
                            <svg className="w-5 h-5 text-[#FE8A0F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                          {notification.type === 'service' && (
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {notification.type === 'promotion' && (
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#2c353f]">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#FE8A0F] rounded-full flex-shrink-0 mt-1.5"></div>
                            )}
                          </div>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#5b5b5b] mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <button className="w-full text-center font-['Poppins',sans-serif] font-medium text-[14px] text-[#003D82] hover:text-[#FE8A0F] transition-colors">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shopping Cart with Details */}
          <Link
            to="/cart"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F5] group-hover:bg-[#FFF5EB] transition-colors">
              <ShoppingCart className="w-5 h-5 text-[#5b5b5b] group-hover:text-[#FE8A0F] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FE8A0F] text-white text-[10px] font-['Poppins',sans-serif] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] leading-tight">
                My Cart
              </span>
              <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors leading-tight">
                £{cartTotal.toFixed(1)}
              </span>
            </div>
          </Link>

          {/* My Account - Far Right */}
          <LoginButton />
        </div>
      </div>
      {/* Removed the grey divider line between header and category bar */}

      {/* Category navigation items with scroll - Hidden on Services page */}
      {!isServicesPage && (
      <>
        {/* Desktop Category Bar - Absolute Positioning */}
        <div className="hidden md:flex absolute left-0 top-[82px] right-0 items-center justify-center z-[1] bg-white">
          {/* Left scroll button */}
          <button
            onClick={scrollLeft}
            className="absolute left-4 lg:left-8 z-[2] cursor-pointer hover:opacity-70 transition-opacity translate-y-[3px] p-2"
            aria-label="Scroll left"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="#2c353f" 
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable container - centered with padding for arrows */}
          <div
            ref={scrollContainerRef}
            className="flex items-center justify-start gap-[47px] overflow-x-auto scrollbar-hide scroll-smooth translate-y-[3px] pl-[80px] pr-[80px] mx-auto w-full max-w-[1400px]"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {categories.map((category, index) => {
              const hasDropdown = categoryDropdownData[category];
              return (
                <div 
                  key={index} 
                  className="flex-shrink-0"
                  ref={(el) => {
                    categoryRefs.current[category] = el;
                  }}
                >
                  <Link
                    to={`/sector/${sectorNameToSlug[category] || sectorToSlug(category)}`}
                    className="font-['Poppins:Regular',sans-serif] text-[15px] text-[#8d8d8d] hover:text-[#FE8A0F] cursor-pointer transition-colors whitespace-nowrap"
                    onMouseEnter={() => hasDropdown && handleCategoryHover(category)}
                  >
                    {category}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Dropdown Menu - Outside scroll container */}
          {activeDropdown && categoryDropdownData[activeDropdown] && (
            <div
              ref={dropdownRef}
              className="absolute top-[calc(100%+18px)] z-[9999]"
              style={{
                left: `${dropdownPosition.left}px`,
                transform: 'translateX(-50%)',
              }}
              onMouseEnter={() => setActiveDropdown(activeDropdown)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="bg-white rounded-[8px] shadow-[0px_4px_20px_rgba(0,0,0,0.12)] py-4 px-5 min-w-[600px] max-w-[800px] xl:max-w-[900px] w-auto">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-6">
                  {categoryDropdownData[activeDropdown].map((column, colIdx) => (
                    <div key={colIdx} className="min-w-0">
                      <Link
                        to={column.serviceCategorySlug && sectorNameToSlug[activeDropdown]
                          ? `/sector/${sectorNameToSlug[activeDropdown]}/${column.serviceCategorySlug}`
                          : `/category/${getCategoryId(activeDropdown, column.title, sortedSectors)}`}
                        className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors mb-2.5 block cursor-pointer"
                      >
                        {column.title}
                      </Link>
                      <ul className="space-y-2">
                        {column.items.map((item, idx) => {
                          // Find the subcategory slug if available
                          const sector = sortedSectors.find((s: Sector) => s.name === activeDropdown);
                          const serviceCategory = sector && serviceCategoriesBySector[sector._id]?.find(
                            (sc: ServiceCategory) => sc.name === column.title
                          );
                          const subCategory = serviceCategory?.subCategories?.find(
                            (subCat: ServiceSubCategory) => subCat.name === item && subCat.level === 2 && !subCat.parentSubCategory
                          );
                          const subCategorySlug = subCategory?.slug || (column.subCategorySlugs && column.subCategorySlugs[idx]);
                          
                          // Build URL: /sector/{sectorSlug}/{serviceCategorySlug}/{subCategorySlug}
                          const linkTo = column.serviceCategorySlug && sectorNameToSlug[activeDropdown] && subCategorySlug
                            ? `/sector/${sectorNameToSlug[activeDropdown]}/${column.serviceCategorySlug}/${subCategorySlug}`
                            : column.serviceCategorySlug && sectorNameToSlug[activeDropdown]
                            ? `/sector/${sectorNameToSlug[activeDropdown]}/${column.serviceCategorySlug}`
                            : `/services?category=${encodeURIComponent(activeDropdown)}&subcategory=${encodeURIComponent(column.title)}&detailedSubcategory=${encodeURIComponent(item)}`;
                          
                          return (
                            <li key={idx}>
                              <Link
                                to={linkTo}
                                className="font-['Poppins',sans-serif] font-light text-[13px] text-[#5b5b5b] hover:text-[#FE8A0F] transition-colors block"
                              >
                                {item}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right scroll button */}
          <button
            onClick={scrollRight}
            className="absolute right-4 lg:right-8 z-[2] cursor-pointer hover:opacity-70 transition-opacity translate-y-[3px] p-2"
            aria-label="Scroll right"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="#2c353f" 
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </>
      )}

      {/* Mobile Dropdown Menu for All Categories */}
      {mobileDropdownOpen && expandedCategory && categoryDropdownData[expandedCategory] && (
        <div 
          className={`md:hidden absolute left-0 right-0 bg-white shadow-lg z-30 border-t border-[#CACACA] max-h-[70vh] overflow-y-auto ${
            isServicesPage ? 'top-[73px]' : 'top-[115px]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryDropdownData[expandedCategory].map(
                (column, idx) => (
                  <div
                    key={idx}
                    className="border-b border-[#E5E5E5] last:border-b-0 pb-4 mb-4 last:mb-0 sm:border-b-0 sm:pb-0"
                  >
                    <Link
                      to={column.serviceCategorySlug && sectorNameToSlug[expandedCategory]
                        ? `/sector/${sectorNameToSlug[expandedCategory]}/${column.serviceCategorySlug}`
                        : `/category/${getCategoryId(expandedCategory, column.title, sortedSectors)}`}
                      className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#2c353f] hover:text-[#FE8A0F] active:text-[#FE8A0F] transition-colors mb-3 block cursor-pointer"
                      onClick={() => {
                        setMobileDropdownOpen(false);
                        setExpandedCategory(null);
                      }}
                    >
                      {column.title}
                    </Link>
                    <ul className="space-y-2.5 pl-2">
                      {column.items.map((item, itemIdx) => {
                        // Find the subcategory slug if available
                        const sector = sortedSectors.find((s: Sector) => s.name === expandedCategory);
                        const serviceCategory = sector && serviceCategoriesBySector[sector._id]?.find(
                          (sc: ServiceCategory) => sc.name === column.title
                        );
                        const subCategory = serviceCategory?.subCategories?.find(
                          (subCat: ServiceSubCategory) => subCat.name === item && subCat.level === 2 && !subCat.parentSubCategory
                        );
                        const subCategorySlug = subCategory?.slug || (column.subCategorySlugs && column.subCategorySlugs[itemIdx]);
                        
                        // Build URL: /sector/{sectorSlug}/{serviceCategorySlug}/{subCategorySlug}
                        const linkTo = column.serviceCategorySlug && sectorNameToSlug[expandedCategory] && subCategorySlug
                          ? `/sector/${sectorNameToSlug[expandedCategory]}/${column.serviceCategorySlug}/${subCategorySlug}`
                          : column.serviceCategorySlug && sectorNameToSlug[expandedCategory]
                          ? `/sector/${sectorNameToSlug[expandedCategory]}/${column.serviceCategorySlug}`
                          : `/services?category=${encodeURIComponent(expandedCategory)}&subcategory=${encodeURIComponent(column.title)}&detailedSubcategory=${encodeURIComponent(item)}`;
                        
                        return (
                          <li key={itemIdx}>
                            <Link
                              to={linkTo}
                              className="font-['Poppins',sans-serif] font-light text-[14px] text-[#5b5b5b] hover:text-[#FE8A0F] active:text-[#FE8A0F] transition-colors block"
                              onClick={() => {
                                setMobileDropdownOpen(false);
                                setExpandedCategory(null);
                              }}
                            >
                              {item}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[100px] left-0 right-[15%] bottom-0 bg-white shadow-lg z-[45] overflow-y-auto">
          <div className="flex flex-col p-6 gap-3">
            {/* Login/Account Button - Moved to top */}
            <MobileLoginButton />

            {/* Action Buttons Row - Clean Design */}
            <div className="grid grid-cols-3 gap-2">
              {/* Get Quote Button - Hide for professionals */}
              {(!isLoggedIn || userRole === "client") && (
                <Link to="/post-job" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-br from-[#FE8A0F] to-[#FF6B00] hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[10px] text-white text-center leading-tight">Get Quote</span>
                  </div>
                </Link>
              )}

              {/* Notification */}
              <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#FFF5EB] transition-all cursor-pointer relative">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white">
                  <Bell className="w-4 h-4 text-[#5b5b5b]" />
                  {notificationsData.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FE8A0F] text-white text-[9px] font-['Poppins',sans-serif] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {notificationsData.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <span className="font-['Poppins',sans-serif] text-[10px] text-[#5b5b5b] text-center leading-tight">Alerts</span>
              </button>

              {/* Shopping Cart */}
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#FFF5EB] transition-all cursor-pointer relative"
              >
                <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white">
                  <ShoppingCart className="w-4 h-4 text-[#5b5b5b]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FE8A0F] text-white text-[9px] font-['Poppins',sans-serif] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="font-['Poppins',sans-serif] text-[10px] text-[#5b5b5b] text-center leading-tight">Cart</span>
              </Link>
            </div>
            
            {/* Welcome Back Card - Only for professionals on account page */}
            {isLoggedIn && userRole === "professional" && location.pathname === '/account' && (
              <div className="pt-1 border-t border-[#E5E5E5]">
                <div className="bg-gradient-to-r from-[#EFF6FF] to-[#FFF5EB] border border-[#3B82F6]/30 rounded-xl p-4">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1.5">
                    Welcome Back! 👋
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    Your profile is active and visible to potential clients. Keep up the great work and maintain your high ratings!
                  </p>
                </div>
              </div>
            )}
            
            {/* Menu Links */}
            <div>
              {/* Services - Hide for professionals after login */}
              {(!isLoggedIn || userRole === "client") && (
                <Link
                  to="/services"
                  className="block font-['Poppins',sans-serif] text-[16px] text-[#2c353f] hover:text-[#FE8A0F] cursor-pointer transition-colors py-3 border-b border-[#E5E5E5]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
              )}
              
              {/* Become a Seller - Only show when NOT logged in */}
              {!isLoggedIn && (
                <Link
                  to="/how-it-work-pro"
                  className="block font-['Poppins',sans-serif] text-[16px] text-[#2c353f] hover:text-[#FE8A0F] cursor-pointer transition-colors py-3 border-b border-[#E5E5E5]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Seller
                </Link>
              )}
              
              {/* Browse Categories - Hide for professionals after login */}
              {(!isLoggedIn || userRole === "client") && (
                <div className="flex items-center justify-between py-3 border-b border-[#E5E5E5]">
                  <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                    Browse Categories
                  </span>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#FFF5EB] transition-colors"
                    onClick={() => setBrowseCategoriesOpen(!browseCategoriesOpen)}
                  >
                    <svg
                      className={`w-5 h-5 text-[#8d8d8d] transition-transform duration-200 ${browseCategoriesOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Category Accordion - Shows when Browse Categories is expanded - Hide for professionals */}
            {browseCategoriesOpen && (!isLoggedIn || userRole === "client") && (
              <div className="px-6 pb-4">
                <div className="space-y-2 mt-3">
                  {categories.map((category, index) => {
                    const hasDropdown = categoryDropdownData[category];
                    const isExpanded = expandedCategory === category;
                    
                    return (
                      <div key={index} className="border border-[#E5E5E5] rounded-lg overflow-hidden">
                        {/* Category Header */}
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F5] hover:bg-[#FFF5EB] transition-colors"
                          onClick={() => {
                            if (hasDropdown) {
                              setExpandedCategory(isExpanded ? null : category);
                            } else {
                              navigate(`/sector/${sectorNameToSlug[category] || sectorToSlug(category)}`);
                              setMobileMenuOpen(false);
                              setBrowseCategoriesOpen(false);
                            }
                          }}
                        >
                          <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium">
                            {category}
                          </span>
                          {hasDropdown && (
                            <svg
                              className={`w-5 h-5 text-[#8d8d8d] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>

                        {/* Category Dropdown Content */}
                        {hasDropdown && isExpanded && (
                          <div className="bg-white p-4">
                            <div className="grid grid-cols-1 gap-4">
                              {categoryDropdownData[category].map((column, colIdx) => (
                                <div key={colIdx} className="border-b border-[#E5E5E5] last:border-b-0 pb-3 last:pb-0">
                                  <Link
                                    to={`/category/${getCategoryId(category, column.title, sortedSectors)}`}
                                    className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#2c353f] hover:text-[#FE8A0F] active:text-[#FE8A0F] transition-colors mb-2 block cursor-pointer"
                                    onClick={() => {
                                      setMobileMenuOpen(false);
                                      setExpandedCategory(null);
                                      setBrowseCategoriesOpen(false);
                                    }}
                                  >
                                    {column.title}
                                  </Link>
                                  <ul className="space-y-2 pl-2">
                                    {column.items.map((item, itemIdx) => (
                                      <li key={itemIdx}>
                                        <Link
                                          to={`/services?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(column.title)}&detailedSubcategory=${encodeURIComponent(item)}`}
                                          className="font-['Poppins',sans-serif] font-light text-[13px] text-[#5b5b5b] hover:text-[#FE8A0F] active:text-[#FE8A0F] transition-colors block"
                                          onClick={() => {
                                            setMobileMenuOpen(false);
                                            setExpandedCategory(null);
                                            setBrowseCategoriesOpen(false);
                                          }}
                                        >
                                          {item}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account Menu Items - Only show when logged in and on account page */}
            {isLoggedIn && userInfo && location.pathname === '/account' && (
              <div className="pt-4 border-t border-[#E5E5E5]">
                {/* Client Menu Items */}
                {userRole === "client" && (
                  <div className="space-y-1">
                    <Link
                      to="/account?tab=overview"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Overview</span>
                    </Link>
                    <Link
                      to="/account?tab=favourites"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Favourites</span>
                    </Link>
                    <Link
                      to="/account?tab=orders"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingBag className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Orders</span>
                    </Link>
                    <Link
                      to="/account?tab=my-jobs"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">My Jobs</span>
                    </Link>
                    <Link
                      to="/account?tab=details"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">My Details</span>
                    </Link>
                    <Link
                      to="/account?tab=billing"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CreditCard className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Billing</span>
                    </Link>
                    <Link
                      to="/account?tab=security"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Lock className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Security</span>
                    </Link>
                    <Link
                      to="/account?tab=messenger"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="w-5 h-5 text-[#5b5b5b]" />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Messenger</span>
                        <span className="bg-[#FE8A0F] text-white text-[11px] font-['Poppins',sans-serif] font-semibold px-2 py-0.5 rounded-full">3</span>
                      </div>
                    </Link>
                    <Link
                      to="/account?tab=support"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <HelpCircle className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Support Center</span>
                    </Link>
                    <Link
                      to="/account?tab=invite"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Gift className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Invite & Earn</span>
                    </Link>
                  </div>
                )}

                {/* Professional Menu Items */}
                {userRole === "professional" && (
                  <div className="space-y-1">
                    <Link
                      to="/account?tab=overview"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Overview</span>
                    </Link>
                    <Link
                      to="/account?tab=profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Profile</span>
                    </Link>
                    <Link
                      to="/account?tab=services"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Briefcase className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Services</span>
                    </Link>
                    <Link
                      to="/account?tab=orders"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingBag className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Orders</span>
                    </Link>
                    <Link
                      to="/account?tab=my-jobs"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">My Jobs</span>
                    </Link>
                    <Link
                      to="/account?tab=promo-code"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Ticket className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Promo Code</span>
                    </Link>
                    <Link
                      to="/account?tab=verification"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Verification</span>
                    </Link>
                    <Link
                      to="/account?tab=details"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">My Details</span>
                    </Link>
                    <Link
                      to="/account?tab=withdraw"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Wallet className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Withdraw</span>
                    </Link>
                    <Link
                      to="/account?tab=security"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Lock className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Security</span>
                    </Link>
                    <Link
                      to="/account?tab=messenger"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="w-5 h-5 text-[#5b5b5b]" />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Messenger</span>
                        <span className="bg-[#FE8A0F] text-white text-[11px] font-['Poppins',sans-serif] font-semibold px-2 py-0.5 rounded-full">3</span>
                      </div>
                    </Link>
                    <Link
                      to="/account?tab=support"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <HelpCircle className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Support Center</span>
                    </Link>
                    <Link
                      to="/account?tab=invite"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Gift className="w-5 h-5 text-[#5b5b5b]" />
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">Invite & Earn</span>
                    </Link>
                  </div>
                )}

                {/* Logout Button */}
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span className="font-['Poppins',sans-serif] text-[15px] text-red-500 font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile App Alert Modal - Only show on mobile screens */}
      {isMobileScreen && (
        <AlertDialog open={showAppModal} onOpenChange={setShowAppModal}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                Continue in Tradespeoplehub App?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-gray-600 text-[14px]">
                Open this page in the Tradespeoplehub mobile app for the best experience.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 justify-center">
              <AlertDialogCancel 
                onClick={handleAppModalCancel}
                className="font-['Poppins',sans-serif] text-[15px] flex-1"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAppModalOk}
                className="font-['Poppins',sans-serif] text-[15px] bg-[#FE8A0F] hover:bg-[#E67A00] flex-1"
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}