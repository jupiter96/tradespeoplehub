export interface ServiceAddon {
  id: number;
  title: string;
  price: number;
  description?: string;
  deliveryTime?: string;
}

export interface ServicePackage {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  priceUnit: string;
  description: string;
  highlights: string[];
  features: string[];
  deliveryTime?: string;
  revisions?: string;
  addons?: ServiceAddon[];
}

export interface Service {
  id: number;
  image: string;
  providerName: string;
  tradingName: string; // Business/Trading name displayed to users
  providerImage: string;
  description: string;
  category: string; // Sector (e.g., "Home & Garden")
  subcategory?: string; // Main Category (e.g., "Plumbing")
  detailedSubcategory?: string; // Detailed Subcategory (e.g., "Fixing leakage")
  rating: number;
  reviewCount: number;
  completedTasks: number;
  price: string;
  originalPrice?: string;
  priceUnit: string;
  badges?: string[];
  deliveryType: "same-day" | "standard";
  postcode: string;
  location: string;
  latitude?: number;
  longitude?: number;
  highlights?: string[]; // Key service highlights
  addons?: ServiceAddon[]; // Service extras that can be added
  idealFor?: string[]; // Situations/needs this service is ideal for
  specialization?: string; // Professional's area of expertise (e.g., "Bathroom Fitters | Handyman")
  packages?: ServicePackage[]; // Service packages for tiered pricing
  skills?: string[]; // Professional's skills
  responseTime?: string; // Average response time
  portfolioImages?: string[]; // Portfolio images URLs
}

// Provider images pool
const providerImages = [
  "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc2MjYwNjczNXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1618591552964-837a5a315fb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwcHJvZmVzc2lvbmFsJTIwd29ya2VyfGVufDF8fHx8MTc2MjY1NjUzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1607286908165-b8b6a2874fc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2NTY1Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1496180470114-6ef490f3ff22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2MjYzNTk2MXww&ixlib=rb-4.1.0&q=80&w=1080"
];

// Addon templates by category
const addonTemplates: Record<string, ServiceAddon[]> = {
  "Plumbing": [
    { id: 1, title: "Emergency callout (within 1 hour)", price: 30 },
    { id: 2, title: "Weekend or evening service", price: 25 },
    { id: 3, title: "Full system inspection", price: 40 },
    { id: 4, title: "Water pressure test", price: 20 },
    { id: 5, title: "Preventive maintenance check", price: 35 },
    { id: 6, title: "Premium fixtures installation", price: 55 },
    { id: 7, title: "Water filtration system", price: 80 },
    { id: 8, title: "Leak detection inspection", price: 30 },
    { id: 9, title: "Pipe insulation service", price: 45 },
    { id: 10, title: "Same-day completion guarantee", price: 50 }
  ],
  "Electrical Work": [
    { id: 1, title: "Smart home integration", price: 120 },
    { id: 2, title: "Circuit breaker upgrade", price: 85 },
    { id: 3, title: "Safety inspection certificate", price: 45 },
    { id: 4, title: "USB outlet installation", price: 35 },
    { id: 5, title: "Outdoor lighting setup", price: 95 },
    { id: 6, title: "Emergency 24/7 callout", price: 75 },
    { id: 7, title: "Energy efficiency audit", price: 60 },
    { id: 8, title: "Surge protection installation", price: 55 },
    { id: 9, title: "LED lighting conversion", price: 40 },
    { id: 10, title: "EV charger installation", price: 150 }
  ],
  "Painting & Decorating": [
    { id: 1, title: "Premium paint quality upgrade", price: 3 },
    { id: 2, title: "Wallpaper removal service", price: 5 },
    { id: 3, title: "Ceiling painting included", price: 4 },
    { id: 4, title: "Furniture moving & protection", price: 50 },
    { id: 5, title: "Next-day start (express)", price: 75 },
    { id: 6, title: "Anti-mould paint treatment", price: 45 },
    { id: 7, title: "Trim and skirting painting", price: 35 },
    { id: 8, title: "Minor wall repairs", price: 40 },
    { id: 9, title: "Colour consultation service", price: 30 },
    { id: 10, title: "Eco-friendly paint option", price: 50 }
  ],
  "Carpentry": [
    { id: 1, title: "Premium hardwood upgrade", price: 80 },
    { id: 2, title: "Custom finish & staining", price: 60 },
    { id: 3, title: "Installation service included", price: 45 },
    { id: 4, title: "Warranty extension (2 years)", price: 40 },
    { id: 5, title: "Same-week completion", price: 70 },
    { id: 6, title: "Hardware upgrade package", price: 55 },
    { id: 7, title: "Soft-close mechanism", price: 35 },
    { id: 8, title: "Additional shelving units", price: 50 },
    { id: 9, title: "Built-in lighting", price: 90 },
    { id: 10, title: "Custom measurements", price: 25 }
  ],
  "Cleaning": [
    { id: 1, title: "Deep carpet cleaning", price: 45 },
    { id: 2, title: "Window cleaning (inside & out)", price: 35 },
    { id: 3, title: "Oven & appliance cleaning", price: 30 },
    { id: 4, title: "Eco-friendly products", price: 15 },
    { id: 5, title: "Ironing service", price: 25 },
    { id: 6, title: "Fridge deep clean", price: 20 },
    { id: 7, title: "Balcony/patio cleaning", price: 30 },
    { id: 8, title: "Wall & ceiling dusting", price: 25 },
    { id: 9, title: "Same-day service", price: 40 },
    { id: 10, title: "Pet-friendly cleaning", price: 20 }
  ],
  "Gardening": [
    { id: 1, title: "Green waste removal", price: 35 },
    { id: 2, title: "Hedge trimming service", price: 40 },
    { id: 3, title: "Lawn fertilisation", price: 30 },
    { id: 4, title: "Weed control treatment", price: 25 },
    { id: 5, title: "Seasonal planting", price: 50 },
    { id: 6, title: "Irrigation system check", price: 45 },
    { id: 7, title: "Pest control service", price: 55 },
    { id: 8, title: "Mulching service", price: 35 },
    { id: 9, title: "Tree pruning", price: 60 },
    { id: 10, title: "Soil testing & analysis", price: 40 }
  ],
  "IT Support": [
    { id: 1, title: "Data backup & recovery", price: 50 },
    { id: 2, title: "Virus & malware removal", price: 40 },
    { id: 3, title: "Network setup & configuration", price: 70 },
    { id: 4, title: "Hardware upgrade installation", price: 45 },
    { id: 5, title: "Remote support package (3 months)", price: 90 },
    { id: 6, title: "VPN setup", price: 55 },
    { id: 7, title: "Email migration service", price: 60 },
    { id: 8, title: "Printer setup", price: 25 },
    { id: 9, title: "Software licensing assistance", price: 30 },
    { id: 10, title: "Cloud storage setup", price: 45 }
  ],
  "Graphic Design": [
    { id: 1, title: "Unlimited revisions", price: 50 },
    { id: 2, title: "Source files included", price: 35 },
    { id: 3, title: "Social media formats", price: 40 },
    { id: 4, title: "3D mockup renders", price: 60 },
    { id: 5, title: "Express 24h delivery", price: 80 },
    { id: 6, title: "Brand guidelines document", price: 70 },
    { id: 7, title: "Print-ready files", price: 30 },
    { id: 8, title: "Vector file formats", price: 25 },
    { id: 9, title: "Stock photo licensing", price: 45 },
    { id: 10, title: "Copyright transfer", price: 100 }
  ],
  "Photography": [
    { id: 1, title: "Additional hour of shooting", price: 80 },
    { id: 2, title: "Advanced photo editing", price: 60 },
    { id: 3, title: "Drone photography", price: 120 },
    { id: 4, title: "Photo album printing", price: 90 },
    { id: 5, title: "Rush delivery (24h)", price: 100 },
    { id: 6, title: "High-res digital downloads", price: 40 },
    { id: 7, title: "Second photographer", price: 150 },
    { id: 8, title: "Video highlights reel", price: 200 },
    { id: 9, title: "Location scouting", price: 50 },
    { id: 10, title: "Studio rental included", price: 75 }
  ],
  "Tutoring": [
    { id: 1, title: "Custom study materials", price: 25 },
    { id: 2, title: "Progress tracking reports", price: 20 },
    { id: 3, title: "Exam preparation pack", price: 35 },
    { id: 4, title: "Weekend sessions available", price: 15 },
    { id: 5, title: "Group session discount", price: 30 },
    { id: 6, title: "Online resource library access", price: 20 },
    { id: 7, title: "Mock exam sessions", price: 40 },
    { id: 8, title: "Parent consultation calls", price: 25 },
    { id: 9, title: "Homework support package", price: 30 },
    { id: 10, title: "Subject workbook included", price: 20 }
  ],
  "Beauty & Wellness": [
    { id: 1, title: "Premium product upgrade", price: 25 },
    { id: 2, title: "Extended session (+30 min)", price: 35 },
    { id: 3, title: "Complimentary manicure", price: 20 },
    { id: 4, title: "Hot stone treatment", price: 30 },
    { id: 5, title: "Aromatherapy oils", price: 15 },
    { id: 6, title: "Skin analysis consultation", price: 25 },
    { id: 7, title: "Take-home care kit", price: 40 },
    { id: 8, title: "Express service", price: 20 },
    { id: 9, title: "Loyalty package (5 sessions)", price: 150 },
    { id: 10, title: "Mobile service at your home", price: 45 }
  ],
  "Legal Services": [
    { id: 1, title: "Urgent document review (24h)", price: 100 },
    { id: 2, title: "Additional consultation hour", price: 120 },
    { id: 3, title: "Document drafting service", price: 150 },
    { id: 4, title: "Court representation", price: 300 },
    { id: 5, title: "Legal research package", price: 90 },
    { id: 6, title: "Notarization service", price: 50 },
    { id: 7, title: "Translation services", price: 80 },
    { id: 8, title: "Follow-up consultation", price: 75 },
    { id: 9, title: "Document filing service", price: 60 },
    { id: 10, title: "Priority email support", price: 40 }
  ],
  "Pet Services": [
    { id: 1, title: "Additional pet (+50%)", price: 20 },
    { id: 2, title: "Premium organic products", price: 25 },
    { id: 3, title: "Nail trimming included", price: 15 },
    { id: 4, title: "Teeth cleaning service", price: 30 },
    { id: 5, title: "Flea & tick treatment", price: 20 },
    { id: 6, title: "Photo session included", price: 25 },
    { id: 7, title: "Weekend/evening service", price: 15 },
    { id: 8, title: "Mobile service at your home", price: 35 },
    { id: 9, title: "Extended playtime (+30 min)", price: 20 },
    { id: 10, title: "Daily update photos", price: 10 }
  ],
  "Automotive": [
    { id: 1, title: "Full vehicle inspection", price: 45 },
    { id: 2, title: "Diagnostic report", price: 35 },
    { id: 3, title: "Courtesy car included", price: 60 },
    { id: 4, title: "Express same-day service", price: 50 },
    { id: 5, title: "Collection & delivery", price: 40 },
    { id: 6, title: "Premium parts upgrade", price: 80 },
    { id: 7, title: "Extended warranty", price: 70 },
    { id: 8, title: "Interior valeting", price: 45 },
    { id: 9, title: "Wheel alignment check", price: 30 },
    { id: 10, title: "Fluid top-up service", price: 25 }
  ],
  "Moving & Storage": [
    { id: 1, title: "Packing materials included", price: 50 },
    { id: 2, title: "Furniture disassembly/assembly", price: 80 },
    { id: 3, title: "Insurance coverage upgrade", price: 60 },
    { id: 4, title: "Additional mover", price: 70 },
    { id: 5, title: "Weekend move service", price: 100 },
    { id: 6, title: "Fragile items specialist", price: 65 },
    { id: 7, title: "Storage (first month)", price: 90 },
    { id: 8, title: "Piano/heavy items specialist", price: 120 },
    { id: 9, title: "Packing service included", price: 150 },
    { id: 10, title: "Express next-day move", price: 130 }
  ],
  "Default": [
    { id: 1, title: "Express service", price: 40 },
    { id: 2, title: "Weekend/evening availability", price: 30 },
    { id: 3, title: "Premium service upgrade", price: 50 },
    { id: 4, title: "Extended warranty", price: 45 },
    { id: 5, title: "Same-day completion", price: 60 },
    { id: 6, title: "Additional consultation", price: 35 },
    { id: 7, title: "Follow-up service included", price: 40 },
    { id: 8, title: "Satisfaction guarantee", price: 25 },
    { id: 9, title: "Priority booking", price: 20 },
    { id: 10, title: "Complimentary touch-up", price: 30 }
  ]
};

// Ideal for templates by category
const idealForTemplates: Record<string, string[]> = {
  "Plumbing": [
    "Leaking taps or pipes",
    "Blocked drains",
    "Burst pipes emergency",
    "Low water pressure",
    "Bathroom renovation",
    "Kitchen sink issues",
    "Boiler problems",
    "Toilet repairs",
    "Shower installation",
    "Radiator bleeding",
    "Water heater replacement",
    "Pipe corrosion",
    "Drainage smell issues",
    "Frozen pipes",
    "Tap upgrades",
    "Leaking radiators",
    "Washing machine installation",
    "Dishwasher fitting",
    "Emergency flood response",
    "Sump pump issues"
  ],
  "Electrical Work": [
    "Malfunctioning switches",
    "Old wiring systems",
    "Electrical problems",
    "Improve energy efficiency",
    "Power outages",
    "Light fixture installation",
    "Fuse box upgrades",
    "Smart home setup",
    "Socket installations",
    "Electrical safety checks",
    "Consumer unit replacement",
    "LED lighting upgrades",
    "Electric shower installation",
    "EV charging points",
    "Security lighting",
    "Outdoor power supply",
    "RCD protection",
    "Appliance circuit upgrades",
    "Electrical fault finding",
    "PAT testing required"
  ],
  "Painting & Decorating": [
    "Room makeover",
    "Property sale preparation",
    "Weather damage repair",
    "Damp walls treatment",
    "Tired-looking interiors",
    "New property decoration",
    "Wallpaper removal",
    "Feature wall creation",
    "Ceiling repairs",
    "Colour consultation needed",
    "Wood staining & varnishing",
    "Skirting board painting",
    "Door and frame painting",
    "Exterior fascia painting",
    "Render coating",
    "Anti-mould treatment",
    "Period property restoration",
    "Commercial premises",
    "Nursery decoration",
    "Hallway refresh"
  ],
  "Carpentry": [
    "Custom furniture needs",
    "Built-in storage solutions",
    "Door repairs",
    "Kitchen cabinet fitting",
    "Shelving installation",
    "Wardrobe assembly",
    "Wooden floor installation",
    "Window frame repairs",
    "Bespoke joinery",
    "Furniture restoration",
    "Skirting board replacement",
    "Staircase repairs",
    "Alcove shelving",
    "Window shutters",
    "Dado rail installation",
    "Boxing in pipes",
    "Loft ladder fitting",
    "Architrave repairs",
    "Garden decking",
    "Shed construction"
  ],
  "Cleaning": [
    "Moving in/out cleaning",
    "Deep clean needed",
    "Regular maintenance",
    "Post-renovation mess",
    "Carpet stains",
    "Oven cleaning",
    "Window cleaning",
    "Spring cleaning",
    "Office cleaning",
    "End of tenancy",
    "After party cleanup",
    "Hoarder house cleaning",
    "Upholstery cleaning",
    "Mattress cleaning",
    "Grout & tile cleaning",
    "Kitchen deep clean",
    "Bathroom sanitisation",
    "Garage clearout",
    "Commercial premises",
    "One-off deep clean"
  ],
  "Gardening": [
    "Overgrown garden",
    "Lawn maintenance",
    "Seasonal planting",
    "Garden redesign",
    "Hedge trimming",
    "Weed control",
    "Tree pruning",
    "Patio cleaning",
    "Garden clearance",
    "Landscape design",
    "Lawn mowing service",
    "Artificial grass installation",
    "Raised bed construction",
    "Garden fencing",
    "Pond maintenance",
    "Topiary shaping",
    "Leaf clearance",
    "Moss removal",
    "Soil preparation",
    "Garden lighting"
  ],
  "IT Support": [
    "Computer running slow",
    "Virus removal",
    "Data backup needed",
    "Network issues",
    "Software installation",
    "Hardware upgrade",
    "Email problems",
    "Printer setup",
    "Remote working setup",
    "Cloud migration",
    "Password recovery",
    "WiFi connectivity issues",
    "Operating system updates",
    "Computer won't start",
    "Blue screen errors",
    "Data recovery",
    "Mobile device sync",
    "Smart TV setup",
    "Home automation",
    "Cybersecurity setup"
  ],
  "Graphic Design": [
    "Brand identity creation",
    "Marketing materials",
    "Social media graphics",
    "Logo design",
    "Business cards",
    "Brochure design",
    "Packaging design",
    "Website graphics",
    "Presentation design",
    "Print advertising",
    "Menu design",
    "Poster design",
    "Flyer creation",
    "Email newsletter design",
    "Infographic creation",
    "Book cover design",
    "Label design",
    "Banner ads",
    "Event invitations",
    "Brand style guide"
  ],
  "Photography": [
    "Wedding coverage",
    "Portrait sessions",
    "Product photography",
    "Event documentation",
    "Property listings",
    "Corporate headshots",
    "Family photos",
    "Food photography",
    "Fashion shoots",
    "Professional portfolio",
    "Engagement photos",
    "Newborn photography",
    "Birthday parties",
    "Commercial shoots",
    "Automotive photography",
    "Architectural photos",
    "Sports events",
    "Conference coverage",
    "Pet photography",
    "Social media content"
  ],
  "Tutoring": [
    "Exam preparation",
    "Catch-up support",
    "Advanced learning",
    "Homework help",
    "Subject improvement",
    "University applications",
    "Confidence building",
    "GCSE/A-Level prep",
    "Adult learning",
    "Skill development",
    "11+ preparation",
    "SATs revision",
    "Struggling students",
    "Gifted & talented",
    "Special educational needs",
    "English as second language",
    "Music lessons",
    "Language learning",
    "Coding & programming",
    "Entrance exam prep"
  ],
  "Beauty & Wellness": [
    "Special occasion prep",
    "Regular maintenance",
    "Relaxation treatment",
    "Skin concerns",
    "Anti-aging care",
    "Stress relief",
    "Wedding preparation",
    "Self-care routine",
    "Confidence boost",
    "Problem skin",
    "Acne treatment",
    "Dry skin relief",
    "Bridal makeup",
    "Party looks",
    "Natural beauty",
    "Hair removal",
    "Nail art",
    "Eyebrow shaping",
    "Lash extensions",
    "Spray tanning"
  ],
  "Legal Services": [
    "Contract review",
    "Property purchase",
    "Business setup",
    "Dispute resolution",
    "Will preparation",
    "Employment issues",
    "Family matters",
    "Immigration advice",
    "Debt management",
    "Legal consultation",
    "Divorce proceedings",
    "Tenant disputes",
    "Company incorporation",
    "Intellectual property",
    "Power of attorney",
    "Probate services",
    "Personal injury claims",
    "Commercial leases",
    "Shareholder agreements",
    "GDPR compliance"
  ],
  "Pet Services": [
    "Busy schedule",
    "Holiday coverage",
    "Pet grooming needs",
    "Training required",
    "Health checkup",
    "New pet owner",
    "Behavioural issues",
    "Elderly pet care",
    "Multiple pets",
    "Special needs pets",
    "Puppy training",
    "Cat sitting",
    "Dog walking",
    "Show preparation",
    "Nail clipping",
    "Dental care",
    "Flea treatment",
    "Diet advice",
    "Exercise needs",
    "Anxiety issues"
  ],
  "Automotive": [
    "MOT due",
    "Strange noises",
    "Warning lights",
    "Regular servicing",
    "Pre-purchase inspection",
    "Breakdown repair",
    "Tyre replacement",
    "Battery issues",
    "Brake problems",
    "Performance issues",
    "Engine diagnostics",
    "Air conditioning service",
    "Clutch replacement",
    "Exhaust repairs",
    "Suspension issues",
    "Wheel alignment",
    "Oil change",
    "Coolant leaks",
    "Electrical faults",
    "Bodywork repairs"
  ],
  "Moving & Storage": [
    "House relocation",
    "Office move",
    "Downsizing",
    "Long distance move",
    "Short-term storage",
    "International move",
    "Student move",
    "Furniture delivery",
    "Packing assistance",
    "Temporary accommodation",
    "Piano moving",
    "Antique transport",
    "Single item moves",
    "Same-day moves",
    "House clearance",
    "Archive storage",
    "Climate controlled storage",
    "Business relocation",
    "Flat moves",
    "Removal boxes needed"
  ],
  "Default": [
    "Quick solution needed",
    "Professional service",
    "Quality results",
    "Reliable provider",
    "Flexible scheduling",
    "Affordable pricing",
    "Expert advice",
    "Same-day availability",
    "Verified professional",
    "Satisfaction guarantee",
    "Emergency callout",
    "Weekend service",
    "Evening appointments",
    "Free consultation",
    "Competitive quotes"
  ]
};

// Specialization templates by subcategory
const specializationTemplates: Record<string, string[]> = {
  "Plumbing": [
    "Emergency Plumber | Gas Safe Registered",
    "Bathroom Fitters | Heating Specialist",
    "Drainage Expert | Leak Detection",
    "Boiler Installation | Central Heating",
    "Kitchen & Bathroom Plumber"
  ],
  "Electrical Work": [
    "Certified Electrician | Part P Registered",
    "Electrical Testing | Fault Finding",
    "Smart Home Specialist | EV Charging",
    "Domestic & Commercial Electrician",
    "Rewiring Specialist | Fuse Box Upgrades"
  ],
  "Painting & Decorating": [
    "Interior Decorator | Exterior Painter",
    "Professional Painter | Wallpaper Specialist",
    "Commercial Decorating | Period Properties",
    "Spray Painter | Furniture Restoration",
    "Decorating Specialist | Colour Consultant"
  ],
  "Carpentry": [
    "Bespoke Joiner | Kitchen Fitter",
    "Carpenter | Built-in Furniture Specialist",
    "Flooring Expert | Door Hanging",
    "Cabinet Maker | Custom Woodwork",
    "Handyman | General Carpentry"
  ],
  "Cleaning": [
    "Deep Cleaning Specialist | End of Tenancy",
    "Commercial Cleaner | Office Maintenance",
    "Domestic Cleaning | Regular Service",
    "Carpet & Upholstery Cleaning",
    "Move In/Out Specialist | Post-Renovation"
  ],
  "Gardening": [
    "Landscape Gardener | Garden Designer",
    "Tree Surgeon | Hedge Specialist",
    "Lawn Care Expert | Maintenance Service",
    "Garden Clearance | Landscaping",
    "Horticulturist | Planting Specialist"
  ],
  "IT Support": [
    "Computer Repair | Network Specialist",
    "IT Technician | Home Office Setup",
    "Data Recovery | Virus Removal Expert",
    "Cloud Services | Remote Support",
    "Hardware Upgrades | Software Installation"
  ],
  "Graphic Design": [
    "Brand Designer | Logo Specialist",
    "Graphic Designer | Marketing Materials",
    "Digital Designer | Print Specialist",
    "Creative Designer | Social Media Graphics",
    "Illustrator | Packaging Designer"
  ],
  "Web Development": [
    "Full Stack Developer | WordPress Specialist",
    "Frontend Developer | Responsive Design",
    "E-commerce Specialist | Shopify Expert",
    "Web Designer | UX/UI Designer",
    "Backend Developer | Database Expert"
  ],
  "Photography": [
    "Wedding Photographer | Event Coverage",
    "Portrait Photographer | Family Sessions",
    "Commercial Photographer | Product Shots",
    "Real Estate Photographer | Property Listings",
    "Food Photographer | Social Media Content"
  ],
  "Writing & Translation": [
    "Content Writer | SEO Specialist",
    "Copywriter | Marketing Content",
    "Technical Writer | Documentation",
    "Translator | Proofreader",
    "Blog Writer | Article Specialist"
  ],
  "Tutoring": [
    "Qualified Teacher | GCSE/A-Level Tutor",
    "Maths Tutor | Exam Preparation",
    "English Tutor | 11+ Specialist",
    "Science Tutor | University Entrance",
    "Music Teacher | Instrument Tutor"
  ],
  "Beauty & Wellness": [
    "Beauty Therapist | Facial Specialist",
    "Makeup Artist | Bridal Specialist",
    "Nail Technician | Manicure Expert",
    "Aesthetician | Skincare Specialist",
    "Massage Therapist | Wellness Expert"
  ],
  "Personal Training": [
    "Personal Trainer | Fitness Coach",
    "Strength & Conditioning | Weight Loss",
    "Yoga Instructor | Wellness Coach",
    "Sports Coach | Athletic Training",
    "Nutrition Advisor | Fitness Specialist"
  ],
  "Legal Services": [
    "Solicitor | Property Law Specialist",
    "Family Law | Divorce Solicitor",
    "Employment Lawyer | Contract Law",
    "Commercial Solicitor | Business Law",
    "Immigration Lawyer | Legal Advisor"
  ],
  "Accounting": [
    "Chartered Accountant | Tax Specialist",
    "Bookkeeper | Payroll Services",
    "Tax Advisor | Self-Assessment",
    "Financial Consultant | VAT Returns",
    "Management Accountant | Business Advisory"
  ],
  "Pet Services": [
    "Dog Walker | Pet Sitter",
    "Pet Groomer | Show Preparation",
    "Dog Trainer | Behavioural Specialist",
    "Veterinary Nurse | Pet Care",
    "Cat Sitter | Small Animal Care"
  ],
  "Event Planning": [
    "Wedding Planner | Event Coordinator",
    "Party Organiser | Corporate Events",
    "Event Stylist | Decoration Specialist",
    "Conference Organiser | Event Manager",
    "Birthday Party Planner | Children's Events"
  ],
  "Automotive": [
    "Mechanic | Car Servicing Specialist",
    "Mobile Mechanic | Breakdown Service",
    "MOT Tester | Diagnostics Expert",
    "Auto Electrician | Car Electronics",
    "Body Shop | Paint & Repair Specialist"
  ],
  "Moving & Storage": [
    "Removal Specialist | House Moving",
    "Man & Van | Small Moves",
    "Storage Solutions | Packing Service",
    "International Removals | Long Distance",
    "Office Relocation | Commercial Moves"
  ],
  "Handyman": [
    "General Handyman | Property Maintenance",
    "Handyman Services | Odd Jobs",
    "Property Maintenance | Repairs",
    "Multi-Trade | Home Improvements",
    "Maintenance Specialist | Fix-it Service"
  ],
  "Default": [
    "Professional Service Provider",
    "Experienced Specialist | Quality Service",
    "Certified Professional | Reliable Service",
    "Expert Provider | Trusted Service",
    "Skilled Professional | Quality Assured"
  ]
};

// Helper function to get specialization for a service
const getSpecialization = (subcategory: string | undefined, serviceId: number): string => {
  // Use service ID as seed for consistent randomization
  const seed = serviceId * 5381 + 33;
  const random = (max: number) => ((seed * 1103515245 + 12345) % max);
  
  // Get appropriate specialization template
  const templateKey = subcategory && specializationTemplates[subcategory] 
    ? subcategory 
    : "Default";
  const template = specializationTemplates[templateKey];
  
  // Select one random specialization
  const index = random(template.length);
  return template[index];
};

// Helper function to get random idealFor items for a service
const getRandomIdealFor = (subcategory: string | undefined, serviceId: number): string[] => {
  // Use service ID as seed for consistent randomization
  const seed = serviceId * 7919 + 65537;
  const random = (max: number) => ((seed * 48271) % max);
  
  // Get appropriate idealFor template
  const templateKey = subcategory && idealForTemplates[subcategory] 
    ? subcategory 
    : "Default";
  const template = idealForTemplates[templateKey];
  
  // Randomly select 5-7 items for better coverage
  const numItems = 5 + (random(3)); // 5-7 items
  const selectedIndices = new Set<number>();
  const result: string[] = [];
  
  // Select random unique items
  let attempts = 0;
  while (result.length < numItems && attempts < 30) {
    const index = random(template.length);
    if (!selectedIndices.has(index)) {
      selectedIndices.add(index);
      result.push(template[index]);
    }
    attempts++;
  }
  
  return result;
};

// Helper function to get random addons for a service
const getRandomAddons = (subcategory: string | undefined, serviceId: number): ServiceAddon[] => {
  // Use service ID as seed for consistent randomization
  const seed = serviceId * 9301 + 49297;
  const random = (max: number) => (seed % max);
  
  // Get appropriate addon template
  const templateKey = subcategory && addonTemplates[subcategory] 
    ? subcategory 
    : "Default";
  const template = addonTemplates[templateKey];
  
  // Randomly select 3-5 addons
  const numAddons = 3 + (random(3)); // 3-5 addons
  const selectedIndices = new Set<number>();
  const result: ServiceAddon[] = [];
  
  // Select random unique addons
  let attempts = 0;
  while (result.length < numAddons && attempts < 20) {
    const index = random(template.length);
    if (!selectedIndices.has(index)) {
      selectedIndices.add(index);
      result.push({ ...template[index] });
    }
    attempts++;
  }
  
  return result;
};

export const allServices: Service[] = [
  // ==================== NEW PROFESSIONAL (NO REVIEWS YET) ====================
  {
    id: 0,
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3QlMjB0ZXN0aW5nJTIwY2FyfGVufDB8fHx8MTczMTMzNzIwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Alex Thompson",
    providerImage: providerImages[1],
    description: "MOT testing and certification services",
    category: "Automotive",
    subcategory: "Car Inspection",
    detailedSubcategory: "MOT Testing",
    rating: 0,
    reviewCount: 0,
    completedTasks: 0,
    price: "45",
    priceUnit: "test",
    badges: ["New Professional"],
    deliveryType: "standard",
    postcode: "SW19 2AB",
    location: "Wimbledon, London",
    latitude: 51.4214,
    longitude: -0.2065,
  },
  
  // ==================== HOME & GARDEN ====================
  
  // Plumbing
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Robert K.",
    providerImage: providerImages[0],
    description: "Emergency plumbing repairs and pipe installations",
    category: "Home & Garden",
    subcategory: "Plumbing",
    detailedSubcategory: "Fixing leakage",
    rating: 4.6,
    reviewCount: 189,
    completedTasks: 189,
    price: "120",
    priceUnit: "visit",
    badges: ["Emergency"],
    deliveryType: "same-day",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
    skills: ["Emergency Repairs", "Pipe Fitting", "Leak Detection", "Drainage Systems", "Boiler Service"],
    responseTime: "Within 2 hours",
    portfolioImages: [
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
    ],
    addons: [
      { 
        id: 1, 
        title: "Emergency call-out (same day)", 
        price: 50,
        description: "Priority emergency service within 2 hours",
        deliveryTime: "2 hours"
      },
      { 
        id: 2, 
        title: "Pipe camera inspection", 
        price: 80,
        description: "CCTV inspection to identify hidden issues",
        deliveryTime: "Same visit"
      },
      { 
        id: 3, 
        title: "Preventive maintenance check", 
        price: 45,
        description: "Full plumbing system inspection",
        deliveryTime: "Same visit"
      },
      { 
        id: 4, 
        title: "Water pressure test", 
        price: 35,
        description: "Complete water pressure analysis",
        deliveryTime: "Same visit"
      },
      { 
        id: 5, 
        title: "Warranty extension (12 months)", 
        price: 60,
        description: "Extended warranty on all repairs",
        deliveryTime: "Instant"
      }
    ]
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "James M.",
    providerImage: providerImages[1],
    description: "Bathroom and kitchen plumbing installations",
    category: "Home & Garden",
    subcategory: "Plumbing",
    detailedSubcategory: "Bathroom plumbing",
    rating: 4.8,
    reviewCount: 234,
    completedTasks: 234,
    price: "150",
    originalPrice: "180",
    priceUnit: "project",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
    skills: ["Bathroom Installation", "Kitchen Plumbing", "Heating Systems", "Pipe Fitting", "Water Heater Installation"],
    responseTime: "Within 1 day",
    addons: [
      { 
        id: 1, 
        title: "Premium fixture installation", 
        price: 120,
        description: "Install high-end taps, shower heads, or fixtures",
        deliveryTime: "1 day"
      },
      { 
        id: 2, 
        title: "Water filter system", 
        price: 200,
        description: "Whole-house or under-sink water filtration",
        deliveryTime: "2 days"
      },
      { 
        id: 3, 
        title: "Heated towel rail installation", 
        price: 150,
        description: "Electric or plumbed towel radiator fitting",
        deliveryTime: "1 day"
      },
      { 
        id: 4, 
        title: "Waste disposal unit", 
        price: 100,
        description: "Kitchen sink waste disposal installation",
        deliveryTime: "1 day"
      }
    ]
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Tom S.",
    providerImage: providerImages[0],
    description: "Drain cleaning and unblocking services",
    category: "Home & Garden",
    subcategory: "Plumbing",
    detailedSubcategory: "Drain unblocking",
    rating: 4.7,
    reviewCount: 156,
    completedTasks: 156,
    price: "95",
    priceUnit: "visit",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
    skills: ["Drain Unblocking", "Leak Detection", "CCTV Surveys", "High Pressure Jetting", "Emergency Repairs"],
    responseTime: "Within 3 hours",
    portfolioImages: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&h=300&fit=crop",
    ],
    addons: [
      { 
        id: 1, 
        title: "High-pressure jetting", 
        price: 120,
        description: "Deep clean drains with professional jetting equipment",
        deliveryTime: "Same visit"
      },
      { 
        id: 2, 
        title: "CCTV drain survey", 
        price: 150,
        description: "Camera inspection with detailed report",
        deliveryTime: "Same visit"
      },
      { 
        id: 3, 
        title: "Descaling treatment", 
        price: 80,
        description: "Remove limescale buildup from pipes",
        deliveryTime: "Same visit"
      },
      { 
        id: 4, 
        title: "Root removal service", 
        price: 200,
        description: "Remove tree roots blocking outdoor drains",
        deliveryTime: "1 day"
      },
      { 
        id: 5, 
        title: "Preventive maintenance plan", 
        price: 90,
        description: "Quarterly drain cleaning service",
        deliveryTime: "Scheduled"
      }
    ]
  },

  // Electrical Work
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1759542877886-39d81e8f2eee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHNlcnZpY2V8ZW58MXx8fHwxNzYyNjU2NTMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Sarah L.",
    providerImage: providerImages[2],
    description: "Electrical repairs, wiring and home automation",
    category: "Home & Garden",
    subcategory: "Electrical Work",
    detailedSubcategory: "Rewiring",
    rating: 4.8,
    reviewCount: 76,
    completedTasks: 76,
    price: "75",
    originalPrice: "95",
    priceUnit: "hr",
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
    skills: ["Electrical Wiring", "Smart Home Systems", "Circuit Installation", "Safety Inspections", "EV Charger Installation"],
    responseTime: "Within 1 day",
    portfolioImages: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
    ],
    addons: [
      { 
        id: 1, 
        title: "Smart home integration", 
        price: 180,
        description: "Connect lights, thermostat, and switches to smart system",
        deliveryTime: "2 days"
      },
      { 
        id: 2, 
        title: "EV charging point installation", 
        price: 450,
        description: "Install electric vehicle home charging station",
        deliveryTime: "3 days"
      },
      { 
        id: 3, 
        title: "Consumer unit upgrade", 
        price: 350,
        description: "Replace old fuse box with modern RCD unit",
        deliveryTime: "1 day"
      },
      { 
        id: 4, 
        title: "Additional socket installation", 
        price: 85,
        description: "Install new electrical socket (per socket)",
        deliveryTime: "Same visit"
      },
      { 
        id: 5, 
        title: "Electrical safety certificate", 
        price: 120,
        description: "Full EICR inspection and certification",
        deliveryTime: "Same visit"
      }
    ]
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1759542877886-39d81e8f2eee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHNlcnZpY2V8ZW58MXx8fHwxNzYyNjU2NTMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Mark D.",
    providerImage: providerImages[1],
    description: "Light fixture installation and electrical upgrades",
    category: "Home & Garden",
    subcategory: "Electrical Work",
    detailedSubcategory: "Light installation",
    rating: 4.9,
    reviewCount: 203,
    completedTasks: 203,
    price: "60",
    priceUnit: "hr",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "W2 1JH",
    location: "Paddington, London",
    latitude: 51.5171,
    longitude: -0.1774,
    skills: ["Lighting Design", "LED Installation", "Circuit Installation", "Fault Finding", "Outdoor Lighting"],
    responseTime: "Within 4 hours",
    addons: [
      { 
        id: 1, 
        title: "LED lighting upgrade", 
        price: 95,
        description: "Replace existing bulbs with energy-efficient LEDs",
        deliveryTime: "Same visit"
      },
      { 
        id: 2, 
        title: "Dimmer switch installation", 
        price: 65,
        description: "Install smart or standard dimmer switches",
        deliveryTime: "Same visit"
      },
      { 
        id: 3, 
        title: "Outdoor lighting installation", 
        price: 150,
        description: "Garden or security lighting setup",
        deliveryTime: "1 day"
      },
      { 
        id: 4, 
        title: "Chandelier installation", 
        price: 120,
        description: "Professional heavy fixture installation",
        deliveryTime: "Same visit"
      }
    ]
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1759542877886-39d81e8f2eee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHNlcnZpY2V8ZW58MXx8fHwxNzYyNjU2NTMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Emma C.",
    providerImage: providerImages[2],
    description: "Emergency electrical repairs and fuse box upgrades",
    category: "Home & Garden",
    subcategory: "Electrical Work",
    detailedSubcategory: "Fuse box upgrade",
    rating: 4.8,
    reviewCount: 167,
    completedTasks: 167,
    price: "250",
    priceUnit: "project",
    badges: ["Emergency"],
    deliveryType: "same-day",
    postcode: "NW1 5RA",
    location: "Camden, London",
    latitude: 51.5407,
    longitude: -0.1432,
    skills: ["Fuse Box Upgrades", "Emergency Repairs", "Electrical Testing", "Fault Finding", "Safety Certificates"],
    responseTime: "Within 2 hours",
    portfolioImages: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581092918484-8313e1f7e6e9?w=400&h=300&fit=crop",
    ],
  },

  // Painting & Decorating
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhaW50aW5nJTIwc2VydmljZXxlbnwxfHx8fDE3NjI1ODUzMjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Damian H.",
    providerImage: providerImages[1],
    description: "Professional interior and exterior house painting",
    category: "Home & Garden",
    subcategory: "Painting & Decorating",
    detailedSubcategory: "Interior painting",
    rating: 4.7,
    reviewCount: 93,
    completedTasks: 93,
    price: "15",
    priceUnit: "m²",
    deliveryType: "standard",
    postcode: "W1D 3QU",
    location: "Soho, London",
    latitude: 51.5142,
    longitude: -0.1318,
    skills: ["Interior Painting", "Exterior Painting", "Wallpaper Hanging", "Spray Painting", "Decorating"],
    responseTime: "Within 1 day",
    portfolioImages: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&h=300&fit=crop",
    ],
    addons: [
      { 
        id: 1, 
        title: "Premium paint upgrade", 
        price: 5,
        description: "Use designer-grade paint with better coverage (per m²)",
        deliveryTime: "Same project"
      },
      { 
        id: 2, 
        title: "Ceiling painting", 
        price: 8,
        description: "Paint ceilings to match or contrast (per m²)",
        deliveryTime: "Same project"
      },
      { 
        id: 3, 
        title: "Skirting & trim painting", 
        price: 80,
        description: "Paint all skirting boards and door frames",
        deliveryTime: "1 day"
      },
      { 
        id: 4, 
        title: "Feature wall accent", 
        price: 120,
        description: "Create stunning feature wall with specialty finish",
        deliveryTime: "1 day"
      },
      { 
        id: 5, 
        title: "Surface preparation", 
        price: 150,
        description: "Fill cracks, sand, and prepare surfaces",
        deliveryTime: "1 day"
      }
    ]
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhaW50aW5nJTIwc2VydmljZXxlbnwxfHx8fDE3NjI1ODUzMjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Lucy F.",
    providerImage: providerImages[2],
    description: "Exterior painting and weatherproofing services",
    category: "Home & Garden",
    subcategory: "Painting & Decorating",
    detailedSubcategory: "Exterior painting",
    rating: 4.6,
    reviewCount: 145,
    completedTasks: 145,
    price: "18",
    originalPrice: "22",
    priceUnit: "m²",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SE1 9SG",
    location: "Southwark, London",
    latitude: 51.5045,
    longitude: -0.0865,
  },
  {
    id: 9,
    image: "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhaW50aW5nJTIwc2VydmljZXxlbnwxfHx8fDE3NjI1ODUzMjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Oliver P.",
    providerImage: providerImages[1],
    description: "Wallpaper installation and removal services",
    category: "Home & Garden",
    subcategory: "Painting & Decorating",
    detailedSubcategory: "Wallpapering",
    rating: 4.9,
    reviewCount: 178,
    completedTasks: 178,
    price: "25",
    priceUnit: "m²",
    deliveryType: "standard",
    postcode: "WC2N 5DU",
    location: "Covent Garden, London",
    latitude: 51.5109,
    longitude: -0.1240,
  },

  // Gardening & Landscaping
  {
    id: 10,
    image: "https://images.unsplash.com/photo-1599776765307-c7fb21bf7a91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBwbGFudGluZ3xlbnwxfHx8fDE3NjI2NTY1MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Jacob B.",
    providerImage: providerImages[3],
    description: "Garden design, planting and maintenance services",
    category: "Home & Garden",
    subcategory: "Gardening & Landscaping",
    detailedSubcategory: "Garden design",
    rating: 4.6,
    reviewCount: 245,
    completedTasks: 245,
    price: "500",
    originalPrice: "650",
    priceUnit: "month",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },
  {
    id: 11,
    image: "https://images.unsplash.com/photo-1599776765307-c7fb21bf7a91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBwbGFudGluZ3xlbnwxfHx8fDE3NjI2NTY1MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Sophie H.",
    providerImage: providerImages[2],
    description: "Lawn mowing and garden maintenance",
    category: "Home & Garden",
    subcategory: "Gardening & Landscaping",
    detailedSubcategory: "Lawn care",
    rating: 4.7,
    reviewCount: 198,
    completedTasks: 198,
    price: "35",
    priceUnit: "visit",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "SW7 2DD",
    location: "South Kensington, London",
    latitude: 51.4945,
    longitude: -0.1763,
  },
  {
    id: 12,
    image: "https://images.unsplash.com/photo-1599776765307-c7fb21bf7a91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBwbGFudGluZ3xlbnwxfHx8fDE3NjI2NTY1MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "William R.",
    providerImage: providerImages[1],
    description: "Tree pruning and removal services",
    category: "Home & Garden",
    subcategory: "Gardening & Landscaping",
    detailedSubcategory: "Tree surgery",
    rating: 4.8,
    reviewCount: 134,
    completedTasks: 134,
    price: "200",
    priceUnit: "tree",
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },

  // Home Cleaning
  {
    id: 13,
    image: "https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHNlcnZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYyNTU3ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Margaret T.",
    providerImage: providerImages[2],
    description: "Deep cleaning and sanitization for homes & offices",
    category: "Home & Garden",
    subcategory: "Home Cleaning",
    detailedSubcategory: "Deep cleaning",
    rating: 4.9,
    reviewCount: 167,
    completedTasks: 167,
    price: "20",
    originalPrice: "25",
    priceUnit: "m²",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "SW7 2DD",
    location: "South Kensington, London",
    latitude: 51.4945,
    longitude: -0.1763,
  },
  {
    id: 14,
    image: "https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHNlcnZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYyNTU3ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Anna K.",
    providerImage: providerImages[2],
    description: "Regular weekly and monthly cleaning services",
    category: "Home & Garden",
    subcategory: "Home Cleaning",
    detailedSubcategory: "Regular cleaning",
    rating: 4.7,
    reviewCount: 289,
    completedTasks: 289,
    price: "15",
    priceUnit: "m²",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
  },
  {
    id: 15,
    image: "https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHNlcnZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYyNTU3ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Helen M.",
    providerImage: providerImages[2],
    description: "End of tenancy cleaning service",
    category: "Home & Garden",
    subcategory: "Home Cleaning",
    detailedSubcategory: "End of tenancy cleaning",
    rating: 4.8,
    reviewCount: 321,
    completedTasks: 321,
    price: "250",
    priceUnit: "property",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
  },

  // Carpentry
  {
    id: 16,
    image: "https://images.unsplash.com/photo-1626081063434-79a2169791b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50cnklMjB3b29kd29ya3xlbnwxfHx8fDE3NjI2MjE1Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "David W.",
    providerImage: providerImages[0],
    description: "Custom carpentry and woodworking projects",
    category: "Home & Garden",
    subcategory: "Carpentry",
    detailedSubcategory: "Custom furniture",
    rating: 4.9,
    reviewCount: 201,
    completedTasks: 201,
    price: "180",
    originalPrice: "220",
    priceUnit: "day",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "SE1 9SG",
    location: "Southwark, London",
    latitude: 51.5045,
    longitude: -0.0865,
  },
  {
    id: 17,
    image: "https://images.unsplash.com/photo-1626081063434-79a2169791b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwZW50cnklMjB3b29kd29ya3xlbnwxfHx8fDE3NjI2MjE1Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Peter J.",
    providerImage: providerImages[1],
    description: "Door and window installation and repair",
    category: "Home & Garden",
    subcategory: "Carpentry",
    detailedSubcategory: "Door installation",
    rating: 4.8,
    reviewCount: 167,
    completedTasks: 167,
    price: "150",
    priceUnit: "door",
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
  },

  // Bathroom Fitting
  {
    id: 18,
    image: "https://images.unsplash.com/photo-1618832515490-e181c4794a45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwcmVub3ZhdGlvbnxlbnwxfHx8fDE3NjI1Njg4OTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Michael P.",
    providerImage: providerImages[1],
    description: "Complete bathroom renovation and remodeling",
    category: "Home & Garden",
    subcategory: "Bathroom Fitting",
    detailedSubcategory: "Full bathroom installation",
    rating: 4.8,
    reviewCount: 312,
    completedTasks: 312,
    price: "2500",
    priceUnit: "project",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "W2 1JH",
    location: "Paddington, London",
    latitude: 51.5171,
    longitude: -0.1774,
  },
  {
    id: 19,
    image: "https://images.unsplash.com/photo-1618832515490-e181c4794a45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwcmVub3ZhdGlvbnxlbnwxfHx8fDE3NjI1Njg4OTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Chris L.",
    providerImage: providerImages[1],
    description: "Shower installation and tiling services",
    category: "Home & Garden",
    subcategory: "Bathroom Fitting",
    detailedSubcategory: "Shower installation",
    rating: 4.7,
    reviewCount: 189,
    completedTasks: 189,
    price: "800",
    originalPrice: "950",
    priceUnit: "project",
    deliveryType: "standard",
    postcode: "NW1 5RA",
    location: "Camden, London",
    latitude: 51.5407,
    longitude: -0.1432,
  },

  // ==================== BUSINESS SERVICES ====================
  
  // Web Development
  {
    id: 20,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Alex T.",
    providerImage: providerImages[0],
    description: "Modern web design and development services",
    category: "Business Services",
    subcategory: "Web Development",
    detailedSubcategory: "Website design",
    rating: 4.9,
    reviewCount: 142,
    completedTasks: 142,
    price: "1200",
    priceUnit: "project",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
    addons: [
      { 
        id: 1, 
        title: "Additional page", 
        price: 150,
        description: "Add extra page with custom design",
        deliveryTime: "2 days"
      },
      { 
        id: 2, 
        title: "Blog integration", 
        price: 300,
        description: "Full CMS blog system with categories and tags",
        deliveryTime: "3 days"
      },
      { 
        id: 3, 
        title: "Contact form with validation", 
        price: 120,
        description: "Custom contact form with spam protection",
        deliveryTime: "1 day"
      },
      { 
        id: 4, 
        title: "Google Analytics setup", 
        price: 80,
        description: "Complete GA4 setup with conversion tracking",
        deliveryTime: "1 day"
      },
      { 
        id: 5, 
        title: "Speed optimization", 
        price: 200,
        description: "Optimize loading speed and Core Web Vitals",
        deliveryTime: "2 days"
      },
      { 
        id: 6, 
        title: "1 month maintenance", 
        price: 250,
        description: "Updates, backups, and minor changes",
        deliveryTime: "Ongoing"
      }
    ]
  },
  {
    id: 21,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Daniel F.",
    providerImage: providerImages[1],
    description: "E-commerce website development and optimization",
    category: "Business Services",
    subcategory: "Web Development",
    detailedSubcategory: "E-commerce development",
    rating: 4.8,
    reviewCount: 97,
    completedTasks: 97,
    price: "1200",
    priceUnit: "project",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "1200",
        priceUnit: "project",
        description: "Perfect for small businesses starting their online presence",
        highlights: [
          "Up to 10 product listings",
          "Mobile responsive design",
          "Basic payment gateway integration",
          "Contact form included"
        ],
        features: [
          "5 pages included",
          "Basic SEO optimization",
          "Social media integration",
          "2 weeks delivery",
          "1 revision included"
        ],
        deliveryTime: "14 days",
        revisions: "1",
        addons: [
          { 
            id: 1, 
            title: "Additional 10 products", 
            price: 150,
            description: "Expand your catalogue with 10 more product listings",
            deliveryTime: "2 days"
          },
          { 
            id: 2, 
            title: "Premium payment gateway", 
            price: 200,
            description: "Stripe, PayPal, and Apple Pay integration",
            deliveryTime: "3 days"
          },
          { 
            id: 3, 
            title: "Advanced analytics setup", 
            price: 180,
            description: "Google Analytics 4 with conversion tracking",
            deliveryTime: "1 day"
          }
        ]
      },
      {
        id: 2,
        name: "Standard",
        price: "2500",
        originalPrice: "3000",
        priceUnit: "project",
        description: "Ideal for growing businesses with more products and features",
        highlights: [
          "Up to 50 product listings",
          "Custom design & branding",
          "Multiple payment options",
          "Email marketing integration",
          "Inventory management system"
        ],
        features: [
          "10 pages included",
          "Advanced SEO optimization",
          "Newsletter subscription",
          "Product reviews system",
          "4 weeks delivery",
          "3 revisions included"
        ],
        deliveryTime: "28 days",
        revisions: "3",
        addons: [
          { 
            id: 1, 
            title: "Additional 50 products", 
            price: 300,
            description: "Scale up with 50 more product listings and categories",
            deliveryTime: "3 days"
          },
          { 
            id: 2, 
            title: "Multi-currency support", 
            price: 250,
            description: "Accept payments in 10+ global currencies with auto-conversion",
            deliveryTime: "2 days"
          },
          { 
            id: 3, 
            title: "Live chat integration", 
            price: 200,
            description: "Intercom or Zendesk live chat for customer support",
            deliveryTime: "1 day"
          },
          { 
            id: 4, 
            title: "Advanced shipping options", 
            price: 180,
            description: "Real-time shipping rates from multiple carriers",
            deliveryTime: "2 days"
          }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "4500",
        priceUnit: "project",
        description: "Complete e-commerce solution for established businesses",
        highlights: [
          "Unlimited product listings",
          "Fully custom design",
          "Multi-vendor marketplace support",
          "Advanced analytics dashboard",
          "Customer loyalty program",
          "Dedicated account manager"
        ],
        features: [
          "Unlimited pages",
          "Premium SEO package",
          "Mobile app integration",
          "Advanced security features",
          "6 weeks delivery",
          "Unlimited revisions",
          "1 month post-launch support",
          "Priority support"
        ],
        deliveryTime: "42 days",
        revisions: "Unlimited",
        addons: [
          { 
            id: 1, 
            title: "Custom API development", 
            price: 500,
            description: "Build custom REST APIs for third-party integrations",
            deliveryTime: "7 days"
          },
          { 
            id: 2, 
            title: "White-label solution", 
            price: 800,
            description: "Remove all branding and create fully custom solution",
            deliveryTime: "5 days"
          },
          { 
            id: 3, 
            title: "Advanced automation", 
            price: 600,
            description: "Automated email sequences, abandoned cart recovery, and more",
            deliveryTime: "5 days"
          },
          { 
            id: 4, 
            title: "Extended support (3 months)", 
            price: 450,
            description: "Priority technical support and monthly maintenance",
            deliveryTime: "1 day"
          },
          { 
            id: 5, 
            title: "Advanced SEO package", 
            price: 700,
            description: "Comprehensive SEO audit, schema markup, and optimization",
            deliveryTime: "7 days"
          }
        ]
      }
    ]
  },
  {
    id: 22,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Rachel N.",
    providerImage: providerImages[2],
    description: "WordPress website setup and customization",
    category: "Business Services",
    subcategory: "Web Development",
    detailedSubcategory: "WordPress development",
    rating: 4.7,
    reviewCount: 156,
    completedTasks: 156,
    price: "600",
    priceUnit: "project",
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
  },

  // Marketing & Advertising
  {
    id: 23,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Emily K.",
    providerImage: providerImages[2],
    description: "Digital marketing and advertising campaigns",
    category: "Business Services",
    subcategory: "Marketing & Advertising",
    detailedSubcategory: "Digital marketing",
    rating: 4.7,
    reviewCount: 98,
    completedTasks: 98,
    price: "850",
    originalPrice: "1000",
    priceUnit: "month",
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
    addons: [
      { 
        id: 1, 
        title: "Google Ads campaign", 
        price: 400,
        description: "Setup and manage Google Search & Display ads",
        deliveryTime: "3 days"
      },
      { 
        id: 2, 
        title: "Facebook & Instagram ads", 
        price: 350,
        description: "Create and optimize social media ad campaigns",
        deliveryTime: "3 days"
      },
      { 
        id: 3, 
        title: "Email marketing campaign", 
        price: 250,
        description: "Design and send professional email campaigns",
        deliveryTime: "5 days"
      },
      { 
        id: 4, 
        title: "Landing page optimization", 
        price: 300,
        description: "A/B testing and conversion rate optimization",
        deliveryTime: "1 week"
      },
      { 
        id: 5, 
        title: "Competitor analysis report", 
        price: 200,
        description: "In-depth analysis of your top 5 competitors",
        deliveryTime: "5 days"
      }
    ]
  },
  {
    id: 24,
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMG1hcmtldGluZ3xlbnwxfHx8fDE3NjI4NTM3NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Sam B.",
    providerImage: providerImages[1],
    description: "Social media management and content creation",
    category: "Business Services",
    subcategory: "Marketing & Advertising",
    detailedSubcategory: "Social media marketing",
    rating: 4.8,
    reviewCount: 234,
    completedTasks: 234,
    price: "500",
    priceUnit: "month",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "500",
        priceUnit: "month",
        description: "Essential social media presence",
        highlights: [
          "2 platforms managed",
          "12 posts per month",
          "Basic content creation",
          "Monthly analytics report"
        ],
        features: [
          "Content calendar",
          "Stock image graphics",
          "Community management",
          "Monthly strategy meeting"
        ],
        deliveryTime: "Ongoing monthly",
        revisions: "1 revision per post"
      },
      {
        id: 2,
        name: "Standard",
        price: "950",
        priceUnit: "month",
        description: "Professional social media growth",
        highlights: [
          "4 platforms managed",
          "24 posts per month",
          "Custom graphics & videos",
          "Story & reel content",
          "Hashtag strategy",
          "Weekly analytics"
        ],
        features: [
          "Advanced content planning",
          "Professional photography",
          "Active engagement (2hrs/day)",
          "Bi-weekly meetings",
          "Competitor analysis"
        ],
        deliveryTime: "Ongoing monthly",
        revisions: "2 revisions per post",
        addons: [
          { id: 1, title: "Paid ads management", price: 300 },
          { id: 2, title: "Influencer outreach", price: 250 }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "1800",
        priceUnit: "month",
        description: "Complete social media domination",
        highlights: [
          "All major platforms",
          "40+ posts per month",
          "Premium content production",
          "Daily stories & reels",
          "24/7 community management",
          "Real-time analytics",
          "Dedicated account manager"
        ],
        features: [
          "Full content studio access",
          "Professional videography",
          "Live stream management",
          "Weekly strategy sessions",
          "Priority 24/7 support",
          "Quarterly growth planning"
        ],
        deliveryTime: "Ongoing monthly",
        revisions: "Unlimited",
        addons: [
          { 
            id: 1, 
            title: "Paid advertising management", 
            price: 600,
            description: "Facebook, Instagram & Google Ads setup and optimization",
            deliveryTime: "2 days"
          },
          { 
            id: 2, 
            title: "Podcast production & distribution", 
            price: 800,
            description: "Full audio editing, show notes, and multi-platform publishing",
            deliveryTime: "3 days"
          },
          { 
            id: 3, 
            title: "Influencer outreach campaign", 
            price: 450,
            description: "Research and connect with 10+ relevant influencers",
            deliveryTime: "5 days"
          },
          { 
            id: 4, 
            title: "Video editing for reels/TikTok", 
            price: 250,
            description: "Professional editing for 10 short-form videos per month",
            deliveryTime: "2 days"
          },
          { 
            id: 5, 
            title: "Community management upgrade", 
            price: 300,
            description: "Extended response times (evenings & weekends)",
            deliveryTime: "1 day"
          }
        ]
      }
    ]
  },
  {
    id: 25,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Jessica W.",
    providerImage: providerImages[2],
    description: "SEO optimization and search engine marketing",
    category: "Business Services",
    subcategory: "Marketing & Advertising",
    detailedSubcategory: "SEO services",
    rating: 4.9,
    reviewCount: 178,
    completedTasks: 178,
    price: "700",
    priceUnit: "month",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },

  // Accounting & Bookkeeping
  {
    id: 26,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Andrew M.",
    providerImage: providerImages[1],
    description: "Professional bookkeeping and accounting services",
    category: "Business Services",
    subcategory: "Accounting & Bookkeeping",
    detailedSubcategory: "Monthly bookkeeping",
    rating: 4.8,
    reviewCount: 145,
    completedTasks: 145,
    price: "300",
    priceUnit: "month",
    deliveryType: "standard",
    postcode: "W2 1JH",
    location: "Paddington, London",
    latitude: 51.5171,
    longitude: -0.1774,
  },
  {
    id: 27,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Claire S.",
    providerImage: providerImages[2],
    description: "Tax preparation and filing services",
    category: "Business Services",
    subcategory: "Accounting & Bookkeeping",
    detailedSubcategory: "Tax filing",
    rating: 4.9,
    reviewCount: 267,
    completedTasks: 267,
    price: "200",
    priceUnit: "return",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
    addons: [
      { 
        id: 1, 
        title: "VAT return filing", 
        price: 120,
        description: "Quarterly or annual VAT return preparation",
        deliveryTime: "3 days"
      },
      { 
        id: 2, 
        title: "Tax planning consultation", 
        price: 180,
        description: "1-hour tax optimization strategy session",
        deliveryTime: "2 days"
      },
      { 
        id: 3, 
        title: "Prior year amendment", 
        price: 150,
        description: "Amend previous year's tax return",
        deliveryTime: "5 days"
      },
      { 
        id: 4, 
        title: "Self-employment expenses", 
        price: 80,
        description: "Detailed expense categorization and optimization",
        deliveryTime: "2 days"
      },
      { 
        id: 5, 
        title: "HMRC correspondence support", 
        price: 100,
        description: "Handle HMRC queries and correspondence",
        deliveryTime: "1 day"
      }
    ]
  },

  // Business Consulting
  {
    id: 28,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Jonathan H.",
    providerImage: providerImages[1],
    description: "Business strategy and consulting services",
    category: "Business Services",
    subcategory: "Business Consulting",
    detailedSubcategory: "Strategy consulting",
    rating: 4.8,
    reviewCount: 89,
    completedTasks: 89,
    price: "150",
    priceUnit: "hr",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
    addons: [
      { 
        id: 1, 
        title: "Business plan development", 
        price: 600,
        description: "Complete business plan with financial projections",
        deliveryTime: "2 weeks"
      },
      { 
        id: 2, 
        title: "Market research report", 
        price: 400,
        description: "Comprehensive market analysis for your industry",
        deliveryTime: "1 week"
      },
      { 
        id: 3, 
        title: "Financial modeling", 
        price: 350,
        description: "3-5 year financial forecasting model",
        deliveryTime: "5 days"
      },
      { 
        id: 4, 
        title: "Pitch deck creation", 
        price: 450,
        description: "Professional investor pitch presentation",
        deliveryTime: "1 week"
      }
    ]
  },

  // ==================== PERSONAL SERVICES ====================
  
  // Massage Therapy
  {
    id: 29,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Amelia M.",
    providerImage: providerImages[2],
    description: "Relaxing spa and therapeutic massage services",
    category: "Personal Services",
    subcategory: "Massage Therapy",
    detailedSubcategory: "Relaxation massage",
    rating: 4.8,
    reviewCount: 128,
    completedTasks: 128,
    price: "60",
    originalPrice: "75",
    priceUnit: "session",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
    addons: [
      { 
        id: 1, 
        title: "Hot stone therapy", 
        price: 25,
        description: "Add heated stones for deeper relaxation",
        deliveryTime: "Same session"
      },
      { 
        id: 2, 
        title: "Aromatherapy upgrade", 
        price: 15,
        description: "Premium essential oils therapy",
        deliveryTime: "Same session"
      },
      { 
        id: 3, 
        title: "Extended session (90 min)", 
        price: 30,
        description: "Extend your massage by 30 minutes",
        deliveryTime: "Same session"
      },
      { 
        id: 4, 
        title: "Couples massage", 
        price: 60,
        description: "Simultaneous massage for two people",
        deliveryTime: "Same session"
      }
    ]
  },
  {
    id: 30,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Victoria L.",
    providerImage: providerImages[2],
    description: "Deep tissue massage for pain relief",
    category: "Personal Services",
    subcategory: "Massage Therapy",
    detailedSubcategory: "Deep tissue massage",
    rating: 4.9,
    reviewCount: 201,
    completedTasks: 201,
    price: "75",
    priceUnit: "session",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "WC2N 5DU",
    location: "Covent Garden, London",
    latitude: 51.5109,
    longitude: -0.1240,
    addons: [
      { 
        id: 1, 
        title: "Cupping therapy", 
        price: 35,
        description: "Traditional cupping for muscle recovery",
        deliveryTime: "Same session"
      },
      { 
        id: 2, 
        title: "Sports recovery massage", 
        price: 40,
        description: "Focused treatment for athletic recovery",
        deliveryTime: "Same session"
      },
      { 
        id: 3, 
        title: "CBD oil treatment", 
        price: 30,
        description: "Anti-inflammatory CBD-infused massage oil",
        deliveryTime: "Same session"
      },
      { 
        id: 4, 
        title: "Trigger point therapy", 
        price: 25,
        description: "Target specific pain points and knots",
        deliveryTime: "Same session"
      }
    ]
  },
  {
    id: 31,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Nina P.",
    providerImage: providerImages[2],
    description: "Sports massage for athletes and active individuals",
    category: "Personal Services",
    subcategory: "Massage Therapy",
    detailedSubcategory: "Sports massage",
    rating: 4.8,
    reviewCount: 176,
    completedTasks: 176,
    price: "70",
    priceUnit: "session",
    deliveryType: "standard",
    postcode: "SW7 2DD",
    location: "South Kensington, London",
    latitude: 51.4945,
    longitude: -0.1763,
  },

  // Personal Training
  {
    id: 32,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Marcus J.",
    providerImage: providerImages[1],
    description: "One-on-one personal training sessions",
    category: "Personal Services",
    subcategory: "Personal Training",
    detailedSubcategory: "1-on-1 training",
    rating: 4.9,
    reviewCount: 312,
    completedTasks: 312,
    price: "200",
    priceUnit: "month",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "200",
        priceUnit: "month",
        description: "Get started with personalized fitness training",
        highlights: [
          "4 sessions per month",
          "Customized workout plan",
          "Nutrition guidance",
          "Progress tracking"
        ],
        features: [
          "1 hour per session",
          "Basic equipment provided",
          "Monthly fitness assessment",
          "Email support"
        ],
        deliveryTime: "Flexible scheduling",
        revisions: "Adjust plan monthly"
      },
      {
        id: 2,
        name: "Standard",
        price: "350",
        priceUnit: "month",
        description: "Accelerate your fitness goals with regular training",
        highlights: [
          "8 sessions per month",
          "Advanced workout programs",
          "Detailed meal planning",
          "Body composition analysis",
          "Supplement recommendations"
        ],
        features: [
          "1 hour per session",
          "Premium equipment access",
          "Bi-weekly assessments",
          "Priority scheduling",
          "WhatsApp support"
        ],
        deliveryTime: "Flexible scheduling",
        revisions: "Adjust plan bi-weekly",
        addons: [
          { 
            id: 1, 
            title: "Additional session", 
            price: 50,
            description: "Add extra 1-hour training session",
            deliveryTime: "Same day"
          },
          { 
            id: 2, 
            title: "Couples training add-on", 
            price: 80,
            description: "Train together with your partner",
            deliveryTime: "Same day"
          },
          { 
            id: 3, 
            title: "Home visit service", 
            price: 35,
            description: "Training sessions at your home or preferred location",
            deliveryTime: "Same day"
          },
          { 
            id: 4, 
            title: "Online tracking app access", 
            price: 20,
            description: "Premium fitness tracking app with progress analytics",
            deliveryTime: "Instant"
          }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "600",
        priceUnit: "month",
        description: "Complete transformation package with unlimited support",
        highlights: [
          "Unlimited sessions (up to 20/month)",
          "Elite performance programs",
          "Full nutrition & meal prep plan",
          "Weekly body scans",
          "24/7 coaching support",
          "Exclusive gym access"
        ],
        features: [
          "Flexible session duration",
          "All equipment included",
          "Weekly assessments",
          "Guaranteed results",
          "Home & gym sessions",
          "Recovery guidance",
          "Event preparation"
        ],
        deliveryTime: "24/7 availability",
        revisions: "Daily plan adjustments",
        addons: [
          { 
            id: 1, 
            title: "Sports massage (weekly)", 
            price: 120,
            description: "Professional sports massage sessions to aid recovery",
            deliveryTime: "Same day"
          },
          { 
            id: 2, 
            title: "Competition prep coaching", 
            price: 200,
            description: "Specialized training program for upcoming competitions",
            deliveryTime: "1 week"
          },
          { 
            id: 3, 
            title: "Personal chef consultation", 
            price: 150,
            description: "Custom meal plans and nutrition guidance",
            deliveryTime: "2 days"
          },
          { 
            id: 4, 
            title: "Supplement plan", 
            price: 80,
            description: "Personalized supplement recommendations and sourcing",
            deliveryTime: "1 day"
          }
        ]
      }
    ]
  },
  {
    id: 33,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Kelly R.",
    providerImage: providerImages[2],
    description: "Group fitness classes and bootcamp training",
    category: "Personal Services",
    subcategory: "Personal Training",
    detailedSubcategory: "Group training",
    rating: 4.7,
    reviewCount: 189,
    completedTasks: 189,
    price: "25",
    priceUnit: "session",
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },

  // Life Coaching
  {
    id: 34,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Caroline D.",
    providerImage: providerImages[2],
    description: "Professional life coaching and career guidance",
    category: "Personal Services",
    subcategory: "Life Coaching",
    detailedSubcategory: "Career coaching",
    rating: 4.8,
    reviewCount: 145,
    completedTasks: 145,
    price: "100",
    priceUnit: "session",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
  },

  // ==================== REPAIR & MAINTENANCE ====================
  
  // Appliance Repair
  {
    id: 35,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Brian T.",
    providerImage: providerImages[1],
    description: "Washing machine repair and maintenance",
    category: "Repair & Maintenance",
    subcategory: "Appliance Repair",
    detailedSubcategory: "Washing machine repair",
    rating: 4.7,
    reviewCount: 234,
    completedTasks: 234,
    price: "80",
    priceUnit: "visit",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
  },
  {
    id: 36,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Gary L.",
    providerImage: providerImages[1],
    description: "Refrigerator and freezer repair services",
    category: "Repair & Maintenance",
    subcategory: "Appliance Repair",
    detailedSubcategory: "Refrigerator repair",
    rating: 4.8,
    reviewCount: 198,
    completedTasks: 198,
    price: "90",
    priceUnit: "visit",
    badges: ["Emergency"],
    deliveryType: "same-day",
    postcode: "W2 1JH",
    location: "Paddington, London",
    latitude: 51.5171,
    longitude: -0.1774,
  },
  {
    id: 37,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Steve M.",
    providerImage: providerImages[1],
    description: "Oven and cooker repair and servicing",
    category: "Repair & Maintenance",
    subcategory: "Appliance Repair",
    detailedSubcategory: "Oven repair",
    rating: 4.9,
    reviewCount: 167,
    completedTasks: 167,
    price: "85",
    priceUnit: "visit",
    deliveryType: "standard",
    postcode: "SE1 9SG",
    location: "Southwark, London",
    latitude: 51.5045,
    longitude: -0.0865,
  },

  // HVAC Services
  {
    id: 38,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Paul W.",
    providerImage: providerImages[1],
    description: "Air conditioning installation and repair",
    category: "Repair & Maintenance",
    subcategory: "HVAC Services",
    detailedSubcategory: "AC installation",
    rating: 4.7,
    reviewCount: 145,
    completedTasks: 145,
    price: "350",
    priceUnit: "unit",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },
  {
    id: 39,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Richard B.",
    providerImage: providerImages[1],
    description: "Central heating system repair and servicing",
    category: "Repair & Maintenance",
    subcategory: "HVAC Services",
    detailedSubcategory: "Heating repair",
    rating: 4.8,
    reviewCount: 212,
    completedTasks: 212,
    price: "120",
    priceUnit: "visit",
    badges: ["Emergency"],
    deliveryType: "same-day",
    postcode: "NW1 5RA",
    location: "Camden, London",
    latitude: 51.5407,
    longitude: -0.1432,
  },

  // Roofing
  {
    id: 40,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Kevin H.",
    providerImage: providerImages[1],
    description: "Roof repair and leak fixing services",
    category: "Repair & Maintenance",
    subcategory: "Roofing",
    detailedSubcategory: "Roof repair",
    rating: 4.8,
    reviewCount: 189,
    completedTasks: 189,
    price: "500",
    priceUnit: "project",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
  },

  // ==================== TECHNOLOGY SERVICES ====================
  
  // IT Support
  {
    id: 41,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Nathan K.",
    providerImage: providerImages[1],
    description: "IT support and network troubleshooting",
    category: "Technology Services",
    subcategory: "IT Support",
    detailedSubcategory: "Network setup",
    rating: 4.9,
    reviewCount: 156,
    completedTasks: 156,
    price: "80",
    priceUnit: "hr",
    badges: ["Top Rated"],
    deliveryType: "same-day",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },
  {
    id: 42,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Greg S.",
    providerImage: providerImages[1],
    description: "Remote IT support and software installation",
    category: "Technology Services",
    subcategory: "IT Support",
    detailedSubcategory: "Remote support",
    rating: 4.7,
    reviewCount: 267,
    completedTasks: 267,
    price: "60",
    priceUnit: "hr",
    deliveryType: "same-day",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
  },

  // Software Development
  {
    id: 43,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Thomas V.",
    providerImage: providerImages[1],
    description: "Custom software development and programming",
    category: "Technology Services",
    subcategory: "Software Development",
    detailedSubcategory: "Custom software",
    rating: 4.9,
    reviewCount: 89,
    completedTasks: 89,
    price: "100",
    priceUnit: "hr",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },
  {
    id: 44,
    image: "https://images.unsplash.com/photo-1633250391894-397930e3f5f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NjI5MDIzNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Lisa G.",
    providerImage: providerImages[2],
    description: "Mobile app development for iOS and Android",
    category: "Technology Services",
    subcategory: "Software Development",
    detailedSubcategory: "Mobile app development",
    rating: 4.8,
    reviewCount: 134,
    completedTasks: 134,
    price: "3500",
    priceUnit: "project",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "3500",
        priceUnit: "project",
        description: "Simple app with core functionality",
        highlights: [
          "Single platform (iOS or Android)",
          "Up to 5 screens",
          "Basic UI design",
          "User authentication",
          "Push notifications"
        ],
        features: [
          "Native development",
          "Basic backend integration",
          "App store submission",
          "8 weeks delivery",
          "2 revisions",
          "30 days bug fixes"
        ],
        deliveryTime: "8 weeks",
        revisions: "2"
      },
      {
        id: 2,
        name: "Standard",
        price: "6500",
        originalPrice: "7500",
        priceUnit: "project",
        description: "Feature-rich app with custom design",
        highlights: [
          "Both iOS and Android",
          "Up to 12 screens",
          "Custom UI/UX design",
          "API integrations",
          "Payment gateway",
          "In-app purchases",
          "Analytics dashboard"
        ],
        features: [
          "Cross-platform development",
          "Advanced backend",
          "Admin panel included",
          "12 weeks delivery",
          "4 revisions",
          "60 days support"
        ],
        deliveryTime: "12 weeks",
        revisions: "4",
        addons: [
          { id: 1, title: "Social media integration", price: 400 },
          { id: 2, title: "Real-time chat feature", price: 800 },
          { id: 3, title: "Geolocation services", price: 500 }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "12000",
        priceUnit: "project",
        description: "Enterprise-grade app with all features",
        highlights: [
          "iOS, Android & Web app",
          "Unlimited screens",
          "Premium UI/UX design",
          "Complex integrations",
          "Advanced security",
          "AI/ML features",
          "Scalable architecture",
          "Dedicated project manager"
        ],
        features: [
          "Full-stack development",
          "Cloud infrastructure setup",
          "Advanced admin dashboard",
          "16 weeks delivery",
          "Unlimited revisions",
          "6 months maintenance",
          "Performance optimization",
          "24/7 priority support"
        ],
        deliveryTime: "16 weeks",
        revisions: "Unlimited",
        addons: [
          { id: 1, title: "AR/VR features", price: 2500 },
          { id: 2, title: "Blockchain integration", price: 3000 },
          { id: 3, title: "Extended maintenance (1 year)", price: 2000 }
        ]
      }
    ]
  },

  // Computer Repair
  {
    id: 45,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Derek F.",
    providerImage: providerImages[1],
    description: "Laptop and desktop computer repair",
    category: "Technology Services",
    subcategory: "Computer Repair",
    detailedSubcategory: "Laptop repair",
    rating: 4.7,
    reviewCount: 298,
    completedTasks: 298,
    price: "65",
    priceUnit: "hr",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
  },

  // ==================== EDUCATION & TUTORING ====================
  
  // Math Tutoring
  {
    id: 46,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Dr. Helen A.",
    providerImage: providerImages[2],
    description: "GCSE and A-Level math tutoring",
    category: "Education & Tutoring",
    subcategory: "Math Tutoring",
    detailedSubcategory: "Secondary school math",
    rating: 4.9,
    reviewCount: 187,
    completedTasks: 187,
    price: "45",
    priceUnit: "hr",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW7 2DD",
    location: "South Kensington, London",
    latitude: 51.4945,
    longitude: -0.1763,
  },
  {
    id: 47,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Patrick L.",
    providerImage: providerImages[1],
    description: "University level mathematics and statistics",
    category: "Education & Tutoring",
    subcategory: "Math Tutoring",
    detailedSubcategory: "University math",
    rating: 4.8,
    reviewCount: 145,
    completedTasks: 145,
    price: "60",
    priceUnit: "hr",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "WC2N 5DU",
    location: "Covent Garden, London",
    latitude: 51.5109,
    longitude: -0.1240,
  },

  // Language Lessons
  {
    id: 48,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc3RyYXRlZ3l8ZW58MXx8fHwxNzYyNzE2MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Maria G.",
    providerImage: providerImages[2],
    description: "Spanish language lessons for all levels",
    category: "Education & Tutoring",
    subcategory: "Language Lessons",
    detailedSubcategory: "Spanish lessons",
    rating: 4.9,
    reviewCount: 234,
    completedTasks: 234,
    price: "40",
    priceUnit: "hr",
    deliveryType: "standard",
    postcode: "W1D 3QU",
    location: "Soho, London",
    latitude: 51.5142,
    longitude: -0.1318,
  },
  {
    id: 49,
    image: "https://images.unsplash.com/photo-1554446422-c4d46271ab85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWFubyUyMGxlc3NvbnMlMjBtdXNpY3xlbnwxfHx8fDE3NjI4ODIxNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Jean-Luc D.",
    providerImage: providerImages[1],
    description: "French conversation and grammar lessons",
    category: "Education & Tutoring",
    subcategory: "Language Lessons",
    detailedSubcategory: "French lessons",
    rating: 4.8,
    reviewCount: 178,
    completedTasks: 178,
    price: "42",
    priceUnit: "hr",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
  },

  // Music Lessons
  {
    id: 50,
    image: "https://images.unsplash.com/photo-1554446422-c4d46271ab85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWFubyUyMGxlc3NvbnMlMjBtdXNpY3xlbnwxfHx8fDE3NjI4ODIxNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Timothy R.",
    providerImage: providerImages[1],
    description: "Piano lessons for beginners and advanced",
    category: "Education & Tutoring",
    subcategory: "Music Lessons",
    detailedSubcategory: "Piano lessons",
    rating: 4.9,
    reviewCount: 201,
    completedTasks: 201,
    price: "50",
    priceUnit: "hr",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "NW1 5RA",
    location: "Camden, London",
    latitude: 51.5407,
    longitude: -0.1432,
  },
  {
    id: 51,
    image: "https://images.unsplash.com/photo-1758524944402-1903b38f848f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndWl0YXIlMjBsZXNzb25zJTIwbXVzaWN8ZW58MXx8fHwxNzYyODc2MTI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Sarah J.",
    providerImage: providerImages[2],
    description: "Guitar lessons for all ages and skill levels",
    category: "Education & Tutoring",
    subcategory: "Music Lessons",
    detailedSubcategory: "Guitar lessons",
    rating: 4.8,
    reviewCount: 167,
    completedTasks: 167,
    price: "45",
    priceUnit: "hr",
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },

  // ==================== BEAUTY & WELLNESS ====================
  
  // Hair Styling
  {
    id: 52,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Isabella R.",
    providerImage: providerImages[2],
    description: "Professional hair styling and beauty treatments",
    category: "Beauty & Wellness",
    subcategory: "Hair Styling",
    detailedSubcategory: "Hair coloring",
    rating: 4.8,
    reviewCount: 215,
    completedTasks: 215,
    price: "45",
    originalPrice: "60",
    priceUnit: "session",
    deliveryType: "standard",
    postcode: "WC2N 5DU",
    location: "Covent Garden, London",
    latitude: 51.5109,
    longitude: -0.1240,
  },
  {
    id: 53,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Zara M.",
    providerImage: providerImages[2],
    description: "Haircuts and styling for men and women",
    category: "Beauty & Wellness",
    subcategory: "Hair Styling",
    detailedSubcategory: "Haircut",
    rating: 4.9,
    reviewCount: 289,
    completedTasks: 289,
    price: "35",
    priceUnit: "session",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
  },
  {
    id: 54,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Francesca L.",
    providerImage: providerImages[2],
    description: "Bridal hair styling and special occasions",
    category: "Beauty & Wellness",
    subcategory: "Hair Styling",
    detailedSubcategory: "Bridal hair",
    rating: 4.9,
    reviewCount: 176,
    completedTasks: 176,
    price: "120",
    priceUnit: "session",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "120",
        priceUnit: "session",
        description: "Essential bridal hair styling for your special day",
        highlights: [
          "Pre-wedding consultation",
          "Wedding day styling",
          "Hair accessories included",
          "Touchup kit provided"
        ],
        features: [
          "1 styling session",
          "Classic bridal updo",
          "Basic hair products",
          "2 hours service",
          "Travel within 5 miles"
        ],
        deliveryTime: "3 hours",
        revisions: "Adjustments on the day"
      },
      {
        id: 2,
        name: "Standard",
        price: "250",
        priceUnit: "package",
        description: "Complete bridal hair package with trial",
        highlights: [
          "Trial session included",
          "Wedding day styling",
          "Premium products",
          "Hair extensions available",
          "Bridesmaid styling discount",
          "Emergency kit included"
        ],
        features: [
          "1 trial + wedding day",
          "Custom styling design",
          "Professional products",
          "4 hours availability",
          "Travel within 10 miles",
          "Touch-up service"
        ],
        deliveryTime: "All day availability",
        revisions: "Unlimited on wedding day",
        addons: [
          { id: 1, title: "Additional bridesmaid styling", price: 60 },
          { id: 2, title: "Mother of bride styling", price: 70 },
          { id: 3, title: "Flower girl styling", price: 40 }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "450",
        priceUnit: "package",
        description: "Luxury full bridal party hair service",
        highlights: [
          "2 trial sessions",
          "Full bridal party styling",
          "Luxury hair care",
          "Custom hair pieces",
          "Makeup artist coordination",
          "All-day assistance",
          "Professional photography",
          "Emergency backup stylist"
        ],
        features: [
          "Multiple trials",
          "Bridal + 5 bridesmaids",
          "Premium luxury products",
          "Unlimited time on day",
          "Travel anywhere in London",
          "Pre-wedding care plan",
          "Post-wedding touch-up",
          "Complimentary champagne"
        ],
        deliveryTime: "Full day service",
        revisions: "Unlimited",
        addons: [
          { id: 1, title: "Hair extensions package", price: 200 },
          { id: 2, title: "Next-day photoshoot styling", price: 150 },
          { id: 3, title: "Pre-wedding hair treatment", price: 100 }
        ]
      }
    ]
  },

  // Nail Care
  {
    id: 55,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Lily C.",
    providerImage: providerImages[2],
    description: "Manicure and gel nail treatments",
    category: "Beauty & Wellness",
    subcategory: "Nail Care",
    detailedSubcategory: "Gel nails",
    rating: 4.8,
    reviewCount: 234,
    completedTasks: 234,
    price: "40",
    priceUnit: "session",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "SW7 2DD",
    location: "South Kensington, London",
    latitude: 51.4945,
    longitude: -0.1763,
  },
  {
    id: 56,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Amy W.",
    providerImage: providerImages[2],
    description: "Pedicure and nail art services",
    category: "Beauty & Wellness",
    subcategory: "Nail Care",
    detailedSubcategory: "Pedicure",
    rating: 4.7,
    reviewCount: 198,
    completedTasks: 198,
    price: "35",
    priceUnit: "session",
    deliveryType: "standard",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
  },

  // Skincare
  {
    id: 57,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Charlotte E.",
    providerImage: providerImages[2],
    description: "Facial treatments and skincare consultations",
    category: "Beauty & Wellness",
    subcategory: "Skincare",
    detailedSubcategory: "Facial treatment",
    rating: 4.9,
    reviewCount: 267,
    completedTasks: 267,
    price: "70",
    originalPrice: "85",
    priceUnit: "session",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },

  // Makeup
  {
    id: 58,
    image: "https://images.unsplash.com/photo-1675034741696-fa9551c31bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyc3R5bGlzdCUyMHNhbG9uJTIwYmVhdXR5fGVufDF8fHx8MTc2MjcyMDI2N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Mia D.",
    providerImage: providerImages[2],
    description: "Bridal and event makeup artistry",
    category: "Beauty & Wellness",
    subcategory: "Makeup",
    detailedSubcategory: "Bridal makeup",
    rating: 4.9,
    reviewCount: 189,
    completedTasks: 189,
    price: "100",
    priceUnit: "session",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "W2 1JH",
    location: "Paddington, London",
    latitude: 51.5171,
    longitude: -0.1774,
  },

  // ==================== HEALTH & WELLNESS ====================
  
  // Physiotherapy
  {
    id: 59,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Dr. James P.",
    providerImage: providerImages[1],
    description: "Sports injury rehabilitation and physiotherapy",
    category: "Health & Wellness",
    subcategory: "Physiotherapy",
    detailedSubcategory: "Sports injury treatment",
    rating: 4.9,
    reviewCount: 234,
    completedTasks: 234,
    price: "80",
    priceUnit: "session",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SE1 9SG",
    location: "Southwark, London",
    latitude: 51.5045,
    longitude: -0.0865,
    addons: [
      { 
        id: 1, 
        title: "Extended session (60 min)", 
        price: 30,
        description: "Longer treatment for complex injuries",
        deliveryTime: "Same session"
      },
      { 
        id: 2, 
        title: "Kinesiology taping", 
        price: 20,
        description: "Athletic tape application for support",
        deliveryTime: "Same session"
      },
      { 
        id: 3, 
        title: "Home exercise program", 
        price: 40,
        description: "Personalized exercise plan with videos",
        deliveryTime: "2 days"
      },
      { 
        id: 4, 
        title: "Ultrasound therapy", 
        price: 25,
        description: "Deep tissue healing ultrasound treatment",
        deliveryTime: "Same session"
      },
      { 
        id: 5, 
        title: "Assessment report", 
        price: 50,
        description: "Detailed written assessment for GP/insurance",
        deliveryTime: "3 days"
      }
    ]
  },
  {
    id: 60,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Dr. Rebecca S.",
    providerImage: providerImages[2],
    description: "Back pain treatment and manual therapy",
    category: "Health & Wellness",
    subcategory: "Physiotherapy",
    detailedSubcategory: "Back pain treatment",
    rating: 4.8,
    reviewCount: 198,
    completedTasks: 198,
    price: "75",
    priceUnit: "session",
    deliveryType: "standard",
    postcode: "WC2N 5DU",
    location: "Covent Garden, London",
    latitude: 51.5109,
    longitude: -0.1240,
  },

  // Nutrition
  {
    id: 61,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Sophie N.",
    providerImage: providerImages[2],
    description: "Nutritional counseling and meal planning",
    category: "Health & Wellness",
    subcategory: "Nutrition",
    detailedSubcategory: "Meal planning",
    rating: 4.8,
    reviewCount: 167,
    completedTasks: 167,
    price: "60",
    priceUnit: "session",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
    addons: [
      { 
        id: 1, 
        title: "Custom meal plan (weekly)", 
        price: 80,
        description: "Personalized 7-day meal plan with recipes",
        deliveryTime: "3 days"
      },
      { 
        id: 2, 
        title: "Shopping list service", 
        price: 25,
        description: "Organized grocery list with quantities",
        deliveryTime: "1 day"
      },
      { 
        id: 3, 
        title: "Food diary analysis", 
        price: 45,
        description: "Review and feedback on your current diet",
        deliveryTime: "2 days"
      },
      { 
        id: 4, 
        title: "Supplement recommendations", 
        price: 35,
        description: "Personalized vitamin and supplement plan",
        deliveryTime: "1 day"
      },
      { 
        id: 5, 
        title: "Recipe modifications", 
        price: 30,
        description: "Adapt 5 favorite recipes to your dietary needs",
        deliveryTime: "2 days"
      }
    ]
  },

  // Mental Health
  {
    id: 62,
    image: "https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlJTIwdGhlcmFweXxlbnwxfHx8fDE3NjI2MjcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Dr. Emma T.",
    providerImage: providerImages[2],
    description: "Counseling and mental health support",
    category: "Health & Wellness",
    subcategory: "Mental Health",
    detailedSubcategory: "Counseling",
    rating: 4.9,
    reviewCount: 145,
    completedTasks: 145,
    price: "90",
    priceUnit: "session",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
  },

  // ==================== LEGAL & FINANCIAL ====================
  
  // Legal Advice
  {
    id: 63,
    image: "https://images.unsplash.com/photo-1614605844432-731c32334c49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGRvY3VtZW50cyUyMGxhd3llcnxlbnwxfHx8fDE3NjI4ODIxNjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Barrister John H.",
    providerImage: providerImages[1],
    description: "Family law and divorce consultations",
    category: "Legal & Financial",
    subcategory: "Legal Advice",
    detailedSubcategory: "Family law",
    rating: 4.9,
    reviewCount: 178,
    completedTasks: 178,
    price: "200",
    priceUnit: "hr",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },
  {
    id: 64,
    image: "https://images.unsplash.com/photo-1614605844432-731c32334c49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGRvY3VtZW50cyUyMGxhd3llcnxlbnwxfHx8fDE3NjI4ODIxNjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Solicitor Anna B.",
    providerImage: providerImages[2],
    description: "Property law and conveyancing services",
    category: "Legal & Financial",
    subcategory: "Legal Advice",
    detailedSubcategory: "Property law",
    rating: 4.8,
    reviewCount: 234,
    completedTasks: 234,
    price: "180",
    priceUnit: "hr",
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
  },

  // Tax Preparation
  {
    id: 65,
    image: "https://images.unsplash.com/photo-1762151662378-f40e20901824?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXglMjBwcmVwYXJhdGlvbiUyMGFjY291bnRpbmd8ZW58MXx8fHwxNzYyODgyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Martin F.",
    providerImage: providerImages[1],
    description: "Self-assessment tax returns and VAT filing",
    category: "Legal & Financial",
    subcategory: "Tax Preparation",
    detailedSubcategory: "Self-assessment",
    rating: 4.8,
    reviewCount: 289,
    completedTasks: 289,
    price: "150",
    priceUnit: "return",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
  },

  // Financial Planning
  {
    id: 66,
    image: "https://images.unsplash.com/photo-1762151717091-4e0633e0c431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBwbGFubmluZyUyMGFkdmlzb3J8ZW58MXx8fHwxNzYyODgyMTcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Catherine W.",
    providerImage: providerImages[2],
    description: "Investment advice and retirement planning",
    category: "Legal & Financial",
    subcategory: "Financial Planning",
    detailedSubcategory: "Investment planning",
    rating: 4.9,
    reviewCount: 156,
    completedTasks: 156,
    price: "120",
    priceUnit: "hr",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },

  // ==================== EVENT SERVICES ====================
  
  // Wedding Planning
  {
    id: 67,
    image: "https://images.unsplash.com/photo-1737236119003-b9ff5b2b5c16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGxhbm5pbmclMjBkZWNvcmF0aW9ufGVufDF8fHx8MTc2Mjg4MjE3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Laura M.",
    providerImage: providerImages[2],
    description: "Complete wedding planning and coordination",
    category: "Event Services",
    subcategory: "Wedding Planning",
    detailedSubcategory: "Full wedding planning",
    rating: 4.9,
    reviewCount: 145,
    completedTasks: 145,
    price: "2500",
    priceUnit: "event",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "2500",
        priceUnit: "event",
        description: "Day-of coordination to ensure smooth execution",
        highlights: [
          "Wedding day coordination",
          "Vendor management",
          "Timeline creation",
          "Rehearsal attendance",
          "Emergency kit provided"
        ],
        features: [
          "1 planning meeting",
          "Month-of coordination",
          "On-site management (12 hours)",
          "Vendor confirmations",
          "Setup supervision"
        ],
        deliveryTime: "Wedding day",
        revisions: "1 timeline revision"
      },
      {
        id: 2,
        name: "Standard",
        price: "5500",
        priceUnit: "event",
        description: "Partial planning with vendor recommendations",
        highlights: [
          "6-month planning service",
          "Unlimited consultations",
          "Vendor sourcing & recommendations",
          "Budget management",
          "Design consultation",
          "Contract review",
          "Full day coordination"
        ],
        features: [
          "Monthly planning meetings",
          "Venue recommendations",
          "3 vendor meetings included",
          "On-site management (14 hours)",
          "Rehearsal & wedding day",
          "Guest list management",
          "RSVP tracking"
        ],
        deliveryTime: "6 months planning",
        revisions: "Unlimited timeline revisions",
        addons: [
          { id: 1, title: "Additional planning month", price: 800 },
          { id: 2, title: "Honeymoon planning", price: 500 },
          { id: 3, title: "Rehearsal dinner planning", price: 600 }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "10000",
        priceUnit: "event",
        description: "Full-service luxury wedding planning",
        highlights: [
          "12-month full planning",
          "Unlimited support",
          "Exclusive vendor network",
          "Complete budget management",
          "Custom design & styling",
          "All vendor negotiations",
          "Weekend coordination team",
          "Destination wedding support"
        ],
        features: [
          "Weekly check-ins",
          "Venue & vendor sourcing",
          "Unlimited vendor meetings",
          "Complete event design",
          "On-site team (48 hours)",
          "Multi-day event planning",
          "VIP guest coordination",
          "Post-wedding services",
          "Thank you card management"
        ],
        deliveryTime: "12+ months",
        revisions: "Unlimited",
        addons: [
          { id: 1, title: "Destination wedding coordination", price: 3000 },
          { id: 2, title: "Multi-day event planning", price: 2500 },
          { id: 3, title: "Video documentation", price: 1200 }
        ]
      }
    ]
  },

  // Catering
  {
    id: 68,
    image: "https://images.unsplash.com/photo-1732259495388-af40b972c311?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRlcmluZyUyMGZvb2QlMjBzZXJ2aWNlfGVufDF8fHx8MTc2Mjg4MTY0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Chef Marco S.",
    providerImage: providerImages[1],
    description: "Event catering for weddings and parties",
    category: "Event Services",
    subcategory: "Catering",
    detailedSubcategory: "Wedding catering",
    rating: 4.8,
    reviewCount: 234,
    completedTasks: 234,
    price: "35",
    priceUnit: "person",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "WC2N 5DU",
    location: "Covent Garden, London",
    latitude: 51.5109,
    longitude: -0.1240,
  },
  {
    id: 69,
    image: "https://images.unsplash.com/photo-1732259495388-af40b972c311?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRlcmluZyUyMGZvb2QlMjBzZXJ2aWNlfGVufDF8fHx8MTc2Mjg4MTY0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Chef Louise B.",
    providerImage: providerImages[2],
    description: "Corporate event catering and buffet services",
    category: "Event Services",
    subcategory: "Catering",
    detailedSubcategory: "Corporate catering",
    rating: 4.7,
    reviewCount: 198,
    completedTasks: 198,
    price: "25",
    priceUnit: "person",
    deliveryType: "standard",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },

  // Photography
  {
    id: 70,
    image: "https://images.unsplash.com/photo-1628221482312-439eb2f3367d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBjYW1lcmF8ZW58MXx8fHwxNzYyODM1NTAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    providerName: "Ryan G.",
    providerImage: providerImages[1],
    description: "Wedding and event photography services",
    category: "Event Services",
    subcategory: "Photography",
    detailedSubcategory: "Wedding photography",
    rating: 4.9,
    reviewCount: 267,
    completedTasks: 267,
    price: "800",
    priceUnit: "event",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW7 2DD",
    location: "South Kensington, London",
    latitude: 51.4945,
    longitude: -0.1763,
    packages: [
      {
        id: 1,
        name: "Basic",
        price: "800",
        priceUnit: "event",
        description: "Essential coverage for your special day",
        highlights: [
          "4 hours coverage",
          "200+ edited photos",
          "Online gallery",
          "Print release"
        ],
        features: [
          "Single photographer",
          "Ceremony & reception",
          "Basic photo editing",
          "2-week delivery",
          "Digital download"
        ],
        deliveryTime: "2 weeks",
        revisions: "Minor edits included"
      },
      {
        id: 2,
        name: "Standard",
        price: "1500",
        originalPrice: "1750",
        priceUnit: "event",
        description: "Comprehensive wedding day coverage",
        highlights: [
          "8 hours coverage",
          "500+ edited photos",
          "Premium online gallery",
          "Engagement shoot included",
          "Second photographer",
          "20-page photo album"
        ],
        features: [
          "Two photographers",
          "Getting ready to first dance",
          "Advanced editing & retouching",
          "1-week delivery",
          "USB drive included",
          "Print rights"
        ],
        deliveryTime: "1 week",
        revisions: "Unlimited minor edits",
        addons: [
          { id: 1, title: "Additional hour coverage", price: 150 },
          { id: 2, title: "Premium 40-page album", price: 300 },
          { id: 3, title: "Next-day sneak peek", price: 200 }
        ]
      },
      {
        id: 3,
        name: "Premium",
        price: "2800",
        priceUnit: "event",
        description: "Luxury all-inclusive photography experience",
        highlights: [
          "12 hours unlimited coverage",
          "1000+ edited photos",
          "Luxury online gallery",
          "Engagement & pre-wedding shoots",
          "3 photographers",
          "Cinematic highlight video",
          "50-page luxury album",
          "Parent albums included"
        ],
        features: [
          "Full photography team",
          "Complete day coverage",
          "Premium editing suite",
          "3-day delivery",
          "Custom USB presentation box",
          "Canvas prints included",
          "Drone photography",
          "Same-day slideshow"
        ],
        deliveryTime: "3 days",
        revisions: "Unlimited",
        addons: [
          { id: 1, title: "Raw photo files", price: 400 },
          { id: 2, title: "Additional videography", price: 1200 },
          { id: 3, title: "Photo booth rental", price: 500 }
        ]
      }
    ]
  },

  // ==================== PET SERVICES ====================
  
  // Pet Grooming
  {
    id: 71,
    image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZ3xlbnwxfHx8fDE3NjI2MjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Oliver J.",
    providerImage: providerImages[0],
    description: "Professional dog grooming and pet care services",
    category: "Pet Services",
    subcategory: "Pet Grooming",
    detailedSubcategory: "Dog grooming",
    rating: 4.7,
    reviewCount: 128,
    completedTasks: 128,
    price: "35",
    priceUnit: "session",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "NW1 5RA",
    location: "Camden, London",
    latitude: 51.5407,
    longitude: -0.1432,
  },
  {
    id: 72,
    image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZ3xlbnwxfHx8fDE3NjI2MjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Hannah P.",
    providerImage: providerImages[2],
    description: "Cat grooming and bathing services",
    category: "Pet Services",
    subcategory: "Pet Grooming",
    detailedSubcategory: "Cat grooming",
    rating: 4.8,
    reviewCount: 156,
    completedTasks: 156,
    price: "30",
    priceUnit: "session",
    deliveryType: "standard",
    postcode: "W1D 3QU",
    location: "Soho, London",
    latitude: 51.5142,
    longitude: -0.1318,
  },

  // Dog Walking
  {
    id: 73,
    image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZ3xlbnwxfHx8fDE3NjI2MjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Ben T.",
    providerImage: providerImages[1],
    description: "Daily dog walking and exercise services",
    category: "Pet Services",
    subcategory: "Dog Walking",
    detailedSubcategory: "Daily walks",
    rating: 4.9,
    reviewCount: 312,
    completedTasks: 312,
    price: "20",
    priceUnit: "walk",
    badges: ["Top Rated"],
    deliveryType: "same-day",
    postcode: "N1 9AG",
    location: "Islington, London",
    latitude: 51.5416,
    longitude: -0.1022,
  },

  // Pet Sitting
  {
    id: 74,
    image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZ3xlbnwxfHx8fDE3NjI2MjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Julia R.",
    providerImage: providerImages[2],
    description: "Pet sitting and overnight care services",
    category: "Pet Services",
    subcategory: "Pet Sitting",
    detailedSubcategory: "Overnight care",
    rating: 4.8,
    reviewCount: 189,
    completedTasks: 189,
    price: "40",
    priceUnit: "night",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
  },

  // Veterinary
  {
    id: 75,
    image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZ3xlbnwxfHx8fDE3NjI2MjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Dr. Victoria H.",
    providerImage: providerImages[2],
    description: "Veterinary consultations and check-ups",
    category: "Pet Services",
    subcategory: "Veterinary",
    detailedSubcategory: "General check-up",
    rating: 4.9,
    reviewCount: 234,
    completedTasks: 234,
    price: "60",
    priceUnit: "visit",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },

  // ==================== AUTOMOTIVE ====================
  
  // Car Repair
  {
    id: 76,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Mike A.",
    providerImage: providerImages[1],
    description: "General car servicing and repairs",
    category: "Automotive",
    subcategory: "Car Repair",
    detailedSubcategory: "General servicing",
    rating: 4.8,
    reviewCount: 298,
    completedTasks: 298,
    price: "150",
    priceUnit: "service",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "W2 1JH",
    location: "Paddington, London",
    latitude: 51.5171,
    longitude: -0.1774,
  },
  {
    id: 77,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Tony B.",
    providerImage: providerImages[1],
    description: "Brake repair and replacement services",
    category: "Automotive",
    subcategory: "Car Repair",
    detailedSubcategory: "Brake repair",
    rating: 4.9,
    reviewCount: 234,
    completedTasks: 234,
    price: "200",
    priceUnit: "service",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SE1 9SG",
    location: "Southwark, London",
    latitude: 51.5045,
    longitude: -0.0865,
  },

  // Car Detailing
  {
    id: 78,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Chris D.",
    providerImage: providerImages[1],
    description: "Interior and exterior car detailing",
    category: "Automotive",
    subcategory: "Car Detailing",
    detailedSubcategory: "Full detailing",
    rating: 4.7,
    reviewCount: 178,
    completedTasks: 178,
    price: "120",
    originalPrice: "150",
    priceUnit: "service",
    deliveryType: "standard",
    postcode: "NW1 5RA",
    location: "Camden, London",
    latitude: 51.5407,
    longitude: -0.1432,
  },

  // MOT Testing
  {
    id: 79,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Dave M.",
    providerImage: providerImages[1],
    description: "MOT testing and certification services",
    category: "Automotive",
    subcategory: "MOT Testing",
    detailedSubcategory: "MOT test",
    rating: 4.8,
    reviewCount: 456,
    completedTasks: 456,
    price: "40",
    priceUnit: "test",
    badges: ["Same Day"],
    deliveryType: "same-day",
    postcode: "EC1A 1BB",
    location: "City of London",
    latitude: 51.5174,
    longitude: -0.0935,
  },

  // ==================== MOVING & STORAGE ====================
  
  // Removals
  {
    id: 80,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Steve's Removals",
    providerImage: providerImages[1],
    description: "House and office removal services",
    category: "Moving & Storage",
    subcategory: "Removals",
    detailedSubcategory: "House removals",
    rating: 4.8,
    reviewCount: 234,
    completedTasks: 234,
    price: "400",
    priceUnit: "move",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW1A 1AA",
    location: "Westminster, London",
    latitude: 51.5014,
    longitude: -0.1419,
  },
  {
    id: 81,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Quick Move Ltd",
    providerImage: providerImages[1],
    description: "Office relocation and commercial removals",
    category: "Moving & Storage",
    subcategory: "Removals",
    detailedSubcategory: "Office removals",
    rating: 4.7,
    reviewCount: 189,
    completedTasks: 189,
    price: "600",
    priceUnit: "move",
    badges: ["Verified Pro"],
    deliveryType: "standard",
    postcode: "E14 5AB",
    location: "Canary Wharf, London",
    latitude: 51.5054,
    longitude: -0.0235,
  },

  // Packing Services
  {
    id: 82,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "Pack & Move Pro",
    providerImage: providerImages[1],
    description: "Professional packing and unpacking services",
    category: "Moving & Storage",
    subcategory: "Packing Services",
    detailedSubcategory: "Full packing",
    rating: 4.9,
    reviewCount: 167,
    completedTasks: 167,
    price: "150",
    priceUnit: "service",
    deliveryType: "standard",
    postcode: "W1F 9QL",
    location: "Soho, London",
    latitude: 51.5146,
    longitude: -0.1363,
  },

  // Storage
  {
    id: 83,
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHJlcGFpciUyMHdvcmt8ZW58MXx8fHwxNzYyNjIwNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    providerName: "SafeStore London",
    providerImage: providerImages[1],
    description: "Secure self-storage facilities",
    category: "Moving & Storage",
    subcategory: "Storage",
    detailedSubcategory: "Self-storage",
    rating: 4.8,
    reviewCount: 298,
    completedTasks: 298,
    price: "80",
    priceUnit: "month",
    badges: ["Top Rated"],
    deliveryType: "standard",
    postcode: "SW3 5SR",
    location: "Chelsea, London",
    latitude: 51.4875,
    longitude: -0.1687,
  },
].map(service => {
  // Generate trading name if not present
  const generateTradingName = (providerName: string, subcategory?: string): string => {
    // If providerName already looks like a trading name (contains Ltd, Services, etc.), use it
    if (providerName.includes('Ltd') || providerName.includes('Services') || 
        providerName.includes('Solutions') || providerName.includes('Pro') ||
        providerName.includes('&') || providerName.includes('Group')) {
      return providerName;
    }
    
    // Extract first name or initial part
    const nameParts = providerName.split(' ');
    const firstName = nameParts[0];
    
    // Generate trading name based on subcategory
    const tradingNames: { [key: string]: string[] } = {
      'Plumbing': ['Plumbing Solutions', 'Plumbing Services', 'Plumbing & Heating'],
      'Electrical Work': ['Electrical Services', 'Electricians', 'Electric Solutions'],
      'Painting & Decorating': ['Decorating Services', 'Painting & Decorating', 'Decorators'],
      'Carpentry': ['Carpentry Services', 'Joinery & Carpentry', 'Custom Carpentry'],
      'Cleaning': ['Cleaning Services', 'Clean & Fresh', 'Professional Cleaners'],
      'Gardening & Landscaping': ['Gardening Services', 'Landscapes & Gardens', 'Garden Care'],
      'IT Support': ['IT Solutions', 'Tech Support', 'IT Services'],
      'Graphic Design': ['Design Studio', 'Creative Design', 'Graphics & Design'],
      'Web Development': ['Web Solutions', 'Web Development', 'Digital Agency'],
      'Photography': ['Photography', 'Photo Studio', 'Professional Photography'],
      'Writing & Translation': ['Writing Services', 'Content & Copy', 'Translation Services'],
      'Tutoring': ['Tutoring Services', 'Education Centre', 'Tuition'],
      'Beauty & Wellness': ['Beauty Studio', 'Wellness & Beauty', 'Beauty Services'],
      'Personal Training': ['Fitness Training', 'Personal Training', 'Fitness Solutions'],
      'Legal Services': ['Legal Services', 'Solicitors', 'Legal Advisors'],
      'Accounting': ['Accounting Services', 'Bookkeeping & Tax', 'Financial Services'],
      'Pet Services': ['Pet Care', 'Pet Services', 'Animal Care'],
      'Event Planning': ['Event Planning', 'Events & Celebrations', 'Party Planners'],
      'Automotive': ['Auto Services', 'Car Care', 'Motor Services'],
      'Moving & Storage': ['Removals', 'Moving Services', 'Man & Van'],
      'Handyman': ['Handyman Services', 'Property Maintenance', 'Fix & Repair']
    };
    
    const suffix = tradingNames[subcategory || ''] 
      ? tradingNames[subcategory][Math.floor(Math.random() * tradingNames[subcategory].length)]
      : 'Professional Services';
    
    return `${firstName}'s ${suffix}`;
  };
  
  // Add missing fields
  const needsAddons = !service.addons || service.addons.length === 0;
  const needsIdealFor = !service.idealFor || service.idealFor.length === 0;
  const needsSpecialization = !service.specialization;
  const needsTradingName = !(service as any).tradingName;
  
  if (needsAddons || needsIdealFor || needsSpecialization || needsTradingName) {
    return {
      ...service,
      ...(needsAddons && { addons: getRandomAddons(service.subcategory, service.id) }),
      ...(needsIdealFor && { idealFor: getRandomIdealFor(service.subcategory, service.id) }),
      ...(needsSpecialization && { specialization: getSpecialization(service.subcategory, service.id) }),
      ...(needsTradingName && { tradingName: generateTradingName(service.providerName, service.subcategory) })
    };
  }
  return service;
});
