import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Sector from '../models/Sector.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Limit subcategory explosion:
// - Each Category should end up with ~2-3 SubCategories
// - Total SubCategory documents created by this seed should not exceed 1000
const MAX_TOTAL_SUBCATEGORIES = 1000;
const MIN_SUBCATEGORIES_PER_CATEGORY = 2;
const MAX_SUBCATEGORIES_PER_CATEGORY = 3;

// Complete sectors data based on all sources in the web app
const sectorsData = [
  {
    name: "Home & Garden",
    slug: "home-garden",
    displayName: "Home &",
    subtitle: "Garden",
    icon: "imgGarden2",
    description: "Home and garden services including plumbing, electrical, painting, and more",
    metaTitle: "Home & Garden Services | Professional Home Improvement",
    metaDescription: "Find trusted professionals for plumbing, electrical work, painting, carpentry, gardening, and all your home improvement needs.",
    order: 1,
  },
  {
    name: "Business Services",
    slug: "business-services",
    displayName: "Business",
    subtitle: "Services",
    icon: "imgBusiness2",
    description: "Professional business services including IT, design, and consulting",
    metaTitle: "Business Services | Professional Business Solutions",
    metaDescription: "Expert business services including IT support, graphic design, web development, marketing, and consulting.",
    order: 2,
  },
  {
    name: "Cleaning Services",
    slug: "cleaning-services",
    displayName: "Cleaning",
    subtitle: "Services",
    icon: "imgBusiness2",
    description: "Comprehensive cleaning services for homes and businesses",
    metaTitle: "Cleaning Services | Professional Cleaning Solutions",
    metaDescription: "Professional cleaning services including domestic, commercial, deep cleaning, and specialized cleaning services.",
    order: 3,
  },
  {
    name: "Professional Services",
    slug: "professional-services",
    displayName: "Professional",
    subtitle: "Services",
    icon: "imgBusiness2",
    description: "Professional consultancy and business services",
    metaTitle: "Professional Services | Expert Consultancy",
    metaDescription: "Professional consultancy services including project management, business analysis, training, and administrative support.",
    order: 4,
  },
  {
    name: "Education & Tutoring",
    slug: "education-tutoring",
    displayName: "Education &",
    subtitle: "Tutoring",
    icon: "imgDriving2",
    description: "Educational services and tutoring",
    metaTitle: "Education & Tutoring Services | Expert Tutors",
    metaDescription: "Professional tutoring and educational services including math, English, music, languages, exam preparation, and driving lessons.",
    order: 5,
  },
  {
    name: "Personal Services",
    slug: "personal-services",
    displayName: "Personal",
    subtitle: "Services",
    icon: "imgEducation2",
    description: "Personal care and lifestyle services",
    metaTitle: "Personal Services | Lifestyle & Wellness",
    metaDescription: "Personal services including personal training, life coaching, massage therapy, photography, and event planning.",
    order: 6,
  },
  {
    name: "Repair & Maintenance",
    slug: "repair-maintenance",
    displayName: "Repair &",
    subtitle: "Maintenance",
    icon: "imgBusiness2",
    description: "Repair and maintenance services",
    metaTitle: "Repair & Maintenance Services | Expert Repairs",
    metaDescription: "Professional repair and maintenance services for appliances, HVAC, furniture, electronics, and more.",
    order: 7,
  },
  {
    name: "Technology Services",
    slug: "technology-services",
    displayName: "Technology",
    subtitle: "Services",
    icon: "imgBusiness2",
    description: "Technology and IT services",
    metaTitle: "Technology Services | IT Support & Development",
    metaDescription: "Expert technology services including computer repair, web development, IT support, app development, and data recovery.",
    order: 8,
  },
  {
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    displayName: "Fashion &",
    subtitle: "Beauty",
    icon: "imgEducation2",
    description: "Fashion and beauty services",
    metaTitle: "Fashion & Beauty Services | Style & Glamour",
    metaDescription: "Professional fashion and beauty services including hair styling, makeup, nails, spa treatments, and personal styling.",
    order: 9,
  },
  {
    name: "Health & Wellbeing",
    slug: "health-wellbeing",
    displayName: "Health &",
    subtitle: "Wellbeing",
    icon: "imgEducation2",
    description: "Health and wellbeing services",
    metaTitle: "Health & Wellbeing Services | Wellness & Care",
    metaDescription: "Comprehensive health and wellbeing services including nutrition counseling, physiotherapy, yoga, and mental health support.",
    order: 10,
  },
  {
    name: "Legal & Financial",
    slug: "legal-financial",
    displayName: "Legal &",
    subtitle: "Financial",
    icon: "imgBusiness2",
    description: "Legal and financial services",
    metaTitle: "Legal & Financial Services | Expert Advice",
    metaDescription: "Professional legal and financial services including legal advice, accounting, tax services, and financial planning.",
    order: 11,
  },
  {
    name: "Wedding & Events",
    slug: "wedding-events",
    displayName: "Wedding &",
    subtitle: "Events",
    icon: "imgEducation2",
    description: "Wedding and event planning services",
    metaTitle: "Wedding & Events Services | Perfect Celebrations",
    metaDescription: "Complete wedding and event services including planning, photography, videography, catering, and decoration.",
    order: 12,
  },
  {
    name: "Pet Services",
    slug: "pet-services",
    displayName: "Pet",
    subtitle: "Services",
    icon: "imgEducation2",
    description: "Pet care and services",
    metaTitle: "Pet Services | Professional Pet Care",
    metaDescription: "Comprehensive pet services including grooming, pet sitting, dog walking, training, and veterinary services.",
    order: 13,
  },
  {
    name: "Automotive Services",
    slug: "automotive-services",
    displayName: "Automotive",
    subtitle: "Services",
    icon: "imgVehicles2",
    description: "Automotive repair and maintenance",
    metaTitle: "Automotive Services | Car Repair & Maintenance",
    metaDescription: "Professional automotive services including car repair, maintenance, detailing, MOT testing, and mobile mechanics.",
    order: 14,
  },
  {
    name: "Moving & Storage",
    slug: "moving-storage",
    displayName: "Moving &",
    subtitle: "Storage",
    icon: "imgLogistic1",
    description: "Moving and storage services",
    metaTitle: "Moving & Storage Services | Relocation Experts",
    metaDescription: "Professional moving and storage services including house removals, office relocation, packing, and storage solutions.",
    order: 15,
  },
];

// Complete categories data with all subcategories from the web app
const categoriesData = {
  "home-garden": [
    { 
      name: "Plumbing", 
      order: 1, 
      question: "What type of plumbing service do you need?",
      subCategories: [
        "Emergency Plumbing", "Drain Cleaning", "Leak Repair", "Toilet Repair",
        "Tap Installation", "Boiler Repair", "Pipe Installation", "Bathroom Plumbing",
        "Installing taps", "Replacing WC", "Fixing leakage", "Drain unblocking"
      ]
    },
    { 
      name: "Electrical Work", 
      order: 2, 
      question: "What electrical work do you need?",
      subCategories: [
        "Rewiring", "Light Installation", "Socket Installation", "Fuse Box Repair",
        "Electrical Inspection", "Outdoor Lighting", "Electric Shower Installation", "Security Lighting",
        "Light fitting", "Emergency repairs"
      ]
    },
    { 
      name: "Builders", 
      order: 3, 
      question: "What building work do you need?",
      subCategories: [
        "Extension", "Conversion", "Building a house", "Refurbishments"
      ]
    },
    { 
      name: "Painting & Decorating", 
      order: 4, 
      question: "What painting or decorating service do you need?",
      subCategories: [
        "Interior Painting", "Exterior Painting", "Wallpapering", "Ceiling Painting",
        "Wood Staining", "Commercial Painting", "Decorative Finishes", "Spray Painting",
        "Interior painting", "Exterior painting"
      ]
    },
    { 
      name: "Carpentry", 
      order: 5, 
      question: "What carpentry work do you need?",
      subCategories: [
        "Custom Furniture", "Door Installation", "Shelving Installation", "Deck Building",
        "Fence Installation", "Cabinet Making", "Skirting Boards", "Wood Repairs",
        "Door fitting", "Shelving", "Cabinet making"
      ]
    },
    { 
      name: "Cleaning", 
      order: 6, 
      question: "What type of cleaning service do you need?",
      subCategories: [
        "Domestic Cleaning", "Deep Cleaning", "End of Tenancy Cleaning", "Carpet Cleaning",
        "Oven Cleaning", "Window Cleaning", "Office Cleaning", "Post Renovation Cleaning",
        "Regular cleaning"
      ]
    },
    { 
      name: "Gardening", 
      order: 7, 
      question: "What gardening service do you need?",
      subCategories: [
        "Lawn Mowing", "Hedge Trimming", "Garden Design", "Tree Surgery",
        "Landscape Gardening", "Garden Maintenance", "Patio Installation", "Artificial Grass Installation",
        "Lawn maintenance", "Garden design", "Fencing", "Gutter cleaning"
      ]
    },
    { 
      name: "Handyman", 
      order: 8, 
      question: "What handyman service do you need?",
      subCategories: [
        "General Repairs", "Furniture Assembly", "TV Mounting", "Picture Hanging",
        "Odd Jobs", "Minor Plumbing", "Minor Electrical", "Maintenance Work",
        "General repairs", "Shelf installation"
      ]
    },
    { 
      name: "Locksmith", 
      order: 9, 
      question: "What locksmith service do you need?",
      subCategories: [
        "Emergency Lockout", "Lock Change", "Lock Repair", "Key Cutting",
        "UPVC Lock Specialist", "Security Upgrade", "Safe Opening", "Garage Door Locks",
        "Lock installation", "Emergency lockout"
      ]
    },
    { 
      name: "Roofing", 
      order: 10, 
      question: "What roofing service do you need?",
      subCategories: [
        "Roof Repair", "Roof Replacement", "Flat Roofing", "Tile Roofing",
        "Gutter Cleaning", "Chimney Repair", "Roof Inspection", "Skylight Installation",
        "Gutter repair"
      ]
    },
    { 
      name: "HVAC", 
      order: 11, 
      question: "What HVAC service do you need?",
      subCategories: [
        "Boiler Service", "Central Heating", "Air Conditioning", "Heating Repair",
        "Radiator Installation", "Ventilation Systems", "Thermostat Installation", "Gas Safety Check",
        "Boiler installation", "Boiler repair", "Radiator repair", "Heating system maintenance"
      ]
    },
    { 
      name: "Flooring", 
      order: 12, 
      question: "What flooring service do you need?",
      subCategories: [
        "Laminate Flooring", "Hardwood Flooring", "Carpet Installation", "Vinyl Flooring",
        "Tile Flooring", "Floor Sanding", "Underfloor Heating", "Floor Repair",
        "Flooring installation", "Tiling", "Carpet fitting", "Wood flooring"
      ]
    },
    { 
      name: "Pest Control", 
      order: 13, 
      question: "What pest control service do you need?",
      subCategories: [
        "Rat Control", "Mouse Control", "Wasp Removal", "Bed Bug Treatment",
        "Ant Control", "Cockroach Control", "Bird Proofing", "Fumigation",
        "Rodent control", "Insect control", "Bird control", "Prevention treatment"
      ]
    },
    { 
      name: "Window Cleaning", 
      order: 14, 
      question: "What window cleaning service do you need?",
      subCategories: [
        "Residential Window Cleaning", "Commercial Window Cleaning", "Gutter Cleaning"
      ]
    },
    { 
      name: "Bathroom Fitter", 
      order: 15, 
      question: "What bathroom fitting service do you need?",
      subCategories: [
        "Bathroom Installation", "Shower Installation", "Bath Installation", "Bathroom Renovation",
        "Wet Room Installation", "Bathroom Tiling", "Bathroom Design", "Sink Installation",
        "Full bathroom installation", "Toilet replacement"
      ]
    },
    { 
      name: "Kitchen Fitter", 
      order: 16, 
      question: "What kitchen fitting service do you need?",
      subCategories: [
        "Kitchen Installation", "Kitchen Renovation", "Worktop Installation", "Kitchen Design",
        "Appliance Installation", "Kitchen Tiling", "Splashback Installation", "Kitchen Cabinet Installation",
        "Full kitchen installation", "Worktop fitting", "Cabinet installation", "Appliance fitting"
      ]
    },
  ],
  "business-services": [
    { 
      name: "IT Support", 
      order: 1, 
      question: "What IT support do you need?",
      subCategories: [
        "Computer repair", "Network setup", "Software installation", "IT consulting",
        "Network troubleshooting", "Hardware setup", "Remote support"
      ]
    },
    { 
      name: "Graphic Design", 
      order: 2, 
      question: "What graphic design service do you need?",
      subCategories: [
        "Logo design", "Branding", "Print design", "UI/UX design"
      ]
    },
    { 
      name: "Web Development", 
      order: 3, 
      question: "What web development service do you need?",
      subCategories: [
        "Website design", "E-commerce development", "WordPress development", "Custom web apps"
      ]
    },
    { 
      name: "Writing & Translation", 
      order: 4, 
      question: "What writing or translation service do you need?",
      subCategories: [
        "Content writing", "Copywriting", "Translation services", "Proofreading"
      ]
    },
    { 
      name: "Legal Services", 
      order: 5, 
      question: "What legal service do you need?",
      subCategories: [
        "Legal advice", "Contract review", "Business law", "Employment law",
        "Family law", "Property law"
      ]
    },
    { 
      name: "Accounting", 
      order: 6, 
      question: "What accounting service do you need?",
      subCategories: [
        "Bookkeeping", "Tax preparation", "Financial planning", "Auditing",
        "Tax Returns", "Payroll Services", "VAT Returns", "Financial Statements",
        "Company Accounts", "Self Assessment", "Audit Services"
      ]
    },
    { 
      name: "Marketing", 
      order: 7, 
      question: "What marketing service do you need?",
      subCategories: [
        "Digital marketing", "SEO", "Social media marketing", "Content marketing", "PPC advertising"
      ]
    },
    { 
      name: "Consulting", 
      order: 8, 
      question: "What consulting service do you need?",
      subCategories: [
        "Strategy consulting", "Management consulting", "Financial consulting", "HR consulting"
      ]
    },
    { 
      name: "Finance", 
      order: 9, 
      question: "What finance service do you need?",
      subCategories: [
        "Financial planning", "Investment advice", "Loan consulting", "Insurance services",
        "Retirement Planning", "Investment Advice", "Pension Planning", "Mortgage Advice",
        "Insurance Planning", "Wealth Management", "Estate Planning", "Tax Planning"
      ]
    },
    { 
      name: "HR Services", 
      order: 10, 
      question: "What HR service do you need?",
      subCategories: [
        "Recruitment", "HR consulting", "Payroll services", "Training & development"
      ]
    },
    { 
      name: "Business Setup", 
      order: 11, 
      question: "What business setup service do you need?",
      subCategories: [
        "Company registration", "Business planning", "Licensing", "Compliance"
      ]
    },
    { 
      name: "Virtual Assistant", 
      order: 12, 
      question: "What virtual assistant service do you need?",
      subCategories: [
        "Administrative support", "Data entry", "Customer service", "Email management"
      ]
    },
  ],
  "cleaning-services": [
    { 
      name: "Domestic Cleaning", 
      order: 1, 
      question: "What domestic cleaning service do you need?",
      subCategories: [
        "Regular cleaning", "Deep cleaning", "One-off cleaning", "Weekly cleaning",
        "Bi-weekly cleaning", "Monthly cleaning"
      ]
    },
    { 
      name: "Deep Cleaning", 
      order: 2, 
      question: "What deep cleaning service do you need?",
      subCategories: [
        "Spring cleaning", "Move-in cleaning", "Move-out cleaning", "Post-renovation cleaning",
        "Deep kitchen cleaning", "Deep bathroom cleaning"
      ]
    },
    { 
      name: "Commercial Cleaning", 
      order: 3, 
      question: "What commercial cleaning service do you need?",
      subCategories: [
        "Office cleaning", "Retail cleaning", "Warehouse cleaning", "Industrial cleaning",
        "Medical facility cleaning", "School cleaning"
      ]
    },
    { 
      name: "Carpet Cleaning", 
      order: 4, 
      question: "What carpet cleaning service do you need?",
      subCategories: [
        "Steam cleaning", "Dry cleaning", "Stain removal", "Odor removal",
        "Upholstery cleaning", "Rug cleaning"
      ]
    },
    { 
      name: "End of Tenancy Cleaning", 
      order: 5, 
      question: "What end of tenancy cleaning service do you need?",
      subCategories: [
        "Full property cleaning", "Kitchen deep clean", "Bathroom deep clean", "Carpet cleaning",
        "Window cleaning", "Oven cleaning", "Inventory cleaning"
      ]
    },
    { 
      name: "Office Cleaning", 
      order: 6, 
      question: "What office cleaning service do you need?",
      subCategories: [
        "Daily office cleaning", "Weekly office cleaning", "Desk cleaning", "Bathroom cleaning",
        "Kitchen cleaning", "Window cleaning", "Floor maintenance"
      ]
    },
    { 
      name: "Window Cleaning", 
      order: 7, 
      question: "What window cleaning service do you need?",
      subCategories: [
        "Residential window cleaning", "Commercial window cleaning", "High-rise window cleaning",
        "Interior window cleaning", "Exterior window cleaning", "Gutter cleaning"
      ]
    },
    { 
      name: "Oven Cleaning", 
      order: 8, 
      question: "What oven cleaning service do you need?",
      subCategories: [
        "Oven deep clean", "Hob cleaning", "Extractor fan cleaning", "Microwave cleaning",
        "Range cooker cleaning", "Commercial oven cleaning"
      ]
    },
  ],
  "professional-services": [
    { 
      name: "Consultancy", 
      order: 1, 
      question: "What consultancy service do you need?",
      subCategories: [
        "Business consultancy", "Management consultancy", "Strategy consultancy", "Operations consultancy",
        "Financial consultancy", "HR consultancy"
      ]
    },
    { 
      name: "Project Management", 
      order: 2, 
      question: "What project management service do you need?",
      subCategories: [
        "Project planning", "Project coordination", "Risk management", "Quality assurance",
        "Agile project management", "Waterfall project management"
      ]
    },
    { 
      name: "Business Analysis", 
      order: 3, 
      question: "What business analysis service do you need?",
      subCategories: [
        "Requirements analysis", "Process improvement", "Data analysis", "Business process mapping",
        "Gap analysis", "Feasibility studies"
      ]
    },
    { 
      name: "Training & Development", 
      order: 4, 
      question: "What training and development service do you need?",
      subCategories: [
        "Employee training", "Leadership development", "Skills training", "Compliance training",
        "Soft skills training", "Technical training"
      ]
    },
    { 
      name: "Administrative Support", 
      order: 5, 
      question: "What administrative support do you need?",
      subCategories: [
        "Data entry", "Document management", "Scheduling", "Email management",
        "Customer service", "Reception services"
      ]
    },
    { 
      name: "Translation Services", 
      order: 6, 
      question: "What translation service do you need?",
      subCategories: [
        "Document translation", "Website translation", "Legal translation", "Medical translation",
        "Technical translation", "Certified translation"
      ]
    },
  ],
  "education-tutoring": [
    { 
      name: "Math Tutoring", 
      order: 1, 
      question: "What math tutoring service do you need?",
      subCategories: [
        "Primary maths", "GCSE maths", "A-Level maths", "Adult numeracy",
        "University maths", "Math exam preparation"
      ]
    },
    { 
      name: "English Tutoring", 
      order: 2, 
      question: "What English tutoring service do you need?",
      subCategories: [
        "Primary English", "GCSE English", "IELTS preparation", "Creative writing",
        "A-Level English", "English as a second language"
      ]
    },
    { 
      name: "Music Lessons", 
      order: 3, 
      question: "What music lesson do you need?",
      subCategories: [
        "Piano lessons", "Guitar lessons", "Vocal training", "Music theory",
        "Violin lessons", "Drums lessons", "Online music lessons"
      ]
    },
    { 
      name: "Language Tutoring", 
      order: 4, 
      question: "What language tutoring service do you need?",
      subCategories: [
        "Spanish lessons", "French lessons", "Mandarin lessons", "German lessons",
        "Italian lessons", "Japanese lessons", "Conversational practice"
      ]
    },
    { 
      name: "Exam Preparation", 
      order: 5, 
      question: "What exam preparation service do you need?",
      subCategories: [
        "GCSE preparation", "A-Level preparation", "University entrance", "Professional exams",
        "SAT preparation", "IELTS preparation", "Driving theory"
      ]
    },
    { 
      name: "Online Courses", 
      order: 6, 
      question: "What online course do you need?",
      subCategories: [
        "Professional development", "Skill-based courses", "Certification courses", "Language courses",
        "IT courses", "Business courses"
      ]
    },
    { 
      name: "Skill Training", 
      order: 7, 
      question: "What skill training do you need?",
      subCategories: [
        "IT skills", "Business skills", "Creative skills", "Technical skills",
        "Soft skills", "Vocational training"
      ]
    },
    { 
      name: "Driving Lessons", 
      order: 8, 
      question: "What driving lesson service do you need?",
      subCategories: [
        "Beginner lessons", "Refresher lessons", "Intensive courses", "Motorway lessons",
        "Automatic lessons", "Manual lessons", "Theory test preparation"
      ]
    },
    { 
      name: "Career Coaching", 
      order: 9, 
      question: "What career coaching service do you need?",
      subCategories: [
        "Career guidance", "CV writing", "Interview preparation", "Job search support",
        "Career transition", "Professional development planning"
      ]
    },
  ],
  "personal-services": [
    { 
      name: "Personal Training", 
      order: 1, 
      question: "What personal training service do you need?",
      subCategories: [
        "Weight loss training", "Muscle building", "Home training", "Online coaching",
        "Group training", "Sports-specific training", "Rehabilitation training"
      ]
    },
    { 
      name: "Life Coaching", 
      order: 2, 
      question: "What life coaching service do you need?",
      subCategories: [
        "Career coaching", "Relationship coaching", "Personal development", "Goal setting",
        "Confidence building", "Life transition coaching"
      ]
    },
    { 
      name: "Massage Therapy", 
      order: 3, 
      question: "What massage therapy service do you need?",
      subCategories: [
        "Deep tissue massage", "Sports massage", "Relaxation massage", "Thai massage",
        "Swedish massage", "Hot stone massage", "Aromatherapy massage", "Mobile massage"
      ]
    },
    { 
      name: "Professional Organizing", 
      order: 4, 
      question: "What organizing service do you need?",
      subCategories: [
        "Home organization", "Office organization", "Decluttering", "Storage solutions",
        "Wardrobe organization", "Digital organization"
      ]
    },
    { 
      name: "Photography", 
      order: 5, 
      question: "What photography service do you need?",
      subCategories: [
        "Portrait photography", "Event photography", "Product photography", "Real estate photography",
        "Wedding photography", "Family photography", "Corporate photography"
      ]
    },
    { 
      name: "Event Planning", 
      order: 6, 
      question: "What event planning service do you need?",
      subCategories: [
        "Wedding planning", "Corporate events", "Birthday parties", "Anniversary celebrations",
        "Conference planning", "Party planning"
      ]
    },
    { 
      name: "Catering", 
      order: 7, 
      question: "What catering service do you need?",
      subCategories: [
        "Event catering", "Corporate catering", "Private party catering", "Wedding catering",
        "Buffet catering", "Canapé service", "BBQ catering"
      ]
    },
  ],
  "repair-maintenance": [
    { 
      name: "Handyman Services", 
      order: 1, 
      question: "What handyman service do you need?",
      subCategories: [
        "General repairs", "Furniture assembly", "Picture hanging", "Minor installations",
        "TV mounting", "Odd jobs", "Minor plumbing", "Minor electrical"
      ]
    },
    { 
      name: "Appliance Repair", 
      order: 2, 
      question: "What appliance repair service do you need?",
      subCategories: [
        "Washing machine repair", "Refrigerator repair", "Oven repair", "Dishwasher repair",
        "Microwave repair", "Dryer repair", "Cooker repair"
      ]
    },
    { 
      name: "HVAC Repair", 
      order: 3, 
      question: "What HVAC repair service do you need?",
      subCategories: [
        "Air conditioning repair", "Heating repair", "Boiler servicing", "Ventilation repair",
        "Radiator repair", "Thermostat repair", "Gas safety checks"
      ]
    },
    { 
      name: "Locksmith Services", 
      order: 4, 
      question: "What locksmith service do you need?",
      subCategories: [
        "Lock replacement", "Emergency lockout", "Key cutting", "Security upgrades",
        "Lock repair", "UPVC lock specialist", "Safe opening"
      ]
    },
    { 
      name: "Furniture Repair", 
      order: 5, 
      question: "What furniture repair service do you need?",
      subCategories: [
        "Upholstery repair", "Wood furniture repair", "Antique restoration", "Furniture refinishing",
        "Chair repair", "Table repair", "Cabinet repair"
      ]
    },
    { 
      name: "Electronics Repair", 
      order: 6, 
      question: "What electronics repair service do you need?",
      subCategories: [
        "TV repair", "Phone repair", "Tablet repair", "Laptop repair",
        "Game console repair", "Audio equipment repair"
      ]
    },
  ],
  "technology-services": [
    { 
      name: "Computer Repair", 
      order: 1, 
      question: "What computer repair service do you need?",
      subCategories: [
        "Laptop repair", "Desktop repair", "Virus removal", "Data recovery",
        "Hardware upgrade", "Software installation", "Screen repair"
      ]
    },
    { 
      name: "Web Development", 
      order: 2, 
      question: "What web development service do you need?",
      subCategories: [
        "Website design", "E-commerce development", "WordPress development", "Custom web apps",
        "Website maintenance", "SEO optimization"
      ]
    },
    { 
      name: "IT Support", 
      order: 3, 
      question: "What IT support service do you need?",
      subCategories: [
        "Network troubleshooting", "Software installation", "Hardware setup", "Remote support",
        "Network setup", "IT consulting", "Cloud services"
      ]
    },
    { 
      name: "App Development", 
      order: 4, 
      question: "What app development service do you need?",
      subCategories: [
        "iOS development", "Android development", "Cross-platform apps", "App maintenance",
        "App design", "App testing", "App store optimization"
      ]
    },
    { 
      name: "Data Recovery", 
      order: 5, 
      question: "What data recovery service do you need?",
      subCategories: [
        "Hard drive recovery", "SSD recovery", "RAID recovery", "Cloud data recovery",
        "Phone data recovery", "Deleted file recovery"
      ]
    },
    { 
      name: "Network Setup", 
      order: 6, 
      question: "What network setup service do you need?",
      subCategories: [
        "Home network setup", "Business network setup", "WiFi installation", "Network security",
        "Router configuration", "Network troubleshooting"
      ]
    },
  ],
  "fashion-beauty": [
    { 
      name: "Hair Styling", 
      order: 1, 
      question: "What hair styling service do you need?",
      subCategories: [
        "Haircuts", "Hair coloring", "Hair extensions", "Styling for events",
        "Haircut & Styling", "Highlights", "Balayage", "Bridal Hair",
        "Keratin Treatment", "Mobile Hairdresser"
      ]
    },
    { 
      name: "Makeup Services", 
      order: 2, 
      question: "What makeup service do you need?",
      subCategories: [
        "Bridal makeup", "Party makeup", "Makeup lessons", "Special effects makeup",
        "Bridal Makeup", "Special Occasion Makeup", "Airbrush Makeup", "Prom Makeup",
        "Editorial Makeup", "Mobile Makeup Artist"
      ]
    },
    { 
      name: "Nail Services", 
      order: 3, 
      question: "What nail service do you need?",
      subCategories: [
        "Manicure", "Pedicure", "Gel nails", "Nail art",
        "Acrylic Nails", "Nail Extensions", "Mobile Nail Technician", "Shellac Nails"
      ]
    },
    { 
      name: "Spa Treatments", 
      order: 4, 
      question: "What spa treatment do you need?",
      subCategories: [
        "Facial treatments", "Body treatments", "Massage therapy", "Wellness packages",
        "Facials", "Waxing", "Aromatherapy"
      ]
    },
    { 
      name: "Aesthetics", 
      order: 5, 
      question: "What aesthetics service do you need?",
      subCategories: [
        "Botox", "Dermal fillers", "Chemical peels", "Microdermabrasion",
        "Laser treatments", "Skin rejuvenation", "Anti-aging treatments"
      ]
    },
    { 
      name: "Beauty Therapy", 
      order: 6, 
      question: "What beauty therapy service do you need?",
      subCategories: [
        "Facial treatments", "Body treatments", "Waxing", "Threading",
        "Eyelash extensions", "Eyebrow shaping", "Tinting"
      ]
    },
    { 
      name: "Personal Styling", 
      order: 7, 
      question: "What personal styling service do you need?",
      subCategories: [
        "Wardrobe Styling", "Personal Shopping", "Color Analysis", "Style Consultation",
        "Capsule Wardrobe", "Outfit Planning", "Closet Organization", "Fashion Advice"
      ]
    },
    { 
      name: "Fashion Consulting", 
      order: 8, 
      question: "What fashion consulting service do you need?",
      subCategories: [
        "Style advice", "Wardrobe audit", "Shopping assistance", "Image consulting",
        "Personal shopping", "Fashion styling"
      ]
    },
    { 
      name: "Wardrobe Services", 
      order: 9, 
      question: "What wardrobe service do you need?",
      subCategories: [
        "Wardrobe organization", "Closet design", "Clothing alterations", "Wardrobe styling",
        "Seasonal wardrobe updates", "Capsule wardrobe creation"
      ]
    },
  ],
  "health-wellbeing": [
    { 
      name: "Nutrition Counseling", 
      order: 1, 
      question: "What nutrition counseling service do you need?",
      subCategories: [
        "Weight management", "Sports nutrition", "Meal planning", "Dietary advice",
        "Nutritional Therapy", "Diabetes Nutrition", "Gut Health", "Food Allergy Consultation",
        "Diet planning", "Meal prep advice"
      ]
    },
    { 
      name: "Physiotherapy", 
      order: 2, 
      question: "What physiotherapy service do you need?",
      subCategories: [
        "Sports injury rehabilitation", "Post-surgery recovery", "Chronic pain management", "Mobility improvement",
        "Sports Physiotherapy", "Back Pain Treatment", "Neck Pain Treatment", "Post-Surgery Rehab",
        "Injury Rehabilitation", "Massage Therapy", "Posture Correction", "Home Physiotherapy",
        "Sports injuries", "Mobility improvement"
      ]
    },
    { 
      name: "Yoga & Pilates", 
      order: 3, 
      question: "What yoga or pilates service do you need?",
      subCategories: [
        "Yoga classes", "Pilates classes", "Private sessions", "Online classes",
        "Hatha Yoga", "Vinyasa Yoga", "Hot Yoga", "Yin Yoga",
        "Mat Pilates", "Reformer Pilates", "Pregnancy Yoga", "Private Sessions",
        "Beginner yoga", "Advanced yoga"
      ]
    },
    { 
      name: "Mental Health Support", 
      order: 4, 
      question: "What mental health support do you need?",
      subCategories: [
        "Counseling", "Therapy sessions", "Stress management", "Mindfulness training",
        "Counselling", "CBT Therapy", "Anxiety Support", "Depression Support",
        "Relationship Therapy", "Grief Counselling", "Mindfulness Coaching",
        "CBT therapy", "Anxiety support"
      ]
    },
    { 
      name: "Holistic Therapy", 
      order: 5, 
      question: "What holistic therapy service do you need?",
      subCategories: [
        "Reiki", "Acupuncture", "Reflexology", "Aromatherapy",
        "Crystal healing", "Energy healing", "Meditation therapy"
      ]
    },
    { 
      name: "Sports Therapy", 
      order: 6, 
      question: "What sports therapy service do you need?",
      subCategories: [
        "Sports massage", "Injury prevention", "Performance enhancement", "Recovery therapy",
        "Athletic training", "Sports rehabilitation"
      ]
    },
  ],
  "legal-financial": [
    { 
      name: "Legal Advice", 
      order: 1, 
      question: "What legal advice do you need?",
      subCategories: [
        "Business law", "Employment law", "Family law", "Property law",
        "Family Law", "Contract Law", "Immigration Law", "Wills & Probate",
        "Tenant Law", "Business Law"
      ]
    },
    { 
      name: "Accounting Services", 
      order: 2, 
      question: "What accounting service do you need?",
      subCategories: [
        "Bookkeeping", "Tax preparation", "Financial planning", "Auditing",
        "Tax Returns", "Payroll Services", "VAT Returns", "Financial Statements",
        "Company Accounts", "Self Assessment", "Audit Services"
      ]
    },
    { 
      name: "Tax Services", 
      order: 3, 
      question: "What tax service do you need?",
      subCategories: [
        "Personal tax returns", "Business tax returns", "Tax planning", "Tax disputes",
        "Personal tax", "Business tax", "VAT returns", "Tax Planning"
      ]
    },
    { 
      name: "Financial Planning", 
      order: 4, 
      question: "What financial planning service do you need?",
      subCategories: [
        "Retirement planning", "Investment advice", "Estate planning", "Insurance planning",
        "Retirement Planning", "Investment Advice", "Pension Planning", "Mortgage Advice",
        "Insurance Planning", "Wealth Management", "Estate Planning", "Tax Planning"
      ]
    },
    { 
      name: "Immigration Services", 
      order: 5, 
      question: "What immigration service do you need?",
      subCategories: [
        "Visa applications", "Citizenship applications", "Immigration advice", "Document preparation",
        "Work permits", "Family visas", "Student visas"
      ]
    },
    { 
      name: "Estate Planning", 
      order: 6, 
      question: "What estate planning service do you need?",
      subCategories: [
        "Will writing", "Probate services", "Trust creation", "Inheritance planning",
        "Estate administration", "Power of attorney"
      ]
    },
  ],
  "wedding-events": [
    { 
      name: "Wedding Planning", 
      order: 1, 
      question: "What wedding planning service do you need?",
      subCategories: [
        "Full wedding planning", "Day-of coordination", "Venue selection", "Vendor management",
        "Full Wedding Planning", "Day Coordination", "Venue Selection", "Vendor Coordination",
        "Budget Management", "Wedding Styling", "Destination Wedding", "Elopement Planning"
      ]
    },
    { 
      name: "Event Photography", 
      order: 2, 
      question: "What event photography service do you need?",
      subCategories: [
        "Wedding photography", "Corporate events", "Birthday parties", "Anniversary celebrations",
        "Wedding Photography", "Corporate Photography", "Party Photography", "Product Photography",
        "Portrait Photography", "Engagement Photography", "Event Coverage", "Photo Booth Rental"
      ]
    },
    { 
      name: "Event Videography", 
      order: 3, 
      question: "What event videography service do you need?",
      subCategories: [
        "Wedding videos", "Corporate videos", "Highlight reels", "Documentary style",
        "Event coverage", "Drone videography", "Live streaming"
      ]
    },
    { 
      name: "Catering Services", 
      order: 4, 
      question: "What catering service do you need?",
      subCategories: [
        "Wedding catering", "Corporate catering", "Private parties", "Food truck catering",
        "Wedding Catering", "Corporate Catering", "Buffet Catering", "BBQ Catering",
        "Canapé Service", "Cocktail Catering", "Dessert Table", "Food Truck Catering"
      ]
    },
    { 
      name: "DJ Services", 
      order: 5, 
      question: "What DJ service do you need?",
      subCategories: [
        "Wedding DJ", "Party DJ", "Corporate DJ", "Mobile disco",
        "Wedding DJ", "Party DJ", "Corporate DJ", "Mobile Disco",
        "Club DJ", "Karaoke DJ", "Festival DJ", "DJ Equipment Hire"
      ]
    },
    { 
      name: "Event Planning", 
      order: 6, 
      question: "What event planning service do you need?",
      subCategories: [
        "Wedding planning", "Corporate events", "Birthday parties", "Full event coordination",
        "Conference planning", "Exhibition planning"
      ]
    },
    { 
      name: "Event Decoration", 
      order: 7, 
      question: "What event decoration service do you need?",
      subCategories: [
        "Wedding Decoration", "Balloon Decoration", "Floral Decoration", "Table Decoration",
        "Backdrop Hire", "Lighting Decoration", "Party Decoration", "Themed Decoration"
      ]
    },
    { 
      name: "Wedding Venue", 
      order: 8, 
      question: "What wedding venue service do you need?",
      subCategories: [
        "Venue hire", "Venue decoration", "Venue coordination", "Venue styling"
      ]
    },
    { 
      name: "Wedding Catering", 
      order: 9, 
      question: "What wedding catering service do you need?",
      subCategories: [
        "Wedding breakfast", "Wedding reception catering", "Canapé service", "Wedding cake"
      ]
    },
    { 
      name: "Wedding Photography", 
      order: 10, 
      question: "What wedding photography service do you need?",
      subCategories: [
        "Full day coverage", "Ceremony only", "Reception only", "Engagement shoots",
        "Pre-wedding shoots", "Trash the dress"
      ]
    },
  ],
  "pet-services": [
    { 
      name: "Pet Grooming", 
      order: 1, 
      question: "What pet grooming service do you need?",
      subCategories: [
        "Dog grooming", "Cat grooming", "Nail trimming", "Ear cleaning",
        "Bathing", "Haircut", "Breed-specific grooming"
      ]
    },
    { 
      name: "Pet Sitting", 
      order: 2, 
      question: "What pet sitting service do you need?",
      subCategories: [
        "In-home pet sitting", "Overnight care", "Daily visits", "Holiday care",
        "Home visits", "Multiple pets", "Special needs care"
      ]
    },
    { 
      name: "Dog Walking", 
      order: 3, 
      question: "What dog walking service do you need?",
      subCategories: [
        "Regular walks", "Group walks", "Long walks", "Puppy walks",
        "Individual walks", "Senior dog care", "Reactive dog walks"
      ]
    },
    { 
      name: "Pet Training", 
      order: 4, 
      question: "What pet training service do you need?",
      subCategories: [
        "Basic obedience", "Puppy training", "Behavioral training", "Agility training",
        "Puppy training", "Obedience training", "Behavior correction", "Agility training"
      ]
    },
    { 
      name: "Veterinary Services", 
      order: 5, 
      question: "What veterinary service do you need?",
      subCategories: [
        "Health check-ups", "Vaccinations", "Microchipping", "Dental care",
        "Emergency care", "Surgery", "Behavioral consultations"
      ]
    },
    { 
      name: "Pet Boarding", 
      order: 6, 
      question: "What pet boarding service do you need?",
      subCategories: [
        "Dog boarding", "Cat boarding", "Small animal boarding", "Long-term boarding",
        "Holiday boarding", "Emergency boarding"
      ]
    },
  ],
  "automotive-services": [
    { 
      name: "Car Repair", 
      order: 1, 
      question: "What car repair service do you need?",
      subCategories: [
        "Engine repair", "Brake repair", "Transmission repair", "Suspension repair",
        "Electrical repair", "Exhaust repair", "Cooling system repair"
      ]
    },
    { 
      name: "Car Maintenance", 
      order: 2, 
      question: "What car maintenance service do you need?",
      subCategories: [
        "Oil change", "Tire replacement", "Battery replacement", "Regular servicing",
        "Tire rotation", "MOT preparation", "Brake servicing", "Fluid top-ups"
      ]
    },
    { 
      name: "Car Detailing", 
      order: 3, 
      question: "What car detailing service do you need?",
      subCategories: [
        "Full detailing", "Interior cleaning", "Exterior polishing", "Waxing",
        "Interior cleaning", "Exterior wash", "Paint correction", "Ceramic coating"
      ]
    },
    { 
      name: "MOT Testing", 
      order: 4, 
      question: "What MOT testing service do you need?",
      subCategories: [
        "MOT test", "Pre-MOT check", "MOT retest", "MOT certificate",
        "MOT preparation", "MOT repairs"
      ]
    },
    { 
      name: "Mobile Mechanic", 
      order: 5, 
      question: "What mobile mechanic service do you need?",
      subCategories: [
        "Home visits", "Emergency repairs", "Breakdown assistance", "Diagnostics",
        "On-site repairs", "Fleet maintenance"
      ]
    },
    { 
      name: "Tyre Fitting", 
      order: 6, 
      question: "What tyre fitting service do you need?",
      subCategories: [
        "Tyre replacement", "Tyre repair", "Wheel alignment", "Wheel balancing",
        "Tyre pressure check", "Seasonal tyre change"
      ]
    },
    { 
      name: "Auto Electrician", 
      order: 7, 
      question: "What auto electrician service do you need?",
      subCategories: [
        "Battery replacement", "Alternator repair", "Starter motor repair", "Wiring repairs",
        "ECU diagnostics", "Electrical fault finding"
      ]
    },
    { 
      name: "Bodywork & Paint", 
      order: 8, 
      question: "What bodywork and paint service do you need?",
      subCategories: [
        "Dent removal", "Scratch repair", "Full respray", "Panel replacement",
        "Rust repair", "Paint matching", "Bumper repair"
      ]
    },
  ],
  "moving-storage": [
    { 
      name: "Moving Services", 
      order: 1, 
      question: "What moving service do you need?",
      subCategories: [
        "Local moving", "Long distance moving", "International moving", "Office relocation",
        "House removals", "Office removals", "Single item moves", "International moves"
      ]
    },
    { 
      name: "Removals", 
      order: 2, 
      question: "What removal service do you need?",
      subCategories: [
        "House removals", "Flat removals", "Student removals", "Commercial removals",
        "Full house removals", "Partial removals", "Furniture removals"
      ]
    },
    { 
      name: "Man & Van", 
      order: 3, 
      question: "What man & van service do you need?",
      subCategories: [
        "Small moves", "Furniture delivery", "Appliance delivery", "Single item transport",
        "Same-day delivery", "Hourly van hire"
      ]
    },
    { 
      name: "Storage Solutions", 
      order: 4, 
      question: "What storage solution do you need?",
      subCategories: [
        "Self storage", "Container storage", "Warehouse storage", "Temporary storage",
        "Document storage", "Long-term storage", "Climate-controlled storage"
      ]
    },
    { 
      name: "Packing Services", 
      order: 5, 
      question: "What packing service do you need?",
      subCategories: [
        "Full packing service", "Fragile item packing", "Unpacking service", "Packing materials",
        "Professional packing", "Box packing", "Specialist packing"
      ]
    },
    { 
      name: "House Clearance", 
      order: 6, 
      question: "What house clearance service do you need?",
      subCategories: [
        "Full house clearance", "Partial clearance", "Estate clearance", "Garage clearance",
        "Loft clearance", "Waste removal", "Furniture removal"
      ]
    },
    { 
      name: "Office Relocation", 
      order: 7, 
      question: "What office relocation service do you need?",
      subCategories: [
        "Full office move", "IT equipment relocation", "Furniture relocation", "Document relocation",
        "Server relocation", "Office setup"
      ]
    },
    { 
      name: "International Removals", 
      order: 8, 
      question: "What international removal service do you need?",
      subCategories: [
        "European removals", "Worldwide removals", "Shipping services", "Customs clearance",
        "International packing", "Storage in transit"
      ]
    },
  ],
};

const seedSectorsAndCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    // console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Sector.deleteMany({});
    // await Category.deleteMany({});
    // await SubCategory.deleteMany({});
    // // console.log('✅ Cleared existing sectors, categories, and subcategories');

    // Create sectors
    const createdSectors = {};
    for (const sectorData of sectorsData) {
      const existingSector = await Sector.findOne({ slug: sectorData.slug });
      if (existingSector) {
        // console.log(`⚠️  Sector "${sectorData.name}" already exists, skipping...`);
        createdSectors[sectorData.slug] = existingSector;
      } else {
        const sector = await Sector.create(sectorData);
        createdSectors[sectorData.slug] = sector;
        // console.log(`✅ Created sector: ${sector.name}`);
      }
    }

    // Create categories and subcategories
    const createdCategories = {};
    let totalSubCategoriesCreated = 0;
    for (const [sectorSlug, categories] of Object.entries(categoriesData)) {
      const sector = createdSectors[sectorSlug];
      if (!sector) {
        // console.log(`⚠️  Sector "${sectorSlug}" not found, skipping categories...`);
        continue;
      }

      for (const categoryData of categories) {
        const { subCategories, ...categoryFields } = categoryData;
        let category;
        
        const existingCategory = await Category.findOne({
          sector: sector._id,
          name: categoryData.name,
        });
        
        if (existingCategory) {
          // console.log(`⚠️  Category "${categoryData.name}" already exists in sector "${sector.name}", using existing...`);
          category = existingCategory;
        } else {
          category = await Category.create({
            sector: sector._id,
            ...categoryFields,
          });
          // console.log(`✅ Created category: ${categoryData.name} in ${sector.name}`);
        }
        
        // Store category for subcategory creation
        const categoryKey = `${sectorSlug}-${categoryData.name}`;
        createdCategories[categoryKey] = category;
        
        // Create subcategories if they exist
        if (subCategories && Array.isArray(subCategories) && subCategories.length > 0) {
          // Remove duplicates from subCategories array
          const uniqueSubCategories = [...new Set(subCategories)];
          
          // Keep only 2-3 subcategories per category (reduce to ~1/10th of prior volume)
          const desiredCount =
            uniqueSubCategories.length >= MAX_SUBCATEGORIES_PER_CATEGORY
              ? MAX_SUBCATEGORIES_PER_CATEGORY
              : uniqueSubCategories.length >= MIN_SUBCATEGORIES_PER_CATEGORY
                ? uniqueSubCategories.length
                : uniqueSubCategories.length;

          const selectedSubCategories = uniqueSubCategories.slice(0, desiredCount);
          
          for (let i = 0; i < selectedSubCategories.length; i++) {
            if (totalSubCategoriesCreated >= MAX_TOTAL_SUBCATEGORIES) {
              // console.log(`🛑 Reached max total subcategories (${MAX_TOTAL_SUBCATEGORIES}). Stopping further subcategory seeding.`);
              // console.log('✅ Seeding completed!');
              process.exit(0);
            }

            const subCategoryName = selectedSubCategories[i];
            const existingSubCategory = await SubCategory.findOne({
              category: category._id,
              name: subCategoryName,
            });
            
            if (existingSubCategory) {
              // console.log(`  ⚠️  Subcategory "${subCategoryName}" already exists, skipping...`);
            } else {
              await SubCategory.create({
                category: category._id,
                name: subCategoryName,
                order: i + 1,
              });
              totalSubCategoriesCreated++;
              // console.log(`  ✅ Created subcategory: ${subCategoryName} in ${categoryData.name}`);
            }
          }
        }
      }
    }

    // console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    // console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly (ES module way)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('seedSectorsAndCategories.js');

if (isMainModule) {
  seedSectorsAndCategories();
}

export default seedSectorsAndCategories;
