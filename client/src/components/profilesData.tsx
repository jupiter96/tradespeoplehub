// Category-based skills mapping
export const categorySkills: Record<string, string[]> = {
  "Plumbing & Heating": ["Plumbing", "Heating Systems", "Bathroom Installation", "Emergency Repairs", "Boiler Service", "Pipe Fitting", "Leak Detection", "Drainage Systems", "Water Heater Installation", "Gas Fitting", "Central Heating", "Radiator Installation", "Tap & Toilet Repair", "Power Flushing", "Underfloor Heating", "Kitchen Installation", "Wet Room Fitting"],
  "Electrical": ["Electrical Wiring", "Circuit Installation", "Lighting Design", "Safety Inspections", "Fault Finding", "Consumer Unit Installation", "LED Installation", "Smart Home Systems", "Emergency Repairs", "PAT Testing", "Solar Panel Installation", "EV Charger Installation", "Rewiring", "EICR Certificates", "Outdoor Lighting"],
  "Building & Construction": ["Bricklaying", "Plastering", "Rendering", "Extension Building", "Loft Conversion", "Foundation Work", "Roofing", "Scaffolding", "Damp Proofing", "Structural Repairs", "Carpentry", "Tiling", "Flooring", "Kitchen Fitting", "Bathroom Fitting", "Project Management"],
  "Cleaning": ["Deep Cleaning", "End of Tenancy Cleaning", "Carpet Cleaning", "Window Cleaning", "Pressure Washing", "Upholstery Cleaning", "Office Cleaning", "Regular Domestic Cleaning", "Move In/Out Cleaning", "Oven Cleaning", "After Builders Cleaning", "Steam Cleaning", "Eco-Friendly Products", "Sanitization"],
  "Gardening & Landscaping": ["Garden Design", "Lawn Maintenance", "Hedge Trimming", "Tree Surgery", "Patio Installation", "Decking", "Fencing", "Artificial Grass", "Garden Clearance", "Planting", "Irrigation Systems", "Weed Control", "Pruning", "Garden Lighting", "Turfing"],
  "Home Improvement": ["Painting & Decorating", "Wallpapering", "Kitchen Renovation", "Bathroom Renovation", "Flooring Installation", "Tiling", "Door Installation", "Window Fitting", "Drywall", "Skirting Boards", "Coving", "Feature Walls", "Exterior Painting", "Wood Staining", "Cabinet Installation"],
  "IT & Tech Support": ["Computer Repair", "Network Setup", "WiFi Installation", "Data Recovery", "Virus Removal", "Software Installation", "Hardware Upgrades", "Smart Home Setup", "CCTV Installation", "Printer Setup", "Email Configuration", "Cloud Services", "Cybersecurity", "Remote Support", "System Optimization"],
  "Beauty & Wellness": ["Hair Styling", "Hair Coloring", "Makeup Application", "Manicure & Pedicure", "Massage Therapy", "Facial Treatments", "Waxing", "Threading", "Eyelash Extensions", "Bridal Makeup", "Spray Tanning", "Body Treatments", "Aromatherapy", "Nail Art", "Hair Extensions"],
  "Photography & Videography": ["Portrait Photography", "Wedding Photography", "Event Photography", "Product Photography", "Real Estate Photography", "Video Editing", "Drone Photography", "Studio Lighting", "Photo Retouching", "Corporate Photography", "Family Portraits", "Headshots", "Food Photography", "Sports Photography", "Cinematography"],
  "Tutoring & Education": ["Maths Tutoring", "English Tutoring", "Science Tutoring", "Language Teaching", "Music Lessons", "Exam Preparation", "Primary Education", "Secondary Education", "Adult Learning", "Special Needs Support", "Online Teaching", "Curriculum Planning", "Study Skills", "Test Preparation", "Academic Coaching"],
  "Automotive": ["Car Servicing", "MOT Preparation", "Brake Repair", "Engine Diagnostics", "Oil Changes", "Tyre Fitting", "Bodywork Repair", "Paint Restoration", "Air Conditioning Service", "Battery Replacement", "Suspension Repair", "Exhaust System", "Electrical Diagnostics", "Mobile Mechanic", "Vehicle Detailing"],
  "Pet Care": ["Dog Walking", "Pet Sitting", "Pet Grooming", "Dog Training", "Cat Care", "Puppy Training", "Pet Boarding", "Veterinary Care", "Behavioral Training", "Pet Transportation", "Aquarium Maintenance", "Bird Care", "Small Animal Care", "Pet Photography", "Mobile Grooming"],
  "Events & Entertainment": ["DJ Services", "Wedding Planning", "Event Catering", "Photography", "Videography", "Entertainment", "Venue Decoration", "Sound System Setup", "Lighting Design", "MC Services", "Live Music", "Party Planning", "Corporate Events", "Birthday Parties", "Event Coordination"],
  "Business Services": ["Bookkeeping", "Tax Preparation", "Business Consulting", "Marketing Strategy", "Social Media Management", "Web Design", "SEO Services", "Content Writing", "Graphic Design", "Virtual Assistant", "Translation Services", "Legal Services", "HR Consulting", "Financial Planning", "Brand Development"],
  "Health & Fitness": ["Personal Training", "Yoga Instruction", "Pilates", "Nutrition Coaching", "Weight Loss Programs", "Strength Training", "Cardio Training", "Sports Massage", "Flexibility Training", "Group Fitness Classes", "Online Coaching", "Meal Planning", "Fitness Assessment", "Rehabilitation", "Mobility Training"]
};

// Function to get random skills based on category
export function getSkillsByCategory(category: string, count: number = 12): string[] {
  const skills = categorySkills[category] || [];
  if (skills.length <= count) return skills;
  
  // Shuffle and return random subset
  const shuffled = [...skills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface ProfileData {
  id: string;
  name: string;
  title: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  memberSince: string;
  location: string;
  postcode: string;
  responseTime: string;
  bio: string;
  skills: string[];
  qualifications: {
    name: string;
    year?: string;
    number?: string;
    verified: boolean;
  }[];
  insurance: {
    publicLiability: string;
    provider: string;
    expiryDate: string;
    verified: boolean;
  };
  verifications: {
    phone: boolean;
    identity: boolean;
    address: boolean;
    insurance: boolean;
    qualifications: boolean;
  };
  portfolio: {
    id: number;
    image: string;
    title: string;
    description: string;
  }[];
  reviews: {
    id: number;
    author: string;
    authorImage: string;
    rating: number;
    date: string;
    comment: string;
  }[];
}

// Mock user profiles
export const userProfiles: ProfileData[] = [
  {
    id: "117",
    name: "John Smith",
    title: "Professional Plumber & Heating Engineer",
    category: "Plumbing & Heating",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjM0NDUxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    reviewCount: 127,
    completedJobs: 245,
    memberSince: "2022",
    location: "London, UK",
    postcode: "SW1A 1AA",
    responseTime: "Within 2 hours",
    bio: "I am a qualified and experienced plumber with over 10 years in the industry. I specialize in residential and commercial plumbing, heating systems, and bathroom installations. My work is guaranteed and I pride myself on providing excellent customer service.",
    skills: getSkillsByCategory("Plumbing & Heating", 12),
    qualifications: [
      { name: "City & Guilds Level 3 Plumbing", year: "2012", verified: true },
      { name: "Gas Safe Registered", number: "123456", verified: true },
      { name: "OFTEC Oil Heating Technician", year: "2015", verified: true },
      { name: "Unvented Hot Water Systems", year: "2014", verified: false }
    ],
    insurance: {
      publicLiability: "£5,000,000",
      provider: "TradeHelp Insurance",
      expiryDate: "Dec 2025",
      verified: true
    },
    verifications: {
      phone: true,
      identity: true,
      address: true,
      insurance: true,
      qualifications: true,
    },
    portfolio: [
      {
        id: 1,
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGluc3RhbGxhdGlvbnxlbnwxfHx8fDE3NjM1NTYwMDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Modern Bathroom Installation",
        description: "Complete bathroom renovation including tiling and fixtures"
      },
      {
        id: 2,
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcGx1bWJpbmd8ZW58MXx8fHwxNzYzNTU2MDA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Kitchen Plumbing Installation",
        description: "New kitchen sink and dishwasher installation"
      },
      {
        id: 3,
        image: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib2lsZXIlMjBpbnN0YWxsYXRpb258ZW58MXx8fHwxNzYzNTU2MDA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Boiler Installation & Service",
        description: "Modern combi boiler installation with 10-year guarantee"
      }
    ],
    reviews: [
      {
        id: 1,
        author: "Sarah Johnson",
        authorImage: "https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHdvbWFufGVufDF8fHx8MTc2MzQyMDIwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "2 weeks ago",
        comment: "Excellent service! John was punctual, professional, and completed the job to a very high standard. Would highly recommend."
      },
      {
        id: 2,
        author: "Michael Brown",
        authorImage: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbnxlbnwxfHx8fDE3NjMzOTYwNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "1 month ago",
        comment: "Very happy with the bathroom installation. John explained everything clearly and the finish is perfect. Great value for money."
      },
      {
        id: 3,
        author: "Emma Wilson",
        authorImage: "https://images.unsplash.com/photo-1543132220-7bc04a0e790a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzQwNzEyOHww&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 4,
        date: "2 months ago",
        comment: "Good work overall. A small delay but John kept me informed and the final result was worth the wait."
      }
    ]
  },
  {
    id: "201",
    name: "Sarah Williams",
    title: "Certified Electrician & Smart Home Specialist",
    category: "Electrical",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGVsZWN0cmljaWFufGVufDB8fHx8MTczMjAyNjgwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.8,
    reviewCount: 98,
    completedJobs: 185,
    memberSince: "2021",
    location: "Manchester, UK",
    postcode: "M1 1AA",
    responseTime: "Within 3 hours",
    bio: "Fully qualified electrician with 8 years of experience in domestic and commercial electrical work. I specialize in smart home installations, rewiring, and electrical safety inspections. All work is certified and insured.",
    skills: getSkillsByCategory("Electrical", 11),
    qualifications: [
      { name: "NVQ Level 3 Electrical Installation", year: "2016", verified: true },
      { name: "18th Edition Wiring Regulations", year: "2020", verified: true },
      { name: "Part P Building Regulations", year: "2016", verified: true }
    ],
    insurance: {
      publicLiability: "£10,000,000",
      provider: "Simply Business",
      expiryDate: "Mar 2026",
      verified: true
    },
    verifications: {
      phone: true,
      identity: true,
      address: true,
      insurance: true,
      qualifications: true,
    },
    portfolio: [
      {
        id: 1,
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGhvbWUlMjBpbnN0YWxsYXRpb258ZW58MHx8fHwxNzMyMDI2ODAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Smart Home System Installation",
        description: "Complete smart lighting and heating control system"
      },
      {
        id: 2,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyaW5nfGVufDB8fHx8MTczMjAyNjgwMHww&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Full House Rewiring",
        description: "Complete electrical rewiring for 3-bedroom house"
      }
    ],
    reviews: [
      {
        id: 1,
        author: "David Thompson",
        authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "1 week ago",
        comment: "Sarah did an amazing job installing our smart home system. Very knowledgeable and professional."
      },
      {
        id: 2,
        author: "Lisa Chen",
        authorImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTczMjAyNjgwMHww&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "3 weeks ago",
        comment: "Excellent service and very fair pricing. Would definitely use again."
      }
    ]
  },
  {
    id: "302",
    name: "James Anderson",
    title: "Master Builder & Construction Manager",
    category: "Building & Construction",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJ8ZW58MHx8fHwxNzMyMDI2ODAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    reviewCount: 156,
    completedJobs: 312,
    memberSince: "2019",
    location: "Birmingham, UK",
    postcode: "B1 1AA",
    responseTime: "Within 4 hours",
    bio: "Experienced builder with over 15 years in the construction industry. Specializing in extensions, loft conversions, and complete property renovations. I manage all aspects of building projects from design to completion.",
    skills: getSkillsByCategory("Building & Construction", 13),
    qualifications: [
      { name: "NVQ Level 6 Construction Management", year: "2010", verified: true },
      { name: "CSCS Black Manager Card", year: "2011", verified: true },
      { name: "CITB Site Management Safety Training", year: "2019", verified: true }
    ],
    insurance: {
      publicLiability: "£10,000,000",
      provider: "FMB Insurance",
      expiryDate: "Aug 2026",
      verified: true
    },
    verifications: {
      phone: true,
      identity: true,
      address: true,
      insurance: true,
      qualifications: true,
    },
    portfolio: [
      {
        id: 1,
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMGV4dGVuc2lvbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Two-Storey Extension",
        description: "Complete two-storey side extension adding two bedrooms"
      },
      {
        id: 2,
        image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2Z0JTIwY29udmVyc2lvbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Loft Conversion Project",
        description: "Converted attic space into master bedroom with ensuite"
      },
      {
        id: 3,
        image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmVub3ZhdGlvbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Complete Kitchen Renovation",
        description: "Full kitchen extension and refurbishment"
      }
    ],
    reviews: [
      {
        id: 1,
        author: "Peter Roberts",
        authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "2 weeks ago",
        comment: "James and his team did an outstanding job on our extension. Professional, reliable, and the quality is exceptional."
      },
      {
        id: 2,
        author: "Rachel Green",
        authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "1 month ago",
        comment: "Highly skilled and trustworthy builder. Completed our loft conversion on time and within budget."
      }
    ]
  },
  {
    id: "403",
    name: "Emily Parker",
    title: "Professional Cleaner & Home Care Specialist",
    category: "Cleaning",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjbGVhbmVyfGVufDB8fHx8MTczMjAyNjgwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    reviewCount: 203,
    completedJobs: 456,
    memberSince: "2020",
    location: "Leeds, UK",
    postcode: "LS1 1AA",
    responseTime: "Within 1 hour",
    bio: "Professional cleaning specialist with 6 years of experience. I offer deep cleaning, end of tenancy cleaning, and regular domestic services. All eco-friendly products used and satisfaction guaranteed.",
    skills: getSkillsByCategory("Cleaning", 10),
    qualifications: [
      { name: "Professional Cleaning Certificate", year: "2020", verified: true },
      { name: "Health & Safety Level 2", year: "2020", verified: true },
      { name: "Carpet Cleaning Specialist", year: "2021", verified: true }
    ],
    insurance: {
      publicLiability: "£5,000,000",
      provider: "Protectivity",
      expiryDate: "Jan 2026",
      verified: true
    },
    verifications: {
      phone: true,
      identity: true,
      address: true,
      insurance: true,
      qualifications: true,
    },
    portfolio: [],
    reviews: [
      {
        id: 1,
        author: "Karen Wilson",
        authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTczMjAyNjgwMHww&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "3 days ago",
        comment: "Emily is absolutely fantastic! My house has never been so clean. Very thorough and professional."
      },
      {
        id: 2,
        author: "Tom Harris",
        authorImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "1 week ago",
        comment: "End of tenancy clean was perfect. Got my full deposit back thanks to Emily's amazing work!"
      }
    ]
  },
  {
    id: "504",
    name: "Michael Green",
    title: "Landscape Designer & Garden Maintenance Expert",
    category: "Gardening & Landscaping",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5lciUyMG1hbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.7,
    reviewCount: 89,
    completedJobs: 167,
    memberSince: "2021",
    location: "Bristol, UK",
    postcode: "BS1 1AA",
    responseTime: "Within 4 hours",
    bio: "Passionate landscape gardener with over 12 years of experience. Specializing in garden design, patio installation, and ongoing maintenance. I create beautiful outdoor spaces that you'll love.",
    skills: getSkillsByCategory("Gardening & Landscaping", 12),
    qualifications: [
      { name: "RHS Level 3 Horticulture", year: "2012", verified: true },
      { name: "Garden Design Diploma", year: "2014", verified: true },
      { name: "Tree Surgery Certificate", year: "2016", verified: false }
    ],
    insurance: {
      publicLiability: "£5,000,000",
      provider: "Stallion Insurance",
      expiryDate: "May 2026",
      verified: true
    },
    verifications: {
      phone: true,
      identity: true,
      address: true,
      insurance: true,
      qualifications: true,
    },
    portfolio: [
      {
        id: 1,
        image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBkZXNpZ258ZW58MHx8fHwxNzMyMDI2ODAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Contemporary Garden Design",
        description: "Modern garden transformation with patio and planting"
      },
      {
        id: 2,
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXRpbyUyMGluc3RhbGxhdGlvbnxlbnwwfHx8fDE3MzIwMjY4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
        title: "Patio & Decking Installation",
        description: "Large patio area with composite decking"
      }
    ],
    reviews: [
      {
        id: 1,
        author: "Jane Mitchell",
        authorImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGJ1c2luZXNzfGVufDB8fHx8MTczMjAyNjgwMHww&ixlib=rb-4.1.0&q=80&w=1080",
        rating: 5,
        date: "2 weeks ago",
        comment: "Michael transformed our garden completely. His design ideas were brilliant and the execution was perfect."
      }
    ]
  }
];

// Helper function to get profile by ID or trading name
export function getProfileById(id: string): ProfileData | undefined {
  return userProfiles.find(profile => profile.id === id);
}

export function getProfileByName(name: string): ProfileData | undefined {
  return userProfiles.find(profile => profile.name === name);
}
