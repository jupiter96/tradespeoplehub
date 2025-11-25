// Category hierarchy: Sector -> Main Category -> Sub Categories

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
}

export interface MainCategory {
  id: string;
  name: string;
  sectorName: string;
  subCategories: SubCategory[];
}

// Main categories with their sub-categories
export const mainCategories: MainCategory[] = [
  // Home & Garden - Plumbers
  {
    id: "plumbers",
    name: "Plumbers",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "emergency-plumbing", name: "Emergency Plumbing" },
      { id: "drain-cleaning", name: "Drain Cleaning" },
      { id: "leak-repair", name: "Leak Repair" },
      { id: "toilet-repair", name: "Toilet Repair" },
      { id: "tap-installation", name: "Tap Installation" },
      { id: "boiler-repair", name: "Boiler Repair" },
      { id: "pipe-installation", name: "Pipe Installation" },
      { id: "bathroom-plumbing", name: "Bathroom Plumbing" },
    ]
  },
  // Home & Garden - Electricians
  {
    id: "electricians",
    name: "Electricians",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "rewiring", name: "Rewiring" },
      { id: "light-installation", name: "Light Installation" },
      { id: "socket-installation", name: "Socket Installation" },
      { id: "fuse-box-repair", name: "Fuse Box Repair" },
      { id: "electrical-inspection", name: "Electrical Inspection" },
      { id: "outdoor-lighting", name: "Outdoor Lighting" },
      { id: "electric-shower", name: "Electric Shower Installation" },
      { id: "security-lighting", name: "Security Lighting" },
    ]
  },
  // Home & Garden - Builders
  {
    id: "builders",
    name: "Builders",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "extension", name: "Extension" },
      { id: "conversion", name: "Conversion" },
      { id: "building-house", name: "Building a house" },
      { id: "refurbishments", name: "Refurbishments" },
    ]
  },
  // Home & Garden - Painting & Decorating
  {
    id: "painting-decorating",
    name: "Painting & Decorating",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "interior-painting", name: "Interior Painting" },
      { id: "exterior-painting", name: "Exterior Painting" },
      { id: "wallpapering", name: "Wallpapering" },
      { id: "ceiling-painting", name: "Ceiling Painting" },
      { id: "wood-staining", name: "Wood Staining" },
      { id: "commercial-painting", name: "Commercial Painting" },
      { id: "decorative-finishes", name: "Decorative Finishes" },
      { id: "spray-painting", name: "Spray Painting" },
    ]
  },
  // Home & Garden - Carpentry
  {
    id: "carpentry",
    name: "Carpentry",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "custom-furniture", name: "Custom Furniture" },
      { id: "door-installation", name: "Door Installation" },
      { id: "shelving-installation", name: "Shelving Installation" },
      { id: "deck-building", name: "Deck Building" },
      { id: "fence-installation", name: "Fence Installation" },
      { id: "cabinet-making", name: "Cabinet Making" },
      { id: "skirting-boards", name: "Skirting Boards" },
      { id: "wood-repairs", name: "Wood Repairs" },
    ]
  },
  // Home & Garden - Cleaners
  {
    id: "cleaners",
    name: "Cleaners",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "domestic-cleaning", name: "Domestic Cleaning" },
      { id: "deep-cleaning", name: "Deep Cleaning" },
      { id: "end-of-tenancy", name: "End of Tenancy Cleaning" },
      { id: "carpet-cleaning", name: "Carpet Cleaning" },
      { id: "oven-cleaning", name: "Oven Cleaning" },
      { id: "window-cleaning", name: "Window Cleaning" },
      { id: "office-cleaning", name: "Office Cleaning" },
      { id: "post-renovation", name: "Post Renovation Cleaning" },
    ]
  },
  // Home & Garden - Gardeners
  {
    id: "gardeners",
    name: "Gardeners",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "lawn-mowing", name: "Lawn Mowing" },
      { id: "hedge-trimming", name: "Hedge Trimming" },
      { id: "garden-design", name: "Garden Design" },
      { id: "tree-surgery", name: "Tree Surgery" },
      { id: "landscape-gardening", name: "Landscape Gardening" },
      { id: "garden-maintenance", name: "Garden Maintenance" },
      { id: "patio-installation", name: "Patio Installation" },
      { id: "artificial-grass", name: "Artificial Grass Installation" },
    ]
  },
  // Home & Garden - Handyman
  {
    id: "handyman",
    name: "Handyman",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "general-repairs", name: "General Repairs" },
      { id: "furniture-assembly", name: "Furniture Assembly" },
      { id: "tv-mounting", name: "TV Mounting" },
      { id: "picture-hanging", name: "Picture Hanging" },
      { id: "odd-jobs", name: "Odd Jobs" },
      { id: "minor-plumbing", name: "Minor Plumbing" },
      { id: "minor-electrical", name: "Minor Electrical" },
      { id: "maintenance-work", name: "Maintenance Work" },
    ]
  },
  // Home & Garden - Locksmith
  {
    id: "locksmith",
    name: "Locksmith",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "emergency-lockout", name: "Emergency Lockout" },
      { id: "lock-change", name: "Lock Change" },
      { id: "lock-repair", name: "Lock Repair" },
      { id: "key-cutting", name: "Key Cutting" },
      { id: "upvc-lock", name: "UPVC Lock Specialist" },
      { id: "security-upgrade", name: "Security Upgrade" },
      { id: "safe-opening", name: "Safe Opening" },
      { id: "garage-door-locks", name: "Garage Door Locks" },
    ]
  },
  // Home & Garden - Roofing
  {
    id: "roofing",
    name: "Roofing",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "roof-repair", name: "Roof Repair" },
      { id: "roof-replacement", name: "Roof Replacement" },
      { id: "flat-roofing", name: "Flat Roofing" },
      { id: "tile-roofing", name: "Tile Roofing" },
      { id: "gutter-cleaning", name: "Gutter Cleaning" },
      { id: "chimney-repair", name: "Chimney Repair" },
      { id: "roof-inspection", name: "Roof Inspection" },
      { id: "skylight-installation", name: "Skylight Installation" },
    ]
  },
  // Home & Garden - HVAC
  {
    id: "hvac",
    name: "HVAC",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "boiler-service", name: "Boiler Service" },
      { id: "central-heating", name: "Central Heating" },
      { id: "air-conditioning", name: "Air Conditioning" },
      { id: "heating-repair", name: "Heating Repair" },
      { id: "radiator-installation", name: "Radiator Installation" },
      { id: "ventilation", name: "Ventilation Systems" },
      { id: "thermostat-installation", name: "Thermostat Installation" },
      { id: "gas-safety", name: "Gas Safety Check" },
    ]
  },
  // Home & Garden - Flooring
  {
    id: "flooring",
    name: "Flooring",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "laminate-flooring", name: "Laminate Flooring" },
      { id: "hardwood-flooring", name: "Hardwood Flooring" },
      { id: "carpet-installation", name: "Carpet Installation" },
      { id: "vinyl-flooring", name: "Vinyl Flooring" },
      { id: "tile-flooring", name: "Tile Flooring" },
      { id: "floor-sanding", name: "Floor Sanding" },
      { id: "underfloor-heating", name: "Underfloor Heating" },
      { id: "floor-repair", name: "Floor Repair" },
    ]
  },
  // Home & Garden - Pest Control
  {
    id: "pest-control",
    name: "Pest Control",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "rat-control", name: "Rat Control" },
      { id: "mouse-control", name: "Mouse Control" },
      { id: "wasp-removal", name: "Wasp Removal" },
      { id: "bed-bug-treatment", name: "Bed Bug Treatment" },
      { id: "ant-control", name: "Ant Control" },
      { id: "cockroach-control", name: "Cockroach Control" },
      { id: "bird-proofing", name: "Bird Proofing" },
      { id: "fumigation", name: "Fumigation" },
    ]
  },
  // Home & Garden - Bathroom Fitter
  {
    id: "bathroom-fitter",
    name: "Bathroom Fitter",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "bathroom-installation", name: "Bathroom Installation" },
      { id: "shower-installation", name: "Shower Installation" },
      { id: "bath-installation", name: "Bath Installation" },
      { id: "bathroom-renovation", name: "Bathroom Renovation" },
      { id: "wet-room", name: "Wet Room Installation" },
      { id: "bathroom-tiling", name: "Bathroom Tiling" },
      { id: "bathroom-design", name: "Bathroom Design" },
      { id: "sink-installation", name: "Sink Installation" },
    ]
  },
  // Home & Garden - Kitchen Fitter
  {
    id: "kitchen-fitter",
    name: "Kitchen Fitter",
    sectorName: "Home & Garden",
    subCategories: [
      { id: "kitchen-installation", name: "Kitchen Installation" },
      { id: "kitchen-renovation", name: "Kitchen Renovation" },
      { id: "worktop-installation", name: "Worktop Installation" },
      { id: "kitchen-design", name: "Kitchen Design" },
      { id: "appliance-installation", name: "Appliance Installation" },
      { id: "kitchen-tiling", name: "Kitchen Tiling" },
      { id: "splashback-installation", name: "Splashback Installation" },
      { id: "kitchen-cabinet", name: "Kitchen Cabinet Installation" },
    ]
  },

  // Wedding & Events
  {
    id: "wedding-planning",
    name: "Wedding Planning",
    sectorName: "Wedding & Events",
    subCategories: [
      { id: "full-wedding-planning", name: "Full Wedding Planning" },
      { id: "day-coordination", name: "Day Coordination" },
      { id: "venue-selection", name: "Venue Selection" },
      { id: "vendor-coordination", name: "Vendor Coordination" },
      { id: "budget-management", name: "Budget Management" },
      { id: "wedding-styling", name: "Wedding Styling" },
      { id: "destination-wedding", name: "Destination Wedding" },
      { id: "elopement-planning", name: "Elopement Planning" },
    ]
  },
  {
    id: "event-photography",
    name: "Event Photography",
    sectorName: "Wedding & Events",
    subCategories: [
      { id: "wedding-photography", name: "Wedding Photography" },
      { id: "corporate-photography", name: "Corporate Photography" },
      { id: "party-photography", name: "Party Photography" },
      { id: "product-photography", name: "Product Photography" },
      { id: "portrait-photography", name: "Portrait Photography" },
      { id: "engagement-photography", name: "Engagement Photography" },
      { id: "event-coverage", name: "Event Coverage" },
      { id: "photo-booth", name: "Photo Booth Rental" },
    ]
  },
  {
    id: "catering-services",
    name: "Catering Services",
    sectorName: "Wedding & Events",
    subCategories: [
      { id: "wedding-catering", name: "Wedding Catering" },
      { id: "corporate-catering", name: "Corporate Catering" },
      { id: "buffet-catering", name: "Buffet Catering" },
      { id: "bbq-catering", name: "BBQ Catering" },
      { id: "canape-service", name: "Canapé Service" },
      { id: "cocktail-catering", name: "Cocktail Catering" },
      { id: "dessert-table", name: "Dessert Table" },
      { id: "food-truck", name: "Food Truck Catering" },
    ]
  },
  {
    id: "dj-services",
    name: "DJ Services",
    sectorName: "Wedding & Events",
    subCategories: [
      { id: "wedding-dj", name: "Wedding DJ" },
      { id: "party-dj", name: "Party DJ" },
      { id: "corporate-dj", name: "Corporate DJ" },
      { id: "mobile-disco", name: "Mobile Disco" },
      { id: "club-dj", name: "Club DJ" },
      { id: "karaoke-dj", name: "Karaoke DJ" },
      { id: "festival-dj", name: "Festival DJ" },
      { id: "dj-equipment-hire", name: "DJ Equipment Hire" },
    ]
  },
  {
    id: "event-decoration",
    name: "Event Decoration",
    sectorName: "Wedding & Events",
    subCategories: [
      { id: "wedding-decoration", name: "Wedding Decoration" },
      { id: "balloon-decoration", name: "Balloon Decoration" },
      { id: "floral-decoration", name: "Floral Decoration" },
      { id: "table-decoration", name: "Table Decoration" },
      { id: "backdrop-hire", name: "Backdrop Hire" },
      { id: "lighting-decoration", name: "Lighting Decoration" },
      { id: "party-decoration", name: "Party Decoration" },
      { id: "themed-decoration", name: "Themed Decoration" },
    ]
  },

  // Health & Wellbeing
  {
    id: "nutrition-counseling",
    name: "Nutrition Counseling",
    sectorName: "Health & Wellbeing",
    subCategories: [
      { id: "weight-management", name: "Weight Management" },
      { id: "sports-nutrition", name: "Sports Nutrition" },
      { id: "meal-planning", name: "Meal Planning" },
      { id: "dietary-advice", name: "Dietary Advice" },
      { id: "nutritional-therapy", name: "Nutritional Therapy" },
      { id: "diabetes-nutrition", name: "Diabetes Nutrition" },
      { id: "gut-health", name: "Gut Health" },
      { id: "food-allergy", name: "Food Allergy Consultation" },
    ]
  },
  {
    id: "physiotherapy",
    name: "Physiotherapy",
    sectorName: "Health & Wellbeing",
    subCategories: [
      { id: "sports-physio", name: "Sports Physiotherapy" },
      { id: "back-pain", name: "Back Pain Treatment" },
      { id: "neck-pain", name: "Neck Pain Treatment" },
      { id: "post-surgery", name: "Post-Surgery Rehab" },
      { id: "injury-rehab", name: "Injury Rehabilitation" },
      { id: "massage-therapy", name: "Massage Therapy" },
      { id: "posture-correction", name: "Posture Correction" },
      { id: "home-physio", name: "Home Physiotherapy" },
    ]
  },
  {
    id: "yoga-pilates",
    name: "Yoga & Pilates",
    sectorName: "Health & Wellbeing",
    subCategories: [
      { id: "hatha-yoga", name: "Hatha Yoga" },
      { id: "vinyasa-yoga", name: "Vinyasa Yoga" },
      { id: "hot-yoga", name: "Hot Yoga" },
      { id: "yin-yoga", name: "Yin Yoga" },
      { id: "mat-pilates", name: "Mat Pilates" },
      { id: "reformer-pilates", name: "Reformer Pilates" },
      { id: "pregnancy-yoga", name: "Pregnancy Yoga" },
      { id: "private-sessions", name: "Private Sessions" },
    ]
  },
  {
    id: "mental-health",
    name: "Mental Health Support",
    sectorName: "Health & Wellbeing",
    subCategories: [
      { id: "counselling", name: "Counselling" },
      { id: "cbt-therapy", name: "CBT Therapy" },
      { id: "anxiety-support", name: "Anxiety Support" },
      { id: "depression-support", name: "Depression Support" },
      { id: "stress-management", name: "Stress Management" },
      { id: "relationship-therapy", name: "Relationship Therapy" },
      { id: "grief-counselling", name: "Grief Counselling" },
      { id: "mindfulness-coaching", name: "Mindfulness Coaching" },
    ]
  },

  // Legal & Financial
  {
    id: "legal-advice",
    name: "Legal Advice",
    sectorName: "Legal & Financial",
    subCategories: [
      { id: "family-law", name: "Family Law" },
      { id: "employment-law", name: "Employment Law" },
      { id: "property-law", name: "Property Law" },
      { id: "contract-law", name: "Contract Law" },
      { id: "immigration-law", name: "Immigration Law" },
      { id: "wills-probate", name: "Wills & Probate" },
      { id: "tenant-law", name: "Tenant Law" },
      { id: "business-law", name: "Business Law" },
    ]
  },
  {
    id: "accounting-services",
    name: "Accounting Services",
    sectorName: "Legal & Financial",
    subCategories: [
      { id: "bookkeeping", name: "Bookkeeping" },
      { id: "tax-returns", name: "Tax Returns" },
      { id: "payroll", name: "Payroll Services" },
      { id: "vat-returns", name: "VAT Returns" },
      { id: "financial-statements", name: "Financial Statements" },
      { id: "company-accounts", name: "Company Accounts" },
      { id: "self-assessment", name: "Self Assessment" },
      { id: "audit-services", name: "Audit Services" },
    ]
  },
  {
    id: "financial-planning",
    name: "Financial Planning",
    sectorName: "Legal & Financial",
    subCategories: [
      { id: "retirement-planning", name: "Retirement Planning" },
      { id: "investment-advice", name: "Investment Advice" },
      { id: "pension-planning", name: "Pension Planning" },
      { id: "mortgage-advice", name: "Mortgage Advice" },
      { id: "insurance-planning", name: "Insurance Planning" },
      { id: "wealth-management", name: "Wealth Management" },
      { id: "estate-planning", name: "Estate Planning" },
      { id: "tax-planning", name: "Tax Planning" },
    ]
  },

  // Fashion & Beauty
  {
    id: "hair-styling",
    name: "Hair Styling",
    sectorName: "Fashion & Beauty",
    subCategories: [
      { id: "haircut", name: "Haircut & Styling" },
      { id: "hair-coloring", name: "Hair Coloring" },
      { id: "highlights", name: "Highlights" },
      { id: "balayage", name: "Balayage" },
      { id: "hair-extensions", name: "Hair Extensions" },
      { id: "bridal-hair", name: "Bridal Hair" },
      { id: "keratin-treatment", name: "Keratin Treatment" },
      { id: "mobile-hairdresser", name: "Mobile Hairdresser" },
    ]
  },
  {
    id: "makeup-services",
    name: "Makeup Services",
    sectorName: "Fashion & Beauty",
    subCategories: [
      { id: "bridal-makeup", name: "Bridal Makeup" },
      { id: "party-makeup", name: "Party Makeup" },
      { id: "special-occasion", name: "Special Occasion Makeup" },
      { id: "makeup-lessons", name: "Makeup Lessons" },
      { id: "airbrush-makeup", name: "Airbrush Makeup" },
      { id: "prom-makeup", name: "Prom Makeup" },
      { id: "editorial-makeup", name: "Editorial Makeup" },
      { id: "mobile-makeup", name: "Mobile Makeup Artist" },
    ]
  },
  {
    id: "nail-services",
    name: "Nail Services",
    sectorName: "Fashion & Beauty",
    subCategories: [
      { id: "manicure", name: "Manicure" },
      { id: "pedicure", name: "Pedicure" },
      { id: "gel-nails", name: "Gel Nails" },
      { id: "acrylic-nails", name: "Acrylic Nails" },
      { id: "nail-art", name: "Nail Art" },
      { id: "nail-extensions", name: "Nail Extensions" },
      { id: "mobile-nails", name: "Mobile Nail Technician" },
      { id: "shellac", name: "Shellac Nails" },
    ]
  },
  {
    id: "personal-styling",
    name: "Personal Styling",
    sectorName: "Fashion & Beauty",
    subCategories: [
      { id: "wardrobe-styling", name: "Wardrobe Styling" },
      { id: "personal-shopping", name: "Personal Shopping" },
      { id: "color-analysis", name: "Color Analysis" },
      { id: "style-consultation", name: "Style Consultation" },
      { id: "capsule-wardrobe", name: "Capsule Wardrobe" },
      { id: "outfit-planning", name: "Outfit Planning" },
      { id: "closet-organization", name: "Closet Organization" },
      { id: "fashion-advice", name: "Fashion Advice" },
    ]
  },
];

// Helper function to get main category by ID
export const getMainCategoryById = (id: string): MainCategory | undefined => {
  return mainCategories.find(cat => cat.id === id);
};

// Helper function to get main category by name
export const getMainCategoryByName = (name: string, sectorName: string): MainCategory | undefined => {
  // First try exact match
  let category = mainCategories.find(cat => 
    cat.name === name && cat.sectorName === sectorName
  );
  
  // If not found, try flexible matching (e.g., "Plumbers" -> "Plumbing")
  if (!category) {
    const nameLower = name.toLowerCase();
    category = mainCategories.find(cat => {
      const catNameLower = cat.name.toLowerCase();
      return (
        cat.sectorName === sectorName &&
        (catNameLower.includes(nameLower) || nameLower.includes(catNameLower))
      );
    });
  }
  
  return category;
};

// Helper function to convert name to slug-compatible ID
export const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/ /g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// Helper function to get all main categories for a sector
export const getMainCategoriesBySector = (sectorName: string): MainCategory[] => {
  return mainCategories.filter(cat => cat.sectorName === sectorName);
};

// Helper function to get sub category by ID
export const getSubCategoryById = (mainCategoryId: string, subCategoryId: string): SubCategory | undefined => {
  const mainCat = getMainCategoryById(mainCategoryId);
  return mainCat?.subCategories.find(sub => sub.id === subCategoryId);
};
