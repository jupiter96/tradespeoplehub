// Unified Category Data - Single source of truth for all category hierarchies
// Structure: Sector -> Main Category -> Sub Categories
// This file is synchronized with ServicesPage.tsx categoryTree (lines 480-839)

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
}

export interface MainCategory {
  id: string;
  name: string;
  value: string; // URL-friendly slug
  subCategories: string[]; // Simplified to array of names
}

export interface Sector {
  id: number;
  name: string;
  displayName: string; // For UI display (e.g., "Home &")
  subtitle?: string; // Second line (e.g., "Garden")
  sectorValue: string; // URL-friendly slug
  icon: string; // Import path for icon
  mainCategories: MainCategory[];
}

// Complete category tree with all sectors, main categories, and sub-categories
// SYNCHRONIZED WITH ServicesPage.tsx categoryTree
export const categoryTree: Sector[] = [
  {
    id: 1,
    name: "Home & Garden",
    displayName: "Home &",
    subtitle: "Garden",
    sectorValue: "home-garden",
    icon: "imgGarden2",
    mainCategories: [
      {
        id: "plumbing",
        name: "Plumbing",
        value: "plumbing",
        subCategories: ["Installing taps", "Replacing WC", "Fixing leakage", "Boiler repair", "Pipe installation", "Drain unblocking"]
      },
      {
        id: "electrical-work",
        name: "Electrical Work",
        value: "electrical",
        subCategories: ["Socket installation", "Light fitting", "Fuse box repair", "Rewiring", "Emergency repairs"]
      },
      {
        id: "carpentry",
        name: "Carpentry",
        value: "carpentry",
        subCategories: ["Custom furniture", "Door fitting", "Shelving", "Deck building", "Cabinet making"]
      },
      {
        id: "painting-decorating",
        name: "Painting & Decorating",
        value: "painting",
        subCategories: ["Interior painting", "Exterior painting", "Wallpapering", "Decorative finishes"]
      },
      {
        id: "gardening-landscaping",
        name: "Gardening & Landscaping",
        value: "gardening",
        subCategories: ["Lawn maintenance", "Tree surgery", "Garden design", "Patio installation"]
      },
      {
        id: "bathroom-fitting",
        name: "Bathroom Fitting",
        value: "bathroom-fitting",
        subCategories: ["Full bathroom installation", "Shower fitting", "Toilet replacement", "Sink installation"]
      },
      {
        id: "kitchen-fitting",
        name: "Kitchen Fitting",
        value: "kitchen-fitting",
        subCategories: ["Full kitchen installation", "Worktop fitting", "Cabinet installation", "Appliance fitting"]
      },
      {
        id: "home-cleaning",
        name: "Home Cleaning",
        value: "cleaning",
        subCategories: ["Deep cleaning", "Regular cleaning", "End of tenancy", "Carpet cleaning"]
      }
    ]
  },
  {
    id: 2,
    name: "Business Services",
    displayName: "Business",
    subtitle: "Services",
    sectorValue: "business",
    icon: "imgBusiness2",
    mainCategories: [
      {
        id: "business-consulting",
        name: "Business Consulting",
        value: "consulting",
        subCategories: ["Strategy consulting", "Management consulting", "Financial consulting", "HR consulting"]
      },
      {
        id: "marketing-advertising",
        name: "Marketing & Advertising",
        value: "marketing",
        subCategories: ["Digital marketing", "SEO", "Social media marketing", "Content marketing", "PPC advertising"]
      },
      {
        id: "web-development",
        name: "Web Development",
        value: "web-development",
        subCategories: ["Website design", "E-commerce development", "WordPress development", "Custom web apps"]
      },
      {
        id: "graphic-design",
        name: "Graphic Design",
        value: "graphic-design",
        subCategories: ["Logo design", "Branding", "Print design", "UI/UX design"]
      }
    ]
  },
  {
    id: 3,
    name: "Personal Services",
    displayName: "Personal",
    subtitle: "Services",
    sectorValue: "personal",
    icon: "imgEducation2",
    mainCategories: [
      {
        id: "personal-training",
        name: "Personal Training",
        value: "personal-training",
        subCategories: ["Weight loss training", "Muscle building", "Home training", "Online coaching"]
      },
      {
        id: "life-coaching",
        name: "Life Coaching",
        value: "life-coaching",
        subCategories: ["Career coaching", "Relationship coaching", "Personal development", "Goal setting"]
      },
      {
        id: "massage-therapy",
        name: "Massage Therapy",
        value: "massage",
        subCategories: ["Deep tissue massage", "Sports massage", "Relaxation massage", "Thai massage"]
      },
      {
        id: "professional-organizing",
        name: "Professional Organizing",
        value: "organizing",
        subCategories: ["Home organization", "Office organization", "Decluttering", "Storage solutions"]
      }
    ]
  },
  {
    id: 4,
    name: "Repair & Maintenance",
    displayName: "Repair &",
    subtitle: "Maintenance",
    sectorValue: "repair-maintenance",
    icon: "imgBusiness2",
    mainCategories: [
      {
        id: "handyman-services",
        name: "Handyman Services",
        value: "handyman",
        subCategories: ["General repairs", "Furniture assembly", "Picture hanging", "Minor installations"]
      },
      {
        id: "appliance-repair",
        name: "Appliance Repair",
        value: "appliance-repair",
        subCategories: ["Washing machine repair", "Refrigerator repair", "Oven repair", "Dishwasher repair"]
      },
      {
        id: "hvac-repair",
        name: "HVAC Repair",
        value: "hvac",
        subCategories: ["Air conditioning repair", "Heating repair", "Boiler servicing", "Ventilation repair"]
      },
      {
        id: "locksmith-services",
        name: "Locksmith Services",
        value: "locksmith",
        subCategories: ["Lock replacement", "Emergency lockout", "Key cutting", "Security upgrades"]
      }
    ]
  },
  {
    id: 5,
    name: "Technology Services",
    displayName: "Technology",
    subtitle: "Services",
    sectorValue: "technology",
    icon: "imgBusiness2",
    mainCategories: [
      {
        id: "computer-repair",
        name: "Computer Repair",
        value: "computer-repair",
        subCategories: ["Laptop repair", "Desktop repair", "Virus removal", "Data recovery"]
      },
      {
        id: "web-development-tech",
        name: "Web Development",
        value: "web-development",
        subCategories: ["Website design", "E-commerce development", "WordPress development", "Custom web apps"]
      },
      {
        id: "it-support",
        name: "IT Support",
        value: "it-support",
        subCategories: ["Network troubleshooting", "Software installation", "Hardware setup", "Remote support"]
      },
      {
        id: "app-development",
        name: "App Development",
        value: "app-development",
        subCategories: ["iOS development", "Android development", "Cross-platform apps", "App maintenance"]
      }
    ]
  },
  {
    id: 6,
    name: "Education & Tutoring",
    displayName: "Education &",
    subtitle: "Tutoring",
    sectorValue: "education",
    icon: "imgDriving2",
    mainCategories: [
      {
        id: "math-tutoring",
        name: "Math Tutoring",
        value: "math-tutoring",
        subCategories: ["Primary maths", "GCSE maths", "A-Level maths", "Adult numeracy"]
      },
      {
        id: "english-tutoring",
        name: "English Tutoring",
        value: "english-tutoring",
        subCategories: ["Primary English", "GCSE English", "IELTS preparation", "Creative writing"]
      },
      {
        id: "music-lessons",
        name: "Music Lessons",
        value: "music-lessons",
        subCategories: ["Piano lessons", "Guitar lessons", "Vocal training", "Music theory"]
      },
      {
        id: "language-tutoring",
        name: "Language Tutoring",
        value: "language-tutoring",
        subCategories: ["Spanish lessons", "French lessons", "Mandarin lessons", "German lessons"]
      }
    ]
  },
  {
    id: 7,
    name: "Beauty & Wellness",
    displayName: "Beauty &",
    subtitle: "Wellness",
    sectorValue: "beauty-wellness",
    icon: "imgEducation2",
    mainCategories: [
      {
        id: "hair-styling",
        name: "Hair Styling",
        value: "hair-styling",
        subCategories: ["Haircuts", "Hair coloring", "Hair extensions", "Styling for events"]
      },
      {
        id: "makeup-services",
        name: "Makeup Services",
        value: "makeup",
        subCategories: ["Bridal makeup", "Party makeup", "Makeup lessons", "Special effects makeup"]
      },
      {
        id: "nail-services",
        name: "Nail Services",
        value: "nail-services",
        subCategories: ["Manicure", "Pedicure", "Gel nails", "Nail art"]
      },
      {
        id: "spa-treatments",
        name: "Spa Treatments",
        value: "spa-treatments",
        subCategories: ["Facials", "Body treatments", "Waxing", "Aromatherapy"]
      }
    ]
  },
  {
    id: 8,
    name: "Health & Wellness",
    displayName: "Health &",
    subtitle: "Wellness",
    sectorValue: "health-wellness",
    icon: "imgEducation2",
    mainCategories: [
      {
        id: "nutrition-counseling",
        name: "Nutrition Counseling",
        value: "nutrition",
        subCategories: ["Diet planning", "Weight management", "Sports nutrition", "Meal prep advice"]
      },
      {
        id: "physiotherapy",
        name: "Physiotherapy",
        value: "physiotherapy",
        subCategories: ["Sports injuries", "Back pain treatment", "Post-surgery rehab", "Mobility improvement"]
      },
      {
        id: "yoga-pilates",
        name: "Yoga & Pilates",
        value: "yoga",
        subCategories: ["Beginner yoga", "Advanced yoga", "Pilates classes", "Private sessions"]
      },
      {
        id: "mental-health-support",
        name: "Mental Health Support",
        value: "therapy",
        subCategories: ["Counseling", "CBT therapy", "Stress management", "Anxiety support"]
      }
    ]
  },
  {
    id: 9,
    name: "Legal & Financial",
    displayName: "Legal &",
    subtitle: "Financial",
    sectorValue: "legal-financial",
    icon: "imgBusiness2",
    mainCategories: [
      {
        id: "legal-advice",
        name: "Legal Advice",
        value: "legal-advice",
        subCategories: ["Family law", "Property law", "Employment law", "Contract review"]
      },
      {
        id: "accounting-services",
        name: "Accounting Services",
        value: "accounting",
        subCategories: ["Bookkeeping", "Tax returns", "Payroll services", "Financial statements"]
      },
      {
        id: "financial-planning",
        name: "Financial Planning",
        value: "financial-planning",
        subCategories: ["Retirement planning", "Investment advice", "Mortgage advice", "Debt management"]
      },
      {
        id: "tax-services",
        name: "Tax Services",
        value: "tax-services",
        subCategories: ["Personal tax", "Business tax", "VAT returns", "Tax planning"]
      }
    ]
  },
  {
    id: 10,
    name: "Event Services",
    displayName: "Event",
    subtitle: "Services",
    sectorValue: "events",
    icon: "imgEducation2",
    mainCategories: [
      {
        id: "event-photography",
        name: "Event Photography",
        value: "photography",
        subCategories: ["Wedding photography", "Corporate events", "Birthday parties", "Portrait photography"]
      },
      {
        id: "catering-services",
        name: "Catering Services",
        value: "catering",
        subCategories: ["Wedding catering", "Corporate catering", "Party catering", "Dietary specific catering"]
      },
      {
        id: "dj-services",
        name: "DJ Services",
        value: "dj-services",
        subCategories: ["Wedding DJ", "Party DJ", "Corporate events", "Equipment hire"]
      },
      {
        id: "event-planning",
        name: "Event Planning",
        value: "event-planning",
        subCategories: ["Wedding planning", "Corporate events", "Birthday parties", "Full event coordination"]
      }
    ]
  },
  {
    id: 11,
    name: "Pet Services",
    displayName: "Pet",
    subtitle: "Services",
    sectorValue: "pets",
    icon: "imgEducation2",
    mainCategories: [
      {
        id: "pet-grooming",
        name: "Pet Grooming",
        value: "pet-grooming",
        subCategories: ["Dog grooming", "Cat grooming", "Nail trimming", "Bathing"]
      },
      {
        id: "dog-walking",
        name: "Dog Walking",
        value: "dog-walking",
        subCategories: ["Individual walks", "Group walks", "Puppy walking", "Senior dog care"]
      },
      {
        id: "pet-sitting",
        name: "Pet Sitting",
        value: "pet-sitting",
        subCategories: ["Home visits", "Overnight care", "Holiday care", "Multiple pets"]
      },
      {
        id: "pet-training",
        name: "Pet Training",
        value: "pet-training",
        subCategories: ["Puppy training", "Obedience training", "Behavior correction", "Agility training"]
      }
    ]
  },
  {
    id: 12,
    name: "Automotive",
    displayName: "Automotive",
    subtitle: "",
    sectorValue: "automotive",
    icon: "imgVehicles2",
    mainCategories: [
      {
        id: "car-repair",
        name: "Car Repair",
        value: "car-repair",
        subCategories: ["Engine repair", "Brake repair", "Transmission repair", "Electrical repair"]
      },
      {
        id: "car-maintenance",
        name: "Car Maintenance",
        value: "car-maintenance",
        subCategories: ["Oil changes", "Tire rotation", "MOT preparation", "Brake servicing"]
      },
      {
        id: "car-detailing",
        name: "Car Detailing",
        value: "car-detailing",
        subCategories: ["Interior cleaning", "Exterior wash", "Paint correction", "Ceramic coating"]
      },
      {
        id: "bodywork-paint",
        name: "Bodywork & Paint",
        value: "bodywork",
        subCategories: ["Dent removal", "Scratch repair", "Full respray", "Panel replacement"]
      }
    ]
  },
  {
    id: 13,
    name: "Moving & Storage",
    displayName: "Moving &",
    subtitle: "Storage",
    sectorValue: "moving-storage",
    icon: "imgLogistic1",
    mainCategories: [
      {
        id: "moving-services",
        name: "Moving Services",
        value: "moving-services",
        subCategories: ["House removals", "Office removals", "Single item moves", "International moves"]
      },
      {
        id: "packing-services",
        name: "Packing Services",
        value: "packing",
        subCategories: ["Full packing service", "Fragile item packing", "Unpacking service", "Packing materials"]
      },
      {
        id: "storage-solutions",
        name: "Storage Solutions",
        value: "storage",
        subCategories: ["Self storage", "Container storage", "Document storage", "Long-term storage"]
      },
      {
        id: "furniture-assembly",
        name: "Furniture Assembly",
        value: "furniture-assembly",
        subCategories: ["Flat pack assembly", "Ikea assembly", "Office furniture", "Disassembly service"]
      }
    ]
  }
];

// Helper functions
export const getSectorByName = (sectorName: string): Sector | undefined => {
  return categoryTree.find(sector => sector.name === sectorName);
};

export const getSectorBySlug = (slug: string): Sector | undefined => {
  return categoryTree.find(sector => sector.sectorValue === slug);
};

export const getMainCategoriesBySector = (sectorName: string): MainCategory[] => {
  const sector = getSectorByName(sectorName);
  return sector?.mainCategories || [];
};

export const getMainCategoryById = (sectorName: string, mainCategoryId: string): MainCategory | undefined => {
  const sector = getSectorByName(sectorName);
  return sector?.mainCategories.find(cat => cat.id === mainCategoryId || cat.value === mainCategoryId);
};

export const getMainCategoryByName = (sectorName: string, mainCategoryName: string): MainCategory | undefined => {
  const sector = getSectorByName(sectorName);
  return sector?.mainCategories.find(cat => cat.name === mainCategoryName);
};

export const getAllSectors = (): Sector[] => {
  return categoryTree;
};

export const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/ /g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// Legacy compatibility - return old format for backward compatibility
export const sectors = categoryTree.map(sector => ({
  id: sector.id,
  name: sector.name,
  displayName: sector.displayName,
  subtitle: sector.subtitle,
  icon: sector.icon,
  sectorValue: sector.sectorValue,
  categories: sector.mainCategories.map(cat => cat.name)
}));

// Legacy mainCategories format for categoriesHierarchy.ts compatibility
export const mainCategories = categoryTree.flatMap(sector =>
  sector.mainCategories.map(mainCat => ({
    id: mainCat.id,
    name: mainCat.name,
    sectorName: sector.name,
    subCategories: mainCat.subCategories.map((subCat, index) => ({
      id: `${mainCat.id}-${index}`,
      name: subCat
    }))
  }))
);

// ServicesPage compatible format
export const categoryTreeForServicesPage = categoryTree.map(sector => ({
  sector: sector.name,
  sectorValue: sector.sectorValue,
  mainCategories: sector.mainCategories.map(mainCat => ({
    name: mainCat.name,
    value: mainCat.value,
    subCategories: mainCat.subCategories
  }))
}));
