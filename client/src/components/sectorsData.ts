export interface Sector {
  id: number;
  name: string;
  displayName: string; // Display name in UI (e.g., "Home &" and "Garden" on separate lines)
  subtitle?: string;
  icon: string; // Import path for icon
  categories: string[]; // List of category names under this sector
}

// Define sectors with their associated categories
export const sectors: Sector[] = [
  {
    id: 1,
    name: "Home & Garden",
    displayName: "Home &",
    subtitle: "Garden",
    icon: "imgGarden2",
    categories: [
      "Plumbing",
      "Electrical Work",
      "Painting & Decorating",
      "Carpentry",
      "Cleaning",
      "Gardening",
      "Handyman",
      "Locksmith",
      "Roofing",
      "HVAC",
      "Flooring",
      "Pest Control",
      "Window Cleaning",
      "Bathroom Fitter",
      "Kitchen Fitter"
    ]
  },
  {
    id: 2,
    name: "Business Services",
    displayName: "Business",
    subtitle: "Services",
    icon: "imgBusiness2",
    categories: [
      "IT Support",
      "Graphic Design",
      "Web Development",
      "Writing & Translation",
      "Legal Services",
      "Accounting",
      "Marketing",
      "Consulting",
      "Finance",
      "HR Services",
      "Business Setup",
      "Virtual Assistant"
    ]
  },
  {
    id: 3,
    name: "Cleaning Services",
    displayName: "Cleaning",
    subtitle: "Services",
    icon: "imgBusiness2",
    categories: [
      "Domestic Cleaning",
      "Deep Cleaning",
      "Commercial Cleaning",
      "Carpet Cleaning",
      "End of Tenancy Cleaning",
      "Office Cleaning",
      "Window Cleaning",
      "Oven Cleaning"
    ]
  },
  {
    id: 4,
    name: "Professional Services",
    displayName: "Professional",
    subtitle: "Services",
    icon: "imgBusiness2",
    categories: [
      "Consultancy",
      "Project Management",
      "Business Analysis",
      "Training & Development",
      "Administrative Support",
      "Translation Services"
    ]
  },
  {
    id: 5,
    name: "Education & Tutoring",
    displayName: "Education &",
    subtitle: "Tutoring",
    icon: "imgDriving2",
    categories: [
      "Math Tutoring",
      "English Tutoring",
      "Music Lessons",
      "Language Tutoring",
      "Exam Preparation",
      "Online Courses",
      "Skill Training",
      "Driving Lessons",
      "Career Coaching"
    ]
  },
  {
    id: 6,
    name: "Personal Services",
    displayName: "Personal",
    subtitle: "Services",
    icon: "imgEducation2",
    categories: [
      "Personal Training",
      "Life Coaching",
      "Massage Therapy",
      "Professional Organizing",
      "Photography",
      "Event Planning",
      "Catering"
    ]
  },
  {
    id: 7,
    name: "Repair & Maintenance",
    displayName: "Repair &",
    subtitle: "Maintenance",
    icon: "imgBusiness2",
    categories: [
      "Handyman Services",
      "Appliance Repair",
      "HVAC Repair",
      "Locksmith Services",
      "Furniture Repair",
      "Electronics Repair"
    ]
  },
  {
    id: 8,
    name: "Technology Services",
    displayName: "Technology",
    subtitle: "Services",
    icon: "imgBusiness2",
    categories: [
      "Computer Repair",
      "Web Development",
      "IT Support",
      "App Development",
      "Data Recovery",
      "Network Setup"
    ]
  },
  {
    id: 9,
    name: "Fashion & Beauty",
    displayName: "Fashion &",
    subtitle: "Beauty",
    icon: "imgEducation2",
    categories: [
      "Hair Styling",
      "Makeup Services",
      "Nail Services",
      "Spa Treatments",
      "Aesthetics",
      "Beauty Therapy",
      "Personal Styling",
      "Fashion Consulting",
      "Wardrobe Services"
    ]
  },
  {
    id: 10,
    name: "Health & Wellbeing",
    displayName: "Health &",
    subtitle: "Wellbeing",
    icon: "imgEducation2",
    categories: [
      "Nutrition Counseling",
      "Physiotherapy",
      "Yoga & Pilates",
      "Mental Health Support",
      "Holistic Therapy",
      "Sports Therapy"
    ]
  },
  {
    id: 11,
    name: "Legal & Financial",
    displayName: "Legal &",
    subtitle: "Financial",
    icon: "imgBusiness2",
    categories: [
      "Legal Advice",
      "Accounting Services",
      "Tax Services",
      "Financial Planning",
      "Immigration Services",
      "Estate Planning"
    ]
  },
  {
    id: 12,
    name: "Wedding & Events",
    displayName: "Wedding &",
    subtitle: "Events",
    icon: "imgEducation2",
    categories: [
      "Wedding Planning",
      "Event Photography",
      "Event Videography",
      "Catering Services",
      "DJ Services",
      "Event Planning",
      "Event Decoration",
      "Wedding Venue",
      "Wedding Catering",
      "Wedding Photography"
    ]
  },
  {
    id: 13,
    name: "Pet Services",
    displayName: "Pet",
    subtitle: "Services",
    icon: "imgEducation2",
    categories: [
      "Pet Grooming",
      "Pet Sitting",
      "Dog Walking",
      "Pet Training",
      "Veterinary Services",
      "Pet Boarding"
    ]
  },
  {
    id: 14,
    name: "Automotive Services",
    displayName: "Automotive",
    subtitle: "Services",
    icon: "imgVehicles2",
    categories: [
      "Car Repair",
      "Car Maintenance",
      "Car Detailing",
      "MOT Testing",
      "Mobile Mechanic",
      "Tyre Fitting",
      "Auto Electrician",
      "Bodywork & Paint"
    ]
  },
  {
    id: 15,
    name: "Moving & Storage",
    displayName: "Moving &",
    subtitle: "Storage",
    icon: "imgLogistic1",
    categories: [
      "Moving Services",
      "Removals",
      "Man & Van",
      "Storage Solutions",
      "Packing Services",
      "House Clearance",
      "Office Relocation",
      "International Removals"
    ]
  }
];

// Helper function to get sector by name
export const getSectorByName = (sectorName: string): Sector | undefined => {
  return sectors.find(sector => sector.name === sectorName);
};

// Helper function to get sector by category
export const getSectorByCategory = (categoryName: string): Sector | undefined => {
  return sectors.find(sector => 
    sector.categories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())
  );
};

// Helper function to get all categories
export const getAllCategories = (): string[] => {
  return sectors.flatMap(sector => sector.categories);
};

// Helper function to check if a category exists
export const categoryExists = (categoryName: string): boolean => {
  return getAllCategories().some(cat => cat.toLowerCase() === categoryName.toLowerCase());
};
