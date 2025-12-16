import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  FolderTree, 
  Shield, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Plus,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { PoundSterling, Calendar } from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import { toast } from "sonner";
import { useSectors, useCategories, useSubCategories } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory } from "../hooks/useSectorsAndCategories";

const STEPS = [
  { id: 1, title: "About Me", icon: User, description: "Tell us about yourself" },
  { id: 2, title: "Sector", icon: Briefcase, description: "Choose your main sector" },
  { id: 3, title: "Category", icon: FolderTree, description: "Select your service category" },
  { id: 4, title: "Subcategories", icon: FolderTree, description: "Choose all services you offer" },
  { id: 5, title: "Insurance", icon: Shield, description: "Public liability insurance status" },
];

// SECTORS will be loaded from API
// CATEGORIES and SUBCATEGORIES will be loaded dynamically based on selected sector

export default function ProfessionalRegistrationSteps() {
  const navigate = useNavigate();
  const { userInfo, updateProfile, isLoggedIn } = useAccount();
  const { sectors: sectorsData, loading: sectorsLoading } = useSectors();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sort sectors by order
  const sortedSectors = [...sectorsData].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Extract sector names for the select dropdown (sorted by order)
  const SECTORS = sortedSectors.map((s: Sector) => s.name);
  
  // Form data - declare state variables first
  const [aboutService, setAboutService] = useState<string>("");
  const [skipAboutMe, setSkipAboutMe] = useState<boolean>(false);
  const [hasTradeQualification, setHasTradeQualification] = useState<"yes" | "no">("no");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [sector, setSector] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]); // Store category IDs
  const [subcategories, setSubcategories] = useState<string[]>([]); // Store subcategory IDs
  const [insurance, setInsurance] = useState<"yes" | "no">("no");
  const [professionalIndemnityAmount, setProfessionalIndemnityAmount] = useState<string>("");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>("");
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Find selected sector object (after sector state is declared)
  const selectedSectorObj = sortedSectors.find((s: Sector) => s.name === sector);
  const selectedSectorId = selectedSectorObj?._id;
  
  // Load categories for selected sector
  const { categories: availableCategories, loading: categoriesLoading } = useCategories(
    selectedSectorId,
    undefined,
    true // includeSubCategories
  );
  
  // Sort categories by order
  const sortedCategories = [...availableCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Get all subcategories from selected categories (by ID)
  const allSubcategories: SubCategory[] = [];
  sortedCategories.forEach((cat: Category) => {
    if (categories.includes(cat._id) && cat.subCategories) {
      allSubcategories.push(...cat.subCategories);
    }
  });
  // Sort subcategories by order
  allSubcategories.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Initialize form data from userInfo if available
  useEffect(() => {
    if (userInfo?.aboutService) {
      setAboutService(userInfo.aboutService);
      setSkipAboutMe(false);
    } else {
      setSkipAboutMe(true);
    }
    if (userInfo?.hasTradeQualification) {
      setHasTradeQualification(userInfo.hasTradeQualification === true || userInfo.hasTradeQualification === "yes" ? "yes" : "no");
    }
    if (userInfo?.publicProfile?.qualifications) {
      // Convert string to array (split by newlines or keep as single item)
      const quals = typeof userInfo.publicProfile.qualifications === 'string' 
        ? userInfo.publicProfile.qualifications.split('\n').filter(q => q.trim())
        : Array.isArray(userInfo.publicProfile.qualifications)
        ? userInfo.publicProfile.qualifications
        : [];
      setQualifications(quals.length > 0 ? quals : [""]);
    } else if (hasTradeQualification === "yes") {
      // Initialize with one empty field if trade qualification is yes but no qualifications exist
      setQualifications([""]);
    } else {
      setQualifications([]);
    }
    if (userInfo?.sector) {
      setSector(userInfo.sector);
    }
    // Services will be loaded after categories are available
    // This is handled in a separate useEffect below
    if (userInfo?.hasPublicLiability !== undefined) {
      setInsurance(userInfo.hasPublicLiability === true || userInfo.hasPublicLiability === "yes" ? "yes" : "no");
    }
    if (userInfo?.professionalIndemnityAmount) {
      setProfessionalIndemnityAmount(userInfo.professionalIndemnityAmount.toString());
    }
    if (userInfo?.insuranceExpiryDate) {
      // Format date for input (YYYY-MM-DD)
      const date = new Date(userInfo.insuranceExpiryDate);
      setInsuranceExpiryDate(date.toISOString().split('T')[0]);
    }
  }, [userInfo]);

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
    
    if (step === 1) {
      if (!skipAboutMe && !aboutService.trim()) {
        newErrors.aboutService = "Please write about yourself or click 'Do this later'";
      }
    }
    if (step === 2 && !sector) {
      newErrors.sector = "Please select a sector";
    }
    if (step === 3 && categories.length === 0) {
      newErrors.categories = "Please select at least one category";
    }
    if (step === 4 && subcategories.length === 0) {
      newErrors.subcategories = "Please select at least one subcategory";
    }
    if (step === 5 && !insurance) {
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
          address: userInfo?.address || "",
          townCity: userInfo?.townCity || "",
          county: userInfo?.county || "",
          tradingName: userInfo?.tradingName || "",
          travelDistance: userInfo?.travelDistance || "",
        };

        // Update about service and qualifications
        if (currentStep >= 1) {
          if (!skipAboutMe && aboutService.trim()) {
            updateData.aboutService = aboutService.trim();
          }
          updateData.hasTradeQualification = hasTradeQualification;
          if (hasTradeQualification === "yes") {
            // Convert array to string (join with newlines)
            const qualificationsStr = qualifications
              .filter(q => q.trim())
              .join('\n');
            updateData.publicProfile = {
              qualifications: qualificationsStr || "",
            };
          }
        }
        // Always update sector if provided (during registration)
        if (currentStep >= 2 && sector) {
          updateData.sector = sector;
        }
        if (currentStep >= 3) {
          // Store category and subcategory IDs in services array
          const allServices = [...categories, ...subcategories];
          updateData.services = allServices;
        }
        if (currentStep >= 5) {
          updateData.hasPublicLiability = insurance;
          if (insurance === "yes") {
            // If blank, store as 0 (requested default)
            updateData.professionalIndemnityAmount = professionalIndemnityAmount
              ? parseFloat(professionalIndemnityAmount) || 0
              : 0;
            if (insuranceExpiryDate) {
              updateData.insuranceExpiryDate = new Date(insuranceExpiryDate);
            }
          } else {
            // Clear insurance details if no insurance
            updateData.professionalIndemnityAmount = null;
            updateData.insuranceExpiryDate = null;
          }
        }

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
      // Store category and subcategory IDs in services array
      const allServices = [...categories, ...subcategories];
      
      const updateData: any = {
        firstName: userInfo?.firstName || "",
        lastName: userInfo?.lastName || "",
        email: userInfo?.email || "",
        phone: userInfo?.phone || "",
        postcode: userInfo?.postcode || "",
        address: userInfo?.address || "",
        townCity: userInfo?.townCity || "",
        county: userInfo?.county || "",
        tradingName: userInfo?.tradingName || "",
        travelDistance: userInfo?.travelDistance || "",
        services: allServices, // Array of category and subcategory IDs
        hasPublicLiability: insurance,
      };

      // Update about service if not skipped
      if (!skipAboutMe && aboutService.trim()) {
        updateData.aboutService = aboutService.trim();
      }

      if (insurance === "yes") {
        // If blank, store as 0 (requested default)
        updateData.professionalIndemnityAmount = professionalIndemnityAmount
          ? parseFloat(professionalIndemnityAmount) || 0
          : 0;
        if (insuranceExpiryDate) {
          updateData.insuranceExpiryDate = new Date(insuranceExpiryDate);
        }
      } else {
        // Clear insurance details if no insurance
        updateData.professionalIndemnityAmount = null;
        updateData.insuranceExpiryDate = null;
      }

      // Always update sector if provided (during registration)
      if (sector) {
        updateData.sector = sector;
      }
      
      await updateProfile(updateData);

      toast.success("Profile setup completed!");
      navigate("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete setup");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectorChange = (selectedSector: string) => {
    setSector(selectedSector);
    // Clear categories and subcategories when sector changes
    setCategories([]);
    setSubcategories([]);
    if (errors.sector) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.sector;
        return newErrors;
      });
    }
  };
  
  // Load user's existing services when sector and categories are loaded (only once)
  const [hasLoadedUserServices, setHasLoadedUserServices] = useState(false);
  useEffect(() => {
    if (userInfo?.services && userInfo.services.length > 0 && sortedCategories.length > 0 && sector && !hasLoadedUserServices) {
      // Match user's services with loaded categories and subcategories
      // Support both ID-based (new) and name-based (legacy) storage
      const categoryIds = sortedCategories.map((cat: Category) => cat._id);
      const categoryNames = sortedCategories.map((cat: Category) => cat.name);
      const subcategoryIds = allSubcategories.map((sc: SubCategory) => sc._id);
      const subcategoryNames = allSubcategories.map((sc: SubCategory) => sc.name);
      
      // Try to match by ID first (new format)
      const userCategoryIds = userInfo.services.filter((s: string) => categoryIds.includes(s));
      const userSubcategoryIds = userInfo.services.filter((s: string) => subcategoryIds.includes(s));
      
      // If no IDs found, try matching by name (legacy support)
      const userCategoryNames = userInfo.services.filter((s: string) => categoryNames.includes(s));
      const userSubcategoryNames = userInfo.services.filter((s: string) => subcategoryNames.includes(s));
      
      // Convert names to IDs if found
      const categoryIdsFromNames = userCategoryNames.map((name: string) => {
        const cat = sortedCategories.find((c: Category) => c.name === name);
        return cat?._id;
      }).filter(Boolean) as string[];
      
      const subcategoryIdsFromNames = userSubcategoryNames.map((name: string) => {
        const subcat = allSubcategories.find((sc: SubCategory) => sc.name === name);
        return subcat?._id;
      }).filter(Boolean) as string[];
      
      const finalCategoryIds = userCategoryIds.length > 0 ? userCategoryIds : categoryIdsFromNames;
      const finalSubcategoryIds = userSubcategoryIds.length > 0 ? userSubcategoryIds : subcategoryIdsFromNames;
      
      if (finalCategoryIds.length > 0) {
        setCategories(finalCategoryIds);
      }
      if (finalSubcategoryIds.length > 0) {
        setSubcategories(finalSubcategoryIds);
      }
      setHasLoadedUserServices(true);
    }
  }, [userInfo?.services, availableCategories, allSubcategories, sector, hasLoadedUserServices]);
  
  // Reset hasLoadedUserServices when sector changes
  useEffect(() => {
    setHasLoadedUserServices(false);
  }, [sector]);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
    if (errors.categories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.categories;
        return newErrors;
      });
    }
  };

  const toggleSubcategory = (subcatId: string) => {
    setSubcategories(prev => 
      prev.includes(subcatId) 
        ? prev.filter(s => s !== subcatId)
        : [...prev, subcatId]
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

            {/* Step 1: About Me */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Tell us about yourself <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={aboutService}
                    onChange={(e) => {
                      setAboutService(e.target.value);
                      setSkipAboutMe(false);
                      if (errors.aboutService) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.aboutService;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Describe your experience, skills, and what makes your service special. Minimum 100 characters recommended."
                    className="min-h-[200px] border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-[#6b6b6b] font-['Poppins',sans-serif]">
                      {aboutService.length} characters {aboutService.length < 100 && !skipAboutMe && "(minimum 100 recommended)"}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        setSkipAboutMe(true);
                        setAboutService("");
                        if (errors.aboutService) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.aboutService;
                            return newErrors;
                          });
                        }
                        // Save current step data and move to next step
                        setIsSaving(true);
                        try {
                          const updateData: any = {
                            firstName: userInfo?.firstName || "",
                            lastName: userInfo?.lastName || "",
                            email: userInfo?.email || "",
                            phone: userInfo?.phone || "",
                            postcode: userInfo?.postcode || "",
                            address: userInfo?.address || "",
                            townCity: userInfo?.townCity || "",
                            county: userInfo?.county || "",
                            travelDistance: userInfo?.travelDistance || "",
                          };
                          // Don't save aboutService when skipping
                          await updateProfile(updateData);
                          setCurrentStep(2);
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to save");
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="text-xs h-8 px-4 border-gray-300 text-gray-600 hover:bg-gray-50 font-['Poppins',sans-serif]"
                    >
                      Do this later
                    </Button>
                  </div>
                  {errors.aboutService && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.aboutService}
                    </p>
                  )}
                  {skipAboutMe && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-xs text-yellow-800 font-['Poppins',sans-serif]">
                        You can add this information later in your profile settings.
                      </p>
                    </div>
                  )}
                </div>

                {/* Trade Qualification Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4 text-center">
                    Do you have any trade qualification or accreditation?
                  </h3>
                  <RadioGroup
                    value={hasTradeQualification}
                    onValueChange={(value) => {
                      setHasTradeQualification(value as "yes" | "no");
                      // Clear qualifications if switching to "no"
                      if (value === "no") {
                        setQualifications([]);
                      } else if (value === "yes" && qualifications.length === 0) {
                        // Initialize with one empty field if switching to "yes"
                        setQualifications([""]);
                      }
                    }}
                    className="flex items-center justify-center gap-8"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="trade-yes" className="border-2 border-gray-400 text-[#FE8A0F]" />
                      <Label htmlFor="trade-yes" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer">
                        YES
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="trade-no" className="border-2 border-gray-400 text-[#FE8A0F]" />
                      <Label htmlFor="trade-no" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer">
                        NO
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {/* Qualifications Input - Show when YES is selected */}
                  {hasTradeQualification === "yes" && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          Please list your qualifications and accreditations (with the relevant registration number) in this section. If you're a time served Professional, leave this section blank.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {qualifications.map((qual, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Input
                              value={qual}
                              onChange={(e) => {
                                const newQualifications = [...qualifications];
                                newQualifications[index] = e.target.value;
                                setQualifications(newQualifications);
                              }}
                              placeholder="e.g., NVQ Level 3 in Plumbing (Registration: PL123456)"
                              className="flex-1 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                            />
                            {qualifications.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newQualifications = qualifications.filter((_, i) => i !== index);
                                  setQualifications(newQualifications.length > 0 ? newQualifications : [""]);
                                }}
                                className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setQualifications([...qualifications, ""]);
                          }}
                          className="w-full border-2 border-dashed border-gray-300 hover:border-[#FE8A0F] text-gray-600 hover:text-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px] h-10"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Qualification
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Sector */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Select Your Sector <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Select one sector only)
                    </span>
                  </Label>
                  {sectorsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                    </div>
                  ) : userInfo?.sector ? (
                    // If sector already exists, show it as read-only
                    <div className="space-y-2">
                      <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {SECTORS.map((sec) => {
                            const isSelected = sec === userInfo.sector;
                            return (
                              <label
                                key={sec}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                                  isSelected 
                                    ? 'border-[#FE8A0F] bg-[#FFF5EB]' 
                                    : 'border-gray-100 opacity-50'
                                } cursor-not-allowed transition-all`}
                              >
                                <input
                                  type="radio"
                                  name="sector"
                                  value={sec}
                                  checked={isSelected}
                                  disabled
                                  className="w-4 h-4 text-[#FE8A0F] border-gray-300 focus:ring-[#FE8A0F] cursor-not-allowed"
                                />
                                <span className="text-sm text-[#2c353f] font-['Poppins',sans-serif]">
                                  {sec}
                                  {isSelected && <span className="text-xs text-[#FE8A0F] ml-2">(Selected during registration)</span>}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 font-['Poppins',sans-serif]">
                        Your sector was selected during registration and cannot be changed.
                      </p>
                    </div>
                  ) : (
                    // If no sector exists, allow single selection
                    <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SECTORS.map((sec) => (
                          <label
                            key={sec}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                              sector === sec
                                ? 'border-[#FE8A0F] bg-[#FFF5EB]'
                                : 'border-gray-100 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]'
                            } cursor-pointer transition-all`}
                          >
                            <input
                              type="radio"
                              name="sector"
                              value={sec}
                              checked={sector === sec}
                              onChange={() => handleSectorChange(sec)}
                              className="w-4 h-4 text-[#FE8A0F] border-gray-300 focus:ring-[#FE8A0F] cursor-pointer"
                            />
                            <span className="text-sm text-[#2c353f] font-['Poppins',sans-serif]">
                              {sec}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.sector && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.sector}
                    </p>
                  )}
                  {sector && (
                    <p className="mt-2 text-xs text-[#6b6b6b] font-['Poppins',sans-serif]">
                      {sector} selected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Category */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Select Categories <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Select all that apply)
                    </span>
                  </Label>
                  {!sector ? (
                    <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-gray-500 font-['Poppins',sans-serif]">
                        Please select a sector first
                      </p>
                    </div>
                  ) : categoriesLoading ? (
                    <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FE8A0F] mb-2" />
                      <p className="text-gray-500 font-['Poppins',sans-serif]">
                        Loading categories...
                      </p>
                    </div>
                  ) : sortedCategories.length === 0 ? (
                    <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-gray-500 font-['Poppins',sans-serif]">
                        No categories available for this sector
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sortedCategories.map((cat: Category) => (
                          <label
                            key={cat._id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                              categories.includes(cat._id)
                                ? 'border-[#FE8A0F] bg-[#FFF5EB]'
                                : 'border-gray-100 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]'
                            } cursor-pointer transition-all`}
                          >
                            <Checkbox
                              checked={categories.includes(cat._id)}
                              onCheckedChange={() => {
                                if (categories.includes(cat._id)) {
                                  setCategories(categories.filter(c => c !== cat._id));
                                  // Remove subcategories from this category when category is deselected
                                  if (cat.subCategories) {
                                    const subcatIds = cat.subCategories.map(sc => sc._id);
                                    setSubcategories(subcategories.filter(sc => !subcatIds.includes(sc)));
                                  }
                                } else {
                                  setCategories([...categories, cat._id]);
                                }
                              }}
                              className="border-2 border-gray-300 data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F]"
                            />
                            <span className="text-sm text-[#2c353f] font-['Poppins',sans-serif]">
                              {cat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.categories && (
                    <p className="mt-2 text-sm text-red-600 font-['Poppins',sans-serif]">
                      {errors.categories}
                    </p>
                  )}
                  {categories.length > 0 && (
                    <p className="mt-2 text-xs text-[#6b6b6b] font-['Poppins',sans-serif]">
                      {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} selected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Subcategories */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-3 block">
                    Select Subcategories <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Select all that apply)
                    </span>
                  </Label>
                  {categories.length === 0 ? (
                    <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-gray-500 font-['Poppins',sans-serif]">
                        Please select at least one category first
                      </p>
                    </div>
                  ) : allSubcategories.length === 0 ? (
                    <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-gray-500 font-['Poppins',sans-serif]">
                        No subcategories available for selected categories
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allSubcategories.map((subcat: SubCategory) => (
                          <label
                            key={subcat._id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                              subcategories.includes(subcat._id)
                                ? 'border-[#FE8A0F] bg-[#FFF5EB]'
                                : 'border-gray-100 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]'
                            } cursor-pointer transition-all`}
                          >
                            <Checkbox
                              checked={subcategories.includes(subcat._id)}
                              onCheckedChange={() => {
                                if (subcategories.includes(subcat._id)) {
                                  setSubcategories(subcategories.filter(sc => sc !== subcat._id));
                                } else {
                                  setSubcategories([...subcategories, subcat._id]);
                                }
                              }}
                              className="border-2 border-gray-300 data-[state=checked]:bg-[#FE8A0F] data-[state=checked]:border-[#FE8A0F]"
                            />
                            <span className="text-sm text-[#2c353f] font-['Poppins',sans-serif]">
                              {subcat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
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

            {/* Step 5: Insurance */}
            {currentStep === 5 && (
              <div className="space-y-6">
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

                {/* Additional Insurance Details - Only show if insurance is "yes" */}
                {insurance === "yes" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <Label htmlFor="indemnityAmount" className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-2 block">
                        How much professional indemnity insurance do you have?
                      </Label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="indemnityAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={professionalIndemnityAmount}
                          onChange={(e) => {
                            setProfessionalIndemnityAmount(e.target.value);
                            if (errors.professionalIndemnityAmount) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.professionalIndemnityAmount;
                                return newErrors;
                              });
                            }
                          }}
                          placeholder="Enter amount"
                          className="pl-10 h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif]"
                        />
                      </div>
                      {errors.professionalIndemnityAmount && (
                        <p className="mt-1 text-sm text-red-600 font-['Poppins',sans-serif]">
                          {errors.professionalIndemnityAmount}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="expiryDate" className="text-[#2c353f] font-['Poppins',sans-serif] text-sm mb-2 block">
                        When is the insurance expiring?
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="expiryDate"
                          type="date"
                          value={insuranceExpiryDate}
                          onChange={(e) => {
                            setInsuranceExpiryDate(e.target.value);
                            if (errors.insuranceExpiryDate) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.insuranceExpiryDate;
                                return newErrors;
                              });
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="pl-10 h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif]"
                        />
                      </div>
                      {errors.insuranceExpiryDate && (
                        <p className="mt-1 text-sm text-red-600 font-['Poppins',sans-serif]">
                          {errors.insuranceExpiryDate}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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

