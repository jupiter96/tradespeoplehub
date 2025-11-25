import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Star, Clock, MapPin, ShoppingCart, Check, ChevronRight, Heart, Share2, MessageCircle, Award, Shield, RefreshCw, User, TrendingUp, ArrowLeft, Minus, Plus, Home, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, CheckSquare, Square, Menu } from "lucide-react@0.487.0";
import { toast } from "sonner@2.0.3";
import BookingModal from "./BookingModal";
import AddToCartModal from "./AddToCartModal";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "./ui/sheet";

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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { useCart } from "./CartContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { allServices } from "./servicesData";

interface Review {
  id: number;
  userName: string;
  userAvatar: string;
  userLocation?: string;
  rating: number;
  date: string;
  comment: string;
  priceRange?: string;
  duration?: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
  professionalResponse?: {
    text: string;
    providerName: string;
    providerImage: string;
  };
}

// 리뷰 mock 데이터 생성 함수
const generateReviews = (serviceId: number, reviewCount: number, providerName: string, providerImage: string): Review[] => {
  const userNames = [
    "David James", "Sarah Johnson", "Michael Chen", "Emma Williams", "David Anderson", 
    "Lisa Thompson", "James Brown", "Sophie Taylor", "Robert Wilson"
  ];
  
  const userAvatars = [
    "https://images.unsplash.com/photo-1607286908165-b8b6a2874fc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2NTY1Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1618591552964-837a5a315fb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwcHJvZmVzc2lvbmFsJTIwd29ya2VyfGVufDF8fHx8MTc2MjY1NjUzN3ww&ixlib=rb-4.1.0&q=80&w=1080"
  ];
  
  const userLocations = ["Southwark", "Chelsea", "Westminster", "Camden", "Islington", "Kensington"];
  
  const comments = [
    "Was a great experience working with David.",
    "Absolutely amazing experience! Very professional and skilled. Highly recommend!",
    "Best service I've ever had! Worth every penny. Will definitely be back!",
    "Great service and very professional. Only minor delay but overall very satisfied!",
    "Outstanding work! Exceeded my expectations. Very thorough and detail-oriented.",
    "Excellent service! Professional, punctual, and the results were fantastic!",
    "Very pleased with the outcome. Great attention to detail and customer service."
  ];

  const responses = [
    "Was great experience working with David. Gave clear instruction.",
    "Thank you so much for your kind words! It was a pleasure working with you.",
    "We're thrilled you had a great experience! Looking forward to serving you again.",
    "Thank you for the feedback! We always strive for excellence."
  ];
  
  const dates = ["12 months ago", "1 week ago", "2 weeks ago", "3 weeks ago", "1 month ago", "2 months ago"];
  const priceRanges = ["£20.00 - £40.00", "£30.00 - £50.00", "£50.00 - £80.00"];
  const durations = ["Standard", "Express", "Premium"];
  
  const numReviews = Math.min(3, reviewCount); // 최대 3개 리뷰 표시
  const reviews: Review[] = [];
  
  for (let i = 0; i < numReviews; i++) {
    const hasResponse = i === 0 || Math.random() > 0.5; // First review always has response
    reviews.push({
      id: i + 1,
      userName: userNames[i % userNames.length],
      userAvatar: userAvatars[i % userAvatars.length],
      userLocation: userLocations[i % userLocations.length],
      rating: i === 0 ? 5 : (4 + Math.round(Math.random())),
      date: dates[i % dates.length],
      comment: comments[i % comments.length],
      priceRange: priceRanges[i % priceRanges.length],
      duration: durations[i % durations.length],
      helpfulVotes: i === 0 ? 23 : Math.floor(Math.random() * 20) + 5,
      notHelpfulVotes: Math.floor(Math.random() * 3),
      professionalResponse: hasResponse ? {
        text: responses[i % responses.length],
        providerName: providerName,
        providerImage: providerImage
      } : undefined
    });
  }
  
  return reviews;
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Add to Cart Modal
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  
  // 실제 서비스 데이터 찾기
  const service = allServices.find(s => s.id === Number(id));
  
  // Get user coordinates from URL state (passed from ServicesPage) or use default Chelsea, London
  useEffect(() => {
    const stateCoords = (location.state as any)?.userCoords;
    const defaultChelsea = { latitude: 51.4875, longitude: -0.1687 }; // Chelsea, London
    const coords = stateCoords || defaultChelsea;
    
    if (coords && service?.latitude && service?.longitude) {
      const distance = calculateDistance(
        coords.latitude,
        coords.longitude,
        service.latitude,
        service.longitude
      );
      setUserDistance(distance);
    }
  }, [location.state, service]);
  
  // Review response expansion and helpful vote state
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(new Set());
  const [userVotes, setUserVotes] = useState<Map<number, 'helpful' | 'not-helpful'>>(new Map());
  
  // Provider info expansion state
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  
  // Selected addons state
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());
  
  // Selected package state (for package-based services)
  const [selectedPackageId, setSelectedPackageId] = useState<number>(0);
  
  // Initialize vote counts from review data - will be set properly after service check
  const [reviewVoteCounts, setReviewVoteCounts] = useState<Map<number, { helpful: number; notHelpful: number }>>(new Map());
  
  // 서비스를 찾지 못한 경우
  if (!service) {
    return (
      <div className="w-full min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16 py-16 text-center">
          <h1 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
            Service Not Found
          </h1>
          <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b] mb-6">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Button 
            onClick={() => navigate('/services')}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // 리뷰 생성
  const reviews = generateReviews(service.id, service.reviewCount, service.providerName, service.providerImage);
  
  // Get current package (if applicable)
  const selectedPackage = service.packages?.find(pkg => pkg.id === selectedPackageId);
  
  // Initialize/update values based on service data
  useEffect(() => {
    // Set initial package ID
    if (service.packages && service.packages.length > 0) {
      setSelectedPackageId(service.packages[0].id);
    }
    
    // Initialize vote counts from review data
    const initialCounts = new Map();
    reviews.forEach(review => {
      initialCounts.set(review.id, {
        helpful: review.helpfulVotes,
        notHelpful: review.notHelpfulVotes
      });
    });
    setReviewVoteCounts(initialCounts);
  }, [service.id]);

  // Toggle professional response expansion
  const toggleResponseExpansion = (reviewId: number) => {
    setExpandedResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  // Handle helpful vote
  const handleVote = (reviewId: number, voteType: 'helpful' | 'not-helpful') => {
    const previousVote = userVotes.get(reviewId);
    
    setUserVotes(prev => {
      const newMap = new Map(prev);
      if (previousVote === voteType) {
        // If clicking the same vote, remove it
        newMap.delete(reviewId);
      } else {
        // Set or change vote
        newMap.set(reviewId, voteType);
      }
      return newMap;
    });

    // Update vote counts
    setReviewVoteCounts(prev => {
      const newCounts = new Map(prev);
      const currentCounts = newCounts.get(reviewId) || { helpful: 0, notHelpful: 0 };
      
      if (previousVote === voteType) {
        // Removing vote
        if (voteType === 'helpful') {
          currentCounts.helpful = Math.max(0, currentCounts.helpful - 1);
        } else {
          currentCounts.notHelpful = Math.max(0, currentCounts.notHelpful - 1);
        }
      } else if (previousVote) {
        // Changing vote
        if (previousVote === 'helpful') {
          currentCounts.helpful = Math.max(0, currentCounts.helpful - 1);
          currentCounts.notHelpful += 1;
        } else {
          currentCounts.notHelpful = Math.max(0, currentCounts.notHelpful - 1);
          currentCounts.helpful += 1;
        }
      } else {
        // Adding new vote
        if (voteType === 'helpful') {
          currentCounts.helpful += 1;
        } else {
          currentCounts.notHelpful += 1;
        }
      }
      
      newCounts.set(reviewId, currentCounts);
      return newCounts;
    });
  };
  
  // Toggle addon selection
  const toggleAddon = (addonId: number) => {
    setSelectedAddons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      return newSet;
    });
  };
  
  // Handle package selection change
  const handlePackageChange = (packageId: number) => {
    setSelectedPackageId(packageId);
    // Clear selected addons when switching packages
    setSelectedAddons(new Set());
  };
  
  // Calculate total addon price based on current package or service
  const calculateAddonsTotal = (): number => {
    if (selectedPackage && selectedPackage.addons) {
      return selectedPackage.addons
        .filter(addon => selectedAddons.has(addon.id))
        .reduce((sum, addon) => sum + addon.price, 0);
    }
    if (!service.addons) return 0;
    return service.addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
  };
  
  // 가격 정보 (패키지가 있으면 선택된 패키지 사용, 없으면 서비스 기본 가격 사용)
  const hasPackages = !!(service.packages && service.packages.length > 0);
  const basePrice = selectedPackage 
    ? parseFloat(selectedPackage.price) 
    : parseFloat(service.price);
  const originalPrice = selectedPackage && selectedPackage.originalPrice
    ? parseFloat(selectedPackage.originalPrice)
    : (service.originalPrice ? parseFloat(service.originalPrice) : null);
  const addonsTotal = calculateAddonsTotal();
  const totalPrice = (basePrice + addonsTotal) * quantity;

  const handleAddToCart = () => {
    // Open AddToCartModal instead of directly adding
    setShowAddToCartModal(true);
  };

  const handleOrderNow = () => {
    // Show booking modal first
    setShowBookingModal(true);
  };

  const handleBookingConfirm = (date: Date, time: string, timeSlot: string) => {
    // Get selected addons from package or service
    const addonsSource = selectedPackage?.addons || service.addons;
    const selectedAddonsData = addonsSource
      ?.filter(addon => selectedAddons.has(addon.id))
      .map(addon => ({
        id: addon.id,
        title: addon.title,
        price: addon.price
      })) || [];
    
    // Build title with package name if package selected
    const itemTitle = selectedPackage 
      ? `${service.description} (${selectedPackage.name} Package)`
      : service.description;
    
    // Add to cart with booking info
    addToCart({
      id: service.id.toString(),
      title: itemTitle,
      seller: service.providerName,
      price: basePrice,
      image: service.image,
      rating: service.rating,
      addons: selectedAddonsData.length > 0 ? selectedAddonsData : undefined,
      booking: {
        date: date.toISOString(),
        time: time,
        timeSlot: timeSlot
      }
    }, quantity);
    
    // Navigate to cart page
    navigate('/cart');
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-[#FE8A0F] text-[#FE8A0F]"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse();
  };

  const ratingDistribution = calculateRatingDistribution();

  // Generate highlights based on service category and subcategory
  const generateHighlights = (): string[] => {
    if (service.highlights) {
      return service.highlights;
    }

    const categoryHighlights: { [key: string]: string[] } = {
      // Home & Garden
      "Plumbing": [
        "24/7 emergency plumbing services",
        "Licensed and insured plumber",
        "All parts and materials included",
        "Price is based on hours or project"
      ],
      "Electrical Work": [
        "Certified electrician with 10+ years experience",
        "Safety inspection included",
        "All electrical work guaranteed",
        "Price is based on hours"
      ],
      "Painting & Decorating": [
        "Professional interior and exterior painting",
        "Premium quality paints used",
        "Surface preparation included",
        "Price is based on project size"
      ],
      "Gardening & Landscaping": [
        "Complete garden design and maintenance",
        "Eco-friendly gardening methods",
        "All tools and equipment provided",
        "Price is based on garden size"
      ],
      "Carpentry": [
        "Custom woodwork and furniture",
        "Precision craftsmanship guaranteed",
        "High-quality timber used",
        "Price is based on project complexity"
      ],
      "Cleaning Services": [
        "Deep cleaning for all spaces",
        "Eco-friendly cleaning products",
        "Professional cleaning team",
        "Price is based on hours or area"
      ],
      // Business Services
      "Graphic Design": [
        "Professional logo and brand design",
        "Unlimited revisions until satisfied",
        "Source files provided",
        "Price is based on project scope"
      ],
      "Web Development": [
        "Responsive and modern websites",
        "SEO optimization included",
        "Mobile-first design approach",
        "Price is based on project complexity"
      ],
      "Content Writing": [
        "SEO-optimized content creation",
        "Native English writers",
        "Unlimited revisions",
        "Price is based on word count"
      ],
      "Accounting & Bookkeeping": [
        "Certified accountant services",
        "Tax preparation included",
        "Confidential and secure",
        "Price is based on hours"
      ],
      // Personal Services
      "Personal Training": [
        "Customized fitness programs",
        "Nutrition guidance included",
        "Certified personal trainer",
        "Price is based on sessions"
      ],
      "Massage Therapy": [
        "Licensed massage therapist",
        "Various massage techniques offered",
        "Relaxing and therapeutic",
        "Price is based on session length"
      ],
      "Life Coaching": [
        "Goal setting and achievement",
        "Personalized coaching sessions",
        "Certified life coach",
        "Price is based on sessions"
      ],
      // Event Services
      "Event Photography": [
        "Professional event coverage",
        "High-resolution photos delivered",
        "Editing and retouching included",
        "Price is based on hours"
      ],
      "Catering Services": [
        "Custom menu creation",
        "Fresh ingredients guaranteed",
        "Professional catering staff",
        "Price is based on guest count"
      ],
      "DJ Services": [
        "Professional DJ equipment",
        "Extensive music library",
        "MC services included",
        "Price is based on event duration"
      ],
      // Technology Services
      "Computer Repair": [
        "Quick diagnosis and repair",
        "Data recovery available",
        "90-day warranty on repairs",
        "Price is based on issue complexity"
      ],
      "Mobile App Development": [
        "iOS and Android development",
        "User-friendly interface design",
        "App Store submission assistance",
        "Price is based on features"
      ],
      // Education & Tutoring
      "Math Tutoring": [
        "Experienced math tutor",
        "Personalized learning approach",
        "Progress tracking included",
        "Price is based on hours"
      ],
      "Language Lessons": [
        "Native or fluent speaker",
        "Conversational practice focus",
        "Cultural insights included",
        "Price is based on lessons"
      ],
      // Repair & Maintenance
      "Appliance Repair": [
        "All major appliances serviced",
        "Genuine parts guarantee",
        "Same-day service available",
        "Price is based on repair type"
      ],
      "HVAC Services": [
        "Licensed HVAC technician",
        "Energy-efficient solutions",
        "Maintenance plans available",
        "Price is based on service type"
      ],
      // Pet Services
      "Dog Walking": [
        "Experienced and reliable walker",
        "GPS tracking updates",
        "Flexible scheduling",
        "Price is based on walk duration"
      ],
      "Pet Grooming": [
        "Professional grooming equipment",
        "Gentle handling techniques",
        "All breeds welcome",
        "Price is based on pet size"
      ],
      // Automotive
      "Car Detailing": [
        "Interior and exterior detailing",
        "Premium cleaning products",
        "Mobile service available",
        "Price is based on vehicle size"
      ],
      "Auto Repair": [
        "Certified mechanics",
        "Diagnostic testing included",
        "Warranty on all repairs",
        "Price is based on repair type"
      ],
      // Moving & Storage
      "Moving Services": [
        "Professional movers",
        "Packing materials provided",
        "Insurance coverage available",
        "Price is based on distance and volume"
      ],
      "Storage Solutions": [
        "Secure storage facilities",
        "Climate-controlled options",
        "Flexible rental periods",
        "Price is based on space size"
      ],
      // Legal & Financial
      "Legal Consultation": [
        "Licensed solicitor",
        "Confidential consultation",
        "Clear legal advice",
        "Price is based on hours"
      ]
    };

    const subcategoryKey = service.subcategory || "";
    const categoryKey = service.category || "";
    
    // Try subcategory first, then category, then default
    if (categoryHighlights[subcategoryKey]) {
      return categoryHighlights[subcategoryKey];
    } else if (categoryHighlights[categoryKey]) {
      return categoryHighlights[categoryKey];
    } else {
      // Default highlights
      return [
        "Professional service guaranteed",
        "Experienced and verified provider",
        "Quality materials and equipment",
        "Price is based on service requirements"
      ];
    }
  };

  // Use package highlights if a package is selected, otherwise use generated highlights
  const highlights = selectedPackage && selectedPackage.highlights 
    ? selectedPackage.highlights 
    : generateHighlights();

  // 서비스에 대한 상세 설명 생성
  const aboutService = `Discover exceptional ${service.category.toLowerCase()} with ${service.providerName}. With a proven track record of ${service.completedTasks} completed tasks and a ${service.rating} star rating, you can trust in the quality and professionalism of this service. ${service.description} Our commitment to excellence ensures that every client receives personalized attention and outstanding results.`;

  const whatsIncluded = [
    "Professional and experienced service provider",
    "High-quality materials and equipment",
    "Personalized consultation",
    "Satisfaction guarantee",
    service.deliveryType === "same-day" ? "Same-day service available" : "Flexible scheduling",
    "Follow-up support"
  ];

  // Portfolio images based on service category/subcategory
  const getPortfolioImages = () => {
    const categoryKey = service.subcategory || service.category;
    
    // Define portfolio images for different service types
    const portfolioMap: { [key: string]: string[] } = {
      // Home & Garden
      "Plumbing": [
        "https://images.unsplash.com/photo-1650246363606-a2402ec42b08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHdvcmslMjBwaXBlc3xlbnwxfHx8fDE3NjI4NzU5NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1587527901949-ab0341697c1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjI4NzU5NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1714860534425-7ce04e013dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwbW9kZXJuJTIwZGVzaWdufGVufDF8fHx8MTc2Mjg3NTk1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1587527901949-ab0341697c1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjI4NzU5NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1650246363606-a2402ec42b08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHdvcmslMjBwaXBlc3xlbnwxfHx8fDE3NjI4NzU5NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      "Painting & Decorating": [
        "https://images.unsplash.com/photo-1621870536986-151d03e2e99a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhaW50aW5nJTIwd2FsbHxlbnwxfHx8fDE3NjI4NzU5NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1587527901949-ab0341697c1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjI4NzU5NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1714860534425-7ce04e013dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwbW9kZXJuJTIwZGVzaWdufGVufDF8fHx8MTc2Mjg3NTk1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1621870536986-151d03e2e99a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhaW50aW5nJTIwd2FsbHxlbnwxfHx8fDE3NjI4NzU5NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1587527901949-ab0341697c1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjI4NzU5NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      "Gardening & Landscaping": [
        "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODc1OTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODc1OTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODc1OTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODc1OTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODc1OTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      "Carpentry": [
        "https://images.unsplash.com/photo-1641893979088-87d4d9604c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kJTIwZnVybml0dXJlfGVufDF8fHx8MTc2Mjg3NTk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1641893979088-87d4d9604c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kJTIwZnVybml0dXJlfGVufDF8fHx8MTc2Mjg3NTk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1641893979088-87d4d9604c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kJTIwZnVybml0dXJlfGVufDF8fHx8MTc2Mjg3NTk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1641893979088-87d4d9604c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kJTIwZnVybml0dXJlfGVufDF8fHx8MTc2Mjg3NTk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1641893979088-87d4d9604c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kJTIwZnVybml0dXJlfGVufDF8fHx8MTc2Mjg3NTk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      "Electrical Work": [
        "https://images.unsplash.com/photo-1655179696496-0becf8b5455a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd29yayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjI4MjczNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1655179696496-0becf8b5455a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd29yayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjI4MjczNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1655179696496-0becf8b5455a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd29yayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjI4MjczNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1655179696496-0becf8b5455a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd29yayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjI4MjczNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1655179696496-0becf8b5455a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd29yayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjI4MjczNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      // Personal Services
      "Massage Therapy": [
        "https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI4NDkwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI4NDkwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI4NDkwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI4NDkwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI4NDkwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      "Personal Training": [
        "https://images.unsplash.com/photo-1643142313816-0d9c86c49f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluaW5nJTIwZml0bmVzc3xlbnwxfHx8fDE3NjI4MDQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1643142313816-0d9c86c49f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluaW5nJTIwZml0bmVzc3xlbnwxfHx8fDE3NjI4MDQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1643142313816-0d9c86c49f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluaW5nJTIwZml0bmVzc3xlbnwxfHx8fDE3NjI4MDQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1643142313816-0d9c86c49f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluaW5nJTIwZml0bmVzc3xlbnwxfHx8fDE3NjI4MDQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1643142313816-0d9c86c49f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluaW5nJTIwZml0bmVzc3xlbnwxfHx8fDE3NjI4MDQ0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      // Business Services
      "Graphic Design": [
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2Mjc0OTgwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2Mjc0OTgwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2Mjc0OTgwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2Mjc0OTgwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2Mjc0OTgwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      "Web Development": [
        "https://images.unsplash.com/photo-1637937459053-c788742455be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvbXB1dGVyfGVufDF8fHx8MTc2Mjg1MjM5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1637937459053-c788742455be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvbXB1dGVyfGVufDF8fHx8MTc2Mjg1MjM5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1637937459053-c788742455be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvbXB1dGVyfGVufDF8fHx8MTc2Mjg1MjM5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1637937459053-c788742455be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvbXB1dGVyfGVufDF8fHx8MTc2Mjg1MjM5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1637937459053-c788742455be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvbXB1dGVyfGVufDF8fHx8MTc2Mjg1MjM5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      // Event Services
      "Event Photography": [
        "https://images.unsplash.com/photo-1662267837468-c5ac1a5870fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwd2VkZGluZ3xlbnwxfHx8fDE3NjI4NzU5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1662267837468-c5ac1a5870fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwd2VkZGluZ3xlbnwxfHx8fDE3NjI4NzU5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1662267837468-c5ac1a5870fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwd2VkZGluZ3xlbnwxfHx8fDE3NjI4NzU5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1662267837468-c5ac1a5870fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwd2VkZGluZ3xlbnwxfHx8fDE3NjI4NzU5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1662267837468-c5ac1a5870fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwd2VkZGluZ3xlbnwxfHx8fDE3NjI4NzU5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ],
      // Default fallback for all other categories
      "default": [
        "https://images.unsplash.com/photo-1587527901949-ab0341697c1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjI4NzU5NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1724556295135-ff92b9aa0a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODc1OTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1714860534425-7ce04e013dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwbW9kZXJuJTIwZGVzaWdufGVufDF8fHx8MTc2Mjg3NTk1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1621870536986-151d03e2e99a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhaW50aW5nJTIwd2FsbHxlbnwxfHx8fDE3NjI4NzU5NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1641893979088-87d4d9604c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kJTIwZnVybml0dXJlfGVufDF8fHx8MTc2Mjg3NTk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ]
    };
    
    return portfolioMap[categoryKey] || portfolioMap["default"];
  };

  const portfolioImages = getPortfolioImages();

  const faqs = [
    {
      question: "How do I book this service?",
      answer: "Simply click the 'Add to Cart' or 'Order Now' button to get started. You can review your selection in your cart and proceed to checkout when ready."
    },
    {
      question: "What is included in the price?",
      answer: `The price of £${service.price} per ${service.priceUnit} includes all the services listed in the 'What's Included' section. Any additional services or materials will be discussed and agreed upon before work begins.`
    },
    {
      question: "How far in advance should I book?",
      answer: service.deliveryType === "same-day" 
        ? "We offer same-day service! However, we recommend booking at least 24 hours in advance to ensure your preferred time slot is available."
        : "We recommend booking at least 2-3 days in advance to secure your preferred date and time."
    },
    {
      question: "What is your cancellation policy?",
      answer: "We require at least 24 hours notice for cancellations. Cancellations made within 24 hours may incur a fee. Please contact us as soon as possible if you need to reschedule."
    }
  ];

  // Provider level 결정
  const providerLevel = service.rating >= 4.8 ? "Top Rated Seller" : 
                        service.rating >= 4.5 ? "Verified Professional" : 
                        "Verified Seller";

  // Provider badge for mobile display
  const providerBadge = service.rating >= 4.8 ? "Top rated Seller" : 
                        service.rating >= 4.5 ? "Verified Professional" : 
                        null;

  return (
    <div className="w-full min-h-screen bg-[#f0f0f0]">
      {/* Header - Desktop Only */}
      <header className="hidden md:block sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Mobile Hero Section with Background Image */}
      <div className="md:hidden relative w-full h-[400px] bg-gray-900">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${service.image})`,
            backgroundPosition: 'center'
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Top Controls */}
        <div className="relative z-10 flex items-start justify-between p-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>

          {/* Like & Share Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#FE8A0F] text-[#FE8A0F]' : 'text-gray-900'}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all">
              <Share2 className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>

        {/* Image Count Indicator */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-white text-[13px] font-medium">1</span>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Breadcrumb - Desktop Only */}
      <div className="hidden md:block bg-transparent pt-[78px] mt-[50px] md:mt-0">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16 py-3.5">
          <Breadcrumb>
            <BreadcrumbList className="font-['Poppins',sans-serif] text-[13px]">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1.5 text-[#6b6b6b] hover:text-[#FE8A0F] transition-colors">
                    <Home className="w-3.5 h-3.5" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/services?category=${encodeURIComponent(service.category)}`} className="text-[#6b6b6b] hover:text-[#FE8A0F] transition-colors">
                    {service.category}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {service.subcategory && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/services?category=${encodeURIComponent(service.category)}&subcategory=${encodeURIComponent(service.subcategory)}`} className="text-[#6b6b6b] hover:text-[#FE8A0F] transition-colors">
                        {service.subcategory}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              {service.detailedSubcategory && service.subcategory && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/services?category=${encodeURIComponent(service.category)}&subcategory=${encodeURIComponent(service.subcategory)}&detailedSubcategory=${encodeURIComponent(service.detailedSubcategory)}`} className="text-[#6b6b6b] hover:text-[#FE8A0F] transition-colors">
                        {service.detailedSubcategory}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[#2c353f] max-w-[200px] sm:max-w-none truncate">
                      {service.description.length > 50 ? service.description.substring(0, 50) + "..." : service.description}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {!service.detailedSubcategory && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[#2c353f] max-w-[200px] sm:max-w-none truncate">
                      {service.description.length > 50 ? service.description.substring(0, 50) + "..." : service.description}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Mobile Provider Info - Directly Below Hero Image */}
      <div className="md:hidden bg-white px-4 py-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <Link 
            to={`/profile/${service.id}`}
            className="flex items-center gap-3 flex-1 cursor-pointer group"
          >
            <Avatar className="w-14 h-14 border-2 border-[#FE8A0F] flex-shrink-0 group-hover:border-[#FF9E2C] transition-colors">
              <AvatarImage src={service.providerImage} alt={service.tradingName} />
              <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                {service.tradingName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1 group-hover:text-[#FE8A0F] transition-colors">
                {service.tradingName}
              </h3>
              {providerBadge && (
                <Badge className="bg-[#2c353f] text-white font-['Poppins',sans-serif] text-[11px] px-2 py-0.5">
                  {providerBadge}
                </Badge>
              )}
            </div>
          </Link>
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        {/* Service Title */}
        <h1 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] leading-tight">
          {service.description}
        </h1>
      </div>

      {/* Separator for Mobile */}
      <div className="md:hidden h-2 bg-[#f0f0f0]" />

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Title & Actions - Desktop Only */}
            <div className="hidden md:block">
              <h1 className="font-['Poppins',sans-serif] text-[28px] md:text-[32px] text-[#2c353f] mb-3">
                {service.description}
              </h1>
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Only show rating and completed tasks if user has reviews */}
                {service.reviewCount > 0 ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      {renderStars(service.rating)}
                      <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                        {service.rating}
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        ({service.reviewCount} reviews)
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#10B981]" />
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        {service.completedTasks} tasks completed
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[12px]">
                      New Professional
                    </Badge>
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      No reviews yet
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`border-2 ${isFavorite ? 'border-[#FE8A0F] bg-[#FFF5EB]' : 'border-gray-300'}`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#FE8A0F] text-[#FE8A0F]' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm" className="border-2 border-gray-300">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Service Image - Desktop Only */}
            <div className="hidden md:block relative rounded-2xl overflow-hidden aspect-video bg-gray-100">
              <img
                src={service.image}
                alt={service.description}
                className="w-full h-full object-cover"
              />
              {service.badges && service.badges.length > 0 && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {service.badges.map((badge, idx) => (
                    <Badge key={idx} className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[12px] px-3 py-1.5">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Provider Info Card - Desktop Only */}
            <Card className="hidden md:block border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Always Visible - Avatar, Name, Location and Toggle */}
                  <div className="flex items-center justify-between gap-6">
                    <Link 
                      to={`/profile/${service.id}`}
                      className="flex items-center gap-3 flex-1 cursor-pointer group"
                    >
                      <Avatar className="w-16 h-16 border-2 border-[#FE8A0F] flex-shrink-0 group-hover:border-[#FF9E2C] transition-colors">
                        <AvatarImage src={service.providerImage} alt={service.tradingName} />
                        <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                          {service.tradingName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-6 flex-wrap">
                        <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] group-hover:text-[#FE8A0F] transition-colors">
                          {service.tradingName}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                              {service.location}
                            </span>
                            <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                              ({service.postcode.substring(0, 3)}***)
                            </span>
                            {userDistance !== null && (
                              <span className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F] font-medium">
                                • {userDistance.toFixed(1)} mi away
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    <button
                      onClick={() => setShowProviderDetails(!showProviderDetails)}
                      className="inline-flex items-center gap-1 font-['Poppins',sans-serif] text-[13px] text-[#3D78CB] hover:text-[#2E5FA3] transition-colors flex-shrink-0"
                    >
                      {showProviderDetails ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show More
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expandable Details - Badge, Buttons, Specialization */}
                  {showProviderDetails && (
                    <div className="pt-4 border-t border-gray-200 space-y-4">
                      <div className="flex items-start justify-between gap-6">
                        {/* Left Side - Badge and Specialization */}
                        <div className="flex-1 space-y-3">
                          <Badge className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px] w-fit">
                            {providerLevel}
                          </Badge>

                          {service.specialization && (
                            <div>
                              <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1">
                                Specialization
                              </h4>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#5b5b5b]">
                                {service.specialization}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Right Side - Buttons */}
                        <div className="flex flex-col gap-2 w-[180px] flex-shrink-0">
                          <Button className="bg-[#3D78CB] hover:bg-[#2E5FA3] text-white font-['Poppins',sans-serif] text-[13px] h-10 px-4 w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contact
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-2 border-gray-300 font-['Poppins',sans-serif] text-[13px] h-10 px-4 w-full"
                            asChild
                          >
                            <Link to={`/profile/${service.id}`}>
                              View Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="overview" className="w-full">
              <div className="w-full overflow-x-auto scrollbar-hide border-b border-gray-200">
                <TabsList className="w-full min-w-max justify-start bg-transparent rounded-none h-auto p-0 inline-flex">
                  <TabsTrigger 
                    value="overview"
                    className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] md:text-[15px] data-[state=active]:text-[#FE8A0F] data-[state=active]:border-b-2 data-[state=active]:border-[#FE8A0F] rounded-none pb-3 data-[state=active]:bg-transparent whitespace-nowrap px-3 sm:px-4 md:px-6"
                  >
                    Overview
                  </TabsTrigger>
                  {service.reviewCount > 0 && (
                    <TabsTrigger 
                      value="reviews"
                      className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] md:text-[15px] data-[state=active]:text-[#FE8A0F] data-[state=active]:border-b-2 data-[state=active]:border-[#FE8A0F] rounded-none pb-3 data-[state=active]:bg-transparent whitespace-nowrap px-3 sm:px-4 md:px-6"
                    >
                      Reviews ({service.reviewCount})
                    </TabsTrigger>
                  )}
                  <TabsTrigger 
                    value="portfolio"
                    className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] md:text-[15px] data-[state=active]:text-[#FE8A0F] data-[state=active]:border-b-2 data-[state=active]:border-[#FE8A0F] rounded-none pb-3 data-[state=active]:bg-transparent whitespace-nowrap px-3 sm:px-4 md:px-6"
                  >
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger 
                    value="faq"
                    className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] md:text-[15px] data-[state=active]:text-[#FE8A0F] data-[state=active]:border-b-2 data-[state=active]:border-[#FE8A0F] rounded-none pb-3 data-[state=active]:bg-transparent whitespace-nowrap px-3 sm:px-4 md:px-6"
                  >
                    FAQ
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-6 space-y-6">

                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6">
                    <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                      About This Service
                    </h2>
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#5b5b5b] leading-relaxed mb-6">
                      {aboutService}
                    </p>
                    
                    {/* Ideal for Section */}
                    {service.idealFor && service.idealFor.length > 0 && (
                      <>
                        <Separator className="my-6" />
                        
                        <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                          Ideal for
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {service.idealFor.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-2 border-[#3D78CB] flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-[#3D78CB]" />
                              </div>
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b]">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    
                    <Separator className="my-6" />
                    
                    <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                      What's Included
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {whatsIncluded.map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-2 border-gray-200 hover:border-[#FE8A0F] transition-colors">
                    <CardContent className="p-4 text-center">
                      <Award className="w-8 h-8 text-[#FE8A0F] mx-auto mb-2" />
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        Quality Guaranteed
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-gray-200 hover:border-[#3D78CB] transition-colors">
                    <CardContent className="p-4 text-center">
                      <Shield className="w-8 h-8 text-[#3D78CB] mx-auto mb-2" />
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        Verified Pro
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-gray-200 hover:border-[#FE8A0F] transition-colors">
                    <CardContent className="p-4 text-center">
                      <RefreshCw className="w-8 h-8 text-[#FE8A0F] mx-auto mb-2" />
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        Satisfaction Guarantee
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-gray-200 hover:border-[#3D78CB] transition-colors">
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="w-8 h-8 text-[#3D78CB] mx-auto mb-2" />
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        24/7 Support
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {service.reviewCount > 0 && (
                <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Rating Overview */}
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="text-[48px] font-['Poppins',sans-serif] text-[#2c353f] mb-2">
                          {service.rating}
                        </div>
                        <div className="flex justify-center mb-2">
                          {renderStars(service.rating)}
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Based on {service.reviewCount} reviews
                        </p>
                      </div>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star, index) => {
                          const count = ratingDistribution[index] || 0;
                          const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] w-8">
                                {star} <Star className="w-3 h-3 inline fill-[#FE8A0F] text-[#FE8A0F]" />
                              </span>
                              <Progress 
                                value={percentage} 
                                className="flex-1 h-2"
                              />
                              <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const userVote = userVotes.get(review.id);
                    const isResponseExpanded = expandedResponses.has(review.id);
                    const voteCounts = reviewVoteCounts.get(review.id) || { helpful: review.helpfulVotes, notHelpful: review.notHelpfulVotes };
                    return (
                      <Card key={review.id} className="border-2 border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={review.userAvatar} alt={review.userName} />
                              <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif]">
                                {review.userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="mb-2">
                                <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                                  {review.userName}
                                </h4>
                                {review.userLocation && (
                                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {review.userLocation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Rating and date */}
                          <div className="flex items-center gap-2 mb-3">
                            {renderStars(review.rating)}
                            <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                              {review.date}
                            </span>
                          </div>

                          {/* Review comment */}
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-relaxed mb-4">
                            {review.comment}
                          </p>

                          {/* Price and Duration */}
                          {(review.priceRange || review.duration) && (
                            <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-200">
                              {review.priceRange && (
                                <div>
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                    {review.priceRange}
                                  </p>
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                                    Price
                                  </p>
                                </div>
                              )}
                              {review.duration && (
                                <div>
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                    {review.duration}
                                  </p>
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                                    Duration
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Professional Response */}
                          {review.professionalResponse && (
                            <div className="mb-4 bg-[#f8f9fa] rounded-lg p-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleResponseExpansion(review.id);
                                }}
                                className="w-full flex items-center justify-between gap-3 mb-2 hover:opacity-80 transition-opacity"
                              >
                                <Link to={`/profile/117`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={review.professionalResponse.providerImage} alt={review.professionalResponse.providerName} />
                                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[11px]">
                                      {review.professionalResponse.providerName.split(" ").map(n => n[0]).join("").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors">
                                    {review.professionalResponse.providerName}'s Response
                                  </span>
                                </Link>
                                {isResponseExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#6b6b6b]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[#6b6b6b]" />
                                )}
                              </button>
                              
                              {isResponseExpanded && (
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5b5b5b] leading-relaxed pl-11">
                                  {review.professionalResponse.text}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Helpful votes section */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {voteCounts.helpful > 0 && (
                                <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                  Helpful {voteCounts.helpful}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                Helpful?
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(review.id, 'helpful');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                                  userVote === 'helpful'
                                    ? 'bg-[#10B981] text-white'
                                    : 'bg-white border border-gray-300 text-[#6b6b6b] hover:border-[#10B981] hover:text-[#10B981]'
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span className="font-['Poppins',sans-serif] text-[12px]">
                                  Yes
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(review.id, 'not-helpful');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                                  userVote === 'not-helpful'
                                    ? 'bg-[#EF4444] text-white'
                                    : 'bg-white border border-gray-300 text-[#6b6b6b] hover:border-[#EF4444] hover:text-[#EF4444]'
                                }`}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span className="font-['Poppins',sans-serif] text-[12px]">
                                  No
                                </span>
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              )}

              <TabsContent value="portfolio" className="mt-6">
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6">
                    <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-6">
                      Portfolio Gallery
                    </h2>
                    
                    {/* Portfolio Grid - Masonry style */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* First image - larger, fills full height */}
                      <div className="col-span-2 md:col-span-1 md:row-span-2">
                        <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300">
                          <img 
                            src={portfolioImages[0]} 
                            alt="Portfolio work 1"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="font-['Poppins',sans-serif] text-[14px] font-medium">Featured Work</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Remaining images in grid */}
                      {portfolioImages.slice(1, 7).map((image, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer shadow-md hover:shadow-lg transition-all duration-300">
                          <img 
                            src={image} 
                            alt={`Portfolio work ${index + 2}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3">
                        Showcasing {portfolioImages.length} completed projects
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-2 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] font-['Poppins',sans-serif]"
                      >
                        View All Work
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="faq" className="mt-6">
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6">
                    <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                      Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] hover:text-[#FE8A0F]">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b] leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Pricing Card (Sticky) - Hidden on mobile, shown via Sheet */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-0 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
                <CardContent className="p-6">
                  {/* Service Title */}
                  <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-5 leading-tight">
                    {service.description}
                  </h2>
                  <Separator className="mb-6" />
                  
                  {/* Package Selection Tabs - Only show if service has packages */}
                  {service.packages && service.packages.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                        Select Package
                      </h3>
                      <div className="flex gap-2 mb-4">
                        {service.packages.map((pkg) => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => handlePackageChange(pkg.id)}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all font-['Poppins',sans-serif] text-[13px] ${
                              selectedPackageId === pkg.id
                                ? 'border-[#FE8A0F] bg-[#FE8A0F] text-white shadow-md'
                                : 'border-gray-200 text-[#6b6b6b] hover:border-[#FE8A0F] hover:text-[#FE8A0F]'
                            }`}
                          >
                            {pkg.name}
                          </button>
                        ))}
                      </div>
                      {selectedPackage && (
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] leading-relaxed">
                          {selectedPackage.description}
                        </p>
                      )}
                      <Separator className="my-4" />
                    </div>
                  )}
                  
                  {/* Price Section - Moved to top */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-2">
                      {originalPrice && (
                        <span className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b] line-through">
                          £{originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Poppins',sans-serif] text-[32px] text-[#FE8A0F]">
                        £{basePrice}
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        / {selectedPackage ? selectedPackage.priceUnit : service.priceUnit}
                      </span>
                    </div>
                    {originalPrice && (
                      <Badge className="bg-[#10B981] text-white font-['Poppins',sans-serif] text-[11px] mt-2">
                        Save £{(originalPrice - basePrice).toFixed(0)}
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Service Highlights */}
                  <div className="mb-6 pb-6 border-b-2 border-gray-100">
                    <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-3">
                      {selectedPackage ? "What's Included" : "Service Highlights"}
                    </h3>
                    <div className="space-y-2.5">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed">
                            {highlight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Package Features - Only show if package selected */}
                  {selectedPackage && selectedPackage.features && selectedPackage.features.length > 0 && (
                    <div className="mb-6 pb-6 border-b-2 border-gray-100">
                      <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-3">
                        Package Features
                      </h3>
                      <div className="space-y-2.5">
                        {selectedPackage.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                            <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3 mb-6">
                    {selectedPackage && selectedPackage.deliveryTime && (
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          <Clock className="w-4 h-4 inline mr-1.5" />
                          Delivery Time
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {selectedPackage.deliveryTime}
                        </span>
                      </div>
                    )}
                    {selectedPackage && selectedPackage.revisions && (
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          <Star className="w-4 h-4 inline mr-1.5" />
                          Revisions
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {selectedPackage.revisions}
                        </span>
                      </div>
                    )}
                    {!selectedPackage && (
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          <Clock className="w-4 h-4 inline mr-1.5" />
                          Availability
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {service.deliveryType === "same-day" ? "Same day" : "Standard"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Service Addons - Use package addons if package selected */}
                  {((selectedPackage && selectedPackage.addons && selectedPackage.addons.length > 0) || 
                    (!selectedPackage && service.addons && service.addons.length > 0)) && (
                    <>
                      <Separator className="my-4" />
                      
                      <div className="mb-6">
                        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4">
                          Get more with Service Extra
                        </h3>
                        <div className="space-y-2.5">
                          {(selectedPackage?.addons || service.addons)?.map((addon) => {
                            const isSelected = selectedAddons.has(addon.id);
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAddon(addon.id);
                                }}
                                className={`w-full p-3.5 rounded-lg border-2 transition-all cursor-pointer text-left ${
                                  isSelected 
                                    ? 'border-[#FE8A0F] bg-[#FFF5EB]' 
                                    : 'border-gray-200 hover:border-[#FE8A0F]/30 hover:bg-gray-50 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    {isSelected ? (
                                      <CheckSquare className="w-5 h-5 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className={`font-['Poppins',sans-serif] text-[14px] leading-tight mb-1 ${
                                        isSelected ? 'text-[#2c353f]' : 'text-[#2c353f]'
                                      }`}>
                                        {addon.title}
                                      </div>
                                      {addon.description && (
                                        <div className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] leading-relaxed">
                                          {addon.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className={`font-['Poppins',sans-serif] text-[15px] font-medium ${
                                      isSelected ? 'text-[#FE8A0F]' : 'text-[#2c353f]'
                                    }`}>
                                      +£{addon.price}
                                    </span>
                                    {addon.deliveryTime && (
                                      <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                                        +{addon.deliveryTime}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        Quantity
                      </span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={decrementQuantity}
                          className="h-8 w-8 rounded-md border-2 border-gray-300 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] min-w-[30px] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={incrementQuantity}
                          className="h-8 w-8 rounded-md border-2 border-gray-300 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Total Price Display */}
                  <div className="mb-4 p-3 bg-[#FFF5EB] rounded-lg">
                    <div className="space-y-2">
                      {/* Base price */}
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          Service {quantity > 1 ? `(${quantity} × £${service.price})` : ''}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          £{(basePrice * quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Addons breakdown */}
                      {addonsTotal > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Extras {quantity > 1 ? `(${quantity}x)` : ''}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £{(addonsTotal * quantity).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Total */}
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium">
                          Total
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F] font-medium">
                          £{totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddToCart}
                    className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif] text-[15px] py-6 mb-3"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                  
                  <Button 
                    onClick={handleOrderNow}
                    className="w-full bg-[#3D78CB] hover:bg-[#2E5FA3] text-white font-['Poppins',sans-serif] text-[15px] py-6"
                  >
                    Order Now
                  </Button>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-3 text-center">
                    {service.completedTasks > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#10B981]" />
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          {Math.floor(service.completedTasks / 50)} orders in the last month
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <User className="w-4 h-4 text-[#3D78CB]" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        {Math.floor(Math.random() * 20) + 5} people viewing now
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Button and Sheet for Pricing */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              {(originalPrice || (service.addons && service.addons.length > 0) || (selectedPackage && selectedPackage.addons && selectedPackage.addons.length > 0)) && (
                <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                  {originalPrice ? "From" : "Starting at"}
                </span>
              )}
              <span className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F]">
                £{basePrice}
              </span>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif] flex-1 max-w-[200px]">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Continue to Order
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
                <SheetHeader className="px-6 pt-6 pb-0">
                  <SheetTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                    Service Details
                  </SheetTitle>
                  <SheetDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    View pricing, add-ons, and order this service
                  </SheetDescription>
                </SheetHeader>
                <Card className="border-0 shadow-none">
                  <CardContent className="p-6 pt-4">
                    {/* Service Title */}
                    <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-5 leading-tight">
                      {service.description}
                    </h2>
                    <Separator className="mb-6" />
                    
                    {/* Package Selection Tabs - Only show if service has packages */}
                    {service.packages && service.packages.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                          Select Package
                        </h3>
                        <div className="flex gap-2 mb-4">
                          {service.packages.map((pkg) => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => handlePackageChange(pkg.id)}
                              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all font-['Poppins',sans-serif] text-[13px] ${
                                selectedPackageId === pkg.id
                                  ? 'border-[#FE8A0F] bg-[#FE8A0F] text-white shadow-md'
                                  : 'border-gray-200 text-[#6b6b6b] hover:border-[#FE8A0F] hover:text-[#FE8A0F]'
                              }`}
                            >
                              {pkg.name}
                            </button>
                          ))}
                        </div>
                        {selectedPackage && (
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] leading-relaxed">
                            {selectedPackage.description}
                          </p>
                        )}
                        <Separator className="my-4" />
                      </div>
                    )}
                    
                    {/* Price Section - Moved to top */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        {originalPrice && (
                          <span className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b] line-through">
                            £{originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-['Poppins',sans-serif] text-[32px] text-[#FE8A0F]">
                          £{basePrice}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          / {selectedPackage ? selectedPackage.priceUnit : service.priceUnit}
                        </span>
                      </div>
                      {originalPrice && (
                        <Badge className="bg-[#10B981] text-white font-['Poppins',sans-serif] text-[11px] mt-2">
                          Save £{(originalPrice - basePrice).toFixed(0)}
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-6" />

                    {/* Service Highlights */}
                    <div className="mb-6 pb-6 border-b-2 border-gray-100">
                      <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-3">
                        {selectedPackage ? "What's Included" : "Service Highlights"}
                      </h3>
                      <div className="space-y-2.5">
                        {highlights.map((highlight, index) => (
                          <div key={index} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                            <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed">
                              {highlight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Package Features - Only show if package selected */}
                    {selectedPackage && selectedPackage.features && selectedPackage.features.length > 0 && (
                      <div className="mb-6 pb-6 border-b-2 border-gray-100">
                        <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-3">
                          Package Features
                        </h3>
                        <div className="space-y-2.5">
                          {selectedPackage.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                              <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] leading-relaxed">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3 mb-6">
                      {selectedPackage && selectedPackage.deliveryTime && (
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            <Clock className="w-4 h-4 inline mr-1.5" />
                            Delivery Time
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {selectedPackage.deliveryTime}
                          </span>
                        </div>
                      )}
                      {selectedPackage && selectedPackage.revisions && (
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            <Star className="w-4 h-4 inline mr-1.5" />
                            Revisions
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {selectedPackage.revisions}
                          </span>
                        </div>
                      )}
                      {!selectedPackage && (
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            <Clock className="w-4 h-4 inline mr-1.5" />
                            Availability
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {service.deliveryType === "same-day" ? "Same day" : "Standard"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Service Addons - Use package addons if package selected */}
                    {((selectedPackage && selectedPackage.addons && selectedPackage.addons.length > 0) || 
                      (!selectedPackage && service.addons && service.addons.length > 0)) && (
                      <>
                        <Separator className="my-4" />
                        
                        <div className="mb-6">
                          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4">
                            Get more with Service Extra
                          </h3>
                          <div className="space-y-2.5">
                            {(selectedPackage?.addons || service.addons)?.map((addon) => {
                              const isSelected = selectedAddons.has(addon.id);
                              return (
                                <button
                                  key={addon.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAddon(addon.id);
                                  }}
                                  className={`w-full p-3.5 rounded-lg border-2 transition-all cursor-pointer text-left ${
                                    isSelected 
                                      ? 'border-[#FE8A0F] bg-[#FFF5EB]' 
                                      : 'border-gray-200 hover:border-[#FE8A0F]/30 hover:bg-gray-50 bg-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className={`font-['Poppins',sans-serif] text-[14px] leading-tight mb-1 ${
                                          isSelected ? 'text-[#2c353f]' : 'text-[#2c353f]'
                                        }`}>
                                          {addon.title}
                                        </div>
                                        {addon.description && (
                                          <div className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] leading-relaxed">
                                            {addon.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                      <span className={`font-['Poppins',sans-serif] text-[15px] font-medium ${
                                        isSelected ? 'text-[#FE8A0F]' : 'text-[#2c353f]'
                                      }`}>
                                        +£{addon.price}
                                      </span>
                                      {addon.deliveryTime && (
                                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                                          +{addon.deliveryTime}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator className="my-4" />
                    
                    {/* Quantity and Price Calculation */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Quantity
                        </span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] min-w-[30px] text-center">
                            {quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={incrementQuantity}
                            disabled={quantity >= 10}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Price Breakdown */}
                      <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Base price {quantity > 1 ? `(${quantity}x)` : ''}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £{(basePrice * quantity).toFixed(2)}
                          </span>
                        </div>
                        
                        {addonsTotal > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                              Extras {quantity > 1 ? `(${quantity}x)` : ''}
                            </span>
                            <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              £{(addonsTotal * quantity).toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        {/* Total */}
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between">
                          <span className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium">
                            Total
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[24px] text-[#FE8A0F] font-medium">
                            £{totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddToCart}
                      className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif] text-[15px] py-6 mb-3"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>
                    
                    <Button 
                      onClick={handleOrderNow}
                      className="w-full bg-[#3D78CB] hover:bg-[#2E5FA3] text-white font-['Poppins',sans-serif] text-[15px] py-6"
                    >
                      Order Now
                    </Button>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-3 text-center">
                      {service.completedTasks > 0 && (
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#10B981]" />
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            {Math.floor(service.completedTasks / 50)} orders in the last month
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4 text-[#3D78CB]" />
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          {Math.floor(Math.random() * 20) + 5} people viewing now
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={handleBookingConfirm}
        sellerName={service.providerName}
        serviceTitle={service.description}
      />

      {/* Add to Cart Modal */}
      <AddToCartModal
        isOpen={showAddToCartModal}
        onClose={() => setShowAddToCartModal(false)}
        onConfirm={(data) => {
          // Get addons from selected package or service
          const addonsSource = selectedPackage?.addons || service.addons;
          const selectedAddonsData = addonsSource
            ?.filter(addon => data.selectedAddons.includes(addon.id))
            .map(addon => ({
              id: addon.id,
              title: addon.title,
              price: addon.price
            })) || [];

          // Build title with package name if package selected
          const itemTitle = selectedPackage 
            ? `${service.description} (${selectedPackage.name} Package)`
            : service.description;

          addToCart({
            id: service.id.toString(),
            title: itemTitle,
            seller: service.providerName,
            price: basePrice,
            image: service.image,
            rating: service.rating,
            addons: selectedAddonsData.length > 0 ? selectedAddonsData : undefined,
            booking: data.booking ? {
              date: data.booking.date.toISOString(),
              time: data.booking.time,
              timeSlot: data.booking.timeSlot
            } : undefined,
            packageType: data.packageType
          }, data.quantity);
          
          setShowAddToCartModal(false);
        }}
        serviceTitle={service.description}
        sellerName={service.providerName}
        basePrice={basePrice}
        addons={(selectedPackage?.addons || service.addons) || []}
        packages={service.packages ? service.packages.map(pkg => ({
          type: pkg.name.toLowerCase() as "basic" | "standard" | "premium",
          name: pkg.name,
          price: parseFloat(pkg.price),
          features: pkg.highlights
        })) : []}
        serviceImage={service.image}
      />
    </div>
  );
}
