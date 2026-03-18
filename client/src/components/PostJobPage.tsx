import React, { useState, useEffect, useRef } from "react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import BenefitsAutoScroll from "./BenefitsAutoScroll";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import SEOHead from "./SEOHead";
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
  ChevronDown,
  Sparkles,
  Laptop,
  ArrowLeft,
  History,
  Trash2,
  Undo2,
  Info
} from "lucide-react";
import { cn } from "./ui/utils";
import { useAccount } from "./AccountContext";
import { useCurrency } from "./CurrencyContext";
import { useJobs } from "./JobsContext";
import { useSectors, useCategories } from "../hooks/useSectorsAndCategories";
import { resolveApiUrl } from "../config/api";
import { Checkbox } from "./ui/checkbox";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FloatingToolsBackground from "./FloatingToolsBackground";
import { toast } from "sonner@2.0.3";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import AddressAutocomplete from "./AddressAutocomplete";
import PhoneInput from "./PhoneInput";
import { validatePassword } from "../utils/passwordValidation";
import { validatePhoneNumber, normalizePhoneForBackend } from "../utils/phoneValidation";
import { VideoThumbnail } from "./orders/VideoThumbnail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Step {
  id: number;
  title: string;
  description: string;
}

// Grouped steps: first = AI description, then title+description, then category, location, budget
const stepGroups = [
  {
    id: 1,
    title: "Job Details",
    description: "Describe your job & get AI draft",
    icon: "file",
    steps: [1, 2, 3] // Description (AI), Title & Description, Category
  },
  {
    id: 2,
    title: "Location & Budget",
    description: "Where and how much",
    icon: "location",
    steps: [4, 5] // Location & Timing, Budget
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
  { id: 1, title: "Description", description: "Generate from keywords" },
  { id: 2, title: "Title & Description", description: "Review and edit" },
  { id: 3, title: "Category", description: "Choose categories" },
  { id: 4, title: "Location & Timing", description: "Where & when" },
  { id: 5, title: "Budget", description: "Set budget" },
];

// Categories by sector will be loaded from API
// This is kept for backward compatibility but will be replaced with API data
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

// Budget range item for display and submit. Only API ranges + fixed Custom Budget are shown.
type BudgetRangeItem = { value: string; label: string; min: number | null; max: number | null };

const CUSTOM_BUDGET_ITEM: BudgetRangeItem = { value: "custom-budget", label: "Custom Budget", min: null, max: null };

const DRAFT_STORAGE_KEY = "jobPostDraft";

export type JobDraftPayload = {
  savedAt?: number;
  currentStep?: number;
  jobDescription?: string;
  descriptionPreviousState?: string;
  jobTitle?: string;
  selectedSector?: string;
  selectedMainCategories?: string[];
  selectedSkills?: string[];
  jobLocationType?: "in-person" | "online";
  postcode?: string;
  address?: string;
  townCity?: string;
  county?: string;
  urgency?: string;
  preferredStartDate?: string;
  selectedBudget?: string;
  customBudgetMin?: string;
  customBudgetMax?: string;
};

export default function PostJobPage() {
  const { isLoggedIn, userInfo, register: initiateRegistration, verifyRegistrationEmail, completeRegistration } = useAccount();
  const { addJob, updateJob } = useJobs();
  const { formatPrice, symbol, toGBP, fromGBP } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit") || null;
  const isEditMode = !!editJobId;
  const [editJobLoading, setEditJobLoading] = useState(!!editJobId);
  const [existingAttachments, setExistingAttachments] = useState<{ name: string; url: string; mimeType: string; size: number }[]>([]);
  const thumbnailImage = "https://i.ibb.co/23knmvB9/thumbnail.jpg";
  const { sectors: sectorsData, loading: sectorsLoading } = useSectors();
  type CategoryItem = { value: string; label: string; itemKey: string };
  type CategoryGroup = { category: CategoryItem; subcategories: CategoryItem[] };

  const [categoriesBySectorData, setCategoriesBySectorData] = useState<{ [key: string]: CategoryItem[] }>({});
  const [categoriesGroupedBySector, setCategoriesGroupedBySector] = useState<{ [key: string]: CategoryGroup[] }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = isLoggedIn ? steps.length : steps.length + 1;
  const draftLoadedRef = useRef(false);
  const [draftApplied, setDraftApplied] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const isRestoringDraftRef = useRef(false);
  const isEditPrefillRef = useRef(false);
  
  // Transform sectors data for dropdown
  const sectors = sectorsData.map((s) => ({
    value: s.slug,
    label: s.name,
    id: s._id,
  }));
  
  // Load categories and subcategories: flat list (for lookup) + grouped (for dropdown UI: category then indented subcategories)
  useEffect(() => {
    const loadCategories = async () => {
      const flatMap: { [key: string]: CategoryItem[] } = {};
      const groupedMap: { [key: string]: CategoryGroup[] } = {};
      
      for (const sector of sectorsData) {
        try {
          const response = await fetch(
            `${resolveApiUrl('/api/categories')}?sectorSlug=${encodeURIComponent(sector.slug)}&activeOnly=true&includeSubCategories=true&limit=500`,
            { credentials: 'include' }
          );
          if (response.ok) {
            const data = await response.json();
            const flat: CategoryItem[] = [];
            const grouped: CategoryGroup[] = [];
            (data.categories || []).forEach((cat: any) => {
              const catSlug = cat.slug || (cat.name || '').toLowerCase().replace(/\s+/g, '-');
              const catName = cat.name || catSlug;
              const catId = cat._id?.toString?.() || `cat-${catSlug}`;
              const categoryItem: CategoryItem = { value: catSlug, label: catName, itemKey: catId };
              const subItems: CategoryItem[] = [];
              (cat.subCategories || []).forEach((sub: any) => {
                const subSlug = sub.slug || (sub.name || '').toLowerCase().replace(/\s+/g, '-');
                const subId = sub._id?.toString?.() || `sub-${catId}-${subSlug}`;
                subItems.push({ value: subSlug, label: sub.name || subSlug, itemKey: subId });
                flat.push({ value: subSlug, label: sub.name || subSlug, itemKey: subId });
              });
              if (subItems.length > 0) {
                grouped.push({ category: categoryItem, subcategories: subItems });
              }
            });
            flatMap[sector.slug] = flat;
            groupedMap[sector.slug] = grouped;
          }
        } catch (error) {
          // console.error(`Error loading categories for sector ${sector.slug}:`, error);
        }
      }
      
      setCategoriesBySectorData(flatMap);
      setCategoriesGroupedBySector(groupedMap);
    };
    
    if (sectorsData.length > 0) {
      loadCategories();
    }
  }, [sectorsData]);
  
  // Flat list for lookup (selected chips, job payload); grouped for dropdown when available
  const effectiveCategoriesBySector = Object.keys(categoriesBySectorData).length > 0 
    ? categoriesBySectorData 
    : categoriesBySector as { [key: string]: CategoryItem[] };
  const effectiveGroupedBySector = categoriesGroupedBySector;
  
  // Step 1/3: Sector & Category & Skills selection state
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [skillsPopoverOpen, setSkillsPopoverOpen] = useState(false);

  // Main categories (parent only) for selected sector – for Category multi-select
  const mainCategoriesForSector = (effectiveGroupedBySector[selectedSector] || []).map((g) => g.category);
  // Skills = subcategories from selected main categories only, ordered by category selection order
  const skillsOptionsForSector = selectedMainCategories.length
    ? (() => {
        const grouped = effectiveGroupedBySector[selectedSector] || [];
        const groupByValue = new Map<string, CategoryGroup>();
        grouped.forEach((g) => groupByValue.set(g.category.value, g));
        const seen = new Set<string>();
        const list: CategoryItem[] = [];
        selectedMainCategories.forEach((catValue) => {
          const g = groupByValue.get(catValue);
          if (!g) return;
          (g.subcategories || []).forEach((sub) => {
            if (!seen.has(sub.value)) {
              seen.add(sub.value);
              list.push(sub);
            }
          });
        });
        return list;
      })()
    : [];
  // Slug -> label for skills (for payload labels)
  const skillLabelBySlug = (() => {
    const map: Record<string, string> = {};
    (effectiveGroupedBySector[selectedSector] || []).forEach((g) => {
      (g.subcategories || []).forEach((sub) => {
        map[sub.value] = sub.label;
      });
    });
    return map;
  })();

  // When sector changes, clear category and skills selection (skip when restoring draft or edit prefill)
  useEffect(() => {
    if (isRestoringDraftRef.current || isEditPrefillRef.current) {
      if (isEditPrefillRef.current) queueMicrotask(() => { isEditPrefillRef.current = false; });
      if (isRestoringDraftRef.current) queueMicrotask(() => { isRestoringDraftRef.current = false; });
      return;
    }
    setSelectedMainCategories([]);
    setSelectedSkills([]);
  }, [selectedSector]);

  // When main categories change, keep only skills that still belong to selected categories (skip when restoring draft or edit prefill)
  const skillsOptionSlugs = new Set(skillsOptionsForSector.map((s) => s.value));
  useEffect(() => {
    if (isRestoringDraftRef.current || isEditPrefillRef.current) return;
    setSelectedSkills((prev) => prev.filter((slug) => skillsOptionSlugs.has(slug)));
  }, [selectedMainCategories.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps -- run when main categories change; skillsOptionSlugs is derived from them

  // Step 2: Description & Images
  const [jobDescription, setJobDescription] = useState("");
  const [descriptionPreviousState, setDescriptionPreviousState] = useState<string>("");
  const [showRestoreDescriptionModal, setShowRestoreDescriptionModal] = useState(false);
  const [showClearDescriptionModal, setShowClearDescriptionModal] = useState(false);
  type AttachedFileItem = { file: File; previewUrl?: string };
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  
  // Step 3: Headline (pre-filled when using Generate text by AI) – min 25 characters
  const JOB_TITLE_MIN_LENGTH = 25;
  const [jobTitle, setJobTitle] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Step 4: Location type (In-Person / Online) & Postcode & Timing
  const [jobLocationType, setJobLocationType] = useState<"in-person" | "online">("in-person");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [townCity, setTownCity] = useState("");
  const [county, setCounty] = useState("");
  const [urgency, setUrgency] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  
  // Step 5: Budget (ranges from API + custom block)
  const [budgetRangesFromApi, setBudgetRangesFromApi] = useState<BudgetRangeItem[]>([]);
  const [budgetRangesLoading, setBudgetRangesLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [customBudgetMin, setCustomBudgetMin] = useState("");
  const [customBudgetMax, setCustomBudgetMax] = useState("");

  // Registration verification (must be before postFormContent which references these)
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationPhone, setVerificationPhone] = useState("");
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isResendingPhone, setIsResendingPhone] = useState(false);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // API ranges only + fixed Custom Budget (no static fallback blocks)
  const budgetRanges: BudgetRangeItem[] = [...budgetRangesFromApi, CUSTOM_BUDGET_ITEM];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(resolveApiUrl("/api/jobs/budget-ranges"), { credentials: "include" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const list = (data.ranges || []).map(
            (r: { id: string; value: string; label: string; min: number; max: number }) => ({
              value: r.value,
              label: r.label,
              min: r.min,
              max: r.max,
            })
          );
          setBudgetRangesFromApi(list);
        }
      } catch {
        if (!cancelled) setBudgetRangesFromApi([]);
      } finally {
        if (!cancelled) setBudgetRangesLoading(false);
      }
    })();
  
  return () => { cancelled = true; };
  }, []);

  const handleGenerateByAI = async () => {
    const keyPoints = jobDescription.trim();
    if (!keyPoints) {
      toast.error("Enter some key points or keywords first");
      return;
    }
    setAiGenerating(true);
    try {
      const sectorEntry = sectors.find((s) => s.value === selectedSector);
      const sectorLabel = sectorEntry?.label || selectedSector || "";
      const res = await fetch(resolveApiUrl("/api/jobs/generate-description"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sectorName: sectorLabel || undefined,
          sectorSlug: selectedSector || undefined,
          keyPoints: keyPoints,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to generate");
        return;
      }
      const nextTitle = typeof data.title === "string" ? data.title.trim() : "";
      if (nextTitle) setJobTitle(nextTitle);
      const newDescription = data.description ?? "";
      if (newDescription) {
        setDescriptionPreviousState(jobDescription.trim());
        setJobDescription(newDescription);
      }
      if (nextTitle && nextTitle.length < JOB_TITLE_MIN_LENGTH) {
        toast.error(`AI generated title is too short. Please regenerate or edit to at least ${JOB_TITLE_MIN_LENGTH} characters.`);
        return;
      }
      toast.success("Title and description generated.");
      setCurrentStep((prev) => (prev < 2 ? 2 : prev));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.warn("[PostJob] generate-description: error", e);
      toast.error("Failed to generate. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleNext = () => {
    const isEditLockedStep = isEditMode && currentStep >= 3;
    if (isEditLockedStep) return; // In edit mode, only allow steps 2 and 3
    if (currentStep < totalSteps) {
      if (currentStep === 1) setJobTitle("");
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      saveDraftRef.current?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep <= 1) return;
    if (isEditMode && currentStep === 2) return; // Edit mode: don't go back to keyword step
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveDraftRef.current?.();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return jobDescription.trim() !== "";
      case 2:
        return jobTitle.trim().length >= JOB_TITLE_MIN_LENGTH && jobDescription.trim() !== "";
      case 3:
        return selectedSector !== "" && selectedMainCategories.length >= 1 && selectedSkills.length >= 5;
      case 4:
        if (urgency === "") return false;
        if (jobLocationType === "online") return true;
        return postcode.trim() !== "" && townCity.trim() !== "";
      case 5:
        if (selectedBudget === "") return false;
        if (selectedBudget === "custom-budget") {
          const min = parseFloat(customBudgetMin);
          const max = parseFloat(customBudgetMax);
          return !isNaN(min) && !isNaN(max) && min >= 0 && max >= 0 && min <= max;
        }
        return true;
      case 6:
        if (
          firstName.trim() === "" ||
          lastName.trim() === "" ||
          registerAddress.trim() === "" ||
          registerTownCity.trim() === "" ||
          email.trim() === "" ||
          !agreeTerms
        )
          return false;
        const phoneParts = phone.includes("|") ? phone.split("|") : ["+44", phone.replace(/\D/g, "")];
        const pn = phoneParts[1] || "";
        if (!pn.trim()) return false;
        const pv = validatePhoneNumber(pn);
        if (!pv.isValid) return false;
        if (!password) return false;
        const pwdVal = validatePassword(password);
        if (!pwdVal.isValid) return false;
        if (password !== confirmPassword) return false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
        return true;
      default:
        return true;
    }
  };

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addAttachedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const max = 10;
    const items: AttachedFileItem[] = Array.from(files)
      .slice(0, max - attachedFiles.length)
      .map((f) => {
        const isImage = f.type.startsWith("image/");
        const isVideo = f.type.startsWith("video/");
        const previewUrl = isImage || isVideo ? URL.createObjectURL(f) : undefined;
        return { file: f, previewUrl };
      });
    setAttachedFiles((prev) => [...prev, ...items].slice(0, max));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    addAttachedFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    addAttachedFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const [isDiscardingDraft, setIsDiscardingDraft] = useState(false);

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return next;
    });
  };

  const clearDraft = async () => {
    try {
      setIsDiscardingDraft(true);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      if (isLoggedIn) {
        await fetch(resolveApiUrl("/api/jobs/draft"), { method: "DELETE", credentials: "include" });
      }
    } catch (_) {}
  };

  const buildJobPayload = (clientId: string) => {
    let budgetMin: number, budgetMax: number;
    if (selectedBudget === "custom-budget") {
      budgetMin = toGBP(parseFloat(customBudgetMin));
      budgetMax = toGBP(parseFloat(customBudgetMax));
    } else {
      const preset = budgetRanges.find((r) => r.value === selectedBudget);
      budgetMin = preset?.min ?? 0;
      budgetMax = preset?.max ?? 0;
    }
    const budgetAmount = Math.round((budgetMin + budgetMax) / 2);
    const timingMap: { [key: string]: "urgent" | "flexible" | "specific" } = {
      urgent: "urgent",
      flexible: "flexible",
      "specific-date": "specific",
    };
    const sectorEntry = sectors.find((s) => s.value === selectedSector);
    const categoryLabels = selectedSkills.map((slug) => skillLabelBySlug[slug] ?? slug);
    return {
      title: jobTitle,
      description: jobDescription,
      sector: sectorEntry?.label || selectedSector,
      sectorId: sectorEntry?.id,
      sectorSlug: selectedSector,
      categories: categoryLabels,
      categorySlugs: selectedSkills,
      postcode: jobLocationType === "online" ? "Online" : postcode,
      address: jobLocationType === "online" ? "" : "",
      city: jobLocationType === "online" ? "" : townCity,
      state: jobLocationType === "online" ? "" : "",
      location:
        jobLocationType === "online"
          ? "Online"
          : [townCity, postcode].filter(Boolean).join(", ") || postcode,
      timing: timingMap[urgency] || "flexible",
      specificDate: urgency === "specific-date" ? preferredStartDate : undefined,
      budgetType: "fixed" as const,
      budgetAmount,
      budgetMin,
      budgetMax,
      status: "open" as const,
      clientId,
    };
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) return;
    if (selectedBudget === "custom-budget") {
      const min = parseFloat(customBudgetMin);
      const max = parseFloat(customBudgetMax);
      if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
        toast.error("Please enter a valid custom budget range (min ≤ max)");
        return;
      }
    } else {
      const preset = budgetRanges.find((r) => r.value === selectedBudget);
      if (!preset || preset.min == null || preset.max == null) {
        toast.error("Please select a budget range");
        return;
      }
    }
    const uploads: { name: string; url: string; mimeType: string; size: number }[] = [];
    if (attachedFiles.length > 0) {
      for (const item of attachedFiles) {
        const form = new FormData();
        form.append("file", item.file);
        const res = await fetch(resolveApiUrl("/api/jobs/upload-attachment"), {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "File upload failed");
        }
        const data = await res.json();
        uploads.push({ name: data.name, url: data.url, mimeType: data.mimeType || "", size: data.size || 0 });
      }
    }
    const newJob = { ...buildJobPayload(userInfo?.id || ""), attachments: uploads };
    try {
      const createdJob = await addJob(newJob);
      await clearDraft();
      toast.success("Job posted successfully! Professionals will start sending quotes soon.");
      navigate(`/job/${createdJob.slug || createdJob.id}?tab=quotes`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to post job");
    }
  };

  const handleUpdateJob = async () => {
    if (!editJobId || !userInfo?.id) return;
    if (selectedBudget === "custom-budget") {
      const min = parseFloat(customBudgetMin);
      const max = parseFloat(customBudgetMax);
      if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
        toast.error("Please enter a valid custom budget range (min ≤ max)");
        return;
      }
    } else {
      const preset = budgetRanges.find((r) => r.value === selectedBudget);
      if (!preset || preset.min == null || preset.max == null) {
        toast.error("Please select a budget range");
        return;
      }
    }
    const uploads: { name: string; url: string; mimeType: string; size: number }[] = [...existingAttachments];
    for (const item of attachedFiles) {
      const form = new FormData();
      form.append("file", item.file);
      const res = await fetch(resolveApiUrl("/api/jobs/upload-attachment"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "File upload failed");
      }
      const data = await res.json();
      uploads.push({ name: data.name, url: data.url, mimeType: data.mimeType || "", size: data.size || 0 });
    }
    const payload = buildJobPayload(userInfo.id);
    const sectorEntry = sectors.find((s) => s.value === selectedSector);
    const updates: Record<string, unknown> = {
      title: payload.title,
      description: payload.description,
      postcode: payload.postcode,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      location: payload.location,
      timing: payload.timing,
      specificDate: payload.specificDate || null,
      budgetType: payload.budgetType,
      budgetAmount: payload.budgetAmount,
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      sector: sectorEntry?.id,
      sectorSlug: payload.sectorSlug,
      sectorName: payload.sector,
      categorySlugs: payload.categorySlugs,
      categoryLabels: payload.categories,
      attachments: uploads,
    };
    try {
      await updateJob(editJobId, updates as any);
      toast.success("Job updated successfully.");
      navigate(`/job/${editJobId}?tab=details`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update job");
    }
  };

  const handleStartRegistration = async () => {
    setRegisterError(null);
    setFieldErrors({});
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!registerAddress.trim()) errors.address = "Address is required";
    if (!registerTownCity.trim()) errors.townCity = "Town/City is required";
    const phoneParts = phone.includes("|") ? phone.split("|") : ["+44", phone.replace(/\D/g, "")];
    const countryCode = phoneParts[0] || "+44";
    const phoneNumber = phoneParts[1] || "";
    if (!phoneNumber.trim()) errors.phone = "Phone number is required";
    else {
      const pv = validatePhoneNumber(phoneNumber);
      if (!pv.isValid) errors.phone = pv.error || "Invalid phone number format";
    }
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address";
    if (!password) errors.password = "Password is required";
    else {
      const pwdVal = validatePassword(password);
      if (!pwdVal.isValid) errors.password = pwdVal.errors[0] || "Password does not meet requirements";
    }
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match";
    if (!agreeTerms) errors.agreeTerms = "Please accept the terms and conditions";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    const registerData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: normalizePhoneForBackend(phoneNumber, countryCode),
      postcode: registerPostcode.trim() || "",
      password,
      userType: "client" as const,
      address: registerAddress.trim(),
      townCity: registerTownCity.trim(),
      county: registerCounty.trim(),
    };
    setIsSendingRegistration(true);
    setVerificationEmail(email.trim());
    setVerificationPhone(phone);
    setRegisterError(null);
    try {
      await initiateRegistration(registerData);
      setVerificationStep(1);
      setEmailVerificationCode("");
      setPhoneVerificationCode("");
      setShowEmailVerification(true);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Unable to start registration");
    } finally {
      setIsSendingRegistration(false);
    }
  };

  const postFormContent = () => (
    <>
        {/* Email & Phone Verification Modal (same as LoginPage) */}
        {showEmailVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-[480px] w-full relative">
              <button
                type="button"
                onClick={handleBackFromVerification}
                className="flex items-center gap-2 mb-4 font-['Poppins',sans-serif] text-[13px] text-[#3B82F6] hover:text-[#2563EB] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={cn("h-1.5 flex-1 rounded-full transition-all", verificationStep >= 1 ? "bg-[#FE8A0F]" : "bg-gray-200")} />
                <div className={cn("h-1.5 flex-1 rounded-full transition-all", verificationStep >= 2 ? "bg-[#FE8A0F]" : "bg-gray-200")} />
              </div>

              {verificationStep === 1 && (
                <>
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-7 h-7 text-[#FE8A0F]" />
                    </div>
                    <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">Verify Your Email</h2>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Code sent to</p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]">{verificationEmail}</p>
                  </div>
                  <form onSubmit={handleVerifyEmailCode} className="space-y-4">
                    <div>
                      <Label htmlFor="postjob-email-code" className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-2 block text-center">Enter 4-Digit Code</Label>
                      <Input
                        id="postjob-email-code"
                        type="text"
                        placeholder="0000"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[20px] text-center tracking-[0.5em] px-4"
                        maxLength={4}
                      />
                    </div>
                    <Button type="submit" disabled={isVerifyingEmail} className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60">
                      {isVerifyingEmail ? "Verifying…" : "Verify & Continue"}
                    </Button>
                    {registerError && <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">{registerError}</p>}
                    <div className="text-center">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        Didn&apos;t receive the code?{" "}
                        <button type="button" onClick={handleResendEmailCode} disabled={isResendingEmail || emailResendTimer > 0} className="text-[#3B82F6] hover:text-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed">
                          {isResendingEmail ? "Resending…" : emailResendTimer > 0 ? `Resend (${formatTimer(emailResendTimer)})` : "Resend"}
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}

              {verificationStep === 2 && (
                <>
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="w-7 h-7 text-[#FE8A0F]" />
                    </div>
                    <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">Verify Your Phone</h2>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Code sent to</p>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]">{verificationPhone}</p>
                  </div>
                  <form onSubmit={handleVerifyPhoneCodeAndPostJob} className="space-y-4">
                    <div>
                      <Label htmlFor="postjob-phone-code" className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-2 block text-center">Enter 4-Digit Code</Label>
                      <Input
                        id="postjob-phone-code"
                        type="text"
                        placeholder="0000"
                        value={phoneVerificationCode}
                        onChange={(e) => setPhoneVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[20px] text-center tracking-[0.5em] px-4"
                        maxLength={4}
                      />
                    </div>
                    <Button type="submit" disabled={isRegistering} className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60">
                      {isRegistering ? "Creating account & posting job…" : "Complete Verification & Post Job"}
                    </Button>
                    {registerError && <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">{registerError}</p>}
                    <div className="text-center">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        Didn&apos;t receive the code?{" "}
                        <button type="button" onClick={handleResendPhoneCode} disabled={isResendingPhone || phoneResendTimer > 0} className="text-[#3B82F6] hover:text-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed">
                          {isResendingPhone ? "Resending…" : phoneResendTimer > 0 ? `Resend (${formatTimer(phoneResendTimer)})` : "Resend"}
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

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
    </>
  );

  const pageChildren = (
    <>
      <SEOHead
        title="Post a Job - Get Quotes from Verified Professionals | Sortars"
        description="Need a service? Post your job and receive quotes from qualified professionals. Free to post, compare offers, read reviews, and hire the best expert for your project."
        ogTitle="Post Your Job & Get Instant Quotes - Sortars"
        ogDescription="Describe your job, receive competitive quotes from trusted professionals, and hire with confidence. 1000+ vetted experts ready to help."
        ogImage={`${window.location.origin}${thumbnailImage}`}
        ogType="website"
        robots="index,follow"
      />
      <section className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <FloatingToolsBackground />
      </section>
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12 mt-[50px] md:mt-0 md:bg-white md:rounded-3xl md:shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 md:p-10 mb-8" aria-label="Post job form">
        {isEditMode && editJobLoading && (
          <section className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-12 text-center mb-8" aria-label="Loading">
            <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b]">Loading job...</p>
          </section>
        )}
        {/* Step Indicator - Modern 3-Group Design */}
        <section className="mb-6" aria-label="Progress">
          <section className="bg-transparent rounded-3xl p-6 md:p-8">
            {/* Step Groups with Connected Progress Line */}
            <section className="relative">
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
            </section>
          </section>
        </section>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-4 pb-8 -mt-4">
          {draftApplied && (
            <div className="mb-4 rounded-2xl border-2 border-blue-500 bg-[#eef3ff] px-4 py-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#4f46e5] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#374151]">
                  {(() => {
                    if (!draftSavedAt) {
                      return "We have automatically loaded a project you were working on recently. You can continue working on it below. Pressing \"Discard\" will clear the form and remove the draft forever.";
                    }
                    const diffMs = Date.now() - draftSavedAt;
                    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
                    const diffMin = Math.floor(diffSec / 60);
                    const diffHour = Math.floor(diffMin / 60);
                    const diffDay = Math.floor(diffHour / 24);
                    let when = "just now";
                    if (diffDay >= 1) {
                      when = `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
                    } else if (diffHour >= 1) {
                      when = `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
                    } else if (diffMin >= 1) {
                      when = `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
                    }
                    return `We have automatically loaded a project you were working on ${when}. You can continue working on it below. Pressing "Discard" will clear the form and remove the draft forever.`;
                  })()}
                </p>
                <button
                  type="button"
                  className="mt-1 font-['Poppins',sans-serif] text-[14px] text-blue-500 underline hover:no-underline font-medium"
                  onClick={async () => {
                    await clearDraft();
                    window.location.reload();
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 md:p-10 mb-8">
            {/* Step 1: Description – key points + Generate text by AI (no sector required) */}
            {currentStep === 1 && (
              <div className="space-y-6 bg-white p-8 rounded-lg">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Describe your job
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Enter key points or keywords about what you need. Then click &quot;Generate text by AI&quot; to create a full job title and description. Click Next to review and edit them.
                  </p>
                </div>

                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                    Key points or keywords
                  </Label>
                  <Textarea
                    placeholder="e.g., leaking tap, kitchen, need fix by weekend"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    className="w-full border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateByAI}
                      disabled={!jobDescription.trim() || aiGenerating}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 font-['Poppins',sans-serif] font-semibold text-[15px] px-6 py-3 rounded-xl border-2 transition-all duration-200",
                        !jobDescription.trim() || aiGenerating
                          ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-white border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] active:scale-[0.98]"
                      )}
                    >
                      <Sparkles className={cn("w-5 h-5 flex-shrink-0", aiGenerating && "animate-pulse")} />
                      {aiGenerating ? "Generating…" : "Generate text by AI"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Title & Description – review and edit (pre-filled after AI generate) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Job title and description
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Review and edit the job title and description below. You can change them before continuing.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      Job title
                    </Label>
                    <span className={`font-['Poppins',sans-serif] text-[12px] ${jobTitle.trim().length < JOB_TITLE_MIN_LENGTH ? "text-red-600" : "text-[#6b6b6b]"}`}>
                      {jobTitle.length} characters (min {JOB_TITLE_MIN_LENGTH})
                    </span>
                  </div>
                  <Input
                    placeholder={`e.g., Install new bathroom suite (type at least ${JOB_TITLE_MIN_LENGTH} characters)`}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className={`h-12 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px] w-full ${
                      jobTitle.trim().length < JOB_TITLE_MIN_LENGTH
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-[#FE8A0F]"
                    }`}
                  />
                  {jobTitle.trim().length < JOB_TITLE_MIN_LENGTH && (
                    <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 mt-1.5">
                      Please type {JOB_TITLE_MIN_LENGTH} characters at least.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      Description
                    </Label>
                    <div className="flex items-center gap-1">
                      {descriptionPreviousState.trim() !== "" && (
                        <button
                          type="button"
                          onClick={() => setShowRestoreDescriptionModal(true)}
                          title={jobDescription.trim() === "" ? "Revert: restore deleted content" : "Restore to previous content"}
                          className="p-2 rounded-lg transition-colors font-['Poppins',sans-serif] text-[#6b6b6b] hover:bg-gray-100 hover:text-[#FE8A0F]"
                        >
                          {jobDescription.trim() === "" ? (
                            <Undo2 className="w-4 h-4" />
                          ) : (
                            <History className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowClearDescriptionModal(true)}
                        title="Clear description"
                        className="p-2 rounded-lg text-[#6b6b6b] hover:bg-gray-100 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Describe what you need..."
                    value={jobDescription} 
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={10}
                    className="w-full border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none whitespace-pre-wrap"
                  />
                </div>

                {/* Restore description confirmation */}
                <AlertDialog open={showRestoreDescriptionModal} onOpenChange={setShowRestoreDescriptionModal}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-['Poppins',sans-serif]">
                        Restore to previous content?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-['Poppins',sans-serif]">
                        The description will be replaced with the previous content (before the last change).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-['Poppins',sans-serif]">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="font-['Poppins',sans-serif] bg-[#FE8A0F] hover:bg-[#FFB347]"
                        onClick={() => {
                          setJobDescription(descriptionPreviousState);
                          setShowRestoreDescriptionModal(false);
                          toast.success("Restored to previous content.");
                        }}
                      >
                        Restore
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Clear description confirmation */}
                <AlertDialog open={showClearDescriptionModal} onOpenChange={setShowClearDescriptionModal}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-['Poppins',sans-serif]">
                        Clear description?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-['Poppins',sans-serif]">
                        All text in the description field will be removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-['Poppins',sans-serif]">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="font-['Poppins',sans-serif] bg-red-500 hover:bg-red-600"
                        onClick={() => {
                          setDescriptionPreviousState(jobDescription);
                          setJobDescription("");
                          setShowClearDescriptionModal(false);
                          toast.success("Description cleared.");
                        }}
                      >
                        Clear
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Attach files */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      "rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center min-h-[50px] py-4 px-4",
                      isDraggingFiles
                        ? "border-[#FE8A0F] bg-[#FFF5EB]"
                        : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      {isDraggingFiles ? "Drop files here" : "Attach files (images, videos, documents — drag and drop or click)"}
                    </span>
                  </div>
                  {isEditMode && existingAttachments.length > 0 && (
                    <div className="mt-3">
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">Current attachments</p>
                      <ul className="flex flex-wrap gap-2">
                        {existingAttachments.map((a, i) => (
                          <li key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{a.name}</span>
                            <button type="button" aria-label="Remove" onClick={() => setExistingAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 flex-shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {attachedFiles.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {attachedFiles.map((item, index) => {
                        const isImage = item.file.type.startsWith("image/");
                        const isVideo = item.file.type.startsWith("video/");
                        return (
                          <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 min-h-[80px]">
                            {isImage && item.previewUrl ? (
                              <img src={item.previewUrl} alt={item.file.name} className="w-full aspect-square object-cover" />
                            ) : isVideo && item.previewUrl ? (
                              <div className="relative w-full aspect-square overflow-hidden bg-black/5">
                                <VideoThumbnail
                                  videoUrl={item.previewUrl}
                                  className="w-full h-full"
                                  style={{ minWidth: "100%", minHeight: "100%", position: "absolute", inset: 0 }}
                                />
                              </div>
                            ) : (
                              <div className="w-full aspect-square flex flex-col items-center justify-center gap-1 p-2">
                                <FileText className="w-8 h-8 text-gray-400" />
                                <span className="font-['Poppins',sans-serif] text-[11px] text-gray-600 truncate w-full text-center">{item.file.name}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeAttachedFile(index); }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Select skills required – sector chosen manually, then skills by sector */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Select the skills required
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    Select your job sector first, then choose the skills (categories) required for your job.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                        Sector
                      </Label>
                      <Select 
                        value={selectedSector} 
                        onValueChange={(value) => {
                          setSelectedSector(value);
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

                    <div className="flex flex-col">
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                        Category
                      </Label>
                      <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={!selectedSector}
                            className={cn(
                              "w-full min-h-[56px] border-2 rounded-xl px-3 py-2 font-['Poppins',sans-serif] text-[14px] text-left transition-all",
                              !selectedSector
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 hover:border-[#FE8A0F] cursor-pointer"
                            )}
                          >
                            <div className="flex flex-wrap gap-2 items-center">
                              {selectedMainCategories.length > 0 ? (
                                <>
                                  {selectedMainCategories.map((slug) => {
                                    const cat = mainCategoriesForSector.find((c) => c.value === slug);
                                    return (
                                      <div
                                        key={slug}
                                        className="inline-flex items-center gap-1 bg-[#FE8A0F] text-white px-3 py-1 rounded-lg"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMainCategories(selectedMainCategories.filter((c) => c !== slug));
                                        }}
                                      >
                                        <span className="text-[13px]">{cat?.label ?? slug}</span>
                                        <X className="w-3 h-3 hover:text-red-200 transition-colors" />
                                      </div>
                                    );
                                  })}
                                  <ChevronDown className="w-4 h-4 ml-auto text-gray-400 flex-shrink-0" />
                                </>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[#6b6b6b]">
                                    {selectedSector ? "Select main categories..." : "Select sector first"}
                                  </span>
                                  {selectedSector && <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                              )}
                            </div>
                          </button>
                        </PopoverTrigger>
                        {selectedSector && (
                          <PopoverContent className="w-[480px] max-w-[95vw] p-0 min-h-[280px] flex flex-col" align="start">
                            <Command className="rounded-lg border-0 shadow-none flex flex-col overflow-hidden min-h-[260px]" shouldFilter={true}>
                              <div className="p-2 border-b bg-muted/30">
                                <CommandInput placeholder="Search main categories..." className="font-['Poppins',sans-serif] h-10" />
                              </div>
                              <CommandList className="flex-1 min-h-0 overflow-y-auto max-h-[220px] overscroll-contain">
                                <CommandEmpty className="font-['Poppins',sans-serif] text-[13px] text-center py-4">
                                  No category found.
                                </CommandEmpty>
                                {mainCategoriesForSector.map((cat) => {
                                  const isSelected = selectedMainCategories.includes(cat.value);
                                  return (
                                    <CommandItem
                                      key={cat.itemKey}
                                      value={cat.label}
                                      onSelect={() => {
                                        if (isSelected) {
                                          setSelectedMainCategories(selectedMainCategories.filter((c) => c !== cat.value));
                                        } else {
                                          setSelectedMainCategories([...selectedMainCategories, cat.value]);
                                        }
                                        setCategoryPopoverOpen(false);
                                      }}
                                      className="font-['Poppins',sans-serif] cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-[13px]">{cat.label}</span>
                                        {isSelected && <Check className="w-4 h-4 text-[#FE8A0F]" />}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        )}
                      </Popover>
                    </div>

                    <div className="flex flex-col">
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-2">
                        Skills
                      </Label>
                      <Popover open={skillsPopoverOpen} onOpenChange={setSkillsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={!selectedSector || selectedMainCategories.length === 0}
                            className={cn(
                              "w-full min-h-[56px] border-2 rounded-xl px-3 py-2 font-['Poppins',sans-serif] text-[14px] text-left transition-all",
                              !selectedSector || selectedMainCategories.length === 0
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 hover:border-[#FE8A0F] cursor-pointer"
                            )}
                          >
                            <div className="flex flex-wrap gap-2 items-center">
                              {selectedSkills.length > 0 ? (
                                <>
                                  {selectedSkills.map((slug) => (
                                    <div
                                      key={slug}
                                      className="inline-flex items-center gap-1 bg-[#FE8A0F] text-white px-3 py-1 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSkills(selectedSkills.filter((s) => s !== slug));
                                      }}
                                    >
                                      <span className="text-[13px]">{skillLabelBySlug[slug] ?? slug}</span>
                                      <X className="w-3 h-3 hover:text-red-200 transition-colors" />
                                    </div>
                                  ))}
                                  <ChevronDown className="w-4 h-4 ml-auto text-gray-400 flex-shrink-0" />
                                </>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[#6b6b6b]">
                                    {!selectedSector
                                      ? "Select sector first"
                                      : selectedMainCategories.length === 0
                                        ? "Select categories first"
                                        : "Search and select skills (subcategories)..."}
                                  </span>
                                  {selectedSector && selectedMainCategories.length > 0 && <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                              )}
                            </div>
                          </button>
                        </PopoverTrigger>
                        {selectedSector && selectedMainCategories.length > 0 && (
                          <PopoverContent className="w-[480px] max-w-[95vw] p-0 min-h-[380px] flex flex-col" align="start">
                            <Command className="rounded-lg border-0 shadow-none flex flex-col overflow-hidden min-h-[360px]" shouldFilter={true}>
                              <div className="p-2 border-b bg-muted/30">
                                <CommandInput placeholder="Search skills / subcategories..." className="font-['Poppins',sans-serif] h-10" />
                              </div>
                              <CommandList className="flex-1 min-h-0 overflow-y-auto max-h-[300px] overscroll-contain">
                                <CommandEmpty className="font-['Poppins',sans-serif] text-[13px] text-center py-4">
                                  No skill found.
                                </CommandEmpty>
                                {skillsOptionsForSector.map((skill) => {
                                  const isSelected = selectedSkills.includes(skill.value);
                                  return (
                                    <CommandItem
                                      key={skill.itemKey}
                                      value={skill.label}
                                      onSelect={() => {
                                        if (isSelected) {
                                          setSelectedSkills(selectedSkills.filter((s) => s !== skill.value));
                                        } else {
                                          setSelectedSkills([...selectedSkills, skill.value]);
                                        }
                                        setSkillsPopoverOpen(false);
                                      }}
                                      className="font-['Poppins',sans-serif] cursor-pointer pl-4"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-[13px]">{skill.label}</span>
                                        {isSelected && <Check className="w-4 h-4 text-[#FE8A0F]" />}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        )}
                      </Popover>
                    </div>
                </div>

                {selectedSector && (
                  <div className="mt-4">
                    <div className={cn(
                      "flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] px-4 py-3 rounded-lg",
                      selectedMainCategories.length >= 1 && selectedSkills.length >= 5
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    )}>
                      {selectedMainCategories.length >= 1 && selectedSkills.length >= 5 ? (
                        <>
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {selectedMainCategories.length} categor{(selectedMainCategories.length) === 1 ? 'y' : 'ies'} and {selectedSkills.length} skills selected. Ready to continue! Ready to continue!
                          </span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {selectedMainCategories.length === 0
                              ? "Select at least one category, then at least 5 skills."
                              : `Please select at least ${5 - selectedSkills.length} more skill${(5 - selectedSkills.length) === 1 ? '' : 's'} to continue.`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Location & Timing */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* In-Person vs Online */}
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    How will this be done?
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                    Choose In-Person if the work is at a physical location, or Online for remote services.
                  </p>
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        jobLocationType === "in-person"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50 hover:bg-gray-50"
                      )}
                      onClick={() => setJobLocationType("in-person")}
                    >
                      <MapPin className={cn("w-5 h-5", jobLocationType === "in-person" ? "text-[#FE8A0F]" : "text-gray-400")} />
                      <span className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">In-Person</span>
                      {jobLocationType === "in-person" && <Check className="w-5 h-5 text-[#FE8A0F]" />}
                    </div>
                    <div
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        jobLocationType === "online"
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50 hover:bg-gray-50"
                      )}
                      onClick={() => setJobLocationType("online")}
                    >
                      <Laptop className={cn("w-5 h-5", jobLocationType === "online" ? "text-[#FE8A0F]" : "text-gray-400")} />
                      <span className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">Online</span>
                      {jobLocationType === "online" && <Check className="w-5 h-5 text-[#FE8A0F]" />}
                    </div>
                  </div>
                </div>

                {/* Postcode Section - only when In-Person */}
                {jobLocationType === "in-person" && (
                <div>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Where do you need this done?
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                    Enter the postcode and town/city where the work needs to be done.
                  </p>
                  <AddressAutocomplete
                    postcode={postcode}
                    onPostcodeChange={(value) => setPostcode(value)}
                    address={address}
                    onAddressChange={(value) => setAddress(value)}
                    townCity={townCity}
                    onTownCityChange={(value) => setTownCity(value)}
                    county={county}
                    onCountyChange={(value) => setCounty(value)}
                    onAddressSelect={(addressData) => {
                      setPostcode(addressData.postcode || "");
                      setTownCity(addressData.townCity || "");
                      setAddress("");
                      setCounty("");
                    }}
                    label="Postcode"
                    required={true}
                    showAddressField={false}
                    showTownCityField={true}
                    showCountyField={false}
                    addressLabel="Address"
                    className="font-['Poppins',sans-serif]"
                  />
                </div>
                )}

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

                {budgetRangesLoading && (
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2">Loading options...</p>
                )}
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
                          {budget.value === "custom-budget"
                            ? budget.label
                            : budget.max !== null && budget.max >= 500000
                              ? `Over ${formatPrice(budget.min ?? 0)}`
                              : budget.min === 0 || budget.min === null
                                ? `Under ${formatPrice(budget.max ?? 0)}`
                                : budget.min === budget.max
                                  ? formatPrice(budget.min)
                                  : `${formatPrice(budget.min ?? 0)} - ${formatPrice(budget.max ?? 0)}`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {selectedBudget === "custom-budget" && (
                  <div className="mt-6 p-4 border-2 border-[#FE8A0F]/50 rounded-xl bg-[#FFF5EB]/30 space-y-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      Enter your budget range (min and max in {symbol})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                          Minimum ({symbol}) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="e.g. 500"
                            value={customBudgetMin}
                            onChange={(e) => setCustomBudgetMin(e.target.value)}
                            className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                          Maximum ({symbol}) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="e.g. 1000"
                            value={customBudgetMax}
                            onChange={(e) => setCustomBudgetMax(e.target.value)}
                            className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          />
                        </div>
                      </div>
                    </div>
                    {customBudgetMin !== "" && customBudgetMax !== "" && parseFloat(customBudgetMin) > parseFloat(customBudgetMax) && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-red-600">
                        Minimum must be less than or equal to maximum
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Account Creation (if not logged in) – same workflow as LoginPage registration */}
            {!isLoggedIn && currentStep === 6 && !showEmailVerification && (
              <section className="space-y-6" aria-label="Account creation">
                <section>
                  <h2 className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f] mb-2">
                    Create a new account
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Register to post your job and receive quotes
                  </p>
                </section>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        First name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type="text"
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => { setFirstName(e.target.value); if (fieldErrors.firstName) setFieldErrors((p) => ({ ...p, firstName: "" })); }}
                          className={cn("pl-10 h-11 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px]", fieldErrors.firstName ? "border-red-500" : "border-gray-200 focus:border-[#FE8A0F]")}
                        />
                      </div>
                      {fieldErrors.firstName && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.firstName}</p>}
                    </div>
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                        Last name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          type="text"
                          placeholder="Smith"
                          value={lastName}
                          onChange={(e) => { setLastName(e.target.value); if (fieldErrors.lastName) setFieldErrors((p) => ({ ...p, lastName: "" })); }}
                          className={cn("pl-10 h-11 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px]", fieldErrors.lastName ? "border-red-500" : "border-gray-200 focus:border-[#FE8A0F]")}
                        />
                      </div>
                      {fieldErrors.lastName && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.lastName}</p>}
                    </div>
                  </div>

                  <AddressAutocomplete
                    postcode={registerPostcode}
                    onPostcodeChange={(v) => { setRegisterPostcode(v); if (fieldErrors.postcode) setFieldErrors((p) => ({ ...p, postcode: "" })); }}
                    address={registerAddress}
                    onAddressChange={(v) => { setRegisterAddress(v); if (fieldErrors.address || fieldErrors.townCity) setFieldErrors((p) => ({ ...p, address: "", townCity: "" })); }}
                    townCity={registerTownCity}
                    onTownCityChange={(v) => { setRegisterTownCity(v); if (fieldErrors.townCity) setFieldErrors((p) => ({ ...p, townCity: "" })); }}
                    county={registerCounty}
                    onCountyChange={setRegisterCounty}
                    onAddressSelect={(addr) => {
                      setRegisterPostcode(addr.postcode || "");
                      setRegisterAddress(addr.address || "");
                      setRegisterTownCity(addr.townCity || "");
                      setRegisterCounty(addr.county || "");
                      setFieldErrors((p) => ({ ...p, postcode: "", address: "", townCity: "" }));
                    }}
                    label="Postcode"
                    required={false}
                    showAddressField
                    showTownCityField
                    showCountyField
                    addressLabel="Address"
                    className="font-['Poppins',sans-serif]"
                  />
                  {fieldErrors.postcode && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.postcode}</p>}
                  {fieldErrors.address && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.address}</p>}
                  {fieldErrors.townCity && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.townCity}</p>}

                  <PhoneInput
                    id="postjob-reg-phone"
                    label="Phone number"
                    value={phone}
                    onChange={(v) => {
                      setPhone(v);
                      const parts = v.includes("|") ? v.split("|") : ["+44", v.replace(/\D/g, "")];
                      const pn = parts[1] || "";
                      if (pn && validatePhoneNumber(pn).isValid && fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                      else if (!pn && fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                    }}
                    placeholder="7123 456789"
                    error={fieldErrors.phone}
                    required
                  />

                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        type="email"
                        placeholder="jane@gmail.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" })); }}
                        className={cn("pl-10 h-11 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px]", fieldErrors.email ? "border-red-500" : "border-gray-200 focus:border-[#FE8A0F]")}
                      />
                    </div>
                    {fieldErrors.email && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPassword(v);
                          if (v) {
                            const pv = validatePassword(v);
                            if (!pv.isValid) setFieldErrors((p) => ({ ...p, password: pv.errors[0] || "" }));
                            else setFieldErrors((p) => ({ ...p, password: "" }));
                          } else setFieldErrors((p) => ({ ...p, password: "" }));
                          if (fieldErrors.confirmPassword && v === confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                        }}
                        className={cn("pl-10 pr-10 h-11 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px]", fieldErrors.password ? "border-red-500" : "border-gray-200 focus:border-[#FE8A0F]")}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.password}</p>}
                  </div>

                  <div>
                    <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
                      Confirm password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                        className={cn("pl-10 pr-10 h-11 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px]", fieldErrors.confirmPassword ? "border-red-500" : "border-gray-200 focus:border-[#FE8A0F]")}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F]">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="postjob-terms"
                      checked={agreeTerms}
                      onCheckedChange={(c) => { setAgreeTerms(c as boolean); if (fieldErrors.agreeTerms) setFieldErrors((p) => ({ ...p, agreeTerms: "" })); }}
                      className="mt-0.5"
                    />
                    <Label htmlFor="postjob-terms" className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] cursor-pointer leading-relaxed">
                      I agree to the <Link to="/terms" className="text-[#3B82F6] hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-[#3B82F6] hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                  {fieldErrors.agreeTerms && <p className="mt-1 ml-7 text-[11px] text-red-600 font-['Poppins',sans-serif]">{fieldErrors.agreeTerms}</p>}

                  {registerError && <p className="text-[12px] text-red-600 font-['Poppins',sans-serif]">{registerError}</p>}
                </div>
              </section>
            )}
            </div>
          </div>
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1 || (isEditMode && currentStep === 2)}
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

          {isEditMode ? (
            currentStep < 3 ? (
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
                onClick={handleUpdateJob}
                disabled={!isStepValid()}
                className={cn(
                  "h-12 px-8 rounded-full font-['Poppins',sans-serif] text-[14px] transition-all duration-300",
                  isStepValid()
                    ? "bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                Update Job
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )
          ) : currentStep < totalSteps ? (
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
              onClick={!isLoggedIn ? handleStartRegistration : handleSubmit}
              disabled={!isStepValid() || (!isLoggedIn && isSendingRegistration)}
              className={cn(
                "h-12 px-8 rounded-full font-['Poppins',sans-serif] text-[14px] transition-all duration-300",
                isStepValid() && !(!isLoggedIn && isSendingRegistration)
                  ? "bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {!isLoggedIn ? (isSendingRegistration ? "Creating account…" : "Create account & Post Job") : "Post Job"}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        </section>

        {/* Already have an account (only show on account step if not logged in) */}
        {!isLoggedIn && currentStep === 6 && !showEmailVerification && (
          <p className="text-center mt-6 font-['Poppins',sans-serif] text-[13px] text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#FE8A0F] hover:underline">
              Log in here
            </Link>
          </p>
        )}
      {postFormContent()}
    </>
  );

  // Edit mode: fetch job and prefill form; skip keyword step (start at step 2)
  useEffect(() => {
    if (!editJobId || !isLoggedIn) {
      if (!editJobId) setEditJobLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
    setEditJobLoading(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${editJobId}`), { credentials: "include" });
      if (cancelled || !res.ok) {
        if (!cancelled) setEditJobLoading(false);
        return;
      }
      const job = await res.json();
      if (cancelled) return;
      isEditPrefillRef.current = true;
      setJobTitle(job.title || "");
      setJobDescription(job.description || "");
      setSelectedSector(job.sectorSlug || "");
      const slugs = job.categorySlugs || [];
      setSelectedSkills(slugs);
      const grouped = categoriesGroupedBySector[job.sectorSlug] || [];
      const main: string[] = [];
      grouped.forEach((g: CategoryGroup) => {
        const hasAny = (g.subcategories || []).some((sub: CategoryItem) => slugs.includes(sub.value));
        if (hasAny) main.push(g.category.value);
      });
      setSelectedMainCategories(main);
      setPostcode(job.postcode === "Online" ? "" : job.postcode || "");
      setTownCity(job.city || "");
      setAddress(job.address || "");
      setCounty(job.state || "");
      setJobLocationType(job.postcode === "Online" ? "online" : "in-person");
      const timingMap: Record<string, string> = { urgent: "urgent", specific: "specific-date", flexible: "flexible" };
      setUrgency(timingMap[job.timing] || "flexible");
      setPreferredStartDate(job.specificDate || "");
      if (job.budgetMin != null && job.budgetMax != null) {
        setSelectedBudget("custom-budget");
        setCustomBudgetMin(fromGBP(job.budgetMin).toFixed(2));
        setCustomBudgetMax(fromGBP(job.budgetMax).toFixed(2));
      } else if (budgetRangesFromApi.length > 0) {
        const match = budgetRangesFromApi.find((r) => r.min === job.budgetMin && r.max === job.budgetMax);
        if (match) setSelectedBudget(match.value);
      }
      setExistingAttachments(job.attachments || []);
      setCurrentStep(2);
      draftLoadedRef.current = true;
    } catch {
      if (!cancelled) toast.error("Failed to load job");
    } finally {
      if (!cancelled) setEditJobLoading(false);
    }
  })();
    return () => { cancelled = true; };
  }, [editJobId, isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Edit mode: when categories load for job's sector, derive main categories from selected skills
  const editMainCategoriesAppliedRef = useRef(false);
  useEffect(() => {
  if (!isEditMode || !selectedSector || selectedSkills.length === 0) return;
  const grouped = categoriesGroupedBySector[selectedSector] || [];
  if (grouped.length === 0) return;
  if (editMainCategoriesAppliedRef.current) return;
  editMainCategoriesAppliedRef.current = true;
  const main: string[] = [];
  grouped.forEach((g: CategoryGroup) => {
    const hasAny = (g.subcategories || []).some((sub: CategoryItem) => selectedSkills.includes(sub.value));
    if (hasAny) main.push(g.category.value);
  });
  setSelectedMainCategories(main);
}, [isEditMode, selectedSector, selectedSkills, categoriesGroupedBySector]);

// Account Creation (if not logged in) – same fields as LoginPage client registration
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [phone, setPhone] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [agreeTerms, setAgreeTerms] = useState(false);
const [registerPostcode, setRegisterPostcode] = useState("");
const [registerAddress, setRegisterAddress] = useState("");
const [registerTownCity, setRegisterTownCity] = useState("");
const [registerCounty, setRegisterCounty] = useState("");
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
const [isSendingRegistration, setIsSendingRegistration] = useState(false);

// Resend timers for verification modals
useEffect(() => {
  if (emailResendTimer > 0) {
    const t = setInterval(() => setEmailResendTimer((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(t);
  }
}, [emailResendTimer]);
useEffect(() => {
  if (phoneResendTimer > 0) {
    const t = setInterval(() => setPhoneResendTimer((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(t);
  }
}, [phoneResendTimer]);
useEffect(() => {
  if (showEmailVerification && verificationStep === 1 && emailResendTimer === 0) setEmailResendTimer(120);
}, [showEmailVerification, verificationStep, emailResendTimer]);
useEffect(() => {
  if (showEmailVerification && verificationStep === 2 && phoneResendTimer === 0) setPhoneResendTimer(120);
}, [showEmailVerification, verificationStep, phoneResendTimer]);

const getDraftPayload = (): JobDraftPayload => ({
  savedAt: Date.now(),
  currentStep,
  jobDescription,
  descriptionPreviousState,
  jobTitle,
  selectedSector,
  selectedMainCategories,
  selectedSkills,
  jobLocationType,
  postcode,
  address,
  townCity,
  county,
  urgency,
  preferredStartDate,
  selectedBudget,
  customBudgetMin,
  customBudgetMax,
});

const applyDraft = (d: JobDraftPayload, meta?: { updatedAt?: number }) => {
  if (!d || typeof d !== "object") return;
  isRestoringDraftRef.current = true;
  if (typeof d.currentStep === "number" && d.currentStep >= 1) setCurrentStep(d.currentStep);
  if (typeof d.jobDescription === "string") setJobDescription(d.jobDescription);
  if (typeof d.descriptionPreviousState === "string") setDescriptionPreviousState(d.descriptionPreviousState);
  if (typeof d.jobTitle === "string") setJobTitle(d.jobTitle);
  if (typeof d.selectedSector === "string") setSelectedSector(d.selectedSector);
  if (Array.isArray(d.selectedMainCategories)) setSelectedMainCategories(d.selectedMainCategories);
  if (Array.isArray(d.selectedSkills)) setSelectedSkills(d.selectedSkills);
  if (d.jobLocationType === "in-person" || d.jobLocationType === "online") setJobLocationType(d.jobLocationType);
  if (typeof d.postcode === "string") setPostcode(d.postcode);
  if (typeof d.address === "string") setAddress(d.address);
  if (typeof d.townCity === "string") setTownCity(d.townCity);
  if (typeof d.county === "string") setCounty(d.county);
  if (typeof d.urgency === "string") setUrgency(d.urgency);
  if (typeof d.preferredStartDate === "string") setPreferredStartDate(d.preferredStartDate);
  if (typeof d.selectedBudget === "string") setSelectedBudget(d.selectedBudget);
  if (typeof d.customBudgetMin === "string") setCustomBudgetMin(d.customBudgetMin);
  if (typeof d.customBudgetMax === "string") setCustomBudgetMax(d.customBudgetMax);
  setDraftApplied(true);
  if (meta?.updatedAt !== undefined) {
    setDraftSavedAt(meta.updatedAt);
  } else if (typeof d.savedAt === "number") {
    setDraftSavedAt(d.savedAt);
  }
};

// Load draft on mount: from API if logged in, else from localStorage (run once when isLoggedIn is known)
useEffect(() => {
  if (draftLoadedRef.current) return;
  if (editJobId) return; // Edit mode: job data is loaded in a separate effect
  if (isLoggedIn === undefined) return; // auth still loading
  let cancelled = false;
  if (isLoggedIn) {
    fetch(resolveApiUrl("/api/jobs/draft"), { credentials: "include" })
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 404) return null;
        if (!res.ok) return res.json().then((data) => { throw new Error(data?.error || "Failed to load draft"); });
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        draftLoadedRef.current = true;
        if (data?.draft && typeof data.draft === "object") {
          const updatedAt =
            typeof data.draft.updatedAt === "number"
              ? data.draft.updatedAt
              : typeof data.updatedAt === "number"
                ? data.updatedAt
                : undefined;
          applyDraft(data.draft, { updatedAt });
        }
      })
      .catch(() => {
        if (!cancelled) draftLoadedRef.current = true;
      });
  } else {
    draftLoadedRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as JobDraftPayload;
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.savedAt === "number") setDraftSavedAt(parsed.savedAt);
          applyDraft(parsed);
        }
      }
    } catch (_) {}
  }
  return () => { cancelled = true; };
}, [isLoggedIn, editJobId]);

const saveDraftRef = useRef<(() => void) | null>(null);
const saveDraft = async () => {
  if (isDiscardingDraft) return;
  const payload = getDraftPayload();
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    if (isLoggedIn) {
      await fetch(resolveApiUrl("/api/jobs/draft"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
    }
  } catch (_) {}
};
saveDraftRef.current = saveDraft;

// Debounced save when form fields change
useEffect(() => {
  if (isDiscardingDraft) return;
  const t = setTimeout(saveDraft, 1500);
  return () => clearTimeout(t);
}, [
  currentStep,
  jobDescription,
  jobTitle,
  selectedSector,
  selectedMainCategories.join(","),
  selectedSkills.join(","),
  jobLocationType,
  postcode,
  address,
  townCity,
  county,
  urgency,
  preferredStartDate,
  selectedBudget,
  customBudgetMin,
  customBudgetMax,
  isLoggedIn,
]);

// Save draft when leaving page or tab
useEffect(() => {
  const onBeforeUnload = () => {
    if (isDiscardingDraft) return;
    saveDraftRef.current?.();
  };
  const onVisibilityChange = () => {
    if (isDiscardingDraft) return;
    if (document.visibilityState === "hidden") saveDraftRef.current?.();
  };
  window.addEventListener("beforeunload", onBeforeUnload);
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}, []);

const handleVerifyEmailCode = async (e: React.FormEvent) => {
  e.preventDefault();
  if (emailVerificationCode.length !== 4) {
    toast.error("Please enter a 4-digit code");
    return;
  }
  setRegisterError(null);
  setIsVerifyingEmail(true);
  try {
    await verifyRegistrationEmail(emailVerificationCode, verificationEmail);
    setVerificationStep(2);
    setEmailVerificationCode("");
  } catch {
    setRegisterError("Email verification failed");
  } finally {
    setIsVerifyingEmail(false);
  }
};

const handleVerifyPhoneCodeAndPostJob = async (e: React.FormEvent) => {
  e.preventDefault();
  if (phoneVerificationCode.length !== 4) {
    toast.error("Please enter a 4-digit code");
    return;
  }
  setRegisterError(null);
  setIsRegistering(true);
  try {
    const user = await completeRegistration(phoneVerificationCode, verificationEmail);
    setShowEmailVerification(false);
    setVerificationStep(1);
    setEmailVerificationCode("");
    setPhoneVerificationCode("");
    const uploads: { name: string; url: string; mimeType: string; size: number }[] = [];
    if (attachedFiles.length > 0) {
      for (const item of attachedFiles) {
        const form = new FormData();
        form.append("file", item.file);
        const res = await fetch(resolveApiUrl("/api/jobs/upload-attachment"), {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "File upload failed");
        }
        const data = await res.json();
        uploads.push({ name: data.name, url: data.url, mimeType: data.mimeType || "", size: data.size || 0 });
      }
    }
    const newJob = { ...buildJobPayload(user?.id ?? ""), attachments: uploads };
    const createdJob = await addJob(newJob);
    await clearDraft();
    toast.success("Account created and job posted successfully!");
    navigate(`/job/${createdJob.slug || createdJob.id}?tab=quotes`);
  } catch (err) {
    setRegisterError(err instanceof Error ? err.message : "Registration failed");
  } finally {
    setIsRegistering(false);
  }
};

const handleBackFromVerification = () => {
  if (verificationStep > 1) {
    setVerificationStep(verificationStep - 1);
  } else {
    setShowEmailVerification(false);
    setVerificationStep(1);
    setEmailVerificationCode("");
    setPhoneVerificationCode("");
    setRegisterError(null);
  }
};

const handleResendEmailCode = async () => {
  if (isResendingEmail || emailResendTimer > 0) return;
  setIsResendingEmail(true);
  setRegisterError(null);
  try {
    const res = await fetch(resolveApiUrl("/api/auth/register/resend-email"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: verificationEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to resend verification code");
    setEmailResendTimer(120);
    toast.success("Verification code resent to your email");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resend code";
    toast.error(msg);
    setRegisterError(msg);
  } finally {
    setIsResendingEmail(false);
  }
};

const handleResendPhoneCode = async () => {
  if (isResendingPhone || phoneResendTimer > 0) return;
  setIsResendingPhone(true);
  setRegisterError(null);
  try {
    const res = await fetch(resolveApiUrl("/api/auth/register/resend-phone"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: verificationEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to resend verification code");
    setPhoneResendTimer(120);
    toast.success("Verification code resent to your phone");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resend code";
    toast.error(msg);
    setRegisterError(msg);
  } finally {
    setIsResendingPhone(false);
  }
};
  return React.createElement(
    "section",
    { className: "min-h-screen bg-[#f5f5f5] relative z-10", "aria-label": "Post a job page" },
    pageChildren
  );
}