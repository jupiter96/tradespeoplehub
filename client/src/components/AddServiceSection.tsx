import { useState } from "react";
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
  TrendingUp
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface AddServiceSectionProps {
  onClose: () => void;
  onSave: (serviceData: any) => void;
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

// Admin-defined "Ideal For" options
const IDEAL_FOR_OPTIONS = [
  { id: "ideal-1", label: "Homeowners" },
  { id: "ideal-2", label: "Renters/Tenants" },
  { id: "ideal-3", label: "Landlords" },
  { id: "ideal-4", label: "Small businesses" },
  { id: "ideal-5", label: "Large enterprises" },
  { id: "ideal-6", label: "Retail shops" },
  { id: "ideal-7", label: "Restaurants/Cafes" },
  { id: "ideal-8", label: "Offices" },
  { id: "ideal-9", label: "Schools/Educational institutions" },
  { id: "ideal-10", label: "Healthcare facilities" },
  { id: "ideal-11", label: "Property managers" },
  { id: "ideal-12", label: "Estate agents" },
  { id: "ideal-13", label: "First-time buyers" },
  { id: "ideal-14", label: "Elderly residents" },
  { id: "ideal-15", label: "Families with children" },
  { id: "ideal-16", label: "Students" },
  { id: "ideal-17", label: "New construction projects" },
  { id: "ideal-18", label: "Renovation projects" },
  { id: "ideal-19", label: "Emergency situations" },
  { id: "ideal-20", label: "Regular maintenance" },
];

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

export default function AddServiceSection({ onClose, onSave }: AddServiceSectionProps) {
  const [activeTab, setActiveTab] = useState("service-details");
  
  // Service Details Tab
  const [category, setCategory] = useState(""); // Main category (e.g., "Plumbing")
  const [subCategory, setSubCategory] = useState(""); // Sub category
  const [serviceType, setServiceType] = useState(""); // Service Type (e.g., "Emergency Service")
  const [attributeValue, setAttributeValue] = useState(""); // Attribute value (e.g., "Small", "Large")
  const [serviceTitle, setServiceTitle] = useState("");
  const [location, setLocation] = useState("");
  const [postcode, setPostcode] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [idealFor, setIdealFor] = useState<string[]>([]);
  const [serviceHighlights, setServiceHighlights] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<"standard" | "same-day">("standard");
  const [basePrice, setBasePrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("hour");
  
  // Extra Services Tab
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [predefinedExtras, setPredefinedExtras] = useState([
    { id: "express-delivery", label: "typefaces", price: "", selected: false, placeholder: "Enter price" },
    { id: "additional-revision", label: "placeholder text", price: "", selected: false, placeholder: "Enter price" },
  ]);
  
  // Gallery Tab
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
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
  const [qualifications, setQualifications] = useState("");
  
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

  const togglePredefinedExtra = (id: string, checked: boolean) => {
    setPredefinedExtras(predefinedExtras.map(extra => 
      extra.id === id ? { ...extra, selected: checked } : extra
    ));
  };

  const updatePredefinedExtraPrice = (id: string, price: string) => {
    setPredefinedExtras(predefinedExtras.map(extra => 
      extra.id === id ? { ...extra, price } : extra
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

  // Tab order for navigation
  const TAB_ORDER = [
    "service-details",
    "package",
    "extra-service",
    "gallery",
    "faqs",
    "availability",
    "profile"
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
      if (!category) {
        toast.error("Please select a category");
        return;
      }
      if (!serviceTitle) {
        toast.error("Please enter a service title");
        return;
      }
      if (!location) {
        toast.error("Please select a location");
        return;
      }
      if (!description || description.length < 100) {
        toast.error("Please provide at least 100 characters description");
        return;
      }
      const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k);
      if (keywordArray.length === 0) {
        toast.error("Please add at least one keyword");
        return;
      }
      toast.success("Service details saved!");
    } else if (activeTab === "package") {
      // Validate at least one package is filled
      const validPackages = packages.filter(p => p.price);
      if (validPackages.length === 0) {
        toast.error("Please fill at least one package with price");
        return;
      }
      toast.success("Package details saved!");
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
    }

    // Move to next tab
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePublish = () => {
    // Validation
    if (!category) {
      toast.error("Please select a category");
      setActiveTab("service-details");
      return;
    }
    if (!serviceTitle) {
      toast.error("Please enter a service title");
      setActiveTab("service-details");
      return;
    }
    if (!location) {
      toast.error("Please select a location");
      setActiveTab("service-details");
      return;
    }
    if (!description || description.length < 100) {
      toast.error("Please provide at least 100 characters description");
      setActiveTab("service-details");
      return;
    }

    const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k);
    if (keywordArray.length === 0) {
      toast.error("Please add at least one keyword");
      setActiveTab("service-details");
      return;
    }

    // Prepare service data
    const serviceData = {
      category,
      subCategory,
      serviceType,
      attributeValue,
      title: serviceTitle,
      location,
      postcode,
      keywords: keywordArray,
      description,
      idealFor,
      serviceHighlights,
      deliveryType,
      basePrice,
      priceUnit,
      extraServices: extraServices.filter(e => e.title && e.price),
      galleryImages,
      faqs: faqs.filter(f => f.question && f.answer),
      availability,
      responseTime,
      experienceYears,
      qualifications
    };

    onSave(serviceData);
    toast.success("Service published successfully!");
    onClose();
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
        <h2 className="font-['Poppins',sans-serif] text-[22px] sm:text-[24px] md:text-[28px] text-[#2c353f] mb-2">
          Add Service
        </h2>
        <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
          Create a new service offering with all the details
        </p>
      </div>

      <Card className="border-2 border-gray-200 shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            {/* Progress Indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  Step {getCurrentTabIndex() + 1} of {TAB_ORDER.length}
                </p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]">
                  {Math.round(((getCurrentTabIndex() + 1) / TAB_ORDER.length) * 100)}% Complete
                </p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FE8A0F] to-[#FFB347] transition-all duration-500 ease-out"
                  style={{ width: `${((getCurrentTabIndex() + 1) / TAB_ORDER.length) * 100}%` }}
                />
              </div>
            </div>
            
            <TabsList className="grid w-full grid-cols-6 bg-gray-100 h-auto">
              <TabsTrigger value="service-details" className="font-['Poppins',sans-serif] text-[12px] px-3 py-2.5 whitespace-nowrap">
                Service Details
              </TabsTrigger>
              <TabsTrigger value="extra-service" className="font-['Poppins',sans-serif] text-[12px] px-3 py-2.5 whitespace-nowrap">
                Extra Service
              </TabsTrigger>
              <TabsTrigger value="gallery" className="font-['Poppins',sans-serif] text-[12px] px-3 py-2.5">
                Gallery
              </TabsTrigger>
              <TabsTrigger value="faqs" className="font-['Poppins',sans-serif] text-[12px] px-3 py-2.5">
                FAQs
              </TabsTrigger>
              <TabsTrigger value="availability" className="font-['Poppins',sans-serif] text-[12px] px-3 py-2.5">
                Availability
              </TabsTrigger>
              <TabsTrigger value="profile" className="font-['Poppins',sans-serif] text-[12px] px-3 py-2.5">
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)] px-6">
            {/* Service Details Tab */}
            <TabsContent value="service-details" className="mt-0 py-6">
              <div className="space-y-6">
                {/* Main Category */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Main Category
                  </Label>
                  <Select 
                    value={category} 
                    onValueChange={(value) => {
                      setCategory(value);
                      setSubCategory(""); // Reset sub category when main category changes
                      setServiceType(""); // Reset service type
                      setAttributeValue(""); // Reset attribute
                    }}
                  >
                    <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {CATEGORY_TREE.map((sector) => (
                        <div key={sector.sectorValue}>
                          <div className="px-2 py-1.5 font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] uppercase tracking-wider">
                            {sector.sector}
                          </div>
                          {sector.mainCategories.map((cat) => (
                            <SelectItem 
                              key={cat.value} 
                              value={cat.name} 
                              className="font-['Poppins',sans-serif] text-[14px] pl-4"
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub Category - Only show if main category is selected */}
                {category && (() => {
                  // Find the selected category in the tree
                  let selectedCategoryData: { name: string; value: string; subCategories: SubCategoryDetail[] } | undefined;
                  for (const sector of CATEGORY_TREE) {
                    const found = sector.mainCategories.find(cat => cat.name === category);
                    if (found) {
                      selectedCategoryData = found;
                      break;
                    }
                  }
                  
                  if (selectedCategoryData && selectedCategoryData.subCategories.length > 0) {
                    return (
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                          Sub Category
                        </Label>
                        <Select 
                          value={subCategory} 
                          onValueChange={(value) => {
                            setSubCategory(value);
                            setServiceType(""); // Reset service type when sub category changes
                            setAttributeValue(""); // Reset attribute when sub category changes
                          }}
                        >
                          <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                            <SelectValue placeholder="Select Sub Category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {selectedCategoryData.subCategories.map((subCat) => (
                              <SelectItem 
                                key={subCat.name} 
                                value={subCat.name} 
                                className="font-['Poppins',sans-serif] text-[14px]"
                              >
                                {subCat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Service Type - Only show if sub category is selected */}
                {subCategory && (() => {
                  // Find the selected sub category details
                  let selectedSubCategoryData: SubCategoryDetail | undefined;
                  for (const sector of CATEGORY_TREE) {
                    for (const mainCat of sector.mainCategories) {
                      if (mainCat.name === category) {
                        selectedSubCategoryData = mainCat.subCategories.find(sub => sub.name === subCategory);
                        if (selectedSubCategoryData) break;
                      }
                    }
                    if (selectedSubCategoryData) break;
                  }
                  
                  if (selectedSubCategoryData && selectedSubCategoryData.serviceTypes.length > 0) {
                    return (
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                          Service Type
                        </Label>
                        <RadioGroup 
                          value={serviceType} 
                          onValueChange={(value) => {
                            setServiceType(value);
                            setAttributeValue(""); // Reset attribute when service type changes
                          }}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            {selectedSubCategoryData.serviceTypes.map((type) => (
                              <label 
                                key={type} 
                                htmlFor={`service-${type}`}
                                className={`
                                  relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                  ${serviceType === type 
                                    ? 'border-[#FE8A0F] bg-[#FFF5EB] shadow-md' 
                                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                                  }
                                `}
                              >
                                <RadioGroupItem 
                                  value={type} 
                                  id={`service-${type}`}
                                  className="sr-only"
                                />
                                <span 
                                  className={`
                                    font-['Poppins',sans-serif] text-[13px] text-center
                                    ${serviceType === type ? 'text-[#FE8A0F]' : 'text-[#2c353f]'}
                                  `}
                                >
                                  {type}
                                </span>
                                {serviceType === type && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#FE8A0F] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Attribute - Only show if service type is selected */}
                {serviceType && (() => {
                  // Find the selected sub category details for attributes
                  let selectedSubCategoryData: SubCategoryDetail | undefined;
                  for (const sector of CATEGORY_TREE) {
                    for (const mainCat of sector.mainCategories) {
                      if (mainCat.name === category) {
                        selectedSubCategoryData = mainCat.subCategories.find(sub => sub.name === subCategory);
                        if (selectedSubCategoryData) break;
                      }
                    }
                    if (selectedSubCategoryData) break;
                  }
                  
                  if (selectedSubCategoryData && selectedSubCategoryData.attributes.options.length > 0) {
                    return (
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                          {selectedSubCategoryData.attributes.label}
                        </Label>
                        <RadioGroup 
                          value={attributeValue} 
                          onValueChange={setAttributeValue}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            {selectedSubCategoryData.attributes.options.map((option) => (
                              <label 
                                key={option} 
                                htmlFor={`attr-${option}`}
                                className={`
                                  relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                  ${attributeValue === option 
                                    ? 'border-[#FE8A0F] bg-[#FFF5EB] shadow-md' 
                                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                                  }
                                `}
                              >
                                <RadioGroupItem 
                                  value={option} 
                                  id={`attr-${option}`}
                                  className="sr-only"
                                />
                                <span 
                                  className={`
                                    font-['Poppins',sans-serif] text-[13px] text-center
                                    ${attributeValue === option ? 'text-[#FE8A0F]' : 'text-[#2c353f]'}
                                  `}
                                >
                                  {option}
                                </span>
                                {attributeValue === option && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#FE8A0F] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    );
                  }
                  return null;
                })()}

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
                  {category && TITLE_SUGGESTIONS[category] && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TITLE_SUGGESTIONS[category].map((suggestion) => (
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
                  )}
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Location
                    </Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {UK_LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc} className="font-['Poppins',sans-serif] text-[14px]">
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Postcode (Optional)
                    </Label>
                    <Input
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      placeholder="e.g., SW1A 1AA"
                      className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                    />
                  </div>
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
                  <div className="border border-gray-300 rounded-md p-4 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      {IDEAL_FOR_OPTIONS.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={idealFor.includes(option.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (idealFor.length < 5) {
                                  setIdealFor([...idealFor, option.id]);
                                }
                              } else {
                                setIdealFor(idealFor.filter(id => id !== option.id));
                              }
                            }}
                            disabled={idealFor.length >= 5 && !idealFor.includes(option.id)}
                          />
                          <label
                            htmlFor={option.id}
                            className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {idealFor.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {idealFor.map((id) => {
                        const option = IDEAL_FOR_OPTIONS.find(opt => opt.id === id);
                        return option ? (
                          <Badge key={id} className="bg-[#FE8A0F]/10 text-[#FE8A0F] border-[#FE8A0F]/20 font-['Poppins',sans-serif] text-[12px]">
                            {option.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Service Highlights */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                    What's Included
                  </Label>
                  <div className="border border-gray-300 rounded-md p-4 max-h-[350px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SERVICE_HIGHLIGHTS_OPTIONS.map((option) => {
                        const isSelected = serviceHighlights.includes(option.id);
                        const canSelect = serviceHighlights.length < 6 || isSelected;
                        
                        return (
                          <div 
                            key={option.id} 
                            className={`flex items-start space-x-2.5 ${!canSelect ? 'opacity-50' : ''}`}
                          >
                            <Checkbox
                              id={option.id}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  if (serviceHighlights.length < 6) {
                                    setServiceHighlights([...serviceHighlights, option.id]);
                                  }
                                } else {
                                  setServiceHighlights(serviceHighlights.filter(id => id !== option.id));
                                }
                              }}
                              disabled={!canSelect}
                              className={isSelected ? "border-[#3D78CB] data-[state=checked]:bg-[#3D78CB]" : ""}
                            />
                            <label
                              htmlFor={option.id}
                              className={`font-['Poppins',sans-serif] text-[13px] leading-snug cursor-pointer ${
                                isSelected ? 'text-[#2c353f]' : 'text-[#6b6b6b]'
                              }`}
                            >
                              {option.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {serviceHighlights.length > 0 && (
                    <div className="mt-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-3">
                        Selected Highlights:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {serviceHighlights.map((id) => {
                          const option = SERVICE_HIGHLIGHTS_OPTIONS.find(opt => opt.id === id);
                          return option ? (
                            <div key={id} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-[#3D78CB] flex-shrink-0 mt-0.5" />
                              <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f]">
                                {option.label}
                              </span>
                            </div>
                          ) : null;
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

                {/* Base Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Base Price (£)
                    </Label>
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="0.00"
                      className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                      Price Unit
                    </Label>
                    <Select value={priceUnit} onValueChange={setPriceUnit}>
                      <SelectTrigger className="font-['Poppins',sans-serif] text-[14px] border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">Per Hour</SelectItem>
                        <SelectItem value="day">Per Day</SelectItem>
                        <SelectItem value="project">Per Project</SelectItem>
                        <SelectItem value="item">Per Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                {/* Predefined Extra Services */}
                <div className="space-y-4">
                  <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    Choose an additional service
                  </h3>
                  
                  <div className="space-y-3">
                    {predefinedExtras.map((extra) => (
                      <div 
                        key={extra.id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            id={extra.id}
                            checked={extra.selected}
                            onCheckedChange={(checked) => togglePredefinedExtra(extra.id, checked as boolean)}
                            className="data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F]"
                          />
                          <label
                            htmlFor={extra.id}
                            className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer"
                          >
                            {extra.label}
                          </label>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                            Extra Service Price
                          </Label>
                          <Input
                            type="number"
                            value={extra.price}
                            onChange={(e) => updatePredefinedExtraPrice(extra.id, e.target.value)}
                            placeholder={extra.placeholder || "Enter price"}
                            disabled={!extra.selected}
                            className="w-[160px] font-['Poppins',sans-serif] text-[14px] border-gray-300 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
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

                <div className="flex items-center justify-between">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Create custom additional services that clients can add to their order.
                  </p>
                  <Button
                    onClick={addExtraService}
                    className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Extra Service
                  </Button>
                </div>

                {extraServices.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                      No extra services added yet. Click the button above to add one.
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
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="mt-0 py-6">
              <div className="space-y-6">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Upload images of your previous work to showcase your skills. Recommended size: 1200x800px.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                      <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {galleryImages.length < 6 && (
                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#FE8A0F] hover:bg-[#FFF5EB] transition-all">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                        Upload Image
                      </p>
                    </div>
                  )}
                </div>

                <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                  Maximum 6 images. Supported formats: JPG, PNG (Max 5MB each)
                </p>
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
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Additional professional information about you and your service.
                </p>

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

                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Qualifications & Certifications
                  </Label>
                  <Textarea
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="List your qualifications, certifications, trade memberships..."
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300 min-h-[150px]"
                  />
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2">
                    Include any relevant trade qualifications, certifications, insurance details, or professional memberships.
                  </p>
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
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Publish Service
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
    </div>
  );
}
