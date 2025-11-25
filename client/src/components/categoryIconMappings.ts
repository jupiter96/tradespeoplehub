import type { LucideIcon } from "lucide-react";
import {
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
  Briefcase,
  GraduationCap,
  Car,
  TruckIcon,
  ChefHat,
  Lock,
  Layers,
  Settings,
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
  Warehouse,
  Box,
  Apple,
  Brain,
  Flower2,
  Smartphone,
  Leaf,
  Key,
  Lightbulb,
  Router,
  HardDrive,
  Monitor,
  Tablet,
  Headphones,
  Mic,
  Speaker,
  Cog,
  Shield,
  CreditCard,
  TrendingDown,
  Plane,
  TrendingUp,
  CheckCircle,
  Clock,
  Search,
  ShoppingCart,
  PiggyBank,
  Coins,
  Gem,
  Globe,
  Award,
  Users,
  Cpu
} from "lucide-react";

// Sector-specific tool icons - Two large icons per sector (left and right)
export const sectorToolIcons: Record<string, { leftIcon: LucideIcon; rightIcon: LucideIcon }> = {
  "Home & Garden": { leftIcon: Home, rightIcon: Trees },
  "Business Services": { leftIcon: Laptop, rightIcon: Smartphone },
  "Cleaning Services": { leftIcon: Sparkles, rightIcon: Droplets },
  "Professional Services": { leftIcon: Briefcase, rightIcon: FileText },
  "Education & Tutoring": { leftIcon: GraduationCap, rightIcon: BookOpen },
  "Personal Services": { leftIcon: Heart, rightIcon: Camera },
  "Repair & Maintenance": { leftIcon: Wrench, rightIcon: Settings },
  "Technology Services": { leftIcon: Laptop, rightIcon: Smartphone },
  "Health & Wellness": { leftIcon: Activity, rightIcon: Stethoscope },
  "Beauty & Wellness": { leftIcon: Scissors, rightIcon: Sparkles },
  "Legal & Financial": { leftIcon: Scale, rightIcon: Calculator },
  "Events & Entertainment": { leftIcon: Calendar, rightIcon: Music },
  "Pet Services": { leftIcon: Dog, rightIcon: Heart },
  "Automotive Services": { leftIcon: Car, rightIcon: Wrench },
  "Moving & Logistics": { leftIcon: TruckIcon, rightIcon: Package },
  "Automotive": { leftIcon: Car, rightIcon: Wrench },
  "Moving & Storage": { leftIcon: TruckIcon, rightIcon: Box },
  "Event Services": { leftIcon: Calendar, rightIcon: Camera }
};

// Main Category-specific tool icons - Two large icons per main category
export const mainCategoryToolIcons: Record<string, { leftIcon: LucideIcon; rightIcon: LucideIcon }> = {
  // Home & Garden categories
  "Plumbing": { leftIcon: Droplets, rightIcon: Wrench },
  "Electrical Work": { leftIcon: Zap, rightIcon: Plug },
  "Carpentry": { leftIcon: Hammer, rightIcon: HardHat },
  "Painting & Decorating": { leftIcon: Paintbrush, rightIcon: Palette },
  "Gardening & Landscaping": { leftIcon: Trees, rightIcon: Leaf },
  "Bathroom Fitting": { leftIcon: ShowerHead, rightIcon: Droplets },
  "Kitchen Fitting": { leftIcon: ChefHat, rightIcon: UtensilsCrossed },
  "Home Cleaning": { leftIcon: Sparkles, rightIcon: Droplets },
  
  // Business Services categories
  "Business Consulting": { leftIcon: Briefcase, rightIcon: BarChart3 },
  "Marketing & Advertising": { leftIcon: Megaphone, rightIcon: TrendingUp },
  "Web Development": { leftIcon: Code, rightIcon: Monitor },
  "Graphic Design": { leftIcon: Palette, rightIcon: PenTool },
  "Accounting Services": { leftIcon: Calculator, rightIcon: Receipt },
  "Legal Advice": { leftIcon: Scale, rightIcon: FileText },
  
  // Personal Services categories
  "Personal Training": { leftIcon: Dumbbell, rightIcon: Activity },
  "Life Coaching": { leftIcon: Brain, rightIcon: Heart },
  "Massage Therapy": { leftIcon: Heart, rightIcon: Flower2 },
  "Professional Organizing": { leftIcon: ClipboardList, rightIcon: Archive },
  
  // Repair & Maintenance categories
  "Handyman Services": { leftIcon: Wrench, rightIcon: Hammer },
  "Appliance Repair": { leftIcon: Settings, rightIcon: Plug },
  "HVAC Repair": { leftIcon: Wind, rightIcon: Flame },
  "Locksmith Services": { leftIcon: Lock, rightIcon: Key },
  
  // Technology Services categories
  "Computer Repair": { leftIcon: Laptop, rightIcon: Settings },
  "IT Support": { leftIcon: Smartphone, rightIcon: Laptop },
  "App Development": { leftIcon: Code, rightIcon: Smartphone },
  
  // Education & Tutoring categories
  "Math Tutoring": { leftIcon: Calculator, rightIcon: PenLine },
  "English Tutoring": { leftIcon: BookOpen, rightIcon: PenTool },
  "Music Lessons": { leftIcon: Music, rightIcon: Headphones },
  "Language Tutoring": { leftIcon: MessageSquare, rightIcon: Globe },
  
  // Beauty & Wellness categories
  "Hair Styling": { leftIcon: Scissors, rightIcon: Cog },
  "Makeup Services": { leftIcon: Smile, rightIcon: Sparkles },
  "Nail Services": { leftIcon: Sparkles, rightIcon: Heart },
  "Spa Treatments": { leftIcon: Flower2, rightIcon: Droplets },
  
  // Health & Wellness categories
  "Nutrition Counseling": { leftIcon: Apple, rightIcon: Heart },
  "Physiotherapy": { leftIcon: Stethoscope, rightIcon: Activity },
  "Yoga & Pilates": { leftIcon: Activity, rightIcon: Brain },
  "Mental Health Support": { leftIcon: Brain, rightIcon: Heart },
  
  // Legal & Financial categories
  "Legal Services": { leftIcon: Scale, rightIcon: FileText },
  "Tax Services": { leftIcon: Receipt, rightIcon: Calculator },
  "Financial Planning": { leftIcon: LineChart, rightIcon: TrendingUp },
  
  // Event Services categories
  "Event Photography": { leftIcon: Camera, rightIcon: Video },
  "Catering Services": { leftIcon: UtensilsCrossed, rightIcon: ChefHat },
  "DJ Services": { leftIcon: Music, rightIcon: Radio },
  "Event Planning": { leftIcon: Calendar, rightIcon: ClipboardList },
  
  // Pet Services categories
  "Pet Grooming": { leftIcon: Scissors, rightIcon: Sparkles },
  "Dog Walking": { leftIcon: Footprints, rightIcon: Dog },
  "Pet Sitting": { leftIcon: Home, rightIcon: Heart },
  "Pet Training": { leftIcon: Award, rightIcon: Dog },
  
  // Automotive categories
  "Car Repair": { leftIcon: Wrench, rightIcon: Car },
  "Car Maintenance": { leftIcon: Settings, rightIcon: CheckCircle },
  "Car Detailing": { leftIcon: Sparkles, rightIcon: Car },
  "Bodywork & Paint": { leftIcon: Paintbrush, rightIcon: Car },
  
  // Moving & Storage categories
  "Moving Services": { leftIcon: TruckIcon, rightIcon: Box },
  "Packing Services": { leftIcon: Box, rightIcon: Package },
  "Storage Solutions": { leftIcon: Warehouse, rightIcon: Archive },
  "Furniture Assembly": { leftIcon: Hammer, rightIcon: Sofa }
};

// SubCategory-specific tool icons - Two large icons per subcategory
export const subCategoryToolIcons: Record<string, { leftIcon: LucideIcon; rightIcon: LucideIcon }> = {
  // Plumbing subcategories
  "Installing taps": { leftIcon: Droplets, rightIcon: Wrench },
  "Replacing WC": { leftIcon: ShowerHead, rightIcon: Settings },
  "Fixing leakage": { leftIcon: Droplets, rightIcon: Wrench },
  "Boiler repair": { leftIcon: Flame, rightIcon: Settings },
  "Pipe installation": { leftIcon: Wrench, rightIcon: HardHat },
  "Drain unblocking": { leftIcon: Droplets, rightIcon: Settings },
  
  // Electrical Work subcategories
  "Socket installation": { leftIcon: Plug, rightIcon: Zap },
  "Light fitting": { leftIcon: Lightbulb, rightIcon: Zap },
  "Fuse box repair": { leftIcon: Zap, rightIcon: Settings },
  "Rewiring": { leftIcon: Plug, rightIcon: Wrench },
  "Emergency repairs": { leftIcon: Zap, rightIcon: Clock },
  
  // Carpentry subcategories
  "Custom furniture": { leftIcon: Sofa, rightIcon: Hammer },
  "Door fitting": { leftIcon: DoorOpen, rightIcon: Hammer },
  "Shelving": { leftIcon: Layers, rightIcon: Hammer },
  "Deck building": { leftIcon: HardHat, rightIcon: Hammer },
  "Cabinet making": { leftIcon: Box, rightIcon: Hammer },
  
  // Painting & Decorating subcategories
  "Interior painting": { leftIcon: Paintbrush, rightIcon: Home },
  "Exterior painting": { leftIcon: Paintbrush, rightIcon: Building2 },
  "Wallpapering": { leftIcon: Palette, rightIcon: Paintbrush },
  "Decorative finishes": { leftIcon: Sparkles, rightIcon: Paintbrush },
  
  // Gardening & Landscaping subcategories
  "Lawn maintenance": { leftIcon: Leaf, rightIcon: Trees },
  "Tree surgery": { leftIcon: Trees, rightIcon: Scissors },
  "Garden design": { leftIcon: Flower2, rightIcon: Palette },
  "Patio installation": { leftIcon: HardHat, rightIcon: Home },
  
  // Bathroom Fitting subcategories
  "Full bathroom installation": { leftIcon: ShowerHead, rightIcon: Wrench },
  "Shower fitting": { leftIcon: Droplets, rightIcon: Settings },
  "Toilet replacement": { leftIcon: ShowerHead, rightIcon: Wrench },
  "Sink installation": { leftIcon: Droplets, rightIcon: Settings },
  
  // Kitchen Fitting subcategories
  "Full kitchen installation": { leftIcon: ChefHat, rightIcon: Hammer },
  "Worktop fitting": { leftIcon: HardHat, rightIcon: Settings },
  "Cabinet installation": { leftIcon: Box, rightIcon: Hammer },
  "Appliance fitting": { leftIcon: Plug, rightIcon: Settings },
  
  // Home Cleaning subcategories
  "Deep cleaning": { leftIcon: Sparkles, rightIcon: Droplets },
  "Regular cleaning": { leftIcon: Sparkles, rightIcon: CheckCircle },
  "End of tenancy": { leftIcon: Home, rightIcon: Sparkles },
  "Carpet cleaning": { leftIcon: Droplets, rightIcon: Sparkles },
  
  // Business Consulting subcategories
  "Strategy consulting": { leftIcon: Briefcase, rightIcon: TrendingUp },
  "Management consulting": { leftIcon: Users, rightIcon: BarChart3 },
  "Financial consulting": { leftIcon: LineChart, rightIcon: Calculator },
  "HR consulting": { leftIcon: Users, rightIcon: ClipboardList },
  
  // Marketing & Advertising subcategories
  "Digital marketing": { leftIcon: Megaphone, rightIcon: Monitor },
  "SEO": { leftIcon: TrendingUp, rightIcon: Search },
  "Social media marketing": { leftIcon: MessageSquare, rightIcon: Megaphone },
  "Content marketing": { leftIcon: PenTool, rightIcon: Megaphone },
  "PPC advertising": { leftIcon: CreditCard, rightIcon: Megaphone },
  
  // Web Development subcategories
  "Website design": { leftIcon: Monitor, rightIcon: Palette },
  "E-commerce development": { leftIcon: ShoppingCart, rightIcon: Code },
  "WordPress development": { leftIcon: Code, rightIcon: Monitor },
  "Custom web apps": { leftIcon: Code, rightIcon: Laptop },
  
  // Graphic Design subcategories
  "Logo design": { leftIcon: PenTool, rightIcon: Palette },
  "Branding": { leftIcon: Briefcase, rightIcon: Palette },
  "Print design": { leftIcon: PenTool, rightIcon: FileText },
  "UI/UX design": { leftIcon: Monitor, rightIcon: PenTool },
  
  // Personal Training subcategories
  "Weight loss training": { leftIcon: Dumbbell, rightIcon: TrendingDown },
  "Muscle building": { leftIcon: Dumbbell, rightIcon: TrendingUp },
  "Home training": { leftIcon: Home, rightIcon: Dumbbell },
  "Online coaching": { leftIcon: Video, rightIcon: Dumbbell },
  
  // Life Coaching subcategories
  "Career coaching": { leftIcon: Briefcase, rightIcon: TrendingUp },
  "Relationship coaching": { leftIcon: Heart, rightIcon: MessageSquare },
  "Personal development": { leftIcon: Brain, rightIcon: Award },
  "Goal setting": { leftIcon: Award, rightIcon: TrendingUp },
  
  // Massage Therapy subcategories
  "Deep tissue massage": { leftIcon: Heart, rightIcon: Activity },
  "Sports massage": { leftIcon: Dumbbell, rightIcon: Heart },
  "Relaxation massage": { leftIcon: Flower2, rightIcon: Heart },
  "Thai massage": { leftIcon: Activity, rightIcon: Flower2 },
  
  // Professional Organizing subcategories
  "Home organization": { leftIcon: Home, rightIcon: ClipboardList },
  "Office organization": { leftIcon: Briefcase, rightIcon: Archive },
  "Decluttering": { leftIcon: Archive, rightIcon: Sparkles },
  "Storage solutions": { leftIcon: Box, rightIcon: Warehouse },
  
  // Handyman Services subcategories
  "General repairs": { leftIcon: Wrench, rightIcon: Hammer },
  "Furniture assembly": { leftIcon: Sofa, rightIcon: Hammer },
  "Picture hanging": { leftIcon: Layers, rightIcon: Hammer },
  "Minor installations": { leftIcon: Settings, rightIcon: Wrench },
  
  // Appliance Repair subcategories
  "Washing machine repair": { leftIcon: Settings, rightIcon: Droplets },
  "Refrigerator repair": { leftIcon: Archive, rightIcon: Settings },
  "Oven repair": { leftIcon: Flame, rightIcon: Wrench },
  "Dishwasher repair": { leftIcon: Droplets, rightIcon: Settings },
  
  // HVAC Repair subcategories
  "Air conditioning repair": { leftIcon: Wind, rightIcon: Settings },
  "Heating repair": { leftIcon: Flame, rightIcon: Wrench },
  "Boiler servicing": { leftIcon: Flame, rightIcon: CheckCircle },
  "Ventilation repair": { leftIcon: Wind, rightIcon: Settings },
  
  // Locksmith Services subcategories
  "Lock replacement": { leftIcon: Lock, rightIcon: Key },
  "Emergency lockout": { leftIcon: Key, rightIcon: Clock },
  "Key cutting": { leftIcon: Key, rightIcon: Scissors },
  "Security upgrades": { leftIcon: Shield, rightIcon: Lock },
  
  // Computer Repair subcategories
  "Laptop repair": { leftIcon: Laptop, rightIcon: Wrench },
  "Desktop repair": { leftIcon: Monitor, rightIcon: Settings },
  "Virus removal": { leftIcon: Shield, rightIcon: Laptop },
  "Data recovery": { leftIcon: HardDrive, rightIcon: Settings },
  
  // IT Support subcategories
  "Network troubleshooting": { leftIcon: Router, rightIcon: Settings },
  "Software installation": { leftIcon: Monitor, rightIcon: Settings },
  "Hardware setup": { leftIcon: Laptop, rightIcon: Wrench },
  "Remote support": { leftIcon: Phone, rightIcon: Monitor },
  
  // App Development subcategories
  "iOS development": { leftIcon: Smartphone, rightIcon: Code },
  "Android development": { leftIcon: Tablet, rightIcon: Code },
  "Cross-platform apps": { leftIcon: Code, rightIcon: Monitor },
  "App maintenance": { leftIcon: Settings, rightIcon: Smartphone },
  
  // Math Tutoring subcategories
  "Primary maths": { leftIcon: Calculator, rightIcon: BookOpen },
  "GCSE maths": { leftIcon: Calculator, rightIcon: GraduationCap },
  "A-Level maths": { leftIcon: Calculator, rightIcon: Award },
  "Adult numeracy": { leftIcon: Calculator, rightIcon: Brain },
  
  // English Tutoring subcategories
  "Primary English": { leftIcon: BookOpen, rightIcon: PenTool },
  "GCSE English": { leftIcon: BookOpen, rightIcon: GraduationCap },
  "IELTS preparation": { leftIcon: Globe, rightIcon: BookOpen },
  "Creative writing": { leftIcon: PenLine, rightIcon: BookOpen },
  
  // Music Lessons subcategories
  "Piano lessons": { leftIcon: Music, rightIcon: Headphones },
  "Guitar lessons": { leftIcon: Music, rightIcon: Speaker },
  "Vocal training": { leftIcon: Mic, rightIcon: Music },
  "Music theory": { leftIcon: BookOpen, rightIcon: Music },
  
  // Language Tutoring subcategories
  "Spanish lessons": { leftIcon: Globe, rightIcon: MessageSquare },
  "French lessons": { leftIcon: Globe, rightIcon: BookOpen },
  "Mandarin lessons": { leftIcon: MessageSquare, rightIcon: Globe },
  "German lessons": { leftIcon: BookOpen, rightIcon: Globe },
  
  // Hair Styling subcategories
  "Haircuts": { leftIcon: Scissors, rightIcon: Cog },
  "Hair coloring": { leftIcon: Palette, rightIcon: Sparkles },
  "Hair extensions": { leftIcon: Scissors, rightIcon: Sparkles },
  "Styling for events": { leftIcon: Camera, rightIcon: Scissors },
  
  // Makeup Services subcategories
  "Bridal makeup": { leftIcon: Heart, rightIcon: Sparkles },
  "Party makeup": { leftIcon: Smile, rightIcon: Camera },
  "Makeup lessons": { leftIcon: Smile, rightIcon: BookOpen },
  "Special effects makeup": { leftIcon: Palette, rightIcon: Camera },
  
  // Nail Services subcategories
  "Manicure": { leftIcon: Sparkles, rightIcon: Palette },
  "Pedicure": { leftIcon: Footprints, rightIcon: Sparkles },
  "Gel nails": { leftIcon: Sparkles, rightIcon: Gem },
  "Nail art": { leftIcon: Palette, rightIcon: Sparkles },
  
  // Spa Treatments subcategories
  "Facials": { leftIcon: Smile, rightIcon: Droplets },
  "Body treatments": { leftIcon: Heart, rightIcon: Flower2 },
  "Waxing": { leftIcon: Scissors, rightIcon: Sparkles },
  "Aromatherapy": { leftIcon: Flower2, rightIcon: Droplets },
  
  // Nutrition Counseling subcategories
  "Diet planning": { leftIcon: Apple, rightIcon: ClipboardList },
  "Weight management": { leftIcon: Activity, rightIcon: TrendingDown },
  "Sports nutrition": { leftIcon: Dumbbell, rightIcon: Apple },
  "Meal prep advice": { leftIcon: ChefHat, rightIcon: Apple },
  
  // Physiotherapy subcategories
  "Sports injuries": { leftIcon: Activity, rightIcon: Stethoscope },
  "Back pain treatment": { leftIcon: Heart, rightIcon: Activity },
  "Post-surgery rehab": { leftIcon: Stethoscope, rightIcon: Heart },
  "Mobility improvement": { leftIcon: Activity, rightIcon: TrendingUp },
  
  // Yoga & Pilates subcategories
  "Beginner yoga": { leftIcon: Activity, rightIcon: Heart },
  "Advanced yoga": { leftIcon: Activity, rightIcon: Award },
  "Pilates classes": { leftIcon: Dumbbell, rightIcon: Activity },
  "Private sessions": { leftIcon: Users, rightIcon: Activity },
  
  // Mental Health Support subcategories
  "Counseling": { leftIcon: Brain, rightIcon: Heart },
  "CBT therapy": { leftIcon: Brain, rightIcon: ClipboardList },
  "Stress management": { leftIcon: Heart, rightIcon: Activity },
  "Anxiety support": { leftIcon: Brain, rightIcon: Shield },
  
  // Legal Advice subcategories
  "Family law": { leftIcon: Heart, rightIcon: Scale },
  "Property law": { leftIcon: Home, rightIcon: FileText },
  "Employment law": { leftIcon: Briefcase, rightIcon: Scale },
  "Contract review": { leftIcon: FileText, rightIcon: CheckCircle },
  
  // Accounting Services subcategories
  "Bookkeeping": { leftIcon: BookOpen, rightIcon: Calculator },
  "Tax returns": { leftIcon: Receipt, rightIcon: Calculator },
  "Payroll services": { leftIcon: Users, rightIcon: CreditCard },
  "Financial statements": { leftIcon: FileText, rightIcon: LineChart },
  
  // Financial Planning subcategories
  "Retirement planning": { leftIcon: PiggyBank, rightIcon: LineChart },
  "Investment advice": { leftIcon: TrendingUp, rightIcon: Coins },
  "Mortgage advice": { leftIcon: Home, rightIcon: CreditCard },
  "Debt management": { leftIcon: CreditCard, rightIcon: TrendingDown },
  
  // Tax Services subcategories
  "Personal tax": { leftIcon: Receipt, rightIcon: Calculator },
  "Business tax": { leftIcon: Briefcase, rightIcon: Receipt },
  "VAT returns": { leftIcon: FileText, rightIcon: Calculator },
  "Tax planning": { leftIcon: Calculator, rightIcon: TrendingUp },
  
  // Event Photography subcategories
  "Wedding photography": { leftIcon: Heart, rightIcon: Camera },
  "Corporate events": { leftIcon: Briefcase, rightIcon: Camera },
  "Birthday parties": { leftIcon: Calendar, rightIcon: Camera },
  "Portrait photography": { leftIcon: Smile, rightIcon: Camera },
  
  // Catering Services subcategories
  "Wedding catering": { leftIcon: Heart, rightIcon: UtensilsCrossed },
  "Corporate catering": { leftIcon: Briefcase, rightIcon: ChefHat },
  "Party catering": { leftIcon: Calendar, rightIcon: UtensilsCrossed },
  "Dietary specific catering": { leftIcon: Apple, rightIcon: ChefHat },
  
  // DJ Services subcategories
  "Wedding DJ": { leftIcon: Heart, rightIcon: Music },
  "Party DJ": { leftIcon: Calendar, rightIcon: Radio },
  "Equipment hire": { leftIcon: Speaker, rightIcon: Headphones },
  
  // Event Planning subcategories
  "Wedding planning": { leftIcon: Heart, rightIcon: Calendar },
  "Full event coordination": { leftIcon: ClipboardList, rightIcon: Calendar },
  
  // Pet Grooming subcategories
  "Dog grooming": { leftIcon: Dog, rightIcon: Scissors },
  "Cat grooming": { leftIcon: Heart, rightIcon: Scissors },
  "Nail trimming": { leftIcon: Scissors, rightIcon: Sparkles },
  "Bathing": { leftIcon: Droplets, rightIcon: Sparkles },
  
  // Dog Walking subcategories
  "Individual walks": { leftIcon: Dog, rightIcon: Footprints },
  "Group walks": { leftIcon: Users, rightIcon: Dog },
  "Puppy walking": { leftIcon: Heart, rightIcon: Footprints },
  "Senior dog care": { leftIcon: Dog, rightIcon: Heart },
  
  // Pet Sitting subcategories
  "Home visits": { leftIcon: Home, rightIcon: Dog },
  "Overnight care": { leftIcon: Clock, rightIcon: Heart },
  "Holiday care": { leftIcon: Calendar, rightIcon: Dog },
  "Multiple pets": { leftIcon: Users, rightIcon: Heart },
  
  // Pet Training subcategories
  "Puppy training": { leftIcon: Dog, rightIcon: Award },
  "Obedience training": { leftIcon: Award, rightIcon: CheckCircle },
  "Behavior correction": { leftIcon: Brain, rightIcon: Dog },
  "Agility training": { leftIcon: Activity, rightIcon: Award },
  
  // Car Repair subcategories
  "Engine repair": { leftIcon: Car, rightIcon: Wrench },
  "Brake repair": { leftIcon: Car, rightIcon: Settings },
  "Transmission repair": { leftIcon: Wrench, rightIcon: Car },
  "Electrical repair": { leftIcon: Zap, rightIcon: Car },
  
  // Car Maintenance subcategories
  "Oil changes": { leftIcon: Droplets, rightIcon: Car },
  "Tire rotation": { leftIcon: Car, rightIcon: Settings },
  "MOT preparation": { leftIcon: CheckCircle, rightIcon: Car },
  "Brake servicing": { leftIcon: Settings, rightIcon: Car },
  
  // Car Detailing subcategories
  "Interior cleaning": { leftIcon: Sparkles, rightIcon: Car },
  "Exterior wash": { leftIcon: Droplets, rightIcon: Sparkles },
  "Paint correction": { leftIcon: Paintbrush, rightIcon: Car },
  "Ceramic coating": { leftIcon: Shield, rightIcon: Car },
  
  // Bodywork & Paint subcategories
  "Dent removal": { leftIcon: Hammer, rightIcon: Car },
  "Scratch repair": { leftIcon: Paintbrush, rightIcon: Car },
  "Full respray": { leftIcon: Paintbrush, rightIcon: Sparkles },
  "Panel replacement": { leftIcon: Wrench, rightIcon: Car },
  
  // Moving Services subcategories
  "House removals": { leftIcon: Home, rightIcon: TruckIcon },
  "Office removals": { leftIcon: Briefcase, rightIcon: TruckIcon },
  "Single item moves": { leftIcon: Package, rightIcon: TruckIcon },
  "International moves": { leftIcon: Plane, rightIcon: TruckIcon },
  
  // Packing Services subcategories
  "Full packing service": { leftIcon: Box, rightIcon: Package },
  "Fragile item packing": { leftIcon: Package, rightIcon: Shield },
  "Unpacking service": { leftIcon: Box, rightIcon: Home },
  "Packing materials": { leftIcon: Package, rightIcon: Box },
  
  // Storage Solutions subcategories
  "Self storage": { leftIcon: Warehouse, rightIcon: Box },
  "Container storage": { leftIcon: Archive, rightIcon: Package },
  "Document storage": { leftIcon: FileText, rightIcon: Archive },
  "Long-term storage": { leftIcon: Warehouse, rightIcon: Clock },
  
  // Furniture Assembly subcategories
  "Flat pack assembly": { leftIcon: Hammer, rightIcon: Sofa },
  "Ikea assembly": { leftIcon: Sofa, rightIcon: Hammer },
  "Office furniture": { leftIcon: Briefcase, rightIcon: Hammer },
  "Disassembly service": { leftIcon: Wrench, rightIcon: Box }
};

// Helper function to get icons dynamically based on current page context
export const getPageIcons = (sector: any, currentMainCategory: any, currentSubCategory: any): { leftIcon: LucideIcon; rightIcon: LucideIcon } => {
  // Priority: SubCategory > MainCategory > Sector
  if (currentSubCategory && subCategoryToolIcons[currentSubCategory.name || currentSubCategory]) {
    return subCategoryToolIcons[currentSubCategory.name || currentSubCategory];
  }
  
  if (currentMainCategory && mainCategoryToolIcons[currentMainCategory.name]) {
    return mainCategoryToolIcons[currentMainCategory.name];
  }
  
  if (sector && sectorToolIcons[sector.name]) {
    return sectorToolIcons[sector.name];
  }
  
  // Default fallback
  return { leftIcon: Wrench, rightIcon: Settings };
};
