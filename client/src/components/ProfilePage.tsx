import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Award, CheckCircle2, FileText, IdCard, MapPin, MessageCircle, Phone, ShieldCheck, ShoppingCart, Star, Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import API_BASE_URL, { resolveApiUrl } from "../config/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useMessenger } from "./MessengerContext";
import { useCategories, useSectors, useServiceCategories } from "../hooks/useSectorsAndCategories";
import InviteToQuoteModal from "./InviteToQuoteModal";
import { useCart } from "./CartContext";
import type { Service as ServiceDataType } from "./servicesData";
import ServiceAreaMap from "./ServiceAreaMap";
import { Skeleton } from "./ui/skeleton";
import "./ProfilePage.css";
import serviceVector from "../assets/service_vector.jpg";
import { SEOHead } from "./SEOHead";
import PortfolioGalleryPreview from "./PortfolioGalleryPreview";

// SmartImageLayers component for blur background effect
function SmartImageLayers({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  if (!src) {
    return <div className="absolute inset-0 bg-gray-200" aria-hidden="true" />;
  }

  return (
    <>
      {/* Blurred background layer */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover scale-110 blur-3xl opacity-85"
        decoding="async"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-black/15"
        aria-hidden="true"
      />
      {/* Foreground image with proper aspect ratio */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
        decoding="async"
        loading="lazy"
      />
    </>
  );
}

type PublicProfile = {
  bio?: string;
  coverImage?: string;
  qualifications?: string;
  certifications?: string;
  portfolio?: Array<{
    id?: string;
    image: string;
    title: string;
    description: string;
  }>;
};

type ProfileData = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  tradingName?: string;
  avatar?: string;
  sector?: string;
  townCity?: string;
  county?: string;
  address?: string;
  postcode?: string;
  travelDistance?: string;
  completedJobs?: number;
  createdAt?: string;
  services?: string[];
  aboutService?: string;
  hasTradeQualification?: "yes" | "no";
  hasPublicLiability?: "yes" | "no";
  professionalIndemnityAmount?: number | null;
  insuranceExpiryDate?: string | Date | null;
  publicProfile?: PublicProfile;
  verification?: {
    email?: { status?: string };
    phone?: { status?: string };
    address?: { status?: string };
    idCard?: { status?: string };
    paymentMethod?: { status?: string };
    publicLiabilityInsurance?: { status?: string };
  };
  ratingAverage?: number;
  ratingCount?: number;
  reviews?: Array<{
    id: string;
    name: string;
    stars: number;
    text: string;
    createdAt?: string | Date;
    response?: { text: string; respondedAt?: string } | null;
  }>;
};

// Helper function to resolve media URLs (images/videos)
const resolveMediaUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return resolveApiUrl(url);
  }
  return url;
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { startConversation } = useMessenger();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "services" | "portfolio" | "reviews">("about");

  // Set active tab from location state if provided
  useEffect(() => {
    const state = location.state as { activeTab?: "about" | "services" | "portfolio" | "reviews" } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [portfolioGalleryOpen, setPortfolioGalleryOpen] = useState(false);
  const [portfolioGalleryIndex, setPortfolioGalleryIndex] = useState(0);

  const { serviceCategories } = useServiceCategories(undefined, undefined, true);
  const { sectors } = useSectors();
  const sectorId = useMemo(() => {
    const name = (profile?.sector || "").trim();
    if (!name) return undefined;
    return sectors.find((s) => s.name === name)?._id;
  }, [sectors, profile?.sector]);
  const { categories } = useCategories(sectorId, undefined, true);
  const { addToCart } = useCart();

  // Fetch services for this professional
  const [homeServiceCards, setHomeServiceCards] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      if (!id) return;
      
      try {
        setServicesLoading(true);
        const { resolveApiUrl } = await import("../config/api");
        const response = await fetch(
          resolveApiUrl(`/api/services?professionalId=${id}&activeOnly=true&status=active&limit=100`),
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          const transformed = (data.services || []).map((s: any) => ({
            id: parseInt(s._id?.slice(-8), 16) || Math.floor(Math.random() * 10000),
            image: s.images?.[0] || s.portfolioImages?.[0] || "",
            providerName: typeof s.professional === 'object' 
              ? (s.professional.tradingName || 'Professional')
              : "",
            tradingName: typeof s.professional === 'object' 
              ? s.professional.tradingName || ""
              : "",
            providerImage: typeof s.professional === 'object' 
              ? s.professional.avatar || ""
              : "",
            description: s.title || "",
            category: typeof s.serviceCategory === 'object' && typeof s.serviceCategory.sector === 'object'
              ? s.serviceCategory.sector.name || ""
              : "",
            subcategory: typeof s.serviceCategory === 'object'
              ? s.serviceCategory.name || ""
              : "",
            detailedSubcategory: typeof s.serviceSubCategory === 'object'
              ? s.serviceSubCategory.name || ""
              : undefined,
            rating: s.rating || 0,
            reviewCount: s.reviewCount || 0,
            completedTasks: s.completedTasks || 0,
            price: `£${s.price?.toFixed(2) || '0.00'}`,
            // Only use originalPrice if discount is still valid (within date range)
            originalPrice: (s.originalPrice && (
              (!s.originalPriceValidFrom || new Date(s.originalPriceValidFrom) <= new Date()) &&
              (!s.originalPriceValidUntil || new Date(s.originalPriceValidUntil) >= new Date())
            ))
              ? `£${s.originalPrice.toFixed(2)}`
              : undefined,
            originalPriceValidFrom: s.originalPriceValidFrom || null,
            originalPriceValidUntil: s.originalPriceValidUntil || null,
            priceUnit: s.priceUnit || "fixed",
            badges: s.badges || [],
            deliveryType: s.deliveryType || "standard",
            postcode: s.postcode || "",
            location: s.location || "",
            latitude: s.latitude,
            longitude: s.longitude,
            highlights: s.highlights || [],
            addons: s.addons?.map((a: any) => ({
              id: a.id || a._id,
              name: a.name,
              description: a.description || "",
              price: a.price,
            })) || [],
            idealFor: s.idealFor || [],
            specialization: "",
            packages: s.packages?.map((p: any) => ({
              id: p.id || p._id,
              name: p.name,
              price: `£${p.price?.toFixed(2) || '0.00'}`,
              originalPrice: p.originalPrice ? `£${p.originalPrice.toFixed(2)}` : undefined,
              originalPriceValidFrom: p.originalPriceValidFrom || null,
              originalPriceValidUntil: p.originalPriceValidUntil || null,
              priceUnit: "fixed",
              description: p.description || "",
              highlights: [],
              features: p.features || [],
              deliveryTime: p.deliveryDays ? `${p.deliveryDays} days` : undefined,
              revisions: p.revisions || "",
            })) || [],
            skills: s.skills || [],
            responseTime: s.responseTime || "",
            portfolioImages: s.portfolioImages || [],
            _id: s._id,
          }));
          setHomeServiceCards(transformed);
        } else {
          setHomeServiceCards([]);
        }
      } catch (error) {
        // console.error("Error fetching services:", error);
        setHomeServiceCards([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [id]);

  // Default cover images (Unsplash) when user hasn't set a custom cover.
  // Chosen to be "service provider" themed and sector-relevant where possible.
  const defaultCoverImageUrl = useMemo(() => {
    // DB-provided coverImage should be shown if present; this is only the static fallback.
    return serviceVector;
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setError("Profile ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setProfile(null);

        const response = await fetch(`${API_BASE_URL}/api/auth/profile/${id}`);

        if (!response.ok) {
          setError(response.status === 404 ? "Profile not found" : "Failed to load profile");
          return;
        }

        const data = await response.json();
        setProfile(data?.profile ?? null);
      } catch (e) {
        // console.error("[ProfilePage] fetchProfile error:", e);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const displayName = useMemo(() => {
    if (!profile) return "";
    return (profile.tradingName || "Professional").trim();
  }, [profile]);

  const tradingName = useMemo(() => (profile?.tradingName || "").trim(), [profile?.tradingName]);

  const coverImageUrl = (profile?.publicProfile?.coverImage || "").trim() || defaultCoverImageUrl;

  const avatarInitials = useMemo(() => {
    const raw = (tradingName || displayName || "User").trim();
    if (!raw) return "U";
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : "") || "";
    return (first + last).toUpperCase();
  }, [tradingName, displayName]);

  const looksLikeObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

  const serviceCategoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of serviceCategories || []) {
      if (c?._id && c?.name) map[c._id] = c.name;
    }
    return map;
  }, [serviceCategories]);

  const serviceSubCategoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of serviceCategories || []) {
      for (const sc of c?.subCategories || []) {
        if (sc?._id && sc?.name) map[sc._id] = sc.name;
      }
    }
    return map;
  }, [serviceCategories]);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories || []) {
      if (c?._id && c?.name) map[c._id] = c.name;
    }
    return map;
  }, [categories]);

  const subCategoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories || []) {
      for (const sc of c?.subCategories || []) {
        if (sc?._id && sc?.name) map[sc._id] = sc.name;
      }
    }
    return map;
  }, [categories]);

  const serviceLabels = useMemo(() => {
    const raw = (profile?.services || []).filter(Boolean).map((s) => String(s).trim()).filter(Boolean);
    // Support BOTH storages:
    // - registration stores Category/SubCategory IDs (categories/subcategories endpoints)
    // - some flows store ServiceCategory/ServiceSubCategory IDs (service-categories endpoint)
    // - legacy may store plain names
    const mapped = raw.map(
      (s) =>
        subCategoryNameById[s] ||
        categoryNameById[s] ||
        serviceSubCategoryNameById[s] ||
        serviceCategoryNameById[s] ||
        s
    );
    const cleaned = mapped.filter((s) => !looksLikeObjectId(s)); // hide raw IDs if not mapped to a name
    return Array.from(new Set(cleaned));
  }, [
    profile?.services,
    subCategoryNameById,
    categoryNameById,
    serviceCategoryNameById,
    serviceSubCategoryNameById,
  ]);

  const topCategory = useMemo(() => {
    return serviceLabels[0] || "";
  }, [serviceLabels]);

  const displayLocation = useMemo(() => {
    const parts = [profile?.townCity, profile?.county].filter(Boolean) as string[];
    if (parts.length > 0) return parts.join(", ");
    return profile?.address || "Location not specified";
  }, [profile?.townCity, profile?.county, profile?.address]);

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return "Unknown";
    const d = new Date(profile.createdAt);
    if (Number.isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }, [profile?.createdAt]);

  const rating = typeof profile?.ratingAverage === "number" ? profile.ratingAverage : 0;
  const ratingCount = typeof profile?.ratingCount === "number" ? profile.ratingCount : 0;
  const ratingPercent = Math.min(100, Math.max(0, (rating / 5) * 100));
  const completedJobs = typeof profile?.completedJobs === "number" ? profile.completedJobs : 0;

  const handleMessage = async () => {
    if (!profile || !id) return;
    try {
      await startConversation(id);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const bioText = useMemo(() => {
    return (profile?.publicProfile?.bio || profile?.aboutService || "").trim();
  }, [profile?.publicProfile?.bio, profile?.aboutService]);

  const qualificationsText = useMemo(() => {
    return (profile?.publicProfile?.qualifications || "").trim();
  }, [profile?.publicProfile?.qualifications]);

  const certificationsText = useMemo(() => {
    return (profile?.publicProfile?.certifications || "").trim();
  }, [profile?.publicProfile?.certifications]);

  const qualificationItems = useMemo(() => {
    // Convert free-form text into list items similar to the design mock.
    // Supports:
    // - one item per line
    // - optional meta line (next line containing ":" like "Obtained: 2012")
    // - inline meta via " | " or " - "
    const lines = `${qualificationsText}\n${certificationsText}`
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);

    const items: Array<{ title: string; meta?: string; verified: boolean }> = [];
    const isUnverified = (s: string) => /(pending|unverified|not verified)/i.test(s);

    // Trade qualification flag as a top item (if present)
    if (profile?.hasTradeQualification === "yes") {
      items.push({ title: "Trade qualification", meta: "Verified", verified: true });
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw) continue;

      // If this is a meta-looking line and we don't have a preceding title, skip.
      const looksLikeMetaOnly = /^[a-z\s]+:/i.test(raw) && raw.length < 60;
      if (looksLikeMetaOnly) continue;

      let title = raw;
      let meta = "";

      if (raw.includes("|")) {
        const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
        title = parts[0] || raw;
        meta = parts.slice(1).join(" • ");
      } else if (raw.includes(" - ")) {
        const parts = raw.split(" - ").map((p) => p.trim()).filter(Boolean);
        title = parts[0] || raw;
        meta = parts.slice(1).join(" • ");
      } else {
        const next = lines[i + 1] || "";
        if (next && /^[a-z\s]+:/i.test(next)) {
          meta = next;
          i++; // consume meta line
        }
      }

      const verified = !isUnverified(title) && !isUnverified(meta);
      items.push({ title, meta: meta || undefined, verified });
    }

    // Deduplicate by title+meta (keep order)
    const seen = new Set<string>();
    return items.filter((it) => {
      const key = `${it.title}::${it.meta || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profile?.hasTradeQualification, qualificationsText, certificationsText]);

  const insuranceInfo = useMemo(() => {
    const hasPublicLiability = profile?.hasPublicLiability === "yes";
    const raw = typeof profile?.professionalIndemnityAmount === "number" ? profile.professionalIndemnityAmount : 0;
    // Treat 0 (and the old accidental default 1) as "not set"
    const indemnity = raw <= 1 ? 0 : raw;
    const expiryRaw = profile?.insuranceExpiryDate ?? null;
    const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
    const expiry =
      expiryDate && !Number.isNaN(expiryDate.getTime())
        ? expiryDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "";

    return {
      hasPublicLiability,
      indemnity,
      expiry,
    };
  }, [profile?.hasPublicLiability, profile?.professionalIndemnityAmount, profile?.insuranceExpiryDate]);

  const hasQualificationsInfo = useMemo(() => {
    return profile?.hasTradeQualification === "yes" || Boolean(qualificationsText) || Boolean(certificationsText);
  }, [profile?.hasTradeQualification, qualificationsText, certificationsText]);

  const hasInsuranceInfo = useMemo(() => {
    const hasIndemnity = typeof insuranceInfo.indemnity === "number" && insuranceInfo.indemnity > 0;
    return insuranceInfo.hasPublicLiability || hasIndemnity || Boolean(insuranceInfo.expiry);
  }, [insuranceInfo.hasPublicLiability, insuranceInfo.indemnity, insuranceInfo.expiry]);

  const hasSkillsInfo = serviceLabels.length > 0;

  const hasAnyAboutInfo = useMemo(() => {
    const hasBio = Boolean(bioText);
    return hasBio || hasSkillsInfo || hasQualificationsInfo || hasInsuranceInfo;
  }, [
    bioText,
    hasSkillsInfo,
    hasQualificationsInfo,
    hasInsuranceInfo,
  ]);

  const verificationItems = useMemo(() => {
    const statusOf = (v?: { status?: string }) => (v?.status || "not-started") as string;
    const phoneStatus = statusOf(profile?.verification?.phone);
    const addressStatus = statusOf(profile?.verification?.address);
    const identityStatus = statusOf(profile?.verification?.idCard);
    const insuranceStatus = statusOf(profile?.verification?.publicLiabilityInsurance);

    const isVerified = (s: string) => s === "verified" || s === "completed";
    const labelFor = (base: string, status: string) => `${base} ${isVerified(status) ? "verified" : "not verified"}`;

    return [
      { key: "phone", label: labelFor("Phone", phoneStatus), status: phoneStatus, Icon: Phone },
      { key: "identity", label: labelFor("Identity", identityStatus), status: identityStatus, Icon: IdCard },
      { key: "address", label: labelFor("Address", addressStatus), status: addressStatus, Icon: MapPin },
      { key: "insurance", label: labelFor("Insurance", insuranceStatus), status: insuranceStatus, Icon: ShieldCheck },
    ] as const;
  }, [profile?.verification]);

  const isFullyVerified = useMemo(() => {
    const isPassed = (s?: string) => {
      const v = String(s || "not-started");
      return v === "verified" || v === "completed";
    };

    const v = profile?.verification || {};
    const required = [
      (v as any)?.email?.status,
      (v as any)?.phone?.status,
      (v as any)?.address?.status,
      (v as any)?.paymentMethod?.status,
      (v as any)?.idCard?.status,
      (v as any)?.publicLiabilityInsurance?.status,
    ];

    return required.every((s) => isPassed(String(s || "not-started")));
  }, [profile?.verification]);

  const serviceAreaText = useMemo(() => {
    const milesRaw = (profile?.travelDistance || "").toString().trim();
    const milesMatch = milesRaw.match(/(\d+(\.\d+)?)/);
    const miles = milesMatch?.[1] || "";

    const city = (profile?.townCity || "").trim();
    const postcode = (profile?.postcode || "").trim().toUpperCase();
    const outward = postcode ? postcode.split(/\s+/)[0] : "";

    if (!miles || !city || !outward) return "";

    // Requested: show outward code only, mask inward code as "xxx"
    return `${miles} miles within ${city}, ${outward} xxx`;
  }, [profile?.travelDistance, profile?.townCity, profile?.county, profile?.postcode]);

  const portfolioImages = useMemo(() => {
    // Use actual portfolio from profile API if available
    const portfolio = profile?.publicProfile?.portfolio || [];
    if (portfolio.length > 0) {
      return portfolio.map((item: any, index: number) => {
        // Resolve media URL - handle both local paths and external URLs
        const rawUrl = item.url || item.image;
        const itemUrl = rawUrl && !rawUrl.startsWith('http') && rawUrl.startsWith('/') 
          ? resolveApiUrl(rawUrl)
          : rawUrl || serviceVector;
        
        return {
          id: item.id || `p${index + 1}`,
          url: itemUrl,
          alt: item.title || `Portfolio item ${index + 1}`,
          title: item.title,
          description: item.description,
          type: item.type || 'image',
        };
      });
    }
    // Fallback to static placeholder if no portfolio
    return [
      { id: "p1", url: serviceVector, alt: "Project", title: undefined, description: undefined, type: 'image' },
      { id: "p2", url: serviceVector, alt: "Project", title: undefined, description: undefined, type: 'image' },
      { id: "p3", url: serviceVector, alt: "Project", title: undefined, description: undefined, type: 'image' },
      { id: "p4", url: serviceVector, alt: "Project", title: undefined, description: undefined, type: 'image' },
      { id: "p5", url: serviceVector, alt: "Project", title: undefined, description: undefined, type: 'image' },
      { id: "p6", url: serviceVector, alt: "Project", title: undefined, description: undefined, type: 'image' },
    ];
  }, [profile?.publicProfile?.portfolio]);

  const reviews = useMemo(() => {
    const list = profile?.reviews || [];
    return list.map((r) => {
      const createdAt = r.createdAt ? new Date(r.createdAt) : null;
      const time =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "";
      const stars = typeof r.stars === "number" ? Math.max(0, Math.min(5, Math.round(r.stars))) : 0;
      return { ...r, time, stars };
    });
  }, [profile?.reviews]);

  const getTwoLetterInitials = (name: string | undefined): string => {
    const raw = (name || "").trim();
    if (!raw) return "A";
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "A";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + (last || first)).toUpperCase().slice(0, 2);
  };

  const [reviewAvatarErrors, setReviewAvatarErrors] = useState<Set<string>>(new Set());
  const [expandedReviewResponses, setExpandedReviewResponses] = useState<Set<string>>(new Set());
  const toggleReviewResponse = (reviewId: string) => {
    setExpandedReviewResponses(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };
  const showReviewAvatarImage = (reviewId: string, avatarUrl: string | undefined) =>
    Boolean(avatarUrl && !reviewAvatarErrors.has(reviewId));

  // homeServiceCards is now fetched from API above

  if (loading) {
    return (
      <div className="prolancer-profile min-h-screen">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <main className="pl-container py-10">
          {/* Cover Image Skeleton */}
          <Skeleton className="w-full h-64 md:h-80 rounded-lg mb-6" />
          
          {/* Profile Header Skeleton */}
          <div className="seller-profile-card mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-1/3 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            </div>
          </div>
          
          {/* About Section Skeleton */}
          <div className="seller-profile-card mb-6 space-y-3">
            <Skeleton className="h-5 w-1/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          
          {/* Services Section Skeleton */}
          <div className="seller-profile-card mb-6">
            <Skeleton className="h-5 w-1/3 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-full h-40 rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="prolancer-profile min-h-screen">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <main className="pl-container py-10">
          <div className="seller-profile-card text-center">
            <h1 className="seller-name justify-center">Profile Not Found</h1>
            <p className="seller-subtitle">{error || "The profile you're looking for doesn't exist."}</p>
            <div className="mt-6">
              <button className="action-btn message-button" onClick={() => navigate("/")}>
              Go Home
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const avatarUrl = profile.avatar;
  // TODO: wire to real presence when backend supports it.
  const isOnline = true;

  // Generate SEO metadata (use ratingAverage and publicProfile.bio from API)
  const seoTitle = `Hire ${tradingName || displayName} - Verified ${topCategory || 'Professional'} | Sortars`;
  const bioForSeo = (profile.publicProfile as { bio?: string })?.bio || (profile as { bio?: string }).bio || "";
  const seoDescription = bioForSeo
    ? `${bioForSeo.substring(0, 120)}... ${rating > 0 ? `★ ${rating}/5` : ""} ${completedJobs ? `| ${completedJobs}+ jobs completed` : ""} ${displayLocation ? `| ${displayLocation}` : ""}`
    : `Book ${tradingName || displayName}, a trusted ${topCategory || "professional"}${displayLocation ? ` in ${displayLocation}` : ""} on Sortars. ${rating > 0 ? `Rated ${rating}/5 stars.` : ""} ${completedJobs ? `${completedJobs}+ successful projects.` : ""} View services, read reviews, and hire online.`;

  return (
    <div className="prolancer-profile min-h-screen">
      {/* SEO Meta Tags */}
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogImage={avatarUrl || coverImageUrl}
        ogType="profile"
      />

      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Full-width cover (flush to both sides) */}
      <div className="seller-cover" style={{ backgroundImage: `url(${coverImageUrl})` }} />

      <section className="pl-container pt-6">
        <div className="seller-profile-card">
          {/* Always one row via CSS grid: avatar | details | buttons */}
          <div className="profile-card-grid">
            {/* col 1: avatar */}
            <div className="profile-card-avatar pt-1">
              <div className="seller-avatar-wrap">
                {avatarUrl ? (
                  <ImageWithFallback src={avatarUrl} alt={displayName} className="seller-avatar" />
                ) : (
                  <div className="seller-avatar seller-avatar-initials" aria-label={displayName}>
                    {avatarInitials}
                      </div>
                )}
                {isOnline && <span className="online-badge" aria-label="Online" title="Online" />}
                      </div>
                    </div>

            {/* col 2: details */}
            <div className="profile-card-details min-w-0">
              <div className="seller-name">
                {tradingName || displayName}
                {isFullyVerified && (
                  <span className="verified-dot" title="Verified" aria-label="Verified">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  </span>
                )}
                  </div>

              {/* One primary category under trading name (not a badge) */}
              {topCategory && (
                <div className="seller-title" aria-label="Primary category">
                  {topCategory}
                </div>
              )}

              <div className="seller-subtitle">Member since {memberSince}</div>

              <div className="profile-card-meta mt-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#002f77] flex-shrink-0" />
                  <span className="truncate">{displayLocation}</span>
                </div>
                <div className="profile-stats-inline" aria-label="Rating and completed jobs">
                  <Star
                    className="stat-star is-active"
                    aria-hidden="true"
                  />
                  <span className="stat-rating">{rating.toFixed(1)}</span>
                  <span className="stat-reviews">({ratingCount} reviews)</span>
                  <span className="stat-dot" aria-hidden="true">
                    ·
                  </span>
                  <span className="stat-completed">
                    {completedJobs} completed jobs
                  </span>
                </div>
              </div>

            </div>

            {/* col 3: buttons only */}
            <div>
              <div className="profile-card-actions flex flex-col gap-3">
                <button
                  className="action-btn quote-button"
                  onClick={() => setIsQuoteModalOpen(true)}
                >
                  <FileText className="w-5 h-5" />
                  <span>Get Quote</span>
                </button>
                <button className="action-btn message-button" onClick={handleMessage}>
                  <MessageCircle className="w-5 h-5" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="layout">
          <div className="white-padding">
            <div className="nav-tabs" role="tablist" aria-label="Seller tabs">
              <button className={`nav-link ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                About Me
              </button>
              <button className={`nav-link ${activeTab === "services" ? "active" : ""}`} onClick={() => setActiveTab("services")}>
                My services
              </button>
              <button className={`nav-link ${activeTab === "portfolio" ? "active" : ""}`} onClick={() => setActiveTab("portfolio")}>
                Portfolios
              </button>
              <button className={`nav-link ${activeTab === "reviews" ? "active" : ""}`} onClick={() => setActiveTab("reviews")}>
                  Reviews
              </button>
            </div>

            {activeTab === "about" && (
              <div>
                {!hasAnyAboutInfo ? (
                  <p className="text-slate-500">No profile information available.</p>
                ) : (
                  <div className="space-y-6">
                    {bioText && (
                      <div>
                        <h3 className="section-title">Bio</h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{bioText}</p>
                      </div>
                    )}

                    {hasSkillsInfo && (
                      <div>
                        <h3 className="section-title">Skills &amp; Expertise</h3>
                        <div className="badges" aria-label="skills and expertise">
                          {serviceLabels.map((label) => (
                            <span key={label} className="badge-pill">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasQualificationsInfo && (
                      <div className="about-modern-block">
                        <h3 className="section-title">Qualifications &amp; Certificates</h3>
                        {qualificationItems.length === 0 ? (
                          <p className="text-slate-500">No qualification information available.</p>
                        ) : (
                          <div className="qa-list" role="list" aria-label="Qualifications and certificates">
                            {qualificationItems.map((it, idx) => (
                              <div key={`${it.title}-${idx}`} className="qa-item" role="listitem">
                                <div className="qa-left">
                                  <span className="qa-icon" aria-hidden="true">
                                    <Award className="w-4 h-4" />
                                  </span>
                                  <div className="qa-text">
                                    <div className="qa-title">{it.title}</div>
                                    {it.meta && <div className="qa-meta">{it.meta}</div>}
                      </div>
                    </div>
                                <div className="qa-right" aria-label={it.verified ? "Verified" : "Not verified"}>
                                  {it.verified ? <CheckCircle2 className="qa-check" /> : null}
                    </div>
                            </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {hasInsuranceInfo && (
                      <div className="about-modern-block">
                        <h3 className="section-title">Public Liability Insurance</h3>
                        <div className={`insurance-card ${insuranceInfo.hasPublicLiability ? "is-verified" : "is-neutral"}`}>
                          <div className="insurance-head">
                            <div className="insurance-badge" aria-hidden="true">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="insurance-main">
                              <div className="insurance-title">
                                {insuranceInfo.hasPublicLiability ? "Insured" : "Insurance information"}
                                {insuranceInfo.hasPublicLiability ? <CheckCircle2 className="insurance-check" /> : null}
                              </div>
                              <div className="insurance-lines">
                                {typeof insuranceInfo.indemnity === "number" && insuranceInfo.indemnity > 0 ? (
                                  <div>Professional indemnity up to £{Number(insuranceInfo.indemnity).toLocaleString("en-GB")}</div>
                                ) : insuranceInfo.hasPublicLiability ? (
                                  <div>Public liability insurance: Yes</div>
                                ) : null}
                                {insuranceInfo.expiry ? <div>Valid until: {insuranceInfo.expiry}</div> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {servicesLoading ? (
                  <div className="col-span-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-[16px] shadow-sm overflow-hidden">
                          <Skeleton className="w-full h-40 rounded-t-[16px]" />
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-4 w-1/2 rounded" />
                            <Skeleton className="h-6 w-20 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : homeServiceCards.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">No services available yet.</p>
                  </div>
                ) : (
                  homeServiceCards.map((service) => (
                    <div
                      key={service._id || service.id}
                      className="bg-white rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 cursor-pointer flex flex-col"
                    >
                    {/* Image Section */}
                    <div className="relative w-full overflow-hidden bg-gray-100" style={{ height: '180px' }}>
                      <img
                        src={resolveMediaUrl(service.image)}
                        alt={service.description}
                        className="w-full h-full object-cover"
                        style={{ minWidth: '100%', minHeight: '100%', objectFit: 'cover' }}
                      />
                      {/* Emergency Badge - Top Right */}
                      {service.badges && service.badges.length > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-[#FE8A0F] text-white text-[11px] font-['Poppins',sans-serif] font-semibold px-3 py-1 rounded-[6px]">
                            {service.badges[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      {/* Provider Info with Avatar */}
                      <div className="flex items-center gap-2">
                        <img
                          src={service.providerImage}
                          alt={service.tradingName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f] leading-tight">
                            {service.tradingName.length > 8 ? `${service.tradingName.slice(0, 8)}...` : service.tradingName}
                          </h3>
                          {service.providerIsVerified && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#E6F0FF] text-[#3D78CB] rounded text-[8px] font-['Poppins',sans-serif] font-medium">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#666666] leading-snug line-clamp-2">
                        {service.description}
                      </p>

                      {/* Star Rating - only when there is at least one review or score */}
                      {((service.rating ?? 0) > 0 || (service.reviewCount ?? 0) > 0) && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.floor(service.rating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          ))}
                          <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f] ml-1">
                            {service.rating || 0}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[13px] text-[#999999]">
                            ({service.reviewCount || 0})
                          </span>
                        </div>
                      )}

                      {/* Price and Delivery Badge */}
                      <div className="flex items-start justify-between gap-2">
                        {/* Price Section */}
                        <div className="flex flex-col gap-1 min-h-[56px]">
                          <div className="font-['Poppins',sans-serif] text-[24px] font-bold text-[#2c353f]">
                            £{service.originalPrice || service.price}
                            <span className="text-[14px] font-normal text-[#666666]">/{service.priceUnit}</span>
                          </div>
                          {service.originalPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#999999] line-through">
                                £{service.price}
                              </span>
                              <div className="px-2 py-0.5 bg-[#E6F0FF] rounded-md">
                                <span className="font-['Poppins',sans-serif] text-[10px] text-[#3D78CB] font-semibold">
                                  {Math.round(((parseFloat(service.price) - parseFloat(service.originalPrice || '0')) / parseFloat(service.price)) * 100)}% OFF
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-[20px]">{/* Spacer to maintain height */}</div>
                          )}
                        </div>
                        
                        {/* Delivery Badge */}
                        <div className="flex-shrink-0">
                          {service.deliveryType === "same-day" ? (
                            <div className="px-2 py-1 border-2 border-[#FE8A0F] rounded-[6px]">
                              <span className="font-['Poppins',sans-serif] text-[10px] font-semibold text-[#FE8A0F] uppercase tracking-wide">
                                ⚡ Same Day
                              </span>
                            </div>
                          ) : (
                            <div className="px-2 py-1 border border-[#3D78CB] bg-[#E6F0FF] rounded-[6px] flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#3D78CB" strokeWidth="2">
                                <path d="M3 9h4l3 9 3-16 3 9h4"/>
                              </svg>
                              <span className="font-['Poppins',sans-serif] text-[9px] font-semibold text-[#3D78CB] uppercase tracking-wide">
                                Standard
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 mt-auto pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/service/${service.slug || service._id || service.id}`);
                          }}
                          className="w-full bg-[#FE8A0F] hover:bg-[#FF9A1F] text-white font-['Poppins',sans-serif] text-[14px] font-semibold py-3 rounded-[8px] transition-colors flex items-center justify-center gap-2"
                        >
                          <span>⚡</span>
                          <span>Buy Now!</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(
                              {
                                id: String(service.id),
                                serviceId: String(service._id || service.id),
                                title: service.description,
                                seller: service.tradingName,
                                price: parseFloat(service.price),
                                image: service.image,
                                rating: service.rating,
                                priceUnit: service.priceUnit || 'fixed',
                              },
                              1
                            );
                          }}
                          className="w-full bg-white hover:bg-gray-50 text-[#FE8A0F] border-2 border-[#FE8A0F] font-['Poppins',sans-serif] text-[14px] font-semibold py-3 rounded-[8px] transition-colors flex items-center justify-center gap-2"
                        >
                          <span>🛒</span>
                          <span>Add to cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="portfolio-grid">
                {portfolioImages.map((img, index) => (
                  <div
                    key={img.id}
                    className="portfolio-item cursor-pointer"
                    onClick={() => {
                      setPortfolioGalleryIndex(index);
                      setPortfolioGalleryOpen(true);
                    }}
                  >
                    {img.type === 'video' ? (
                      <video
                        src={img.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img 
                        src={img.url} 
                        alt={img.alt} 
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== serviceVector) {
                            target.src = serviceVector;
                          }
                        }}
                      />
                    )}
                    <div className="portfolio-overlay">
                      <span className="portfolio-label">View</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                {reviews.length === 0 ? (
                  <p className="text-slate-500">No reviews yet.</p>
                ) : (
                  reviews.map((r) => {
                    const hasResponse = (r as { response?: { text: string } | null }).response?.text;
                    const isExpanded = expandedReviewResponses.has(r.id);
                    return (
                    <div key={r.id} className="review-row">
                      <div
                        className="review-avatar-wrap"
                        data-has-image={showReviewAvatarImage(r.id, (r as { avatar?: string }).avatar)}
                      >
                        {showReviewAvatarImage(r.id, (r as { avatar?: string }).avatar) ? (
                          <img
                            className="review-avatar"
                            src={resolveMediaUrl((r as { avatar?: string }).avatar)}
                            alt={r.name}
                            onError={() => setReviewAvatarErrors((prev) => new Set(prev).add(r.id))}
                          />
                        ) : null}
                        <div className="review-avatar review-avatar-initials">
                          {getTwoLetterInitials(r.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="review-head">
                          <div className="review-name">{r.name}</div>
                          <div className="review-time">{r.time}</div>
                        </div>
                        <div className={`review-stars ${r.stars === 0 ? "stars-0" : ""}`} aria-label={`${r.stars} stars`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < r.stars ? "★" : "☆"}</span>
                          ))}
                        </div>
                        <div className="review-text">{r.text}</div>
                        {hasResponse && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => toggleReviewResponse(r.id)}
                              className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                {profile?.tradingName || profile?.firstName || "Professional"}&apos;s Response
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 ml-2 pl-3 border-l-2 border-slate-200">
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{(r as { response: { text: string; respondedAt?: string } }).response.text}</p>
                                {(r as { response: { respondedAt?: string } }).response.respondedAt && (
                                  <p className="text-xs text-slate-400 mt-2">
                                    {new Date((r as { response: { respondedAt: string } }).response.respondedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })
                )}
                      </div>
                    )}
          </div>

          <aside className="sidebar" aria-label="Right sidebar">
            <div className="sidebar-stack">
              <div className="widget" aria-label="Verification">
                <div className="widget-title">Verification</div>

                <div className="verification-list" role="list">
                  {verificationItems.map(({ key, label, status, Icon }) => (
                    <div key={key} className="verification-item" role="listitem">
                      <div className={`verification-icon status-${status}`}>
                        <Icon className="w-4 h-4" />
                  </div>
                      <div className="verification-content">
                        <div className="verification-text">
                          <div className="verification-label">{label}</div>
                  </div>
                </div>
                </div>
                  ))}
                </div>
              </div>

              <div className="widget" aria-label="Service area">
                <div className="widget-title">Service area</div>
                {serviceAreaText ? (
                  <p className="text-slate-700 text-sm leading-relaxed">{serviceAreaText}</p>
                ) : (
                  <p className="text-slate-500 text-sm">No service area information available.</p>
                )}

                <ServiceAreaMap
                  townCity={profile.townCity}
                  postcode={profile.postcode}
                  travelDistance={profile.travelDistance}
                  className="mt-3"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer />

      <InviteToQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        professionalName={tradingName || displayName}
        professionalId={profile.id}
        category={topCategory}
      />

      {/* Portfolio Gallery Preview */}
      {portfolioImages && portfolioImages.length > 0 && (
        <PortfolioGalleryPreview
          items={portfolioImages}
          initialIndex={portfolioGalleryIndex}
          open={portfolioGalleryOpen}
          onClose={() => setPortfolioGalleryOpen(false)}
        />
      )}
    </div>
  );
}


