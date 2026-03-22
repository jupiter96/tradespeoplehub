import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useJobs, JobQuote, Milestone } from "./JobsContext";
import { useAccount } from "./AccountContext";
import { useMessenger } from "./MessengerContext";
import { resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";
import { formatCurrency, formatNumber } from "../utils/formatNumber";
import { useCurrency } from "./CurrencyContext";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import VerificationBadge from "./VerificationBadge";
import {
  ClientJobListStatusBadge,
  ProActiveJobListStatusBadge,
} from "./JobListCardStatusBadge";
import ReactCountryFlag from "react-country-flag";
import {
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  Star,
  Clock,
  ListChecks,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Flag,
  ChevronLeft,
  User,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Flame,
  X,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  CreditCard,
  Eye,
  FileSearch,
  Sparkles,
  Pencil,
  Undo2,
  Trash2,
  Share2,
  Copy,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner@2.0.3";
import { resolveApiUrl } from "../config/api";
import awardImage from "figma:asset/5c876de928ca711ee9770734c2254c71ec8d2988.png";
import milestoneStep1 from "figma:asset/a0de430b25f40690ee801be2a6d5041990689f12.png";
import milestoneStep2 from "figma:asset/e1c037263ad447fb88ea0f991b3910b9cdd26dec.png";
import milestoneStep3 from "figma:asset/27504741573e0946b791d837bb57de9ad9c0f981.png";
import xIcon from "../assets/x.png";
import facebookIcon from "../assets/facebook.png";
import redditIcon from "../assets/reddit.png";
import paypalLogo from "../assets/paypal-logo.png";
import InviteToQuoteModal from "./InviteToQuoteModal";
import InviteProfessionalsList from "./InviteProfessionalsList";
import RotatingGlobeWithLines from "./RotatingGlobeWithLines";
import FloatingToolsBackground from "./FloatingToolsBackground";
import JobDeliverWorkModal from "./JobDeliverWorkModal";
import {
  RequestMilestonesDialog,
  CreateNewMilestoneDialog,
} from "./JobMilestonePaymentDialogs";
import ServiceCard from "./ServiceCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import BidsAndMembershipSection from "./BidsAndMembershipSection";
import WalletFundModal from "./WalletFundModal";
import PaymentMethodModal from "./PaymentMethodModal";

type SocialShareLink = {
  name: string;
  url: (u: string) => string;
  color: string;
  imgAlt: string;
  imgSrc?: string;
  bgImageSrc?: string;
};

function proPortfolioMediaUrl(url: string | undefined): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  )
    return url;
  if (url.startsWith("/")) return resolveApiUrl(url);
  return url;
}

export default function JobDetailPage() {
  const iso2FromCountry = (country?: string): string | null => {
    const c = String(country || "").trim();
    if (!c) return null;
    if (/^[A-Za-z]{2}$/.test(c)) return c.toUpperCase();
    const key = c.toLowerCase();
    const map: Record<string, string> = {
      "united kingdom": "GB",
      uk: "GB",
      "great britain": "GB",
      england: "GB",
      scotland: "GB",
      wales: "GB",
      "northern ireland": "GB",
      "united states": "US",
      "united states of america": "US",
      usa: "US",
      "u.s.a.": "US",
      ireland: "IE",
      australia: "AU",
      "new zealand": "NZ",
      canada: "CA",
      india: "IN",
      china: "CN",
      japan: "JP",
      "south korea": "KR",
      korea: "KR",
      france: "FR",
      germany: "DE",
      spain: "ES",
      italy: "IT",
      netherlands: "NL",
      belgium: "BE",
      switzerland: "CH",
      austria: "AT",
      sweden: "SE",
      norway: "NO",
      denmark: "DK",
      finland: "FI",
      poland: "PL",
      portugal: "PT",
      greece: "GR",
      turkey: "TR",
      brazil: "BR",
      mexico: "MX",
      "south africa": "ZA",
      nigeria: "NG",
      pakistan: "PK",
      bangladesh: "BD",
      "sri lanka": "LK",
      nepal: "NP",
      philippines: "PH",
      vietnam: "VN",
      thailand: "TH",
      malaysia: "MY",
      singapore: "SG",
      indonesia: "ID",
      "united arab emirates": "AE",
      uae: "AE",
      "saudi arabia": "SA",
      qatar: "QA",
      kuwait: "KW",
      israel: "IL",
      egypt: "EG",
      morocco: "MA",
      algeria: "DZ",
      tunisia: "TN",
      argentina: "AR",
      chile: "CL",
      colombia: "CO",
      peru: "PE",
      venezuela: "VE",
      russia: "RU",
      ukraine: "UA",
      romania: "RO",
      bulgaria: "BG",
      "czech republic": "CZ",
      czechia: "CZ",
      hungary: "HU",
      slovakia: "SK",
      slovenia: "SI",
      croatia: "HR",
      serbia: "RS",
    };
    return map[key] || null;
  };

  const StarRating = ({
    rating,
    size = "sm",
    className = "",
  }: {
    rating: number;
    size?: "xs" | "sm" | "md";
    className?: string;
  }) => {
    const r = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
    const w = size === "xs" ? "w-3 h-3" : size === "md" ? "w-5 h-5" : "w-4 h-4";
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const fillPct = Math.max(0, Math.min(1, r - i)) * 100; // 0..100
          return (
            <span key={i} className={`relative inline-block ${w}`}>
              <Star className={`absolute inset-0 ${w} text-[#FE8A0F]/30`} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
                <Star className={`absolute inset-0 ${w} text-[#FE8A0F] fill-[#FE8A0F]`} />
              </span>
            </span>
          );
        })}
      </span>
    );
  };
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getJobById, fetchJobById, updateQuoteStatus, addQuoteToJob, withdrawQuote, updateQuoteByProfessional, awardJobWithMilestone, awardJobWithoutMilestone, acceptAward, rejectAward, updateJob, deleteMilestone, acceptMilestone, requestMilestoneCancel, respondToCancelRequest, respondToReleaseRequest, createDispute, deleteJob, approveMilestoneDelivery, requestMilestoneRevision, submitClientJobReview } = useJobs();
  const { userInfo, userRole, isLoggedIn, authReady, refreshUser } = useAccount();
  const { startConversation, addMessage, getOrCreateContact, getContactById } = useMessenger();
  const { formatPrice, formatPriceWhole, symbol, toGBP, fromGBP, formatAmountInSelectedCurrency } = useCurrency();

  /** When the pro did not suggest milestones on the quote, award flow uses a single default milestone. */
  const DEFAULT_AWARD_MILESTONE_WITHOUT_PLAN = "Word milestone";

  const quoteHasSuggestedMilestonePlan = (quote: JobQuote) => {
    const suggested = Array.isArray(quote.suggestedMilestones) ? quote.suggestedMilestones : [];
    return suggested.some((m) => String(m.description || "").trim() && Number(m.amount) > 0);
  };

  const buildAwardMilestonesFromQuote = (quote: JobQuote) => {
    const suggested = Array.isArray(quote.suggestedMilestones) ? quote.suggestedMilestones : [];
    const validSuggested = suggested.filter(
      (m) => String(m.description || "").trim() && Number(m.amount) > 0
    );
    if (validSuggested.length > 0) {
      return validSuggested.map((m) => ({
        name: String(m.description || "").trim() || "Milestone",
        amount: fromGBP(Number(m.amount)).toFixed(2),
      }));
    }
    return [{ name: DEFAULT_AWARD_MILESTONE_WITHOUT_PLAN, amount: fromGBP(quote.price).toFixed(2) }];
  };

  const validTabs = ["details", "quotes", "payment", "files", "review", "more"] as const;
  const tabFromUrl = searchParams.get("tab") || "details";
  const [activeTab, setActiveTab] = useState(validTabs.includes(tabFromUrl as any) ? tabFromUrl : "details");
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && validTabs.includes(tab as any) && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    price: "",
    deliveryTime: "",
    message: "",
  });
  const [aiQuoteMessageGenerating, setAiQuoteMessageGenerating] = useState(false);
  const [quoteMessageBeforeAi, setQuoteMessageBeforeAi] = useState<string | null>(null);
  const [isQuoteMessageAiGenerated, setIsQuoteMessageAiGenerated] = useState(false);
  const [quoteToWithdraw, setQuoteToWithdraw] = useState<{ jobId: string; quoteId: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [editingQuoteMeta, setEditingQuoteMeta] = useState<{ jobId: string; quoteId: string } | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showRejectAwardConfirm, setShowRejectAwardConfirm] = useState(false);
  const [rejectingAward, setRejectingAward] = useState(false);
  const [expandedQuoteMessages, setExpandedQuoteMessages] = useState<Set<string>>(new Set());
  const [expandedQuoteMilestones, setExpandedQuoteMilestones] = useState<Set<string>>(new Set());

  const toggleQuoteMilestonesExpanded = (quoteId: string) => {
    setExpandedQuoteMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) next.delete(quoteId);
      else next.add(quoteId);
      return next;
    });
  };

  // Milestone state for sending quote
  const [milestones, setMilestones] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" }
  ]);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [updatingSuggestedMilestoneId, setUpdatingSuggestedMilestoneId] = useState<string | null>(null);
  const [suggestedBulkAction, setSuggestedBulkAction] = useState<null | "accept-all" | "reject-all">(null);
  const [showRequestMilestonesDialog, setShowRequestMilestonesDialog] = useState(false);
  const [updatingRequestedMilestoneId, setUpdatingRequestedMilestoneId] = useState<string | null>(null);
  const [requestedBulkAction, setRequestedBulkAction] = useState<null | "accept-all" | "reject-all">(null);

  // Award modal state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedQuoteForAward, setSelectedQuoteForAward] = useState<JobQuote | null>(null);
  const [awardWithMilestone, setAwardWithMilestone] = useState(true);
  const [awardMilestones, setAwardMilestones] = useState<Array<{ name: string; amount: string }>>([{ name: "", amount: "" }]);

  type AwardSavedCard = {
    paymentMethodId: string;
    isDefault?: boolean;
    card: { brand: string; last4: string; expMonth: number; expYear: number };
  };

  const [awardWalletBalanceGBP, setAwardWalletBalanceGBP] = useState(0);
  const [awardFundingLoading, setAwardFundingLoading] = useState(false);
  const [awardPaymentSource, setAwardPaymentSource] = useState<"wallet" | "card" | "paypal">("wallet");
  const [awardPayMethods, setAwardPayMethods] = useState<AwardSavedCard[]>([]);
  const [awardSelectedCardId, setAwardSelectedCardId] = useState<string | null>(null);
  const [awardPublishableKey, setAwardPublishableKey] = useState<string | null>(null);
  const [awardStripeEnabled, setAwardStripeEnabled] = useState(false);
  const [awardPaypalClientId, setAwardPaypalClientId] = useState<string | null>(null);
  const [awardPaypalEnabled, setAwardPaypalEnabled] = useState(false);
  const [awardFeeSettings, setAwardFeeSettings] = useState({
    stripeCommissionPercentage: 1.55,
    stripeCommissionFixed: 0.29,
    paypalCommissionPercentage: 3,
    paypalCommissionFixed: 0.3,
  });
  const [showAwardAddCardModal, setShowAwardAddCardModal] = useState(false);
  const [showAwardPayPalFundModal, setShowAwardPayPalFundModal] = useState(false);
  const [awardSubmitting, setAwardSubmitting] = useState(false);
  const pendingPayPalAwardRef = useRef<{ milestones: { name: string; amount: number }[] } | null>(null);

  // Cancel request modal (for milestone)
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [cancelRequestMilestone, setCancelRequestMilestone] = useState<Milestone | null>(null);
  const [cancelRequestReason, setCancelRequestReason] = useState("");


  // Pro: accept/reject milestone cancel request confirmation
  const [cancelResponseConfirm, setCancelResponseConfirm] = useState<{ action: "accept" | "reject"; jobId: string; milestoneId: string; milestone: Milestone } | null>(null);
  const [respondingCancel, setRespondingCancel] = useState(false);

  // Pro: request release confirmation

  // Shared files (File tab: client + awarded pro)
  const [jobFiles, setJobFiles] = useState<{ id: string; name: string; url: string; mimeType: string; size: number; uploadedBy?: string; createdAt?: string }[]>([]);
  const [jobFilesLoading, setJobFilesLoading] = useState(false);
  const [jobFileUploading, setJobFileUploading] = useState(false);
  const jobFileInputRef = useRef<HTMLInputElement>(null);

  // Client: accept/reject release request confirmation
  const [releaseResponseConfirm, setReleaseResponseConfirm] = useState<{ action: "accept" | "reject"; jobId: string; milestoneId: string; milestone: Milestone } | null>(null);
  const [respondingRelease, setRespondingRelease] = useState(false);

  // Client: accept/reject cancel request confirmation
  const [clientCancelResponseConfirm, setClientCancelResponseConfirm] = useState<{ action: "accept" | "reject"; jobId: string; milestoneId: string; milestone: Milestone } | null>(null);
  const [respondingCancelClient, setRespondingCancelClient] = useState(false);

  // New milestone state
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMilestone, setDisputeMilestone] = useState<Milestone | null>(null);
  const [disputeForm, setDisputeForm] = useState({
    requirements: "",
    notCompleted: "",
    evidenceFiles: [] as File[],
    selectedMilestones: [] as string[],
  });

  // Delete job confirmation (client manage menu)
  const [showDeleteJobConfirm, setShowDeleteJobConfirm] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);

  // Invite to quote modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<{ id: string; name: string; category: string } | null>(null);
  const [invitedProfessionals, setInvitedProfessionals] = useState<Set<string>>(new Set());
  const [recommendedProfessionals, setRecommendedProfessionals] = useState<Array<{
    id: string; name: string; title: string; category: string; image: string;
    rating: number; reviewCount: number; completedJobs: number; location: string; skills?: string[];
  }>>([]);
  const [recommendedProfessionalsLoading, setRecommendedProfessionalsLoading] = useState(false);

  // Report job modal (message to admin)
  const [showReportJobModal, setShowReportJobModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [reportJobReason, setReportJobReason] = useState("");
  const [reportJobMessage, setReportJobMessage] = useState("");
  const [reportJobSubmitting, setReportJobSubmitting] = useState(false);
  const [showClientPreviewModal, setShowClientPreviewModal] = useState(false);
  const [clientPreviewData, setClientPreviewData] = useState<{
    name: string;
    avatar?: string;
    createdAt: string | null;
    bio: string;
    country: string | null;
    townCity: string | null;
    reviews: { id: string; rating: number; comment: string | null; createdAt: string | null; professionalName: string; professionalAvatar?: string; response: string | null; responseAt: string | null }[];
    reviewCount: number;
    ratingAverage: number;
  } | null>(null);
  const [clientPreviewTab, setClientPreviewTab] = useState("about");
  const [clientPreviewLoading, setClientPreviewLoading] = useState(false);

  const [showDeliverWorkModal, setShowDeliverWorkModal] = useState(false);
  const [deliverWorkPreselectedMilestoneIndex, setDeliverWorkPreselectedMilestoneIndex] = useState<number | null>(null);
  const [showViewWorkDeliveredModal, setShowViewWorkDeliveredModal] = useState(false);
  const [viewWorkDeliveredData, setViewWorkDeliveredData] = useState<{ milestoneId: string; milestoneIndex: number; milestoneName: string; deliveryMessage: string; fileUrls: { url: string; name?: string }[] } | null>(null);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [viewWorkFullscreenUrl, setViewWorkFullscreenUrl] = useState<string | null>(null);
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const [showRevisionRequestModal, setShowRevisionRequestModal] = useState(false);
  const [showViewRevisionModal, setShowViewRevisionModal] = useState(false);
  const [viewRevisionData, setViewRevisionData] = useState<{ milestoneName: string; revisionMessage: string; revisionFileUrls: { url: string; name?: string }[] } | null>(null);
  const [viewRevisionFullscreenUrl, setViewRevisionFullscreenUrl] = useState<string | null>(null);

  // Slider popup for professional profile preview (from quote cards)
  const [showProProfileSlider, setShowProProfileSlider] = useState(false);
  const [proProfileSliderAnimateIn, setProProfileSliderAnimateIn] = useState(false);
  const proProfileSliderAnimTimerRef = useRef<number | null>(null);
  const [selectedQuoteForProfile, setSelectedQuoteForProfile] = useState<JobQuote | null>(null);
  const [proProfileData, setProProfileData] = useState<any | null>(null);
  const [proProfileLoading, setProProfileLoading] = useState(false);
  const [proProfileActiveTab, setProProfileActiveTab] = useState<"about" | "services" | "portfolio" | "reviews">("about");
  const [proProfileServices, setProProfileServices] = useState<any[]>([]);
  const [proProfileServicesLoading, setProProfileServicesLoading] = useState(false);
  const [proProfileExpandedReviewResponses, setProProfileExpandedReviewResponses] = useState<Set<string>>(new Set());

  // Quote credits purchase slider (shown when pro has no credits)
  const [showQuoteCreditsSlider, setShowQuoteCreditsSlider] = useState(false);
  const [quoteCreditsSliderAnimateIn, setQuoteCreditsSliderAnimateIn] = useState(false);
  const quoteCreditsSliderAnimTimerRef = useRef<number | null>(null);
  const [hideQuoteCreditsSliderPanel, setHideQuoteCreditsSliderPanel] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [jobReviewRating, setJobReviewRating] = useState(0);
  const [jobReviewText, setJobReviewText] = useState("");
  const [jobReviewSubmitting, setJobReviewSubmitting] = useState(false);

  // Prevent background scroll when fullscreen viewer is open
  useEffect(() => {
    const isOpen = !!(viewWorkFullscreenUrl || viewRevisionFullscreenUrl);
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewWorkFullscreenUrl, viewRevisionFullscreenUrl]);

  // Redirect to login only after auth state is resolved (avoid redirect on refresh before session check)
  useEffect(() => {
    if (authReady && !isLoggedIn) {
      navigate("/login");
    }
  }, [authReady, isLoggedIn, navigate]);

  // Fetch job once when opening the page; real-time updates come via Socket.io (job:updated)
  const [jobLoading, setJobLoading] = useState(false);
  useEffect(() => {
    if (!jobSlug || !authReady || !isLoggedIn) return;
    const inList = getJobById(jobSlug);
    if (!inList) setJobLoading(true);
    fetchJobById(jobSlug).finally(() => setJobLoading(false));
  }, [jobSlug, authReady, isLoggedIn, fetchJobById]);

  const job = getJobById(jobSlug || "");

  const awardMilestoneTotalDisplay = useMemo(() => {
    if (!selectedQuoteForAward) return 0;
    const hasPlan = quoteHasSuggestedMilestonePlan(selectedQuoteForAward);
    const rows = hasPlan ? awardMilestones : awardMilestones.slice(0, 1);
    return rows.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  }, [selectedQuoteForAward, awardMilestones]);

  const awardMilestoneTotalGBP = useMemo(() => {
    if (!selectedQuoteForAward) return 0;
    const hasPlan = quoteHasSuggestedMilestonePlan(selectedQuoteForAward);
    const rows = hasPlan ? awardMilestones : awardMilestones.slice(0, 1);
    return rows.reduce((sum, m) => {
      const v = parseFloat(m.amount);
      if (!isNaN(v) && v > 0) return sum + toGBP(v);
      return sum;
    }, 0);
  }, [selectedQuoteForAward, awardMilestones, toGBP]);

  const awardInvoiceFees = useMemo(() => {
    const sub = awardMilestoneTotalDisplay;
    if (sub <= 0) return { subtotal: 0, fee: 0, totalDue: 0 };
    if (awardPaymentSource === "wallet") {
      return { subtotal: sub, fee: 0, totalDue: sub };
    }
    const fixedStripe = fromGBP(awardFeeSettings.stripeCommissionFixed);
    const fixedPaypal = fromGBP(awardFeeSettings.paypalCommissionFixed);
    if (awardPaymentSource === "card") {
      const fee = (sub * awardFeeSettings.stripeCommissionPercentage) / 100 + fixedStripe;
      return { subtotal: sub, fee, totalDue: sub + fee };
    }
    const fee = (sub * awardFeeSettings.paypalCommissionPercentage) / 100 + fixedPaypal;
    return { subtotal: sub, fee, totalDue: sub + fee };
  }, [awardMilestoneTotalDisplay, awardPaymentSource, awardFeeSettings, fromGBP]);

  const canPayAwardFromWallet =
    awardMilestoneTotalGBP > 0 && awardWalletBalanceGBP + 1e-6 >= awardMilestoneTotalGBP;

  const fetchAwardFundingData = useCallback(async () => {
    setAwardFundingLoading(true);
    try {
      const [balRes, pkRes, pmRes] = await Promise.all([
        fetch(resolveApiUrl("/api/wallet/balance"), { credentials: "include" }),
        fetch(resolveApiUrl("/api/payment/publishable-key"), { credentials: "include" }),
        fetch(resolveApiUrl("/api/payment-methods"), { credentials: "include" }),
      ]);
      if (balRes.ok) {
        const b = await balRes.json().catch(() => ({}));
        setAwardWalletBalanceGBP(Number(b.balance) || 0);
      }
      if (pkRes.ok) {
        const d = await pkRes.json().catch(() => ({}));
        setAwardPublishableKey(d.publishableKey || null);
        setAwardStripeEnabled(d.stripeEnabled === true);
        setAwardPaypalEnabled(d.paypalEnabled === true);
        setAwardPaypalClientId(d.paypalClientId || null);
        setAwardFeeSettings({
          stripeCommissionPercentage: d.stripeCommissionPercentage ?? 1.55,
          stripeCommissionFixed: d.stripeCommissionFixed ?? 0.29,
          paypalCommissionPercentage: d.paypalCommissionPercentage ?? 3,
          paypalCommissionFixed: d.paypalCommissionFixed ?? 0.3,
        });
      }
      if (pmRes.ok) {
        const d = await pmRes.json().catch(() => ({}));
        const pms = (d.paymentMethods || []) as AwardSavedCard[];
        setAwardPayMethods(pms);
        const def = pms.find((p) => p.isDefault);
        setAwardSelectedCardId((prev) => {
          if (prev && pms.some((p) => p.paymentMethodId === prev)) return prev;
          return def?.paymentMethodId || pms[0]?.paymentMethodId || null;
        });
      }
    } finally {
      setAwardFundingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showAwardModal && awardWithMilestone) {
      fetchAwardFundingData();
    }
  }, [showAwardModal, awardWithMilestone, fetchAwardFundingData]);

  useEffect(() => {
    if (!showAwardModal || !awardWithMilestone || awardMilestoneTotalGBP <= 0) return;
    if (awardPaymentSource === "wallet" && !canPayAwardFromWallet) {
      if (awardStripeEnabled && awardPayMethods.length > 0) setAwardPaymentSource("card");
      else if (awardPaypalEnabled) setAwardPaymentSource("paypal");
    }
  }, [
    showAwardModal,
    awardWithMilestone,
    awardMilestoneTotalGBP,
    canPayAwardFromWallet,
    awardPaymentSource,
    awardStripeEnabled,
    awardPayMethods.length,
    awardPaypalEnabled,
  ]);

  // Keep URL canonical: if we have job with slug and URL param differs (e.g. old id), replace with slug so refresh works
  useEffect(() => {
    if (!job?.slug || !jobSlug) return;
    if (job.slug !== jobSlug) {
      navigate(`/job/${job.slug}${window.location.search || ""}`, { replace: true });
    }
  }, [job?.slug, jobSlug, navigate]);

  // Debug: verify professionalCountry is coming through for quotes
  useEffect(() => {
    if (!job?.quotes?.length) return;
    const rows = job.quotes.map((q) => ({
      professionalId: q.professionalId,
      professionalName: q.professionalName,
      professionalCountry: (q as any).professionalCountry,
      professionalFullyVerified: (q as any).professionalFullyVerified,
    }));
  }, [job?.id, job?.quotes]);

  // Fetch recommended professionals (same sector as job, sorted by rating then reviews)
  useEffect(() => {
    if (!jobSlug || !job?.id) return;
    setRecommendedProfessionalsLoading(true);
    fetch(resolveApiUrl(`/api/jobs/${jobSlug}/recommended-professionals`), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => setRecommendedProfessionals(data?.professionals ?? []))
      .catch(() => setRecommendedProfessionals([]))
      .finally(() => setRecommendedProfessionalsLoading(false));
  }, [jobSlug, job?.id]);

  // File tab visibility (must be before early return so hook order is stable)
  const showFileTab = !!(
    job &&
    (job.status === "awaiting-accept" ||
      job.status === "in-progress" ||
      job.status === "delivered" ||
      job.status === "completed") &&
    (userInfo?.id === job.clientId || (userRole === "professional" && job.awardedProfessionalId === userInfo?.id))
  );

  const showReviewTab = !!(
    job &&
    job.status === "completed" &&
    job.awardedProfessionalId &&
    userInfo?.id &&
    (String(userInfo.id) === String(job.clientId) ||
      (userRole === "professional" && String(userInfo.id) === String(job.awardedProfessionalId)))
  );

  useEffect(() => {
    if (activeTab !== "review") return;
    if (!job) return;
    if (!showReviewTab) {
      setActiveTab("details");
      const next = new URLSearchParams(searchParams);
      next.set("tab", "details");
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, job, showReviewTab, searchParams, setSearchParams]);

  const fetchJobFiles = async () => {
    if (!job?.id || !showFileTab) return;
    setJobFilesLoading(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${job.slug || job.id}/files`), { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setJobFiles(data.files || []);
      else setJobFiles([]);
    } catch {
      setJobFiles([]);
    } finally {
      setJobFilesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "files" && showFileTab && job?.id) fetchJobFiles();
  }, [activeTab, showFileTab, job?.id]);

  const handleJobFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !job?.id) return;
    e.target.value = "";
    setJobFileUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(resolveApiUrl(`/api/jobs/${job.slug || job.id}/files`), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setJobFiles((prev) => [{ id: data.id, name: data.name, url: data.url, mimeType: data.mimeType || "", size: data.size || 0, uploadedBy: data.uploadedBy, createdAt: data.createdAt }, ...prev]);
      toast.success("File uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setJobFileUploading(false);
    }
  };

  // Real-time countdown to job close (must be before early return to keep hook order stable)
  const [now, setNow] = useState(() => new Date());
  const closesAt = job
    ? (job as { closesAt?: string }).closesAt
      ? new Date((job as { closesAt: string }).closesAt).getTime()
      : job.status === "open" && job.postedAt
        ? new Date(job.postedAt).getTime() + 30 * 24 * 60 * 60 * 1000
        : null
    : null;
  useEffect(() => {
    if (!job || job.status !== "open" || closesAt == null) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [job?.status, closesAt]);
  const getJobEndsInText = (): string => {
    if (!job || job.status !== "open" || closesAt == null) return "";
    const diff = closesAt - now.getTime();
    if (diff <= 0) return "Job ended";
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const d = days === 1 ? "1 Day" : `${days} Days`;
    const h = hours === 1 ? "1 Hour" : `${hours} Hours`;
    if (days > 0 && hours > 0) return `Job ends in ${d} ${h}`;
    if (days > 0) return `Job ends in ${d}`;
    if (hours > 0) return `Job ends in ${h}`;
    const mins = Math.floor(diff / (1000 * 60));
    return mins > 0 ? `Job ends in ${mins} minute${mins === 1 ? "" : "s"}` : "Job ends in less than a minute";
  };

  // Show loading while auth is resolving (e.g. on refresh) or job is fetching
  if (!authReady || (jobLoading && !job)) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 text-center mt-[50px] md:mt-0">
          <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b]">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
          <Nav />
        </header>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 text-center mt-[50px] md:mt-0">
          <h1 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
            Job not found
          </h1>
          <Button
            onClick={() => navigate("/account?tab=my-jobs")}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
          >
            Back to My Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user is the job owner (client)
  const isJobOwner = userInfo?.id === job.clientId || userRole === "client";
  const isActualJobClient = userInfo?.id != null && String(userInfo.id) === String(job.clientId);
  const isAwardedProfessionalUser =
    userInfo?.id != null &&
    job.awardedProfessionalId != null &&
    String(userInfo.id) === String(job.awardedProfessionalId);
  // Check if current user already submitted a quote
  const hasSubmittedQuote = job.quotes.some(
    (quote) => quote.professionalId === userInfo?.id
  );
  // Find professional's awarded quote (status "awarded" or "accepted" = they accepted the award, job in progress)
  const myAwardedQuote = userRole === "professional" ? job.quotes.find(
    (quote) => quote.professionalId === userInfo?.id && (quote.status === "awarded" || quote.status === "accepted")
  ) : null;
  // For professional: track own quotes (used for counts / empty state etc.)
  const myQuotes = userRole === "professional" ? job.quotes.filter((q) => q.professionalId === userInfo?.id) : job.quotes;
  // Awarded quotes (for client: show at top) — include both "awarded" and "accepted" (pro accepted = in progress)
  const awardedQuotes = job.quotes.filter(
    (q) => q.status === "awarded" || (q.status === "accepted" && job.awardedProfessionalId && q.professionalId === job.awardedProfessionalId)
  );
  const jobReviewProfessionalName =
    job.quotes.find((q) => String(q.professionalId) === String(job.awardedProfessionalId))?.professionalName ||
    "the professional";
  // Helper: sort quotes by (1) whether it's the current professional's quote, (2) rating desc, (3) reviews desc, (4) latest first
  const sortQuotesForDisplay = (quotes: JobQuote[], currentProfessionalId: string | null | undefined) => {
    return [...quotes].sort((a, b) => {
      const aIsMine = currentProfessionalId && a.professionalId === currentProfessionalId;
      const bIsMine = currentProfessionalId && b.professionalId === currentProfessionalId;
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;

      const aRating = Number((a as any).professionalRating ?? 0) || 0;
      const bRating = Number((b as any).professionalRating ?? 0) || 0;
      if (bRating !== aRating) return bRating - aRating;

      const aReviews = Number((a as any).professionalReviews ?? 0) || 0;
      const bReviews = Number((b as any).professionalReviews ?? 0) || 0;
      if (bReviews !== aReviews) return bReviews - aReviews;

      const aCreated = (a as any).submittedAt ? new Date((a as any).submittedAt).getTime() : 0;
      const bCreated = (b as any).submittedAt ? new Date((b as any).submittedAt).getTime() : 0;
      return bCreated - aCreated;
    });
  };

  // Base quotes before sorting:
  // - Client: non-awarded quotes (awarded shown in separate section)
  // - Professional: keep other quotes under "Awarded Professionals"
  const baseListQuotes = isJobOwner
    ? job.quotes.filter(
        (q) =>
          q.status !== "awarded" &&
          !(q.status === "accepted" && job.awardedProfessionalId && q.professionalId === job.awardedProfessionalId)
      )
    : userRole === "professional" && myAwardedQuote
    ? job.quotes.filter((q) => q.id !== myAwardedQuote.id)
    : job.quotes;

  const listQuotes = sortQuotesForDisplay(
    baseListQuotes,
    userRole === "professional" ? userInfo?.id ?? null : null
  );
  // Hide empty state and animation when there are list quotes OR when awarded section is shown
  const showQuotesEmptyState =
    listQuotes.length === 0 &&
    !(
      (isJobOwner && awardedQuotes.length > 0) ||
      (userRole === "professional" && myAwardedQuote)
    );

  const toggleQuoteMessageExpanded = (quoteId: string) => {
    setExpandedQuoteMessages((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) next.delete(quoteId);
      else next.add(quoteId);
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /** Details tab — urgent/soon; API date-only "YYYY-MM-DD" is local calendar (not UTC midnight shift). */
  const formatUrgentJobStartLine = (dateString: string) => {
    const s = String(dateString).trim();
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const date = ymd
      ? new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10))
      : new Date(s);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDeliveryDisplay = (v: string) => {
    const n = parseInt(String(v).trim(), 10);
    if (Number.isNaN(n)) return v;
    return n === 1 ? "1 day" : `${n} days`;
  };

  // Quote price validation range:
  // - Job budgets are stored in GBP
  // - UI input is in selected currency, so min/max and clamping must use selected-currency values.
  const quoteBudgetMinGBP = job.budgetMin ?? job.budgetAmount ?? 0;
  const quoteBudgetMaxGBP = job.budgetMax ?? (job.budgetAmount ?? 0) * 1.2;
  const quoteBudgetMinSelected = fromGBP(quoteBudgetMinGBP);
  const quoteBudgetMaxSelected = fromGBP(quoteBudgetMaxGBP);

  const quotePriceSelected = parseFloat(quoteForm.price);
  const quotePriceSelectedValid = Number.isFinite(quotePriceSelected) && quotePriceSelected > 0;
  const milestonesTotalSelected = milestones.reduce((sum, m) => {
    const n = parseFloat(String(m.amount || "").trim());
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const milestonesTotalRounded = Math.round(milestonesTotalSelected * 100) / 100;
  const quotePriceRounded = quotePriceSelectedValid ? Math.round(quotePriceSelected * 100) / 100 : 0;
  const hasAnyMilestoneInput = milestones.some(
    (m) => String(m.description || "").trim() || String(m.amount || "").trim()
  );
  const milestoneDiff = quotePriceSelectedValid ? Math.round((quotePriceRounded - milestonesTotalRounded) * 100) / 100 : 0;
  const isMilestonesExact = quotePriceSelectedValid && hasAnyMilestoneInput && milestoneDiff === 0;
  const isMilestonesOver = quotePriceSelectedValid && hasAnyMilestoneInput && milestoneDiff < 0;
  const isMilestonesUnder = quotePriceSelectedValid && hasAnyMilestoneInput && milestoneDiff > 0;

  const handleInviteProfessional = async (pro: typeof recommendedProfessionals[0], message?: string) => {
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${job.id}/invite-professional`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ professionalId: pro.id, message: message?.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send invitation");
      }
      setInvitedProfessionals((prev) => new Set(prev).add(pro.id));
      toast.success(`Sent invitation to ${pro.name} on project "${job.title}"`);

      // Also send a styled invitation message into the professional's messenger
      try {
        const contact = getOrCreateContact({
          id: pro.id,
          name: pro.name,
          avatar: pro.image,
          conversationId: "", // will be established on first real chat
          participantId: pro.id,
          online: false,
        });
        const intro =
          message && message.trim().length > 0
            ? message.trim()
            : `Hi ${pro.name}, I'd like to invite you to quote for my job "${job.title}".`;
        addMessage(contact.id, {
          senderId: userInfo?.id || "current-user",
          text: intro,
          read: false,
          type: "job_invitation",
        });
      } catch (err) {
        // Fail silently for messenger side; main invitation already sent
        console.error("Failed to send messenger invitation message", err);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send invitation");
    }
  };

  const handleMessageProfessional = (pro: typeof recommendedProfessionals[0]) => {
    // Start a conversation with the professional
    startConversation(pro.id).then(() => {
      navigate(`/account?tab=messenger`);
    toast.success(`Opening chat with ${pro.name}`);
    });
  };

  const handleGenerateQuoteMessage = async () => {
    if (!job) return;
    setAiQuoteMessageGenerating(true);
    try {
      setQuoteMessageBeforeAi(quoteForm.message);
      const res = await fetch(resolveApiUrl("/api/jobs/generate-quote-message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description,
          sectorName: job.sector,
          keyPoints: quoteForm.message.trim() || undefined,
          tradingName: userInfo?.businessName || userInfo?.tradingName || userInfo?.name || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to generate message");
        return;
      }
      if (data.message) {
        setQuoteForm((f) => ({ ...f, message: data.message }));
        setIsQuoteMessageAiGenerated(true);
      }
      toast.success("Message generated. You can edit it before sending.");
    } catch {
      toast.error("Failed to generate message. Please try again.");
    } finally {
      setAiQuoteMessageGenerating(false);
    }
  };

  const handleOpenAwardModal = (quote: JobQuote) => {
    setSelectedQuoteForAward(quote);
    setAwardWithMilestone(true);
    setAwardMilestones(buildAwardMilestonesFromQuote(quote));
    setAwardPaymentSource("wallet");
    setAwardSubmitting(false);
    setShowAwardPayPalFundModal(false);
    pendingPayPalAwardRef.current = null;
    setShowAwardModal(true);
  };

  const handleEditJob = () => {
    navigate(`/post-job?edit=${job.id}`);
  };
  const handleRepostJob = () => {
    navigate(`/post-job?repost=${job.id}`);
  };
  const handleCloseQuotes = async () => {
    try {
      await updateJob(job.id, { status: "cancelled" });
      await fetchJobById(job.slug || job.id);
      toast.success("Job closed. No new quotes will be accepted.");
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to close job");
    }
  };
  const handleDeleteJobClick = () => setShowDeleteJobConfirm(true);
  const handleDeleteJobConfirm = async () => {
    if (!job?.id) return;
    setDeletingJob(true);
    try {
      await deleteJob(job.id);
      toast.success("Job deleted.");
      navigate("/account?tab=my-jobs");
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to delete job");
    } finally {
      setDeletingJob(false);
      setShowDeleteJobConfirm(false);
    }
  };

  const handleAwardJob = async () => {
    if (!selectedQuoteForAward) return;

    if (awardWithMilestone) {
      const hasPlan = selectedQuoteForAward ? quoteHasSuggestedMilestonePlan(selectedQuoteForAward) : false;
      const rowsForAward = hasPlan ? awardMilestones : awardMilestones.slice(0, 1);
      const valid = rowsForAward.filter((m) => {
        const nameOk = hasPlan ? m.name?.trim() : (m.name?.trim() || DEFAULT_AWARD_MILESTONE_WITHOUT_PLAN);
        return nameOk && m.amount && !isNaN(parseFloat(m.amount)) && parseFloat(m.amount) > 0;
      });
      if (valid.length === 0) {
        toast.error(
          hasPlan
            ? "Add at least one milestone with a name and valid amount"
            : "Enter a valid milestone amount"
        );
        return;
      }
      const milestones = valid.map((m) => ({
        name: (hasPlan ? m.name.trim() : m.name.trim() || DEFAULT_AWARD_MILESTONE_WITHOUT_PLAN),
        amount: toGBP(parseFloat(m.amount)),
      }));

      if (awardPaymentSource === "paypal") {
        if (!awardPaypalEnabled || !awardPaypalClientId) {
          toast.error("PayPal is not available.");
          return;
        }
        pendingPayPalAwardRef.current = { milestones };
        setShowAwardPayPalFundModal(true);
        return;
      }

      if (awardPaymentSource === "card") {
        if (!awardStripeEnabled) {
          toast.error("Card payments are not available.");
          return;
        }
        if (!awardSelectedCardId) {
          toast.error("Select a saved card or add a new one.");
          setShowAwardAddCardModal(true);
          return;
        }
      } else if (awardPaymentSource === "wallet" && !canPayAwardFromWallet) {
        toast.error("Insufficient wallet balance. Choose card or PayPal, or add funds in Billing.");
        return;
      }

      try {
        setAwardSubmitting(true);
        await awardJobWithMilestone(
          job.id,
          selectedQuoteForAward.id,
          selectedQuoteForAward.professionalId,
          milestones,
          awardPaymentSource === "card"
            ? { paymentSource: "card", paymentMethodId: awardSelectedCardId! }
            : { paymentSource: "wallet" }
        );
        await refreshUser?.();
        await fetchJobById(job.slug || job.id);
        toast.success(`Job awarded with ${milestones.length} milestone(s)!`);
        setShowAwardModal(false);
        setSelectedQuoteForAward(null);
        setAwardMilestones([{ name: "", amount: "" }]);
        setAwardWithMilestone(true);
        setActiveTab("payment");
        navigate(`/job/${job.slug || jobSlug}?tab=payment`, { replace: true });
      } catch (e: any) {
        if (e?.code === "INSUFFICIENT_BALANCE") {
          toast.error("Insufficient balance. Pay with card or PayPal, or add funds in Billing.");
          navigate("/account?tab=billing&section=fund");
        } else {
          toast.error(e?.message || "Failed to award job");
        }
      } finally {
        setAwardSubmitting(false);
      }
      return;
    }

    try {
      await awardJobWithoutMilestone(job.id, selectedQuoteForAward.id, selectedQuoteForAward.professionalId);
      toast.success("Job awarded successfully!");
      setShowAwardModal(false);
      setSelectedQuoteForAward(null);
      setAwardMilestones([{ name: "", amount: "" }]);
      setAwardWithMilestone(true);
      setActiveTab("payment");
      navigate(`/job/${job.slug || jobSlug}?tab=payment`, { replace: true });
    } catch (e: any) {
      if (e?.code === "INSUFFICIENT_BALANCE") {
        toast.error("Insufficient balance. Please add funds to your wallet.");
        navigate("/account?tab=billing&section=fund");
      } else {
        toast.error(e?.message || "Failed to award job");
      }
    }
  };

  const getAwardedQuoteForJob = () => {
    if (!job?.awardedProfessionalId) return null;
    return (job.quotes || []).find(
      (q) => String(q.professionalId) === String(job.awardedProfessionalId)
    );
  };

  /** Fund every pending suggested milestone in order (wallet must cover the total). */
  const handleAcceptAllSuggestedMilestones = async () => {
    if (!job?.id || !isJobOwner) return;
    const awardedQuote = getAwardedQuoteForJob();
    if (!awardedQuote?.id) return;
    const pending = (awardedQuote.suggestedMilestones || []).filter((m) => m.status === "pending");
    if (pending.length === 0) return;
    setSuggestedBulkAction("accept-all");
    try {
      for (const m of pending) {
        const res = await fetch(
          resolveApiUrl(
            `/api/jobs/${job.id}/quotes/${awardedQuote.id}/suggested-milestones/${m.id}/accept`
          ),
          { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to accept a milestone");
        }
      }
      await fetchJobById(job.slug || job.id);
      toast.success("All suggested milestones were accepted and funded.");
    } catch (e: any) {
      await fetchJobById(job.slug || job.id);
      toast.error(e?.message || "Could not accept all milestones");
    } finally {
      setSuggestedBulkAction(null);
    }
  };

  const handleRejectAllSuggestedMilestones = async () => {
    if (!job?.id || !isJobOwner) return;
    const awardedQuote = getAwardedQuoteForJob();
    if (!awardedQuote?.id) return;
    const pending = (awardedQuote.suggestedMilestones || []).filter((m) => m.status === "pending");
    if (pending.length === 0) return;
    if (
      !window.confirm(
        `Reject all ${pending.length} suggested milestone(s)? You can still create milestones manually below.`
      )
    ) {
      return;
    }
    setSuggestedBulkAction("reject-all");
    try {
      for (const m of pending) {
        const res = await fetch(
          resolveApiUrl(
            `/api/jobs/${job.id}/quotes/${awardedQuote.id}/suggested-milestones/${m.id}/reject`
          ),
          { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to reject a milestone");
        }
      }
      await fetchJobById(job.slug || job.id);
      toast.success("All suggested milestones were declined.");
    } catch (e: any) {
      await fetchJobById(job.slug || job.id);
      toast.error(e?.message || "Could not reject all milestones");
    } finally {
      setSuggestedBulkAction(null);
    }
  };

  const handleAcceptAllRequestedMilestones = async () => {
    if (!job?.id || !isJobOwner) return;
    const pending = (job.requestedMilestonePlan || []).filter((m) => m.status === "pending");
    if (pending.length === 0) return;
    setRequestedBulkAction("accept-all");
    try {
      for (const m of pending) {
        const res = await fetch(
          resolveApiUrl(`/api/jobs/${job.id}/requested-milestones/${m.id}/accept`),
          { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to accept a milestone");
        }
      }
      await fetchJobById(job.slug || job.id);
      toast.success("All requested milestones were accepted and funded.");
    } catch (e: any) {
      await fetchJobById(job.slug || job.id);
      toast.error(e?.message || "Could not accept all milestones");
    } finally {
      setRequestedBulkAction(null);
    }
  };

  const handleRejectAllRequestedMilestones = async () => {
    if (!job?.id || !isJobOwner) return;
    const pending = (job.requestedMilestonePlan || []).filter((m) => m.status === "pending");
    if (pending.length === 0) return;
    if (
      !window.confirm(
        `Decline all ${pending.length} requested milestone(s)? You can still add milestones manually below.`
      )
    ) {
      return;
    }
    setRequestedBulkAction("reject-all");
    try {
      for (const m of pending) {
        const res = await fetch(
          resolveApiUrl(`/api/jobs/${job.id}/requested-milestones/${m.id}/reject`),
          { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to decline a milestone");
        }
      }
      await fetchJobById(job.slug || job.id);
      toast.success("All requested milestones were declined.");
    } catch (e: any) {
      await fetchJobById(job.slug || job.id);
      toast.error(e?.message || "Could not decline all milestones");
    } finally {
      setRequestedBulkAction(null);
    }
  };

  const handleAcceptAward = async () => {
    try {
      await acceptAward(job.id);
      toast.success("Job accepted! You can now start working on it.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept");
    }
  };

  const handleRejectAward = async () => {
    try {
      await rejectAward(job.id);
      toast.success("Job award rejected.");
      setShowRejectAwardConfirm(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject");
    } finally {
      setRejectingAward(false);
    }
  };

  const handleRejectAwardConfirm = () => {
    setRejectingAward(true);
    handleRejectAward();
  };

  const handleConfirmCancelResponse = async () => {
    if (!cancelResponseConfirm) return;
    setRespondingCancel(true);
    try {
      await respondToCancelRequest(cancelResponseConfirm.jobId, cancelResponseConfirm.milestoneId, cancelResponseConfirm.action === "accept");
      toast.success(cancelResponseConfirm.action === "accept" ? "Cancel request accepted" : "Cancel request rejected");
      setCancelResponseConfirm(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setRespondingCancel(false);
    }
  };

  const handleConfirmReleaseResponse = async () => {
    if (!releaseResponseConfirm) return;
    setRespondingRelease(true);
    try {
      await respondToReleaseRequest(releaseResponseConfirm.jobId, releaseResponseConfirm.milestoneId, releaseResponseConfirm.action === "accept");
      toast.success(releaseResponseConfirm.action === "accept" ? "Release request accepted" : "Release request rejected");
      setReleaseResponseConfirm(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setRespondingRelease(false);
    }
  };

  const handleConfirmClientCancelResponse = async () => {
    if (!clientCancelResponseConfirm) return;
    setRespondingCancelClient(true);
    try {
      await respondToCancelRequest(clientCancelResponseConfirm.jobId, clientCancelResponseConfirm.milestoneId, clientCancelResponseConfirm.action === "accept");
      toast.success(clientCancelResponseConfirm.action === "accept" ? "Cancel request accepted" : "Cancel request rejected");
      setClientCancelResponseConfirm(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setRespondingCancelClient(false);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      await updateQuoteStatus(job.id, quoteId, "rejected");
      toast.success("Quote rejected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject quote");
    }
  };

  const handleOpenDisputeModal = (milestone: Milestone) => {
    setDisputeMilestone(milestone);
    setShowDisputeModal(true);
    setDisputeForm({
      requirements: "",
      notCompleted: "",
      evidenceFiles: [],
      selectedMilestones: milestone?.id ? [milestone.id] : [],
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDisputeForm((prev) => ({
        ...prev,
        evidenceFiles: Array.from(files),
      }));
    }
  };

  const inProgressMilestones = (job?.milestones || []).filter((m) => m.status === "in-progress");
  const allSelected = inProgressMilestones.length > 0 && disputeForm.selectedMilestones.length >= inProgressMilestones.length;

  const handleMilestoneSelection = (milestoneId: string, checked: boolean) => {
    setDisputeForm((prev) => ({
      ...prev,
      selectedMilestones: checked
        ? [...prev.selectedMilestones, milestoneId]
        : prev.selectedMilestones.filter((id) => id !== milestoneId),
    }));
    const nextIds = checked
      ? [...disputeForm.selectedMilestones, milestoneId]
      : disputeForm.selectedMilestones.filter((id) => id !== milestoneId);
    const first = job?.milestones?.find((x) => x.id === nextIds[0]);
    setDisputeMilestone(first || null);
  };

  const handleSelectAllMilestones = () => {
    if (allSelected) {
      setDisputeForm((prev) => ({ ...prev, selectedMilestones: [] }));
      setDisputeMilestone(null);
    } else {
      const ids = inProgressMilestones.map((m) => m.id);
      setDisputeForm((prev) => ({ ...prev, selectedMilestones: ids }));
      setDisputeMilestone(inProgressMilestones[0] || null);
    }
  };

  const handleSubmitDispute = async () => {
    const reason = [disputeForm.requirements, disputeForm.notCompleted].filter(Boolean).join("\n\n");
    if (!reason.trim()) {
      toast.error("Please describe the reason for the dispute");
      return;
    }
    const toDispute = disputeForm.selectedMilestones.length > 0
      ? disputeForm.selectedMilestones
      : (disputeMilestone ? [disputeMilestone.id] : []);
    if (toDispute.length === 0) {
      toast.error("Please select at least one milestone to dispute");
      return;
    }

    const evidence = disputeForm.evidenceFiles.length > 0
      ? `${disputeForm.evidenceFiles.length} file(s) attached`
      : undefined;

    try {
      let firstDisputeId: string | null = null;
      for (const milestoneId of toDispute) {
        const disputeId = await createDispute(job.id, milestoneId, reason.trim(), evidence);
        if (disputeId && !firstDisputeId) firstDisputeId = disputeId;
      }
      toast.success(toDispute.length === 1 ? "Dispute submitted successfully" : `${toDispute.length} disputes submitted successfully`);
      setShowDisputeModal(false);
      setDisputeMilestone(null);
      setDisputeForm((prev) => ({ ...prev, selectedMilestones: [] }));
      if (firstDisputeId) navigate(`/disputes/${firstDisputeId}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create dispute");
    }
  };

  const handleViewInvoice = (milestoneId: string) => {
    if (!job?.id) return;
    const url = resolveApiUrl(`/api/jobs/${job.id}/milestones/${milestoneId}/invoice`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleStartChat = (quote: JobQuote) => {
    startConversation({
      id: quote.professionalId,
      name: quote.professionalName,
      avatar: quote.professionalAvatar,
      online: true,
      jobId: job?.id,
      jobTitle: job?.title,
    });
  };

  const openProfessionalProfileSlider = async (quote: JobQuote) => {
    setSelectedQuoteForProfile(quote);
    setShowProProfileSlider(true);
    // Ensure the first paint is off-screen, then animate in.
    setProProfileSliderAnimateIn(false);
    if (proProfileSliderAnimTimerRef.current) {
      window.clearTimeout(proProfileSliderAnimTimerRef.current);
      proProfileSliderAnimTimerRef.current = null;
    }
    setProProfileActiveTab("about");
    setProProfileLoading(true);
    setProProfileData(null);
    setProProfileServices([]);
    setProProfileServicesLoading(true);
    // Next tick after the slider is mounted.
    proProfileSliderAnimTimerRef.current = window.setTimeout(() => {
      setProProfileSliderAnimateIn(true);
    }, 30);
    try {
      const [profileRes, servicesRes] = await Promise.all([
        fetch(resolveApiUrl(`/api/auth/profile/${quote.professionalId}`), { credentials: "include" }),
        fetch(
          resolveApiUrl(
            `/api/services?professionalId=${encodeURIComponent(quote.professionalId)}&activeOnly=true&status=active&limit=100`
          ),
          { credentials: "include" }
        ),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProProfileData(data?.profile ?? null);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        const rawServices = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : [];

        const services = rawServices.map((s: any) => {
          // Build thumbnail image & video exactly like ProfilePage
          let thumbnailImage = "";
          let thumbnailVideo: { url: string; thumbnail?: string } | null = null;
          if (s.gallery && Array.isArray(s.gallery) && s.gallery.length > 0) {
            const firstItem = s.gallery[0];
            if (firstItem.type === "video" && firstItem.url) {
              thumbnailVideo = {
                url: firstItem.url,
                thumbnail: firstItem.thumbnail,
              };
              thumbnailImage = firstItem.thumbnail || "";
            } else if (firstItem.type === "image" && firstItem.url) {
              thumbnailImage = firstItem.url;
            }
          }
          if (!thumbnailImage && !thumbnailVideo) {
            thumbnailImage = s.images?.[0] || s.portfolioImages?.[0] || "";
          }

          return {
            id: parseInt(s._id?.slice(-8), 16) || Math.floor(Math.random() * 10000),
            _id: s._id,
            slug: s.slug,
            image: thumbnailImage,
            thumbnailVideo,
            professionalId:
              typeof s.professional === "object"
                ? (s.professional._id || s.professional.id || s.professional)
                : (typeof s.professional === "string" ? s.professional : null),
            providerName:
              typeof s.professional === "object"
                ? (s.professional.tradingName || "Professional")
                : "",
            tradingName:
              typeof s.professional === "object"
                ? s.professional.tradingName || ""
                : "",
            providerImage:
              typeof s.professional === "object"
                ? s.professional.avatar || ""
                : "",
            providerRating:
              typeof s.professional === "object"
                ? s.professional.rating || 0
                : 0,
            providerReviewCount:
              typeof s.professional === "object"
                ? s.professional.reviewCount || 0
                : 0,
            providerIsVerified: (() => {
              if (typeof s.professional !== "object") return false;
              return s.professional.isVerified || false;
            })(),
            description: s.title || "",
            category:
              typeof s.serviceCategory === "object" && typeof s.serviceCategory.sector === "object"
                ? s.serviceCategory.sector.name || ""
                : "",
            townCity: (() => {
              if (s.professional && typeof s.professional === "object" && s.professional !== null) {
                const value = s.professional.townCity;
                return value !== undefined && value !== null ? String(value) : "";
              }
              return "";
            })(),
            subcategory:
              typeof s.serviceCategory === "object" ? s.serviceCategory.name || "" : "",
            serviceCategory: s.serviceCategory,
            detailedSubcategory:
              typeof s.serviceSubCategory === "object" ? s.serviceSubCategory.name || "" : undefined,
            rating: s.rating || 0,
            reviewCount: s.reviewCount || 0,
            completedTasks: s.completedTasks || 0,
            price: formatPrice(Number(s.price) || 0),
            originalPrice:
              s.originalPrice != null &&
              (!s.originalPriceValidFrom || new Date(s.originalPriceValidFrom) <= new Date()) &&
              (!s.originalPriceValidUntil || new Date(s.originalPriceValidUntil) >= new Date())
                ? formatPrice(Number(s.originalPrice))
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
            addons:
              s.addons?.map((a: any) => ({
                id: a.id || a._id,
                name: a.name,
                description: a.description || "",
                price: a.price,
              })) || [],
            idealFor: s.idealFor || [],
            specialization: "",
            packages:
              s.packages?.map((p: any) => ({
                id: p.id || p._id,
                name: p.name,
                price: formatPrice(Number(p.price) || 0),
                originalPrice: p.originalPrice != null ? formatPrice(Number(p.originalPrice)) : undefined,
                originalPriceValidFrom: p.originalPriceValidFrom || null,
                originalPriceValidUntil: p.originalPriceValidUntil || null,
                priceUnit: "fixed",
                description: p.description || "",
                highlights: [],
                features: p.features || [],
                deliveryTime: p.deliveryDays
                  ? `${p.deliveryDays} ${p.deliveryDays <= 1 ? "day" : "days"}`
                  : undefined,
                revisions: p.revisions || "",
              })) || [],
            skills: s.skills || [],
            responseTime: s.responseTime || "",
            portfolioImages: s.portfolioImages || [],
          };
        });

        setProProfileServices(services);
      } else {
        setProProfileServices([]);
      }
    } catch {
      // ignore, slider will just show minimal info
    } finally {
      setProProfileLoading(false);
      setProProfileServicesLoading(false);
    }
  };

  const closeProfessionalProfileSlider = () => {
    setShowProProfileSlider(false);
    setProProfileSliderAnimateIn(false);
    if (proProfileSliderAnimTimerRef.current) {
      window.clearTimeout(proProfileSliderAnimTimerRef.current);
      proProfileSliderAnimTimerRef.current = null;
    }
    setSelectedQuoteForProfile(null);
    setProProfileData(null);
    setProProfileServices([]);
  };

  const isUserOnline = (id?: string | null) => {
    if (!id) return false;
    return getContactById(id)?.online === true;
  };

  const openQuoteCreditsSlider = () => {
    setShowQuoteCreditsSlider(true);
    setQuoteCreditsSliderAnimateIn(false);
    setHideQuoteCreditsSliderPanel(false);
    if (quoteCreditsSliderAnimTimerRef.current) {
      window.clearTimeout(quoteCreditsSliderAnimTimerRef.current);
      quoteCreditsSliderAnimTimerRef.current = null;
    }
    quoteCreditsSliderAnimTimerRef.current = window.setTimeout(() => {
      setQuoteCreditsSliderAnimateIn(true);
    }, 30);
  };

  const closeQuoteCreditsSlider = () => {
    setShowQuoteCreditsSlider(false);
    setQuoteCreditsSliderAnimateIn(false);
    setHideQuoteCreditsSliderPanel(false);
    if (quoteCreditsSliderAnimTimerRef.current) {
      window.clearTimeout(quoteCreditsSliderAnimTimerRef.current);
      quoteCreditsSliderAnimTimerRef.current = null;
    }
  };

  /** Pro: open chat with the job client (when job is in progress). */
  const handleStartChatWithClient = () => {
    if (job?.clientId) startConversation(job.clientId);
  };

  const openClientPreview = async () => {
    if (!job?.id) return;
    setShowClientPreviewModal(true);
    setClientPreviewData(null);
    setClientPreviewTab("about");
    setClientPreviewLoading(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${job.slug || job.id}/client-profile`), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClientPreviewData({
          name: data.name || "Client",
          avatar: data.avatar,
          createdAt: data.createdAt || null,
          bio: data.bio || "",
          country: data.country || null,
          townCity: data.townCity || null,
          reviews: data.reviews || [],
          reviewCount: data.reviewCount ?? 0,
          ratingAverage: data.ratingAverage ?? 0,
        });
      }
    } catch {
      toast.error("Failed to load client profile");
    } finally {
      setClientPreviewLoading(false);
    }
  };

  const formatNameWithLastInitial = (raw?: string | null) => {
    const name = (raw || "").toString().trim();
    if (!name) return "Client";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return parts[0] || "Client";
    const first = parts[0];
    const last = parts[parts.length - 1];
    const initial = last ? `${last.charAt(0)}.` : "";
    return `${first} ${initial}`.trim();
  };

  const handleWithdrawConfirm = async () => {
    if (!quoteToWithdraw) return;
    setWithdrawing(true);
    try {
      await withdrawQuote(quoteToWithdraw.jobId, quoteToWithdraw.quoteId);
      toast.success("Quote withdrawn.");
      setQuoteToWithdraw(null);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to withdraw quote");
    } finally {
      setWithdrawing(false);
    }
  };

  const openEditQuoteModal = (quote: JobQuote) => {
    if (!job) return;
    setEditingQuoteMeta({ jobId: job.id, quoteId: quote.id });
    setQuoteForm({
      price: fromGBP(quote.price).toFixed(2),
      deliveryTime: quote.deliveryTime || "",
      message: quote.message || "",
    });
    setShowQuoteDialog(true);
  };

  const handleSubmitQuote = async () => {
    if (!quoteForm.price || !quoteForm.deliveryTime || !quoteForm.message) {
      toast.error("Please fill in all fields");
      return;
    }
    const priceInSelected = parseFloat(quoteForm.price);
    if (isNaN(priceInSelected) || priceInSelected <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    const priceGBP = toGBP(priceInSelected);
    const minPrice = job.budgetMin ?? job.budgetAmount;
    const maxPrice = job.budgetMax ?? job.budgetAmount * 1.2;
    if (priceGBP < minPrice || priceGBP > maxPrice) {
      toast.error(`Price must be between ${formatPrice(minPrice)} and ${formatPrice(maxPrice)} (job budget range)`);
      return;
    }
    if (editingQuoteMeta) {
      setEditSubmitting(true);
      try {
        await updateQuoteByProfessional(editingQuoteMeta.jobId, editingQuoteMeta.quoteId, {
          price: priceGBP,
          deliveryTime: quoteForm.deliveryTime.trim(),
          message: quoteForm.message.trim(),
        });
        toast.success("Quote updated.");
        setShowQuoteDialog(false);
        setEditingQuoteMeta(null);
        setQuoteForm({ price: "", deliveryTime: "", message: "" });
      } catch (e: unknown) {
        toast.error((e as Error)?.message || "Failed to update quote");
      } finally {
        setEditSubmitting(false);
      }
      return;
    }
    try {
      // Suggested milestones validation: if user entered any milestone fields, total must match the quote price (in selected currency).
      if (hasAnyMilestoneInput) {
        if (!quotePriceSelectedValid) {
          toast.error("Please enter a valid price before adding milestones");
          return;
        }
        if (isMilestonesOver) {
          toast.error(`Milestone total exceeds your quote price by ${symbol}${Math.abs(milestoneDiff).toFixed(2)}`);
          return;
        }
        if (!isMilestonesExact) {
          toast.error(`Milestone total must match your quote price. Remaining: ${symbol}${milestoneDiff.toFixed(2)}`);
          return;
        }
      }

      const cleanedSuggestedMilestones = milestones
        .map((m) => {
          const description = (m.description || "").trim();
          const amountInSelected = m.amount != null && m.amount !== "" ? Number(m.amount) : NaN;
          if (!description || isNaN(amountInSelected) || amountInSelected <= 0) return null;
          return { description, amount: toGBP(amountInSelected) };
        })
        .filter((m): m is { description: string; amount: number } => !!m);

      await addQuoteToJob(job.id, {
        professionalId: userInfo?.id || "",
        professionalName: userInfo?.businessName || userInfo?.name || "Professional",
        professionalAvatar: userInfo?.avatar,
        professionalRating: 4.8,
        professionalReviews: 0,
        price: priceGBP,
        deliveryTime: quoteForm.deliveryTime,
        message: quoteForm.message,
        suggestedMilestones: cleanedSuggestedMilestones,
      });
      toast.success("Quote submitted successfully!");
      // Notify credit UI to refresh (free credits are consumed first, then purchased)
      try {
        window.dispatchEvent(new Event("bids:changed"));
      } catch {}
      setShowQuoteDialog(false);
      setQuoteForm({ price: "", deliveryTime: "", message: "" });
      setMilestones([{ description: "", amount: "" }]);
    } catch (e: any) {
      const msg = String(e?.message || "");
      const isCreditError =
        /credit|credits|bid|bids|insufficient/i.test(msg) &&
        /credit|bid/i.test(msg); // keep narrow to avoid hijacking unrelated errors
      if (isCreditError) {
        openQuoteCreditsSlider();
      } else {
        toast.error(msg || "Failed to submit quote");
      }
    }
  };

  // Milestone functions for quote form
  const addMilestoneToForm = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const getTimingBadge = () => {
    if (job.timing === "urgent") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 font-['Poppins',sans-serif]">
          <Flame className="w-3 h-3 mr-1" />
          Urgent
        </Badge>
      );
    }
    if (job.timing === "soon") {
      return (
        <Badge className="bg-orange-50 text-orange-800 border-orange-200 font-['Poppins',sans-serif]">
          <Clock className="w-3 h-3 mr-1" />
          Soon
        </Badge>
      );
    }
    if (job.timing === "flexible") {
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-['Poppins',sans-serif]">
          <Clock className="w-3 h-3 mr-1" />
          Flexible
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-50 text-gray-700 border-gray-200 font-['Poppins',sans-serif]">
        <Calendar className="w-3 h-3 mr-1" />
        {job.specificDate || "Specific Date"}
      </Badge>
    );
  };

  const getStatusBadge = (size: "normal" | "large" = "normal") => {
    // JobDetailPage viewer can be either the client (job owner) or a professional.
    // To keep badge styling consistent with the My Jobs cards, we switch variants by ownership.
    const VariantBadge = isJobOwner ? ClientJobListStatusBadge : ProActiveJobListStatusBadge;
    return <VariantBadge status={job.status} size={size} />;
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] relative">
      {/* Floating tools animation behind body layout */}
      <FloatingToolsBackground contained />
      <div className="relative z-10">
      {/* Navigation */}
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      {/* Header Section - White */}
      <div className="bg-white py-1 md:py-2 mt-[50px] md:mt-0">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 lg:px-16">
          <Button
            variant="ghost"
            onClick={() => navigate("/account?tab=my-jobs")}
            className="text-[#2c353f] hover:bg-gray-100 mb-3 md:mb-4 font-['Poppins',sans-serif] text-[10px] md:text-[11px] h-8 md:h-10 px-2 md:px-4"
          >
            <ChevronLeft className="w-2 h-2 md:w-2 md:h-2" />
            {isJobOwner ? "Back to My Jobs" : "Back to Available Jobs"}
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 shadow-lg p-4 rounded-lg">
            <div className="flex-1 min-w-0">
              <h1 className="font-['Poppins',sans-serif] text-[14px] sm:text-[18px] md:text-[24px] text-[#2c353f] leading-tight">
                {job.title}
              </h1>
              
          {/* Client info – below job title */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openClientPreview}
              className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity rounded-lg p-1 -m-1"
              aria-label="View client profile"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap text-[12px] sm:text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif]">
                  <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f]">
                    {isJobOwner
                      ? formatNameWithLastInitial(userInfo?.name || "Client")
                      : formatNameWithLastInitial(job.clientName || "Client")}
                  </p>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-[#2c353f] fill-[#2c353f]" />
                    {(job.clientRatingAverage ?? 0).toFixed(1)}
                  </span>
                  {(job.clientCountry || job.clientCity) && (
                    <span>• {[job.clientCity, job.clientCountry].filter(Boolean).join(", ")}</span>
                  )}
                </div>
              </div>
            </button>
            {/* View icon button (right of address) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openClientPreview}
              className="h-8 w-8 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f]"
              aria-label="View client profile"
              title="View client profile"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Professional: Already submitted – hide from In Progress onwards */}
                {!isJobOwner && hasSubmittedQuote && job?.status === "open" && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 font-['Poppins',sans-serif] px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[14px]">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    Quote Submitted
                  </Badge>
                )}
                {/* Job Status Badge */}
                {getStatusBadge("large")}
              </div>
              {/* Share button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#FE8A0F] border-0 shadow-none"
                onClick={() => setShowShareModal(true)}
                aria-label="Share this job"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 lg:px-16">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="overflow-x-auto scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-2 flex-nowrap inline-flex min-w-full md:min-w-0">
                <TabsTrigger
                  value="details"
                  className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="quotes"
                  className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  Quotes ({job.quotes.length})
                </TabsTrigger>
                {/* Payment: active work or completed (milestones + summary still visible) */}
                {(job.status === "awaiting-accept" ||
                  job.status === "in-progress" ||
                  job.status === "delivered" ||
                  job.status === "completed") && (
                  <TabsTrigger
                    value="payment"
                    className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    Payment
                  </TabsTrigger>
                )}
                {/* File tab: client + awarded pro only */}
                {showFileTab && (
                  <TabsTrigger
                    value="files"
                    className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    File
                  </TabsTrigger>
                )}
                {showReviewTab && (
                  <TabsTrigger
                    value="review"
                    className="bg-transparent border-0 text-[#6b6b6b] data-[state=active]:text-[#FE8A0F] data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#FE8A0F] hover:text-[#2c353f] hover:bg-gray-50 rounded-t-lg rounded-b-none px-4 md:px-6 py-3 font-['Poppins',sans-serif] text-[14px] md:text-[15px] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    Review
                  </TabsTrigger>
                )}
                {isJobOwner && (
                  <div className="ml-auto flex-shrink-0 pl-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f]"
                          aria-label="Manage job"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="font-['Poppins',sans-serif] min-w-[180px]">
                        <DropdownMenuItem onClick={handleEditJob} className="cursor-pointer">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleRepostJob} className="cursor-pointer">
                          <Undo2 className="h-4 w-4 mr-2" />
                          Repost Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCloseQuotes} className="cursor-pointer" disabled={job.status !== "open"}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Close Quotes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDeleteJobClick} variant="destructive" className="cursor-pointer">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 lg:px-16 py-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Main Content - full width */}
          <div className="space-y-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between">
                  <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                    Job Details
                  </h2>
                  <div className="text-right">
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-1">
                      {job.budgetMin != null && job.budgetMax != null
                        ? `${formatPrice(job.budgetMin ?? 0)} - ${formatPrice(job.budgetMax ?? 0)}`
                        : `${formatPrice(job.budgetAmount ?? 0)} - ${formatPrice((job.budgetAmount ?? 0) * 1.2)}`}
                    </p>
                    {getJobEndsInText() && (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                        {getJobEndsInText()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="py-3">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-4 whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>

                  {job.timing === "urgent" && (
                    <div className="border-t border-gray-100 py-4">
                      <h3 className="font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f] mb-2">
                        Job start and completion time (Urgent completion)
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-relaxed">
                        The job starts{" "}
                        {formatUrgentJobStartLine(job.specificDate || job.postedAt)} and is expected to be completed
                        within 24 hours.
                      </p>
                    </div>
                  )}

                  {job.timing === "soon" && (
                    <div className="border-t border-gray-100 py-4">
                      <h3 className="font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f] mb-2">
                        Job start and completion time (Soon)
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-relaxed">
                        {job.specificDate?.trim() ? (
                          <>
                            The job starts on {formatUrgentJobStartLine(job.specificDate)} and is to be completed within
                            one week.
                          </>
                        ) : (
                          <>The job is to be started and completed within one week.</>
                        )}
                      </p>
                    </div>
                  )}

                  {job.timing === "flexible" && (
                    <div className="border-t border-gray-100 py-4">
                      <h3 className="font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f] mb-2">
                        Job start and completion time (Flexible)
                      </h3>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] leading-relaxed">
                        {job.specificDate?.trim() ? (
                          <>
                            The job starts on {formatUrgentJobStartLine(job.specificDate)} and is to be completed within
                            one month.
                          </>
                        ) : (
                          <>The Job is to be started and completed within one month.</>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="py-3 border-t border-gray-100">
                    <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                      Skill Required
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.categories.map((category, idx) => (
                        <Badge
                          key={idx}
                          className="bg-[#E3F2FD] text-[#1976D2] border-[#1976D2]/30 font-['Poppins',sans-serif]"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Status and Timing Badges */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                    {getStatusBadge()}
                    {getTimingBadge()}
                  </div>

                  {/* Attachments (post-job files): text list; click opens preview modal */}
                  {job.attachments && job.attachments.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                        Attachments
                      </h3>
                      <ul className="space-y-2">
                        {job.attachments.map((att, idx) => {
                          const isImage = (att.mimeType || "").startsWith("image/");
                          const isVideo = (att.mimeType || "").startsWith("video/");
                          const src = resolveApiUrl(att.url);
                          const canPreview = isImage || isVideo;
                          return (
                            <li key={idx} className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#6b6b6b] flex-shrink-0" />
                              {canPreview ? (
                                <button
                                  type="button"
                                  onClick={() => setAttachmentPreview({ name: att.name, url: att.url, mimeType: att.mimeType || "" })}
                                  className="font-['Poppins',sans-serif] text-[14px] text-[#1976D2] hover:underline text-left truncate max-w-full"
                                >
                                  {att.name}
                                </button>
                              ) : (
                                <a
                                  href={src}
                                  download={att.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-['Poppins',sans-serif] text-[14px] text-[#1976D2] hover:underline truncate max-w-full"
                                >
                                  {att.name}
                                </a>
                              )}
                              <a
                                href={src}
                                download={att.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-[#6b6b6b] hover:text-[#1976D2]"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer: Report this job + Job ID */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setReportJobReason(""); setReportJobMessage(""); setShowReportJobModal(true); }}
                    className="text-[#1976D2] hover:text-[#1565C0] font-['Poppins',sans-serif] text-[13px] flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Report this job
                  </button>
                  <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                    {job.id.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Quotes Tab */}
            {activeTab === "quotes" && (
              <div className="space-y-4">
                {/* Awarded Professionals: top section for client (awarded quotes) and for professional (their awarded quote) */}
                {(userRole === "professional" && myAwardedQuote) || (isJobOwner && awardedQuotes.length > 0) ? (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
                      Awarded Professionals
                    </h2>
                    {userRole === "professional" && myAwardedQuote ? (
                    <div className="relative flex flex-col gap-4 bg-orange-50 border border-orange-200 p-4 sm:p-5 rounded-lg shadow-lg overflow-hidden">
                      {/* Accepted ribbon badge: bottom-left, 3D, orange bg, white text — only when job in progress */}
                      {job?.status === "in-progress" && (
                        <div
                          className="absolute bottom-0 left-0 font-['Poppins',sans-serif] font-bold text-white text-[13px] sm:text-[14px] tracking-wide uppercase px-4 py-2 bg-[#FE8A0F] shadow-[2px_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-tr-lg"
                          style={{ textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}
                        >
                          Accepted
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-5">
                        {/* Left column (70%) */}
                        <div className="sm:w-[70%] min-w-0">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <a href={`/profile/${myAwardedQuote.professionalId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="relative">
                                    <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
                                    {resolveAvatarUrl(myAwardedQuote.professionalAvatar) && (
                                      <AvatarImage src={resolveAvatarUrl(myAwardedQuote.professionalAvatar)} />
                                    )}
                                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[18px]">
                                      {getTwoLetterInitials(myAwardedQuote.professionalName, "P")}
                                    </AvatarFallback>
                                    </Avatar>
                                    <span
                                      className={cn(
                                        "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                                        isUserOnline(myAwardedQuote.professionalId) ? "bg-green-500" : "bg-gray-400"
                                      )}
                                      aria-label={isUserOnline(myAwardedQuote.professionalId) ? "Online" : "Offline"}
                                    />
                                  </div>
                                </a>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <a href={`/profile/${myAwardedQuote.professionalId}`} target="_blank" rel="noopener noreferrer" className="block hover:underline min-w-0" onClick={(e) => e.stopPropagation()}>
                                      <h3 className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f] mb-1 truncate">
                                        {myAwardedQuote.professionalName}
                                      </h3>
                                    </a>
                                    <VerificationBadge fullyVerified={myAwardedQuote.professionalFullyVerified} size="sm" />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openProfessionalProfileSlider(myAwardedQuote)}
                                      className="h-8 w-8 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f] flex-shrink-0"
                                      aria-label="View professional profile"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <div className="flex items-center gap-2 px-2 py-1 rounded">
                                      <StarRating rating={Number(myAwardedQuote.professionalRating)} size="md" />
                                      <span className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px]">
                                        {formatNumber(Number(myAwardedQuote.professionalRating), 1)}
                                      </span>
                                    </div>
                                    <span className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b]">
                                      ({myAwardedQuote.professionalReviews} {myAwardedQuote.professionalReviews === 1 ? 'review' : 'reviews'})
                                    </span>
                                    {!!myAwardedQuote.professionalCountry && (
                                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] text-[#6b6b6b]">
                                        <span className="truncate max-w-[160px]">{(myAwardedQuote as any).professionalTownCity || myAwardedQuote.professionalCountry}</span>
                                        {(() => {
                                          const iso = iso2FromCountry(myAwardedQuote.professionalCountry);
                                          return iso ? (
                                            <ReactCountryFlag countryCode={iso} svg className="w-5 h-5 rounded-sm" aria-label={myAwardedQuote.professionalCountry} />
                                          ) : null;
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                  {!!(myAwardedQuote as any).professionalProfileTitle && (
                                    <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#2c353f] font-bold -mt-1 mb-2">
                                      {(myAwardedQuote as any).professionalProfileTitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f] mt-3">
                            {(() => {
                              const m = myAwardedQuote.message || "will do";
                              const long = m.length > 400;
                              const open = expandedQuoteMessages.has(myAwardedQuote.id);
                              const text = open ? m : (long ? m.slice(0, 400) + "..." : m);
                              return (
                                <>
                                  {open ? <p className="whitespace-pre-wrap">{text}</p> : <span>{text}</span>}
                                  {long && (
                                    <button type="button" onClick={() => toggleQuoteMessageExpanded(myAwardedQuote.id)} className="text-[#3B82F6] hover:underline ml-1 text-[12px]">
                                      {open ? "Read less" : "Read more"}
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Right column (30%) */}
                        <div className="sm:w-[30%] flex flex-col gap-3 sm:items-end">
                          <div className="text-right flex-shrink-0 whitespace-nowrap">
                            <p className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#2c353f]">
                              {formatPriceWhole(Number(myAwardedQuote.price))}
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b]">
                              {formatDeliveryDisplay(myAwardedQuote.deliveryTime || "")}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 flex-wrap pt-2 mt-auto">
                            {job?.status === "in-progress" && (
                              <Button
                                onClick={handleStartChatWithClient}
                                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2"
                              >
                                Chat
                              </Button>
                            )}
                            {job?.status === "awaiting-accept" && (
                              <>
                                <Button
                                  onClick={handleAcceptAward}
                                  className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2 transition-all duration-300"
                                >
                                  Accept
                                </Button>
                                <Button
                                  onClick={() => setShowRejectAwardConfirm(true)}
                                  className="bg-[#DC3545] hover:bg-[#C82333] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2"
                                >
                                  Reject &nbsp; 
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : null}
                    {isJobOwner && awardedQuotes.length > 0 && awardedQuotes.map((quote) => {
                      const msg = quote.message || "";
                      const isLong = msg.length > 400;
                      const expanded = expandedQuoteMessages.has(quote.id);
                      const displayMsg = expanded ? msg : (isLong ? msg.slice(0, 400) + "..." : msg);
                      const showAcceptedBadge = job?.status === "in-progress" && quote.status === "accepted";
                      const quoteAvatarSrc = resolveAvatarUrl(quote.professionalAvatar);
                      const profileTitle = (quote as any).professionalProfileTitle as string | undefined;
                      return (
                        <div key={quote.id} className="relative flex flex-col gap-4 bg-orange-50 border border-orange-200 p-4 sm:p-5 rounded-lg shadow-lg mt-4 first:mt-0 overflow-hidden">
                          {showAcceptedBadge && (
                            <div
                              className="absolute bottom-0 left-0 font-['Poppins',sans-serif] font-bold text-white text-[13px] sm:text-[14px] tracking-wide uppercase px-4 py-2 bg-[#FE8A0F] shadow-[2px_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-tr-lg"
                              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}
                            >
                              Accepted
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-stretch gap-5">
                            {/* Left column (70%) */}
                            <div className="sm:w-[70%] min-w-0 sm:min-h-0">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3">
                                    <a href={`/profile/${quote.professionalId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <div className="relative">
                                        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
                                        {quoteAvatarSrc && <AvatarImage src={quoteAvatarSrc} alt={quote.professionalName} />}
                                        <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[18px]">
                                          {getTwoLetterInitials(quote.professionalName, "P")}
                                        </AvatarFallback>
                                        </Avatar>
                                        <span
                                          className={cn(
                                            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                                            isUserOnline(quote.professionalId) ? "bg-green-500" : "bg-gray-400"
                                          )}
                                          aria-label={isUserOnline(quote.professionalId) ? "Online" : "Offline"}
                                        />
                                      </div>
                                    </a>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <a href={`/profile/${quote.professionalId}`} target="_blank" rel="noopener noreferrer" className="block hover:underline min-w-0" onClick={(e) => e.stopPropagation()}>
                                          <h3 className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f] mb-1 truncate">{quote.professionalName}</h3>
                                        </a>
                                        <VerificationBadge fullyVerified={quote.professionalFullyVerified} size="sm" />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openProfessionalProfileSlider(quote)}
                                          className="h-8 w-8 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f] flex-shrink-0"
                                          aria-label="View professional profile"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded">
                                          <StarRating rating={Number(quote.professionalRating)} size="md" />
                                          <span className="font-['Poppins',sans-serif] text-[14px] sm:text-[16px]">
                                            {formatNumber(Number(quote.professionalRating), 1)}
                                          </span>
                                        </div>
                                        <span className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b]">({quote.professionalReviews} {quote.professionalReviews === 1 ? 'review' : 'reviews'})</span>
                                        {!!quote.professionalCountry && (
                                          <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] text-[#6b6b6b]">
                                            <span className="truncate max-w-[160px]">{(quote as any).professionalTownCity || quote.professionalCountry}</span>
                                            {(() => {
                                              const iso = iso2FromCountry(quote.professionalCountry);
                                              return iso ? (
                                                <ReactCountryFlag countryCode={iso} svg className="w-5 h-5 rounded-sm" aria-label={quote.professionalCountry} />
                                              ) : null;
                                            })()}
                                          </span>
                                        )}
                                      </div>
                                      {!!profileTitle && (
                                        <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#2c353f] font-bold -mt-1 mb-2">
                                          {profileTitle}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f] mt-3">
                                {expanded ? (
                                  <p className="whitespace-pre-wrap">{displayMsg}</p>
                                ) : (
                                  <span>{displayMsg}</span>
                                )}
                                {isLong && (
                                  <button
                                    type="button"
                                    onClick={() => toggleQuoteMessageExpanded(quote.id)}
                                    className="text-[#3B82F6] hover:underline ml-1 text-[12px]"
                                  >
                                    {expanded ? "Read less" : "Read more"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Right column (30%) — price top, Chat pinned to card bottom on sm+ */}
                            <div className="sm:w-[30%] flex flex-col gap-3 sm:items-end sm:min-h-0">
                              <div className="text-right flex-shrink-0 whitespace-nowrap">
                                <p className="font-['Poppins',sans-serif] text-[20px] sm:text-[24px] text-[#2c353f]">
                                  {formatPriceWhole(Number(quote.price))}
                                </p>
                                <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b]">
                                  {formatDeliveryDisplay(quote.deliveryTime || "")}
                                </p>
                              </div>
                              <div className="mt-auto flex justify-end gap-2 pt-2 sm:pt-0 w-full sm:w-auto">
                                <Button onClick={() => handleStartChat(quote)} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-5 py-2">
                                  Chat
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {/* Quote list: keep rendering even when "Awarded Professionals" is shown */}
                {showQuotesEmptyState ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 md:p-24 text-center">
                    {isJobOwner ? (
                      <div className="mx-auto mb-6 flex min-h-[80px] justify-center">
                        <RotatingGlobeWithLines />
                      </div>
                    ) : (
                      <div className="mx-auto mb-6 flex justify-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                          <FileSearch className="h-12 w-12" strokeWidth={1.25} aria-hidden />
                        </div>
                      </div>
                    )}
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#6b7280] leading-relaxed max-w-xl mx-auto">
                      {isJobOwner
                        ? "Thank you for posting your job, our vetted professionals will quote soon."
                        : "You haven't submitted a quote yet. Submit a quote to appear here."}
                    </p>
                    {!isJobOwner && job.status === "open" && !hasSubmittedQuote && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          onClick={() => {
                            setEditingQuoteMeta(null);
                            setQuoteForm({ price: "", deliveryTime: "", message: "" });
                            setShowQuoteDialog(true);
                          }}
                          className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif] text-[14px] h-10 px-6"
                        >
                          Submit Quote
                        </Button>
                      </div>
                    )}
                    {isJobOwner && (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]/80 mt-2 inline-flex items-center gap-0.5">
                        <span className="inline-flex gap-0.5" aria-hidden>
                          <span className="w-1 h-1 rounded-full bg-[#FE8A0F]/80" style={{ animation: "quote-dot 1s ease-in-out infinite" }} />
                          <span className="w-1 h-1 rounded-full bg-[#FE8A0F]/80" style={{ animation: "quote-dot 1s ease-in-out infinite 0.2s" }} />
                          <span className="w-1 h-1 rounded-full bg-[#FE8A0F]/80" style={{ animation: "quote-dot 1s ease-in-out infinite 0.4s" }} />
                        </span>
                      </p>
                    )}
                    <style>{`
                      @keyframes quote-dot {
                        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                        40% { opacity: 1; transform: scale(1.2); }
                      }
                    `}</style>
                  </div>
                ) : (
                  listQuotes.map((quote) => {
                    const msg = quote.message || "";
                    const isLongMsg = msg.length > 400;
                    const msgExpanded = expandedQuoteMessages.has(quote.id);
                    const showMsg = msgExpanded ? msg : (isLongMsg ? msg.slice(0, 400) + "..." : msg);
                    const isAwarded = quote.status === "awarded";
                    const quoteAvatarSrc = resolveAvatarUrl(quote.professionalAvatar);
                    const suggestedMilestones = Array.isArray(quote.suggestedMilestones) ? quote.suggestedMilestones : [];
                    const hasSuggestedMilestones = suggestedMilestones.length > 0;
                    const milestonesExpanded = expandedQuoteMilestones.has(quote.id);
                    const profileTitle = quote.professionalProfileTitle;
                    return (
                    <div
                      key={quote.id}
                      className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                        quote.status === "accepted"
                          ? "bg-white border-green-500 shadow-sm"
                          : isAwarded
                          ? "bg-orange-50 border-orange-300 shadow-lg"
                          : quote.status === "rejected"
                          ? "bg-white border-gray-200 opacity-60"
                          : "bg-white border-gray-200 hover:border-[#FE8A0F] hover:shadow-md"
                      }`}
                    >
                      {/* Mobile Layout */}
                      <div className="block sm:hidden p-4">
                      <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <a href={`/profile/${quote.professionalId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                  <Avatar className="w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                                  {quoteAvatarSrc && (
                                    <AvatarImage src={quoteAvatarSrc} alt={quote.professionalName} />
                                  )}
                                  <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                                    {getTwoLetterInitials(quote.professionalName, "P")}
                                  </AvatarFallback>
                                  </Avatar>
                                  <span
                                    className={cn(
                                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                                      isUserOnline(quote.professionalId) ? "bg-green-500" : "bg-gray-400"
                                    )}
                                    aria-label={isUserOnline(quote.professionalId) ? "Online" : "Offline"}
                                  />
                                </div>
                              </a>
                              <div className="flex items-center gap-2 min-w-0">
                                <a href={`/profile/${quote.professionalId}`} target="_blank" rel="noopener noreferrer" className="block hover:underline min-w-0" onClick={(e) => e.stopPropagation()}>
                                  <h3 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-medium truncate">
                                    {quote.professionalName}
                                  </h3>
                                </a>
                                <VerificationBadge fullyVerified={quote.professionalFullyVerified} size="sm" />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openProfessionalProfileSlider(quote)}
                                  className="h-7 w-7 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f] flex-shrink-0"
                                  aria-label="View professional profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-[#6b6b6b] mb-1 flex-wrap">
                              <div className="flex items-center gap-2">
                                <StarRating rating={Number(quote.professionalRating)} size="xs" />
                                <span>{formatNumber(Number(quote.professionalRating), 1)}</span>
                                <span className="text-[#8d8d8d]">({quote.professionalReviews} {quote.professionalReviews === 1 ? 'review' : 'reviews'})</span>
                              </div>
                              {!!quote.professionalCountry && (
                                <span className="inline-flex items-center gap-1 text-[#6b6b6b]">
                                  <span className="truncate max-w-[160px]">{quote.professionalTownCity || quote.professionalCountry}</span>
                                  {(() => {
                                    const iso = iso2FromCountry(quote.professionalCountry);
                                    return iso ? (
                                      <ReactCountryFlag countryCode={iso} svg className="w-5 h-5 rounded-sm" aria-label={quote.professionalCountry} />
                                    ) : null;
                                  })()}
                                </span>
                              )}
                            </div>
                            {!!profileTitle && (
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-bold mb-1">
                                {profileTitle}
                              </p>
                            )}
                            {quote.status !== "pending" && (
                              <Badge className={`text-[10px] px-2 py-0.5 ${
                                quote.status === "accepted" ? "bg-green-50 text-green-700 border-green-200" :
                                quote.status === "awarded" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                "bg-gray-50 text-gray-700 border-gray-200"
                              }`}>
                                {quote.status === "accepted" ? "Accepted" :
                                 quote.status === "awarded" ? "Awarded" : "Rejected"}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 whitespace-nowrap">
                            <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">{formatPriceWhole(Number(quote.price))}</p>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{formatDeliveryDisplay(quote.deliveryTime || "")}</p>
                          </div>
                        </div>

                        <div className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                          {msgExpanded ? <p className="whitespace-pre-wrap">{showMsg}</p> : <span>{showMsg}</span>}
                          {isLongMsg && (
                            <button type="button" onClick={() => toggleQuoteMessageExpanded(quote.id)} className="text-[#3B82F6] hover:underline ml-1 text-[12px]">
                              {msgExpanded ? "Read less" : "Read more"}
                            </button>
                          )}
                        </div>

                        {hasSuggestedMilestones && (
                          <div className="mb-3">
                            <button
                              type="button"
                              onClick={() => toggleQuoteMilestonesExpanded(quote.id)}
                              className="inline-flex items-center gap-2 text-[12px] font-['Poppins',sans-serif] text-[#1976D2] hover:text-[#1565C0] hover:underline"
                            >
                              {milestonesExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              View Milestones
                            </button>

                            {milestonesExpanded && (
                              <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                <table className="w-full font-['Poppins',sans-serif] text-[12px]">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <th className="text-left py-2 px-3 font-medium text-[#2c353f]">Description</th>
                                      <th className="text-right py-2 px-3 font-medium text-[#2c353f]">Amount</th>
                                      <th className="text-center py-2 px-3 font-medium text-[#2c353f]">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {suggestedMilestones.map((m) => (
                                      <tr key={m.id} className="border-b border-gray-100 last:border-b-0">
                                        <td className="py-2 px-3 text-[#2c353f]">{m.description || "Milestone"}</td>
                                        <td className="py-2 px-3 text-right text-[#2c353f]">{formatPriceWhole(Number(m.amount || 0))}</td>
                                        <td className="py-2 px-3 text-center">
                                          {m.status === "pending" && (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0">
                                              Pending
                                            </Badge>
                                          )}
                                          {m.status === "accepted" && (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                                              Accepted
                                            </Badge>
                                          )}
                                          {m.status === "rejected" && (
                                            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                                              rejected
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {quote.status === "pending" && (
                          <div className="flex gap-2 justify-end">
                            {isJobOwner && (
                              <Button
                                onClick={() => handleOpenAwardModal(quote)}
                                className="flex-none bg-[#FE8A0F] hover:bg-[#E57A00] text-white font-['Poppins',sans-serif] text-[13px] h-9"
                              >
                                Award
                              </Button>
                            )}
                            {userRole === "professional" && quote.professionalId === userInfo?.id ? (
                              <>
                                <Button
                                  onClick={() => setQuoteToWithdraw({ jobId: job.id, quoteId: quote.id })}
                                  variant="outline"
                                  className="flex-none font-['Poppins',sans-serif] text-[13px] h-9 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Undo2 className="w-3 h-3 mr-1" />
                                  Withdraw
                                </Button>
                                <Button
                                  onClick={() => openEditQuoteModal(quote)}
                                  variant="outline"
                                  className="flex-none font-['Poppins',sans-serif] text-[13px] h-9 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </>
                            ) : isJobOwner && (
                              <Button
                                onClick={() => handleStartChat(quote)}
                                variant="outline"
                                className="flex-none font-['Poppins',sans-serif] text-[13px] h-9"
                              >
                                Message
                              </Button>
                            )}
                          </div>
                        )}
                        {quote.status === "accepted" && (
                          <Button
                            onClick={() => handleStartChat(quote)}
                            className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif] text-[13px] h-9"
                          >
                            Chat
                          </Button>
                        )}
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block p-5">
                        <div className="flex gap-5">
                          {/* Left column (70%): profile + message + milestones */}
                          <div className="w-[70%] min-w-0">
                            <div className="flex items-start gap-3">
                              <a
                                href={`/profile/${quote.professionalId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="relative">
                                  <Avatar className="w-16 h-16 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                                    {quoteAvatarSrc && (
                                      <AvatarImage src={quoteAvatarSrc} alt={quote.professionalName} />
                                    )}
                                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif]">
                                      {getTwoLetterInitials(quote.professionalName, "P")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span
                                    className={cn(
                                      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                                      isUserOnline(quote.professionalId) ? "bg-green-500" : "bg-gray-400"
                                    )}
                                    aria-label={isUserOnline(quote.professionalId) ? "Online" : "Offline"}
                                  />
                                </div>
                              </a>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <a
                                    href={`/profile/${quote.professionalId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block hover:underline min-w-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium truncate">
                                      {quote.professionalName}
                                    </h3>
                                  </a>
                                  <VerificationBadge fullyVerified={quote.professionalFullyVerified} size="sm" />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openProfessionalProfileSlider(quote)}
                                    className="h-8 w-8 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f] flex-shrink-0"
                                    aria-label="View professional profile"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="flex items-center gap-4 text-[13px] text-[#6b6b6b] flex-wrap mt-0.5">
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={Number(quote.professionalRating)} size="sm" />
                                    <span>{formatNumber(Number(quote.professionalRating), 1)}</span>
                                    <span className="text-[#8d8d8d]">
                                      ({quote.professionalReviews} {quote.professionalReviews === 1 ? "review" : "reviews"})
                                    </span>
                                  </div>
                                  {!!quote.professionalCountry && (
                                    <span className="inline-flex items-center gap-1 text-[#6b6b6b]">
                                      <span className="truncate max-w-[180px]">{quote.professionalTownCity || quote.professionalCountry}</span>
                                      {(() => {
                                        const iso = iso2FromCountry(quote.professionalCountry);
                                        return iso ? (
                                          <ReactCountryFlag countryCode={iso} svg className="w-5 h-5 rounded-sm" aria-label={quote.professionalCountry} />
                                        ) : null;
                                      })()}
                                    </span>
                                  )}
                                </div>

                                {!!profileTitle && (
                                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold mt-1">
                                    {profileTitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                              {msgExpanded ? <p className="whitespace-pre-wrap">{showMsg}</p> : <span>{showMsg}</span>}
                              {isLongMsg && (
                                <button
                                  type="button"
                                  onClick={() => toggleQuoteMessageExpanded(quote.id)}
                                  className="text-[#3B82F6] hover:underline ml-1 text-[12px]"
                                >
                                  {msgExpanded ? "Read less" : "Read more"}
                                </button>
                              )}
                            </div>

                            {hasSuggestedMilestones && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => toggleQuoteMilestonesExpanded(quote.id)}
                                  className="inline-flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-[#1976D2] hover:text-[#1565C0] hover:underline"
                                >
                                  {milestonesExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                  View Milestones
                                </button>

                                {milestonesExpanded && (
                                  <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                    <table className="w-full font-['Poppins',sans-serif] text-[13px]">
                                      <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                          <th className="text-left py-2.5 px-3 font-medium text-[#2c353f]">Description</th>
                                          <th className="text-right py-2.5 px-3 font-medium text-[#2c353f]">Amount</th>
                                          <th className="text-center py-2.5 px-3 font-medium text-[#2c353f]">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {suggestedMilestones.map((m) => (
                                          <tr key={m.id} className="border-b border-gray-100 last:border-b-0">
                                            <td className="py-2.5 px-3 text-[#2c353f]">{m.description || "Milestone"}</td>
                                            <td className="py-2.5 px-3 text-right text-[#2c353f]">
                                              {formatPriceWhole(Number(m.amount || 0))}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              {m.status === "pending" && (
                                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] px-2 py-0">
                                                  Pending
                                                </Badge>
                                              )}
                                              {m.status === "accepted" && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-2 py-0">
                                                  Accepted
                                                </Badge>
                                              )}
                                              {m.status === "rejected" && (
                                                <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                                                  rejected
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right column (30%): price (top) + actions (bottom) */}
                          <div className="w-[30%] flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                            <div className="text-right">
                              <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] font-bold">
                                {formatPriceWhole(Number(quote.price))}
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                                {formatDeliveryDisplay(quote.deliveryTime || "")}
                              </p>
                            </div>

                            {quote.status !== "pending" && (
                              <div className="flex justify-end">
                                <Badge
                                  className={`text-[12px] px-3 py-1 ${
                                    quote.status === "accepted"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : quote.status === "awarded"
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                  }`}
                                >
                                  {quote.status === "accepted"
                                    ? "Accepted"
                                    : quote.status === "awarded"
                                      ? "Awaiting Response"
                                      : "Rejected"}
                                </Badge>
                              </div>
                            )}

                            <div className="mt-auto flex flex-col gap-2 items-stretch">
                              {quote.status === "pending" && (
                                <>
                                  {isJobOwner && (
                                    <Button
                                      onClick={() => handleOpenAwardModal(quote)}
                                      className="w-full bg-[#FE8A0F] hover:bg-[#E57A00] text-white font-['Poppins',sans-serif] text-[14px] h-10"
                                    >
                                      Award
                                    </Button>
                                  )}
                                  {userRole === "professional" && quote.professionalId === userInfo?.id ? (
                                    <>
                                      <Button
                                        onClick={() => setQuoteToWithdraw({ jobId: job.id, quoteId: quote.id })}
                                        variant="outline"
                                        className="w-full font-['Poppins',sans-serif] text-[14px] h-10 border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        <Undo2 className="w-4 h-4 mr-2" />
                                        Withdraw
                                      </Button>
                                      <Button
                                        onClick={() => openEditQuoteModal(quote)}
                                        variant="outline"
                                        className="w-full font-['Poppins',sans-serif] text-[14px] h-10 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                                      >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                    </>
                                  ) : isJobOwner && (
                                    <Button
                                      onClick={() => handleStartChat(quote)}
                                      variant="outline"
                                      className="w-full font-['Poppins',sans-serif] text-[14px] h-10"
                                    >
                                      Message
                                    </Button>
                                  )}
                                </>
                              )}

                              {quote.status === "awarded" && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-[13px] text-[#6b6b6b] text-center">
                                  Awaiting professional&apos;s response
                                </div>
                              )}

                              {quote.status === "accepted" && (
                                <Button
                                  onClick={() => handleStartChat(quote)}
                                  className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white font-['Poppins',sans-serif] text-[14px] h-10"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Chat
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ); })
                )}

                {/* Invite Professionals List - hidden when job is in-progress (already awarded) */}
                {isJobOwner && job.status !== "in-progress" && (
                  <>
                    {recommendedProfessionalsLoading ? (
                      <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                          Loading professionals who match your job…
                        </p>
                      </div>
                    ) : (
                      <InviteProfessionalsList
                        professionals={recommendedProfessionals}
                        onInvite={handleInviteProfessional}
                        invitedProfessionalIds={invitedProfessionals}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Suggested milestones from awarded quote (shown above milestone creation; esp. after "Without milestone" award) */}
                {job.awardedProfessionalId && job.quotes && job.quotes.length > 0 && (() => {
                  const awardedQuote = job.quotes.find(
                    (q) => String(q.professionalId) === String(job.awardedProfessionalId)
                  );
                  const suggested = awardedQuote?.suggestedMilestones || [];
                  if (!awardedQuote || suggested.length === 0) return null;
                  const hasPending = suggested.some((m) => m.status === "pending");
                  const noFundedMilestonesYet = !job.milestones || job.milestones.length === 0;
                  const bulkBusy = !!suggestedBulkAction;
                  const rowBusy = !!updatingSuggestedMilestoneId || bulkBusy;
                  const suggestedTotalAmount = suggested
                    .filter((m) => m.status === "pending")
                    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
                  return (
                    <div className="mb-6 border border-dashed border-emerald-200 rounded-xl p-4 bg-emerald-50/60">
                      <div className="mb-2">
                        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#047857] flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Suggested milestone plan
                        </h3>
                      </div>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#166534] mb-2">
                        From the professional&apos;s quote. Accept to fund each step from your wallet (same as creating a milestone), or decline if you prefer a different plan.
                      </p>
                      {noFundedMilestonesYet && hasPending && (
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#065f46] mb-3 rounded-lg bg-white/80 border border-emerald-100 px-3 py-2">
                          You can use this plan as-is, or add your own milestones in the section below.
                        </p>
                      )}
                      <div className="overflow-x-auto rounded-lg border border-emerald-100 bg-white">
                        <table className="w-full font-['Poppins',sans-serif] text-[13px]">
                          <thead>
                            <tr className="bg-emerald-50 border-b border-emerald-100">
                              <th className="text-left py-2.5 px-3 text-[#064e3b] font-medium">Description</th>
                              <th className="text-right py-2.5 px-3 text-[#064e3b] font-medium">Amount</th>
                              <th className="text-center py-2.5 px-3 text-[#064e3b] font-medium">Status</th>
                              <th className="text-right py-2.5 px-3 text-[#064e3b] font-medium">
                                {isJobOwner && hasPending ? "Actions" : ""}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {suggested.map((m) => (
                              <tr key={m.id} className="border-b border-emerald-50 last:border-0">
                                <td className="py-2.5 px-3 text-[#1f2933]">
                                  {m.description || "Milestone"}
                                </td>
                                <td className="py-2.5 px-3 text-right text-[#1f2933]">
                                  {formatPriceWhole(Number(m.amount || 0))}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {m.status === "pending" && (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0">
                                      Pending
                                    </Badge>
                                  )}
                                  {m.status === "accepted" && (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                                      Accepted
                                    </Badge>
                                  )}
                                  {m.status === "rejected" && (
                                    <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                                      declined
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {isJobOwner && m.status === "pending" && (
                                    <div className="inline-flex gap-2">
                                      <Button
                                        size="sm"
                                        disabled={rowBusy}
                                        className="h-8 px-3 bg-green-600 hover:bg-green-700 !text-white border-0 shadow-sm"
                                        onClick={async () => {
                                          if (!job) return;
                                          setUpdatingSuggestedMilestoneId(m.id);
                                          try {
                                            const res = await fetch(
                                              resolveApiUrl(
                                                `/api/jobs/${job.id}/quotes/${awardedQuote.id}/suggested-milestones/${m.id}/accept`
                                              ),
                                              {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                credentials: "include",
                                              }
                                            );
                                            const data = await res.json().catch(() => ({}));
                                            if (!res.ok) {
                                              throw new Error(data.error || "Failed to accept milestone");
                                            }
                                            await fetchJobById(job.slug || job.id);
                                            toast.success("Milestone created from suggestion.");
                                          } catch (e: any) {
                                            toast.error(e?.message || "Failed to accept milestone");
                                          } finally {
                                            setUpdatingSuggestedMilestoneId(null);
                                          }
                                        }}
                                      >
                                        {updatingSuggestedMilestoneId === m.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          "Accept"
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={rowBusy}
                                        className="h-8 px-3 border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={async () => {
                                          if (!job) return;
                                          setUpdatingSuggestedMilestoneId(m.id);
                                          try {
                                            const res = await fetch(
                                              resolveApiUrl(
                                                `/api/jobs/${job.id}/quotes/${awardedQuote.id}/suggested-milestones/${m.id}/reject`
                                              ),
                                              {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                credentials: "include",
                                              }
                                            );
                                            const data = await res.json().catch(() => ({}));
                                            if (!res.ok) {
                                              throw new Error(data.error || "Failed to reject milestone");
                                            }
                                            await fetchJobById(job.slug || job.id);
                                            toast.success("Suggestion declined.");
                                          } catch (e: any) {
                                            toast.error(e?.message || "Failed to reject milestone");
                                          } finally {
                                            setUpdatingSuggestedMilestoneId(null);
                                          }
                                        }}
                                      >
                                        {updatingSuggestedMilestoneId === m.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          "Decline"
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-emerald-100 bg-emerald-50/50 px-3 py-3">
                          <div className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-left">
                            <span className="text-[#6b6b6b]">Total milestone amount</span>
                            <div className="text-[#047857] font-semibold text-[16px] sm:text-[17px] tabular-nums mt-0.5">
                              {formatPriceWhole(suggestedTotalAmount)}
                            </div>
                          </div>
                          {isJobOwner && hasPending && (
                            <div className="flex flex-wrap gap-2 justify-end sm:ml-auto">
                              <Button
                                type="button"
                                size="sm"
                                disabled={rowBusy}
                                className="h-9 px-3 bg-green-600 hover:bg-green-700 !text-white border-0 shadow-sm font-['Poppins',sans-serif]"
                                onClick={() => void handleAcceptAllSuggestedMilestones()}
                              >
                                {suggestedBulkAction === "accept-all" ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin inline" />
                                    Accepting…
                                  </>
                                ) : (
                                  "Accept all as proposed"
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={rowBusy}
                                className="h-9 px-3 border-red-300 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif]"
                                onClick={() => void handleRejectAllSuggestedMilestones()}
                              >
                                {suggestedBulkAction === "reject-all" ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin inline" />
                                    Declining…
                                  </>
                                ) : (
                                  "Decline all"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Professional milestone plan request (after award without funded milestones) */}
                {job.awardedProfessionalId &&
                  job.requestedMilestonePlan &&
                  job.requestedMilestonePlan.length > 0 &&
                  (() => {
                    const requested = job.requestedMilestonePlan;
                    const hasPendingReq = requested.some((m) => m.status === "pending");
                    const noFundedMilestonesYetReq = !job.milestones || job.milestones.length === 0;
                    const bulkReqBusy = !!requestedBulkAction;
                    const rowReqBusy = !!updatingRequestedMilestoneId || bulkReqBusy;
                    const requestedTotalAmount = requested
                      .filter((m) => m.status === "pending")
                      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
                    return (
                      <div className="mb-6 border border-dashed border-sky-200 rounded-xl p-4 bg-sky-50/60">
                        <div className="mb-2">
                          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#0369a1] flex items-center gap-2">
                            <ListChecks className="w-4 h-4" />
                            Professional&apos;s milestone plan request
                          </h3>
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#0c4a6e] mb-2">
                          The professional proposed these payment steps. Accept to fund each from your wallet (same as quote suggested milestones), or decline if you prefer a different plan.
                        </p>
                        {noFundedMilestonesYetReq && hasPendingReq && isJobOwner && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#075985] mb-3 rounded-lg bg-white/80 border border-sky-100 px-3 py-2">
                            You can use this plan as-is, or add your own milestones in the section below.
                          </p>
                        )}
                        <div className="overflow-x-auto rounded-lg border border-sky-100 bg-white">
                          <table className="w-full font-['Poppins',sans-serif] text-[13px]">
                            <thead>
                              <tr className="bg-sky-50 border-b border-sky-100">
                                <th className="text-left py-2.5 px-3 text-[#0c4a6e] font-medium">Description</th>
                                <th className="text-right py-2.5 px-3 text-[#0c4a6e] font-medium">Amount</th>
                                <th className="text-center py-2.5 px-3 text-[#0c4a6e] font-medium">Status</th>
                                <th className="text-right py-2.5 px-3 text-[#0c4a6e] font-medium">
                                  {isJobOwner && hasPendingReq ? "Actions" : ""}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {requested.map((m) => (
                                <tr key={m.id} className="border-b border-sky-50 last:border-0">
                                  <td className="py-2.5 px-3 text-[#1f2933]">
                                    {m.description || "Milestone"}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-[#1f2933]">
                                    {formatPriceWhole(Number(m.amount || 0))}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {m.status === "pending" && (
                                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0">
                                        Pending
                                      </Badge>
                                    )}
                                    {m.status === "accepted" && (
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                                        Accepted
                                      </Badge>
                                    )}
                                    {m.status === "rejected" && (
                                      <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                                        declined
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {isJobOwner && m.status === "pending" && (
                                      <div className="inline-flex gap-2">
                                        <Button
                                          size="sm"
                                          disabled={rowReqBusy}
                                          className="h-8 px-3 bg-green-600 hover:bg-green-700 !text-white border-0 shadow-sm"
                                          onClick={async () => {
                                            if (!job) return;
                                            setUpdatingRequestedMilestoneId(m.id);
                                            try {
                                              const res = await fetch(
                                                resolveApiUrl(
                                                  `/api/jobs/${job.id}/requested-milestones/${m.id}/accept`
                                                ),
                                                {
                                                  method: "POST",
                                                  headers: { "Content-Type": "application/json" },
                                                  credentials: "include",
                                                }
                                              );
                                              const data = await res.json().catch(() => ({}));
                                              if (!res.ok) {
                                                throw new Error(data.error || "Failed to accept milestone");
                                              }
                                              await fetchJobById(job.slug || job.id);
                                              toast.success("Milestone created from request.");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed to accept milestone");
                                            } finally {
                                              setUpdatingRequestedMilestoneId(null);
                                            }
                                          }}
                                        >
                                          {updatingRequestedMilestoneId === m.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            "Accept"
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={rowReqBusy}
                                          className="h-8 px-3 border-red-300 text-red-600 hover:bg-red-50"
                                          onClick={async () => {
                                            if (!job) return;
                                            setUpdatingRequestedMilestoneId(m.id);
                                            try {
                                              const res = await fetch(
                                                resolveApiUrl(
                                                  `/api/jobs/${job.id}/requested-milestones/${m.id}/reject`
                                                ),
                                                {
                                                  method: "POST",
                                                  headers: { "Content-Type": "application/json" },
                                                  credentials: "include",
                                                }
                                              );
                                              const data = await res.json().catch(() => ({}));
                                              if (!res.ok) {
                                                throw new Error(data.error || "Failed to decline milestone");
                                              }
                                              await fetchJobById(job.slug || job.id);
                                              toast.success("Request declined.");
                                            } catch (e: any) {
                                              toast.error(e?.message || "Failed to decline milestone");
                                            } finally {
                                              setUpdatingRequestedMilestoneId(null);
                                            }
                                          }}
                                        >
                                          {updatingRequestedMilestoneId === m.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            "Decline"
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-sky-100 bg-sky-50/50 px-3 py-3">
                            <div className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-left">
                              <span className="text-[#6b6b6b]">Total milestone amount</span>
                              <div className="text-[#0369a1] font-semibold text-[16px] sm:text-[17px] tabular-nums mt-0.5">
                                {formatPriceWhole(requestedTotalAmount)}
                              </div>
                            </div>
                            {isJobOwner && hasPendingReq && (
                              <div className="flex flex-wrap gap-2 justify-end sm:ml-auto">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={rowReqBusy}
                                  className="h-9 px-3 bg-green-600 hover:bg-green-700 !text-white border-0 shadow-sm font-['Poppins',sans-serif]"
                                  onClick={() => void handleAcceptAllRequestedMilestones()}
                                >
                                  {requestedBulkAction === "accept-all" ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin inline" />
                                      Accepting…
                                    </>
                                  ) : (
                                    "Accept all as proposed"
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={rowReqBusy}
                                  className="h-9 px-3 border-red-300 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif]"
                                  onClick={() => void handleRejectAllRequestedMilestones()}
                                >
                                  {requestedBulkAction === "reject-all" ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin inline" />
                                      Declining…
                                    </>
                                  ) : (
                                    "Decline all"
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                    Milestone Payments
                  </h2>
                  <div className="flex items-center gap-2">
                    {!isJobOwner &&
                      job.awardedProfessionalId &&
                      userInfo?.id &&
                      String(job.awardedProfessionalId) === String(userInfo.id) &&
                      (!job.milestones || job.milestones.length === 0) &&
                      (job.status === "awaiting-accept" || job.status === "in-progress") && (
                        <Button
                          type="button"
                          onClick={() => setShowRequestMilestonesDialog(true)}
                          variant="outline"
                          className="bg-green-500 text-white hover:bg-white font-['Poppins',sans-serif]"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Request milestones
                        </Button>
                      )}
                    {isJobOwner && job.status !== "completed" && (
                      <Button
                        onClick={() => setShowNewMilestoneDialog(true)}
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Milestone
                      </Button>
                    )}
                  </div>
                </div>

                {/* Professional: Accept/Reject job award when status is awaiting-accept */}
                {!isJobOwner && job.status === "awaiting-accept" && job.awardedProfessionalId === userInfo?.id && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-3">
                      You&apos;ve been awarded this job. Accept to start working or reject to decline.
                    </p>
                    {job.awardAcceptDeadlineAt && (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-amber-900/90 mb-3">
                        If you do not accept by {formatDateTime(job.awardAcceptDeadlineAt)}, the award may be cancelled
                        automatically and the job reopened.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAcceptAward}
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 text-white font-['Poppins',sans-serif]"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectAwardConfirm(true)}
                        className="border-red-300 text-red-600 hover:bg-red-50 font-['Poppins',sans-serif]"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty state if no milestones */}
                

                {/* Milestones table */}
                {job.milestones && job.milestones.length > 0 && (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full font-['Poppins',sans-serif] text-[14px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-[#2c353f] font-medium">Milestone name</th>
                            <th className="text-left py-3 px-4 text-[#2c353f] font-medium">Created date</th>
                            <th className="text-left py-3 px-4 text-[#2c353f] font-medium">Status</th>
                            <th className="text-right py-3 px-4 text-[#2c353f] font-medium">Amount</th>
                            <th className="text-right py-3 px-4 text-[#2c353f] font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.milestones.map((milestone, milestoneIndex) => {
                            const deliveryForMilestone = (job.milestoneDeliveries || []).find((d) => d.milestoneIndex === milestoneIndex);
                            const hasDeliveryNotApproved = deliveryForMilestone && !deliveryForMilestone.approvedAt;
                            return (
                            <tr key={milestone.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-3 px-4 text-[#2c353f]">{milestone.name || milestone.description || "Milestone"}</td>
                              <td className="py-3 px-4 text-[#6b6b6b]">{formatDate(milestone.createdAt)}</td>
                              <td className="py-3 px-4">
                                {milestone.status === "awaiting-accept" && (
                                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-2 py-0">Funded</Badge>
                                )}
                                {milestone.status === "in-progress" && (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0">In Progress</Badge>
                                )}
                                {milestone.status === "delivered" && (
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-2 py-0">Delivered</Badge>
                                )}
                                {milestone.status === "released" && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0">Released</Badge>
                                )}
                                {milestone.status === "disputed" && (
                                  <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] px-2 py-0">Disputed</Badge>
                                )}
                                {milestone.status === "cancelled" && (
                                  <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-2 py-0">Cancelled</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right text-[#2c353f]">{formatPrice(Number(milestone.amount))}</td>
                              <td className="py-3 px-4 text-right">
                                {/* Client: awaiting-accept (pro not accepted yet) → Close + View invoice */}
                                {isJobOwner && milestone.status === "awaiting-accept" && (
                                  <DropdownMenu>
                                    <div className="inline-flex items-stretch rounded-md overflow-hidden border border-orange-300 bg-orange-50 shadow-sm">
                                      <button
                                        type="button"
                                        className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-orange-600 font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-orange-100 transition-colors cursor-pointer"
                                        onClick={async () => {
                                          try {
                                            await deleteMilestone(job.id, milestone.id);
                                            toast.success("Milestone closed and refunded to your balance");
                                          } catch (e: any) {
                                            toast.error(e?.message || "Failed to close milestone");
                                          }
                                        }}
                                      >
                                        Close
                                      </button>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-orange-400/50 bg-transparent text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                                        >
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                    </div>
                                    <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                      <DropdownMenuItem onClick={() => handleViewInvoice(milestone.id)} className="cursor-pointer">
                                        View invoice
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                                {/* Client: in-progress/delivered → action area */}
                                {isJobOwner && (milestone.status === "in-progress" || milestone.status === "delivered") && (
                                  <div className="flex items-center justify-end">
                                    {milestone.releaseRequestStatus === "pending" && milestone.releaseRequestedBy !== userInfo?.id ? (
                                      <DropdownMenu>
                                        <div className="inline-flex items-stretch rounded-md overflow-hidden border border-green-300 bg-green-50 shadow-sm">
                                          <button
                                            type="button"
                                            className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-green-600 font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-green-100 transition-colors cursor-pointer"
                                            onClick={() => setReleaseResponseConfirm({ action: "accept", jobId: job.id, milestoneId: milestone.id, milestone })}
                                          >
                                            Accept
                                          </button>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-green-400/50 bg-transparent text-green-600 hover:bg-green-100 transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                                            >
                                              <ChevronDown className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                            onClick={() => setReleaseResponseConfirm({ action: "reject", jobId: job.id, milestoneId: milestone.id, milestone })}
                                          >
                                            Reject
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleViewInvoice(milestone.id)} className="cursor-pointer">
                                            View invoice
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : milestone.cancelRequestStatus === "pending" && milestone.cancelRequestedBy !== userInfo?.id ? (
                                      <DropdownMenu>
                                        <div className="flex items-center rounded-md border border-green-300 overflow-hidden">
                                          <Button
                                            size="sm"
                                            className="h-8 px-3 rounded-r-none bg-green-50 text-green-600 border-green-300 hover:bg-green-100"
                                            variant="outline"
                                            onClick={() => setClientCancelResponseConfirm({ action: "accept", jobId: job.id, milestoneId: milestone.id, milestone })}
                                          >
                                            Accept
                                          </Button>
                                          <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="outline" className="h-8 px-1.5 rounded-l-none border-l border-green-300 bg-green-50 text-green-600 hover:bg-green-100">
                                              <ChevronDown className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                            onClick={() => setClientCancelResponseConfirm({ action: "reject", jobId: job.id, milestoneId: milestone.id, milestone })}
                                          >
                                            Reject
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleViewInvoice(milestone.id)} className="cursor-pointer">
                                            View invoice
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : milestone.status === "delivered" && deliveryForMilestone ? (
                                      <DropdownMenu>
                                        <div className="inline-flex items-stretch rounded-md overflow-hidden border border-[#1976D2]/50 bg-white shadow-sm">
                                          <button
                                            type="button"
                                            className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-[#1976D2] font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-[#E3F2FD] transition-colors cursor-pointer"
                                            onClick={() => {
                                              setViewWorkDeliveredData({
                                                milestoneId: milestone.id,
                                                milestoneIndex,
                                                milestoneName: milestone.name || milestone.description || "Milestone",
                                                deliveryMessage: deliveryForMilestone.deliveryMessage || "",
                                                fileUrls: deliveryForMilestone.fileUrls || [],
                                              });
                                              setRevisionMessage("");
                                              setShowViewWorkDeliveredModal(true);
                                            }}
                                          >
                                            View Work delivered
                                          </button>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-[#1976D2]/40 bg-transparent text-[#1976D2] hover:bg-[#E3F2FD] transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                                            >
                                              <ChevronDown className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                          <DropdownMenuItem
                                            onClick={() => handleOpenDisputeModal(milestone)}
                                            className="cursor-pointer text-orange-600 focus:text-orange-600"
                                          >
                                            Open dispute
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleViewInvoice(milestone.id)}
                                            className="cursor-pointer"
                                          >
                                            View invoice
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : (
                                      <DropdownMenu>
                                        <div className="inline-flex items-stretch rounded-md overflow-hidden border border-red-300 bg-red-50 shadow-sm">
                                          <button
                                            type="button"
                                            disabled={milestone.cancelRequestStatus === "pending"}
                                            className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-red-600 font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => {
                                              setCancelRequestMilestone(milestone);
                                              setCancelRequestReason("");
                                              setShowCancelRequestModal(true);
                                            }}
                                          >
                                            Cancel request
                                          </button>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              disabled={milestone.cancelRequestStatus === "pending"}
                                              className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-red-300/60 bg-transparent text-red-600 hover:bg-red-100 transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <ChevronDown className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                          {hasDeliveryNotApproved && deliveryForMilestone && (
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setViewWorkDeliveredData({
                                                  milestoneId: milestone.id,
                                                  milestoneIndex,
                                                  milestoneName: milestone.name || milestone.description || "Milestone",
                                                  deliveryMessage: deliveryForMilestone.deliveryMessage || "",
                                                  fileUrls: deliveryForMilestone.fileUrls || [],
                                                });
                                                setRevisionMessage("");
                                                setShowViewWorkDeliveredModal(true);
                                              }}
                                              className="cursor-pointer text-[#1976D2] focus:text-[#1976D2]"
                                            >
                                              View Work delivered
                                            </DropdownMenuItem>
                                          )}
                                          {deliveryForMilestone && (
                                            <DropdownMenuItem onClick={() => handleOpenDisputeModal(milestone)} className="cursor-pointer text-red-600 focus:text-red-600">
                                              Dispute
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => handleViewInvoice(milestone.id)} className="cursor-pointer">
                                            View invoice
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                )}
                                {/* Client: released → View invoice only */}
                                {isJobOwner && milestone.status === "released" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewInvoice(milestone.id)}
                                    className="h-8 px-3 text-[13px] border-gray-300 text-[#2c353f] hover:bg-gray-50"
                                  >
                                    View invoice
                                  </Button>
                                )}
                                {/* Pro: awaiting-accept → no per-row action (use banner Accept/Reject) */}
                                {/* Pro: in-progress → Deliver Work default; Cancel in menu; Accept/Reject when client cancel pending */}
                                {!isJobOwner && milestone.status === "in-progress" && (
                                  <div className="flex items-center justify-end">
                                    {milestone.cancelRequestStatus === "pending" && milestone.cancelRequestedBy !== userInfo?.id ? (
                                      <DropdownMenu>
                                        <div className="inline-flex items-stretch rounded-md overflow-hidden border border-green-300 bg-green-50 shadow-sm">
                                          <button
                                            type="button"
                                            className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-green-600 font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-green-100 transition-colors cursor-pointer"
                                            onClick={() => setCancelResponseConfirm({ action: "accept", jobId: job.id, milestoneId: milestone.id, milestone })}
                                          >
                                            Accept
                                          </button>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-green-400/50 bg-transparent text-green-600 hover:bg-green-100 transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                                            >
                                              <ChevronDown className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                            onClick={() => setCancelResponseConfirm({ action: "reject", jobId: job.id, milestoneId: milestone.id, milestone })}
                                          >
                                            Reject
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : (
                                      <DropdownMenu>
                                        <div className="inline-flex items-stretch rounded-md overflow-hidden border border-[#1976D2]/50 bg-white shadow-sm">
                                          <button
                                            type="button"
                                            className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-[#1976D2] font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-[#E3F2FD] transition-colors cursor-pointer"
                                            onClick={() => {
                                              const idx = (job.milestones || []).findIndex((m) => m.id === milestone.id);
                                              if (idx >= 0) {
                                                setDeliverWorkPreselectedMilestoneIndex(idx);
                                                setShowDeliverWorkModal(true);
                                              }
                                            }}
                                          >
                                            Deliver Work
                                          </button>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-[#1976D2]/40 bg-transparent text-[#1976D2] hover:bg-[#E3F2FD] transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                                            >
                                              <ChevronDown className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                          {deliveryForMilestone?.revisionRequestedAt && (
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setViewRevisionData({
                                                  milestoneName: milestone.name || milestone.description || "Milestone",
                                                  revisionMessage: deliveryForMilestone.revisionMessage || "",
                                                  revisionFileUrls: deliveryForMilestone.revisionFileUrls || [],
                                                });
                                                setShowViewRevisionModal(true);
                                              }}
                                              className="cursor-pointer text-orange-600 focus:text-orange-600"
                                            >
                                              View Revision request
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            disabled={milestone.cancelRequestStatus === "pending"}
                                            onClick={() => {
                                              setCancelRequestMilestone(milestone);
                                              setCancelRequestReason("");
                                              setShowCancelRequestModal(true);
                                            }}
                                            className="cursor-pointer text-red-600 focus:text-red-600 disabled:opacity-50"
                                          >
                                            Cancel
                                          </DropdownMenuItem>
                                          {deliveryForMilestone && (
                                            <DropdownMenuItem onClick={() => handleOpenDisputeModal(milestone)} className="cursor-pointer text-orange-600 focus:text-orange-600">
                                              Open dispute
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                )}

                                {/* Pro: delivered → View Delivery primary + Open dispute in dropdown */}
                                {!isJobOwner && milestone.status === "delivered" && deliveryForMilestone && (
                                  <div className="flex items-center justify-end">
                                    <DropdownMenu>
                                      <div className="inline-flex items-stretch rounded-md overflow-hidden border border-[#1976D2]/50 bg-white shadow-sm">
                                        <button
                                          type="button"
                                          className="h-8 px-3 rounded-l-md rounded-r-none border-0 bg-transparent text-[#1976D2] font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-[#E3F2FD] transition-colors cursor-pointer"
                                          onClick={() => {
                                            setViewWorkDeliveredData({
                                              milestoneId: milestone.id,
                                              milestoneIndex,
                                              milestoneName: milestone.name || milestone.description || "Milestone",
                                              deliveryMessage: deliveryForMilestone.deliveryMessage || "",
                                              fileUrls: deliveryForMilestone.fileUrls || [],
                                            });
                                            setRevisionMessage("");
                                            setShowViewWorkDeliveredModal(true);
                                          }}
                                        >
                                          View Delivery
                                        </button>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            type="button"
                                            className="h-8 w-8 rounded-l-none rounded-r-md border-0 border-l border-[#1976D2]/40 bg-transparent text-[#1976D2] hover:bg-[#E3F2FD] transition-colors cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                                          >
                                            <ChevronDown className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                      </div>
                                      <DropdownMenuContent align="end" className="font-['Poppins',sans-serif]">
                                        <DropdownMenuItem
                                          onClick={() => handleOpenDisputeModal(milestone)}
                                          className="cursor-pointer text-orange-600 focus:text-orange-600"
                                        >
                                          Open dispute
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                                {/* Pro: released → View invoice only (after client has released) */}
                                {!isJobOwner && milestone.status === "released" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewInvoice(milestone.id)}
                                    className="h-8 px-3 text-[13px] border-gray-300 text-[#2c353f] hover:bg-gray-50"
                                  >
                                    View invoice
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ); })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">Total Milestones:</p>
                        <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                          {formatPrice(job.milestones.reduce((sum, m) => sum + m.amount, 0))}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Released:</p>
                        <p className="font-['Poppins',sans-serif] text-[16px] text-green-600">
                          {formatPrice(job.milestones.filter((m) => m.status === "released").reduce((sum, m) => sum + m.amount, 0))}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {job.status === "completed" && job.awardedProfessionalId && isActualJobClient && (
                  <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="font-['Poppins',sans-serif] text-[17px] md:text-[18px] font-semibold text-[#065f46] flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          Job completed
                        </h3>
                        <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#047857] mt-1">
                          {job.clientReviewAt
                            ? "Thank you — your review has been saved."
                            : `Tell others how it went with ${jobReviewProfessionalName}.`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleTabChange("review")}
                        className="shrink-0 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                      >
                        {job.clientReviewAt ? "View review" : "Leave a review"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File Tab – shared files (client + awarded pro) */}
            {activeTab === "files" && showFileTab && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                  Shared files
                </h2>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-4">
                  Upload and download files shared between you and the {isJobOwner ? "professional" : "client"}.
                </p>
                <input
                  ref={jobFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleJobFileUpload}
                />
                <Button
                  onClick={() => jobFileInputRef.current?.click()}
                  disabled={jobFileUploading}
                  className="mb-6 font-['Poppins',sans-serif] bg-[#FE8A0F] hover:bg-[#FFB347]"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  {jobFileUploading ? "Uploading…" : "Upload file"}
                </Button>
                {jobFilesLoading ? (
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Loading files…</p>
                ) : jobFiles.length === 0 ? (
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">No files yet. Upload a file to get started.</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {jobFiles.map((f) => {
                      const isImage = (f.mimeType || "").startsWith("image/");
                      const isVideo = (f.mimeType || "").startsWith("video/");
                      const src = resolveApiUrl(f.url);
                      return (
                        <div key={f.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          {isImage ? (
                            <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={src} alt={f.name} className="max-h-40 w-auto object-contain" />
                            </a>
                          ) : isVideo ? (
                            <video src={src} controls className="max-h-40 max-w-full" title={f.name} />
                          ) : (
                            <a
                              href={src}
                              download={f.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 text-[#1976D2] hover:underline font-['Poppins',sans-serif] text-[14px]"
                            >
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{f.name}</span>
                              <Download className="w-4 h-4 flex-shrink-0" />
                            </a>
                          )}
                          {(isImage || isVideo) && (
                            <a
                              href={src}
                              download={f.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[#6b6b6b] font-['Poppins',sans-serif] hover:bg-gray-100"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Review tab — completed jobs; client submits, professional reads */}
            {activeTab === "review" && showReviewTab && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-2">
                  Review
                </h2>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-6">
                  {isActualJobClient
                    ? `Rate your experience with ${jobReviewProfessionalName} on this job.`
                    : `Feedback from the client for "${job.title}".`}
                </p>

                {isActualJobClient && job.clientReviewAt && job.clientReviewRating != null && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5">
                    <p className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f] mb-3">Your review</p>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= (job.clientReviewRating || 0)
                              ? "fill-[#FE8A0F] text-[#FE8A0F]"
                              : "fill-[#E5E5E5] text-[#E5E5E5]"
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {job.clientReviewRating}/5
                      </span>
                    </div>
                    {job.clientReviewComment ? (
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap">
                        {job.clientReviewComment}
                      </p>
                    ) : (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">No written comment.</p>
                    )}
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-4">
                      Reviews are submitted once and cannot be edited.
                    </p>
                  </div>
                )}

                {isActualJobClient && !job.clientReviewAt && (
                  <div className="space-y-5 max-w-lg">
                    <div>
                      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">Rating</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setJobReviewRating(star)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            aria-label={`${star} star${star === 1 ? "" : "s"}`}
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= jobReviewRating ? "fill-[#FE8A0F] text-[#FE8A0F]" : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="job-review-text" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                        Comments (optional)
                      </Label>
                      <Textarea
                        id="job-review-text"
                        value={jobReviewText}
                        onChange={(e) => setJobReviewText(e.target.value.slice(0, 2000))}
                        placeholder="Share details that might help other clients…"
                        rows={4}
                        className="font-['Poppins',sans-serif] text-[14px] resize-y min-h-[100px]"
                      />
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] mt-1">{jobReviewText.length}/2000</p>
                    </div>
                    <Button
                      type="button"
                      disabled={jobReviewRating < 1 || jobReviewSubmitting}
                      onClick={async () => {
                        if (jobReviewRating < 1) {
                          toast.error("Please choose a star rating.");
                          return;
                        }
                        setJobReviewSubmitting(true);
                        try {
                          await submitClientJobReview(job.slug || job.id, jobReviewRating, jobReviewText);
                          toast.success("Thank you for your feedback!");
                          setJobReviewText("");
                          setJobReviewRating(0);
                          await fetchJobById(job.slug || job.id);
                        } catch (e: any) {
                          toast.error(e?.message || "Could not submit review");
                        } finally {
                          setJobReviewSubmitting(false);
                        }
                      }}
                      className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                    >
                      {jobReviewSubmitting ? "Submitting…" : "Submit review"}
                    </Button>
                  </div>
                )}

                {isAwardedProfessionalUser && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5">
                    {job.clientReviewAt && job.clientReviewRating != null ? (
                      <>
                        <p className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f] mb-3">Client review</p>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 ${
                                star <= (job.clientReviewRating || 0)
                                  ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                  : "fill-[#E5E5E5] text-[#E5E5E5]"
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {job.clientReviewRating}/5
                          </span>
                        </div>
                        {job.clientReviewComment ? (
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap">
                            {job.clientReviewComment}
                          </p>
                        ) : (
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">No written comment.</p>
                        )}
                      </>
                    ) : (
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        The client has not submitted a review yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* More Tab */}
            {activeTab === "more" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
                  More Options
                </h2>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start font-['Poppins',sans-serif]"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Job Details
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-['Poppins',sans-serif]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Job Summary
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-['Poppins',sans-serif]"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Cancel Job
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Report job modal (message to admin) */}
      <Dialog
        open={showReportJobModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowReportJobModal(false);
            setReportJobReason("");
            setReportJobMessage("");
          }
        }}
      >
        <DialogContent className="font-['Poppins',sans-serif] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2c353f]">Report this job</DialogTitle>
            <DialogDescription className="text-[#6b6b6b]">
              Select a reason for reporting this job. If you choose “Other”, you can add details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="report-job-reason" className="block text-[13px] font-medium text-[#2c353f] mb-1.5">
                Reason
              </label>
              <select
                id="report-job-reason"
                value={reportJobReason}
                onChange={(e) => setReportJobReason(e.target.value)}
                disabled={reportJobSubmitting}
                className="w-full h-11 rounded-md border border-gray-200 bg-white px-3 text-[14px] text-[#2c353f] outline-none focus:ring-2 focus:ring-[#FE8A0F]/25"
              >
                <option value="">- Please Select -</option>
                <option value="Doesn't make sense">Doesn't make sense</option>
                <option value="Contains offensive language">Contains offensive language</option>
                <option value="Incorrect category">Incorrect category</option>
                <option value="Doesn't require gas or electric qualification">Doesn't require gas or electric qualification</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {reportJobReason === "Other" && (
              <div>
                <label htmlFor="report-job-message" className="block text-[13px] font-medium text-[#2c353f] mb-1.5">
                  Message
                </label>
                <Textarea
                  id="report-job-message"
                  placeholder="Describe why you are reporting this job..."
                  value={reportJobMessage}
                  onChange={(e) => setReportJobMessage(e.target.value)}
                  className="min-h-[120px] resize-y text-[14px] border-gray-200"
                  disabled={reportJobSubmitting}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReportJobModal(false)}
                disabled={reportJobSubmitting}
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const reason = reportJobReason.trim();
                  const msg = reportJobMessage.trim();
                  if (!reason) {
                    toast.error("Please select a reason");
                    return;
                  }
                  if (reason === "Other" && !msg) {
                    toast.error("Please enter a message");
                    return;
                  }
                  if (!job) return;
                  setReportJobSubmitting(true);
                  try {
                    const res = await fetch(resolveApiUrl(`/api/jobs/${job.slug || job.id}/report`), {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reason, message: reason === "Other" ? msg : undefined }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(data?.error || "Failed to submit report");
                      return;
                    }
                    toast.success(data?.message || "Report submitted");
                    setShowReportJobModal(false);
                    setReportJobReason("");
                    setReportJobMessage("");
                  } finally {
                    setReportJobSubmitting(false);
                  }
                }}
                disabled={reportJobSubmitting}
                className="font-['Poppins',sans-serif] bg-[#1976D2] hover:bg-[#1565C0]"
              >
                {reportJobSubmitting ? "Sending…" : "Send report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Request Modal */}
      <Dialog
        open={showRevisionRequestModal}
        onOpenChange={(open) => {
          setShowRevisionRequestModal(open);
          if (!open) {
            setRevisionMessage("");
            setRevisionFiles([]);
          }
        }}
      >
        <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Request Revision
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Tell the professional what needs to be changed and optionally attach reference files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1 block">
                Revision feedback
              </Label>
              <Textarea
                placeholder="Describe what changes you need..."
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                rows={4}
                className="font-['Poppins',sans-serif] text-[13px]"
              />
            </div>
            <div>
              <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1 block">
                Attach files (optional)
              </Label>
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) setRevisionFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 10));
                  e.target.value = "";
                }}
                className="hidden"
                id="revision-request-files-input"
              />
              <label
                htmlFor="revision-request-files-input"
                className="flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FE8A0F] font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]"
              >
                <Paperclip className="w-4 h-4" />
                Add files (max 10)
              </label>
              {revisionFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {revisionFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-[13px]">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-red-600"
                        onClick={() => setRevisionFiles((p) => p.filter((_, i) => i !== idx))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRevisionRequestModal(false);
                }}
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const msg = revisionMessage.trim();
                  if (!msg) {
                    toast.error("Please enter revision feedback.");
                    return;
                  }
                  if (!job?.id || !viewWorkDeliveredData) {
                    toast.error("Something went wrong. Please reopen the delivery and try again.");
                    return;
                  }
                  requestMilestoneRevision(
                    job.id,
                    viewWorkDeliveredData.milestoneId,
                    msg,
                    revisionFiles.length > 0 ? revisionFiles : undefined
                  )
                    .then(() => {
                      toast.success("Revision requested.");
                      setShowRevisionRequestModal(false);
                      setRevisionMessage("");
                      setRevisionFiles([]);
                      fetchJobById(job.id);
                    })
                    .catch((e: any) => toast.error(e?.message || "Failed to request revision"));
                }}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] shadow-sm"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share this job modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="font-['Poppins',sans-serif] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[20px] text-[#2c353f]">Share this project with others</DialogTitle>
            <DialogDescription className="text-[#6b6b6b] text-[14px]">
              Share this job via social media or copy the link below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Social share icons (icon-only buttons) */}
            <div>
              <div className="flex flex-wrap gap-8">
                {(() => {
                  const socials: SocialShareLink[] = [
                    {
                      name: "Facebook",
                      url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
                      color: "bg-[#1877F2] hover:bg-[#166FE5]",
                      imgAlt: "Facebook",
                      bgImageSrc: facebookIcon,
                      imgSrc: facebookIcon,
                    },
                    {
                      name: "Twitter",
                      url: (u: string) =>
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(job?.title || "Job")}`,
                      color: "bg-black hover:bg-[#111]",
                      bgImageSrc: xIcon,
                      imgAlt: "X",
                      imgSrc: xIcon,
                    },
                    {
                      name: "LinkedIn",
                      url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
                      color: "bg-[#EFF6FF] hover:bg-[#DBEAFE]",
                      imgAlt: "LinkedIn",
                      imgSrc:
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
                        ),
                    },
                    {
                      name: "Reddit",
                      url: (u: string) =>
                        `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(job?.title || "Job")}`,
                      color: "bg-[#FF4500] hover:bg-[#e03d00]",
                      bgImageSrc: redditIcon,
                      imgAlt: "Reddit",
                      imgSrc: redditIcon,
                    },
                    {
                      name: "Telegram",
                      url: (u: string) =>
                        `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(job?.title || "Job")}`,
                      color: "bg-[#E3F7FE] hover:bg-[#B3E5FC]",
                      imgAlt: "Telegram",
                      imgSrc:
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#26A5E4" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`
                        ),
                    },
                  ];

                  return socials.map((social) => {
                  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/job/${job?.slug || job?.id}` : "";
                  const href = social.url(shareUrl);
                  return (
                    <a
                      key={social.name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center w-[88px] h-[88px] rounded-xl ${social.color} transition-colors`}
                      title={`Share on ${social.name}`}
                      aria-label={`Share on ${social.name}`}
                      style={
                        social.bgImageSrc
                          ? ({
                              backgroundImage: `url(${social.bgImageSrc})`,
                              backgroundSize: "72% 72%",
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {social.imgSrc ? (
                        <img
                          src={social.imgSrc}
                          alt={social.imgAlt}
                          className="w-10 h-10"
                          draggable={false}
                          style={social.name === "Twitter" ? ({ borderRadius: 12 } as React.CSSProperties) : undefined}
                        />
                      ) : (
                        <span className="sr-only">{social.imgAlt}</span>
                      )}
                    </a>
                  );
                  });
                })()}
              </div>
            </div>
            {/* Copy link */}
            <div>
              <p className="text-[13px] font-medium text-[#2c353f] mb-2">Copy link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/job/${job?.slug || job?.id}` : ""}
                  className="flex-1 text-[13px] border-gray-200 bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="font-['Poppins',sans-serif] shrink-0 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                  onClick={async () => {
                    const url = typeof window !== "undefined" ? `${window.location.origin}/job/${job?.slug || job?.id}` : "";
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard");
                    } catch {
                      toast.error("Failed to copy");
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client profile preview modal (same as My Details preview) */}
      <Dialog open={showClientPreviewModal} onOpenChange={(open) => { setShowClientPreviewModal(open); if (!open) setClientPreviewData(null); }}>
        <DialogContent className="w-[90vw] max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col bg-[#f0f0f0] p-0 font-['Poppins',sans-serif]">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-[#FE8A0F] text-xl">About the client</DialogTitle>
            <DialogDescription className="text-[13px] text-[#6b6b6b]">
              Client profile: About Me and reviews they&apos;ve left.
            </DialogDescription>
          </DialogHeader>
          {clientPreviewLoading ? (
            <div className="p-8 text-center text-[#6b6b6b]">Loading...</div>
          ) : clientPreviewData ? (
            <>
              <div className="px-4 pt-2 pb-4">
                <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-gray-100 flex-shrink-0">
                    {resolveAvatarUrl(clientPreviewData.avatar) && (
                      <AvatarImage src={resolveAvatarUrl(clientPreviewData.avatar)!} alt={clientPreviewData.name} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-xl sm:text-2xl rounded-xl">
                      {getTwoLetterInitials(clientPreviewData.name, "C")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-lg font-semibold truncate">
                      {clientPreviewData.name}
                    </h2>
                    {clientPreviewData.createdAt && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        Member since {new Date(clientPreviewData.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-[#FE8A0F] text-[#FE8A0F] flex-shrink-0" />
                        <span className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                          {clientPreviewData.reviewCount > 0
                            ? clientPreviewData.ratingAverage.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                            : "—"}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">average</span>
                      </div>
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                        {clientPreviewData.reviewCount} {clientPreviewData.reviewCount === 1 ? "review" : "reviews"} left
                      </span>
                      {(clientPreviewData.country || clientPreviewData.townCity) && (
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                          • {[clientPreviewData.townCity, clientPreviewData.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Tabs value={clientPreviewTab} onValueChange={setClientPreviewTab} className="flex-1 flex flex-col min-h-0 p-4 pt-2">
                <TabsList className="grid w-full grid-cols-2 font-['Poppins',sans-serif] bg-white rounded-xl p-1 mb-4">
                  <TabsTrigger value="about" className="data-[state=active]:bg-[#003D82] data-[state=active]:text-white text-[13px]">About Me</TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-[#003D82] data-[state=active]:text-white text-[13px]">Reviews</TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <TabsContent value="about" className="mt-0 data-[state=inactive]:hidden">
                    <div className="bg-white rounded-xl p-4 md:p-6">
                      <h3 className="font-['Poppins',sans-serif] text-[#003D82] text-[16px] font-semibold mb-3">About Me</h3>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-pre-wrap break-words">
                        {clientPreviewData.bio.trim() || "No bio added yet."}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="reviews" className="mt-0 data-[state=inactive]:hidden">
                    <div className="bg-white rounded-xl p-4 md:p-6">
                      <h3 className="font-['Poppins',sans-serif] text-[#003D82] text-[16px] font-semibold mb-3">Reviews they&apos;ve left</h3>
                      {clientPreviewData.reviews.length === 0 ? (
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] py-4">No reviews yet.</p>
                      ) : (
                        <ScrollArea className="h-[300px] w-full rounded-md border border-gray-200 pr-3">
                          <div className="space-y-4 p-1">
                            {clientPreviewData.reviews.map((r) => (
                              <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">{r.professionalName}</span>
                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                                  </span>
                                </div>
                                <div className="flex gap-0.5 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-4 h-4 ${star <= (r.rating || 0) ? "fill-[#FE8A0F] text-[#FE8A0F]" : "fill-[#E5E5E5] text-[#E5E5E5]"}`} />
                                  ))}
                                </div>
                                {r.comment && <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap">{r.comment}</p>}
                                {r.response && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] italic">Response: {r.response}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          ) : !clientPreviewLoading && (
            <div className="p-8 text-center text-[#6b6b6b]">Could not load profile.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Professional profile slider popup from Quotes tab */}
      {showProProfileSlider && selectedQuoteForProfile && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Left side: dark blurred overlay (exactly the remaining half) */}
          <button
            type="button"
            className="flex-1 bg-black/0"
            onClick={closeProfessionalProfileSlider}
            aria-label="Close profile preview"
          />
          {/* Right side: white slider occupying exactly half the screen */}
          <div
            className={[
              "w-1/2 max-w-[900px] bg-white h-full shadow-2xl relative flex flex-col",
              "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            ].join(" ")}
            style={{
              transform: proProfileSliderAnimateIn ? "translateX(0)" : "translateX(100%)",
              opacity: proProfileSliderAnimateIn ? 1 : 0,
            }}
          >
            <button
              type="button"
              onClick={closeProfessionalProfileSlider}
              className="absolute top-4 right-4 z-10 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 h-9 w-9 shadow-sm"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="h-full overflow-y-auto font-['Poppins',sans-serif] bg-[#f0f0f0]">
              <div className="p-5 pb-3 border-b border-gray-100">
                <h2 className="text-[#FE8A0F] text-xl font-semibold">
                  {(proProfileData?.tradingName || selectedQuoteForProfile?.professionalName || "Professional")}&apos;s Profile
                </h2>
                
              </div>

              {proProfileLoading && (
                <div className="p-8 text-center text-[#6b6b6b] text-[14px]">Loading profile...</div>
              )}

              {!proProfileLoading && !proProfileData && (
                <div className="p-8 text-center text-[#6b6b6b] text-[14px]">Could not load profile.</div>
              )}

              {!proProfileLoading && proProfileData && (
                <div className="p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden">
                  {/* Profile Header - similar to ProfileSection preview */}
                  <div className="bg-white rounded-2xl shadow-sm p-3 md:p-6 mb-2 w-full max-w-full overflow-x-hidden">
                    <div className="flex gap-4 md:gap-6 w-full max-w-full overflow-x-hidden">
                      <div className="flex-shrink-0 relative">
                        <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-gray-100 relative">
                          {resolveAvatarUrl(proProfileData.avatar) && (
                            <AvatarImage
                              src={resolveAvatarUrl(proProfileData.avatar)!}
                              alt={proProfileData.tradingName || "Professional"}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[32px] md:text-[40px] rounded-2xl relative">
                            {getTwoLetterInitials(proProfileData.tradingName || selectedQuoteForProfile.professionalName, "P")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0 h-24 md:h-32 flex flex-col justify-between">
                        <div className="flex-1 flex flex-col justify-start min-h-0">
                          <h1
                            className="text-[#003D82] font-['Poppins',sans-serif] mb-0.5 md:mb-1 whitespace-nowrap overflow-hidden text-[20px]"
                          >
                            {proProfileData.tradingName || selectedQuoteForProfile.professionalName}
                          </h1>
                          <p className="text-gray-600 text-[19px] md:text-[21px] mb-0.5 md:mb-1 line-clamp-1">
                            {proProfileData.title || ""}
                          </p>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[12px] md:text-[14px] mb-0.5 md:mb-1 mt-1 md:mt-1.5">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                            <span className="truncate">
                              {[proProfileData.townCity, proProfileData.county].filter(Boolean).join(", ") ||
                                proProfileData.address ||
                                "Location not specified"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-auto">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 md:w-4 md:h-4 fill-[#FE8A0F] text-[#FE8A0F]" />
                            <span className="font-semibold text-[11px] md:text-[13px]">
                              {(proProfileData.ratingAverage ?? selectedQuoteForProfile.professionalRating ?? 0).toLocaleString(
                                "en-GB",
                                { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                              )}
                            </span>
                            <span className="text-gray-500 text-[9px] md:text-[11px]">
                              {(proProfileData.ratingCount ?? selectedQuoteForProfile.professionalReviews ?? 0) === 0
                                ? "(0 reviews)"
                                : (proProfileData.ratingCount ?? selectedQuoteForProfile.professionalReviews) === 1
                                ? "(1 review)"
                                : `(${proProfileData.ratingCount ?? selectedQuoteForProfile.professionalReviews} reviews)`}
                            </span>
                          </div>
                          {proProfileData.memberSince && (
                            <div className="text-[9px] md:text-[11px] text-gray-600">
                              <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5" />
                              Member since{" "}
                              {new Date(proProfileData.memberSince).toLocaleDateString("en-GB", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content - Tabs like ProfilePage/ProfileSection */}
                  <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden">
                    <div className="w-full max-w-full overflow-x-hidden">
                      <Tabs value={proProfileActiveTab} onValueChange={(v) => setProProfileActiveTab(v as any)} className="w-full">
                        <TabsList className="w-full max-w-full bg-white rounded-xl p-1 shadow-sm mb-4 overflow-x-hidden">
                          <TabsTrigger
                            value="about"
                            className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                          >
                            About Me
                          </TabsTrigger>
                          <TabsTrigger
                            value="services"
                            className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                          >
                            My Services
                          </TabsTrigger>
                          <TabsTrigger
                            value="portfolio"
                            className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                          >
                            Portfolio
                          </TabsTrigger>
                          <TabsTrigger
                            value="reviews"
                            className="flex-1 text-[11px] md:text-[13px] data-[state=active]:bg-[#003D82] data-[state=active]:text-white"
                          >
                            Reviews
                          </TabsTrigger>
                        </TabsList>

                        {/* About Me Tab - includes About, Qualifications, Certifications, Verifications */}
                        <TabsContent value="about">
                          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
                            {(() => {
                              const t =
                                (proProfileData.publicProfile?.profileTitle || "").trim() ||
                                (selectedQuoteForProfile.professionalProfileTitle || "").trim();
                              if (!t) return null;
                              return (
                                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-bold">
                                  {t}
                                </p>
                              );
                            })()}
                            {/* About Me */}
                            <div>
                              <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                                About Me
                              </h3>
                              <p className="text-gray-700 leading-relaxed text-[13px] md:text-[14px] whitespace-pre-wrap break-words text-justify">
                                {(proProfileData.publicProfile?.bio || proProfileData.aboutService || "").trim() || "No bio added yet."}
                              </p>
                            </div>

                            {/* Qualifications */}
                            {(() => {
                              const q = (proProfileData.publicProfile?.qualifications || "").trim();
                              if (!q) return null;
                              return (
                                <div>
                                  <h4 className="text-[#003D82] text-[14px] md:text-[16px] font-semibold mb-2">
                                    Qualifications
                                  </h4>
                                  <div className="space-y-1.5">
                                    {q.split(/\r?\n/).filter((line: string) => line.trim()).map((line: string, idx: number) => (
                                      <p
                                        key={idx}
                                        className="text-gray-700 text-[12px] md:text-[14px] leading-relaxed break-words text-justify"
                                      >
                                        {line.trim()}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Certifications */}
                            {(() => {
                              const c = (proProfileData.publicProfile?.certifications || "").trim();
                              if (!c) return null;
                              return (
                                <div>
                                  <h4 className="text-[#003D82] text-[14px] md:text-[16px] font-semibold mb-2">
                                    Certifications
                                  </h4>
                                  <div className="space-y-1.5">
                                    {c.split(/\r?\n/).filter((line: string) => line.trim()).map((line: string, idx: number) => (
                                      <p
                                        key={idx}
                                        className="text-gray-700 text-[12px] md:text-[14px] leading-relaxed break-words text-justify"
                                      >
                                        {line.trim()}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Verifications summary */}
                            {proProfileData.verification && (
                              <div className="border-t border-gray-100 pt-4 md:pt-5">
                                <h4 className="text-[#003D82] text-[14px] md:text-[16px] font-semibold mb-3">
                                  Verifications
                                </h4>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                  {[
                                    {
                                      key: "phone",
                                      label: "Phone",
                                      status: proProfileData.verification?.phone?.status,
                                    },
                                    {
                                      key: "identity",
                                      label: "Identity",
                                      status: proProfileData.verification?.idCard?.status,
                                    },
                                    {
                                      key: "address",
                                      label: "Address",
                                      status: proProfileData.verification?.address?.status,
                                    },
                                    {
                                      key: "insurance",
                                      label: "Insurance",
                                      status: proProfileData.verification?.publicLiabilityInsurance?.status,
                                    },
                                  ].map((item) => {
                                    const completed =
                                      item.status === "verified" || item.status === "completed";
                                    return (
                                      <div
                                        key={item.key}
                                        className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg"
                                      >
                                        <span className="text-[12px] md:text-[14px] text-[#2c353f]">
                                          {item.label}
                                        </span>
                                        {completed ? (
                                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                                        ) : (
                                          <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* My Services Tab */}
                        <TabsContent value="services">
                          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
                            <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                              My Services
                            </h3>
                            {proProfileServicesLoading ? (
                              <p className="text-gray-500 text-[13px] py-4">Loading services...</p>
                            ) : proProfileServices.length === 0 ? (
                              <p className="text-gray-500 text-[13px] py-4">No services available yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6 justify-items-center">
                                {proProfileServices.map((service) => (
                                  <ServiceCard
                                    key={service._id || service.id}
                                    service={service}
                                    onClick={() =>
                                      window.open(
                                        `/service/${service.slug || service._id || service.id}`,
                                        "_blank",
                                        "noopener,noreferrer"
                                      )
                                    }
                                    showHeart={false}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* Portfolio Tab — same data as Profile tab public portfolio */}
                        <TabsContent value="portfolio">
                          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                            <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                              Portfolio
                            </h3>
                            {(() => {
                              const portfolio = Array.isArray(proProfileData?.publicProfile?.portfolio)
                                ? proProfileData.publicProfile.portfolio
                                : [];
                              if (portfolio.length === 0) {
                                return (
                                  <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">
                                    No portfolio items available yet.
                                  </p>
                                );
                              }
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                  {portfolio.map((item: any, index: number) => {
                                    const mediaUrl = proPortfolioMediaUrl(item.url || item.image);
                                    const isVideo = item.type === "video";
                                    return (
                                      <div
                                        key={item.id || index}
                                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                                      >
                                        {isVideo ? (
                                          <div className="relative w-full h-32 md:h-48 bg-black">
                                            <video
                                              src={mediaUrl}
                                              className="w-full h-32 md:h-48 object-cover"
                                              controls
                                              preload="metadata"
                                            />
                                            <div className="absolute top-2 left-2 bg-purple-500/90 text-white px-2 py-1 rounded-md text-xs font-medium">
                                              Video
                                            </div>
                                          </div>
                                        ) : (
                                          <ImageWithFallback
                                            src={mediaUrl}
                                            alt={item.title || "Portfolio"}
                                            className="w-full h-32 md:h-48 object-cover"
                                          />
                                        )}
                                        <div className="p-3 md:p-4">
                                          <h4 className="text-[#003D82] font-semibold mb-1 md:mb-2 text-[13px] md:text-[15px]">
                                            {item.title || "Portfolio item"}
                                          </h4>
                                          {item.description ? (
                                            <p className="text-gray-600 text-[11px] md:text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                                              {item.description}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </TabsContent>

                        {/* Reviews Tab - dynamic data (service + job reviews) */}
                        <TabsContent value="reviews">
                          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                            {(() => {
                              const reviewCount = proProfileData?.ratingCount ?? 0;
                              const reviews = Array.isArray(proProfileData?.reviews) ? proProfileData.reviews : [];
                              const loading = proProfileLoading && !proProfileData;
                              const toggleResponse = (reviewId: string) => {
                                setProProfileExpandedReviewResponses((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(reviewId)) next.delete(reviewId);
                                  else next.add(reviewId);
                                  return next;
                                });
                              };

                              return (
                                <>
                                  <h3 className="text-[#003D82] text-[16px] md:text-[20px] font-semibold mb-3 md:mb-4">
                                    Reviews ({reviewCount})
                                  </h3>
                                  <div className="space-y-4 md:space-y-6">
                                    {loading ? (
                                      <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">
                                        Loading reviews...
                                      </p>
                                    ) : reviews.length === 0 ? (
                                      <p className="text-gray-500 text-center py-6 md:py-8 text-[13px] md:text-[14px]">
                                        No reviews yet.
                                      </p>
                                    ) : (
                                      reviews.map((r: any) => {
                                        const createdAt = r.createdAt ? new Date(r.createdAt) : null;
                                        const time =
                                          createdAt && !Number.isNaN(createdAt.getTime())
                                            ? createdAt.toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                              })
                                            : "";
                                        const stars =
                                          typeof r.stars === "number"
                                            ? Math.max(0, Math.min(5, Math.round(r.stars)))
                                            : 0;
                                        const hasResponse = r.response?.text;
                                        const isExpanded = proProfileExpandedReviewResponses.has(r.id);
                                        return (
                                          <div
                                            key={r.id}
                                            className="flex gap-3 p-3 md:p-4 border border-gray-200 rounded-xl"
                                          >
                                            <div className="w-10 h-10 rounded-full bg-[#E6F0FF] flex items-center justify-center flex-shrink-0 font-['Poppins',sans-serif] text-[14px] font-semibold text-[#003D82]">
                                              {(r.name || "A").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                                                  {r.name || "Anonymous"}
                                                </span>
                                                {time && (
                                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                                    {time}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex gap-0.5 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${
                                                      star <= stars
                                                        ? "fill-[#FE8A0F] text-[#FE8A0F]"
                                                        : "fill-[#E5E5E5] text-[#E5E5E5]"
                                                    }`}
                                                  />
                                                ))}
                                              </div>
                                              {r.text && (
                                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap">
                                                  {r.text}
                                                </p>
                                              )}
                                              {hasResponse && (
                                                <div className="mt-3 border-t border-gray-200 pt-3">
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleResponse(r.id)}
                                                    className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                                                  >
                                                    <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#003D82]">
                                                      {proProfileData?.tradingName || "Professional"}&apos;s Response
                                                    </span>
                                                    {isExpanded ? (
                                                      <ChevronUp className="w-4 h-4 text-[#6b6b6b] flex-shrink-0" />
                                                    ) : (
                                                      <ChevronDown className="w-4 h-4 text-[#6b6b6b] flex-shrink-0" />
                                                    )}
                                                  </button>
                                                  {isExpanded && (
                                                    <div className="mt-2 ml-2 pl-3 border-l-2 border-blue-200">
                                                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap">
                                                        {r.response!.text}
                                                      </p>
                                                      {r.response?.respondedAt && (
                                                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#9ca3af] mt-2">
                                                          {new Date(r.response.respondedAt).toLocaleDateString(
                                                            "en-GB",
                                                            {
                                                              day: "numeric",
                                                              month: "short",
                                                              year: "numeric",
                                                            }
                                                          )}
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
                                </>
                              );
                            })()}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote credits purchase slider (top-most) */}
      {showQuoteCreditsSlider &&
        createPortal(
          <div className="fixed inset-0 z-[1000000] flex" style={{ zIndex: 1000000 }}>
            {/* Left side overlay (kept non-blur, just to catch outside clicks) */}
            <button
              type="button"
            className={["flex-1 bg-black/0", hideQuoteCreditsSliderPanel ? "opacity-0 pointer-events-none" : ""].join(" ")}
              onClick={closeQuoteCreditsSlider}
              aria-label="Close quote credits"
            />
            <div
              className={[
                "w-1/2 max-w-[900px] bg-white h-full shadow-2xl relative flex flex-col",
                "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                hideQuoteCreditsSliderPanel ? "pointer-events-none" : "",
              ].join(" ")}
              style={{
                transform: quoteCreditsSliderAnimateIn ? "translateX(0)" : "translateX(100%)",
                opacity: quoteCreditsSliderAnimateIn ? (hideQuoteCreditsSliderPanel ? 0 : 1) : 0,
              }}
            >
              <button
                type="button"
                onClick={closeQuoteCreditsSlider}
                className="absolute top-4 right-4 z-10 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 h-9 w-9 shadow-sm"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="h-full overflow-y-auto bg-[#f0f0f0] font-['Poppins',sans-serif]">
                <div className="p-4 md:p-6">
                  <BidsAndMembershipSection
                    hideHeader
                    onWalletFundModalOpenChange={(open) => setHideQuoteCreditsSliderPanel(open)}
                    onQuoteCreditsPurchaseSuccess={() => {
                      closeQuoteCreditsSlider();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Wallet funding modal (card / paypal / bank) */}
      <WalletFundModal
        isOpen={showFundWalletModal}
        onClose={() => {
          setShowFundWalletModal(false);
          openQuoteCreditsSlider();
        }}
        onSuccess={() => {
          // After funding, reopen credits slider so user can buy credits immediately.
          setShowFundWalletModal(false);
          openQuoteCreditsSlider();
        }}
      />

      <WalletFundModal
        isOpen={showAwardPayPalFundModal}
        onClose={() => {
          setShowAwardPayPalFundModal(false);
          pendingPayPalAwardRef.current = null;
        }}
        onSuccess={async () => {
          const pending = pendingPayPalAwardRef.current;
          if (!pending || !selectedQuoteForAward || !job?.id) {
            setShowAwardPayPalFundModal(false);
            pendingPayPalAwardRef.current = null;
            return;
          }
          try {
            setAwardSubmitting(true);
            await awardJobWithMilestone(
              job.id,
              selectedQuoteForAward.id,
              selectedQuoteForAward.professionalId,
              pending.milestones,
              { paymentSource: "wallet" }
            );
            await refreshUser?.();
            await fetchJobById(job.slug || job.id);
            toast.success(`Job awarded with ${pending.milestones.length} milestone(s)!`);
            setShowAwardModal(false);
            setSelectedQuoteForAward(null);
            setAwardMilestones([{ name: "", amount: "" }]);
            setAwardWithMilestone(true);
            setActiveTab("payment");
            navigate(`/job/${job.slug || jobSlug}?tab=payment`, { replace: true });
          } catch (e: unknown) {
            toast.error(
              (e as Error)?.message ||
                "Wallet was funded but awarding failed. Your balance is updated — try again using account balance."
            );
          } finally {
            pendingPayPalAwardRef.current = null;
            setShowAwardPayPalFundModal(false);
            setAwardSubmitting(false);
          }
        }}
        lockAmount={true}
        initialAmount={awardMilestoneTotalDisplay > 0 ? String(awardMilestoneTotalDisplay) : "0"}
        restrictToSelectedPaymentType={true}
        initialPaymentType="paypal"
        forJobMilestoneAward={true}
        hideBankOption={true}
        titleText="PayPal — fund wallet for milestone"
      />

      {showAwardAddCardModal && awardPublishableKey ? (
        <PaymentMethodModal
          isOpen={showAwardAddCardModal}
          onClose={() => setShowAwardAddCardModal(false)}
          onSuccess={() => {
            setShowAwardAddCardModal(false);
            fetchAwardFundingData();
          }}
          publishableKey={awardPublishableKey}
        />
      ) : null}

      {/* Attachment preview modal (job post attachments) */}
      <Dialog open={!!attachmentPreview} onOpenChange={(open) => { if (!open) setAttachmentPreview(null); }}>
        <DialogContent className="font-['Poppins',sans-serif] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[#2c353f] truncate pr-8">{attachmentPreview?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-100 rounded-lg p-4">
            {attachmentPreview && (() => {
              const isImage = (attachmentPreview.mimeType || "").startsWith("image/");
              const isVideo = (attachmentPreview.mimeType || "").startsWith("video/");
              const src = resolveApiUrl(attachmentPreview.url);
              if (isImage) {
                return <img src={src} alt={attachmentPreview.name} className="max-w-full max-h-[70vh] object-contain" />;
              }
              if (isVideo) {
                return <video src={src} controls className="max-w-full max-h-[70vh]" title={attachmentPreview.name} />;
              }
              return (
                <p className="text-[#6b6b6b] font-['Poppins',sans-serif] text-[14px]">
                  Preview not available.{" "}
                  <a href={src} download={attachmentPreview.name} target="_blank" rel="noopener noreferrer" className="text-[#1976D2] hover:underline">
                    Download
                  </a>
                </p>
              );
            })()}
          </div>
          {attachmentPreview && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <a
                href={resolveApiUrl(attachmentPreview.url)}
                download={attachmentPreview.name}
                target="_blank"
                rel="noopener noreferrer"
                className="font-['Poppins',sans-serif] text-[14px] text-[#1976D2] hover:underline inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <Button variant="outline" onClick={() => setAttachmentPreview(null)} className="font-['Poppins',sans-serif]">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw quote confirmation */}
      <AlertDialog open={!!quoteToWithdraw} onOpenChange={(open) => !open && setQuoteToWithdraw(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Poppins',sans-serif]">Withdraw quote?</AlertDialogTitle>
            <AlertDialogDescription className="font-['Poppins',sans-serif]">
              This will remove your quote from this job. You can submit a new quote later if the job is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-['Poppins',sans-serif]">Cancel</AlertDialogCancel>
            <Button
              onClick={handleWithdrawConfirm}
              disabled={withdrawing}
              className="font-['Poppins',sans-serif] bg-red-600 hover:bg-red-700"
            >
              {withdrawing ? "Withdrawing…" : "Withdraw"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject job award confirmation (professional) */}
      <AlertDialog open={showRejectAwardConfirm} onOpenChange={(open) => !open && setShowRejectAwardConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Poppins',sans-serif]">Reject job award?</AlertDialogTitle>
            <AlertDialogDescription className="font-['Poppins',sans-serif]">
              You will decline this job. The client will be able to award another professional. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-['Poppins',sans-serif]" disabled={rejectingAward}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleRejectAwardConfirm}
              disabled={rejectingAward}
              className="font-['Poppins',sans-serif] bg-red-600 hover:bg-red-700"
            >
              {rejectingAward ? "Rejecting…" : "Reject award"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pro: Accept/Reject milestone cancel request confirmation */}
      <AlertDialog open={!!cancelResponseConfirm} onOpenChange={(open) => !open && setCancelResponseConfirm(null)}>
        <AlertDialogContent className="font-['Poppins',sans-serif]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cancelResponseConfirm?.action === "accept" ? "Accept cancel request?" : "Reject cancel request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelResponseConfirm?.action === "accept"
                ? "The milestone will be cancelled and the client will be refunded. This action cannot be undone."
                : "The milestone will continue as planned. The client's cancel request will be declined."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={respondingCancel}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleConfirmCancelResponse}
              disabled={respondingCancel}
              className={cancelResponseConfirm?.action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {respondingCancel ? "..." : cancelResponseConfirm?.action === "accept" ? "Accept" : "Reject"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client: Accept/Reject release request confirmation */}
      <AlertDialog open={!!releaseResponseConfirm} onOpenChange={(open) => !open && setReleaseResponseConfirm(null)}>
        <AlertDialogContent className="font-['Poppins',sans-serif]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {releaseResponseConfirm?.action === "accept" ? "Accept release request?" : "Reject release request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {releaseResponseConfirm?.action === "accept"
                ? "The milestone will be released and funds will be transferred to the professional. This action cannot be undone."
                : "The release request will be declined. The milestone will remain in progress."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={respondingRelease}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleConfirmReleaseResponse}
              disabled={respondingRelease}
              className={releaseResponseConfirm?.action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {respondingRelease ? "..." : releaseResponseConfirm?.action === "accept" ? "Accept" : "Reject"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client: Accept/Reject cancel request confirmation */}
      <AlertDialog open={!!clientCancelResponseConfirm} onOpenChange={(open) => !open && setClientCancelResponseConfirm(null)}>
        <AlertDialogContent className="font-['Poppins',sans-serif]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clientCancelResponseConfirm?.action === "accept" ? "Accept cancel request?" : "Reject cancel request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clientCancelResponseConfirm?.action === "accept"
                ? "The milestone will be cancelled and you will be refunded. This action cannot be undone."
                : "The milestone will continue as planned. The professional's cancel request will be declined."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={respondingCancelClient}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleConfirmClientCancelResponse}
              disabled={respondingCancelClient}
              className={clientCancelResponseConfirm?.action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {respondingCancelClient ? "..." : clientCancelResponseConfirm?.action === "accept" ? "Accept" : "Reject"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Job confirmation (client manage menu) */}
      <AlertDialog open={showDeleteJobConfirm} onOpenChange={(open) => !open && !deletingJob && setShowDeleteJobConfirm(false)}>
        <AlertDialogContent className="font-['Poppins',sans-serif]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job &quot;{job?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingJob}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteJobConfirm} disabled={deletingJob}>
              {deletingJob ? "Deleting..." : "Delete Job"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quote Submission / Edit Dialog for Professionals */}
      <Dialog
        open={showQuoteDialog}
        onOpenChange={(open) => {
          setShowQuoteDialog(open);
          if (!open) {
            setEditingQuoteMeta(null);
            setQuoteMessageBeforeAi(null);
            setIsQuoteMessageAiGenerated(false);
          }
        }}
      >
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4 mb-6">
            <DialogTitle className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f]">
              {editingQuoteMeta ? "Edit Quote" : "Send Quote"}
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[15px] text-[#6b6b6b] mt-2">
              {editingQuoteMeta ? "Update your quote for: " : "Submit your quote for: "}
              <span className="text-[#FE8A0F]">{job.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Job Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#1976D2] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Job Summary
              </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="font-['Poppins',sans-serif] text-[28px] text-[#059669]">
                    {job.budgetMin != null && job.budgetMax != null
                      ? `${formatPrice(job.budgetMin ?? 0)} - ${formatPrice(job.budgetMax ?? 0)}`
                      : `${formatPrice(job.budgetAmount ?? 0)} - ${formatPrice((job.budgetAmount ?? 0) * 1.2)}`}
                  </div>
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-[#2c353f] text-[14px] font-['Poppins',sans-serif]">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {job.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quote Details Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Quote Details
              </h3>
              <div className="space-y-5">
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Your Price ({symbol}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter your price"
                    min={quoteBudgetMinSelected}
                    max={quoteBudgetMaxSelected}
                    step="0.01"
                    value={quoteForm.price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                    onBlur={() => {
                      const v = parseFloat(quoteForm.price);
                      if (quoteForm.price !== "" && !isNaN(v)) {
                        const clamped = Math.min(quoteBudgetMaxSelected, Math.max(quoteBudgetMinSelected, v));
                        const rounded = Math.round(clamped * 100) / 100;
                        if (rounded !== v) setQuoteForm((f) => ({ ...f, price: rounded.toFixed(2) }));
                      }
                    }}
                    className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12"
                  />
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2 bg-yellow-50 px-3 py-1 rounded-md inline-block">
                    💡 Client's budget: {formatPriceWhole(quoteBudgetMinGBP)} - {formatPriceWhole(quoteBudgetMaxGBP)} (price must be within this range)
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                    Delivery Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder=""
                      value={quoteForm.deliveryTime}
                      onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })}
                      className="font-['Poppins',sans-serif] text-[15px] border-2 border-gray-200 focus:border-[#FE8A0F] h-12 pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] font-['Poppins',sans-serif] text-[14px] pointer-events-none">
                      day(s)
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] block">
                      Message to Client <span className="text-red-500">*</span>
                    </Label>
                    {isQuoteMessageAiGenerated && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (quoteMessageBeforeAi != null) {
                              setQuoteForm((f) => ({ ...f, message: quoteMessageBeforeAi }));
                            }
                            setIsQuoteMessageAiGenerated(false);
                          }}
                          className="h-8 w-8 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#2c353f]"
                          aria-label="Restore previous message"
                          title="Restore"
                        >
                          <Undo2 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setQuoteForm((f) => ({ ...f, message: "" }));
                            setIsQuoteMessageAiGenerated(false);
                          }}
                          className="h-8 w-8 rounded-full text-[#6b6b6b] hover:bg-gray-100 hover:text-[#DC3545]"
                          aria-label="Clear message"
                          title="Clear"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="Enter key points or a few words, then use Generate text by AI to write a full message..."
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    className="font-['Poppins',sans-serif] text-[14px] min-h-[180px] border-2 border-gray-200 focus:border-[#FE8A0F] resize-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!isQuoteMessageAiGenerated && (
                      <button
                        type="button"
                        onClick={handleGenerateQuoteMessage}
                        disabled={aiQuoteMessageGenerating}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 font-['Poppins',sans-serif] font-semibold text-[15px] px-5 py-2.5 rounded-xl border-2 transition-all duration-200",
                          aiQuoteMessageGenerating
                            ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                            : "bg-white border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] active:scale-[0.98]"
                        )}
                      >
                        <Sparkles className={cn("w-5 h-5 flex-shrink-0", aiQuoteMessageGenerating && "animate-pulse")} />
                        {aiQuoteMessageGenerating ? "Generating…" : "Generate text by AI"}
                      </button>
                    )}
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2 bg-green-50 px-3 py-1 rounded-md inline-block">
                    💡 Tip: Mention your relevant experience and availability
                  </p>
                </div>
              </div>
            </div>

            {/* Milestone Section */}
            <Collapsible
              open={isMilestoneOpen}
              onOpenChange={setIsMilestoneOpen}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 hover:bg-transparent font-['Poppins',sans-serif] mb-2"
                >
                  <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#059669] flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Suggest Milestone Payment
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 text-[#059669] transition-transform duration-200 ${
                      isMilestoneOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4">
                <div className="mb-4 pl-7">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    Suggest Milestone Payment Break Down!{" "}
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">Optional</span>
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                              Milestone {index + 1} Description
                            </Label>
                            <Input
                              placeholder="Define the tasks that you will complete for this milestone"
                              value={milestone.description}
                              onChange={(e) => updateMilestone(index, "description", e.target.value)}
                              className="font-['Poppins',sans-serif] text-[14px] border-2 border-gray-200"
                            />
                          </div>
                          <div className="w-32">
                            <Label className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1 block">
                              Amount
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b6b6b] font-['Poppins',sans-serif] text-[14px]">
                                {symbol}
                              </span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={milestone.amount}
                                onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                                className="pl-7 font-['Poppins',sans-serif] text-[14px] border-2 border-gray-200"
                              />
                            </div>
                          </div>
                          {milestones.length > 1 && (
                            <div className="pt-5">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMilestone(index)}
                                className="px-3 font-['Poppins',sans-serif] h-10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals + validation */}
                  {quotePriceSelectedValid && hasAnyMilestoneInput && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-3 text-[13px] font-['Poppins',sans-serif]">
                        <span className="text-[#6b6b6b]">Milestones total</span>
                        <span className="text-[#2c353f] font-semibold">{symbol}{milestonesTotalRounded.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-[13px] font-['Poppins',sans-serif]">
                        <span className="text-[#6b6b6b]">Quote price</span>
                        <span className="text-[#2c353f] font-semibold">{symbol}{quotePriceRounded.toFixed(2)}</span>
                      </div>
                      {isMilestonesExact ? (
                        <p className="mt-2 text-[12px] text-green-700 font-['Poppins',sans-serif]">
                          Total matches your quote price.
                        </p>
                      ) : isMilestonesOver ? (
                        <p className="mt-2 text-[12px] text-red-700 font-['Poppins',sans-serif]">
                          Total is over by {symbol}{Math.abs(milestoneDiff).toFixed(2)}. Please reduce amounts.
                        </p>
                      ) : isMilestonesUnder ? (
                        <p className="mt-2 text-[12px] text-red-700 font-['Poppins',sans-serif]">
                          Total is under by {symbol}{milestoneDiff.toFixed(2)}. Please add more to match.
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Add another milestone: hide when totals match (or exceed), or when price is not set */}
                  {(!quotePriceSelectedValid || !hasAnyMilestoneInput || milestoneDiff > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Prevent adding once total is met/exceeded.
                        if (quotePriceSelectedValid && hasAnyMilestoneInput && milestoneDiff <= 0) return;
                        addMilestoneToForm();
                      }}
                      className="mt-3 bg-[#059669] text-white hover:bg-[#047857] border-0 font-['Poppins',sans-serif] h-10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add another milestone
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t-2 border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuoteDialog(false);
                  setQuoteForm({ price: "", deliveryTime: "", message: "" });
                  setMilestones([{ description: "", amount: "" }]);
                }}
                className="flex-1 font-['Poppins',sans-serif] h-12 text-[15px] border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitQuote}
                disabled={editSubmitting}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {editingQuoteMeta ? (editSubmitting ? "Updating…" : "Update Quote") : "Send Quote"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Job Modal */}
      <Dialog open={showAwardModal} onOpenChange={setShowAwardModal}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4 sm:mb-6">
            <DialogTitle className="font-['Poppins',sans-serif] text-[18px] sm:text-[22px] text-[#2c353f] mb-2">
              Set up Milestone Payments
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[12px] sm:text-[14px] text-[#6b6b6b]">
              You only have to pay for work when it has been completed and you're 100% satisfied.
            </DialogDescription>
          </DialogHeader>

          {selectedQuoteForAward && (
            <div className="space-y-4">
              {/* Professional Info */}
              <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-lg">
                <Avatar className="w-10 h-10 border-2 border-gray-200 flex-shrink-0">
                  {resolveAvatarUrl(selectedQuoteForAward.professionalAvatar) && (
                    <AvatarImage src={resolveAvatarUrl(selectedQuoteForAward.professionalAvatar)} />
                  )}
                  <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif]">
                    {getTwoLetterInitials(selectedQuoteForAward.professionalName, "P")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[14px] text-[#2c353f]">
                    <strong>{selectedQuoteForAward.professionalName}</strong>
                    {(() => {
                      const n = (selectedQuoteForAward.suggestedMilestones || []).filter(
                        (s) => String(s.description || "").trim() && Number(s.amount) > 0
                      ).length;
                      return n > 0 ? (
                        <>
                          {" "}
                          suggested a <strong>{n}-step</strong> milestone plan in their quote — it&apos;s pre-filled when you choose
                          &quot;With milestone&quot; (you can edit before awarding).
                        </>
                      ) : (
                        <> — choose milestone payments or award without milestones.</>
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Radio Group */}
              <RadioGroup
                value={awardWithMilestone ? "with" : "without"}
                onValueChange={(value) => {
                  const withM = value === "with";
                  setAwardWithMilestone(withM);
                  if (withM && selectedQuoteForAward) {
                    setAwardMilestones(buildAwardMilestonesFromQuote(selectedQuoteForAward));
                  }
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  {/* Award with milestone */}
                  <div 
                    onClick={() => setAwardWithMilestone(true)}
                    className={`relative flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      awardWithMilestone 
                        ? 'border-[#3B82F6] bg-[#EFF6FF]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="with" id="with-milestone" className="flex-shrink-0 mt-0.5" />
                      <Label htmlFor="with-milestone" className="font-['Poppins',sans-serif] text-[13px] cursor-pointer flex-1">
                        With milestone
                      </Label>
                      {awardWithMilestone && (
                        <CheckCircle2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] pl-6">
                      Pay in stages
                    </p>
                  </div>

                  {/* Award without milestone */}
                  <div 
                    onClick={() => setAwardWithMilestone(false)}
                    className={`relative flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      !awardWithMilestone 
                        ? 'border-[#3B82F6] bg-[#EFF6FF]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="without" id="without-milestone" className="flex-shrink-0 mt-0.5" />
                      <Label htmlFor="without-milestone" className="font-['Poppins',sans-serif] text-[13px] cursor-pointer flex-1">
                        Without milestone
                      </Label>
                      {!awardWithMilestone && (
                        <CheckCircle2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] pl-6">
                      Pay after completion
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {/* Amount Input - Multiple milestones with name + amount */}
              {awardWithMilestone && (() => {
                const awardModalQuoteHasPlan = quoteHasSuggestedMilestonePlan(selectedQuoteForAward);
                return (
                <div className="space-y-3">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    {awardModalQuoteHasPlan ? "Milestones" : "Milestone amount"}
                  </Label>
                  {awardModalQuoteHasPlan &&
                    (selectedQuoteForAward.suggestedMilestones || []).filter(
                      (s) => String(s.description || "").trim() && Number(s.amount) > 0
                    ).length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] px-3 py-2 font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#1e40af]">
                      Pre-filled from the quote. Adjust names or amounts if needed; funds are held when you award.
                    </div>
                  )}
                  {!awardModalQuoteHasPlan && (
                    <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#6b6b6b]">
                      One milestone will be created for the quoted total. You can adjust the amount if needed.
                    </p>
                  )}
                  {(awardModalQuoteHasPlan ? awardMilestones : awardMilestones.slice(0, 1)).map((row, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      {awardModalQuoteHasPlan && (
                        <Input
                          value={row.name}
                          onChange={(e) => {
                            const next = [...awardMilestones];
                            next[index] = { ...next[index], name: e.target.value };
                            setAwardMilestones(next);
                          }}
                          placeholder="Milestone name"
                          className="flex-1 font-['Poppins',sans-serif] text-[14px]"
                        />
                      )}
                      <div
                        className={`flex items-center gap-1 ${awardModalQuoteHasPlan ? "w-[120px]" : "flex-1 sm:max-w-[220px]"}`}
                      >
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">{symbol}</span>
                        <Input
                          type="number"
                          value={row.amount}
                          onChange={(e) => {
                            const next = [...awardMilestones];
                            const i = awardModalQuoteHasPlan ? index : 0;
                            next[i] = { ...next[i], amount: e.target.value };
                            setAwardMilestones(next);
                          }}
                          placeholder="0.00"
                          className="font-['Poppins',sans-serif] text-[14px]"
                        />
                      </div>
                      {awardModalQuoteHasPlan && awardMilestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAwardMilestones((prev) => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:bg-red-50 h-10 w-10 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {awardModalQuoteHasPlan && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAwardMilestones((prev) => [...prev, { name: "", amount: "" }])}
                      className="font-['Poppins',sans-serif] text-[13px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add another milestone
                    </Button>
                  )}
                </div>
                );
              })()}

              {awardWithMilestone && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    Payment method
                  </Label>
                  {awardFundingLoading ? (
                    <div className="flex items-center gap-2 font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      Loading payment options…
                    </div>
                  ) : (
                    <RadioGroup
                      value={awardPaymentSource}
                      onValueChange={(v) => setAwardPaymentSource(v as "wallet" | "card" | "paypal")}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    >
                      {canPayAwardFromWallet && (
                        <div
                          className={`flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer ${
                            awardPaymentSource === "wallet"
                              ? "border-[#3B82F6] bg-[#EFF6FF]"
                              : "border-gray-200"
                          }`}
                          onClick={() => setAwardPaymentSource("wallet")}
                        >
                          <RadioGroupItem value="wallet" id="award-pay-wallet" />
                          <Label htmlFor="award-pay-wallet" className="cursor-pointer font-['Poppins',sans-serif] text-[12px] flex-1">
                            <span className="block text-[11px] text-[#6b6b6b] font-normal mt-0.5">
                              Available balance {formatAmountInSelectedCurrency(fromGBP(awardWalletBalanceGBP))}
                            </span>
                          </Label>
                        </div>
                      )}
                      {awardStripeEnabled && (
                        <div
                          className={`flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer ${
                            awardPaymentSource === "card"
                              ? "border-[#3B82F6] bg-[#EFF6FF]"
                              : "border-gray-200"
                          }`}
                          onClick={() => setAwardPaymentSource("card")}
                        >
                          <RadioGroupItem value="card" id="award-pay-card" />
                          <Label htmlFor="award-pay-card" className="cursor-pointer font-['Poppins',sans-serif] text-[12px] flex-1">
                            <CreditCard className="w-6 h-6 mr-2" />
                            <span className="block text-[11px] text-[#6b6b6b] font-normal mt-0.5">Debit or credit</span>
                          </Label>
                        </div>
                      )}
                      {awardPaypalEnabled && (
                        <div
                          className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer ${
                            awardPaymentSource === "paypal"
                              ? "border-[#3B82F6] bg-[#EFF6FF]"
                              : "border-gray-200"
                          }`}
                          onClick={() => setAwardPaymentSource("paypal")}
                        >
                          <RadioGroupItem value="paypal" id="award-pay-paypal" />
                          <Label htmlFor="award-pay-paypal" className="cursor-pointer font-['Poppins',sans-serif] text-[12px] flex-1">
                            <img
                              src={paypalLogo}
                              alt=""
                              className="shrink-0 object-contain object-left"
                              width={50}
                              height={50}
                            />
                            <span className="block text-[11px] text-[#6b6b6b] font-normal mt-0.5">PayPal</span>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  )}
                  {!awardFundingLoading &&
                    !canPayAwardFromWallet &&
                    awardMilestoneTotalGBP > 0 && (
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#92400e] bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                        Your balance is less than this milestone total. Account balance is hidden — use card or PayPal (funds go to your wallet first, then escrow).
                      </p>
                    )}
                  {awardPaymentSource === "card" && awardStripeEnabled && (
                    <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-white">
                      <p className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#2c353f]">Saved cards</p>
                      {awardPayMethods.length === 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-['Poppins',sans-serif]"
                          onClick={() => {
                            if (!awardPublishableKey) {
                              toast.error("Payment setup is still loading. Try again in a moment.");
                              return;
                            }
                            setShowAwardAddCardModal(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Add new card
                        </Button>
                      ) : (
                        <>
                          <RadioGroup
                            value={awardSelectedCardId || ""}
                            onValueChange={(id) => setAwardSelectedCardId(id)}
                            className="space-y-2"
                          >
                            {awardPayMethods.map((pm) => (
                              <div
                                key={pm.paymentMethodId}
                                className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${
                                  awardSelectedCardId === pm.paymentMethodId
                                    ? "border-[#FE8A0F] bg-[#FFF5EB]"
                                    : "border-gray-200"
                                }`}
                                onClick={() => setAwardSelectedCardId(pm.paymentMethodId)}
                              >
                                <RadioGroupItem value={pm.paymentMethodId} id={`award-card-${pm.paymentMethodId}`} />
                                <Label
                                  htmlFor={`award-card-${pm.paymentMethodId}`}
                                  className="cursor-pointer flex-1 font-['Poppins',sans-serif] text-[13px]"
                                >
                                  <span className="capitalize">{pm.card.brand}</span> •••• {pm.card.last4}
                                  <span className="text-[11px] text-[#6b6b6b] ml-2">
                                    {String(pm.card.expMonth).padStart(2, "0")}/{pm.card.expYear}
                                  </span>
                                  {pm.isDefault ? (
                                    <span className="ml-2 text-[10px] bg-[#FE8A0F] text-white px-1.5 py-0.5 rounded">Default</span>
                                  ) : null}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="font-['Poppins',sans-serif] w-full mt-1"
                            onClick={() => {
                              if (!awardPublishableKey) {
                                toast.error("Payment setup is still loading. Try again in a moment.");
                                return;
                              }
                              setShowAwardAddCardModal(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add new card
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  {awardPaymentSource === "paypal" && awardPaypalEnabled && (
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b]">
                      You will complete PayPal in the next step. Your wallet will be funded for the milestone total (plus fee), then the same amount is held for the milestone — both lines appear in billing history.
                    </p>
                  )}
                  {awardMilestoneTotalDisplay > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-4 space-y-2">
                      <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                        Invoice summary
                      </p>
                      <div className="flex justify-between font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f]">
                        <span>Milestone total (escrow)</span>
                        <span>{formatAmountInSelectedCurrency(awardInvoiceFees.subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#2c353f]">
                        <span className="inline-flex items-center gap-1">
                          Processing fee
                          <Info
                            className="w-3.5 h-3.5 text-blue-500 cursor-help shrink-0"
                            title={
                              awardPaymentSource === "wallet"
                                ? "No fee when paying from your Sortars balance."
                                : awardPaymentSource === "card"
                                  ? `Card: ${awardFeeSettings.stripeCommissionPercentage}% + ${formatPrice(awardFeeSettings.stripeCommissionFixed)} per charge.`
                                  : `PayPal: ${awardFeeSettings.paypalCommissionPercentage}% + ${formatPrice(awardFeeSettings.paypalCommissionFixed)}.`
                            }
                          />
                        </span>
                        <span>{formatAmountInSelectedCurrency(awardInvoiceFees.fee)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between font-['Poppins',sans-serif] text-[14px] sm:text-[15px] font-semibold text-[#2c353f]">
                        <span>
                          {awardPaymentSource === "wallet" ? "Deducted from balance" : "Total you pay"}
                        </span>
                        <span>{formatAmountInSelectedCurrency(awardInvoiceFees.totalDue)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <p className="font-['Poppins',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f]">
                  Total: <strong>{awardWithMilestone
                    ? formatAmountInSelectedCurrency(
                        (quoteHasSuggestedMilestonePlan(selectedQuoteForAward)
                          ? awardMilestones
                          : awardMilestones.slice(0, 1)
                        ).reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                      )
                    : formatPriceWhole(Number(selectedQuoteForAward.price))}</strong>
                </p>
              </div>

              {/* Info Text */}
              {awardWithMilestone && (
                <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-lg p-3 sm:p-4">
                  <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[13px] text-[#2c353f] mb-2">
                    <strong>{selectedQuoteForAward.professionalName}</strong> will receive a notification to accept this milestone. Once they accept and complete the work to your satisfaction, you can release the payment.
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[13px] text-[#2c353f]">
                    Milestone Payments are refundable subject to our{" "}
                    <a href="#" className="text-[#3B82F6] underline">
                      terms and conditions
                    </a>
                    . You can cancel the milestone before the professional accepts.
                  </p>
                </div>
              )}

              {/* Award Button */}
              <Button
                onClick={handleAwardJob}
                disabled={
                  awardSubmitting ||
                  (awardWithMilestone &&
                    !awardFundingLoading &&
                    awardMilestoneTotalDisplay > 0 &&
                    !canPayAwardFromWallet &&
                    !awardStripeEnabled &&
                    !awardPaypalEnabled)
                }
                className="w-full bg-[#FE8A0F] hover:bg-[#E57A00] text-white font-['Poppins',sans-serif] py-5 sm:py-6 text-[14px] sm:text-[16px] disabled:opacity-50"
              >
                {awardSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                    Processing…
                  </>
                ) : awardWithMilestone ? (
                  awardPaymentSource === "paypal" ? (
                    `Pay with PayPal & award job`
                  ) : (
                    `Award and Create ${quoteHasSuggestedMilestonePlan(selectedQuoteForAward) ? awardMilestones.length : 1} Milestone(s)`
                  )
                ) : (
                  `Award Job`
                )}
              </Button>

              {/* Guide Tip with Steps - Moved below button */}
              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4">
                <h4 className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-3">
                  How Milestone Payments Work
                </h4>
                
                {/* Steps */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex-shrink-0">
                      <img src={milestoneStep1} alt="Step 1" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] leading-tight">
                      Deposit funds to create milestone
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex-shrink-0">
                      <img src={milestoneStep2} alt="Step 2" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] leading-tight">
                      Funds held securely while work progresses
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 flex-shrink-0">
                      <img src={milestoneStep3} alt="Step 3" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] leading-tight">
                      Release payment when 100% satisfied
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RequestMilestonesDialog
        open={showRequestMilestonesDialog}
        onOpenChange={setShowRequestMilestonesDialog}
        jobId={job?.id}
        fetchJobKey={job?.slug || job?.id || ""}
      />
      <CreateNewMilestoneDialog
        open={showNewMilestoneDialog}
        onOpenChange={setShowNewMilestoneDialog}
        jobId={job?.id}
        fetchJobKey={job?.slug || job?.id || ""}
      />

      {/* Cancel Request Modal */}
      <Dialog open={showCancelRequestModal} onOpenChange={(open) => { setShowCancelRequestModal(open); if (!open) { setCancelRequestMilestone(null); setCancelRequestReason(""); } }}>
        <DialogContent className="max-w-md font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Request to cancel milestone
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {cancelRequestMilestone && (
                <>Request cancellation for &quot;{cancelRequestMilestone.name || cancelRequestMilestone.description}&quot; ({formatPrice(Number(cancelRequestMilestone.amount))}). The other party can accept or reject.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">Reason (optional)</Label>
              <Textarea
                value={cancelRequestReason}
                onChange={(e) => setCancelRequestReason(e.target.value)}
                placeholder="Why do you want to cancel this milestone?"
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCancelRequestModal(false); setCancelRequestMilestone(null); setCancelRequestReason(""); }} className="font-['Poppins',sans-serif]">
                Cancel
              </Button>
              <Button
                className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                onClick={async () => {
                  if (!cancelRequestMilestone) return;
                  try {
                    await requestMilestoneCancel(job.id, cancelRequestMilestone.id, cancelRequestReason);
                    toast.success("Cancel request sent");
                    setShowCancelRequestModal(false);
                    setCancelRequestMilestone(null);
                    setCancelRequestReason("");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to send cancel request");
                  }
                }}
              >
                Send request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={(open) => { setShowDisputeModal(open); if (!open) setDisputeMilestone(null); }}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Open Dispute
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {disputeForm.selectedMilestones.length > 1
                ? `Disputing ${disputeForm.selectedMilestones.length} milestones. Our support team will review and help resolve the issue.`
                : disputeMilestone
                  ? `Disputing: ${disputeMilestone.name || disputeMilestone.description} - ${formatPrice(Number(disputeMilestone.amount))}`
                  : "If there's an issue with the milestone(s), you can raise a dispute. Our support team will review and help resolve the issue."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Info Box - Yellow Background */}
            <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4">
              <ul className="space-y-2 font-['Poppins',sans-serif] text-[13px] text-[#78350F] list-disc list-inside">
                <li>Most disputes are the result of a simple misunderstanding.</li>
                <li>Our dispute resolution system is designed to allow both parties to resolve the issue amongst themselves.</li>
                <li>Most disputes are resolved without arbitration.</li>
                <li>If an agreement cannot be reached, either party may elect to pay an arbitration fee for our dispute team to resolve the matter.</li>
              </ul>
            </div>

            {/* Requirements Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Please describe in detail what the requirements were for the milestone and what was not completed.
              </Label>
              <Textarea
                value={disputeForm.requirements}
                onChange={(e) => setDisputeForm({ ...disputeForm, requirements: e.target.value })}
                placeholder="Describe the requirements..."
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
              />
            </div>

            {/* Not Completed Description */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                What was not completed or what is the issue?
              </Label>
              <Textarea
                value={disputeForm.notCompleted}
                onChange={(e) => setDisputeForm({ ...disputeForm, notCompleted: e.target.value })}
                placeholder="Describe what was not completed..."
                className="font-['Poppins',sans-serif] text-[14px] min-h-[80px]"
              />
            </div>

            {/* Evidence Upload */}
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Please include evidence of how the milestone requirements we communicated, as well as any other evidence that supports your case.
              </Label>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="font-['Poppins',sans-serif] text-[14px]"
              />
              {disputeForm.evidenceFiles.length > 0 && (
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2">
                  {disputeForm.evidenceFiles.length} file(s) selected
                </p>
              )}
            </div>

            {/* Milestone Selection - in-progress milestones only (disputable), multi-select + Select all */}
            {inProgressMilestones.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] block">
                  Select the milestone(s) you want to dispute
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="font-['Poppins',sans-serif] text-[13px] text-[#1976D2] hover:text-[#1565C0] h-8 px-2"
                  onClick={handleSelectAllMilestones}
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <div className="space-y-2">
                {inProgressMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`dispute-${milestone.id}`}
                      checked={disputeForm.selectedMilestones.includes(milestone.id)}
                      onCheckedChange={(checked) => handleMilestoneSelection(milestone.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`dispute-${milestone.id}`}
                      className="flex-1 font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer"
                      onClick={() => {
                        const isSelected = disputeForm.selectedMilestones.includes(milestone.id);
                        handleMilestoneSelection(milestone.id, !isSelected);
                      }}
                    >
                      {milestone.name || milestone.description} - {formatPrice(Number(milestone.amount))}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitDispute}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-['Poppins',sans-serif]"
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite to Quote Modal */}
      <JobDeliverWorkModal
        open={showDeliverWorkModal}
        onOpenChange={setShowDeliverWorkModal}
        job={job}
        preselectedMilestoneIndex={deliverWorkPreselectedMilestoneIndex}
        onSuccess={() => {
          setDeliverWorkPreselectedMilestoneIndex(null);
          fetchJobById(job?.id || "");
        }}
      />

      <Dialog open={showViewWorkDeliveredModal} onOpenChange={(open) => { setShowViewWorkDeliveredModal(open); if (!open) { setViewWorkDeliveredData(null); } }}>
        <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              View Work delivered
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              {viewWorkDeliveredData ? `Milestone: ${viewWorkDeliveredData.milestoneName}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewWorkDeliveredData && (
            <div className="space-y-4">
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1 block">Message</Label>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {viewWorkDeliveredData.deliveryMessage || "(No message)"}
                </p>
              </div>
              {viewWorkDeliveredData.fileUrls.length > 0 && (
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">Attachments</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewWorkDeliveredData.fileUrls.map((f, i) => {
                      const fullUrl = resolveApiUrl(f.url);
                      const name = (f.name || f.url.split("/").pop() || "").toLowerCase();
                      const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(name) || name.includes("image");
                      const isVideo = /\.(mp4|webm|mov|avi|mpeg|ogv)$/i.test(name) || name.includes("video");
                      if (isImage) {
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {e.stopPropagation(); e.preventDefault(); setViewWorkFullscreenUrl(fullUrl); }}
                            className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:ring-2 hover:ring-[#FE8A0F] focus:outline-none focus:ring-2 focus:ring-[#FE8A0F]"
                          >
                            <img src={fullUrl} alt={f.name || "Attachment"} className="w-full h-full object-cover pointer-events-none" />
                          </button>
                        );
                      }
                      if (isVideo) {
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setViewWorkFullscreenUrl(fullUrl); }}
                            className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-900 hover:ring-2 hover:ring-[#FE8A0F] focus:outline-none focus:ring-2 focus:ring-[#FE8A0F]"
                          >
                            <video src={fullUrl} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#2c353f] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </button>
                        );
                      }
                      return (
                        <a
                          key={i}
                          href={fullUrl}
                          download={f.name || f.url.split("/").pop() || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-['Poppins',sans-serif] text-[13px] text-[#1976D2] col-span-2 sm:col-span-1"
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{f.name || f.url.split("/").pop() || "File"}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={async () => {
                    if (!job?.id || !viewWorkDeliveredData) return;
                    try {
                      await approveMilestoneDelivery(job.id, viewWorkDeliveredData.milestoneId);
                      toast.success("Approved and released.");
                      setShowViewWorkDeliveredModal(false);
                      setViewWorkDeliveredData(null);
                      fetchJobById(job.id);
                    } catch (e: any) {
                      toast.error(e?.message || "Failed to approve");
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 font-['Poppins',sans-serif]"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!job?.id || !viewWorkDeliveredData) return;
                    setShowViewWorkDeliveredModal(false);
                    setShowRevisionRequestModal(true);
                  }}
                  className="flex-1 font-['Poppins',sans-serif] border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  Request Revision
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pro: View Revision request modal */}
      <Dialog open={showViewRevisionModal} onOpenChange={(open) => { setShowViewRevisionModal(open); if (!open) setViewRevisionData(null); setViewRevisionFullscreenUrl(null); }}>
        <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              View Revision request
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              {viewRevisionData ? `Milestone: ${viewRevisionData.milestoneName}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewRevisionData && (
            <div className="space-y-4">
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-1 block">Client feedback</Label>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {viewRevisionData.revisionMessage || "(No message)"}
                </p>
              </div>
              {viewRevisionData.revisionFileUrls.length > 0 && (
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">Attachments</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewRevisionData.revisionFileUrls.map((f, i) => {
                      const fullUrl = resolveApiUrl(f.url);
                      const name = (f.name || f.url.split("/").pop() || "").toLowerCase();
                      const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(name) || name.includes("image");
                      const isVideo = /\.(mp4|webm|mov|avi|mpeg|ogv)$/i.test(name) || name.includes("video");
                      if (isImage) {
                        return (
                          <button key={i} type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setViewRevisionFullscreenUrl(fullUrl); }} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:ring-2 hover:ring-[#FE8A0F]">
                            <img src={fullUrl} alt={f.name || "Attachment"} className="w-full h-full object-cover pointer-events-none" />
                          </button>
                        );
                      }
                      if (isVideo) {
                        return (
                          <button key={i} type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setViewRevisionFullscreenUrl(fullUrl); }} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-900 hover:ring-2 hover:ring-[#FE8A0F]">
                            <video src={fullUrl} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#2c353f] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </button>
                        );
                      }
                      return (
                        <a key={i} href={fullUrl} download={f.name || f.url.split("/").pop() || undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-['Poppins',sans-serif] text-[13px] text-[#1976D2] col-span-2 sm:col-span-1">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{f.name || f.url.split("/").pop() || "File"}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setShowViewRevisionModal(false)} className="font-['Poppins',sans-serif]">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen viewer for image/video from View Revision request — portaled so it appears above the dialog */}
      {viewRevisionFullscreenUrl && createPortal(
        <div className="fixed inset-0 z-[100002] bg-black/95 flex items-center justify-center" onClick={() => setViewRevisionFullscreenUrl(null)} role="dialog" aria-modal="true">
          <button type="button" onClick={() => setViewRevisionFullscreenUrl(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          {(() => {
            const u = viewRevisionFullscreenUrl.toLowerCase();
            const isVideo = /\.(mp4|webm|mov|avi|mpeg|ogv)(\?|$)/i.test(u);
            return isVideo ? (
              <video src={viewRevisionFullscreenUrl} controls autoPlay className="max-w-full max-h-[90vh] w-auto h-auto object-contain" onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={viewRevisionFullscreenUrl} alt="Fullscreen" className="max-w-full max-h-[90vh] w-auto h-auto object-contain" onClick={(e) => e.stopPropagation()} />
            );
          })()}
        </div>,
        document.body
      )}

      {/* Fullscreen viewer for image/video from View Work delivered — portaled so it appears above the dialog */}
      {viewWorkFullscreenUrl && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          style={{ zIndex: 100002 }}
          onClick={() => setViewWorkFullscreenUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View attachment fullscreen"
        >
          <button
            type="button"
            onClick={() => setViewWorkFullscreenUrl(null)}
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 ring-1 ring-white/30 shadow-lg flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          {(() => {
            const u = viewWorkFullscreenUrl.toLowerCase();
            const isVideo = /\.(mp4|webm|mov|avi|mpeg|ogv)(\?|$)/i.test(u);
            return isVideo ? (
              <video
                src={viewWorkFullscreenUrl}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/15 bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={viewWorkFullscreenUrl}
                alt="Fullscreen"
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/15 bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            );
          })()}
        </div>,
        document.body
      )}

      {selectedProfessional && (
        <InviteToQuoteModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedProfessional(null);
          }}
          professional={selectedProfessional}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}
      </div>
    </div>
  );
}
