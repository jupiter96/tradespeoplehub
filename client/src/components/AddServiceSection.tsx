import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Card } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { 
  X, 
  Save, 
  Upload, 
  Image as ImageIcon,
  Plus,
  Trash2,
  Calendar,
  Clock,
  HelpCircle,
  User,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CheckCircle,
  TrendingUp,
  Loader2,
  FileText,
  Package,
  Settings,
  ImagePlus,
  MessageSquare,
  CalendarDays,
  UserCircle,
  ChevronRight,
  Check
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useSectors } from "../hooks/useSectorsAndCategories";
import { useAllServiceCategories } from "../hooks/useAllServiceCategories";
import type { ServiceCategory, ServiceSubCategory, Sector } from "../hooks/useSectorsAndCategories";
import { resolveApiUrl } from "../config/api";
import { useAccount } from "./AccountContext";
import AddressAutocomplete from "./AddressAutocomplete";

interface AddServiceSectionProps {
  onClose: () => void;
  onSave: (serviceData: any) => void;
  initialService?: any; // For editing existing service
}

// Complete category tree structure with Service Types and Attributes
type SubCategoryDetail = {
  name: string;
  serviceTypes: string[];
  attributes: {
    label: string;
    options: string[];
  };
};

type CategoryTree = {
  sector: string;
  sectorValue: string;
  mainCategories: {
    name: string;
    value: string;
    subCategories: SubCategoryDetail[];
  }[];
};

const CATEGORY_TREE: CategoryTree[] = [
  {
    sector: "Home & Garden",
    sectorValue: "home-garden",
    mainCategories: [
      {
        name: "Plumbing",
        value: "plumbing",
        subCategories: [
          {
            name: "Installing taps",
            serviceTypes: ["Emergency Install", "Standard Install", "Complete Replacement"],
            attributes: {
              label: "Tap Type",
              options: ["Single Tap", "Kitchen Mixer", "Bathroom Set", "Garden Tap"]
            }
          },
          {
            name: "Replacing WC",
            serviceTypes: ["Standard WC", "Wall Hung WC", "Back to Wall WC", "Close Coupled WC"],
            attributes: {
              label: "Property Type",
              options: ["Residential", "Commercial", "Public Facility"]
            }
          },
          {
            name: "Fixing leakage",
            serviceTypes: ["Emergency Repair", "Scheduled Fix", "Preventive Maintenance"],
            attributes: {
              label: "Severity",
              options: ["Minor Drip", "Moderate Leak", "Major Leak", "Burst Pipe"]
            }
          },
          {
            name: "Boiler repair",
            serviceTypes: ["Emergency Callout", "Annual Service", "Repair & Fix", "Full Replacement"],
            attributes: {
              label: "Boiler Type",
              options: ["Combi Boiler", "System Boiler", "Conventional Boiler", "Electric Boiler"]
            }
          },
          {
            name: "Pipe installation",
            serviceTypes: ["New Installation", "Pipe Replacement", "Extension Work"],
            attributes: {
              label: "Pipe Material",
              options: ["Copper", "PVC", "PEX", "Steel"]
            }
          },
          {
            name: "Drain unblocking",
            serviceTypes: ["Emergency Unblock", "Scheduled Clean", "CCTV Survey & Clear"],
            attributes: {
              label: "Drain Location",
              options: ["Kitchen", "Bathroom", "Outdoor", "Main Sewer"]
            }
          }
        ]
      },
      {
        name: "Electrical Work",
        value: "electrical",
        subCategories: [
          {
            name: "Socket installation",
            serviceTypes: ["Single Socket", "Double Socket", "USB Socket", "External Socket"],
            attributes: {
              label: "Location",
              options: ["Indoor", "Outdoor", "Garage", "Workshop"]
            }
          },
          {
            name: "Light fitting",
            serviceTypes: ["Ceiling Light", "Wall Light", "Pendant Light", "Downlights"],
            attributes: {
              label: "Number of Lights",
              options: ["1-2 Lights", "3-5 Lights", "6-10 Lights", "10+ Lights"]
            }
          },
          {
            name: "Fuse box repair",
            serviceTypes: ["Fuse Box Upgrade", "RCD Installation", "Circuit Repair", "Full Replacement"],
            attributes: {
              label: "Property Size",
              options: ["Studio/1 Bed", "2-3 Bed", "4+ Bed", "Commercial"]
            }
          },
          {
            name: "Rewiring",
            serviceTypes: ["Full House Rewire", "Partial Rewire", "Addition Circuit"],
            attributes: {
              label: "Property Type",
              options: ["Flat", "House", "Bungalow", "Commercial"]
            }
          },
          {
            name: "Emergency repairs",
            serviceTypes: ["Power Outage", "Faulty Socket", "Burning Smell", "Sparking"],
            attributes: {
              label: "Urgency",
              options: ["Immediate", "Same Day", "Within 24 Hours"]
            }
          }
        ]
      },
      {
        name: "Carpentry",
        value: "carpentry",
        subCategories: [
          {
            name: "Custom furniture",
            serviceTypes: ["Bespoke Table", "Wardrobe", "Bookshelf", "TV Unit"],
            attributes: {
              label: "Wood Type",
              options: ["Pine", "Oak", "MDF", "Plywood"]
            }
          },
          {
            name: "Door fitting",
            serviceTypes: ["Interior Door", "External Door", "Fire Door", "Bi-fold Door"],
            attributes: {
              label: "Number of Doors",
              options: ["1 Door", "2-3 Doors", "4-6 Doors", "7+ Doors"]
            }
          },
          {
            name: "Shelving",
            serviceTypes: ["Floating Shelves", "Built-in Shelving", "Alcove Shelves"],
            attributes: {
              label: "Material",
              options: ["Wood", "Glass", "Metal", "Composite"]
            }
          },
          {
            name: "Deck building",
            serviceTypes: ["Ground Level Deck", "Raised Deck", "Multi-level Deck"],
            attributes: {
              label: "Size",
              options: ["Small (up to 10m²)", "Medium (10-20m²)", "Large (20-40m²)", "Extra Large (40m²+)"]
            }
          },
          {
            name: "Cabinet making",
            serviceTypes: ["Kitchen Cabinets", "Bathroom Cabinets", "Storage Cabinets"],
            attributes: {
              label: "Finish",
              options: ["Painted", "Stained", "Varnished", "Natural"]
            }
          }
        ]
      },
      {
        name: "Painting & Decorating",
        value: "painting",
        subCategories: [
          {
            name: "Interior painting",
            serviceTypes: ["Single Room", "Multiple Rooms", "Full House", "Commercial"],
            attributes: {
              label: "Size",
              options: ["1 Bedroom", "2-3 Bedrooms", "4+ Bedrooms", "Commercial Space"]
            }
          },
          {
            name: "Exterior painting",
            serviceTypes: ["Full House", "Fascias & Soffits", "Render Painting", "Garage"],
            attributes: {
              label: "Building Type",
              options: ["Detached", "Semi-detached", "Terraced", "Flat"]
            }
          },
          {
            name: "Wallpapering",
            serviceTypes: ["Feature Wall", "Full Room", "Multiple Rooms", "Removal & Replacement"],
            attributes: {
              label: "Wallpaper Type",
              options: ["Standard", "Textured", "Vinyl", "Designer"]
            }
          },
          {
            name: "Decorative finishes",
            serviceTypes: ["Venetian Plaster", "Marbling", "Stenciling", "Murals"],
            attributes: {
              label: "Project Scale",
              options: ["Small (1 wall)", "Medium (1 room)", "Large (multiple rooms)"]
            }
          }
        ]
      },
      {
        name: "Gardening & Landscaping",
        value: "gardening",
        subCategories: [
          {
            name: "Lawn maintenance",
            serviceTypes: ["Regular Mowing", "Scarifying", "Fertilizing", "Full Lawn Care"],
            attributes: {
              label: "Size",
              options: ["Small (up to 50m²)", "Medium (50-150m²)", "Large (150-300m²)", "Extra Large (300m²+)"]
            }
          },
          {
            name: "Tree surgery",
            serviceTypes: ["Tree Pruning", "Tree Removal", "Stump Grinding", "Crown Reduction"],
            attributes: {
              label: "Size",
              options: ["Small (up to 5m)", "Medium (5-10m)", "Large (10-15m)", "Extra Large (15m+)"]
            }
          },
          {
            name: "Garden design",
            serviceTypes: ["Design Consultation", "Full Garden Redesign", "Planting Plan"],
            attributes: {
              label: "Style",
              options: ["Modern", "Traditional", "Cottage", "Japanese"]
            }
          },
          {
            name: "Patio installation",
            serviceTypes: ["Natural Stone", "Paving Slabs", "Block Paving", "Gravel"],
            attributes: {
              label: "Size",
              options: ["Small (up to 10m²)", "Medium (10-20m²)", "Large (20-40m²)", "Extra Large (40m²+)"]
            }
          }
        ]
      },
      {
        name: "Bathroom Fitting",
        value: "bathroom-fitting",
        subCategories: [
          {
            name: "Full bathroom installation",
            serviceTypes: ["Standard Suite", "Luxury Suite", "Wet Room", "Shower Room"],
            attributes: {
              label: "Bathroom Type",
              options: ["Ensuite", "Family Bathroom", "Downstairs WC", "Wet Room"]
            }
          },
          {
            name: "Shower fitting",
            serviceTypes: ["Electric Shower", "Mixer Shower", "Power Shower", "Walk-in Shower"],
            attributes: {
              label: "Shower Type",
              options: ["Over Bath", "Separate Enclosure", "Walk-in", "Wet Room"]
            }
          },
          {
            name: "Toilet replacement",
            serviceTypes: ["Standard WC", "Wall Hung", "Back to Wall", "Close Coupled"],
            attributes: {
              label: "Installation Type",
              options: ["Like-for-like", "Upgrade", "Relocation"]
            }
          },
          {
            name: "Sink installation",
            serviceTypes: ["Pedestal Basin", "Wall Hung", "Vanity Unit", "Counter Top"],
            attributes: {
              label: "Basin Type",
              options: ["Standard", "Large", "Double", "Corner"]
            }
          }
        ]
      },
      {
        name: "Kitchen Fitting",
        value: "kitchen-fitting",
        subCategories: [
          {
            name: "Full kitchen installation",
            serviceTypes: ["Standard Range", "Mid Range", "Luxury", "Bespoke"],
            attributes: {
              label: "Size",
              options: ["Small (up to 8m²)", "Medium (8-12m²)", "Large (12-20m²)", "Extra Large (20m²+)"]
            }
          },
          {
            name: "Worktop fitting",
            serviceTypes: ["Laminate", "Granite", "Quartz", "Solid Wood"],
            attributes: {
              label: "Worktop Length",
              options: ["Up to 3m", "3-6m", "6-10m", "10m+"]
            }
          },
          {
            name: "Cabinet installation",
            serviceTypes: ["Base Units Only", "Wall Units Only", "Full Set", "Larder Units"],
            attributes: {
              label: "Number of Units",
              options: ["1-5 Units", "6-10 Units", "11-15 Units", "16+ Units"]
            }
          },
          {
            name: "Appliance fitting",
            serviceTypes: ["Oven", "Hob", "Dishwasher", "Washing Machine"],
            attributes: {
              label: "Appliance Type",
              options: ["Built-in", "Freestanding", "Integrated"]
            }
          }
        ]
      },
      {
        name: "Home Cleaning",
        value: "cleaning",
        subCategories: [
          {
            name: "Deep cleaning",
            serviceTypes: ["One-off Deep Clean", "Spring Clean", "Post-renovation"],
            attributes: {
              label: "Size",
              options: ["Studio/1 Bed", "2 Bed", "3 Bed", "4+ Bed"]
            }
          },
          {
            name: "Regular cleaning",
            serviceTypes: ["Weekly", "Fortnightly", "Monthly"],
            attributes: {
              label: "Hours Needed",
              options: ["2 Hours", "3 Hours", "4 Hours", "5+ Hours"]
            }
          },
          {
            name: "End of tenancy",
            serviceTypes: ["Standard Clean", "Deep Clean", "With Carpet Clean"],
            attributes: {
              label: "Property Type",
              options: ["Flat", "House", "Studio", "Room"]
            }
          },
          {
            name: "Carpet cleaning",
            serviceTypes: ["Steam Clean", "Dry Clean", "Stain Removal"],
            attributes: {
              label: "Area Size",
              options: ["1 Room", "2-3 Rooms", "Whole House", "Stairs Only"]
            }
          }
        ]
      },
    ]
  },
  {
    sector: "Business Services",
    sectorValue: "business",
    mainCategories: [
      {
        name: "Business Consulting",
        value: "consulting",
        subCategories: [
          {
            name: "Strategy consulting",
            serviceTypes: ["Business Plan", "Market Entry", "Growth Strategy", "Digital Transformation"],
            attributes: {
              label: "Company Size",
              options: ["Startup", "Small (1-10)", "Medium (11-50)", "Large (50+)"]
            }
          },
          {
            name: "Management consulting",
            serviceTypes: ["Operations", "Process Improvement", "Change Management", "Project Management"],
            attributes: {
              label: "Project Duration",
              options: ["Short-term (1-3 months)", "Medium-term (3-6 months)", "Long-term (6+ months)"]
            }
          },
          {
            name: "Financial consulting",
            serviceTypes: ["Financial Planning", "Investment Advice", "Cost Reduction", "Funding Strategy"],
            attributes: {
              label: "Service Type",
              options: ["One-off Advice", "Monthly Retainer", "Project-based", "Annual Review"]
            }
          },
          {
            name: "HR consulting",
            serviceTypes: ["Recruitment", "HR Policies", "Training", "Employee Relations"],
            attributes: {
              label: "Employee Count",
              options: ["1-10 Employees", "11-50 Employees", "51-100 Employees", "100+ Employees"]
            }
          }
        ]
      },
      {
        name: "Marketing & Advertising",
        value: "marketing",
        subCategories: [
          {
            name: "Digital marketing",
            serviceTypes: ["Full Service", "Campaign Management", "Strategy Only", "Consulting"],
            attributes: {
              label: "Budget Range",
              options: ["Under £1k/month", "£1k-£5k/month", "£5k-£10k/month", "£10k+/month"]
            }
          },
          {
            name: "SEO",
            serviceTypes: ["Technical SEO", "On-page SEO", "Link Building", "Local SEO"],
            attributes: {
              label: "Website Size",
              options: ["Small (up to 50 pages)", "Medium (50-200 pages)", "Large (200-500 pages)", "Enterprise (500+ pages)"]
            }
          },
          {
            name: "Social media marketing",
            serviceTypes: ["Content Creation", "Account Management", "Paid Advertising", "Strategy"],
            attributes: {
              label: "Platforms",
              options: ["1 Platform", "2-3 Platforms", "4-5 Platforms", "All Platforms"]
            }
          },
          {
            name: "Content marketing",
            serviceTypes: ["Blog Writing", "Video Content", "Infographics", "Full Content Strategy"],
            attributes: {
              label: "Content Volume",
              options: ["1-5 pieces/month", "6-10 pieces/month", "11-20 pieces/month", "20+ pieces/month"]
            }
          },
          {
            name: "PPC advertising",
            serviceTypes: ["Google Ads", "Facebook Ads", "LinkedIn Ads", "Multi-platform"],
            attributes: {
              label: "Ad Spend",
              options: ["Under £1k/month", "£1k-£5k/month", "£5k-£10k/month", "£10k+/month"]
            }
          }
        ]
      },
      {
        name: "Web Development",
        value: "web-development",
        subCategories: [
          {
            name: "Website design",
            serviceTypes: ["Landing Page", "Business Website", "Portfolio Site", "Blog"],
            attributes: {
              label: "Number of Pages",
              options: ["1-5 Pages", "6-10 Pages", "11-20 Pages", "20+ Pages"]
            }
          },
          {
            name: "E-commerce development",
            serviceTypes: ["Shopify Store", "WooCommerce", "Custom Solution", "Marketplace"],
            attributes: {
              label: "Product Count",
              options: ["Under 50", "50-200", "200-1000", "1000+"]
            }
          },
          {
            name: "WordPress development",
            serviceTypes: ["New Site", "Redesign", "Migration", "Maintenance"],
            attributes: {
              label: "Complexity",
              options: ["Simple", "Moderate", "Complex", "Enterprise"]
            }
          },
          {
            name: "Custom web apps",
            serviceTypes: ["SaaS Application", "Internal Tool", "API Development", "Progressive Web App"],
            attributes: {
              label: "Project Size",
              options: ["Small (1-3 months)", "Medium (3-6 months)", "Large (6-12 months)", "Enterprise (12+ months)"]
            }
          }
        ]
      },
      {
        name: "Graphic Design",
        value: "graphic-design",
        subCategories: [
          {
            name: "Logo design",
            serviceTypes: ["Logo Only", "Logo + Variations", "Full Brand Kit", "Rebrand"],
            attributes: {
              label: "Deliverables",
              options: ["Basic Package", "Standard Package", "Premium Package", "Enterprise Package"]
            }
          },
          {
            name: "Branding",
            serviceTypes: ["Brand Identity", "Brand Guidelines", "Complete Rebrand", "Brand Refresh"],
            attributes: {
              label: "Scope",
              options: ["Logo + Colors", "Full Visual Identity", "Complete Brand Package", "Enterprise Branding"]
            }
          },
          {
            name: "Print design",
            serviceTypes: ["Business Cards", "Flyers", "Brochures", "Packaging"],
            attributes: {
              label: "Quantity",
              options: ["Single Item", "2-5 Items", "6-10 Items", "Full Set"]
            }
          },
          {
            name: "UI/UX design",
            serviceTypes: ["Mobile App", "Web App", "Website", "Dashboard"],
            attributes: {
              label: "Screen Count",
              options: ["1-10 Screens", "11-20 Screens", "21-50 Screens", "50+ Screens"]
            }
          }
        ]
      },
    ]
  },
  {
    sector: "Personal Services",
    sectorValue: "personal",
    mainCategories: [
      {
        name: "Personal Training",
        value: "personal-training",
        subCategories: [
          {
            name: "Weight loss training",
            serviceTypes: ["1-to-1 Sessions", "Group Sessions", "Online Coaching", "Hybrid"],
            attributes: {
              label: "Session Frequency",
              options: ["1x per week", "2-3x per week", "4-5x per week", "Daily"]
            }
          },
          {
            name: "Muscle building",
            serviceTypes: ["Strength Training", "Bodybuilding", "Powerlifting", "Athletic Performance"],
            attributes: {
              label: "Experience Level",
              options: ["Beginner", "Intermediate", "Advanced", "Competitive"]
            }
          },
          {
            name: "Home training",
            serviceTypes: ["No Equipment", "Basic Equipment", "Full Home Gym"],
            attributes: {
              label: "Space Available",
              options: ["Small Space", "Medium Space", "Large Space", "Outdoor"]
            }
          },
          {
            name: "Online coaching",
            serviceTypes: ["Video Calls", "App-based", "Email Support", "Full Programme"],
            attributes: {
              label: "Support Level",
              options: ["Basic Plan", "Standard Plan", "Premium Plan", "Elite Plan"]
            }
          }
        ]
      },
      {
        name: "Life Coaching",
        value: "life-coaching",
        subCategories: [
          {
            name: "Career coaching",
            serviceTypes: ["Career Change", "Promotion Strategy", "Interview Prep", "Leadership Development"],
            attributes: {
              label: "Session Type",
              options: ["Single Session", "4-week Programme", "3-month Programme", "6-month Programme"]
            }
          },
          {
            name: "Relationship coaching",
            serviceTypes: ["Individual", "Couples", "Family", "Dating"],
            attributes: {
              label: "Format",
              options: ["In-person", "Video Call", "Phone", "Mixed"]
            }
          },
          {
            name: "Personal development",
            serviceTypes: ["Confidence Building", "Habits & Routines", "Mindfulness", "Life Purpose"],
            attributes: {
              label: "Programme Length",
              options: ["4 weeks", "8 weeks", "12 weeks", "6 months"]
            }
          },
          {
            name: "Goal setting",
            serviceTypes: ["Business Goals", "Personal Goals", "Health Goals", "Financial Goals"],
            attributes: {
              label: "Coaching Style",
              options: ["Structured", "Flexible", "Intensive", "Supportive"]
            }
          }
        ]
      },
      {
        name: "Massage Therapy",
        value: "massage",
        subCategories: [
          {
            name: "Deep tissue massage",
            serviceTypes: ["30 minutes", "60 minutes", "90 minutes", "2 hours"],
            attributes: {
              label: "Focus Area",
              options: ["Full Body", "Back & Shoulders", "Lower Body", "Problem Areas"]
            }
          },
          {
            name: "Sports massage",
            serviceTypes: ["Pre-event", "Post-event", "Maintenance", "Injury Recovery"],
            attributes: {
              label: "Session Length",
              options: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"]
            }
          },
          {
            name: "Relaxation massage",
            serviceTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Indian Head"],
            attributes: {
              label: "Duration",
              options: ["30 minutes", "60 minutes", "90 minutes", "Full Day Spa"]
            }
          },
          {
            name: "Thai massage",
            serviceTypes: ["Traditional", "Oil Massage", "Foot Massage", "Combination"],
            attributes: {
              label: "Intensity",
              options: ["Gentle", "Moderate", "Firm", "Deep"]
            }
          }
        ]
      },
      {
        name: "Professional Organizing",
        value: "organizing",
        subCategories: [
          {
            name: "Home organization",
            serviceTypes: ["Single Room", "Multiple Rooms", "Whole House", "Garage/Attic"],
            attributes: {
              label: "Size",
              options: ["Studio/1 Bed", "2-3 Bed", "4+ Bed", "Large House"]
            }
          },
          {
            name: "Office organization",
            serviceTypes: ["Desk Organization", "Filing System", "Full Office", "Digital Organization"],
            attributes: {
              label: "Office Type",
              options: ["Home Office", "Small Office", "Medium Office", "Large Office"]
            }
          },
          {
            name: "Decluttering",
            serviceTypes: ["Consultation", "Hands-on Help", "Full Service", "Ongoing Support"],
            attributes: {
              label: "Scope",
              options: ["Single Area", "Multiple Areas", "Whole Property", "Storage Units"]
            }
          },
          {
            name: "Storage solutions",
            serviceTypes: ["Assessment", "Custom Solutions", "Installation", "Full Service"],
            attributes: {
              label: "Solution Type",
              options: ["Shelving", "Built-in", "Furniture", "Combination"]
            }
          }
        ]
      },
    ]
  },
  {
    sector: "Repair & Maintenance",
    sectorValue: "repair-maintenance",
    mainCategories: [
      {
        name: "Handyman Services",
        value: "handyman",
        subCategories: [
          {
            name: "General repairs",
            serviceTypes: ["Emergency Fix", "Scheduled Repair", "Multiple Tasks"],
            attributes: {
              label: "Property Type",
              options: ["Residential", "Commercial", "Rental Property"]
            }
          },
          {
            name: "Furniture assembly",
            serviceTypes: ["Flatpack", "IKEA", "Custom Furniture", "Office Furniture"],
            attributes: {
              label: "Number of Items",
              options: ["1-2 Items", "3-5 Items", "6-10 Items", "10+ Items"]
            }
          },
          {
            name: "Picture hanging",
            serviceTypes: ["Standard Hanging", "Gallery Wall", "Heavy Items", "Professional Install"],
            attributes: {
              label: "Wall Type",
              options: ["Plasterboard", "Brick", "Concrete", "Mixed"]
            }
          },
          {
            name: "Minor installations",
            serviceTypes: ["Shelf Install", "Curtain Rails", "TV Mounting", "Accessories"],
            attributes: {
              label: "Complexity",
              options: ["Simple", "Moderate", "Complex"]
            }
          }
        ]
      },
      {
        name: "Appliance Repair",
        value: "appliance-repair",
        subCategories: [
          {
            name: "Washing machine repair",
            serviceTypes: ["Not Spinning", "Not Draining", "Leaking", "Won't Start"],
            attributes: {
              label: "Machine Type",
              options: ["Front Loader", "Top Loader", "Washer-Dryer", "Commercial"]
            }
          },
          {
            name: "Refrigerator repair",
            serviceTypes: ["Not Cooling", "Leaking", "Noisy", "Ice Maker Issue"],
            attributes: {
              label: "Fridge Type",
              options: ["Standard", "American Style", "Undercounter", "Commercial"]
            }
          },
          {
            name: "Oven repair",
            serviceTypes: ["Not Heating", "Door Issue", "Fan Problem", "Electrical Fault"],
            attributes: {
              label: "Oven Type",
              options: ["Electric", "Gas", "Dual Fuel", "AGA/Range"]
            }
          },
          {
            name: "Dishwasher repair",
            serviceTypes: ["Not Cleaning", "Not Draining", "Leaking", "Won't Start"],
            attributes: {
              label: "Installation",
              options: ["Freestanding", "Integrated", "Slimline", "Commercial"]
            }
          }
        ]
      },
      {
        name: "HVAC Repair",
        value: "hvac",
        subCategories: [
          {
            name: "Air conditioning repair",
            serviceTypes: ["Not Cooling", "Leaking", "Noisy", "Annual Service"],
            attributes: {
              label: "System Type",
              options: ["Split System", "Ducted", "Portable", "Commercial"]
            }
          },
          {
            name: "Heating repair",
            serviceTypes: ["No Heat", "Poor Performance", "Thermostat Issue", "Annual Service"],
            attributes: {
              label: "Heating Type",
              options: ["Central Heating", "Radiators", "Underfloor", "Electric"]
            }
          },
          {
            name: "Boiler servicing",
            serviceTypes: ["Annual Service", "Safety Check", "Repair", "Full Service"],
            attributes: {
              label: "Boiler Type",
              options: ["Combi", "System", "Conventional", "Commercial"]
            }
          },
          {
            name: "Ventilation repair",
            serviceTypes: ["Extractor Fan", "Ducting", "Ventilation System", "Commercial HVAC"],
            attributes: {
              label: "Location",
              options: ["Kitchen", "Bathroom", "Whole House", "Commercial"]
            }
          }
        ]
      },
      {
        name: "Locksmith Services",
        value: "locksmith",
        subCategories: [
          {
            name: "Lock replacement",
            serviceTypes: ["Standard Lock", "Mortice Lock", "Smart Lock", "High Security"],
            attributes: {
              label: "Number of Locks",
              options: ["1 Lock", "2-3 Locks", "4-5 Locks", "6+ Locks"]
            }
          },
          {
            name: "Emergency lockout",
            serviceTypes: ["Home Lockout", "Car Lockout", "Office Lockout", "Safe Opening"],
            attributes: {
              label: "Urgency",
              options: ["Immediate", "Within 1 Hour", "Within 2 Hours"]
            }
          },
          {
            name: "Key cutting",
            serviceTypes: ["Standard Keys", "Car Keys", "Security Keys", "Specialist Keys"],
            attributes: {
              label: "Quantity",
              options: ["1-2 Keys", "3-5 Keys", "6-10 Keys", "10+ Keys"]
            }
          },
          {
            name: "Security upgrades",
            serviceTypes: ["Lock Upgrade", "Full System", "Access Control", "CCTV"],
            attributes: {
              label: "Property Type",
              options: ["Residential", "Small Business", "Commercial", "Industrial"]
            }
          }
        ]
      },
    ]
  },
  {
    sector: "Technology Services",
    sectorValue: "technology",
    mainCategories: [
      {
        name: "Computer Repair",
        value: "computer-repair",
        subCategories: ["Laptop repair", "Desktop repair", "Virus removal", "Data recovery"]
      },
      {
        name: "Web Development",
        value: "web-development",
        subCategories: ["Website design", "E-commerce development", "WordPress development", "Custom web apps"]
      },
      {
        name: "IT Support",
        value: "it-support",
        subCategories: ["Network troubleshooting", "Software installation", "Hardware setup", "Remote support"]
      },
      {
        name: "App Development",
        value: "app-development",
        subCategories: ["iOS development", "Android development", "Cross-platform apps", "App maintenance"]
      },
    ]
  },
  {
    sector: "Education & Tutoring",
    sectorValue: "education",
    mainCategories: [
      {
        name: "Math Tutoring",
        value: "math-tutoring",
        subCategories: ["Primary maths", "GCSE maths", "A-Level maths", "Adult numeracy"]
      },
      {
        name: "English Tutoring",
        value: "english-tutoring",
        subCategories: ["Primary English", "GCSE English", "IELTS preparation", "Creative writing"]
      },
      {
        name: "Music Lessons",
        value: "music-lessons",
        subCategories: ["Piano lessons", "Guitar lessons", "Vocal training", "Music theory"]
      },
      {
        name: "Language Tutoring",
        value: "language-tutoring",
        subCategories: ["Spanish lessons", "French lessons", "Mandarin lessons", "German lessons"]
      },
    ]
  },
  {
    sector: "Beauty & Wellness",
    sectorValue: "beauty-wellness",
    mainCategories: [
      {
        name: "Hair Styling",
        value: "hair-styling",
        subCategories: ["Haircuts", "Hair coloring", "Hair extensions", "Styling for events"]
      },
      {
        name: "Makeup Services",
        value: "makeup",
        subCategories: ["Bridal makeup", "Party makeup", "Makeup lessons", "Special effects makeup"]
      },
      {
        name: "Nail Services",
        value: "nail-services",
        subCategories: ["Manicure", "Pedicure", "Gel nails", "Nail art"]
      },
      {
        name: "Spa Treatments",
        value: "spa-treatments",
        subCategories: ["Facials", "Body treatments", "Waxing", "Aromatherapy"]
      },
    ]
  },
  {
    sector: "Health & Wellness",
    sectorValue: "health-wellness",
    mainCategories: [
      {
        name: "Nutrition Counseling",
        value: "nutrition",
        subCategories: ["Diet planning", "Weight management", "Sports nutrition", "Meal prep advice"]
      },
      {
        name: "Physiotherapy",
        value: "physiotherapy",
        subCategories: ["Sports injuries", "Back pain treatment", "Post-surgery rehab", "Mobility improvement"]
      },
      {
        name: "Yoga & Pilates",
        value: "yoga",
        subCategories: ["Beginner yoga", "Advanced yoga", "Pilates classes", "Private sessions"]
      },
      {
        name: "Mental Health Support",
        value: "therapy",
        subCategories: ["Counseling", "CBT therapy", "Stress management", "Anxiety support"]
      },
    ]
  },
  {
    sector: "Legal & Financial",
    sectorValue: "legal-financial",
    mainCategories: [
      {
        name: "Legal Advice",
        value: "legal-advice",
        subCategories: ["Family law", "Property law", "Employment law", "Contract review"]
      },
      {
        name: "Accounting Services",
        value: "accounting",
        subCategories: ["Bookkeeping", "Tax returns", "Payroll services", "Financial statements"]
      },
      {
        name: "Financial Planning",
        value: "financial-planning",
        subCategories: ["Retirement planning", "Investment advice", "Mortgage advice", "Debt management"]
      },
      {
        name: "Tax Services",
        value: "tax-services",
        subCategories: ["Personal tax", "Business tax", "VAT returns", "Tax planning"]
      },
    ]
  },
  {
    sector: "Event Services",
    sectorValue: "events",
    mainCategories: [
      {
        name: "Event Photography",
        value: "photography",
        subCategories: ["Wedding photography", "Corporate events", "Birthday parties", "Portrait photography"]
      },
      {
        name: "Catering Services",
        value: "catering",
        subCategories: ["Wedding catering", "Corporate catering", "Party catering", "Dietary specific catering"]
      },
      {
        name: "DJ Services",
        value: "dj-services",
        subCategories: ["Wedding DJ", "Party DJ", "Corporate events", "Equipment hire"]
      },
      {
        name: "Event Planning",
        value: "event-planning",
        subCategories: ["Wedding planning", "Corporate events", "Birthday parties", "Full event coordination"]
      },
    ]
  },
  {
    sector: "Pet Services",
    sectorValue: "pets",
    mainCategories: [
      {
        name: "Pet Grooming",
        value: "pet-grooming",
        subCategories: ["Dog grooming", "Cat grooming", "Nail trimming", "Bathing"]
      },
      {
        name: "Dog Walking",
        value: "dog-walking",
        subCategories: ["Individual walks", "Group walks", "Puppy walking", "Senior dog care"]
      },
      {
        name: "Pet Sitting",
        value: "pet-sitting",
        subCategories: ["Home visits", "Overnight care", "Holiday care", "Multiple pets"]
      },
      {
        name: "Pet Training",
        value: "pet-training",
        subCategories: ["Puppy training", "Obedience training", "Behavior correction", "Agility training"]
      },
    ]
  },
  {
    sector: "Automotive",
    sectorValue: "automotive",
    mainCategories: [
      {
        name: "Car Repair",
        value: "car-repair",
        subCategories: ["Engine repair", "Brake repair", "Transmission repair", "Electrical repair"]
      },
      {
        name: "Car Maintenance",
        value: "car-maintenance",
        subCategories: ["Oil changes", "Tire rotation", "MOT preparation", "Brake servicing"]
      },
      {
        name: "Car Detailing",
        value: "car-detailing",
        subCategories: ["Interior cleaning", "Exterior wash", "Paint correction", "Ceramic coating"]
      },
      {
        name: "Bodywork & Paint",
        value: "bodywork",
        subCategories: ["Dent removal", "Scratch repair", "Full respray", "Panel replacement"]
      },
    ]
  },
  {
    sector: "Moving & Storage",
    sectorValue: "moving-storage",
    mainCategories: [
      {
        name: "Moving Services",
        value: "moving-services",
        subCategories: ["House removals", "Office removals", "Single item moves", "International moves"]
      },
      {
        name: "Packing Services",
        value: "packing",
        subCategories: ["Full packing service", "Fragile item packing", "Unpacking service", "Packing materials"]
      },
      {
        name: "Storage Solutions",
        value: "storage",
        subCategories: ["Self storage", "Container storage", "Document storage", "Long-term storage"]
      },
      {
        name: "Furniture Assembly",
        value: "furniture-assembly",
        subCategories: ["Flat pack assembly", "Office furniture", "Bedroom furniture", "Disassembly service"]
      },
    ]
  },
];

// UK Cities for location
const UK_LOCATIONS = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Glasgow",
  "Liverpool",
  "Newcastle",
  "Sheffield",
  "Bristol",
  "Edinburgh",
  "Leicester",
  "Nottingham",
  "Southampton",
  "Cardiff",
  "Belfast",
  "Other"
];

// Service title suggestions by category
const TITLE_SUGGESTIONS: { [key: string]: string[] } = {
  "Plumbing": [
    "Emergency Plumbing Repair",
    "Bathroom Installation",
    "Boiler Repair & Servicing",
    "Leak Detection & Repair",
    "Pipe Installation"
  ],
  "Electrical Work": [
    "Electrical Installation",
    "Rewiring Service",
    "Lighting Installation",
    "Fuse Box Upgrade",
    "Electrical Testing"
  ],
  "Carpentry": [
    "Custom Furniture Making",
    "Door Installation",
    "Kitchen Fitting",
    "Flooring Installation",
    "Shelving & Storage"
  ],
  "Painting & Decorating": [
    "Interior Painting",
    "Exterior Painting",
    "Wallpapering",
    "Decorating Consultation",
    "Commercial Painting"
  ],
  "Gardening & Landscaping": [
    "Garden Design",
    "Lawn Mowing & Maintenance",
    "Hedge Trimming",
    "Landscaping Project",
    "Tree Surgery"
  ],
  "Cleaning": [
    "Deep Cleaning",
    "End of Tenancy Cleaning",
    "Carpet Cleaning",
    "Window Cleaning",
    "Commercial Cleaning"
  ]
};



// Admin-defined Service Highlights options
const SERVICE_HIGHLIGHTS_OPTIONS = [
  { id: "highlight-1", label: "Professional and experienced service provider" },
  { id: "highlight-2", label: "High-quality materials and equipment" },
  { id: "highlight-3", label: "Personalized consultation" },
  { id: "highlight-4", label: "Satisfaction guarantee" },
  { id: "highlight-5", label: "Same-day service available" },
  { id: "highlight-6", label: "Follow-up support" },
  { id: "highlight-7", label: "24/7 emergency support" },
  { id: "highlight-8", label: "Fully insured and certified" },
  { id: "highlight-9", label: "Free initial consultation" },
  { id: "highlight-10", label: "Competitive pricing" },
  { id: "highlight-11", label: "Eco-friendly practices" },
  { id: "highlight-12", label: "Licensed professionals" },
  { id: "highlight-13", label: "Money-back guarantee" },
  { id: "highlight-14", label: "No hidden fees" },
  { id: "highlight-15", label: "Flexible scheduling" },
  { id: "highlight-16", label: "Quality workmanship guaranteed" },
  { id: "highlight-17", label: "Fast response time" },
  { id: "highlight-18", label: "Local trusted professional" },
  { id: "highlight-19", label: "Free quote provided" },
  { id: "highlight-20", label: "All work guaranteed" },
];

interface ExtraService {
  id: string;
  title: string;
  price: string;
  description: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  deliveryDays: string;
  revisions: string;
  features: string[];
  order: number;
}

// Component for displaying a single level of subcategories with radio buttons
function SubCategoryLevelDisplay({
  parentSubCategoryId,
  levelIndex,
  selectedSubCategoryPath,
  setSelectedSubCategoryPath,
  nestedSubCategories,
  setNestedSubCategories,
  loadingSubCategories,
  setLoadingSubCategories,
  selectedAttributes,
  setSelectedAttributes,
  attributeTypeLabels,
}: {
  parentSubCategoryId: string;
  levelIndex: number;
  selectedSubCategoryPath: string[];
  setSelectedSubCategoryPath: React.Dispatch<React.SetStateAction<string[]>>;
  nestedSubCategories: Record<string, ServiceSubCategory[]>;
  setNestedSubCategories: React.Dispatch<React.SetStateAction<Record<string, ServiceSubCategory[]>>>;
  loadingSubCategories: Record<string, boolean>;
  setLoadingSubCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedAttributes: Record<string, string>;
  setSelectedAttributes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  attributeTypeLabels: Record<string, string>;
}) {
  const currentLevelSubCats = nestedSubCategories[parentSubCategoryId] || [];
  const isLoading = loadingSubCategories[parentSubCategoryId];

  // Fetch nested subcategories when needed
  useEffect(() => {
    const fetchNestedSubCategories = async (parentId: string) => {
      if (nestedSubCategories[parentId] || loadingSubCategories[parentId]) {
        return;
      }

      try {
        setLoadingSubCategories(prev => ({ ...prev, [parentId]: true }));
        const { resolveApiUrl } = await import("../config/api");
        const response = await fetch(
          resolveApiUrl(`/api/service-subcategories?parentSubCategoryId=${parentId}&activeOnly=true&sortBy=order&sortOrder=asc&limit=1000`),
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const subCats = (data.serviceSubCategories || []).filter((sc: ServiceSubCategory) => 
            sc?._id && sc._id.trim() !== ""
          );
          setNestedSubCategories(prev => ({ ...prev, [parentId]: subCats }));
        }
      } catch (error) {
        // console.error(`Error fetching nested subcategories for ${parentId}:`, error);
      } finally {
        setLoadingSubCategories(prev => ({ ...prev, [parentId]: false }));
      }
    };

    if (parentSubCategoryId) {
      fetchNestedSubCategories(parentSubCategoryId);
    }
  }, [parentSubCategoryId]);

  // Group subcategories by attributeType
  const subCategoriesByAttributeType = currentLevelSubCats.reduce((acc, subCat) => {
    const attrType = subCat.attributeType || 'other';
    if (!acc[attrType]) {
      acc[attrType] = [];
    }
    acc[attrType].push(subCat);
    return acc;
  }, {} as Record<string, ServiceSubCategory[]>);

  const handleSelectionChange = (value: string) => {
    // Update path: keep previous selections up to this level, then add new selection
    const newPath = selectedSubCategoryPath.slice(0, levelIndex);
    newPath.push(value);
    setSelectedSubCategoryPath(newPath);
    
    // Update selectedSubCategoryId to the last selected item
    if (newPath.length > 0) {
      // This will be handled by parent component
    }
    
    // Clear deeper selections and attributes
    const newAttributes = { ...selectedAttributes };
    Object.keys(newAttributes).forEach(key => {
      if (key.startsWith(`${value}_`)) {
        delete newAttributes[key];
      }
    });
    setSelectedAttributes(newAttributes);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#FE8A0F]" />
        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">Loading options...</span>
      </div>
    );
  }

  if (Object.keys(subCategoriesByAttributeType).length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      {Object.entries(subCategoriesByAttributeType).map(([attrType, subCats]) => {
        const label = attributeTypeLabels[attrType] || attrType;
        const sortedSubCats = subCats.sort((a, b) => (a.order || 0) - (b.order || 0));
        const groupName = `${parentSubCategoryId}_${levelIndex}_${attrType}`;
        // Get selected value for this level (check if any subcat in this group is selected)
        const selectedInThisGroup = sortedSubCats.find(sc => selectedSubCategoryPath[levelIndex] === sc._id)?._id || "";

        return (
          <div key={attrType} className="space-y-2">
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
              {label} <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={selectedInThisGroup}
              onValueChange={handleSelectionChange}
              className="grid grid-cols-2 gap-3"
            >
              {sortedSubCats.map((subCat) => {
                const isSelected = selectedInThisGroup === subCat._id;
                return (
                  <label
                    key={subCat._id}
                    htmlFor={`${groupName}_${subCat._id}`}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-[#FE8A0F] bg-[#FFF5EB] shadow-md' 
                        : 'border-gray-200 bg-white hover:border-[#FE8A0F]/50 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <RadioGroupItem 
                        value={subCat._id} 
                        id={`${groupName}_${subCat._id}`}
                        className={`
                          ${isSelected ? 'border-[#FE8A0F]' : ''} shrink-0
                        `}
                      />
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium truncate">
                        {subCat.name || "Unnamed Option"}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FE8A0F] ml-2 shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}

export default function AddServiceSection({ onClose, onSave, initialService }: AddServiceSectionProps) {
  const { userInfo } = useAccount();

  // Check if user is a professional
  useEffect(() => {
    if (userInfo && userInfo.role !== 'professional') {
      toast.error('Only professionals can create services');
      onClose();
    }
  }, [userInfo, onClose]);

  const [activeTab, setActiveTab] = useState("service-details");
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialService?._id || null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const isEditMode = !!initialService;
  
  // Fetch sectors and service categories
  const { sectors } = useSectors(false, false);
  const { serviceCategoriesBySector, loading: categoriesLoading } = useAllServiceCategories(sectors, {
    includeSubCategories: true,
  });
  
  // Service Details Tab
  // Get user's sector from registration and set as default (cannot be changed)
  const userSector = userInfo?.sector;
  const userSectorObj = sectors.find((s: Sector) => s.name === userSector);
  const defaultSectorId = userSectorObj?._id || "";
  
  const [selectedSectorId, setSelectedSectorId] = useState<string>(defaultSectorId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(""); // ServiceCategory ID
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>(""); // ServiceSubCategory ID (first level only)
  const [selectedSubCategoryPath, setSelectedSubCategoryPath] = useState<string[]>([]); // Path of selected subcategory IDs (one per level)
  const [nestedSubCategories, setNestedSubCategories] = useState<Record<string, ServiceSubCategory[]>>({}); // Nested subcategories by parent ID
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({}); // Selected attribute values by level (single select)
  const [loadingSubCategories, setLoadingSubCategories] = useState<Record<string, boolean>>({});
  const [selectedSubCategoryTitles, setSelectedSubCategoryTitles] = useState<string[]>([]); // Titles for the selected subcategory
  const [loadingTitles, setLoadingTitles] = useState<boolean>(false);
  
  // Resolve currently selected service category (for dynamic price unit options)
  const currentServiceCategory = useMemo(() => {
    if (!selectedSectorId || !selectedCategoryId) return null;
    const categoriesForSector = serviceCategoriesBySector[selectedSectorId] || [];
    return categoriesForSector.find((c) => c._id === selectedCategoryId) || null;
  }, [serviceCategoriesBySector, selectedSectorId, selectedCategoryId]);

  const priceUnitOptions = useMemo(() => {
    // Only use units explicitly configured on the selected service category.
    if (
      !currentServiceCategory ||
      !currentServiceCategory.pricePerUnit?.enabled ||
      !Array.isArray(currentServiceCategory.pricePerUnit.units)
    ) {
      return [] as { value: string; label: string }[];
    }

    const units = [...currentServiceCategory.pricePerUnit.units].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    const options: { value: string; label: string }[] = [];
    for (const unit of units) {
      if (!unit.name) continue;
      const value = unit.name;
      if (!options.some((o) => o.value === value)) {
        options.push({ value, label: unit.name });
      }
    }

    return options;
  }, [currentServiceCategory]);
  
  // Set default sector when sectors are loaded (only if user has a registered sector)
  useEffect(() => {
    if (userSector && defaultSectorId && selectedSectorId !== defaultSectorId) {
      setSelectedSectorId(defaultSectorId);
    }
  }, [userSector, defaultSectorId]);

  // Set default address fields from userInfo (only once on mount)
  useEffect(() => {
    if (userInfo) {
      if (userInfo.address) {
        setAddress(userInfo.address);
      }
      if (userInfo.townCity) {
        setTownCity(userInfo.townCity);
      }
      if (userInfo.county) {
        setCounty(userInfo.county);
      }
      if (userInfo.postcode) {
        setPostcode(userInfo.postcode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?._id]); // Only run when userInfo._id changes (user changes)

  // Load profile data from userInfo (About Me, Qualifications, Certifications)
  useEffect(() => {
    if (userInfo) {
      // Load About Me (bio)
      const bio = userInfo.publicProfile?.bio || userInfo.aboutService || "";
      setAboutMe(bio);

      // Load Qualifications
      const quals = (userInfo.publicProfile as any)?.qualifications;
      if (quals) {
        const qualsArray = typeof quals === 'string'
          ? quals.split('\n').filter((q: string) => q.trim())
          : Array.isArray(quals)
          ? quals
          : [];
        setProfileQualifications(qualsArray.length > 0 ? qualsArray : [""]);
      } else {
        setProfileQualifications([""]);
      }

      // Load Certifications
      const certs = (userInfo.publicProfile as any)?.certifications;
      if (certs) {
        const certsArray = typeof certs === 'string'
          ? certs.split('\n').filter((c: string) => c.trim())
          : Array.isArray(certs)
          ? certs
          : [];
        setProfileCertifications(certsArray.length > 0 ? certsArray : [""]);
      } else {
        setProfileCertifications([""]);
      }
    }
  }, [userInfo]);

  // Load latest draft when component mounts (only if not in edit mode)
  useEffect(() => {
    const loadLatestDraft = async () => {
      if (isEditMode || !userInfo?.id || draftLoaded) return;

      setLoadingDraft(true);
      try {
        const { resolveApiUrl } = await import("../config/api");
        const response = await fetch(
          resolveApiUrl("/api/services?status=draft&limit=1&sort=-updatedAt"),
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.services && data.services.length > 0) {
            const draft = data.services[0];

            // Ask user if they want to continue with the draft
            const shouldContinue = window.confirm(
              `You have an unfinished service draft "${draft.title || 'Untitled Draft'}". Would you like to continue editing it?`
            );

            if (shouldContinue) {
              // Load draft data into form
              setDraftId(draft._id);
              setServiceTitle(draft.title || "");
              setDescription(draft.description || "");
              setBasePrice(draft.price?.toString() || "");
              setOriginalPrice(draft.originalPrice?.toString() || "");
              setPriceUnit(draft.priceUnit || "fixed");
              setDeliveryType(draft.deliveryType || "standard");
              setResponseTime(draft.responseTime || "");

              // Set address fields
              if (draft.address) setAddress(draft.address);
              if (draft.townCity) setTownCity(draft.townCity);
              if (draft.county) setCounty(draft.county);
              if (draft.postcode) setPostcode(draft.postcode);

              // Set keywords/skills
              if (draft.skills && Array.isArray(draft.skills)) {
                setKeywords(draft.skills.join(", "));
              }

              // Set gallery images
              if (draft.images && Array.isArray(draft.images)) {
                setGalleryImages(draft.images);
              }

              // Set packages
              if (draft.packages && Array.isArray(draft.packages)) {
                setPackages(draft.packages);
              }

              // Set extra services (addons)
              if (draft.addons && Array.isArray(draft.addons)) {
                const mappedExtras = draft.addons.map((addon: any) => ({
                  id: addon.id || crypto.randomUUID(),
                  title: addon.name || "",
                  description: addon.description || "",
                  price: addon.price?.toString() || "",
                }));
                setExtraServices(mappedExtras);
              }

              // Set category and subcategory
              if (draft.serviceCategoryId) {
                setSelectedCategoryId(draft.serviceCategoryId);
              }
              if (draft.serviceSubCategoryPath && Array.isArray(draft.serviceSubCategoryPath)) {
                setSelectedSubCategoryPath(draft.serviceSubCategoryPath);
              }

              // Load years of experience if stored on the draft
              if (typeof draft.experienceYears === "number" || typeof draft.experienceYears === "string") {
                setExperienceYears(draft.experienceYears.toString());
              }

              setLastSaved(new Date(draft.updatedAt));
            }
          }
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      } finally {
        setLoadingDraft(false);
        setDraftLoaded(true);
      }
    };

    loadLatestDraft();
  }, [userInfo?.id, isEditMode, draftLoaded]);

  // Initialize form with existing service data when editing
  useEffect(() => {
    if (initialService && isEditMode) {
      // Set basic fields
      setServiceTitle(initialService.title || "");
      setDescription(initialService.description || "");
      setBasePrice(initialService.price?.toString() || "");
      setOriginalPrice(initialService.originalPrice?.toString() || "");
      setPriceUnit(initialService.priceUnit || "fixed");
      setDeliveryType(initialService.deliveryType || "standard");
      setResponseTime(initialService.responseTime || "");
      if (initialService.experienceYears !== undefined && initialService.experienceYears !== null) {
        setExperienceYears(initialService.experienceYears.toString());
      }
      
      // Set address fields
      if (initialService.address) setAddress(initialService.address);
      if (initialService.townCity) setTownCity(initialService.townCity);
      if (initialService.county) setCounty(initialService.county);
      if (initialService.postcode) setPostcode(initialService.postcode);
      
      // Set keywords/skills
      if (initialService.skills && Array.isArray(initialService.skills)) {
        setKeywords(initialService.skills.join(", "));
      }
      
      // Set idealFor - will be mapped after dynamic data loads
      // This will be handled by a separate useEffect after dynamicServiceIdealFor is loaded
      
      // Set service highlights
      if (initialService.highlights && Array.isArray(initialService.highlights)) {
        // Wait for dynamic attributes to load, then map highlights
        // This will be handled by a separate useEffect after dynamicServiceAttributes is loaded
        // For now, just store the raw labels temporarily
        const highlightIds = initialService.highlights.map((label: string) => {
          const option = SERVICE_HIGHLIGHTS_OPTIONS.find(opt => opt.label === label);
          return option?.id || "";
        }).filter(Boolean);
        setServiceHighlights(highlightIds);
      }
      
      // Set gallery images
      if (initialService.images && Array.isArray(initialService.images)) {
        setGalleryImages(initialService.images);
      } else if (initialService.portfolioImages && Array.isArray(initialService.portfolioImages)) {
        setGalleryImages(initialService.portfolioImages);
      }
      
      // Set extra services (addons)
      if (initialService.addons && Array.isArray(initialService.addons)) {
        const mappedAddons = initialService.addons.map((addon: any, index: number) => ({
          id: addon.id || `extra-${index}`,
          title: addon.name || addon.title || "",
          price: addon.price?.toString() || "",
          description: addon.description || "",
        }));
        setExtraServices(mappedAddons);
      }
      
      // Set FAQs
      if (initialService.faqs && Array.isArray(initialService.faqs)) {
        const mappedFAQs = initialService.faqs.map((faq: any, index: number) => ({
          id: faq.id || `faq-${index}`,
          question: faq.question || "",
          answer: faq.answer || "",
        }));
        setFAQs(mappedFAQs);
      }
      
      // Set availability
      if (initialService.availability) {
        setAvailability(initialService.availability);
      }
      
      // Set category and subcategory
      if (initialService.serviceCategory) {
        const categoryId = typeof initialService.serviceCategory === 'object' 
          ? initialService.serviceCategory._id 
          : initialService.serviceCategory;
        setSelectedCategoryId(categoryId);
      }
      
      if (initialService.serviceSubCategory) {
        const subCategoryId = typeof initialService.serviceSubCategory === 'object' 
          ? initialService.serviceSubCategory._id 
          : initialService.serviceSubCategory;
        setSelectedSubCategoryId(subCategoryId);
      }
      
      // Set subcategory path if available
      if (initialService.serviceSubCategoryPath && Array.isArray(initialService.serviceSubCategoryPath)) {
        setSelectedSubCategoryPath(initialService.serviceSubCategoryPath);
      }
    }
  }, [initialService, isEditMode]);
  const [serviceTitle, setServiceTitle] = useState("");
  const [address, setAddress] = useState("");
  const [townCity, setTownCity] = useState("");
  const [county, setCounty] = useState("");
  const [postcode, setPostcode] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [idealFor, setIdealFor] = useState<string[]>([]);
  const [serviceHighlights, setServiceHighlights] = useState<string[]>([]);
  const [dynamicServiceAttributes, setDynamicServiceAttributes] = useState<string[]>([]);
  const [dynamicServiceIdealFor, setDynamicServiceIdealFor] = useState<string[]>([]);
  const [dynamicExtraServices, setDynamicExtraServices] = useState<Array<{ name: string; price: number; days: number }>>([]);
  const [deliveryType, setDeliveryType] = useState<"standard" | "same-day">("standard");

  // Fetch service attributes from all levels when subcategory path changes
  useEffect(() => {
    const fetchServiceAttributes = async () => {
      if (selectedSubCategoryPath.length === 0) {
        setDynamicServiceAttributes([]);
        return;
      }

      try {
        // Fetch attributes from all subcategories in the path
        const allAttributes: string[] = [];

        for (const subCategoryId of selectedSubCategoryPath) {
          const response = await fetch(
            resolveApiUrl(`/api/service-subcategories/${subCategoryId}`),
            { credentials: "include" }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.serviceSubCategory?.serviceAttributes && Array.isArray(data.serviceSubCategory.serviceAttributes)) {
              // Add attributes from this level (avoid duplicates)
              data.serviceSubCategory.serviceAttributes.forEach((attr: string) => {
                if (attr && !allAttributes.includes(attr)) {
                  allAttributes.push(attr);
                }
              });
            }
          }
        }

        setDynamicServiceAttributes(allAttributes);
      } catch (error) {
        // console.error("Error fetching service attributes:", error);
        setDynamicServiceAttributes([]);
      }
    };

    fetchServiceAttributes();
  }, [selectedSubCategoryPath]);

  // Fetch service ideal for and extra services from selected category
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!selectedCategoryId) {
        setDynamicServiceIdealFor([]);
        setDynamicExtraServices([]);
        return;
      }

      try {
        const response = await fetch(
          resolveApiUrl(`/api/service-categories/${selectedCategoryId}`),
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();

          // Set service ideal for options
          if (data.serviceCategory?.serviceIdealFor && Array.isArray(data.serviceCategory.serviceIdealFor)) {
            const idealForOptions = data.serviceCategory.serviceIdealFor
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((item: any) => item.name);
            setDynamicServiceIdealFor(idealForOptions);
          } else {
            setDynamicServiceIdealFor([]);
          }

          // Set extra services
          if (data.serviceCategory?.extraServices && Array.isArray(data.serviceCategory.extraServices)) {
            const extras = data.serviceCategory.extraServices
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((item: any) => ({
                name: item.name,
                price: item.price,
                days: item.days
              }));
            setDynamicExtraServices(extras);
          } else {
            setDynamicExtraServices([]);
          }
        }
      } catch (error) {
        // console.error("Error fetching category data:", error);
        setDynamicServiceIdealFor([]);
        setDynamicExtraServices([]);
      }
    };

    fetchCategoryData();
  }, [selectedCategoryId]);

  // Map initialService idealFor to dynamic data after they're loaded
  useEffect(() => {
    if (isEditMode && initialService?.idealFor && dynamicServiceIdealFor.length > 0) {
      const idealForIds = initialService.idealFor.map((label: string) => {
        const index = dynamicServiceIdealFor.indexOf(label);
        return index !== -1 ? `ideal-${index}` : "";
      }).filter(Boolean);
      setIdealFor(idealForIds);
    }
  }, [dynamicServiceIdealFor, isEditMode, initialService]);

  // Map initialService highlights to dynamic attributes after they're loaded
  useEffect(() => {
    if (isEditMode && initialService?.highlights && dynamicServiceAttributes.length > 0) {
      const highlightIds = initialService.highlights.map((label: string) => {
        // First check if it's in dynamic attributes
        const dynamicIndex = dynamicServiceAttributes.indexOf(label);
        if (dynamicIndex !== -1) {
          return `dynamic-attr-${dynamicIndex}`;
        }
        // Fallback to static options
        const option = SERVICE_HIGHLIGHTS_OPTIONS.find(opt => opt.label === label);
        return option?.id || "";
      }).filter(Boolean);
      setServiceHighlights(highlightIds);
    }

    // Load base price, sale price, and valid-until when editing an existing service
    if (isEditMode && initialService) {
      if (typeof initialService.price === "number") {
        setBasePrice(initialService.price.toString());
      }
      if (typeof initialService.originalPrice === "number") {
        setOriginalPrice(initialService.originalPrice.toString());
      }
      if (initialService.originalPriceValidUntil) {
        const d = new Date(initialService.originalPriceValidUntil);
        if (!Number.isNaN(d.getTime())) {
          setSaleValidUntil(d.toISOString().split("T")[0]);
        }
      }
    }
  }, [dynamicServiceAttributes, isEditMode, initialService]);
  const [basePrice, setBasePrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [saleValidUntil, setSaleValidUntil] = useState("");
  const [showSaleValidUntilPicker, setShowSaleValidUntilPicker] = useState(false);
  // NOTE: Do not preselect any price unit for new services.
  // It will be chosen explicitly by the user once a category is selected.
  const [priceUnit, setPriceUnit] = useState("");
  
  // Packages Tab
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  
  // Extra Services Tab
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  
  // Gallery Tab
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Record<number, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FAQs Tab
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  
  // Availability Tab - Multiple time blocks per day
  type TimeBlock = {
    id: string;
    from: string;
    to: string;
  };
  
  type DayAvailability = {
    enabled: boolean;
    blocks: TimeBlock[];
  };
  
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({
    monday: { enabled: true, blocks: [{ id: "mon-1", from: "09:00", to: "17:00" }] },
    tuesday: { enabled: true, blocks: [{ id: "tue-1", from: "09:00", to: "17:00" }] },
    wednesday: { enabled: true, blocks: [{ id: "wed-1", from: "09:00", to: "17:00" }] },
    thursday: { enabled: true, blocks: [{ id: "thu-1", from: "09:00", to: "17:00" }] },
    friday: { enabled: true, blocks: [{ id: "fri-1", from: "09:00", to: "17:00" }] },
    saturday: { enabled: false, blocks: [] },
    sunday: { enabled: false, blocks: [] }
  });

  // Availability helper functions
  const addTimeBlock = (day: string) => {
    const newBlockId = `${day.slice(0, 3)}-${Date.now()}`;
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        blocks: [...availability[day].blocks, { id: newBlockId, from: "09:00", to: "17:00" }]
      }
    });
  };

  const removeTimeBlock = (day: string, blockId: string) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        blocks: availability[day].blocks.filter(block => block.id !== blockId)
      }
    });
  };

  const updateTimeBlock = (day: string, blockId: string, field: 'from' | 'to', value: string) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        blocks: availability[day].blocks.map(block => 
          block.id === blockId ? { ...block, [field]: value } : block
        )
      }
    });
  };

  const toggleDayAvailability = (day: string, enabled: boolean) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        enabled,
        blocks: enabled && availability[day].blocks.length === 0 
          ? [{ id: `${day.slice(0, 3)}-${Date.now()}`, from: "09:00", to: "17:00" }]
          : availability[day].blocks
      }
    });
  };

  // Profile/Settings Tab
  const [responseTime, setResponseTime] = useState("within 1 hour");
  const [experienceYears, setExperienceYears] = useState("");
  const [aboutMe, setAboutMe] = useState(""); // Bio from profile
  const [profileQualifications, setProfileQualifications] = useState<string[]>([""]); // Array of qualifications from profile
  const [profileCertifications, setProfileCertifications] = useState<string[]>([""]); // Array of certifications from profile
  
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tags = value.split(",").map(t => t.trim()).filter(t => t);
    if (tags.length <= 5) {
      setKeywords(value);
    } else {
      toast.error("Maximum 5 keywords allowed");
    }
  };

  const addExtraService = () => {
    const newExtra: ExtraService = {
      id: `extra-${Date.now()}`,
      title: "",
      price: "",
      description: ""
    };
    setExtraServices([...extraServices, newExtra]);
  };

  const removeExtraService = (id: string) => {
    setExtraServices(extraServices.filter(e => e.id !== id));
  };

  const updateExtraService = (id: string, field: keyof ExtraService, value: string) => {
    setExtraServices(extraServices.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };



  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: `faq-${Date.now()}`,
      question: "",
      answer: ""
    };
    setFAQs([...faqs, newFAQ]);
  };

  const removeFAQ = (id: string) => {
    setFAQs(faqs.filter(f => f.id !== id));
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
    setFAQs(faqs.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  // Gallery image upload functions
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const remainingSlots = 6 - galleryImages.length;
    const filesToUpload = filesArray.slice(0, remainingSlots);

    if (filesArray.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s). Maximum 6 images allowed.`);
    }

    // Base index so each uploading file reserves a fixed slot in the grid
    const startIndex = galleryImages.length;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const tempIndex = startIndex + i;

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Unsupported file type. Please upload JPG, PNG, GIF, or WEBP.`);
        continue;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Image size must be less than 5MB`);
        continue;
      }

      // Create a temporary preview so the user immediately sees where this image will appear
      const tempPreviewUrl = URL.createObjectURL(file);
      setGalleryImages(prev => {
        const next = [...prev];
        next[tempIndex] = tempPreviewUrl;
        return next;
      });

      setUploadingImages(prev => ({ ...prev, [tempIndex]: true }));
      setUploadProgress(prev => ({ ...prev, [tempIndex]: 0 }));

      try {
        const formData = new FormData();
        formData.append("portfolioImage", file);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[tempIndex] || 0;
            if (current < 90) {
              return { ...prev, [tempIndex]: current + 10 };
            }
            return prev;
          });
        }, 200);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(prev => ({ ...prev, [tempIndex]: percentComplete }));
          }
        });

        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            clearInterval(progressInterval);
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                setUploadProgress(prev => ({ ...prev, [tempIndex]: 100 }));
                resolve(data.imageUrl);
              } catch (error) {
                reject(new Error('Failed to parse response'));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || "Failed to upload image"));
              } catch {
                reject(new Error("Failed to upload image"));
              }
            }
          });

          xhr.addEventListener('error', () => {
            clearInterval(progressInterval);
            reject(new Error("Network error"));
          });

          xhr.addEventListener('abort', () => {
            clearInterval(progressInterval);
            reject(new Error("Upload aborted"));
          });

          xhr.open("POST", resolveApiUrl("/api/auth/profile/portfolio/upload"));
          xhr.withCredentials = true;
          xhr.send(formData);
        });

        const imageUrl = await uploadPromise;
        // Replace the temporary preview with the final Cloudinary URL
        setGalleryImages(prev => {
          const next = [...prev];
          next[tempIndex] = imageUrl;
          return next;
        });
        toast.success(`${file.name} uploaded successfully`);
        
        // Clear progress after a short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newState = { ...prev };
            delete newState[tempIndex];
            return newState;
          });
        }, 500);
      } catch (error) {
        // console.error("Upload error:", error);
        toast.error(error instanceof Error ? error.message : `Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[tempIndex];
          return newState;
        });
      } finally {
        setUploadingImages(prev => {
          const newState = { ...prev };
          delete newState[tempIndex];
          return newState;
        });
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newImages = [...galleryImages];
    const draggedItem = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setGalleryImages(newImages);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragIndex(null);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

  // Tab order for navigation
  const TAB_ORDER = [
    "service-details",
    "extra-service",
    "gallery",
    "faqs",
    "availability",
    "profile"
  ];

  // Step configuration with icons
  const STEPS = [
    { id: "service-details", label: "Service Details", icon: FileText },
    { id: "extra-service", label: "Extra Service", icon: Settings },
    { id: "gallery", label: "Gallery", icon: ImagePlus },
    { id: "faqs", label: "FAQs", icon: MessageSquare },
    { id: "availability", label: "Availability", icon: CalendarDays },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  const getCurrentTabIndex = () => TAB_ORDER.indexOf(activeTab);
  const isLastTab = () => getCurrentTabIndex() === TAB_ORDER.length - 1;
  const isFirstTab = () => getCurrentTabIndex() === 0;

  const handlePrevious = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveAndContinue = () => {
    // Validate current tab before proceeding
    if (activeTab === "service-details") {
      if (!selectedSectorId) {
        toast.error("Please select a sector");
        return;
      }
      if (!selectedCategoryId) {
        toast.error("Please select a service category");
        return;
      }
      if (availableSubCategories.length > 0 && selectedSubCategoryPath.length === 0) {
        toast.error("Please select a service sub category");
        return;
      }
      if (!serviceTitle) {
        toast.error("Please enter a service title");
        return;
      }
      if (!description || description.length < 100) {
        toast.error("Please provide at least 100 characters description");
        return;
      }
      if (!basePrice || parseFloat(basePrice) <= 0) {
        toast.error("Please enter a valid base price");
        return;
      }
      toast.success("Service details saved!");
    } else if (activeTab === "extra-service") {
      // Optional, just save
      toast.success("Extra services saved!");
    } else if (activeTab === "gallery") {
      // Optional, just save
      toast.success("Gallery saved!");
    } else if (activeTab === "faqs") {
      // Optional, just save
      toast.success("FAQs saved!");
    } else if (activeTab === "availability") {
      // Check if at least one day is enabled
      const hasAvailability = Object.values(availability).some(day => day.enabled);
      if (!hasAvailability) {
        toast.error("Please enable at least one day of availability");
        return;
      }
      toast.success("Availability saved!");
    } else if (activeTab === "profile") {
      // Validate About Me (mandatory)
      if (!aboutMe.trim()) {
        toast.error("Please fill in the 'About Me' section");
        return;
      }
      toast.success("Profile information saved!");
    }

    // Move to next tab
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Auto-save draft function
  const saveDraft = useCallback(async () => {
    if (!userInfo?.id || isSavingDraft) return;

    // Only professionals can save drafts
    if (userInfo?.role !== 'professional') {
      console.log('Draft save skipped: User is not a professional');
      return;
    }

    // Only save if there's some content
    if (!serviceTitle && !description && !selectedCategoryId) return;

    setIsSavingDraft(true);
    try {
      const { resolveApiUrl } = await import("../config/api");

      // Build draft data - only include fields with actual values
      const draftData: any = {
        status: 'draft',
      };

      // Add fields only if they have values
      if (selectedCategoryId) {
        draftData.serviceCategoryId = selectedCategoryId;
      }

      const finalSubCategoryId = selectedSubCategoryPath[selectedSubCategoryPath.length - 1] || selectedSubCategoryId;
      if (finalSubCategoryId) {
        draftData.serviceSubCategoryId = finalSubCategoryId;
      }

      if (selectedSubCategoryPath && selectedSubCategoryPath.length > 0) {
        draftData.serviceSubCategoryPath = selectedSubCategoryPath;
      }

      if (serviceTitle && serviceTitle.trim()) {
        draftData.title = serviceTitle.trim();
      }

      if (description && description.trim()) {
        draftData.description = description.trim();
      }

      if (basePrice) {
        draftData.price = parseFloat(basePrice);
      }

      if (originalPrice) {
        draftData.originalPrice = parseFloat(originalPrice);
      }

      if (saleValidUntil) {
        draftData.originalPriceValidUntil = saleValidUntil;
      }

      if (priceUnit) {
        draftData.priceUnit = priceUnit;
      }

      if (galleryImages && galleryImages.length > 0) {
        draftData.images = galleryImages;
        draftData.portfolioImages = galleryImages;
      }

      if (serviceHighlights && serviceHighlights.length > 0) {
        draftData.highlights = serviceHighlights.map(id => {
          if (id.startsWith('dynamic-attr-')) {
            const index = parseInt(id.replace('dynamic-attr-', ''));
            return dynamicServiceAttributes[index] || id;
          }
          const option = SERVICE_HIGHLIGHTS_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
      }

      if (idealFor && idealFor.length > 0) {
        draftData.idealFor = idealFor.map(id => {
          const index = parseInt(id.replace('ideal-', ''));
          return dynamicServiceIdealFor[index] || id;
        });
      }

      if (faqs && faqs.length > 0) {
        draftData.faqs = faqs
          .filter((f) => f.question.trim() && f.answer.trim())
          .map((f, index) => ({
            id: f.id || `faq-${index}`,
            question: f.question.trim(),
            answer: f.answer.trim(),
          }));
      }

      if (deliveryType) {
        draftData.deliveryType = deliveryType;
      }

      if (responseTime) {
        draftData.responseTime = responseTime;
      }

      if (experienceYears) {
        draftData.experienceYears = Number(experienceYears);
      }

      const skillsArray = keywords.split(",").map(k => k.trim()).filter(k => k);
      if (skillsArray.length > 0) {
        draftData.skills = skillsArray;
      }

      if (postcode || userInfo?.postcode) {
        draftData.postcode = postcode || userInfo?.postcode;
      }

      if (address || userInfo?.address) {
        draftData.address = address || userInfo?.address;
      }

      if (townCity || userInfo?.townCity) {
        draftData.townCity = townCity || userInfo?.townCity;
      }

      if (county || userInfo?.county) {
        draftData.county = county || userInfo?.county;
      }

      if (packages && packages.length > 0) {
        draftData.packages = packages;
      }

      const addonsArray = extraServices
        .filter(e => e.title && e.price)
        .map((e, index) => ({
          id: e.id,
          name: e.title,
          description: e.description || "",
          price: parseFloat(e.price),
          order: index,
        }));

      if (addonsArray.length > 0) {
        draftData.addons = addonsArray;
      }

      const url = draftId
        ? resolveApiUrl(`/api/services/${draftId}`)
        : resolveApiUrl("/api/services/draft");

      const method = draftId ? "PUT" : "POST";

      console.log(`Saving draft (${method}):`, url);
      console.log('Draft data:', draftData);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(draftData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Draft saved successfully:', data);
        if (!draftId && data.service?._id) {
          setDraftId(data.service._id);
        }
        setLastSaved(new Date());
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save draft:', response.status, errorData);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setIsSavingDraft(false);
    }
  }, [
    userInfo?.id,
    userInfo?.postcode,
    userInfo?.address,
    userInfo?.townCity,
    userInfo?.county,
    isSavingDraft,
    serviceTitle,
    description,
    selectedCategoryId,
    selectedSubCategoryPath,
    selectedSubCategoryId,
    basePrice,
    originalPrice,
    priceUnit,
    galleryImages,
    serviceHighlights,
    dynamicServiceAttributes,
    idealFor,
    dynamicServiceIdealFor,
    deliveryType,
    responseTime,
    keywords,
    postcode,
    address,
    townCity,
    county,
    packages,
    extraServices,
    draftId
  ]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [saveDraft]);

  // Get available service categories for selected sector
  const availableCategories = (selectedSectorId
    ? (serviceCategoriesBySector[selectedSectorId] || [])
    : []
  ).filter((cat) => cat?._id && cat._id.trim() !== ""); // Filter out invalid categories

  // Get available subcategories for selected category
  const selectedCategory = availableCategories.find(cat => cat._id === selectedCategoryId);
  const availableSubCategories = Array.isArray(selectedCategory?.subCategories)
    ? selectedCategory.subCategories.filter((subCat) => 
        subCat && 
        subCat._id && 
        typeof subCat._id === 'string' && 
        subCat._id.trim() !== "" &&
        subCat.name &&
        subCat.level === 2 // Only show level 2 subcategories initially
      )
    : [];

  // Fetch nested subcategories when a subcategory is selected
  useEffect(() => {
    const fetchNestedSubCategories = async (parentId: string) => {
      if (nestedSubCategories[parentId] || loadingSubCategories[parentId]) {
        return; // Already fetched or currently loading
      }

      try {
        setLoadingSubCategories(prev => ({ ...prev, [parentId]: true }));
        const response = await fetch(
          resolveApiUrl(`/api/service-subcategories?parentSubCategoryId=${parentId}&activeOnly=true&sortBy=order&sortOrder=asc&limit=1000`),
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const subCats = (data.serviceSubCategories || []).filter((sc: ServiceSubCategory) => 
            sc?._id && sc._id.trim() !== ""
          );
          setNestedSubCategories(prev => ({ ...prev, [parentId]: subCats }));
        }
      } catch (error) {
        // console.error(`Error fetching nested subcategories for ${parentId}:`, error);
      } finally {
        setLoadingSubCategories(prev => ({ ...prev, [parentId]: false }));
      }
    };

    // Fetch nested subcategories for the selected subcategory
    if (selectedSubCategoryId) {
      fetchNestedSubCategories(selectedSubCategoryId);
    }
  }, [selectedSubCategoryId]);

  // Update selectedSubCategoryId when path changes
  useEffect(() => {
    if (selectedSubCategoryPath.length > 0) {
      const lastId = selectedSubCategoryPath[selectedSubCategoryPath.length - 1];
      if (lastId !== selectedSubCategoryId) {
        setSelectedSubCategoryId(lastId);
      }
    }
  }, [selectedSubCategoryPath]);

  // Get current level subcategories based on selection path
  const getCurrentLevelSubCategories = useCallback((): ServiceSubCategory[] => {
    if (selectedSubCategoryPath.length === 0) {
      return availableSubCategories;
    }
    const lastSelected = selectedSubCategoryPath[selectedSubCategoryPath.length - 1];
    return nestedSubCategories[lastSelected._id] || [];
  }, [selectedSubCategoryPath, nestedSubCategories, availableSubCategories]);

  // Get attributes for the selected subcategory
  const getCurrentAttributes = useCallback((): Array<{
    level: number;
    attributeType: string;
    values: Array<{ label: string; value: string; order: number }>;
  }> => {
    if (selectedSubCategoryPath.length === 0) {
      return [];
    }
    // Find the subcategory object from nestedSubCategories or availableSubCategories
    const lastSelectedId = selectedSubCategoryPath[selectedSubCategoryPath.length - 1];
    let lastSelected: ServiceSubCategory | undefined;
    
    // Check in nestedSubCategories first
    for (const subCats of Object.values(nestedSubCategories)) {
      const found = subCats.find(sc => sc._id === lastSelectedId);
      if (found) {
        lastSelected = found;
        break;
      }
    }
    
    // If not found, check in availableSubCategories
    if (!lastSelected) {
      lastSelected = availableSubCategories.find(sc => sc._id === lastSelectedId);
    }
    
    return lastSelected && Array.isArray(lastSelected.attributes) ? lastSelected.attributes : [];
  }, [selectedSubCategoryPath, nestedSubCategories, availableSubCategories]);

  // Fetch titles for the selected subcategory
  useEffect(() => {
    const fetchSubCategoryTitles = async () => {
      // Get the last selected subcategory ID from the path
      const lastSubCategoryId = selectedSubCategoryPath.length > 0 
        ? selectedSubCategoryPath[selectedSubCategoryPath.length - 1]
        : selectedSubCategoryId;

      if (!lastSubCategoryId) {
        setSelectedSubCategoryTitles([]);
        return;
      }

      try {
        setLoadingTitles(true);
        const response = await fetch(
          resolveApiUrl(`/api/service-subcategories/${lastSubCategoryId}?includeServiceCategory=false&activeOnly=false`),
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const subCategory = data.serviceSubCategory;

          // Extract service title suggestions from the subcategory
          if (subCategory?.serviceTitleSuggestions && Array.isArray(subCategory.serviceTitleSuggestions)) {
            const titles = subCategory.serviceTitleSuggestions
              .filter((title: string) => title && title.trim() !== "");
            setSelectedSubCategoryTitles(titles);
          } else {
            setSelectedSubCategoryTitles([]);
          }
        } else {
          setSelectedSubCategoryTitles([]);
        }
      } catch (error) {
        // console.error('Error fetching subcategory titles:', error);
        setSelectedSubCategoryTitles([]);
      } finally {
        setLoadingTitles(false);
      }
    };

    fetchSubCategoryTitles();
  }, [selectedSubCategoryPath, selectedSubCategoryId]);

  // Add package
  const addPackage = () => {
    const newPackage: ServicePackage = {
      id: `pkg-${Date.now()}`,
      name: "",
      description: "",
      price: "",
      deliveryDays: "",
      revisions: "",
      features: [],
      order: packages.length,
    };
    setPackages([...packages, newPackage]);
  };

  // Remove package
  const removePackage = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
  };

  // Update package
  const updatePackage = (id: string, field: keyof ServicePackage, value: any) => {
    setPackages(packages.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Add feature to package
  const addPackageFeature = (packageId: string, feature: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg && !pkg.features.includes(feature)) {
      updatePackage(packageId, "features", [...pkg.features, feature]);
    }
  };

  // Remove feature from package
  const removePackageFeature = (packageId: string, feature: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      updatePackage(packageId, "features", pkg.features.filter(f => f !== feature));
    }
  };

  const handlePublish = async () => {
    // Validation
    if (!selectedSectorId) {
      toast.error("Please select a sector");
      setActiveTab("service-details");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Please select a service category");
      setActiveTab("service-details");
      return;
    }
    if (availableSubCategories.length > 0 && selectedSubCategoryPath.length === 0) {
      toast.error("Please select a service sub category");
      setActiveTab("service-details");
      return;
    }
    if (!serviceTitle) {
      toast.error("Please enter a service title");
      setActiveTab("service-details");
      return;
    }
    if (!description || description.length < 100) {
      toast.error("Please provide at least 100 characters description");
      setActiveTab("service-details");
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast.error("Please enter a valid base price");
      setActiveTab("service-details");
      return;
    }
    // Validate About Me (mandatory)
    if (!aboutMe.trim()) {
      toast.error("Please fill in the 'About Me' section in the Profile step");
      setActiveTab("profile");
      return;
    }

    const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k);

    setLoading(true);
    try {
      // First, update profile with About Me, Qualifications, and Certifications
      try {
        const profileUpdateData = {
          publicProfile: {
            bio: aboutMe.trim(),
            qualifications: profileQualifications.filter(q => q.trim()).join('\n'),
            certifications: profileCertifications.filter(c => c.trim()).join('\n'),
          }
        };

        const profileResponse = await fetch(resolveApiUrl("/api/auth/profile"), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(profileUpdateData),
        });

        if (!profileResponse.ok) {
          // console.error("Failed to update profile, but continuing with service creation");
        }
      } catch (profileError) {
        // console.error("Error updating profile:", profileError);
        // Continue with service creation even if profile update fails
      }

      // Prepare service data for API
      const serviceData = {
        serviceCategoryId: selectedCategoryId,
        serviceSubCategoryId: selectedSubCategoryPath[selectedSubCategoryPath.length - 1] || selectedSubCategoryId || undefined,
        serviceSubCategoryPath: selectedSubCategoryPath,
        title: serviceTitle.trim(),
        description: description.trim(),
        price: parseFloat(basePrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        originalPriceValidUntil: saleValidUntil || undefined,
        priceUnit: priceUnit || "fixed",
        images: galleryImages,
        portfolioImages: galleryImages,
        packages: [], // Packages are now managed separately in AccountPage Service Packages tab
        addons: extraServices
          .filter(e => e.title && e.price)
          .map((e, index) => ({
            id: e.id,
            name: e.title,
            description: e.description || "",
            price: parseFloat(e.price),
            order: index,
          })),
        highlights: serviceHighlights.map(id => {
          // Check if it's a dynamic attribute
          if (id.startsWith('dynamic-attr-')) {
            const index = parseInt(id.replace('dynamic-attr-', ''));
            return dynamicServiceAttributes[index] || id;
          }
          const option = SERVICE_HIGHLIGHTS_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        }),
        idealFor: idealFor.map(id => {
          const index = parseInt(id.replace('ideal-', ''));
          return dynamicServiceIdealFor[index] || id;
        }),
        deliveryType,
        responseTime: responseTime || undefined,
        skills: keywordArray,
        postcode: postcode || userInfo?.postcode || "",
        address: address || userInfo?.address || "",
        townCity: townCity || userInfo?.townCity || "",
        county: county || userInfo?.county || "",
        badges: deliveryType === "same-day" ? ["Same-Day Service"] : [],
        status: "pending", // Set to pending when publishing
        faqs: faqs
          .filter((f) => f.question.trim() && f.answer.trim())
          .map((f, index) => ({
            id: f.id || `faq-${index}`,
            question: f.question.trim(),
            answer: f.answer.trim(),
          })),
      };

      // Call API to create or update service
      // If we have a draftId, update the draft; otherwise create new
      const url = draftId
        ? resolveApiUrl(`/api/services/${draftId}`)
        : isEditMode && initialService?._id
        ? resolveApiUrl(`/api/services/${initialService._id}`)
        : resolveApiUrl("/api/services");

      const method = (draftId || isEditMode) ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} service`);
      }

      const result = await response.json();
      toast.success(`Service ${isEditMode ? 'updated' : 'published'} successfully!`);

      // Clear draft state after successful publish
      setDraftId(null);
      setLastSaved(null);

      onSave(result.service || result);
      onClose();
    } catch (error: any) {
      // console.error("Error creating service:", error);
      toast.error(error.message || "Failed to create service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          onClick={onClose}
          className="mb-4 font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#3B82F6] hover:text-[#FE8A0F] hover:bg-transparent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Services
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-['Poppins',sans-serif] text-[22px] sm:text-[24px] md:text-[28px] text-[#2c353f] mb-2">
              {isEditMode ? "Edit Service" : "Add Service"}
            </h2>
            <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
              {isEditMode ? "Update your service offering details" : "Create a new service offering with all the details"}
            </p>
          </div>
          {/* Auto-save indicator and Discard Draft button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              {isSavingDraft ? (
                <>
                  <div className="w-3 h-3 border-2 border-[#FE8A0F] border-t-transparent rounded-full animate-spin" />
                  <span>Saving draft...</span>
                </>
              ) : lastSaved ? (
                <>
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Draft saved {new Date(lastSaved).toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
            {draftId && !isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to discard this draft? This action cannot be undone.")) {
                    try {
                      const { resolveApiUrl } = await import("../config/api");
                      const response = await fetch(resolveApiUrl(`/api/services/${draftId}`), {
                        method: "DELETE",
                        credentials: "include",
                      });

                      if (response.ok) {
                        toast.success("Draft discarded successfully");
                        setDraftId(null);
                        setLastSaved(null);
                        onClose();
                      } else {
                        toast.error("Failed to discard draft");
                      }
                    } catch (error) {
                      console.error("Error discarding draft:", error);
                      toast.error("Failed to discard draft");
                    }
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[12px]"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Discard Draft
              </Button>
            )}
          </div>
        </div>
      </div>

      {loadingDraft ? (
        <Card className="border-2 border-gray-200 shadow-lg p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-[#FE8A0F] animate-spin" />
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Loading draft...
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-2 border-gray-200 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  Step {getCurrentTabIndex() + 1} of {TAB_ORDER.length}
                </p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F] font-medium">
                  {Math.round(((getCurrentTabIndex() + 1) / TAB_ORDER.length) * 100)}% Complete
                </p>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] transition-all duration-500 ease-out"
                  style={{ width: `${((getCurrentTabIndex() + 1) / TAB_ORDER.length) * 100}%` }}
                />
              </div>

              {/* Horizontal Stepper */}
              <div className="relative px-4">
                {/* Connection Line - positioned at center of step circles */}
                <div className="absolute top-6 left-12 right-12 h-0.5 bg-gray-200 -z-10 hidden md:block">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] transition-all duration-500 ease-out"
                    style={{ width: `${(getCurrentTabIndex() / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Steps */}
                <div className="flex items-start justify-between relative z-10 overflow-x-auto pb-2 scrollbar-hide">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const stepIndex = TAB_ORDER.indexOf(step.id);
                    const isActive = activeTab === step.id;
                    const isCompleted = stepIndex < getCurrentTabIndex();
                    const isClickable = stepIndex <= getCurrentTabIndex() + 1;

                    return (
                      <div key={step.id} className="flex flex-col items-center flex-1 min-w-[80px] md:min-w-0">
                        {/* Step Circle */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isClickable) {
                              setActiveTab(step.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          disabled={!isClickable}
                          className={`
                            relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2
                            ${isActive 
                              ? 'bg-[#FE8A0F] text-white shadow-lg shadow-[#FE8A0F]/30 scale-110 border-[#FE8A0F]' 
                              : isCompleted
                              ? 'bg-green-500 text-white shadow-md border-green-500'
                              : 'bg-white text-gray-400 border-gray-300'
                            }
                            ${isClickable ? 'cursor-pointer hover:scale-105 hover:border-[#FE8A0F]' : 'cursor-not-allowed opacity-50'}
                          `}
                        >
                          {isCompleted && !isActive ? (
                            <CheckCircle className="w-6 h-6 md:w-7 md:h-7" />
                          ) : (
                            <Icon className="w-5 h-5 md:w-6 md:h-6" />
                          )}
                          {isActive && (
                            <div className="absolute -inset-1 bg-[#FE8A0F]/20 rounded-full animate-ping" />
                          )}
                        </button>

                        {/* Step Label */}
                        <div className="mt-3 text-center max-w-[100px] md:max-w-none">
                          <p className={`
                            font-['Poppins',sans-serif] text-[10px] md:text-[11px] font-medium transition-colors leading-tight
                            ${isActive 
                              ? 'text-[#FE8A0F]' 
                              : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-500'
                            }
                          `}>
                            {step.label}
                          </p>
                          <p className={`
                            font-['Poppins',sans-serif] text-[9px] md:text-[10px] mt-0.5
                            ${isActive 
                              ? 'text-[#FE8A0F]' 
                              : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-400'
                            }
                          `}>
                            Step {stepIndex + 1}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)] px-6">
            {/* Service Details Tab */}
            <TabsContent value="service-details" className="mt-0 py-6">
              <div className="space-y-6">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                    <span className="ml-2 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Loading categories...</span>
                  </div>
                ) : (
                  <>
                    {/* Sector Selection - Locked to user's registered sector */}
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                        Sector <span className="text-red-500">*</span>
                        {userSector && (
                          <span className="ml-2 text-[11px] text-[#6b6b6b] font-normal">
                            (Locked to your registered sector)
                          </span>
                        )}
                      </Label>
                      <Select 
                        value={selectedSectorId || undefined} 
                        onValueChange={(value) => {
                          // Prevent changing sector if user has a registered sector
                          if (userSector) {
                            return;
                          }
                          if (value) {
                            setSelectedSectorId(value);
                            setSelectedCategoryId("");
                            setSelectedSubCategoryId("");
                            setSelectedSubCategoryPath([]);
                            setSelectedAttributes({});
                            setPriceUnit("");
                          }
                        }}
                        disabled={!!userSector}
                      >
                        <SelectTrigger 
                          className={`font-['Poppins',sans-serif] text-[14px] border-gray-300 ${
                            userSector ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''
                          }`}
                        >
                          <SelectValue placeholder={userSector ? userSector : "Select Sector"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                          {sectors
                            .filter((sector) => sector._id && sector._id.trim() !== "") // Filter out any sectors without valid _id
                            .map((sector) => (
                              <SelectItem 
                                key={sector._id} 
                                value={sector._id} 
                                className="font-['Poppins',sans-serif] text-[14px]"
                                disabled={userSector && sector._id !== defaultSectorId}
                              >
                                {sector.name}
                                {userSector && sector._id === defaultSectorId && (
                                  <span className="ml-2 text-[10px] text-[#6b6b6b]">(Your Sector)</span>
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {userSector && (
                        <p className="mt-2 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          This sector is locked based on your registration and cannot be changed.
                        </p>
                      )}
                    </div>

                    {/* Service Category Selection */}
                    {selectedSectorId && (
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                          Service Category <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={selectedCategoryId || undefined} 
                          onValueChange={(value) => {
                            if (value) {
                              setSelectedCategoryId(value);
                              setSelectedSubCategoryId("");
                              setSelectedSubCategoryPath([]);
                              setSelectedAttributes({});
                              // Clear previously selected price unit when category changes
                              setPriceUnit("");
                            }
                          }}
                        >
                          <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                            <SelectValue placeholder="Select Service Category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {availableCategories
                              .filter((cat) => cat?._id && cat._id.trim() !== "")
                              .map((cat) => (
                                <SelectItem 
                                  key={cat._id} 
                                  value={cat._id} 
                                  className="font-['Poppins',sans-serif] text-[14px]"
                                >
                                  {cat.name || "Unnamed Category"}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Service SubCategory Selection - Required (Single select with radio buttons) */}
                    {selectedCategoryId && availableSubCategories.length > 0 && (
                      <div className="space-y-4">
                        <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                          Service Sub Category <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={selectedSubCategoryPath[0] || ""}
                          onValueChange={(value) => {
                            if (value) {
                              setSelectedSubCategoryPath([value]);
                              setSelectedSubCategoryId(value);
                              // Clear deeper selections
                              setSelectedAttributes({});
                            }
                          }}
                          className="grid grid-cols-2 gap-3"
                        >
                          {availableSubCategories
                            .filter((subCat) => subCat?._id && subCat._id.trim() !== "")
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((subCat) => {
                              const isSelected = selectedSubCategoryPath[0] === subCat._id;
                              return (
                                <label
                                  key={subCat._id}
                                  htmlFor={`subcat-${subCat._id}`}
                                  className={`
                                    flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                    ${isSelected 
                                      ? 'border-[#FE8A0F] bg-[#FFF5EB] shadow-md' 
                                      : 'border-gray-200 bg-white hover:border-[#FE8A0F]/50 hover:bg-gray-50'
                                    }
                                  `}
                                >
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <RadioGroupItem 
                                      value={subCat._id} 
                                      id={`subcat-${subCat._id}`}
                                      className={`
                                        ${isSelected ? 'border-[#FE8A0F]' : ''} shrink-0
                                      `}
                                    />
                                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium truncate">
                                      {subCat.name || "Unnamed Sub Category"}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FE8A0F] ml-2 shrink-0">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Display nested subcategory levels sequentially */}
                    {selectedSubCategoryPath.length > 0 && selectedSubCategoryPath.map((parentId, levelIndex) => {
                      // Always render the next level - let SubCategoryLevelDisplay handle loading/empty states
                      return (
                        <div key={`level-${levelIndex}-${parentId}`}>
                          {/* Display current level's children */}
                          <SubCategoryLevelDisplay
                            parentSubCategoryId={parentId}
                            levelIndex={levelIndex + 1}
                            selectedSubCategoryPath={selectedSubCategoryPath}
                            setSelectedSubCategoryPath={setSelectedSubCategoryPath}
                            nestedSubCategories={nestedSubCategories}
                            setNestedSubCategories={setNestedSubCategories}
                            loadingSubCategories={loadingSubCategories}
                            setLoadingSubCategories={setLoadingSubCategories}
                            selectedAttributes={selectedAttributes}
                            setSelectedAttributes={setSelectedAttributes}
                            attributeTypeLabels={{
                              'serviceType': 'Service Type',
                              'size': 'Size',
                              'frequency': 'Frequency',
                              'make': 'Make',
                              'model': 'Model',
                              'brand': 'Brand',
                            }}
                          />
                        </div>
                      );
                    })}
                  </>
                )}


                {/* Service Title */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Service Title
                  </Label>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mb-2">
                    Choose from suggested titles, edit it or write your own title.
                  </p>
                  <Input
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    placeholder="Select or write a title"
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                  />
                  {loadingTitles ? (
                    <div className="mt-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FE8A0F]" />
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">Loading titles...</span>
                    </div>
                  ) : selectedSubCategoryTitles.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSubCategoryTitles.map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-[#FFF5EB] hover:border-[#FE8A0F] font-['Poppins',sans-serif] text-[12px] transition-colors"
                          onClick={() => setServiceTitle(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Address */}
                <div>
                  <AddressAutocomplete
                    postcode={postcode}
                    onPostcodeChange={setPostcode}
                    address={address}
                    onAddressChange={setAddress}
                    townCity={townCity}
                    onTownCityChange={setTownCity}
                    county={county}
                    onCountyChange={setCounty}
                    onAddressSelect={(selectedAddress) => {
                      setPostcode(selectedAddress.postcode);
                      setAddress(selectedAddress.address);
                      setTownCity(selectedAddress.townCity);
                      if (selectedAddress.county) {
                        setCounty(selectedAddress.county);
                      }
                    }}
                    label="Postcode"
                    required={false}
                    showAddressField={true}
                    showTownCityField={true}
                    showCountyField={true}
                    addressLabel="Address"
                  />
                </div>

                {/* Positive Keywords */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Positive Keywords
                  </Label>
                  <Input
                    value={keywords}
                    onChange={handleKeywordsChange}
                    placeholder="Positive Keywords"
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                  />
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2">
                    5 tags maximum. Use letters and numbers only.
                  </p>
                  {keywords && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {keywords.split(",").map((kw, i) => kw.trim() && (
                        <Badge key={i} className="bg-[#EFF6FF] text-[#3D78CB] border-[#3D78CB]/20 font-['Poppins',sans-serif] text-[12px]">
                          {kw.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* What is the service ideal for? */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    What is the service ideal for?
                  </Label>
                  {dynamicServiceIdealFor.length === 0 ? (
                    <div className="border border-gray-300 rounded-md p-4 text-center text-gray-500">
                      <p className="text-sm">No options available. Please configure "Service Ideal For" in the category settings.</p>
                    </div>
                  ) : (
                    <>
                      <div className="border border-gray-300 rounded-md p-4 max-h-[300px] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                          {dynamicServiceIdealFor.map((label, index) => {
                            const optionId = `ideal-${index}`;
                            return (
                              <div key={optionId} className="flex items-center space-x-2">
                                <Checkbox
                                  id={optionId}
                                  checked={idealFor.includes(optionId)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      if (idealFor.length < 5) {
                                        setIdealFor([...idealFor, optionId]);
                                      }
                                    } else {
                                      setIdealFor(idealFor.filter(id => id !== optionId));
                                    }
                                  }}
                                  disabled={idealFor.length >= 5 && !idealFor.includes(optionId)}
                                  className="border-2 border-gray-300 data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F] data-[state=checked]:text-white"
                                />
                                <label
                                  htmlFor={optionId}
                                  className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] cursor-pointer"
                                >
                                  {label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {idealFor.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {idealFor.map((id) => {
                            const index = parseInt(id.replace('ideal-', ''));
                            const label = dynamicServiceIdealFor[index];
                            return label ? (
                              <Badge key={id} className="bg-[#FE8A0F]/10 text-[#FE8A0F] border-[#FE8A0F]/20 font-['Poppins',sans-serif] text-[12px]">
                                {label}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Service Highlights */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                    What's Included
                  </Label>
                  <div className="border border-gray-300 rounded-md p-4 max-h-[350px] overflow-y-auto">
                    {dynamicServiceAttributes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dynamicServiceAttributes.map((attribute, index) => {
                          const attributeId = `dynamic-attr-${index}`;
                          const isSelected = serviceHighlights.includes(attributeId);
                          const canSelect = serviceHighlights.length < 6 || isSelected;

                          return (
                            <div
                              key={attributeId}
                              className={`flex items-start space-x-2.5 ${!canSelect ? 'opacity-50' : ''}`}
                            >
                              <Checkbox
                                id={attributeId}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    if (serviceHighlights.length < 6) {
                                      setServiceHighlights([...serviceHighlights, attributeId]);
                                    }
                                  } else {
                                    setServiceHighlights(serviceHighlights.filter(id => id !== attributeId));
                                  }
                                }}
                                disabled={!canSelect}
                                className="border-2 border-gray-300 data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F] data-[state=checked]:text-white"
                              />
                              <label
                                htmlFor={attributeId}
                                className={`font-['Poppins',sans-serif] text-[13px] leading-snug cursor-pointer ${
                                  isSelected ? 'text-[#2c353f]' : 'text-[#6b6b6b]'
                                }`}
                              >
                                {attribute}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          No service attributes available for this category. Please select a subcategory or contact admin to add attributes.
                        </p>
                      </div>
                    )}
                  </div>
                  {serviceHighlights.length > 0 && (
                    <div className="mt-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-3">
                        Selected Highlights:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {serviceHighlights.map((id) => {
                          // Check if it's a dynamic attribute
                          if (id.startsWith('dynamic-attr-')) {
                            const index = parseInt(id.replace('dynamic-attr-', ''));
                            const attribute = dynamicServiceAttributes[index];
                            return attribute ? (
                              <div key={id} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-[#3D78CB] flex-shrink-0 mt-0.5" />
                                <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                                  {attribute}
                                </span>
                              </div>
                            ) : null;
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Type */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Delivery Type
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("standard")}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                        deliveryType === "standard"
                          ? "border-[#FE8A0F] bg-[#FFF5EB] text-[#FE8A0F]"
                          : "border-gray-300 bg-white text-[#2c353f] hover:border-gray-400"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="font-['Poppins',sans-serif] text-[13px]">
                        Standard Delivery
                      </span>
                      {deliveryType === "standard" && (
                        <CheckCircle className="w-4 h-4 ml-1" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType("same-day")}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                        deliveryType === "same-day"
                          ? "border-[#FE8A0F] bg-[#FFF5EB] text-[#FE8A0F]"
                          : "border-gray-300 bg-white text-[#2c353f] hover:border-gray-400"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-['Poppins',sans-serif] text-[13px]">
                        Same-Day Service
                      </span>
                      {deliveryType === "same-day" && (
                        <CheckCircle className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Your Price (£) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="0.00"
                      className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                    />
                  </div>
                  <div className="relative">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Sale / Discounted Price (£) (Optional)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      onFocus={() => setShowSaleValidUntilPicker(true)}
                      placeholder="0.00"
                      className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                    />
                    {showSaleValidUntilPicker && (
                      <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
                        <Label className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-1 block">
                          Valid until (optional)
                        </Label>
                        <Input
                          type="date"
                          value={saleValidUntil}
                          onChange={(e) => setSaleValidUntil(e.target.value)}
                          onBlur={() => {
                            // 조금 늦게 숨겨서 클릭/탭 전환 시 깜빡임 방지
                            setTimeout(() => setShowSaleValidUntilPicker(false), 150);
                          }}
                          className="font-['Poppins',sans-serif] text-[13px] border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
                {currentServiceCategory && priceUnitOptions.length > 0 && (
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Price Unit
                    </Label>
                    <Select value={priceUnit} onValueChange={setPriceUnit}>
                      <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                        <SelectValue placeholder="Select price unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceUnitOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* About Your Service */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    About Your Service
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300 min-h-[200px]"
                  />
                  <p className={`font-['Poppins',sans-serif] text-[12px] mt-2 text-right ${description.length < 100 ? 'text-red-500' : 'text-green-600'}`}>
                    {description.length} / 100 minimum characters
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Extra Service Tab */}
            <TabsContent value="extra-service" className="mt-0 py-6">
              <div className="space-y-6">
                {/* Predefined Extra Services from Category */}
                {dynamicExtraServices.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Suggested Additional Services
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500">
                      These are pre-configured extra services for this category. Click "Add Custom Extra Service" below to add your own.
                    </p>

                    <div className="space-y-3">
                      {dynamicExtraServices.map((extra, index) => (
                        <div
                          key={`dynamic-extra-${index}`}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                                {extra.name}
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mt-1">
                                Suggested Price: £{extra.price} • Delivery: {extra.days} day{extra.days !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newExtra: ExtraService = {
                                  id: `extra-${Date.now()}`,
                                  title: extra.name,
                                  price: extra.price.toString(),
                                  description: `Delivery in ${extra.days} day${extra.days !== 1 ? 's' : ''}`
                                };
                                setExtraServices([...extraServices, newExtra]);
                                toast.success(`Added "${extra.name}" to your extra services`);
                              }}
                              className="font-['Poppins',sans-serif] text-[12px]"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add This
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {dynamicExtraServices.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        Or add custom extra services
                      </span>
                    </div>
                  </div>
                )}

                {/* Custom Extra Services */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        Custom Extra Services
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mt-1">
                        Create custom additional services that clients can add to their order.
                      </p>
                    </div>
                    <Button
                      onClick={addExtraService}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Extra Service
                    </Button>
                  </div>

                  {extraServices.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                        No custom extra services added yet. Click the button above to add one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {extraServices.map((extra) => (
                      <div key={extra.id} className="border-2 border-gray-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                            Extra Service
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeExtraService(extra.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                              Title
                            </Label>
                            <Input
                              value={extra.title}
                              onChange={(e) => updateExtraService(extra.id, "title", e.target.value)}
                              placeholder="e.g., Express Delivery"
                              className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                              Price (£)
                            </Label>
                            <Input
                              type="number"
                              value={extra.price}
                              onChange={(e) => updateExtraService(extra.id, "price", e.target.value)}
                              placeholder="0.00"
                              className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                            Description
                          </Label>
                          <Textarea
                            value={extra.description}
                            onChange={(e) => updateExtraService(extra.id, "description", e.target.value)}
                            placeholder="Describe this extra service..."
                            className="font-['Poppins',sans-serif] text-[14px] border-gray-300 min-h-[80px]"
                          />
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="mt-0 py-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f] mb-2">
                    Gallery Images
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Upload images of your previous work to showcase your skills. Recommended size: 1200x800px.
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
                    ${galleryImages.length >= 6 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                      : 'border-[#FE8A0F]/30 bg-[#FFF5EB]/30 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]/50 cursor-pointer'
                    }
                  `}
                  onClick={() => {
                    if (galleryImages.length < 6 && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    multiple
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    disabled={galleryImages.length >= 6}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#FE8A0F]/10 flex items-center justify-center mb-4">
                      <ImagePlus className="w-8 h-8 text-[#FE8A0F]" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[16px] font-medium text-[#2c353f] mb-1">
                      {galleryImages.length >= 6 
                        ? 'Maximum images reached' 
                        : 'Click or drag images to upload'
                      }
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                      {galleryImages.length >= 6 
                        ? 'Remove images to upload more' 
                        : `Upload up to ${6 - galleryImages.length} more image(s). JPG, PNG, GIF, WEBP (Max 5MB each)`
                      }
                    </p>
                  </div>
                </div>

                {/* Gallery Grid */}
                {galleryImages.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                        Uploaded Images ({galleryImages.length}/6)
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        Drag to reorder
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryImages.map((image, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            relative group aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 transition-all duration-200
                            ${dragIndex === index 
                              ? 'border-[#FE8A0F] scale-105 shadow-lg z-10' 
                              : 'border-transparent hover:border-[#FE8A0F]/50 hover:shadow-md'
                            }
                          `}
                        >
                          {uploadingImages[index] ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 backdrop-blur-sm z-20 rounded-xl">
                              <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
                              <div className="w-full px-4">
                                <div className="w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] h-2 rounded-full transition-all duration-300 ease-out relative"
                                    style={{ width: `${uploadProgress[index] || 0}%` }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                  </div>
                                </div>
                                <p className="font-['Poppins',sans-serif] text-[12px] text-white text-center font-medium">
                                  {uploadProgress[index] || 0}% - Uploading...
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <img 
                                src={image} 
                                alt={`Gallery ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md font-['Poppins',sans-serif] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                #{index + 1}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(index);
                                }}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1">
                                  <p className="font-['Poppins',sans-serif] text-[10px] text-[#2c353f] truncate">
                                    Drag to reorder
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="mt-0 py-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Answer common questions clients might have about your service.
                  </p>
                  <Button
                    onClick={addFAQ}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>

                {faqs.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                      No FAQs added yet. Click the button above to add one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={faq.id} className="border-2 border-gray-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                            FAQ #{index + 1}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFAQ(faq.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                            Question
                          </Label>
                          <Input
                            value={faq.question}
                            onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                            placeholder="What is your question?"
                            className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                          />
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                            Answer
                          </Label>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                            placeholder="Your detailed answer..."
                            className="font-['Poppins',sans-serif] text-[14px] border-gray-300 min-h-[80px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="mt-0 py-6">
              <div className="space-y-6">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Set your available time blocks for each day. Create multiple time slots per day as needed.
                </p>

                <div className="space-y-4">
                  {Object.entries(availability).map(([day, dayData]) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={dayData.enabled}
                            onCheckedChange={(checked) => toggleDayAvailability(day, checked)}
                            className="data-[state=checked]:bg-[#FE8A0F]"
                          />
                          <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] capitalize min-w-[100px]">
                            {day}
                          </span>
                        </div>

                        {dayData.enabled && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeBlock(day)}
                            className="font-['Poppins',sans-serif] text-[13px] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F] hover:text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Time Block
                          </Button>
                        )}
                      </div>

                      {/* Time Blocks */}
                      {dayData.enabled ? (
                        <div className="space-y-2 ml-11">
                          {dayData.blocks.length === 0 ? (
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] italic">
                              No time blocks added. Click "Add Time Block" to create one.
                            </p>
                          ) : (
                            dayData.blocks.map((block) => (
                              <div key={block.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Clock className="w-4 h-4 text-[#FE8A0F]" />
                                <Input
                                  type="time"
                                  value={block.from}
                                  onChange={(e) => updateTimeBlock(day, block.id, 'from', e.target.value)}
                                  className="w-32 font-['Poppins',sans-serif] text-[14px] border-gray-300"
                                />
                                <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">to</span>
                                <Input
                                  type="time"
                                  value={block.to}
                                  onChange={(e) => updateTimeBlock(day, block.id, 'to', e.target.value)}
                                  className="w-32 font-['Poppins',sans-serif] text-[14px] border-gray-300"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeBlock(day, block.id)}
                                  disabled={dayData.blocks.length === 1}
                                  className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] ml-11">
                          Not available
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-blue-900">
                      <strong>Important:</strong> Time slots are exclusive to this service listing.
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-blue-800">
                      Once you assign a time slot (e.g., 7:00-9:00) to this service, it cannot be used in any other service listing.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 py-6">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-blue-800">
                    <strong>Note:</strong> This information is synced with your Profile page. Changes here will update your profile, and vice versa.
                  </p>
                </div>

                {/* About Me - MANDATORY */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    About Me <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300 min-h-[150px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                      This will be displayed on your public profile and service listings.
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500">
                      {aboutMe.length}/1000 characters
                    </p>
                  </div>
                  {!aboutMe.trim() && (
                    <p className="font-['Poppins',sans-serif] text-[12px] text-red-500 mt-1">
                      About Me is required to publish your service.
                    </p>
                  )}
                </div>

                {/* Qualifications */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Qualifications
                  </Label>
                  <div className="space-y-3">
                    {profileQualifications.map((qual, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Input
                          value={qual}
                          onChange={(e) => {
                            const newQualifications = [...profileQualifications];
                            newQualifications[index] = e.target.value;
                            setProfileQualifications(newQualifications);
                          }}
                          placeholder="e.g., NVQ Level 3 in Plumbing (Registration: PL123456)"
                          className="flex-1 font-['Poppins',sans-serif] text-[14px] border-gray-300"
                        />
                        {profileQualifications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newQualifications = profileQualifications.filter((_, i) => i !== index);
                              setProfileQualifications(newQualifications.length > 0 ? newQualifications : [""]);
                            }}
                            className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProfileQualifications([...profileQualifications, ""]);
                      }}
                      className="w-full border-2 border-dashed border-gray-300 hover:border-[#FE8A0F] text-gray-600 hover:text-[#FE8A0F] font-['Poppins',sans-serif] text-[14px]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Qualification
                    </Button>
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2">
                    Include registration numbers, dates obtained, or issuing bodies.
                  </p>
                </div>

                {/* Certifications */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Certifications
                  </Label>
                  <div className="space-y-3">
                    {profileCertifications.map((cert, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Input
                          value={cert}
                          onChange={(e) => {
                            const newCertifications = [...profileCertifications];
                            newCertifications[index] = e.target.value;
                            setProfileCertifications(newCertifications);
                          }}
                          placeholder="e.g., Gas Safe Registered (ID: 123456)"
                          className="flex-1 font-['Poppins',sans-serif] text-[14px] border-gray-300"
                        />
                        {profileCertifications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newCertifications = profileCertifications.filter((_, i) => i !== index);
                              setProfileCertifications(newCertifications.length > 0 ? newCertifications : [""]);
                            }}
                            className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProfileCertifications([...profileCertifications, ""]);
                      }}
                      className="w-full border-2 border-dashed border-gray-300 hover:border-[#FE8A0F] text-gray-600 hover:text-[#FE8A0F] font-['Poppins',sans-serif] text-[14px]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Certification
                    </Button>
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2">
                    Include any professional certifications, trade memberships, or insurance details.
                  </p>
                </div>

                {/* Typical Response Time */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Typical Response Time
                  </Label>
                  <Select value={responseTime} onValueChange={setResponseTime}>
                    <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="within 15 minutes">Within 15 minutes</SelectItem>
                      <SelectItem value="within 1 hour">Within 1 hour</SelectItem>
                      <SelectItem value="within 3 hours">Within 3 hours</SelectItem>
                      <SelectItem value="within 24 hours">Within 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Years of Experience */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Years of Experience
                  </Label>
                  <Input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g., 5"
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                  />
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-white">
            {!isFirstTab() && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="font-['Poppins',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="font-['Poppins',sans-serif] text-[14px] border-gray-300 text-[#6b6b6b] hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {isLastTab() ? (
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? "Updating..." : "Publishing..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {isEditMode ? "Update Service" : "Publish Service"}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSaveAndContinue}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
              >
                Save and Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Tabs>
      </Card>
      )}
    </div>
  );
}
