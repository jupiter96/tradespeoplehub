import { useState } from "react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import BenefitsAutoScroll from "./BenefitsAutoScroll";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Upload,
  X,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  FileText,
  DollarSign,
  Flame,
  Clock,
  Calendar as CalendarIcon,
  ChevronDown
} from "lucide-react";
import { cn } from "./ui/utils";
import { useAccount } from "./AccountContext";
import { useJobs } from "./JobsContext";
import { Checkbox } from "./ui/checkbox";
import { useNavigate } from "react-router-dom";
import FloatingToolsBackground from "./FloatingToolsBackground";
import { toast } from "sonner@2.0.3";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";

interface Step {
  id: number;
  title: string;
  description: string;
}

// Grouped steps for the new 3-stage stepper design
const stepGroups = [
  {
    id: 1,
    title: "Job Details",
    description: "Tell us about your job",
    icon: "file",
    steps: [1, 2, 3] // Category Selection, Headline, Description
  },
  {
    id: 2,
    title: "Location & Budget",
    description: "Where and how much",
    icon: "location",
    steps: [4, 5] // Postcode, Budget
  },
  {
    id: 3,
    title: "Account & Review",
    description: "Finish & post",
    icon: "user",
    steps: [] // Account if not logged in
  }
];

const steps: Step[] = [
  { id: 1, title: "Category", description: "Choose categories" },
  { id: 2, title: "Headline", description: "Job title" },
  { id: 3, title: "Description", description: "Add details" },
  { id: 4, title: "Location & Timing", description: "Where & when" },
  { id: 5, title: "Budget", description: "Set budget" },
];

// Main Sectors (기본 카테고리)
const sectors = [
  { value: "home-garden", label: "Home & Garden" },
  { value: "business", label: "Business Services" },
  { value: "personal", label: "Personal Services" },
  { value: "repair-maintenance", label: "Repair & Maintenance" },
  { value: "technology", label: "Technology Services" },
  { value: "education", label: "Education & Tutoring" },
  { value: "beauty-wellness", label: "Beauty & Wellness" },
  { value: "health-wellness", label: "Health & Wellness" },
  { value: "legal-financial", label: "Legal & Financial" },
  { value: "events", label: "Event Services" },
  { value: "pets", label: "Pet Services" },
  { value: "automotive", label: "Automotive" },
  { value: "moving-storage", label: "Moving & Storage" },
];

// Categories by sector (세부 카테고리 - 다중 선택 가능)
const categoriesBySector: { [key: string]: { value: string; label: string }[] } = {
  "home-garden": [
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical Work" },
    { value: "carpentry", label: "Carpentry" },
    { value: "painting", label: "Painting & Decorating" },
    { value: "gardening", label: "Gardening & Landscaping" },
    { value: "bathroom-fitting", label: "Bathroom Fitting" },
    { value: "kitchen-fitting", label: "Kitchen Fitting" },
    { value: "building", label: "Building & Construction" },
    { value: "tiling", label: "Tiling" },
    { value: "flooring", label: "Flooring" },
    { value: "roofing", label: "Roofing" },
    { value: "cleaning", label: "Home Cleaning" },
  ],
  "business": [
    { value: "consulting", label: "Business Consulting" },
    { value: "marketing", label: "Marketing & Advertising" },
    { value: "content-writing", label: "Content Writing" },
    { value: "virtual-assistant", label: "Virtual Assistant" },
    { value: "seo", label: "SEO Services" },
    { value: "web-development", label: "Web Development" },
    { value: "graphic-design", label: "Graphic Design" },
    { value: "bookkeeping", label: "Bookkeeping" },
    { value: "social-media", label: "Social Media Management" },
  ],
  "personal": [
    { value: "personal-training", label: "Personal Training" },
    { value: "life-coaching", label: "Life Coaching" },
    { value: "meal-prep", label: "Meal Preparation" },
    { value: "personal-shopping", label: "Personal Shopping" },
    { value: "organizing", label: "Professional Organizing" },
    { value: "cleaning", label: "Personal Cleaning Services" },
  ],
  "repair-maintenance": [
    { value: "handyman", label: "Handyman Services" },
    { value: "appliance-repair", label: "Appliance Repair" },
    { value: "hvac", label: "HVAC Repair" },
    { value: "locksmith", label: "Locksmith Services" },
    { value: "window-repair", label: "Window & Door Repair" },
    { value: "furniture-repair", label: "Furniture Repair" },
  ],
  "technology": [
    { value: "computer-repair", label: "Computer Repair" },
    { value: "web-development", label: "Web Development" },
    { value: "app-development", label: "App Development" },
    { value: "it-support", label: "IT Support" },
    { value: "network-setup", label: "Network Setup" },
    { value: "software-development", label: "Software Development" },
    { value: "cybersecurity", label: "Cybersecurity" },
  ],
  "education": [
    { value: "math-tutoring", label: "Math Tutoring" },
    { value: "english-tutoring", label: "English Tutoring" },
    { value: "science-tutoring", label: "Science Tutoring" },
    { value: "music-lessons", label: "Music Lessons" },
    { value: "language-tutoring", label: "Language Tutoring" },
    { value: "exam-prep", label: "Exam Preparation" },
    { value: "online-courses", label: "Online Courses" },
  ],
  "beauty-wellness": [
    { value: "hair-styling", label: "Hair Styling" },
    { value: "makeup", label: "Makeup Services" },
    { value: "nail-services", label: "Nail Services" },
    { value: "massage", label: "Massage Therapy" },
    { value: "spa-treatments", label: "Spa Treatments" },
    { value: "yoga", label: "Yoga & Pilates" },
  ],
  "health-wellness": [
    { value: "nutrition", label: "Nutrition Counseling" },
    { value: "therapy", label: "Therapy & Counseling" },
    { value: "physiotherapy", label: "Physiotherapy" },
    { value: "personal-training", label: "Personal Training" },
    { value: "meditation", label: "Meditation Coaching" },
  ],
  "legal-financial": [
    { value: "legal-advice", label: "Legal Advice" },
    { value: "accounting", label: "Accounting Services" },
    { value: "tax-services", label: "Tax Services" },
    { value: "financial-planning", label: "Financial Planning" },
    { value: "immigration", label: "Immigration Services" },
  ],
  "events": [
    { value: "photography", label: "Event Photography" },
    { value: "videography", label: "Event Videography" },
    { value: "catering", label: "Catering Services" },
    { value: "dj-services", label: "DJ Services" },
    { value: "event-planning", label: "Event Planning" },
    { value: "decoration", label: "Event Decoration" },
  ],
  "pets": [
    { value: "pet-grooming", label: "Pet Grooming" },
    { value: "pet-sitting", label: "Pet Sitting" },
    { value: "dog-walking", label: "Dog Walking" },
    { value: "pet-training", label: "Pet Training" },
    { value: "vet-services", label: "Veterinary Services" },
  ],
  "automotive": [
    { value: "car-repair", label: "Car Repair" },
    { value: "car-maintenance", label: "Car Maintenance" },
    { value: "car-detailing", label: "Car Detailing" },
    { value: "bodywork", label: "Bodywork & Paint" },
    { value: "towing", label: "Towing Services" },
  ],
  "moving-storage": [
    { value: "moving-services", label: "Moving Services" },
    { value: "packing", label: "Packing Services" },
    { value: "storage", label: "Storage Solutions" },
    { value: "delivery", label: "Delivery Services" },
    { value: "furniture-assembly", label: "Furniture Assembly" },
  ],
};

// Budget ranges
const budgetRanges = [
  { value: "under-500", label: "Under £500" },
  { value: "500-1000", label: "£500 - £1,000" },
  { value: "1000-2500", label: "£1,000 - £2,500" },
  { value: "2500-5000", label: "£2,500 - £5,000" },
  { value: "5000-10000", label: "£5,000 - £10,000" },
  { value: "10000-15000", label: "£10,000 - £15,000" },
  { value: "15000-20000", label: "£15,000 - £20,000" },
  { value: "over-20000", label: "Over £20,000" },
  { value: "custom-budget", label: "Custom Budget" },
];

export default function PostJobPage() {
  const { isLoggedIn, userInfo } = useAccount();
  const { addJob } = useJobs();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Category Selection (Sector + Multiple Categories)
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  
  // Step 2: Description & Images
  const [jobDescription, setJobDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  
  // Step 3: Headline
  const [jobTitle, setJobTitle] = useState("");
  
  // Step 4: Postcode & Timing
  const [postcode, setPostcode] = useState("SW1A 1AA");
  const [urgency, setUrgency] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  
  // Step 5: Budget
  const [selectedBudget, setSelectedBudget] = useState("");
  
  // Account Creation (if not logged in)
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [phone, setPhone] = useState("+44 7123 456789");
  const [email, setEmail] = useState("john.doe@gmail.com");
  const [password, setPassword] = useState("123456");
  const [confirmPassword, setConfirmPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const totalSteps = isLoggedIn ? steps.length : steps.length + 1;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // Require sector and at least 3 categories
        return selectedSector !== "" && selectedCategories.length >= 3;
      case 2:
        // Require job title
        return jobTitle.trim() !== "";
      case 3:
        // Require description
        return jobDescription.trim() !== "";
      case 4:
        // Require postcode and urgency
        return postcode.trim() !== "" && urgency !== "";
      case 5:
        // Require budget
        return selectedBudget !== "";
      case 6: // Account creation (if not logged in)
        return firstName.trim() !== "" && 
               lastName.trim() !== "" && 
               phone.trim() !== "" && 
               email.trim() !== "" && 
               password.trim() !== "" && 
               password === confirmPassword &&
               agreeTerms;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    if (!isLoggedIn) {
      // Handle account creation first
      console.log("Creating account and posting job...");
    }
    
    // Get budget amount from selected budget range
    const budgetMap: { [key: string]: number } = {
      "under-500": 400,
      "500-1000": 750,
      "1000-2500": 1750,
      "2500-5000": 3750,
      "5000-10000": 7500,
      "10000-15000": 12500,
      "15000-20000": 17500,
      "over-20000": 25000,
      "custom-budget": 1000,
    };

    // Convert urgency to timing
    const timingMap: { [key: string]: "urgent" | "flexible" | "specific" } = {
      "urgent": "urgent",
      "flexible": "flexible",
      "specific-date": "specific",
    };

    // Get sector label from sectors array
    const sectorLabel = sectors.find(s => s.value === selectedSector)?.label || selectedSector;
    
    // Get category labels
    const categoryLabels = selectedCategories
      .map(catValue => {
        const categories = categoriesBySector[selectedSector] || [];
        return categories.find(c => c.value === catValue)?.label || catValue;
      });

    // Create job object
    const newJob = {
      title: jobTitle,
      description: jobDescription,
      sector: sectorLabel,
      categories: categoryLabels,
      postcode: postcode,
      location: postcode, // In real app, would geocode this
      timing: timingMap[urgency] || "flexible",
      specificDate: urgency === "specific-date" ? preferredStartDate : undefined,
      budgetType: "fixed" as const,
      budgetAmount: budgetMap[selectedBudget] || 1000,
      status: "active" as const,
      clientId: userInfo?.id || "client-1",
    };

    // Add job to context and get the created job with ID
    const createdJob = addJob(newJob);
    
    toast.success("Job posted successfully! Professionals will start sending quotes soon.");
    // Redirect to job detail page with quotes tab
    navigate(`/job/${createdJob.id}?tab=quotes`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] relative">
      {/* Floating Tools Background Animation - page-wide background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <FloatingToolsBackground />
      </div>

      {/* Content - relative z-index to appear above background */}
      <div className="relative z-10">
        {/* Navigation */}
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 mt-[50px] md:mt-0">
          {/* Step Indicator - Modern 3-Group Design */}
          <div className="mb-6">
            <div className="bg-transparent rounded-3xl p-6 md:p-8">
              {/* Step Groups with Connected Progress Line */}
              <div className="relative">
                {/* Step Icons */}
                <div className="relative grid grid-cols-3 gap-4">
                  {/* Background Progress Line - positioned behind icons, connecting their centers */}
                  <div className="absolute top-8 left-1/6 right-1/6 h-1 -translate-y-1/2" style={{ left: 'calc(100% / 6)', right: 'calc(100% / 6)' }}>
                    {/* Full line background */}
                    <div className="h-1 bg-[#E5E7EB] rounded-full" />
                    
                    {/* Animated progress line */}
                    <div 
                      className="absolute top-0 left-0 h-1 bg-[#FE8A0F] rounded-full transition-all duration-500"
                      style={{ 
                        width: currentStep <= 3 ? '0%' : 
                               currentStep === 4 ? '50%' : 
                               currentStep === 5 ? '75%' : '100%' 
                      }}
                    />
                  </div>
                  {stepGroups.map((group, index) => {
                    const isCurrentGroup = group.steps.includes(currentStep) || 
                      (!isLoggedIn && currentStep === 6 && group.id === 3);
                    const isCompletedGroup = group.steps.length > 0 && group.steps.every(stepId => stepId < currentStep);
                    const isPastGroup = isCompletedGroup;
                    
                    return (
                      <div
                        key={group.id}
                        className={cn(
                          "flex flex-col items-center text-center transition-all duration-300 z-10",
                          isCurrentGroup && "scale-105"
                        )}
                      >
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 relative",
                          isCurrentGroup 
                            ? "bg-[#FE8A0F] shadow-[0_4px_20px_rgba(254,138,15,0.4)]" 
                            : isPastGroup
                            ? "bg-[#34D399]"
                            : "bg-[#E5E7EB]"
                        )}>
                          {group.icon === "file" ? (
                            <FileText className="w-8 h-8 text-white" />
                          ) : group.icon === "location" ? (
                            <MapPin className="w-8 h-8 text-white" />
                          ) : group.icon === "user" ? (
                            <User className="w-8 h-8 text-white" />
                          ) : (
                            <DollarSign className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[16px] font-medium text-[#FE8A0F] mb-1">
                          {group.title}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6B7280]">
                          {group.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Text */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#6B7280]">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#FE8A0F]">
                    {Math.round((currentStep / totalSteps) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-4 pb-8 -mt-4">
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 md:p-10 mb-8">
            {/* Step 1: Category Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    What service are you looking for?
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    First select a sector, then choose minimum 3 specific categories
                  </p>
                </div>

                {/* Step 1: Sector Selection (Single) + Categories (Multiple) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Level 1: Sector (단일 선택) */}
                  <div className="flex flex-col">
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                      Sector
                    </Label>
                    <Select 
                      value={selectedSector} 
                      onValueChange={(value) => {
                        setSelectedSector(value);
                        setSelectedCategories([]);
                      }}
                    >
                      <SelectTrigger className="w-full h-14 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]">
                        <SelectValue placeholder="Select sector..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.value} value={sector.value}>
                            {sector.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Level 2: Category Multi-Select with Tags */}
                  <div className="flex flex-col">
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                      Category
                    </Label>
                    <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button
                          disabled={!selectedSector}
                          className={cn(
                            "w-full min-h-[56px] border-2 rounded-xl px-3 py-2 font-['Poppins',sans-serif] text-[14px] text-left transition-all",
                            !selectedSector 
                              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" 
                              : "border-gray-200 hover:border-[#FE8A0F] cursor-pointer"
                          )}
                        >
                          <div className="flex flex-wrap gap-2 items-center">
                            {selectedCategories.length > 0 ? (
                              <>
                                {selectedCategories.map((categoryValue) => {
                                  const category = categoriesBySector[selectedSector]?.find(c => c.value === categoryValue);
                                  return (
                                    <div
                                      key={categoryValue}
                                      className="inline-flex items-center gap-1 bg-[#FE8A0F] text-white px-3 py-1 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategories(selectedCategories.filter(c => c !== categoryValue));
                                      }}
                                    >
                                      <span className="text-[13px]">{category?.label}</span>
                                      <X className="w-3 h-3 hover:text-red-200 transition-colors" />
                                    </div>
                                  );
                                })}
                                <ChevronDown className="w-4 h-4 ml-auto text-gray-400 flex-shrink-0" />
                              </>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[#6b6b6b]">
                                  {selectedSector ? "Select categories..." : "Select sector first"}
                                </span>
                                {selectedSector && <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </div>
                            )}
                          </div>
                        </button>
                      </PopoverTrigger>
                      {selectedSector && (
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Search categories..." 
                              className="font-['Poppins',sans-serif]"
                            />
                            <CommandList>
                              <CommandEmpty className="font-['Poppins',sans-serif] text-[13px] text-center py-4">
                                No category found.
                              </CommandEmpty>
                              <CommandGroup>
                                {categoriesBySector[selectedSector]?.map((category) => {
                                  const isSelected = selectedCategories.includes(category.value);
                                  return (
                                    <CommandItem
                                      key={category.value}
                                      onSelect={() => {
                                        if (isSelected) {
                                          setSelectedCategories(selectedCategories.filter(c => c !== category.value));
                                        } else {
                                          setSelectedCategories([...selectedCategories, category.value]);
                                        }
                                      }}
                                      className="font-['Poppins',sans-serif] cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>{category.label}</span>
                                        {isSelected && (
                                          <Check className="w-4 h-4 text-[#FE8A0F]" />
                                        )}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>
                </div>
                
                {/* Category Selection Status */}
                {selectedSector && (
                  <div className="mt-4">
                    <div className={cn(
                      "flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] px-4 py-3 rounded-lg",
                      selectedCategories.length >= 3 
                        ? "bg-green-50 text-green-700" 
                        : "bg-orange-50 text-orange-700"
                    )}>
                      {selectedCategories.length >= 3 ? (
                        <>
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {selectedCategories.length} categories selected. Ready to continue!
                          </span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Please select at least {3 - selectedCategories.length} more {3 - selectedCategories.length === 1 ? 'category' : 'categories'} to continue
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Headline */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Give your job a headline
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Write a short title that summarizes what you need done.
                  </p>
                </div>

                <div>
                  <Input
                    placeholder="e.g., Install new bathroom suite"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Description */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Describe your job
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Provide details about what you need done. Be as specific as possible.
                  </p>
                </div>

                <div>
                  <Textarea
                    placeholder="e.g., I need a plumber to fix a leaking pipe in my bathroom. The leak is coming from under the sink..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="w-full border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                    Add photos (Optional)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                        <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#FE8A0F] flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-50 hover:bg-[#FFF5EB]">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="font-['Poppins',sans-serif] text-[12px] text-gray-500">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Location & Timing */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Postcode Section */}
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Where do you need this done?
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                    Enter the postcode where the work needs to be done.
                  </p>
                  <Input
                    placeholder="e.g., SW1A 1AA"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                  />
                </div>

                {/* Timing Section */}
                <div className="border-t pt-6">
                  <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
                    When do you need this done? <span className="text-red-500">*</span>
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                    Select your preferred timeframe
                  </p>

                  <div className="space-y-3">
                    {/* Urgent Option */}
                    <div
                      className={cn(
                        "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        urgency === "urgent"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50 hover:bg-gray-50"
                      )}
                      onClick={() => setUrgency("urgent")}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        urgency === "urgent" ? "bg-[#FE8A0F]" : "bg-gray-100"
                      )}>
                        <Flame className={cn(
                          "w-5 h-5",
                          urgency === "urgent" ? "text-white" : "text-gray-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                          Urgent (Within 24 hours)
                        </p>
                      </div>
                      {urgency === "urgent" && (
                        <Check className="w-5 h-5 text-[#FE8A0F]" />
                      )}
                    </div>

                    {/* Soon Option */}
                    <div
                      className={cn(
                        "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        urgency === "soon"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50 hover:bg-gray-50"
                      )}
                      onClick={() => setUrgency("soon")}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        urgency === "soon" ? "bg-[#FE8A0F]" : "bg-gray-100"
                      )}>
                        <Clock className={cn(
                          "w-5 h-5",
                          urgency === "soon" ? "text-white" : "text-gray-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                          Soon (Within a week)
                        </p>
                      </div>
                      {urgency === "soon" && (
                        <Check className="w-5 h-5 text-[#FE8A0F]" />
                      )}
                    </div>

                    {/* Flexible Option */}
                    <div
                      className={cn(
                        "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        urgency === "flexible"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50 hover:bg-gray-50"
                      )}
                      onClick={() => setUrgency("flexible")}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        urgency === "flexible" ? "bg-[#FE8A0F]" : "bg-gray-100"
                      )}>
                        <CalendarIcon className={cn(
                          "w-5 h-5",
                          urgency === "flexible" ? "text-white" : "text-gray-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                          Flexible (Within a month)
                        </p>
                      </div>
                      {urgency === "flexible" && (
                        <Check className="w-5 h-5 text-[#FE8A0F]" />
                      )}
                    </div>
                  </div>

                  {/* Optional Preferred Start Date */}
                  <div className="mt-6">
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                      Preferred Start Date (Optional)
                    </Label>
                    <Input
                      type="date"
                      value={preferredStartDate}
                      onChange={(e) => setPreferredStartDate(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Budget */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    What's your estimated budget?
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Please let us know your estimated budget for this job. Don't worry, there's still opportunity to settle on a final price that suits you and your professional. Just give us a reasonable estimate and we'll go from there.
                  </p>
                </div>

                <RadioGroup value={selectedBudget} onValueChange={setSelectedBudget}>
                  <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                    {budgetRanges.map((budget) => (
                      <div
                        key={budget.value}
                        className={cn(
                          "flex items-center justify-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all",
                          selectedBudget === budget.value
                            ? "border-[#FE8A0F] bg-[#FFF5EB]"
                            : "border-gray-200 hover:border-[#FE8A0F]/50"
                        )}
                        onClick={() => setSelectedBudget(budget.value)}
                      >
                        <RadioGroupItem value={budget.value} id={budget.value} className="hidden md:flex" />
                        <Label
                          htmlFor={budget.value}
                          className="md:ml-3 font-['Poppins',sans-serif] text-[11px] md:text-[14px] cursor-pointer text-center leading-tight"
                        >
                          {budget.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 6: Account Creation (if not logged in) */}
            {!isLoggedIn && currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Create a new account
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Register to post your job and receive quotes
                  </p>
                </div>

                <div className="space-y-4">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        First name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        Last name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        Phone number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        Confirm password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F]"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    />
                    <Label
                      htmlFor="terms"
                      className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] cursor-pointer leading-relaxed"
                    >
                      I agree to the{" "}
                      <a href="#" className="text-[#3B82F6] hover:underline">
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-[#3B82F6] hover:underline">
                        Privacy and Cookie Policy
                      </a>
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
              className={cn(
                "h-12 px-6 rounded-full font-['Poppins',sans-serif] text-[14px] border-2 transition-all duration-300",
                currentStep === 1 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:border-[#FE8A0F] hover:bg-[#FFF5EB]"
              )}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={cn(
                  "h-12 px-8 rounded-full font-['Poppins',sans-serif] text-[14px] transition-all duration-300",
                  isStepValid()
                    ? "bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className={cn(
                  "h-12 px-8 rounded-full font-['Poppins',sans-serif] text-[14px] transition-all duration-300",
                  isStepValid()
                    ? "bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {isLoggedIn ? "Post Job" : "Save and Continue"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Already have an account (only show on account step if not logged in) */}
          {!isLoggedIn && currentStep === 6 && (
            <div className="text-center mt-6">
              <p className="font-['Poppins',sans-serif] text-[13px] text-gray-500">
                Already have an account?{" "}
                <a href="/login" className="text-[#FE8A0F] hover:underline">
                  Log in here
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Benefits Section - Moved to bottom */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Mobile: Auto-scrolling Slider */}
          <BenefitsAutoScroll />

          {/* Desktop: Original Layout */}
          <div className="hidden md:flex flex-row items-center justify-center gap-4 md:gap-8 py-6">
            {/* Free to post */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                <Check className="w-5 h-5 text-[#10B981]" strokeWidth={3} />
              </div>
              <div>
                <span className="font-['Poppins',sans-serif] text-[14px]">
                  <span className="text-[#FE8A0F] font-medium">Free</span>
                  <span className="text-[#6B7280]"> to post</span>
                </span>
              </div>
            </div>

            {/* Quotes in 24hrs */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#3B82F6]" strokeWidth={2} />
              </div>
              <div>
                <span className="font-['Poppins',sans-serif] text-[14px] text-[#6B7280]">
                  Quotes in <span className="text-[#FE8A0F] font-medium">24hrs</span>
                </span>
              </div>
            </div>

            {/* Verified pros only */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#FEF3E2] flex items-center justify-center">
                <Check className="w-5 h-5 text-[#FE8A0F]" strokeWidth={3} />
              </div>
              <div>
                <span className="font-['Poppins',sans-serif] text-[14px]">
                  <span className="text-[#FE8A0F] font-medium">Verified</span>
                  <span className="text-[#6B7280]"> pros only</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}