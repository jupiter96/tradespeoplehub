import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { allServices } from "./servicesData";
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
  Star, 
  MapPin, 
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
  Clock,
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
  Heart,
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
  
  /* 
   * OLD IMAGE CONFIGURATION CODE - REMOVED
   * This block contained category image URLs from Unsplash
   * Now using minimal geometric design instead
   * 
  const skipOldCode = false;
  if (skipOldCode) {
    "Socket installation": "https://images.unsplash.com/photo-1751486289945-989724789188?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyaW5nJTIwd29ya3xlbnwxfHx8fDE3NjM0MjAyMDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "Light fixture installation": "https://images.unsplash.com/photo-1751486289945-989724789188?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyaW5nJTIwd29ya3xlbnwxfHx8fDE3NjM0MjAyMDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Wiring": "https://images.unsplash.com/photo-1751486289945-989724789188?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyaW5nJTIwd29ya3xlbnwxfHx8fDE3NjM0MjAyMDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Circuit breaker": "https://images.unsplash.com/photo-1751486289945-989724789188?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyaW5nJTIwd29ya3xlbnwxfHx8fDE3NjM0MjAyMDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Interior painting": "https://images.unsplash.com/photo-1719985969510-01b17ef58f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGhvdXNlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzYzNDIwMjAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Exterior painting": "https://images.unsplash.com/photo-1719985969510-01b17ef58f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGhvdXNlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzYzNDIwMjAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Wallpapering": "https://images.unsplash.com/photo-1719985969510-01b17ef58f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGhvdXNlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzYzNDIwMjAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Wood staining": "https://images.unsplash.com/photo-1740754699699-c8b4b1635faf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5keW1hbiUyMHRvb2xzJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2MzM1OTQ1Mnww&ixlib=rb-4.1.0&q=80&w=1080",
      "Lawn mowing": "https://images.unsplash.com/photo-1723811898182-aff0c2eca53f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXduJTIwbW93aW5nJTIwZ2FyZGVufGVufDF8fHx8MTc2MzQyMDIwMHww&ixlib=rb-4.1.0&q=80&w=1080",
      "Tree trimming": "https://images.unsplash.com/photo-1729526368510-6a220407f287?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBsYW5kc2NhcGUlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDE5OTI3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Garden design": "https://images.unsplash.com/photo-1729526368510-6a220407f287?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBsYW5kc2NhcGUlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDE5OTI3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Hedge trimming": "https://images.unsplash.com/photo-1729526368510-6a220407f287?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBsYW5kc2NhcGUlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDE5OTI3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Leak repair": "https://images.unsplash.com/photo-1723988429049-0a42e45e8501?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHRvb2xzfGVufDF8fHx8MTc2MzM3MjA1MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "Pipe installation": "https://images.unsplash.com/photo-1731694411560-050e5b91e943?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwcHJvZmVzc2lvbmFsJTIwdG9vbHN8ZW58MXx8fHwxNzYzNDE5OTI2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Drain cleaning": "https://images.unsplash.com/photo-1723988429049-0a42e45e8501?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHRvb2xzfGVufDF8fHx8MTc2MzM3MjA1MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "Water heater": "https://images.unsplash.com/photo-1731694411560-050e5b91e943?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwcHJvZmVzc2lvbmFsJTIwdG9vbHN8ZW58MXx8fHwxNzYzNDE5OTI2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    };
    if (subcategoryImages[subCategoryName]) {
      return subcategoryImages[subCategoryName];
    }
  }
  
  // Main category specific images - Each with unique, relevant Unsplash images
  if (categoryName) {
    const categoryImages: Record<string, string> = {
      // Home & Garden Categories
      "Electrical Work": "https://images.unsplash.com/photo-1467733238130-bb6846885316?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHdvcmtpbmclMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzMzk2Nzk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Plumbing": "https://images.unsplash.com/photo-1731694411560-050e5b91e943?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwcHJvZmVzc2lvbmFsJTIwdG9vbHN8ZW58MXx8fHwxNzYzNDE5OTI2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Painting & Decorating": "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludGVyJTIwcHJvZmVzc2lvbmFsJTIwd29ya3xlbnwxfHx8fDE3NjM0MTk5MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Gardening & Landscaping": "https://images.unsplash.com/photo-1656343668367-ec95098b01fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZ2FyZGVuJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2MzQyMTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Carpentry": "https://images.unsplash.com/photo-1740754699699-c8b4b1635faf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50ZXIlMjB3b29kd29yayUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjM0MTQ2NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Flooring": "https://images.unsplash.com/photo-1731185752376-a4cf3e8556fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9vcmluZyUyMGluc3RhbGxhdGlvbiUyMHdvcmt8ZW58MXx8fHwxNzYzNDIwMTk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Roofing": "https://images.unsplash.com/photo-1681049400158-0ff6249ac315?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29maW5nJTIwcHJvZmVzc2lvbmFsJTIwd29ya3xlbnwxfHx8fDE3NjM0MjAxOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Home Cleaning": "https://images.unsplash.com/photo-1763026227930-ec2c91d4e7f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjbGVhbmluZyUyMHNlcnZpY2V8ZW58MXx8fHwxNzYzMzYxOTc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Cleaning": "https://images.unsplash.com/photo-1763026227930-ec2c91d4e7f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjbGVhbmluZyUyMHNlcnZpY2V8ZW58MXx8fHwxNzYzMzYxOTc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Handyman Services": "https://images.unsplash.com/photo-1762604462279-dc3216efe59b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXBhaXIlMjBtYWludGVuYW5jZSUyMHRvb2xzfGVufDF8fHx8MTc2MzQyMTU4NXww&ixlib=rb-4.1.0&q=80&w=1080",
      "Kitchen Fitting": "https://images.unsplash.com/photo-1686023858213-9653d3248fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwZml0dGluZyUyMGluc3RhbGxhdGlvbnxlbnwxfHx8fDE3NjM0MjE1OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Bathroom Fitting": "https://images.unsplash.com/photo-1761353855019-05f2f3ed9c43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZpdHRpbmclMjByZW5vdmF0aW9ufGVufDF8fHx8MTc2MzQyMTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Business Services Categories
      "Business Consulting": "https://images.unsplash.com/photo-1551135049-8a33b5883817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnN1bHRpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzYzMzg5NDk5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Marketing & Advertising": "https://images.unsplash.com/photo-1542744094-f77e9f7a10b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MzMzOTYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Marketing": "https://images.unsplash.com/photo-1542744094-f77e9f7a10b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MzMzOTYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Web Development": "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGluZ3xlbnwxfHx8fDE3NjM0MTg5NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Graphic Design": "https://images.unsplash.com/photo-1483058712412-4245e9b90334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwc3R1ZGlvfGVufDF8fHx8MTc2MzMxNTAyMHww&ixlib=rb-4.1.0&q=80&w=1080",
      "Accounting & Bookkeeping": "https://images.unsplash.com/photo-1762318986860-a7b18dd0da02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2NvdW50aW5nJTIwZmluYW5jZSUyMGRlc2t8ZW58MXx8fHwxNzYzNDIxNTcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Accounting": "https://images.unsplash.com/photo-1762318986860-a7b18dd0da02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2NvdW50aW5nJTIwZmluYW5jZSUyMGRlc2t8ZW58MXx8fHwxNzYzNDIxNTcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Writing & Translation": "https://images.unsplash.com/photo-1733149086317-db960d20f305?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHNlcnZpY2VzJTIwbW9kZXJufGVufDF8fHx8MTc2MzQyMTU4NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "Design & Creative": "https://images.unsplash.com/photo-1483058712412-4245e9b90334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwc3R1ZGlvfGVufDF8fHx8MTc2MzMxNTAyMHww&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Personal Services Categories
      "Personal Training": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluZXIlMjBmaXRuZXNzfGVufDF8fHx8MTc2MzQyMDE5OXww&ixlib=rb-4.1.0&q=80&w=1080",
      "Life Coaching": "https://images.unsplash.com/photo-1634840542403-1a9b1067aaa0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWZlJTIwY29hY2hpbmclMjBzZXNzaW9ufGVufDF8fHx8MTc2MzQyMTU3Mnww&ixlib=rb-4.1.0&q=80&w=1080",
      "Massage Therapy": "https://images.unsplash.com/photo-1737352777897-e22953991a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNzYWdlJTIwdGhlcmFweSUyMHNwYXxlbnwxfHx8fDE3NjMzNDAyNTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Professional Organizing": "https://images.unsplash.com/photo-1763041821836-03498a9e1f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHdlbGxuZXNzJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc2MzQyMTU4NXww&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Repair & Maintenance Categories
      "Appliance Repair": "https://images.unsplash.com/photo-1759434775823-40d8b9577a41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjByZXBhaXIlMjB0ZWNobmljaWFufGVufDF8fHx8MTc2MzM4MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080",
      "HVAC Repair": "https://images.unsplash.com/photo-1751486289950-5c4898a4c773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodmFjJTIwaGVhdGluZyUyMHN5c3RlbXxlbnwxfHx8fDE3NjM0MjE1ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Locksmith Services": "https://images.unsplash.com/photo-1756341782434-3020b9d17372?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2Nrc21pdGglMjBrZXlzJTIwc2VjdXJpdHl8ZW58MXx8fHwxNzYzNDIxNTg0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Technology Services Categories
      "Computer Repair": "https://images.unsplash.com/photo-1665936653831-211c14d123ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMHJlcGFpciUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzNDIxNTczfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "IT Support": "https://images.unsplash.com/photo-1760037028485-d00dd2b8f6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc2VydmljZXMlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDIxNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "IT & Tech": "https://images.unsplash.com/photo-1760037028485-d00dd2b8f6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc2VydmljZXMlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDIxNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "App Development": "https://images.unsplash.com/photo-1763107228544-2ad5d71c21f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHAlMjBtb2JpbGUlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NjM0MjE1OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Education & Tutoring Categories
      "Tutoring": "https://images.unsplash.com/photo-1511629091441-ee46146481b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwdHV0b3IlMjB0ZWFjaGluZ3xlbnwxfHx8fDE3NjM0MjAxOTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Math Tutoring": "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBsZWFybmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjM0MjE1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "English Tutoring": "https://images.unsplash.com/photo-1511629091441-ee46146481b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwdHV0b3IlMjB0ZWFjaGluZ3xlbnwxfHx8fDE3NjM0MjAxOTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Music Lessons": "https://images.unsplash.com/photo-1760413209281-9105771dc40a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGxlc3NvbiUyMGluc3RydW1lbnRzfGVufDF8fHx8MTc2MzQyMTU3NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "Language Tutoring": "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBsZWFybmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjM0MjE1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Music & Audio": "https://images.unsplash.com/photo-1494430700620-683982a84a30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaiUyMG11c2ljJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2MzM3OTUzMHww&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Beauty & Wellness Categories
      "Hair Styling": "https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwc2Fsb24lMjBzdHlsaW5nfGVufDF8fHx8MTc2MzMyMjIzMnww&ixlib=rb-4.1.0&q=80&w=1080",
      "Makeup Services": "https://images.unsplash.com/photo-1698181842119-a5283dea1440?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWtldXAlMjBhcnRpc3QlMjBiZWF1dHl8ZW58MXx8fHwxNzYzNDA0NjU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Nail Services": "https://images.unsplash.com/photo-1700760933910-d3c03aa18b65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwc3BhJTIwbWFuaWN1cmV8ZW58MXx8fHwxNzYzNDIxNTk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Spa Treatments": "https://images.unsplash.com/photo-1731514771613-991a02407132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjB3ZWxsbmVzcyUyMHNhbG9ufGVufDF8fHx8MTc2MzQyMDE5OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "Beauty & Wellness": "https://images.unsplash.com/photo-1731514771613-991a02407132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjB3ZWxsbmVzcyUyMHNhbG9ufGVufDF8fHx8MTc2MzQyMDE5OHww&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Health & Wellness Categories
      "Yoga & Pilates": "https://images.unsplash.com/photo-1635545999375-057ee4013deb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc2MzM3MTgyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Nutrition Counseling": "https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXRyaXRpb24lMjBoZWFsdGh5JTIwZm9vZHxlbnwxfHx8fDE3NjMzOTM3MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Physiotherapy": "https://images.unsplash.com/photo-1758654860100-32cd2e83e74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaHlzaW90aGVyYXB5JTIwaGVhbHRoJTIwdHJlYXRtZW50fGVufDF8fHx8MTc2MzQyMTU5NXww&ixlib=rb-4.1.0&q=80&w=1080",
      "Mental Health Support": "https://images.unsplash.com/photo-1684607633062-b31b5d134814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGglMjB3ZWxsbmVzcyUyMGNsaW5pY3xlbnwxfHx8fDE3NjM0MjE1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Legal & Financial Categories
      "Legal Services": "https://images.unsplash.com/photo-1752697588991-178a70663996?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXclMjBsZWdhbCUyMGJvb2tzfGVufDF8fHx8MTc2MzQyMTU3NXww&ixlib=rb-4.1.0&q=80&w=1080",
      "Tax Services": "https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXglMjBhY2NvdW50aW5nJTIwY2FsY3VsYXRvcnxlbnwxfHx8fDE3NjM0MjE1NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Financial Planning": "https://images.unsplash.com/photo-1634128222187-18eababc763d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBwbGFubmluZyUyMGludmVzdG1lbnR8ZW58MXx8fHwxNzYzMzU3NzEzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Wedding & Events Categories
      "Wedding Planning": "https://images.unsplash.com/photo-1696204868916-cda7380ae72b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2VyZW1vbnklMjB2ZW51ZXxlbnwxfHx8fDE3NjMzNjI2Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Event Planning": "https://images.unsplash.com/photo-1600879227354-f2809c06f145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZXZlbnRzJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Event Photography": "https://images.unsplash.com/photo-1763256377588-f29bdc912698?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwY2FtZXJhfGVufDF8fHx8MTc2MzQyMTU3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Photography": "https://images.unsplash.com/photo-1763256377588-f29bdc912698?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwY2FtZXJhfGVufDF8fHx8MTc2MzQyMTU3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Event Videography": "https://images.unsplash.com/photo-1633721456123-a78999f56a4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGV2ZW50JTIwcHJvZHVjdGlvbnxlbnwxfHx8fDE3NjM0MjE1OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Catering Services": "https://images.unsplash.com/photo-1732259495388-af40b972c311?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRlcmluZyUyMGZvb2QlMjBzZXJ2aWNlfGVufDF8fHx8MTc2MzM4MDI1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "DJ Services": "https://images.unsplash.com/photo-1494430700620-683982a84a30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaiUyMG11c2ljJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2MzM3OTUzMHww&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Pet Services Categories
      "Pet Grooming": "https://images.unsplash.com/photo-1733210872526-863e2f16cf39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBncm9vbWluZyUyMHBldHxlbnwxfHx8fDE3NjM0MjE1ODF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Pet Sitting": "https://images.unsplash.com/photo-1735597403677-2029485b4547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzZXJ2aWNlcyUyMGNhcmV8ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Dog Walking": "https://images.unsplash.com/photo-1616420486543-9d94ce1af95b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjB3YWxraW5nJTIwcGFya3xlbnwxfHx8fDE3NjMzNDE4MzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Pet Training": "https://images.unsplash.com/photo-1735597403677-2029485b4547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzZXJ2aWNlcyUyMGNhcmV8ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Pet Care": "https://images.unsplash.com/photo-1735597403677-2029485b4547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzZXJ2aWNlcyUyMGNhcmV8ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Automotive Services Categories
      "Car Repair": "https://images.unsplash.com/photo-1711386689622-1cda23e10217?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBtZWNoYW5pYyUyMHJlcGFpcnxlbnwxfHx8fDE3NjMzNDI1Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Car Maintenance": "https://images.unsplash.com/photo-1605822167835-d32696aef686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwc2VydmljZXMlMjBnYXJhZ2V8ZW58MXx8fHwxNzYzNDIxNTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Car Detailing": "https://images.unsplash.com/photo-1694678505387-c930ba97750b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBkZXRhaWxpbmclMjBjbGVhbmluZ3xlbnwxfHx8fDE3NjMzMjM5NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Bodywork & Paint": "https://images.unsplash.com/photo-1711386689622-1cda23e10217?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBtZWNoYW5pYyUyMHJlcGFpcnxlbnwxfHx8fDE3NjMzNDI1Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "Automotive": "https://images.unsplash.com/photo-1605822167835-d32696aef686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwc2VydmljZXMlMjBnYXJhZ2V8ZW58MXx8fHwxNzYzNDIxNTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      
      // Moving & Storage Categories
      "Moving Services": "https://images.unsplash.com/photo-1633155565182-16c06ed45ec5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpbmclMjB0cnVjayUyMHNlcnZpY2V8ZW58MXx8fHwxNzYzNDIxNTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Moving & Delivery": "https://images.unsplash.com/photo-1633155565182-16c06ed45ec5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpbmclMjB0cnVjayUyMHNlcnZpY2V8ZW58MXx8fHwxNzYzNDIxNTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Packing Services": "https://images.unsplash.com/photo-1657049199023-87fb439d47c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBwYWNraW5nJTIwbW92aW5nfGVufDF8fHx8MTc2MzQyMTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "Storage Solutions": "https://images.unsplash.com/photo-1576669801820-a9ab287ac2d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwd2FyZWhvdXNlJTIwYm94ZXN8ZW58MXx8fHwxNzYzNDIxNTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "Furniture Assembly": "https://images.unsplash.com/photo-1657049199023-87fb439d47c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBwYWNraW5nJTIwbW92aW5nfGVufDF8fHx8MTc2MzQyMTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    };
    if (categoryImages[categoryName]) {
      return categoryImages[categoryName];
    }
  }
  
  // Sector specific images - Each with unique, relevant Unsplash images
  const sectorImages: Record<string, string> = {
    "Home & Garden": "https://images.unsplash.com/photo-1656343668367-ec95098b01fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZ2FyZGVuJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2MzQyMTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "Business Services": "https://images.unsplash.com/photo-1733149086317-db960d20f305?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHNlcnZpY2VzJTIwbW9kZXJufGVufDF8fHx8MTc2MzQyMTU4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    "Personal Services": "https://images.unsplash.com/photo-1763041821836-03498a9e1f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHdlbGxuZXNzJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc2MzQyMTU4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    "Repair & Maintenance": "https://images.unsplash.com/photo-1762604462279-dc3216efe59b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXBhaXIlMjBtYWludGVuYW5jZSUyMHRvb2xzfGVufDF8fHx8MTc2MzQyMTU4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    "Technology Services": "https://images.unsplash.com/photo-1760037028485-d00dd2b8f6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc2VydmljZXMlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDIxNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Technology & IT": "https://images.unsplash.com/photo-1760037028485-d00dd2b8f6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc2VydmljZXMlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzNDIxNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Education & Tutoring": "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBsZWFybmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjM0MjE1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "Education & Learning": "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBsZWFybmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjM0MjE1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "Beauty & Wellness": "https://images.unsplash.com/photo-1731514771613-991a02407132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjB3ZWxsbmVzcyUyMHNhbG9ufGVufDF8fHx8MTc2MzQyMDE5OHww&ixlib=rb-4.1.0&q=80&w=1080",
    "Health & Wellness": "https://images.unsplash.com/photo-1684607633062-b31b5d134814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGglMjB3ZWxsbmVzcyUyMGNsaW5pY3xlbnwxfHx8fDE3NjM0MjE1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "Legal & Financial": "https://images.unsplash.com/photo-1528747008803-f9f5cc8f1a64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGZpbmFuY2lhbCUyMHNlcnZpY2VzfGVufDF8fHx8MTc2MzQyMTU4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "Wedding & Events": "https://images.unsplash.com/photo-1600879227354-f2809c06f145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZXZlbnRzJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Events & Entertainment": "https://images.unsplash.com/photo-1600879227354-f2809c06f145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZXZlbnRzJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Pet Services": "https://images.unsplash.com/photo-1735597403677-2029485b4547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzZXJ2aWNlcyUyMGNhcmV8ZW58MXx8fHwxNzYzNDIxNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Automotive": "https://images.unsplash.com/photo-1605822167835-d32696aef686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwc2VydmljZXMlMjBnYXJhZ2V8ZW58MXx8fHwxNzYzNDIxNTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Transport & Automotive": "https://images.unsplash.com/photo-1605822167835-d32696aef686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwc2VydmljZXMlMjBnYXJhZ2V8ZW58MXx8fHwxNzYzNDIxNTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Moving & Storage": "https://images.unsplash.com/photo-1633155565182-16c06ed45ec5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpbmclMjB0cnVjayUyMHNlcnZpY2V8ZW58MXx8fHwxNzYzNDIxNTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "Business & Professional": "https://images.unsplash.com/photo-1733149086317-db960d20f305?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHNlcnZpY2VzJTIwbW9kZXJufGVufDF8fHx8MTc2MzQyMTU4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    "Creative & Design": "...",
    ... etc
  }
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

  // Fetch sector data from API if we have a sectorSlug
  const { sector: apiSector, loading: sectorLoading } = useSector(sectorSlug || '', false);
  
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
          console.error('Error fetching subcategory chain:', error);
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
          console.error(`Error fetching nested subcategories (attempt ${attempt + 1}/${maxRetries}):`, error);
          if (attempt < maxRetries - 1) {
            // Retry after delay
            setTimeout(() => {
              fetchNestedSubCategories(attempt + 1);
            }, retryDelay);
          } else {
            // Max retries reached, show error
            console.error('Failed to fetch nested subcategories after all retries');
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
          console.error('Error fetching category:', error);
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
            className={`flex-1 text-left px-2 py-1.5 rounded font-['Roboto',sans-serif] text-[12px] transition-colors ${
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
  }).filter((service) => {
    if (!sector) return false;
    
    // If we're in a subcategory (3rd level), filter by subcategory
    if (currentSubCategory) {
      return service.category === sector.name && 
             service.subcategory === currentMainCategory?.name &&
             service.detailedSubcategory === currentSubCategory.name;
    }
    
    // If we're in a main category (2nd level), filter by that category
    if (currentMainCategory) {
      return service.category === sector.name && 
             service.subcategory === currentMainCategory.name;
    }
    
    // Otherwise, show all services for the sector
    return service.category === sector.name;
  });

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

  // Get featured services (top rated) - show when no filters applied
  const featuredServices = sectorServices
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 8);
  
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
  
  // Show full screen loading overlay with blur background while loading
  // Important: do NOT block render forever when data is "not found".
  // The redirect effect below will handle invalid slugs once all requests settle.
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] relative">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        {/* Full screen loading overlay with transparent blur */}
        <div className="fixed inset-0 bg-transparent backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="text-center bg-white/90 rounded-2xl px-8 py-6 shadow-lg">
            <div className="w-12 h-12 border-4 border-[#FE8A0F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f]">
              Loading page data...
            </p>
            {retryCount > 0 && (
              <p className="font-['Roboto',sans-serif] text-[12px] text-[#8d8d8d] mt-2">
                Retrying... (Attempt {retryCount}/{maxRetries})
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we don't have required data and not loading, redirect (handled via useEffect)
  if (!hasRequiredData && !isDataLoading) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
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
              <h1 className="font-['Roboto',sans-serif] text-white mb-3 md:mb-4 text-[28px] md:text-[38px] lg:text-[44px] leading-tight">
                {currentTitle}
              </h1>

              {/* Simple Description */}
              <p className="font-['Roboto',sans-serif] text-white/90 text-[14px] md:text-[16px] leading-relaxed mb-5">
                Find trusted professionals for your needs
              </p>

              {/* Stats Bar - Minimal & Prominent Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="group flex items-center gap-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#FE8A0F] flex items-center justify-center shadow-sm">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#2c2c2c] font-['Roboto',sans-serif] text-[13px]">{sectorServices.length}+</span>
                    <span className="text-[#2c2c2c]/60 font-['Roboto',sans-serif] text-[10px]">Services</span>
                  </div>
                </div>

                <div className="group flex items-center gap-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#FE8A0F] flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#2c2c2c] font-['Roboto',sans-serif] text-[13px]">Verified</span>
                    <span className="text-[#2c2c2c]/60 font-['Roboto',sans-serif] text-[10px]">Pros</span>
                  </div>
                </div>

                <div className="group flex items-center gap-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#FE8A0F] flex items-center justify-center shadow-sm">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#2c2c2c] font-['Roboto',sans-serif] text-[13px]">Same-Day</span>
                    <span className="text-[#2c2c2c]/60 font-['Roboto',sans-serif] text-[10px]">Available</span>
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
                          
                          if (hasNestedSubCategories) {
                            const currentPathSlugs = subCategorySlugs.length > 0 ? [...subCategorySlugs, subCategorySlug].join('/') : subCategorySlug;
                            navigate(`/sector/${sectorSlug}/${serviceCategorySlug}/${currentPathSlugs}`);
                          } else {
                            const sectorName = sector?.name || '';
                            const serviceCategorySlugValue = serviceCategorySlug || '';
                            
                            let filterUrl = `/services?sector=${encodeURIComponent(sectorName)}&serviceCategory=${encodeURIComponent(serviceCategorySlugValue)}`;
                            
                            if (subCategorySlugs.length > 0) {
                              subCategorySlugs.forEach((slug) => {
                                filterUrl += `&serviceSubCategory=${encodeURIComponent(slug)}`;
                              });
                            }
                            
                            filterUrl += `&serviceSubCategory=${encodeURIComponent(subCategorySlug)}`;
                            navigate(filterUrl);
                          }
                        } else {
                          const sectorName = sector?.name || '';
                          const serviceCategorySlugValue = serviceCategorySlug || '';
                          
                          let filterUrl = `/services?sector=${encodeURIComponent(sectorName)}&serviceCategory=${encodeURIComponent(serviceCategorySlugValue)}`;
                          
                          if (subCategorySlugs.length > 0) {
                            subCategorySlugs.forEach((slug) => {
                              filterUrl += `&serviceSubCategory=${encodeURIComponent(slug)}`;
                            });
                          }
                          
                          filterUrl += `&serviceSubCategory=${encodeURIComponent(subCategorySlug)}`;
                          navigate(filterUrl);
                        }
                      } catch (error) {
                        console.error('Error checking subcategory:', error);
                        const sectorName = sector?.name || '';
                        const serviceCategorySlugValue = serviceCategorySlug || '';
                        
                        let filterUrl = `/services?sector=${encodeURIComponent(sectorName)}&serviceCategory=${encodeURIComponent(serviceCategorySlugValue)}`;
                        
                        if (subCategorySlugs.length > 0) {
                          subCategorySlugs.forEach((slug) => {
                            filterUrl += `&serviceSubCategory=${encodeURIComponent(slug)}`;
                          });
                        }
                        
                        filterUrl += `&serviceSubCategory=${encodeURIComponent(subCategorySlug)}`;
                        navigate(filterUrl);
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
                            <h3 className="font-['Roboto',sans-serif] text-[#2c2c2c] text-[13px] group-hover:text-[#FE8A0F] transition-colors truncate">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        {/* Mobile Filter Sidebar - Hidden trigger */}
        <div className="md:hidden">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetContent side="left" className="w-[85%] max-w-[320px] overflow-y-auto px-6 pb-6">
              <SheetHeader>
                <SheetTitle className="font-['Roboto',sans-serif] text-[20px] text-[#2c353f]">
                  Filters
                </SheetTitle>
                <SheetDescription className="font-['Roboto',sans-serif] text-[13px] text-[#8d8d8d]">
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
                    className="w-full text-center py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#FE8A0F] font-['Roboto',sans-serif] text-[14px] transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}

                {/* Categories Tree - Show service categories and their subcategories */}
                {Array.isArray(categoriesToShow) && categoriesToShow.length > 0 && (
                  <div>
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
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
                                className={`flex-1 text-left px-2 py-1.5 rounded font-['Roboto',sans-serif] text-[13px] transition-colors ${
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
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
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
                            className={`w-full text-left px-3 py-2 rounded-lg font-['Roboto',sans-serif] text-[13px] transition-colors ${
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
                  <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
                    Minimum Rating
                  </h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(rating === selectedRating ? 0 : rating)}
                        className={`w-full text-left px-3 py-2 rounded-lg font-['Roboto',sans-serif] text-[13px] transition-colors flex items-center gap-2 ${
                          selectedRating === rating
                            ? "bg-[#FFF5EB] text-[#FE8A0F]"
                            : "hover:bg-gray-50 text-[#5b5b5b]"
                        }`}
                      >
                        <div className="flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
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
                  <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
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
                      <span className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">
                        £{priceRange[0].toLocaleString()}
                      </span>
                      <span className="font-['Roboto',sans-serif] text-[12px] text-[#6b6b6b]">
                        £{priceRange[1].toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location Filter */}
                <div>
                  <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
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
                        className="pl-10 font-['Roboto',sans-serif] text-[13px] h-10"
                      />
                    </div>
                    <Button
                      onClick={handleLocationSearch}
                      className="w-full h-10 bg-[#003D82] hover:bg-[#002554] font-['Roboto',sans-serif] text-[13px]"
                    >
                      Search Location
                    </Button>
                    {showRadiusSlider && (
                      <div className="space-y-2">
                        <Label className="font-['Roboto',sans-serif] text-[13px] text-[#5b5b5b]">
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
                          <span className="font-['Roboto',sans-serif] text-[11px] text-[#6b6b6b]">1 mi</span>
                          <span className="font-['Roboto',sans-serif] text-[11px] text-[#6b6b6b]">50 mi</span>
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
                <h2 className="font-['Roboto',sans-serif] text-[18px] text-[#2c353f]">
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
                    className="text-[#FE8A0F] hover:text-[#ff9d3a] font-['Roboto',sans-serif] text-[12px] transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Categories Tree - Show service categories and their subcategories */}
                {Array.isArray(categoriesToShow) && categoriesToShow.length > 0 && (
                  <div>
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
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
                                className={`flex-1 text-left px-2 py-1.5 rounded font-['Roboto',sans-serif] text-[13px] transition-colors ${
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
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
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
                            className={`w-full text-left px-3 py-2 rounded-lg font-['Roboto',sans-serif] text-[13px] transition-colors ${
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
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Price Range
                    </h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Roboto',sans-serif] text-[13px]"
                        />
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 100000])}
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Roboto',sans-serif] text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Minimum Rating
                    </h3>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-['Roboto',sans-serif] text-[13px] transition-colors ${
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
                    <h3 className="font-['Roboto',sans-serif] text-[16px] text-[#2c353f] mb-3">
                      Sort By
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg font-['Roboto',sans-serif] text-[13px] bg-white"
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
                    className="pl-10 h-12 border-0 border-b-2 border-gray-200 rounded-none font-['Roboto',sans-serif] text-[14px] bg-white focus-visible:ring-0 focus-visible:border-[#FE8A0F]"
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
                        className="pl-10 h-12 border-0 border-b-2 border-gray-200 rounded-none font-['Roboto',sans-serif] text-[14px] bg-white focus-visible:ring-0 focus-visible:border-[#FE8A0F]"
                      />
                    </div>
                    {locationSearch && (
                      <Button
                        onClick={handleLocationSearch}
                        className="h-12 px-6 bg-[#FE8A0F] hover:bg-[#FFB347] transition-colors font-['Roboto',sans-serif] text-[14px] whitespace-nowrap"
                      >
                        Search
                      </Button>
                    )}
                  </div>
                  
                  {/* Radius Slider */}
                  {showRadiusSlider && (
                    <div className="bg-[#FFF5EB] rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-['Roboto',sans-serif] text-[12px] text-[#2c353f]">
                          Within {radiusMiles} miles
                        </Label>
                        <button
                          onClick={() => {
                            setLocationSearch("");
                            setShowRadiusSlider(false);
                          }}
                          className="text-[#FE8A0F] hover:text-[#ff9d3a] font-['Roboto',sans-serif] text-[11px]"
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
                <h2 className="font-['Roboto',sans-serif] text-[#2c353f] text-[20px] md:text-[24px] mb-1">
                  {hasActiveFilters ? 'Filtered Services' : 'Featured Services'}
                </h2>
                {/* Desktop only subtitle */}
                <p className="hidden md:block font-['Roboto',sans-serif] text-[#8d8d8d] text-[13px]">
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
                <h3 className="font-['Roboto',sans-serif] text-[24px] text-[#5a5a5a] mb-4">
                  No services found
                </h3>
                <p className="font-['Roboto',sans-serif] text-[14px] text-[#7a7a7a] mb-6">
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
                  className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Roboto',sans-serif] px-8 py-3 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Pane View - Grid */}
                {viewMode === 'pane' && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                    {displayServices.map((service) => (
                  <Link
                    key={service.id}
                    to={`/service/${service.id}`}
                    className="bg-white rounded-[10px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 flex flex-col cursor-pointer"
                  >
                    {/* Image Section */}
                    <div className="relative h-[120px] md:h-[170px]">
                      <img
                        src={service.image}
                        alt={service.description}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badges - Top Left */}
                      {service.badges && service.badges.length > 0 && (
                        <div className="absolute top-1.5 md:top-3 left-1.5 md:left-3">
                          <span className="bg-[#FE8A0F] text-white text-[7px] md:text-[8px] font-['Roboto',sans-serif] font-semibold px-1.5 py-0.5 rounded-full shadow-md">
                            {service.badges[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-2 md:p-4 flex flex-col flex-1">
                      {/* Provider Info */}
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        <img
                          src={service.providerImage}
                          alt={service.tradingName}
                          className="w-5 h-5 md:w-8 md:h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-['Roboto',sans-serif] text-[10px] md:text-[14px] text-[#2c353f] block truncate">
                            {service.tradingName}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="font-['Roboto',sans-serif] text-[9px] md:text-[13px] text-[#5b5b5b] mb-1.5 md:mb-3 line-clamp-2">
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
                            <span className="font-['Roboto',sans-serif] text-[8px] md:text-[13px] text-[#2c353f] ml-0.5 md:ml-1">
                              {service.rating} <span className="text-[#8d8d8d]">({service.completedTasks})</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 md:gap-2 text-[#8d8d8d] text-[8px] md:text-[12px]">
                            <Star className="w-2 h-2 md:w-3.5 md:h-3.5 fill-[#E5E5E5] text-[#E5E5E5]" />
                            <span className="font-['Roboto',sans-serif]">New</span>
                          </div>
                        )}
                      </div>

                      {/* Price and Discount */}
                      {service.originalPrice && (
                        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                          <span className="font-['Roboto',sans-serif] text-[9px] md:text-[13px] text-[#c0c0c0] line-through">
                            £{service.originalPrice}
                          </span>
                          <div className="px-1 md:px-1.5 py-0.5 bg-[#E6F0FF] rounded">
                            <span className="font-['Roboto',sans-serif] text-[7px] md:text-[10px] text-[#3D78CB]">
                              {Math.round(((parseFloat(service.originalPrice) - parseFloat(service.price)) / parseFloat(service.originalPrice)) * 100)}% OFF
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Price Display and Delivery Badge */}
                      <div className="flex items-center justify-between gap-1 md:gap-2 mb-2 md:mb-3">
                        <span className="font-['Roboto',sans-serif] text-[9px] md:text-[13px] text-[#5b5b5b]">
                          {service.originalPrice && "From "}
                          <span className="text-[13px] md:text-[18px] text-[#2c353f] font-medium">
                            £{service.price}
                          </span>
                          <span className="text-[8px] md:text-[13px]">/{service.priceUnit}</span>
                        </span>
                        
                        {/* Delivery Badge */}
                        <div className="flex-shrink-0">
                          {service.deliveryType === "same-day" ? (
                            <div className="inline-flex items-center px-1 md:px-2 py-0.5 bg-white border border-[#FE8A0F] text-[#FE8A0F] font-['Roboto',sans-serif] text-[6px] md:text-[9px] tracking-wide uppercase rounded-sm">
                              <span className="font-semibold">⚡ Same Day</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-0.5 px-1 md:px-2 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Roboto',sans-serif] text-[6px] md:text-[9px] tracking-wide uppercase rounded-sm">
                              <span className="font-semibold">Standard</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Stacked on mobile, side by side on desktop */}
                      <div className="flex flex-col md:flex-row gap-1.5 md:gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/service/${service.id}`);
                          }}
                          className="w-full h-[26px] md:h-[38px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_15px_rgba(254,138,15,0.6)] text-white rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                        >
                          <Zap className="w-3 h-3 md:w-4 md:h-4" />
                          <span>Buy Now!</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedServiceForCart(service);
                            setShowAddToCartModal(true);
                          }}
                          className="w-full h-[26px] md:h-[38px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_8px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                        >
                          <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                          <span>Add to cart</span>
                        </button>
                      </div>
                    </div>
                  </Link>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {displayServices.map((service) => (
                      <Link
                        key={`list-${service.id}`}
                        to={`/service/${service.id}`}
                        className="bg-white rounded-lg shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_12px_0px_rgba(254,138,15,0.3)] overflow-hidden transition-shadow duration-300 cursor-pointer flex min-h-[145px]"
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
                              <span className="bg-[#FE8A0F] text-white text-[8px] font-['Roboto',sans-serif] font-semibold px-1.5 py-0.5 rounded-full shadow-md">
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
                                <img
                                  src={service.providerImage}
                                  alt={service.tradingName}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className="font-['Roboto',sans-serif] text-[11px] text-[#2c353f] truncate">
                                  {service.tradingName}
                                </span>
                              </div>

                              {/* Description */}
                              <p className="font-['Roboto',sans-serif] text-[10px] text-[#5b5b5b] line-clamp-2">
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
                                    <span className="font-['Roboto',sans-serif] text-[9px] text-[#2c353f]">
                                      {service.rating}
                                    </span>
                                    <span className="font-['Roboto',sans-serif] text-[8px] text-[#8d8d8d]">
                                      ({service.completedTasks})
                                    </span>
                                  </div>
                                ) : (
                                  <div></div>
                                )}

                                {/* Delivery Badge */}
                                <div className="flex-shrink-0">
                                  {service.deliveryType === "same-day" ? (
                                    <div className="inline-flex items-center px-1.5 py-0.5 bg-white border border-[#FE8A0F] text-[#FE8A0F] font-['Roboto',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
                                      <span className="font-medium">⚡ Same Day</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Roboto',sans-serif] text-[7px] tracking-wide uppercase rounded-sm">
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
                          <div className="flex items-end justify-between gap-2 mt-auto">
                            {/* Price - Left Bottom */}
                            <div className="flex flex-col">
                              {service.originalPrice && (
                                <span className="font-['Roboto',sans-serif] text-[9px] text-[#c0c0c0] line-through">
                                  £{service.originalPrice}
                                </span>
                              )}
                              <span className="font-['Roboto',sans-serif] text-[9px] text-[#5b5b5b]">
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
                                  e.preventDefault();
                                  navigate(`/service/${service.id}`);
                                }}
                                className="h-[28px] w-[28px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_10px_rgba(254,138,15,0.5)] text-white rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedServiceForCart(service);
                                  setShowAddToCartModal(true);
                                }}
                                className="h-[28px] w-[28px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_6px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Roboto',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
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
