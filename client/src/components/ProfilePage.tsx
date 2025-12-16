import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, FileText, IdCard, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import API_BASE_URL from "../config/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useMessenger } from "./MessengerContext";
import { useServiceCategories } from "../hooks/useSectorsAndCategories";
import InviteToQuoteModal from "./InviteToQuoteModal";
import "./ProfilePage.css";

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
  townCity?: string;
  county?: string;
  address?: string;
  postcode?: string;
  travelDistance?: string;
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
    idCard?: { status?: string };
    paymentMethod?: { status?: string };
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
  const { serviceCategories } = useServiceCategories(undefined, undefined, true);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "services" | "portfolio" | "reviews">("about");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const defaultCoverImageUrl = useMemo(() => {
    return new URL(
      "../assets/6bbce490789ed9401b274940c0210ca96c857be3.png",
      import.meta.url
    ).href;
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

  const coverImageUrl = profile?.publicProfile?.coverImage || defaultCoverImageUrl;

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

  const serviceLabels = useMemo(() => {
    const raw = (profile?.services || []).filter(Boolean).map((s) => String(s).trim()).filter(Boolean);
    // Prefer subcategory names, then category names, then raw strings (non-ObjectId only)
    const mapped = raw.map((s) => serviceSubCategoryNameById[s] || serviceCategoryNameById[s] || s);
    const cleaned = mapped.filter((s) => !looksLikeObjectId(s)); // hide raw IDs if not mapped
    return Array.from(new Set(cleaned));
  }, [profile?.services, serviceCategoryNameById, serviceSubCategoryNameById]);

  const topCategory = useMemo(() => {
    return serviceLabels[0] || "Service Provider";
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

  const hasAnyAboutInfo = useMemo(() => {
    const hasBio = Boolean(bioText);
    return hasBio || hasQualificationsInfo || hasInsuranceInfo;
  }, [
    bioText,
    hasQualificationsInfo,
    hasInsuranceInfo,
  ]);

  const verificationItems = useMemo(() => {
    const statusOf = (v?: { status?: string }) => (v?.status || "not-started") as string;
    const emailStatus = statusOf(profile?.verification?.email);
    const phoneStatus = statusOf(profile?.verification?.phone);
    const identityStatus = statusOf(profile?.verification?.idCard);
    const paymentStatus = statusOf(profile?.verification?.paymentMethod);

    return [
      { key: "email", label: "Email", status: emailStatus, Icon: Mail },
      { key: "phone", label: "Phone", status: phoneStatus, Icon: Phone },
      { key: "identity", label: "Identity", status: identityStatus, Icon: IdCard },
      { key: "payment", label: "Payment", status: paymentStatus, Icon: CreditCard },
    ] as const;
  }, [profile?.verification]);

  const serviceAreaText = useMemo(() => {
    const milesRaw = (profile?.travelDistance || "").toString().trim();
    const milesMatch = milesRaw.match(/(\d+(\.\d+)?)/);
    const miles = milesMatch?.[1] || "";

    const city = (profile?.townCity || profile?.county || "").trim();
    const postcode = (profile?.postcode || "").trim().toUpperCase();
    const outward = postcode ? postcode.split(/\s+/)[0] : "";

    if (!miles || !city || !outward) return "";

    // Requested format: "x miles within city, only first part of postal code xxx(last part)"
    return `${miles} miles within ${city}, only first part of postal code ${outward}(last part)`;
  }, [profile?.travelDistance, profile?.townCity, profile?.county, profile?.postcode]);

  const mockServices = useMemo(() => {
    const img1 = new URL("../assets/46588005695464b7def72a24e7bb7c324232fb8e.png", import.meta.url).href;
    const img2 = new URL("../assets/9e1fa7019bb76742ab74f35d79e90baab00a59e9.png", import.meta.url).href;
    const img3 = new URL("../assets/3c4f6d7cd8e52d1fbd106cc8702ba2e53af44c6f.png", import.meta.url).href;
    return [
      {
        id: "svc-1",
        title: "Standard Service Package",
        price: 80,
        delivery: "1-3 Days",
        image: img1,
        category: "Management",
      },
      {
        id: "svc-2",
        title: "Logo Design + Revisions",
        price: 50,
        delivery: "2-5 Days",
        image: img2,
        category: "Design",
      },
      {
        id: "svc-3",
        title: "SEO Audit + Action Plan",
        price: 120,
        delivery: "3-7 Days",
        image: img3,
        category: "SEO",
      },
    ];
  }, []);

  const portfolioImages = useMemo(() => {
    // Unsplash (no API key) - fixed images for a consistent gallery.
    return [
      { id: "p1", url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80", alt: "Working together" },
      { id: "p2", url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80", alt: "Project planning" },
      { id: "p3", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80", alt: "Team meeting" },
      { id: "p4", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1400&q=80", alt: "Work desk" },
      { id: "p5", url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80", alt: "Focused work" },
      { id: "p6", url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80", alt: "Professional workspace" },
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
                <ImageWithFallback src={avatarUrl} alt={displayName} className="seller-avatar" />
                {isOnline && <span className="online-badge" aria-label="Online" title="Online" />}
              </div>
            </div>

            {/* col 2: details */}
            <div className="profile-card-details min-w-0">
              <div className="seller-name">
                {tradingName || displayName}
                <span className="verified-dot" title="Verified">
                  ✓
                </span>
              </div>

              {/* Categories (show names, not IDs) */}
              <div className="badges" aria-label="categories">
                {(serviceLabels.length > 0 ? serviceLabels : [topCategory]).map((label) => (
                  <span key={label} className="badge-pill">
                    {label}
                  </span>
                ))}
              </div>

              <div className="seller-subtitle">Member since {memberSince}</div>

              <div className="profile-card-meta mt-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#002f77] flex-shrink-0" />
                  <span className="truncate">{displayLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="star-rating" aria-label={`Rating ${rating.toFixed(2)} out of 5`}>
                    <span style={{ width: `${ratingPercent}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">({ratingCount} Ratings)</span>
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

                    {hasQualificationsInfo && (
                      <div>
                        <h3 className="section-title">Qualifications</h3>
                        <div className="space-y-3">
                          {profile?.hasTradeQualification === "yes" && (
                            <p className="text-slate-700">Trade qualification: Yes</p>
                          )}
                          {qualificationsText && <p className="text-slate-700 whitespace-pre-wrap">{qualificationsText}</p>}
                          {certificationsText && <p className="text-slate-700 whitespace-pre-wrap">{certificationsText}</p>}
                        </div>
                      </div>
                    )}

                    {hasInsuranceInfo && (
                      <div>
                        <h3 className="section-title">Insurance</h3>
                        <ul className="section-list">
                          {insuranceInfo.hasPublicLiability && <li>Public liability: Yes</li>}
                          {typeof insuranceInfo.indemnity === "number" && insuranceInfo.indemnity > 0 && (
                            <li>
                              Professional indemnity amount: £{Number(insuranceInfo.indemnity).toLocaleString("en-GB")}
                            </li>
                          )}
                          {insuranceInfo.expiry && <li>Insurance expiry: {insuranceInfo.expiry}</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="gigs-grid">
                {mockServices.map((g) => (
                  <div key={g.id} className="gig-card">
                    <div className="gig-image">
                      <img src={g.image} alt={g.title} />
                    </div>
                    <div className="gig-body">
                      <div className="gig-title">{g.title}</div>
                      <div className="gig-meta">
                        <span>{g.category}</span>
                        <span className="font-semibold text-slate-900">£{g.price.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Delivery: <b className="text-slate-700">{g.delivery}</b>
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
                        <div className="verification-label">{label}</div>
                        <div className={`verification-badge status-${status}`}>
                          {status === "verified"
                            ? "Verified"
                            : status === "pending"
                              ? "Pending"
                              : status === "rejected"
                                ? "Rejected"
                                : "Not verified"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="widget" aria-label="Available services">
                <div className="widget-title">Available services</div>
                {serviceLabels.length === 0 ? (
                  <p className="text-slate-500 text-sm">No services selected.</p>
                ) : (
                  <div className="badges" aria-label="available services badges">
                    {serviceLabels.map((label) => (
                      <span key={label} className="badge-pill">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="widget" aria-label="Service area">
                <div className="widget-title">Service area</div>
                {serviceAreaText ? (
                  <p className="text-slate-700 text-sm leading-relaxed">{serviceAreaText}</p>
                ) : (
                  <p className="text-slate-500 text-sm">No service area information available.</p>
                )}
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


