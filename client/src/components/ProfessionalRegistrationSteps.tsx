import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  FolderTree, 
  Shield, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Sector", icon: Briefcase, description: "Choose your main sector" },
  { id: 2, title: "Category", icon: FolderTree, description: "Select your service category" },
  { id: 3, title: "Subcategories", icon: FolderTree, description: "Choose all services you offer" },
  { id: 4, title: "Insurance", icon: Shield, description: "Public liability insurance status" },
];

const SECTORS = [
  "Home & Garden",
  "Plumbing",
  "Electrical",
  "Heating & Cooling",
  "Building & Construction",
  "Painting & Decorating",
  "Carpentry & Joinery",
  "Roofing",
  "Flooring",
  "Landscaping",
  "Cleaning",
  "Other",
];

const CATEGORIES = [
  "Emergency Repairs",
  "Installation",
  "Maintenance",
  "Renovation",
  "Consultation",
  "Inspection",
  "Other",
];

const SUBCATEGORIES = [
  "Pipe Repair",
  "Drain Cleaning",
  "Boiler Installation",
  "Radiator Repair",
  "Wiring",
  "Fuse Box",
  "Lighting Installation",
  "Socket Installation",
  "Wall Painting",
  "Ceiling Painting",
  "Exterior Painting",
  "Wallpapering",
  "Kitchen Fitting",
  "Bathroom Fitting",
  "Flooring Installation",
  "Tiling",
  "Roof Repair",
  "Gutter Cleaning",
  "Chimney Repair",
  "Flat Roofing",
  "Garden Design",
  "Lawn Care",
  "Tree Surgery",
  "Fencing",
  "Window Cleaning",
  "Carpet Cleaning",
  "Deep Cleaning",
  "End of Tenancy",
];

export default function ProfessionalRegistrationSteps() {
  const navigate = useNavigate();
  const { userInfo, updateProfile, isLoggedIn } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [sector, setSector] = useState("");
  const [category, setCategory] = useState("");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [insurance, setInsurance] = useState<"yes" | "no">("no");
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not logged in or not professional
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (userInfo && userInfo.role !== "professional") {
      navigate("/account");
      return;
    }
    // If professional user already has sector, they've completed registration steps
    // Allow them to stay on this page to update their info if needed
  }, [isLoggedIn, userInfo, navigate]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1 && !sector.trim()) {
      newErrors.sector = "Please select a sector";
    }
    if (step === 2 && !category.trim()) {
      newErrors.category = "Please select a category";
    }
    if (step === 3 && subcategories.length === 0) {
      newErrors.subcategories = "Please select at least one subcategory";
    }
    if (step === 4 && !insurance) {
      newErrors.insurance = "Please select insurance status";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Save current step data
    if (currentStep < STEPS.length) {
      setIsSaving(true);
      try {
        const updateData: any = {
          firstName: userInfo?.firstName || "",
          lastName: userInfo?.lastName || "",
          email: userInfo?.email || "",
          phone: userInfo?.phone || "",
          postcode: userInfo?.postcode || "",
        };

        if (currentStep >= 1) updateData.sector = sector;
        if (currentStep >= 2) {
          const allServices = category ? [category, ...subcategories] : subcategories;
          updateData.services = allServices;
        }
        if (currentStep >= 4) updateData.hasPublicLiability = insurance;

        await updateProfile(updateData);
        setCurrentStep(currentStep + 1);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear error for previous step
      setErrors({});
    }
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSaving(true);
    try {
      const allServices = category ? [category, ...subcategories] : subcategories;
      
      await updateProfile({
        firstName: userInfo?.firstName || "",
        lastName: userInfo?.lastName || "",
        email: userInfo?.email || "",
        phone: userInfo?.phone || "",
        postcode: userInfo?.postcode || "",
        sector: sector,
        services: allServices,
        hasPublicLiability: insurance,
      });

      toast.success("Profile setup completed!");
      navigate("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete setup");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSubcategory = (subcat: string) => {
    setSubcategories(prev => 
      prev.includes(subcat) 
        ? prev.filter(s => s !== subcat)
        : [...prev, subcat]
    );
    if (errors.subcategories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.subcategories;
        return newErrors;
      });
    }
  };

  const CurrentStepIcon = STEPS[currentStep - 1]?.icon || Briefcase;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FFF5EB] via-white to-[#FFF5EB]">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>
      
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 mt-[50px] md:mt-0">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#2c353f] font-['Poppins',sans-serif] mb-2">
                  Complete Your Profile
                </h1>
                <p className="text-[#6b6b6b] font-['Poppins',sans-serif]">
                  Let's set up your professional profile step by step
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div 
                  className="h-full bg-[#FE8A0F] transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#FE8A0F] text-white"
                          : isActive
                          ? "bg-[#FE8A0F] text-white scale-110 shadow-lg shadow-[#FE8A0F]/50"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium font-['Poppins',sans-serif] ${
                          isActive ? "text-[#FE8A0F]" : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content Card */}
          <div className="bg-white rounded-3xl border-2 border-[#FE8A0F] shadow-[0_0_20px_rgba(254,138,15,0.2)] p-8 mb-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrentStepIcon className="w-8 h-8 text-[#FE8A0F]" />
              </div>
              <h2 className="text-2xl font-bold text-[#2c353f] font-['Poppins',sans-serif] mb-2">
                {STEPS[currentStep - 1]?.title}
              </h2>
              <p className="text-[#6b6b6b] font-['Poppins',sans-serif]">
                {STEPS[currentStep - 1]?.description}
              </p>
            </div>

            {/* Step 1: Sector */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Select Your Sector <span className="text-red-500">*</span>
                  </Label>
                  <Select value={sector} onValueChange={(value) => {
                    setSector(value);
                    if (errors.sector) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.sector;
                        return newErrors;
                      });
                    }
                  }}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl">
                      <SelectValue placeholder="Choose your main sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sector && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.sector}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Category */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Select Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={(value) => {
                    setCategory(value);
                    if (errors.category) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.category;
                        return newErrors;
                      });
                    }
                  }}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl">
                      <SelectValue placeholder="Choose your main service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Subcategories */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Select Subcategories <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Select all that apply)
                    </span>
                  </Label>
                  <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SUBCATEGORIES.map((subcat) => (
                        <label
                          key={subcat}
                          className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-100 hover:border-[#FE8A0F] hover:bg-[#FFF5EB] cursor-pointer transition-all"
                        >
                          <Checkbox
                            checked={subcategories.includes(subcat)}
                            onCheckedChange={() => toggleSubcategory(subcat)}
                            className="border-2 border-gray-300 data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F]"
                          />
                          <span className="text-sm text-[#2c353f] font-['Poppins',sans-serif]">
                            {subcat}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.subcategories && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.subcategories}
                    </p>
                  )}
                  {subcategories.length > 0 && (
                    <p className="mt-2 text-xs text-[#6b6b6b] font-['Poppins',sans-serif]">
                      {subcategories.length} subcategor{subcategories.length === 1 ? 'y' : 'ies'} selected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Insurance */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Public Liability Insurance <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#FE8A0F] cursor-pointer transition-all bg-white">
                      <input
                        type="radio"
                        name="insurance"
                        value="yes"
                        checked={insurance === "yes"}
                        onChange={(e) => {
                          setInsurance(e.target.value as "yes" | "no");
                          if (errors.insurance) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.insurance;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-5 h-5 text-[#FE8A0F] focus:ring-[#FE8A0F]"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[#2c353f] font-['Poppins',sans-serif]">
                          Yes, I have public liability insurance
                        </p>
                        <p className="text-xs text-[#6b6b6b] font-['Poppins',sans-serif] mt-1">
                          You have valid public liability insurance coverage
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#FE8A0F] cursor-pointer transition-all bg-white">
                      <input
                        type="radio"
                        name="insurance"
                        value="no"
                        checked={insurance === "no"}
                        onChange={(e) => {
                          setInsurance(e.target.value as "yes" | "no");
                          if (errors.insurance) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.insurance;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-5 h-5 text-[#FE8A0F] focus:ring-[#FE8A0F]"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[#2c353f] font-['Poppins',sans-serif]">
                          No, I don't have insurance yet
                        </p>
                        <p className="text-xs text-[#6b6b6b] font-['Poppins',sans-serif] mt-1">
                          You can add this information later
                        </p>
                      </div>
                    </label>
                  </div>
                  {errors.insurance && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.insurance}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
              className="flex items-center gap-2 h-12 px-6 border-2 border-gray-200 text-[#2c353f] rounded-xl font-['Poppins',sans-serif] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2 h-12 px-8 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSaving}
                className="flex items-center gap-2 h-12 px-8 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

