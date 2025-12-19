import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, CheckCircle2, FileText, IdCard, MapPin, MessageCircle, Phone, ShieldCheck, ShoppingCart, Star, Zap } from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import API_BASE_URL from "../config/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useMessenger } from "./MessengerContext";
import { useCategories, useSectors, useServiceCategories } from "../hooks/useSectorsAndCategories";
import InviteToQuoteModal from "./InviteToQuoteModal";
import { useCart } from "./CartContext";
import { allServices, type Service as ServiceDataType } from "./servicesData";
import ServiceAreaMap from "./ServiceAreaMap";
import "./ProfilePage.css";
import serviceVector from "../assets/service_vector.jpg";

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
  }>;
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startConversation } = useMessenger();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "services" | "portfolio" | "reviews">("about");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const { serviceCategories } = useServiceCategories(undefined, undefined, true);
  const { sectors } = useSectors();
  const sectorId = useMemo(() => {
    const name = (profile?.sector || "").trim();
    if (!name) return undefined;
    return sectors.find((s) => s.name === name)?._id;
  }, [sectors, profile?.sector]);
  const { categories } = useCategories(sectorId, undefined, true);
  const { addToCart } = useCart();

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
        console.error("[ProfilePage] fetchProfile error:", e);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const displayName = useMemo(() => {
    if (!profile) return "";
    return (
      profile.tradingName ||
      (profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : "") ||
      profile.name ||
      "User"
    );
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

  const handleMessage = () => {
    if (!profile) return;
    startConversation({
      id: profile.id,
      name: displayName || "User",
      avatar: profile.avatar,
      online: false,
    });
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
    // Static placeholder portfolio (DB-provided portfolio images should come from API).
    return [
      { id: "p1", url: serviceVector, alt: "Project" },
      { id: "p2", url: serviceVector, alt: "Project" },
      { id: "p3", url: serviceVector, alt: "Project" },
      { id: "p4", url: serviceVector, alt: "Project" },
      { id: "p5", url: serviceVector, alt: "Project" },
      { id: "p6", url: serviceVector, alt: "Project" },
    ];
  }, []);

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

  const homeServiceCards = useMemo(() => {
    // Use HomePage/FeaturedServices data source, but show ONLY 3 cards.
    const ids = [1, 4, 7];
    const selected = ids
      .map((sid) => allServices.find((s) => s.id === sid))
      .filter((s): s is ServiceDataType => Boolean(s));
    return selected.slice(0, 3);
  }, []);

  if (loading) {
    return (
      <div className="prolancer-profile min-h-screen">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <main className="pl-container py-10">
          <div className="seller-profile-card text-center text-slate-600">Loading profile...</div>
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

  return (
    <div className="prolancer-profile min-h-screen">
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
                {homeServiceCards.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => navigate(`/service/${service.id}`)}
                    className="bg-white rounded-[10px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(254,138,15,0.4)] overflow-hidden transition-shadow duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Image Section */}
                    <div className="relative h-[110px] md:h-[170px]">
                      <img src={service.image} alt={service.description} className="w-full h-full object-cover" />
                      {/* Badges */}
                      {service.badges && service.badges.length > 0 && (
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 flex flex-col gap-1">
                          {service.badges.slice(0, 2).map((badge, idx) => (
                            <span
                              key={idx}
                              className="bg-[#FE8A0F] text-white text-[9px] md:text-[10px] font-['Poppins',sans-serif] font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-2 md:p-4 flex flex-col flex-1">
                      {/* Provider Info */}
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 min-h-[24px] md:min-h-[32px]">
                        <img
                          src={service.providerImage}
                          alt={service.tradingName}
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                        />
                        <span className="font-['Poppins',sans-serif] text-[11px] md:text-[14px] text-[#2c353f] hover:text-[#FE8A0F] transition-colors truncate">
                          {service.tradingName}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#5b5b5b] mb-2 md:mb-3 h-[28px] md:h-[36px] line-clamp-2">
                        {service.description}
                      </p>

                      {/* Star Rating */}
                      <div className="flex items-center justify-between mb-2 md:mb-3 min-h-[16px] md:min-h-[20px]">
                        {service.reviewCount > 0 ? (
                          <>
                            <div className="flex items-center gap-0.5 md:gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${
                                    star <= Math.floor(service.rating)
                                      ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                      : "fill-[#E5E5E5] text-[#E5E5E5]"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-0.5 md:gap-1">
                              <span className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#2c353f]">
                                {service.rating}
                              </span>
                              <span className="font-['Poppins',sans-serif] text-[9px] md:text-[12px] text-[#8d8d8d]">
                                ({service.completedTasks})
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full" />
                        )}
                      </div>

                      {/* Price and Delivery Section */}
                      <div className="mb-2 md:mb-4">
                        <div className="h-[18px] md:h-[24px] mb-0.5 md:mb-1 flex items-center">
                          {service.originalPrice ? (
                            <div className="flex items-center gap-1 md:gap-2">
                              <span className="font-['Poppins',sans-serif] text-[12px] md:text-[16px] text-[#c0c0c0] line-through">
                                £{service.originalPrice}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-1 md:gap-2">
                          <span className="font-['Poppins',sans-serif] text-[10px] md:text-[13px] text-[#5b5b5b]">
                            <span className="text-[14px] md:text-[18px] text-[#2c353f]">£{service.price}</span>/{service.priceUnit}
                          </span>
                          <div className="flex-shrink-0">
                            {service.deliveryType === "same-day" ? (
                              <div className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 bg-white border-2 border-[#FE8A0F] text-[#FE8A0F] font-['Poppins',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                                <span className="font-medium heartbeat-text">⚡ Same Day</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 bg-[#E6F0FF] border border-[#3D78CB] text-[#3D78CB] font-['Poppins',sans-serif] text-[7px] md:text-[9px] tracking-wide uppercase rounded-sm">
                                <span className="font-medium">Standard</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1.5 md:gap-2 items-center mt-auto">
                        <button
                          className="w-[80%] h-[26px] md:h-[32px] bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_15px_rgba(254,138,15,0.6)] text-white rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/service/${service.id}`);
                          }}
                        >
                          <Zap className="w-3 h-3 md:w-4 md:h-4" />
                          Buy Now!
                        </button>
                        <button
                          className="w-[80%] h-[26px] md:h-[32px] bg-white border border-[#FE8A0F] hover:bg-[#FFF5EB] hover:shadow-[0_0_8px_rgba(254,138,15,0.3)] text-[#FE8A0F] rounded-full font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-[13px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(
                              {
                                id: String(service.id),
                                title: service.description,
                                seller: service.tradingName,
                                price: parseFloat(service.price),
                                image: service.image,
                                rating: service.rating,
                              },
                              1
                            );
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="portfolio-grid">
                {portfolioImages.map((img) => (
                  <a key={img.id} className="portfolio-item" href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt={img.alt} loading="lazy" />
                    <div className="portfolio-overlay">
                      <span className="portfolio-label">View</span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                {reviews.length === 0 ? (
                  <p className="text-slate-500">No reviews yet.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="review-row">
                      {r.avatar ? <img className="review-avatar" src={r.avatar} alt={r.name} /> : <div className="review-avatar" />}
                      <div>
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
                      </div>
                    </div>
                  ))
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
    </div>
  );
}


