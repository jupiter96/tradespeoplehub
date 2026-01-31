import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import paypalLogo from "../assets/paypal-logo.png";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  User,
  Heart,
  ShoppingBag,
  Briefcase,
  CreditCard,
  Lock,
  Trash2,
  MessageCircle,
  HelpCircle,
  Gift,
  LogOut,
  ChevronRight,
  Settings,
  Pencil,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Wallet,
  History,
  PlusCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  Calendar,
  Phone,
  Mail,
  X,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Building2,
  Banknote,
  ArrowDownToLine,
  AlertCircle,
  Info,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Menu,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Shield,
  Facebook,
  Twitter,
  Share2,
  Copy,
  Ticket,
  Package,
  PoundSterling,
  Loader2,
  Download,
  Reply,
  ExternalLink,
  Landmark,
  Bell
} from "lucide-react";
import { Switch } from "./ui/switch";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount, ProfileUpdatePayload } from "./AccountContext";
import PaymentMethodModal from "./PaymentMethodModal";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { useSectors, useCategories } from "../hooks/useSectorsAndCategories";
import type { Sector, Category, SubCategory } from "../hooks/useSectorsAndCategories";
import { useOrders } from "./OrdersContext";
import { useMessenger } from "./MessengerContext";
import MyJobsSection from "./MyJobsSection";
import MyQuotesSection from "./MyQuotesSection";
import AvailableJobsSection from "./AvailableJobsSection";
import ProfessionalJobsSection from "./ProfessionalJobsSection";
import ProfessionalOrdersSection from "./ProfessionalOrdersSection";
import ClientOrdersSection from "./ClientOrdersSection";
import AccountVerificationSection from "./AccountVerificationSection";
import CustomOfferModal from "./CustomOfferModal";
import CustomOfferPaymentModal from "./CustomOfferPaymentModal";
import AddServiceSection from "./AddServiceSection";
import CreatePackageModal from "./CreatePackageModal";
import PromoCodeSection from "./PromoCodeSection";
import ProPromoCodeSection from "./ProPromoCodeSection";
import FavouriteSection from "./FavouriteSection";
import ProfileSection from "./ProfileSection";
import VerificationProgressModal from "./VerificationProgressModal";
import SEOHead from "./SEOHead";
import { getSocket, connectSocket } from "../services/socket";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import API_BASE_URL, { resolveApiUrl } from "../config/api";
import { resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";
import { useCountdown } from "../hooks/useCountdown";
import { validatePhoneNumber, normalizePhoneForBackend } from "../utils/phoneValidation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import AddressAutocomplete from "./AddressAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, userInfo, logout, isLoggedIn } = useAccount();
  const { contacts } = useMessenger();
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [verificationPendingCount, setVerificationPendingCount] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState<any>(null);
  const verificationModalRetryRef = useRef(0);
  const verificationModalTimeoutRef = useRef<number | null>(null);

  // Calculate total unread messages count
  const totalUnreadMessages = useMemo(() => {
    return contacts.reduce((sum, contact) => sum + (contact.unread || 0), 0);
  }, [contacts]);

  // Check for URL parameters to navigate to specific section/order
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveSection(tab);
    }
  }, [location.search]);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
  }, [isLoggedIn, navigate, userInfo, location.search]);

  // If redirected here after PRO login with incomplete verification, show a centered modal.
  // This works for both regular login (via sessionStorage flag) and social login (direct check).
  useEffect(() => {
    const isPro = userInfo?.role === "professional";
    if (!isLoggedIn || !isPro) return;

    // Check if we have a sessionStorage flag (regular login) or need to check directly (social login)
    let shouldCheck = false;
    let hasSessionFlag = false;
    try {
      hasSessionFlag = sessionStorage.getItem("showVerificationModalAfterLogin") === "1";
      shouldCheck = hasSessionFlag || true; // Always check for professional users (covers social login)
    } catch {
      shouldCheck = true; // If sessionStorage fails, still check
    }
    if (!shouldCheck) return;

    const isPassed = (s: string) => s === "verified" || s === "completed";
    const requiredTypes = ["address", "idCard", "paymentMethod", "publicLiabilityInsurance"] as const;

    const clearFlag = () => {
      try {
        sessionStorage.removeItem("showVerificationModalAfterLogin");
      } catch {
        // ignore
      }
    };

    const clearTimeoutIfAny = () => {
      if (verificationModalTimeoutRef.current) {
        window.clearTimeout(verificationModalTimeoutRef.current);
        verificationModalTimeoutRef.current = null;
      }
    };

    // Track if we've already shown the modal to avoid showing it multiple times
    const hasShownModalKey = "verificationModalShown";
    let hasShownModal = false;
    try {
      hasShownModal = sessionStorage.getItem(hasShownModalKey) === "1";
    } catch {
      // ignore
    }

    const attemptFetchAndShow = async () => {
      try {
        const res = await fetch(resolveApiUrl("/api/auth/verification"), { credentials: "include" });
        if (!res.ok) {
          // Session/cookie might not be ready right after login redirect; retry a few times.
          if (verificationModalRetryRef.current < 5) {
            verificationModalRetryRef.current += 1;
            clearTimeoutIfAny();
            verificationModalTimeoutRef.current = window.setTimeout(attemptFetchAndShow, 400);
            return;
          }
          clearFlag();
          return;
        }

        const data = await res.json();
        const v = data?.verification || {};
        setVerificationData(v);
        setVerificationModalData(v);

        const hasUnpassed = requiredTypes.some((t) => !isPassed(String(v?.[t]?.status || "not-started")));
        
        // Only show modal if there are unpassed verifications AND we haven't shown it already
        if (hasUnpassed && !hasShownModal) {
          setShowVerificationModal(true);
          // Mark that we've shown the modal to avoid showing it again on subsequent navigations
          try {
            sessionStorage.setItem(hasShownModalKey, "1");
          } catch {
            // ignore
          }
        }
        
        // Clear the session flag if it was set (regular login)
        if (hasSessionFlag) {
          clearFlag();
    }
      } catch {
        if (verificationModalRetryRef.current < 5) {
          verificationModalRetryRef.current += 1;
          clearTimeoutIfAny();
          verificationModalTimeoutRef.current = window.setTimeout(attemptFetchAndShow, 400);
          return;
        }
        clearFlag();
      }
    };

    // reset retries per navigation into this page
    verificationModalRetryRef.current = 0;
    clearTimeoutIfAny();
    attemptFetchAndShow();

    return () => {
      clearTimeoutIfAny();
    };
  }, [isLoggedIn, userInfo?.role, location.key]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Menu items for Client
  // State for unread notifications count
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  // Fetch notification unread count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(resolveApiUrl('/api/notifications/unread-count'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setNotificationUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
      }
    };

    if (isLoggedIn) {
      fetchNotificationCount();
      // Poll every 30 seconds (as fallback)
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Listen for real-time notifications via Socket.io (for menu badge)
  useEffect(() => {
    if (!isLoggedIn || !userInfo?.id) return;

    // Connect socket if not already connected
    const socket = getSocket() || connectSocket(userInfo.id);
    
    // Handler for new notification
    const handleNewNotification = (data: { notification: any; unreadCount: number }) => {
      setNotificationUnreadCount(data.unreadCount);
    };

    // Subscribe to notification events
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [isLoggedIn, userInfo?.id]);

  const clientMenu = useMemo(() => [
    { id: "overview", label: "Overview", icon: User },
    { id: "favourites", label: "Favourites", icon: Heart },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "my-jobs", label: "My Jobs", icon: FileText },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: Bell, 
      badge: notificationUnreadCount > 0 ? notificationUnreadCount.toString() : undefined 
    },
    { id: "details", label: "My Details", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
    { 
      id: "messenger", 
      label: "Messenger", 
      icon: MessageCircle, 
      badge: totalUnreadMessages > 0 ? totalUnreadMessages.toString() : undefined 
    },
    { id: "support", label: "Support Center", icon: HelpCircle },
    { id: "invite", label: "Invite & Earn", icon: Gift },
  ], [totalUnreadMessages, notificationUnreadCount]);

  // Menu items for Professional (dynamically generated to include verification badge)
  const professionalMenu = useMemo(() => [
    { id: "overview", label: "Overview", icon: User },
    { id: "profile", label: "Profile", icon: User },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "my-jobs", label: "My Jobs", icon: FileText },
    { id: "promo-code", label: "Promo Code", icon: Ticket },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: Bell, 
      badge: notificationUnreadCount > 0 ? notificationUnreadCount.toString() : undefined 
    },
    { 
      id: "verification", 
      label: "Verification", 
      icon: Shield,
      badge: verificationPendingCount > 0 ? verificationPendingCount.toString() : undefined
    },
    { id: "details", label: "My Details", icon: Settings },
    { id: "withdraw", label: "Withdraw", icon: Wallet },
    { id: "security", label: "Security", icon: Lock },
    { 
      id: "messenger", 
      label: "Messenger", 
      icon: MessageCircle, 
      badge: totalUnreadMessages > 0 ? totalUnreadMessages.toString() : undefined 
    },
    { id: "support", label: "Support Center", icon: HelpCircle },
    { id: "invite", label: "Invite & Earn", icon: Gift },
  ], [verificationPendingCount, totalUnreadMessages, notificationUnreadCount]);

  const menuItems = userRole === "client" ? clientMenu : professionalMenu;

  return (
    <>
      <SEOHead
        title="My Account"
        description="User account page"
        robots="noindex,nofollow"
      />
    <div className="min-h-screen bg-[#f0f0f0]">
      <VerificationProgressModal
        open={showVerificationModal}
        onOpenChange={(open) => setShowVerificationModal(open)}
        verification={verificationModalData || verificationData}
        onGoToVerification={() => {
          setShowVerificationModal(false);
          setActiveSection("verification");
          navigate("/account?tab=verification");
        }}
        onCancel={() => setShowVerificationModal(false)}
      />
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 mt-[50px] md:mt-0">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-[#2c353f] mb-2">
            My Account
          </h1>
          <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b]">
            {userRole === "client" 
              ? "Manage your orders and account settings"
              : "Manage your jobs and professional profile"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-24">
              {/* User Profile */}
              <div 
                className={`p-6 bg-gradient-to-br from-[#3D78CB] to-[#2c5aa0] text-white ${userRole === "professional" ? "cursor-pointer hover:from-[#4a8ddb] hover:to-[#3a6ab0] transition-all" : ""}`}
                onClick={() => {
                  if (userRole === "professional") {
                    setActiveSection("profile");
                    setIsSidebarOpen(false);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-4 border-white/20">
                    {resolveAvatarUrl(userInfo?.avatar) && (
                      <AvatarImage src={resolveAvatarUrl(userInfo?.avatar)} />
                    )}
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[20px]">
                      {(() => {
                        const name = userRole === 'professional' 
                          ? (userInfo?.tradingName || '') 
                          : (userInfo?.firstName && userInfo?.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : userInfo?.name || '');
                        if (name) {
                          const parts = name.trim().split(/\s+/);
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return parts[0][0]?.toUpperCase() || "U";
                        }
                        return "U";
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-['Poppins',sans-serif] text-[18px] mb-1">
                      {userRole === "professional"
                        ? (userInfo?.tradingName || 'Professional')
                        : (userInfo?.firstName && userInfo?.lastName
                          ? `${userInfo.firstName} ${userInfo.lastName}`
                          : userInfo?.name || 'User')}
                    </h3>
                    <Badge className="bg-white/20 text-white border-0 font-['Poppins',sans-serif] text-[11px]">
                      {userRole === "client" ? "Client" : "Professional"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-1 ${
                        isActive
                          ? "bg-[#FFF5EB] text-[#FE8A0F]"
                          : "text-[#6b6b6b] hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-['Poppins',sans-serif] text-[14px]">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <Badge className="bg-[#FE8A0F] text-white border-0 h-5 min-w-5 px-1.5 font-['Poppins',sans-serif] text-[11px]">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-0"}`} />
                    </button>
                  );
                })}

                <Separator className="my-2" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-['Poppins',sans-serif] text-[14px]">
                    Logout
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              {activeSection === "overview" && <OverviewSection userRole={userRole} />}
              {activeSection === "profile" && userRole === "professional" && <ProfileSection />}
              {activeSection === "services" && <ServicesSection />}
              {/* Favourites (Client only) */}
              {activeSection === "favourites" && userRole === "client" && <FavouriteSection />}
              {/* Client Orders */}
              {activeSection === "orders" && userRole === "client" && <ClientOrdersSection />}
              {/* Professional Orders */}
              {activeSection === "orders" && userRole === "professional" && <ProfessionalOrdersSection />}
              {activeSection === "jobs" && <JobsSection />}
              {/* Client My Jobs */}
              {activeSection === "my-jobs" && userRole === "client" && <MyJobsSection />}
              {/* Professional My Jobs (with tabs) */}
              {activeSection === "my-jobs" && userRole === "professional" && <ProfessionalJobsSection />}
              {/* Promo Code (Professional only) */}
              {activeSection === "promo-code" && userRole === "professional" && <ProPromoCodeSection />}
              {activeSection === "verification" && (
                <AccountVerificationSection 
                  onVerificationStatusChange={() => {
                    // Refresh verification status when status changes
                    if (userRole === "professional" && isLoggedIn) {
                      fetch(resolveApiUrl("/api/auth/verification"), {
                        credentials: "include",
                      })
                        .then(res => res.json())
                        .then(data => {
                          setVerificationData(data.verification);
                          let pendingCount = 0;
                          const documentTypes = ['address', 'idCard', 'publicLiabilityInsurance'];
                          documentTypes.forEach(type => {
                            const doc = data.verification?.[type];
                            if (doc && doc.status === 'pending' && doc.documentUrl) {
                              pendingCount++;
                            }
                          });
                          setVerificationPendingCount(pendingCount);
                        })
                        .catch(() => {});
                    }
                  }}
                />
              )}
              {activeSection === "details" && <DetailsSection />}
              {activeSection === "billing" && <BillingSection />}
              {activeSection === "withdraw" && <WithdrawSection />}
              {activeSection === "security" && <SecuritySection />}
              {activeSection === "notifications" && <NotificationsSection onUnreadCountChange={setNotificationUnreadCount} />}
              {activeSection === "messenger" && <MessengerSection />}
              {activeSection === "support" && <SupportSection />}
              {activeSection === "invite" && <InviteSection />}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}

// Overview Section
function OverviewSection({ userRole }: { userRole: "client" | "professional" | null }) {
  // Mock data for charts
  const monthlyExpenses = [
    { month: "Jun", amount: 450 },
    { month: "Jul", amount: 680 },
    { month: "Aug", amount: 520 },
    { month: "Sep", amount: 890 },
    { month: "Oct", amount: 750 },
    { month: "Nov", amount: 1240 },
  ];

  const monthlyOrders = [
    { month: "Jun", orders: 2 },
    { month: "Jul", orders: 3 },
    { month: "Aug", orders: 2 },
    { month: "Sep", orders: 4 },
    { month: "Oct", orders: 3 },
    { month: "Nov", orders: 5 },
  ];

  const categorySpending = [
    { name: "Plumbing", value: 1250, color: "#FE8A0F" },
    { name: "Electrical", value: 980, color: "#3D78CB" },
    { name: "Painting", value: 750, color: "#22c55e" },
    { name: "Carpentry", value: 620, color: "#f59e0b" },
    { name: "Other", value: 930, color: "#8b5cf6" },
  ];

  if (userRole === "client") {
    return (
      <div>
        <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
          Account Overview
        </h2>
        
        {/* Welcome Message */}
        <div className="bg-[#FFF5EB] border border-[#FE8A0F]/30 rounded-xl p-6 mb-8">
          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
            Welcome Back! 👋
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Your account is active and ready to place orders. Browse our professionals and get started!
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-4 md:p-6 rounded-xl border border-[#FE8A0F]/20 relative overflow-hidden min-w-[260px] md:min-w-0 flex-shrink-0">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-[#FE8A0F]/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
            <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-[#FE8A0F] mb-2 md:mb-3" />
            <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">19</h3>
            <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">Total Orders</p>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">+15% this month</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#E8F4FD] to-white p-4 md:p-6 rounded-xl border border-[#3D78CB]/20 relative overflow-hidden min-w-[260px] md:min-w-0 flex-shrink-0">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-[#3D78CB]/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-[#3D78CB] mb-2 md:mb-3" />
            <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">£4,530</h3>
            <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">Total Expense</p>
            <div className="flex items-center gap-1 text-[#3D78CB]">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">+8% from last month</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#F0FDF4] to-white p-4 md:p-6 rounded-xl border border-green-200 relative overflow-hidden min-w-[260px] md:min-w-0 flex-shrink-0">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-green-500/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-green-600 mb-2 md:mb-3" />
            <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">£2,450</h3>
            <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">My Balance</p>
            <div className="flex items-center gap-1 text-green-600">
              <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">Available to spend</span>
            </div>
          </div>
        </div>

        {/* Charts - Horizontal Slider on Mobile */}
        <div className="flex lg:grid lg:grid-cols-2 gap-6 mb-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 pb-4 lg:pb-0">
          {/* Monthly Expenses Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 min-w-[85vw] lg:min-w-0 snap-center flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
                  Monthly Expenses
                </h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                  Last 6 months spending trend
                </p>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                <span className="font-['Poppins',sans-serif] text-[12px]">+22%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#8d8d8d"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
                />
                <YAxis 
                  stroke="#8d8d8d"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    fontFamily: "Poppins, sans-serif",
                    borderRadius: "12px",
                    border: "1px solid #e5e5e5"
                  }}
                  formatter={(value) => [`£${value}`, "Expense"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3D78CB" 
                  strokeWidth={3}
                  dot={{ fill: "#3D78CB", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Orders Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 min-w-[85vw] lg:min-w-0 snap-center flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
                  Monthly Orders
                </h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                  Number of orders per month
                </p>
              </div>
              <div className="flex items-center gap-1 text-[#FE8A0F] bg-[#FFF5EB] px-3 py-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                <span className="font-['Poppins',sans-serif] text-[12px]">+67%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#8d8d8d"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
                />
                <YAxis 
                  stroke="#8d8d8d"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: "Poppins, sans-serif",
                    borderRadius: "12px",
                    border: "1px solid #e5e5e5"
                  }}
                  formatter={(value) => [`${value}`, "Orders"]}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#FE8A0F" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Spending Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 min-w-[85vw] lg:min-w-0 lg:col-span-2 snap-center flex-shrink-0">
            <div className="mb-4 lg:mb-6">
              <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
                Spending by Category
              </h3>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                Total: £4,530 across all categories
              </p>
            </div>
            <div className="flex lg:grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
              <div className="w-[45%] lg:w-full flex-shrink-0">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        fontFamily: "Poppins, sans-serif",
                        borderRadius: "12px",
                        border: "1px solid #e5e5e5"
                      }}
                      formatter={(value) => [`£${value}`, "Spent"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="hidden lg:block w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        fontFamily: "Poppins, sans-serif",
                        borderRadius: "12px",
                        border: "1px solid #e5e5e5"
                      }}
                      formatter={(value) => [`£${value}`, "Spent"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5 lg:gap-2 flex-1 lg:hidden">
                {categorySpending.map((category, index) => (
                  <div key={index} className="flex flex-col p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-['Poppins',sans-serif] text-[10px] text-[#2c353f] truncate">
                        {category.name}
                      </span>
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-medium">
                      £{category.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="hidden lg:grid grid-cols-2 gap-2 w-full">
                {categorySpending.map((category, index) => (
                  <div key={index} className="flex flex-col p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] truncate">
                        {category.name}
                      </span>
                    </div>
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                      £{category.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Professional overview with enhanced stats and charts
  const monthlyEarnings = [
    { month: "Jun", amount: 2850 },
    { month: "Jul", amount: 3200 },
    { month: "Aug", amount: 2950 },
    { month: "Sep", amount: 4100 },
    { month: "Oct", amount: 3800 },
    { month: "Nov", amount: 5250 },
  ];

  const monthlyJobs = [
    { month: "Jun", jobs: 8 },
    { month: "Jul", jobs: 10 },
    { month: "Aug", jobs: 9 },
    { month: "Sep", jobs: 13 },
    { month: "Oct", jobs: 12 },
    { month: "Nov", jobs: 16 },
  ];

  const categoryEarnings = [
    { name: "Emergency Repairs", value: 8500, color: "#FE8A0F" },
    { name: "Installations", value: 6200, color: "#3B82F6" },
    { name: "Maintenance", value: 4800, color: "#22c55e" },
    { name: "Consultations", value: 2100, color: "#f59e0b" },
    { name: "Other", value: 650, color: "#8b5cf6" },
  ];

  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Account Overview
      </h2>
      
      {/* Welcome Message - Hidden on mobile (shown in Nav sidebar) */}
      <div className="hidden md:block bg-gradient-to-r from-[#EFF6FF] to-[#FFF5EB] border border-[#3B82F6]/30 rounded-xl p-6 mb-8">
        <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-2">
          Welcome Back! 👋
        </h3>
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
          Your profile is active and visible to potential clients. Keep up the great work and maintain your high ratings!
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="flex lg:grid lg:grid-cols-4 gap-3 md:gap-4 mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-4 md:p-6 rounded-xl border border-[#FE8A0F]/20 relative overflow-hidden min-w-[240px] lg:min-w-0 flex-shrink-0">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-[#FE8A0F]/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
          <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-[#FE8A0F] mb-2 md:mb-3" />
          <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">12</h3>
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">Active Jobs</p>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">+3 this week</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#EFF6FF] to-white p-4 md:p-6 rounded-xl border border-[#3B82F6]/20 relative overflow-hidden min-w-[240px] lg:min-w-0 flex-shrink-0">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-[#3B82F6]/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
          <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-[#3B82F6] mb-2 md:mb-3" />
          <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">68</h3>
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">Completed Jobs</p>
          <div className="flex items-center gap-1 text-[#3B82F6]">
            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">+16 this month</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#F0FDF4] to-white p-4 md:p-6 rounded-xl border border-green-200 relative overflow-hidden min-w-[240px] lg:min-w-0 flex-shrink-0">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-green-500/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
          <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600 mb-2 md:mb-3" />
          <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">£22,250</h3>
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">Total Earnings</p>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">+18% from last month</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#FEF3C7] to-white p-4 md:p-6 rounded-xl border border-amber-200 relative overflow-hidden min-w-[240px] lg:min-w-0 flex-shrink-0">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-amber-500/10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-amber-600 mb-2 md:mb-3" />
          <h3 className="font-['Poppins',sans-serif] text-[26px] md:text-[32px] text-[#2c353f] mb-1">£5,250</h3>
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-[#6b6b6b] mb-1 md:mb-2">Available Balance</p>
          <div className="flex items-center gap-1 text-amber-600">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-['Poppins',sans-serif] text-[11px] md:text-[12px]">Ready to withdraw</span>
          </div>
        </div>
      </div>

      {/* Charts Section - Horizontal Slider on Mobile */}
      <div className="flex lg:grid lg:grid-cols-2 gap-6 mb-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 pb-4 lg:pb-0">
        {/* Monthly Earnings Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 min-w-[85vw] lg:min-w-0 snap-center flex-shrink-0">
          <div className="mb-6">
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
              Monthly Earnings
            </h3>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
              Last 6 months earnings trend
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#8d8d8d"
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
              />
              <YAxis 
                stroke="#8d8d8d"
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontFamily: "Poppins, sans-serif",
                  borderRadius: "12px",
                  border: "1px solid #e5e5e5"
                }}
                formatter={(value) => [`£${value}`, "Earnings"]}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: "#22c55e", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Jobs Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 min-w-[85vw] lg:min-w-0 snap-center flex-shrink-0">
          <div className="mb-6">
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
              Monthly Jobs Completed
            </h3>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
              Jobs completed in the last 6 months
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyJobs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#8d8d8d"
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
              />
              <YAxis 
                stroke="#8d8d8d"
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontFamily: "Poppins, sans-serif",
                  borderRadius: "12px",
                  border: "1px solid #e5e5e5"
                }}
                formatter={(value) => [`${value}`, "Jobs"]}
              />
              <Bar 
                dataKey="jobs" 
                fill="#3B82F6" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Earnings Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 min-w-[85vw] lg:min-w-0 lg:col-span-2 snap-center flex-shrink-0">
          <div className="mb-4 lg:mb-6">
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
              Earnings by Service Category
            </h3>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
              Total: £22,250 across all categories
            </p>
          </div>
          <div className="flex lg:grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
            <div className="w-[45%] lg:w-full flex-shrink-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryEarnings}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryEarnings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontFamily: "Poppins, sans-serif",
                      borderRadius: "12px",
                      border: "1px solid #e5e5e5"
                    }}
                    formatter={(value) => [`£${value}`, "Earned"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="hidden lg:block w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryEarnings}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryEarnings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontFamily: "Poppins, sans-serif",
                      borderRadius: "12px",
                      border: "1px solid #e5e5e5"
                    }}
                    formatter={(value) => [`£${value}`, "Earned"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 lg:gap-2 flex-1 lg:hidden">
              {categoryEarnings.map((category, index) => (
                <div key={index} className="flex flex-col p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-['Poppins',sans-serif] text-[10px] text-[#2c353f] truncate">
                      {category.name}
                    </span>
                  </div>
                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-medium">
                    £{category.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="hidden lg:grid grid-cols-2 gap-2 w-full">
              {categoryEarnings.map((category, index) => (
                <div key={index} className="flex flex-col p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] truncate">
                      {category.name}
                    </span>
                  </div>
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium">
                    £{category.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// DUPLICATE CODE REMOVED - The actual implementation starts below

// Jobs Section (Professional)
function JobsSection() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const jobs = ([
    { 
      id: "JOB-101", 
      title: "Kitchen Renovation", 
      client: "Sarah Johnson",
      clientAvatar: undefined,
      clientPhone: "+44 7234 567890",
      clientEmail: "sarah.johnson@gmail.com",
      date: "2024-11-08",
      status: "In Progress", 
      amount: "£2,500",
      amountValue: 2500,
      address: "45 Oak Street, Manchester, M1 2AB",
      description: "Complete kitchen renovation including new cabinets, countertops, and appliances installation.",
      scheduledDate: "November 8-15, 2024",
      category: "Renovation"
    },
    { 
      id: "JOB-102", 
      title: "Bathroom Plumbing", 
      client: "Mike Brown",
      clientAvatar: undefined,
      clientPhone: "+44 7345 678901",
      clientEmail: "mike.brown@gmail.com",
      date: "2024-11-09", 
      status: "In Progress", 
      amount: "£850",
      amountValue: 850,
      address: "78 Park Lane, London, SW1A 2AA",
      description: "Fix leaking pipes, install new shower fixture, and repair bathroom sink.",
      scheduledDate: "November 9-10, 2024",
      category: "Plumbing"
    },
    { 
      id: "JOB-103", 
      title: "Garden Landscaping", 
      client: "Emma Wilson",
      clientAvatar: undefined,
      clientPhone: "+44 7456 789012",
      clientEmail: "emma.wilson@gmail.com",
      date: "2024-11-10", 
      status: "New", 
      amount: "£1,200",
      amountValue: 1200,
      address: "23 Garden Road, Birmingham, B2 4BJ",
      description: "Design and implement new garden layout with flower beds, lawn care, and pathway installation.",
      scheduledDate: "November 15-20, 2024",
      category: "Landscaping"
    },
    { 
      id: "JOB-104", 
      title: "Roof Repair", 
      client: "David Lee",
      clientAvatar: undefined,
      clientPhone: "+44 7567 890123",
      clientEmail: "david.lee@gmail.com",
      date: "2024-11-10", 
      status: "New", 
      amount: "£3,000",
      amountValue: 3000,
      address: "156 High Street, Edinburgh, EH1 1QS",
      description: "Emergency roof repair after storm damage. Replace damaged tiles and check for leaks.",
      scheduledDate: "November 11-12, 2024",
      category: "Roofing"
    },
    { 
      id: "JOB-098", 
      title: "Office Painting", 
      client: "ABC Company",
      clientAvatar: undefined,
      clientPhone: "+44 7678 901234",
      clientEmail: "contact@abccompany.com",
      date: "2024-11-01", 
      status: "Completed", 
      amount: "£1,800",
      amountValue: 1800,
      address: "89 Business Park, Leeds, LS1 4AP",
      description: "Paint entire office space including walls, ceilings, and trim work.",
      completedDate: "November 1, 2024",
      category: "Painting"
    },
    { 
      id: "JOB-099", 
      title: "Electrical Rewiring", 
      client: "John Smith",
      clientAvatar: undefined,
      clientPhone: "+44 7789 012345",
      clientEmail: "john.smith@gmail.com",
      date: "2024-11-03", 
      status: "Completed", 
      amount: "£950",
      amountValue: 950,
      address: "34 Electric Avenue, Bristol, BS1 6QA",
      description: "Rewire old electrical system and install new circuit breakers for safety.",
      completedDate: "November 3, 2024",
      category: "Electrical"
    },
    { 
      id: "JOB-097", 
      title: "Heating System Installation", 
      client: "Mary Thompson",
      clientAvatar: undefined,
      clientPhone: "+44 7890 123456",
      clientEmail: "mary.thompson@gmail.com",
      date: "2024-10-30", 
      status: "Completed", 
      amount: "£4,200",
      amountValue: 4200,
      address: "67 Winter Road, Glasgow, G1 1RD",
      description: "Install new central heating system with modern thermostat controls.",
      completedDate: "October 30, 2024",
      category: "HVAC"
    },
    { 
      id: "JOB-096", 
      title: "Fence Installation", 
      client: "Robert Davis",
      clientAvatar: undefined,
      clientPhone: "+44 7901 234567",
      clientEmail: "robert.davis@gmail.com",
      date: "2024-11-07", 
      status: "In Progress", 
      amount: "£1,650",
      amountValue: 1650,
      address: "91 Boundary Lane, Liverpool, L1 8JQ",
      description: "Install wooden fence around backyard perimeter for privacy.",
      scheduledDate: "November 7-9, 2024",
      category: "Carpentry"
    },
    { 
      id: "JOB-095", 
      title: "Emergency Repair", 
      client: "Jane Doe",
      clientAvatar: undefined,
      clientPhone: "+44 7012 345678",
      clientEmail: "jane.doe@gmail.com",
      date: "2024-10-28", 
      status: "Rejected", 
      amount: "£400",
      amountValue: 400,
      address: "12 Quick Street, Cardiff, CF10 1BH",
      description: "Emergency plumbing repair - timing conflict.",
      rejectedReason: "Schedule conflict - unable to accommodate emergency timing",
      category: "Emergency"
    },
    { 
      id: "JOB-105", 
      title: "Carpet Installation", 
      client: "Lisa Anderson",
      clientAvatar: undefined,
      clientPhone: "+44 7123 456780",
      clientEmail: "lisa.anderson@gmail.com",
      date: "2024-11-12", 
      status: "New", 
      amount: "£890",
      amountValue: 890,
      address: "55 Comfort Avenue, Nottingham, NG1 6AA",
      description: "Install new carpet in living room and bedrooms.",
      scheduledDate: "November 16-17, 2024",
      category: "Flooring"
    },
  ]).map((job) => ({
    ...job,
    clientAvatar: undefined,
  }));

  // Filter and search logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort logic
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortField) {
      case "id":
        aVal = a.id;
        bVal = b.id;
        break;
      case "title":
        aVal = a.title;
        bVal = b.title;
        break;
      case "client":
        aVal = a.client;
        bVal = b.client;
        break;
      case "date":
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "amount":
        aVal = a.amountValue;
        bVal = b.amountValue;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        My Jobs
      </h2>

      {/* Search and Filter Bar */}
      <div className="bg-gradient-to-r from-[#EFF6FF] to-[#FFF5EB] border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8d8d8d]" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#FE8A0F]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif] text-[14px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="New">New Jobs</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-white to-[#FFF5EB] border border-[#FE8A0F]/30 rounded-lg p-4">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Total Jobs</p>
            <p className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">{jobs.length}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">In Progress</p>
            <p className="font-['Poppins',sans-serif] text-[24px] text-blue-600">
              {jobs.filter(j => j.status === "In Progress").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">New Jobs</p>
            <p className="font-['Poppins',sans-serif] text-[24px] text-orange-600">
              {jobs.filter(j => j.status === "New").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white to-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Completed</p>
            <p className="font-['Poppins',sans-serif] text-[24px] text-green-600">
              {jobs.filter(j => j.status === "Completed").length}
            </p>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead 
                className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-2">
                  Job ID
                  <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                </div>
              </TableHead>
              <TableHead 
                className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-2">
                  Job Title
                  <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                </div>
              </TableHead>
              <TableHead 
                className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("client")}
              >
                <div className="flex items-center gap-2">
                  Client
                  <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                </div>
              </TableHead>
              <TableHead 
                className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-2">
                  Date
                  <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                </div>
              </TableHead>
              <TableHead 
                className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                </div>
              </TableHead>
              <TableHead 
                className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center gap-2">
                  Amount
                  <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                </div>
              </TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Briefcase className="w-12 h-12 text-gray-300" />
                    <p className="font-['Poppins',sans-serif] text-[16px] text-[#6b6b6b]">
                      No jobs found
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d]">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedJobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className="hover:bg-[#FFF5EB]/30 transition-colors cursor-pointer"
                >
                  <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB]">
                    {job.id}
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                    {job.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 border border-gray-200">
                        {resolveAvatarUrl(job.clientAvatar) && (
                          <AvatarImage src={resolveAvatarUrl(job.clientAvatar)} alt={job.client} />
                        )}
                        <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif] text-[12px]">
                          {getTwoLetterInitials(job.client, "C")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {job.client}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                    {new Date(job.date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge className={`
                      font-['Poppins',sans-serif] text-[12px]
                      ${job.status === "Completed" ? "bg-green-100 text-green-700 border-green-200" : ""}
                      ${job.status === "In Progress" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                      ${job.status === "New" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                      ${job.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" : ""}
                    `}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-['Poppins',sans-serif] text-[15px] text-[#FE8A0F]">
                    {job.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#3B82F6] hover:bg-[#EFF6FF] font-['Poppins',sans-serif]"
                      onClick={() => setSelectedJob(job)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Job Details Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
                      {selectedJob.title}
                    </DialogTitle>
                    <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      Job ID: {selectedJob.id}
                    </DialogDescription>
                  </div>
                  <Badge className={`
                    font-['Poppins',sans-serif] text-[12px]
                    ${selectedJob.status === "Completed" ? "bg-green-100 text-green-700 border-green-200" : ""}
                    ${selectedJob.status === "In Progress" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                    ${selectedJob.status === "New" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                    ${selectedJob.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" : ""}
                  `}>
                    {selectedJob.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Amount Card */}
                <div className="bg-gradient-to-br from-[#FFF5EB] to-white border border-[#FE8A0F]/30 rounded-xl p-6">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">Job Value</p>
                  <h3 className="font-['Poppins',sans-serif] text-[36px] text-[#FE8A0F]">
                    {selectedJob.amount}
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mt-2">
                    Category: {selectedJob.category}
                  </p>
                </div>

                {/* Client Info */}
                <div className="bg-gradient-to-br from-[#EFF6FF] to-white border border-[#3B82F6]/20 rounded-xl p-6">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#3B82F6]" />
                    Client Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-[#3B82F6]/20">
                        {resolveAvatarUrl(selectedJob.clientAvatar) && (
                          <AvatarImage src={resolveAvatarUrl(selectedJob.clientAvatar)} alt={selectedJob.client} />
                        )}
                        <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif]">
                          {getTwoLetterInitials(selectedJob.client, "C")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                          {selectedJob.client}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-[#6b6b6b]">
                      <Phone className="w-4 h-4" />
                      <span className="font-['Poppins',sans-serif] text-[14px]">
                        {selectedJob.clientPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6b6b6b]">
                      <Mail className="w-4 h-4" />
                      <span className="font-['Poppins',sans-serif] text-[14px]">
                        {selectedJob.clientEmail}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div>
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                    Job Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-[#FE8A0F] mt-0.5" />
                      <div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">Description</p>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {selectedJob.description}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#FE8A0F] mt-0.5" />
                      <div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">Job Address</p>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {selectedJob.address}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-[#FE8A0F] mt-0.5" />
                      <div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                          {selectedJob.status === "Completed" ? "Completed Date" : "Scheduled Date"}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {selectedJob.completedDate || selectedJob.scheduledDate}
                        </p>
                      </div>
                    </div>
                    {selectedJob.status === "Rejected" && selectedJob.rejectedReason && (
                      <>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">Rejection Reason</p>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-red-600">
                              {selectedJob.rejectedReason}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {selectedJob.status === "New" && (
                    <>
                      <Button className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Job
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-500 text-red-500 hover:bg-red-50 font-['Poppins',sans-serif]">
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                  {selectedJob.status === "In Progress" && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-['Poppins',sans-serif]">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                  {selectedJob.status !== "Rejected" && (
                    <Button variant="outline" className="flex-1 border-[#3B82F6] text-[#3B82F6] hover:bg-[#EFF6FF] font-['Poppins',sans-serif]">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Client
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Details Section
function DetailsSection() {
  const { userInfo, userRole, updateProfile, requestEmailChangeOTP, requestPhoneChangeOTP, resendEmailChangeOTP, resendPhoneChangeOTP, verifyOTP, uploadAvatar, removeAvatar } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  
  // Load sectors from API
  const { sectors: sectorsData, loading: sectorsLoading } = useSectors();
  
  // Find selected sector object
  const selectedSectorObj = sectorsData.find((s: Sector) => s.name === userInfo?.sector);
  const selectedSectorId = selectedSectorObj?._id;
  
  // Load categories for selected sector (with subcategories)
  const { categories: availableCategories, loading: categoriesLoading } = useCategories(
    selectedSectorId,
    undefined,
    true // includeSubCategories
  );

  const initialFormState = useMemo(
    () => {
      // Extract categories and subcategories from services
      // Note: We'll match with loaded categories/subcategories dynamically
      const services = userInfo?.services || [];
      // Initialize as empty - will be populated when categories are loaded
      const categories: string[] = [];
      const subcategories: string[] = [];
      
      // Format insurance expiry date for input
      let insuranceExpiryDateFormatted = "";
      if (userInfo?.insuranceExpiryDate) {
        const date = new Date(userInfo.insuranceExpiryDate);
        insuranceExpiryDateFormatted = date.toISOString().split('T')[0];
      }
      
      return {
        firstName: userInfo?.firstName || "",
        lastName: userInfo?.lastName || "",
      email: userInfo?.email || "",
      phone: userInfo?.phone || "",
      tradingName: userInfo?.tradingName || "",
      address: userInfo?.address || "",
      townCity: userInfo?.townCity || "",
        county: userInfo?.county || "",
      postcode: userInfo?.postcode || "",
        travelDistance: userInfo?.travelDistance || "",
        sector: userInfo?.sector || "",
        categories: categories || [],
        subcategories: subcategories || [],
      aboutService: userInfo?.aboutService || "",
      hasTradeQualification: userInfo?.hasTradeQualification || "no",
      hasPublicLiability: userInfo?.hasPublicLiability || "no",
        professionalIndemnityAmount: userInfo?.professionalIndemnityAmount?.toString() || "",
        insuranceExpiryDate: insuranceExpiryDateFormatted,
      };
    },
    [userInfo]
  );

  const buildFormState = useCallback(
    (state: typeof initialFormState) => ({
      ...state,
      categories: [...(state.categories || [])],
      subcategories: [...(state.subcategories || [])],
    }),
    []
  );

  const [formData, setFormData] = useState(() => buildFormState(initialFormState));
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get all subcategories from selected categories (calculated after formData is defined)
  // formData.categories now stores category IDs
  const allSubcategories: SubCategory[] = useMemo(() => {
    const subcats: SubCategory[] = [];
    availableCategories.forEach((cat: Category) => {
      if (formData.categories.includes(cat._id) && cat.subCategories) {
        subcats.push(...cat.subCategories);
      }
    });
    // Sort subcategories by order
    return subcats.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [availableCategories, formData.categories]);
  
  // OTP verification states
  const [emailChanged, setEmailChanged] = useState(false);
  const [phoneChanged, setPhoneChanged] = useState(false);
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [phoneOTPSent, setPhoneOTPSent] = useState(false);
  const [emailOTPVerified, setEmailOTPVerified] = useState(false);
  const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
  const [emailOTPCode, setEmailOTPCode] = useState("");
  const [phoneOTPCode, setPhoneOTPCode] = useState("");
  const [emailOTPHint, setEmailOTPHint] = useState<string | null>(null);
  const [phoneOTPHint, setPhoneOTPHint] = useState<string | null>(null);
  const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
  const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
  const [isVerifyingEmailOTP, setIsVerifyingEmailOTP] = useState(false);
  const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
  const [isResendingEmailOTP, setIsResendingEmailOTP] = useState(false);
  const [isResendingPhoneOTP, setIsResendingPhoneOTP] = useState(false);

  // Load user's existing services when categories are loaded
  // Support both ID-based (new) and name-based (legacy) storage
  const [hasLoadedUserServices, setHasLoadedUserServices] = useState(false);
  useEffect(() => {
    if (userInfo?.services && userInfo.services.length > 0 && availableCategories.length > 0 && userInfo?.sector && !hasLoadedUserServices) {
      // Get category and subcategory IDs and names for matching
      const categoryIds = availableCategories.map((cat: Category) => cat._id);
      const categoryNames = availableCategories.map((cat: Category) => cat.name);
      const subcategoryIds: string[] = [];
      const subcategoryNames: string[] = [];
      availableCategories.forEach((cat: Category) => {
        if (cat.subCategories) {
          subcategoryIds.push(...cat.subCategories.map((sc: SubCategory) => sc._id));
          subcategoryNames.push(...cat.subCategories.map((sc: SubCategory) => sc.name));
        }
      });
      
      // Try to match by ID first (new format)
      const userCategoryIds = userInfo.services.filter((s: string) => categoryIds.includes(s));
      const userSubcategoryIds = userInfo.services.filter((s: string) => subcategoryIds.includes(s));
      
      // If no IDs found, try matching by name (legacy support)
      const userCategoryNames = userInfo.services.filter((s: string) => categoryNames.includes(s));
      const userSubcategoryNames = userInfo.services.filter((s: string) => subcategoryNames.includes(s));
      
      // Convert names to IDs if found
      const categoryIdsFromNames = userCategoryNames.map((name: string) => {
        const cat = availableCategories.find((c: Category) => c.name === name);
        return cat?._id;
      }).filter(Boolean) as string[];
      
      const subcategoryIdsFromNames = userSubcategoryNames.map((name: string) => {
        for (const cat of availableCategories) {
          if (cat.subCategories) {
            const subcat = cat.subCategories.find((sc: SubCategory) => sc.name === name);
            if (subcat) return subcat._id;
          }
        }
        return null;
      }).filter(Boolean) as string[];
      
      const finalCategoryIds = userCategoryIds.length > 0 ? userCategoryIds : categoryIdsFromNames;
      const finalSubcategoryIds = userSubcategoryIds.length > 0 ? userSubcategoryIds : subcategoryIdsFromNames;
      
      if (finalCategoryIds.length > 0 || finalSubcategoryIds.length > 0) {
        setFormData(prev => ({
          ...prev,
          categories: finalCategoryIds.length > 0 ? finalCategoryIds : prev.categories,
          subcategories: finalSubcategoryIds.length > 0 ? finalSubcategoryIds : prev.subcategories,
        }));
        setHasLoadedUserServices(true);
      }
    }
  }, [userInfo?.services, availableCategories, userInfo?.sector, hasLoadedUserServices]);
  
  // Reset hasLoadedUserServices when sector changes
  useEffect(() => {
    setHasLoadedUserServices(false);
  }, [userInfo?.sector]);
  
  // Update formData when userInfo changes (especially when townCity/county are loaded)
  useEffect(() => {
    if (userInfo) {
      // console.log('[AccountPage] userInfo updated, updating formData:', {
      //   townCity: userInfo.townCity,
      //   county: userInfo.county,
      //   address: userInfo.address,
      //   postcode: userInfo.postcode,
      // });
    setFormData(buildFormState(initialFormState));
    }
  }, [userInfo, buildFormState, initialFormState]);

  // NOTE: Do not use hardcoded sector/category lists here.
  // Categories and subcategories must come from the database via /api/categories and /api/subcategories.

  const handleSaveChanges = async () => {
    if (!userInfo) {
      return;
    }

    // First name, last name, email, and phone are read-only after registration
    if (!formData.postcode) {
      toast.error("Please complete the required fields.");
      return;
    }
    setIsSaving(true);

    const payload: ProfileUpdatePayload = {
      // firstName, lastName, email, and phone are not allowed to be updated after registration
      postcode: formData.postcode.trim(),
      address: formData.address.trim() || undefined,
      townCity: formData.townCity.trim() || undefined,
      ...(formData.county && { county: formData.county.trim() }),
    };

    if (userRole === "professional") {
      payload.tradingName = formData.tradingName.trim() || undefined;
      payload.travelDistance = formData.travelDistance || undefined;
      
      // Sector cannot be changed after registration - it's read-only
      // Do not send sector in payload if it already exists
      
      // Combine categories and subcategories into services array
      const allServices = [...formData.categories, ...formData.subcategories];
      payload.services = allServices;
      
      payload.aboutService = formData.aboutService.trim() || undefined;
      payload.hasTradeQualification =
        (formData.hasTradeQualification as "yes" | "no") || "no";
      payload.hasPublicLiability =
        (formData.hasPublicLiability as "yes" | "no") || "no";
      
      // Insurance details
      if (formData.hasPublicLiability === "yes") {
        // If blank, store as 0 (requested default)
        payload.professionalIndemnityAmount = formData.professionalIndemnityAmount
          ? parseFloat(formData.professionalIndemnityAmount) || 0
          : 0;
        if (formData.insuranceExpiryDate) {
          payload.insuranceExpiryDate = new Date(formData.insuranceExpiryDate).toISOString();
        }
      } else {
        payload.professionalIndemnityAmount = undefined;
        payload.insuranceExpiryDate = undefined;
      }
    }

    try {
      await updateProfile(payload);
      setIsEditing(false);
      // Reset OTP states after successful save
      setEmailChanged(false);
      setPhoneChanged(false);
      setEmailOTPSent(false);
      setPhoneOTPSent(false);
      setEmailOTPVerified(false);
      setPhoneOTPVerified(false);
      setEmailOTPCode("");
      setPhoneOTPCode("");
      setEmailOTPHint(null);
      setPhoneOTPHint(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to save changes";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setAvatarError(null);

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Unsupported file type. Please upload JPG, PNG, GIF, or WEBP image.");
      event.target.value = "";
      return;
    }

    // Validate file size (5MB for Cloudinary)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      // Clear preview after successful upload - Cloudinary URL will be in userInfo
      setTimeout(() => {
        setAvatarPreview(null);
      }, 500);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to upload photo");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userInfo?.avatar) {
      return;
    }

    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      await removeAvatar();
      setAvatarPreview(null);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to remove photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    // This function is kept for backward compatibility but may not be used
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
            My Details
          </h2>
          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
            Update your personal information and profile picture
          </p>
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="mb-6 md:mb-8 p-4 sm:p-6 bg-gradient-to-br from-[#EFF6FF] to-white border border-[#3B82F6]/20 rounded-xl">
        <h3 className="font-['Poppins',sans-serif] text-[15px] sm:text-[16px] text-[#2c353f] mb-4">
          Profile Picture
        </h3>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-[#3B82F6]/20 flex-shrink-0 shadow-lg">
            <AvatarImage 
              src={avatarPreview || userInfo?.avatar || undefined} 
              alt={userInfo?.name || 'User avatar'}
              className="object-cover"
            />
            <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif] text-[28px] sm:text-[32px]">
              {getTwoLetterInitials(userInfo?.name, "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] w-full sm:w-auto disabled:opacity-70 transition-colors"
            >
              {isUploadingAvatar ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Uploading...
                </span>
              ) : (
                "Upload New Photo"
              )}
            </Button>
            {userInfo?.avatar && (
            <Button
              type="button"
              variant="outline"
                disabled={isUploadingAvatar}
              onClick={handleRemoveAvatar}
                className="text-[#3B82F6] hover:bg-[#EFF6FF] border-[#3B82F6] font-['Poppins',sans-serif] w-full sm:w-auto disabled:opacity-60 transition-colors"
            >
              Remove Photo
            </Button>
            )}
            <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[12px] text-[#8d8d8d] mt-1 text-center sm:text-left">
              JPG, PNG, GIF, or WEBP. Max size 5MB
            </p>
            {avatarError && (
              <p className="text-[12px] text-red-600 text-center sm:text-left font-['Poppins',sans-serif] mt-1">
                {avatarError}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-4 md:mb-6" />

      {/* Personal Information */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="font-['Poppins',sans-serif] text-[15px] sm:text-[16px] text-[#2c353f]">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={formData.firstName}
              disabled
              readOnly
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={formData.lastName}
              disabled
              readOnly
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Email Address
            </Label>
            <Input
              type="email"
              value={formData.email}
              disabled
              readOnly
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Phone Number
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              disabled
              readOnly
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] bg-gray-50 cursor-not-allowed"
            />
          </div>
          {userRole === "professional" && (
            <>
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                  Trading Name
                </Label>
                <Input
                  type="text"
                  value={formData.tradingName}
                  onChange={(e) => setFormData({...formData, tradingName: e.target.value})}
                  className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6]"
                />
              </div>
            </>
          )}
          <div className={userRole === "professional" ? "md:col-span-2" : ""}>
            <AddressAutocomplete
              postcode={formData.postcode}
              onPostcodeChange={(value) => setFormData({...formData, postcode: value})}
              address={formData.address}
              onAddressChange={(value) => setFormData({...formData, address: value})}
              townCity={formData.townCity}
              onTownCityChange={(value) => setFormData({...formData, townCity: value})}
              county={formData.county}
              onCountyChange={(value) => setFormData({...formData, county: value})}
              onAddressSelect={(address) => {
                setFormData({
                  ...formData,
                  postcode: address.postcode || "",
                  address: address.address || "",
                  townCity: address.townCity || "",
                  county: address.county || "",
                });
              }}
              label="Postcode"
              required
              showAddressField={true}
              showTownCityField={true}
              showCountyField={true}
              addressLabel="Address"
              className="font-['Poppins',sans-serif]"
            />
          </div>
          {userRole === "professional" && (
            <div>
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                Travel Distance
              </Label>
              <Select value={formData.travelDistance} onValueChange={(value) => setFormData({...formData, travelDistance: value})}>
                <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-[#3B82F6] rounded-xl font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5miles">5 miles</SelectItem>
                  <SelectItem value="10miles">10 miles</SelectItem>
                  <SelectItem value="15miles">15 miles</SelectItem>
                  <SelectItem value="20miles">20 miles</SelectItem>
                  <SelectItem value="30miles">30 miles</SelectItem>
                  <SelectItem value="50miles">50 miles</SelectItem>
                  <SelectItem value="100miles">100 miles</SelectItem>
                  <SelectItem value="Nationwide">Nationwide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Professional Services Section */}
        {userRole === "professional" && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="font-['Poppins',sans-serif] text-[15px] sm:text-[16px] text-[#2c353f] mb-4">
                Professional Services
              </h3>
              
              {/* Sector Display (Read-only) */}
              <div className="mb-5">
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                  Sector
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Cannot be changed after registration)
                  </span>
                </Label>
                {formData.sector ? (
                  <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#FE8A0F] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <span className="text-sm text-[#2c353f] font-['Poppins',sans-serif] font-medium">
                        {formData.sector}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 font-['Poppins',sans-serif]">
                      Your sector was selected during registration and cannot be changed. However, you can select multiple categories within your chosen sector.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 font-['Poppins',sans-serif]">
                      No sector selected. Please complete your professional registration to select a sector.
                    </p>
                  </div>
                )}
              </div>

              {/* Categories Selection */}
              <div className="mb-5">
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                  Categories <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Select all that apply)
                  </span>
                </Label>
                {!userInfo?.sector ? (
                  <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-500 font-['Poppins',sans-serif]">
                      Please select a sector first
                    </p>
                  </div>
                ) : categoriesLoading ? (
                  <div className="border-2 border-gray-200 rounded-xl p-8 text-center" aria-busy="true">
                    <span className="sr-only">Loading categories</span>
                  </div>
                ) : availableCategories.length === 0 ? (
                  <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-500 font-['Poppins',sans-serif]">
                      No categories available for this sector
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 rounded-xl p-4 max-h-[250px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableCategories.map((cat: Category) => (
                        <label
                          key={cat._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                            formData.categories.includes(cat._id)
                              ? 'border-[#FE8A0F] bg-[#FFF5EB]'
                              : 'border-gray-100 hover:border-[#FE8A0F] hover:bg-[#FFF5EB]'
                          } cursor-pointer transition-all`}
                        >
                          <Checkbox
                            checked={formData.categories.includes(cat._id)}
                            onCheckedChange={() => {
                              setFormData(prev => {
                                const newCategories = prev.categories.includes(cat._id)
                                  ? prev.categories.filter(c => c !== cat._id)
                                  : [...prev.categories, cat._id];
                                
                                // Remove subcategories from this category when category is deselected
                                let newSubcategories = prev.subcategories;
                                if (!newCategories.includes(cat._id) && cat.subCategories) {
                                  const subcatIds = cat.subCategories.map(sc => sc._id);
                                  newSubcategories = prev.subcategories.filter(sc => !subcatIds.includes(sc));
                                }
                                
                                return {
                                  ...prev,
                                  categories: newCategories,
                                  subcategories: newSubcategories,
                                };
                              });
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
                {formData.categories.length > 0 && (
                  <p className="mt-2 text-xs text-[#6b6b6b] font-['Poppins',sans-serif]">
                    {formData.categories.length} categor{formData.categories.length !== 1 ? 'ies' : 'y'} selected
                  </p>
                )}
              </div>

              {/* Subcategories Selection */}
              <div>
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                  Subcategories <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Select all that apply)
                  </span>
                </Label>
                {formData.categories.length === 0 ? (
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
                  <div className="max-h-[300px] overflow-y-auto pr-2 border-2 border-gray-200 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allSubcategories.map((subcat: SubCategory) => (
                        <div key={subcat._id} className="flex items-start space-x-2 p-2.5 rounded-lg hover:bg-[#FFF5EB] transition-colors border border-gray-100">
                      <input
                        type="checkbox"
                            id={`subcat-${subcat._id}`}
                            checked={formData.subcategories.includes(subcat._id)}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                subcategories: prev.subcategories.includes(subcat._id)
                                  ? prev.subcategories.filter(s => s !== subcat._id)
                                  : [...prev.subcategories, subcat._id]
                              }));
                            }}
                            className="mt-0.5 w-4 h-4 text-[#FE8A0F] border-gray-300 rounded focus:ring-[#FE8A0F] flex-shrink-0"
                      />
                      <Label
                            htmlFor={`subcat-${subcat._id}`}
                        className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] cursor-pointer leading-relaxed flex-1"
                      >
                            {subcat.name}
                      </Label>
                          {formData.subcategories.includes(subcat._id) && (
                        <CheckCircle className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                  </div>
                )}
                {formData.subcategories.length > 0 && (
                  <div className="mt-3 p-2.5 bg-[#FFF5EB] border border-[#FE8A0F]/20 rounded-xl">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      <span className="text-[#FE8A0F]">{formData.subcategories.length}</span> subcategor{formData.subcategories.length !== 1 ? 'ies' : 'y'} selected
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* About Your Service */}
            <div>
              <h3 className="font-['Poppins',sans-serif] text-[15px] sm:text-[16px] text-[#2c353f] mb-4">
                About Your Service
              </h3>
              
              <div className="mb-5">
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                  Service Description
                </Label>
                <Textarea
                  value={formData.aboutService}
                  onChange={(e) => setFormData({...formData, aboutService: e.target.value})}
                  placeholder="Tell customers about your business, experience and quality of your work..."
                  className="min-h-[150px] border-2 border-gray-200 focus:border-[#3B82F6] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
                />
                <p className="mt-2 font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                  {formData.aboutService.length} characters (minimum 100 recommended)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                    Trade Qualification or Accreditation
                  </Label>
                  <Select 
                    value={formData.hasTradeQualification} 
                    onValueChange={(value) => setFormData({...formData, hasTradeQualification: value})}
                  >
                    <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-[#3B82F6] rounded-xl font-['Poppins',sans-serif] text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                    Public Liability Insurance <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.hasPublicLiability} 
                    onValueChange={(value) => {
                      setFormData({...formData, hasPublicLiability: value});
                      // Clear insurance details if set to "no"
                      if (value === "no") {
                        setFormData(prev => ({
                          ...prev,
                          professionalIndemnityAmount: "",
                          insuranceExpiryDate: "",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-[#3B82F6] rounded-xl font-['Poppins',sans-serif] text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Insurance Details - Only show if hasPublicLiability is "yes" */}
              {formData.hasPublicLiability === "yes" && (
                <div className="space-y-4 p-6 bg-gradient-to-br from-[#FFF5EB] to-white border-2 border-[#FE8A0F]/20 rounded-xl">
                  <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#FE8A0F]" />
                    Insurance Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="indemnityAmount" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                        Professional Indemnity Insurance Amount
                      </Label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="indemnityAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.professionalIndemnityAmount}
                          onChange={(e) => setFormData({...formData, professionalIndemnityAmount: e.target.value})}
                          placeholder="Enter amount in GBP"
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="expiryDate" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                        Insurance Expiry Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.insuranceExpiryDate}
                          onChange={(e) => setFormData({...formData, insuranceExpiryDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] w-full sm:w-auto disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
            variant="outline"
            onClick={() => {
              setFormData(buildFormState(initialFormState));
            }}
              className="text-[#3B82F6] hover:bg-[#EFF6FF] border-[#3B82F6] font-['Poppins',sans-serif] w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment method logos
const VisaLogo = () => (
  <svg width="40" height="24" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white"/>
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1"/>
    <path d="M22.5859 22.75H19.9609L21.7859 14H24.4109L22.5859 22.75ZM17.7109 14L15.2109 20.125L14.9109 18.375L14.0359 14.875C14.0359 14.875 13.8859 14 13.2859 14H9.08594V14.15C9.08594 14.15 10.2609 14.45 11.5859 15.175L13.9609 22.75H16.8359L20.9609 14H17.7109ZM37.8359 22.75H40.1859L38.2859 14H36.2859C35.8359 14 35.5359 14.3 35.3859 14.75L31.4609 22.75H34.3359L34.9359 21.3H38.3359L38.6359 22.75H37.8359ZM35.6359 19.125L36.9609 16.0625L37.6859 19.125H35.6359ZM31.5859 16.875L32.0359 14.875C32.0359 14.875 30.8609 14 29.6859 14C28.3609 14 25.3359 14.75 25.3359 17.5625C25.3359 20.1875 29.1859 20.1875 29.1859 21.3125C29.1859 22.4375 25.9609 22.1875 24.9359 21.4375L24.4859 23.4375C24.4859 23.4375 25.6609 24 27.4359 24C29.0609 24 31.8359 23.125 31.8359 20.5C31.8359 17.875 28.0359 17.625 28.0359 16.75C28.0359 15.75 30.5359 15.875 31.5859 16.875Z" fill="#1434CB"/>
  </svg>
);

const MastercardLogo = () => (
  <svg width="40" height="24" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="56" height="36" rx="6" fill="white"/>
    <rect x="0.5" y="0.5" width="55" height="35" rx="5.5" stroke="#E5E7EB" strokeWidth="1"/>
    <circle cx="21" cy="18" r="8" fill="#EB001B"/>
    <circle cx="35" cy="18" r="8" fill="#F79E1B"/>
    <path d="M28 11.5C26.25 13 25 15.35 25 18C25 20.65 26.25 23 28 24.5C29.75 23 31 20.65 31 18C31 15.35 29.75 13 28 11.5Z" fill="#FF5F00"/>
  </svg>
);

// PayPal Logo - using image file
// Note: Add paypal-logo.png to client/src/assets/ folder
const PayPalLogo = () => (
  <img 
    src={paypalLogo} 
    alt="PayPal" 
    className="h-8 w-auto shrink-0 object-contain"
    style={{ maxWidth: "100px" }}
  />
);

const BankLogo = () => (
  <div className="w-10 h-6 flex items-center justify-center bg-white rounded shrink-0">
    <Landmark className="w-5 h-5 text-blue-600" />
  </div>
);

// Billing Section
function BillingSection() {
  const { userInfo, refreshUser } = useAccount();
  const location = useLocation();
  const [billingTab, setBillingTab] = useState<"wallet" | "card" | "invoice" | "history">("wallet");
  
  // Check URL parameters for billing tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section === "card") {
      setBillingTab("card");
    }
  }, [location.search]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showFundSection, setShowFundSection] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  
  // Fund wallet states
  const [selectedPaymentType, setSelectedPaymentType] = useState<"card" | "paypal" | "bank">("card");
  const [expandedPaymentType, setExpandedPaymentType] = useState<"card" | "paypal" | "bank" | null>("card");
  const [amount, setAmount] = useState("0");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fundPaymentMethods, setFundPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [bankAccountDetails, setBankAccountDetails] = useState({
    accountName: "",
    accountNumber: "",
    sortCode: "",
    bankName: "",
  });
  const [paymentSettings, setPaymentSettings] = useState({
    stripeCommissionPercentage: 1.55,
    stripeCommissionFixed: 0.29,
    paypalCommissionPercentage: 3.00,
    paypalCommissionFixed: 0.30,
    bankProcessingFeePercentage: 2.00,
    stripeEnabled: false,
    paypalEnabled: false,
    manualTransferEnabled: false,
  });
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(true);
  const [showBankTransferConfirmModal, setShowBankTransferConfirmModal] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paypalTransactionId, setPaypalTransactionId] = useState<string | null>(null);
  const [stripePaymentError, setStripePaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (billingTab === "wallet") {
      fetchWalletBalance();
      fetchTransactions();
    } else if (billingTab === "card") {
      fetchPaymentMethods();
      fetchPublishableKey();
    }
  }, [billingTab]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/balance"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/transactions?limit=20"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment-methods`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const fetchPublishableKey = async () => {
    
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setPublishableKey(data.publishableKey);
        setPaypalClientId(data.paypalClientId || null);
        
        // Only update commission rates, preserve enabled states
        const newPaymentSettings = {
          stripeCommissionPercentage: data.stripeCommissionPercentage || 1.55,
          stripeCommissionFixed: data.stripeCommissionFixed || 0.29,
          paypalCommissionPercentage: data.paypalCommissionPercentage || 3.00,
          paypalCommissionFixed: data.paypalCommissionFixed || 0.30,
          bankProcessingFeePercentage: data.bankProcessingFeePercentage || 2.00,
          stripeEnabled: data.stripeEnabled === true,
          paypalEnabled: data.paypalEnabled === true,
          manualTransferEnabled: data.manualTransferEnabled === true,
        };
        setPaymentSettings(prev => ({
          ...prev,
          ...newPaymentSettings,
        }));
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment-methods/set-default"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ paymentMethodId }),
      });

      if (response.ok) {
        toast.success("Primary payment method updated");
        await fetchPaymentMethods();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to set default payment method");
      }
    } catch (error) {
      toast.error("Failed to set default payment method");
    }
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }

    try {
      const response = await fetch(resolveApiUrl(`/api/payment-methods/${paymentMethodId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Payment method deleted");
        await fetchPaymentMethods();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete payment method");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete payment method");
    }
  };

  const handleAddCardSuccess = async () => {
    await fetchFundPaymentMethods();
    setShowAddCardModal(false);
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'VISA';
    if (brandLower.includes('mastercard')) return 'MC';
    if (brandLower.includes('amex')) return 'AMEX';
    if (brandLower.includes('discover')) return 'DISC';
    return brand.toUpperCase().slice(0, 4);
  };

  // Calculate fees
  const calculateFees = () => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) return { total: 0, fee: 0, paymentDue: 0 };

    let fee = 0;
    if (selectedPaymentType === "card") {
      fee = (amountNum * paymentSettings.stripeCommissionPercentage / 100) + paymentSettings.stripeCommissionFixed;
    } else if (selectedPaymentType === "bank") {
      fee = amountNum * paymentSettings.bankProcessingFeePercentage / 100;
    } else if (selectedPaymentType === "paypal") {
      fee = (amountNum * 3.0 / 100) + 0.30;
    }

    return {
      total: amountNum,
      fee: fee,
      paymentDue: amountNum + fee,
    };
  };

  const getCardBrandLogo = (brand?: string) => {
    if (!brand) return <CreditCard className="w-10 h-6 text-gray-400" />;
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return <VisaLogo />;
    if (brandLower.includes('mastercard')) return <MastercardLogo />;
    return <CreditCard className="w-10 h-6 text-gray-400" />;
  };

  const togglePaymentType = (type: "card" | "paypal" | "bank") => {
    if (expandedPaymentType === type) {
      setExpandedPaymentType(null);
    } else {
      setExpandedPaymentType(type);
      setSelectedPaymentType(type);
    }
  };

  // Fetch payment settings when fund section is shown
  useEffect(() => {
    if (showFundSection) {
      fetchPaymentSettings();
    }
  }, [showFundSection]);

  // Fetch additional data based on selected payment type
  useEffect(() => {
    if (showFundSection) {
      if (selectedPaymentType === "card") {
        fetchFundPaymentMethods();
        fetchPublishableKey();
      } else if (selectedPaymentType === "bank") {
        fetchBankAccountDetails();
        if (userInfo?.firstName && userInfo?.lastName) {
          setFullName(`${userInfo.firstName} ${userInfo.lastName}`);
        } else if (userInfo?.name) {
          setFullName(userInfo.name);
        }
      }
    }
  }, [showFundSection, selectedPaymentType, userInfo]);

  const fetchPaymentSettings = async () => {
    setLoadingPaymentSettings(true);
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      
      
      if (response.ok) {
        const data = await response.json();
        
        
        const stripeEnabled = data.stripeEnabled === true;
        const paypalEnabled = data.paypalEnabled === true;
        const manualTransferEnabled = data.manualTransferEnabled === true;
        
        
        // Update publishable key and paypal client id
        if (data.publishableKey) {
          setPublishableKey(data.publishableKey);
        }
        if (data.paypalClientId) {
          setPaypalClientId(data.paypalClientId);
        }
        
        const newPaymentSettings = {
          stripeCommissionPercentage: data.stripeCommissionPercentage || 1.55,
          stripeCommissionFixed: data.stripeCommissionFixed || 0.29,
          bankProcessingFeePercentage: data.bankProcessingFeePercentage || 2.00,
          paypalCommissionPercentage: data.paypalCommissionPercentage || 3.00,
          paypalCommissionFixed: data.paypalCommissionFixed || 0.30,
          stripeEnabled,
          paypalEnabled,
          manualTransferEnabled,
        };
        
        setPaymentSettings(newPaymentSettings);
        
        // Set default payment type to first enabled option
        if (stripeEnabled) {
          setSelectedPaymentType("card");
          setExpandedPaymentType("card");
        } else if (paypalEnabled) {
          setSelectedPaymentType("paypal");
          setExpandedPaymentType("paypal");
        } else if (manualTransferEnabled) {
          setSelectedPaymentType("bank");
          setExpandedPaymentType("bank");
        }
      } else {
      }
    } catch (error) {
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  const fetchBankAccountDetails = async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/payment/publishable-key"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.bankAccountDetails) {
          setBankAccountDetails({
            accountName: data.bankAccountDetails.accountName || "",
            accountNumber: data.bankAccountDetails.accountNumber || "",
            sortCode: data.bankAccountDetails.sortCode || "",
            bankName: data.bankAccountDetails.bankName || "",
          });
        }
      }
    } catch (error) {
    }
  };


  const fetchFundPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const response = await fetch(resolveApiUrl("/api/payment-methods"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setFundPaymentMethods(data.paymentMethods || []);
        const defaultMethod = data.paymentMethods?.find((pm: any) => pm.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.paymentMethodId);
        } else if (data.paymentMethods?.length > 0) {
          setSelectedPaymentMethod(data.paymentMethods[0].paymentMethodId);
        }
      }
    } catch (error) {
    } finally {
      setLoadingMethods(false);
    }
  };

  const handlePayment = async () => {
    // Clear previous error
    setStripePaymentError(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      const errorMsg = "Please enter a valid amount";
      toast.error(errorMsg);
      if (selectedPaymentType === "card") {
        setStripePaymentError(errorMsg);
      }
      return;
    }

    if (selectedPaymentType === "card") {
      await handleStripePayment();
    } else if (selectedPaymentType === "bank") {
      // Show confirmation modal for bank transfer
      setShowBankTransferConfirmModal(true);
    } else if (selectedPaymentType === "paypal") {
      // PayPal payment is handled by PayPalButtons component
      // The button will trigger createOrder automatically
    }
  };

  const handleConfirmBankTransfer = async () => {
    setShowBankTransferConfirmModal(false);
    await handleManualTransfer();
  };

  const handleStripePayment = async () => {
    // Clear previous error
    setStripePaymentError(null);
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      const errorMsg = "Please enter a valid amount";
      toast.error(errorMsg);
      setStripePaymentError(errorMsg);
      return;
    }
    
    if (!selectedPaymentMethod && fundPaymentMethods.length === 0) {
      const errorMsg = "Please add a payment method first";
      toast.error(errorMsg);
      setStripePaymentError(errorMsg);
      setShowAddCardModal(true);
      return;
    }

    setLoading(true);
    
    try {
      const requestBody = { 
        amount: parseFloat(amount),
        paymentMethodId: selectedPaymentMethod,
      };
      
      const response = await fetch(resolveApiUrl("/api/wallet/fund/stripe"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      
      const data = await response.json();

      if (!response.ok) {
        // If payment method was removed due to environment mismatch, refresh payment methods
        if (data.removedPaymentMethod) {
          await fetchFundPaymentMethods();
          setSelectedPaymentMethod(null);
        }
        const errorMsg = data.error || "Failed to process payment";
        setStripePaymentError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Clear error on success
      setStripePaymentError(null);

      if (data.status === 'succeeded') {
        toast.success(`Wallet funded successfully! New balance: £${data.balance?.toFixed(2)}`);
        await fetchWalletBalance();
        await fetchTransactions();
        setAmount("0");
        if (refreshUser) {
          await refreshUser();
        }
      } else if (data.requiresAction) {
        toast.info("Please complete the authentication");
        pollPaymentStatus(data.transactionId, data.clientSecret);
      } else {
        toast.success("Payment processed successfully!");
        await fetchWalletBalance();
        await fetchTransactions();
        setAmount("0");
        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to process payment";
      setStripePaymentError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string, clientSecret: string) => {
    const maxAttempts = 10;
    let attempts = 0;
    
    const poll = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(resolveApiUrl("/api/wallet/fund/stripe/confirm"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            transactionId,
            paymentIntentId: clientSecret.split('_secret')[0],
          }),
        });

        const data = await response.json();
        if (response.ok && data.transaction?.status === 'completed') {
          clearInterval(poll);
          toast.success(`Wallet funded successfully! New balance: £${data.balance?.toFixed(2)}`);
          await fetchWalletBalance();
          await fetchTransactions();
          setAmount("0");
          if (refreshUser) {
            await refreshUser();
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          toast.error("Payment confirmation timeout. Please check your wallet balance.");
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(poll);
        }
      }
    }, 2000);
  };

  const handlePayPalCreateOrder = async (): Promise<string> => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      throw new Error("Please enter a valid amount");
    }
    
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/fund/paypal"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create PayPal order");
      }

      
      setPaypalOrderId(data.orderId);
      setPaypalTransactionId(data.transactionId);
      
      return data.orderId;
    } catch (error: any) {
      toast.error(error.message || "Failed to create PayPal order");
      throw error;
    }
  };

  const handlePayPalApprove = async (data: { orderID: string }) => {
    
    try {
      setLoading(true);
      
      const response = await fetch(resolveApiUrl("/api/wallet/fund/paypal/capture"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderId: data.orderID,
          transactionId: paypalTransactionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to capture PayPal payment");
      }

      
      toast.success(`Wallet funded successfully! New balance: £${result.balance?.toFixed(2)}`);
      await fetchWalletBalance();
      await fetchTransactions();
      setAmount("20");
      setPaypalOrderId(null);
      setPaypalTransactionId(null);
      
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process PayPal payment");
    } finally {
      setLoading(false);
    }
  };

  const handleManualTransfer = async () => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!fullName || !fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/fund/manual"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount: parseFloat(amount),
          fullName: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create transfer request");
      }

      toast.success("Transfer request submitted successfully. We will credit your wallet once we receive your payment.");
      setAmount("20");
      setFullName("");
      await fetchWalletBalance();
      await fetchTransactions();
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Billing & Payments
      </h2>

      {/* Billing Tabs */}
      <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {[
            { id: "wallet", label: "Wallet", icon: Wallet },
            { id: "card", label: "Payment Cards", icon: CreditCard },
            { id: "invoice", label: "Invoices", icon: FileText },
            { id: "history", label: "History", icon: History },
          ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setBillingTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                billingTab === tab.id
                  ? "bg-[#FE8A0F] text-white"
                  : "bg-gray-100 text-[#6b6b6b] hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-['Poppins',sans-serif] text-[14px]">{tab.label}</span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Wallet Content */}
      {billingTab === "wallet" && (
        <div>
          <div className="bg-gradient-to-br from-[#3D78CB] to-[#2c5aa0] rounded-2xl p-8 text-white mb-6">
            <p className="font-['Poppins',sans-serif] text-[14px] mb-2 opacity-90">Total Balance</p>
            <h3 className="font-['Poppins',sans-serif] text-[42px] mb-6">
              {loadingBalance ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                `£${walletBalance.toFixed(2)}`
              )}
            </h3>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowFundSection(!showFundSection)}
                className="bg-white text-[#3D78CB] hover:bg-gray-100 font-['Poppins',sans-serif]"
              >
                {showFundSection ? "Hide" : "Add"} Funds
              </Button>
            </div>
          </div>

          {/* Fund Wallet Section */}
          {showFundSection && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
              <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-6">
                Fund Your Wallet
              </h3>
                            
              {/* Loading state */}
              {loadingPaymentSettings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                </div>
              ) : !paymentSettings.stripeEnabled && !paymentSettings.paypalEnabled && !paymentSettings.manualTransferEnabled ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-yellow-800">
                    No payment methods are currently available. Please contact support for assistance.
                  </p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Left Section: Select Payment Method */}
                <div className="space-y-4">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                    Select payment method
                  </h4>

                  <RadioGroup
                    value={selectedPaymentType}
                    onValueChange={(value) => {
                      const type = value as "card" | "paypal" | "bank";
                      togglePaymentType(type);
                    }}
                    className="space-y-4"
                  >
                    {/* Card Payment Option */}
                    {paymentSettings.stripeEnabled && (
                    <div className="border-2 rounded-lg overflow-hidden">
                      <div
                        className={`p-4 cursor-pointer transition-all ${
                          selectedPaymentType === "card"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => togglePaymentType("card")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="card"
                              id="payment-card"
                              className="mt-0"
                            />
                            <div className="flex items-center gap-2">
                              {getCardBrandLogo(fundPaymentMethods.find(m => m.paymentMethodId === selectedPaymentMethod)?.card.brand || "visa")}
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                {selectedPaymentMethod && fundPaymentMethods.length > 0
                                  ? `•••• ${fundPaymentMethods.find(m => m.paymentMethodId === selectedPaymentMethod)?.card.last4} (GBP)`
                                  : "Debit or credit card"}
                              </span>
                            </div>
                          </div>
                          {expandedPaymentType === "card" ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        {!expandedPaymentType && selectedPaymentType === "card" && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-2 ml-7">
                            All major cards accepted
                          </p>
                        )}
                      </div>

                      {expandedPaymentType === "card" && (
                        <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                          {loadingMethods ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
                            </div>
                          ) : fundPaymentMethods.length === 0 ? (
                            <div className="space-y-3">
                              <p className="font-['Poppins',sans-serif] text-[13px] text-gray-600">
                                No payment methods found. Please add a payment method.
                              </p>
                              <Button
                                onClick={() => setShowAddCardModal(true)}
                                className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif]"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Payment Method
                              </Button>
                            </div>
                          ) : (
                            <RadioGroup
                              value={selectedPaymentMethod || ""}
                              onValueChange={setSelectedPaymentMethod}
                            >
                              {fundPaymentMethods.map((method) => (
                                <div
                                  key={method.paymentMethodId}
                                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all mb-2 ${
                                    selectedPaymentMethod === method.paymentMethodId
                                      ? "border-[#FE8A0F] bg-[#FFF5EB]"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() => setSelectedPaymentMethod(method.paymentMethodId)}
                                >
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem
                                      value={method.paymentMethodId}
                                      id={`method-${method.paymentMethodId}`}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      {getCardBrandLogo(method.card.brand)}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-['Poppins',sans-serif] text-[14px] font-medium text-[#2c353f]">
                                            •••• {method.card.last4}
                                          </span>
                                          {method.isDefault && (
                                            <span className="px-2 py-0.5 bg-[#FE8A0F] text-white text-[10px] rounded">
                                              Default
                                            </span>
                                          )}
                                        </div>
                                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                          Expires {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                                        </p>
                                      </div>
                                    </div>
                                    {selectedPaymentMethod === method.paymentMethodId && (
                                      <Check className="w-5 h-5 text-[#FE8A0F]" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          )}

                          <div className="pt-3 border-t border-gray-200">
                            <p className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#2c353f] mb-2">
                              Add new payment method
                            </p>
                            <div className="space-y-2">
                              <div
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                onClick={() => setShowAddCardModal(true)}
                              >
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                  <Plus className="w-3 h-3 text-gray-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                      Debit or credit card
                                    </span>
                                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                                      All major cards accepted
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* PayPal Option */}
                    {paymentSettings.paypalEnabled && (
                      <div className="border-2 rounded-lg overflow-hidden">
                        <div
                          className={`p-4 cursor-pointer transition-all ${
                            selectedPaymentType === "paypal"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => togglePaymentType("paypal")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem
                                value="paypal"
                                id="payment-paypal"
                                className="mt-0"
                              />
                              <div className="flex items-center gap-2">
                                <PayPalLogo />
                                <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                  PayPal
                                </span>
                              </div>
                            </div>
                            {expandedPaymentType === "paypal" ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {expandedPaymentType === "paypal" && (
                          <div className="border-t border-gray-200 p-4 bg-white">
                            <p className="font-['Poppins',sans-serif] text-[13px] text-gray-600 mb-3">
                              Choose your payment method below to complete your deposit.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bank Transfer Option */}
                    {paymentSettings.manualTransferEnabled && (
                    <div className="border-2 rounded-lg overflow-hidden">
                      <div
                        className={`p-4 cursor-pointer transition-all ${
                          selectedPaymentType === "bank"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => togglePaymentType("bank")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="bank"
                              id="payment-bank"
                              className="mt-0"
                            />
                            <div className="flex items-center gap-2">
                              <BankLogo />
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                Bank Transfer
                              </span>
                            </div>
                          </div>
                          {expandedPaymentType === "bank" ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedPaymentType === "bank" && (
                        <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900 leading-relaxed">
                              Please click the "Confirm and pay" button to receive our bank details and a unique reference ID.
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900 mt-2 leading-relaxed">
                              Note: For a fast and secure payment, please use the ID when transferring your money to us.
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-blue-900 mt-2 leading-relaxed">
                              Note: Any transaction fees will be deducted from the total transfer amount. We'll credit your balance, once we receive the funds, on the next business day. If you have any questions, please contact us.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </RadioGroup>
                </div>

                {/* Right Section: Select Amount */}
                <div className="space-y-4">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                    Select amount (GBP)
                  </h4>

                  <div>
                    <Label htmlFor="amount" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Amount
                    </Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-[#2c353f] font-medium">
                        £
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="20"
                        className="pl-8 font-['Poppins',sans-serif]"
                        min="10"
                        step="0.01"
                      />
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                      Minimum: £10.00
                    </p>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        Total due:
                      </span>
                      <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                        £{calculateFees().total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          Processing fee:
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-blue-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 text-gray-800 shadow-lg p-3 max-w-xs">
                            <p className="font-['Poppins',sans-serif] text-[13px]">
                              {selectedPaymentType === "card"
                                ? `Card charges (${paymentSettings.stripeCommissionPercentage}%+£${paymentSettings.stripeCommissionFixed}) processing fee and processes your payment immediately.`
                                : selectedPaymentType === "bank"
                                ? `We charge ${paymentSettings.bankProcessingFeePercentage}% processing fee and process your payment within 1-2 working days.`
                                : "PayPal processing fee information"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                        £{calculateFees().fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                          Payment due:
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#2c353f]">
                          £{calculateFees().paymentDue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Buttons - Conditional based on payment type */}
                  {selectedPaymentType === "paypal" ? (
                    <div className="space-y-3">
                      {paypalClientId ? (
                        <PayPalScriptProvider
                          options={{
                            clientId: paypalClientId,
                            currency: "GBP",
                            intent: "capture",
                          }}
                        >
                          <PayPalButtons
                            createOrder={handlePayPalCreateOrder}
                            onApprove={handlePayPalApprove}
                            onError={(err) => {
                              toast.error("PayPal payment failed. Please try again.");
                              setLoading(false);
                            }}
                            onCancel={() => {
                              toast.info("PayPal payment cancelled");
                              setPaypalOrderId(null);
                              setPaypalTransactionId(null);
                            }}
                            onClick={(data, actions) => {
                              return actions.resolve();
                            }}
                            style={{
                              layout: "vertical",
                              color: "blue",
                              shape: "rect",
                              label: "paypal",
                            }}
                          />
                        </PayPalScriptProvider>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800">
                            PayPal is not configured. Please contact support.
                          </p>
                        </div>
                      )}
                      
                      {/* Debit or Credit Card Button */}
                      {paymentSettings.stripeEnabled && (
                        <>
                          <Button
                            onClick={async () => {
                              if (!amount || parseFloat(amount) <= 0) {
                                toast.error("Please enter a valid amount");
                                return;
                              }
                              
                              if (!selectedPaymentMethod && fundPaymentMethods.length === 0) {
                                toast.error("Please add a payment method first");
                                setShowAddCardModal(true);
                                return;
                              }
                              
                              // Directly trigger card payment without changing selectedPaymentType
                              setStripePaymentError(null);
                              await handleStripePayment();
                            }}
                            disabled={loading || !amount || parseFloat(amount) <= 0 || (!selectedPaymentMethod && fundPaymentMethods.length === 0)}
                            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-['Poppins',sans-serif] py-6 text-[16px] font-semibold flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-5 h-5" />
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing payment...
                              </>
                            ) : (
                              `Pay with Debit or Credit Card`
                            )}
                          </Button>
                          {/* Loading Indicator */}
                          {loading && (
                            <div className="mt-3">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-3">
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                  <p className="font-['Poppins',sans-serif] text-[14px] text-blue-700">
                                    Processing your payment, please wait...
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Error Message */}
                          {stripePaymentError && !loading && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="font-['Poppins',sans-serif] text-[14px] text-red-600 text-center">
                                {stripePaymentError}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    /* Confirm Button for Card and Bank Transfer */
                    <>
                      <Button
                        onClick={handlePayment}
                        disabled={loading || !amount || parseFloat(amount) <= 0 || (selectedPaymentType === "card" && !selectedPaymentMethod && fundPaymentMethods.length === 0)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif] py-6 text-[16px] font-semibold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing payment...
                          </>
                        ) : (
                          `Confirm and pay £${calculateFees().paymentDue.toFixed(2)} GBP`
                        )}
                      </Button>
                      {/* Loading Indicator */}
                      {loading && selectedPaymentType === "card" && (
                        <div className="mt-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              <p className="font-['Poppins',sans-serif] text-[14px] text-blue-700">
                                Processing your payment, please wait...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Error Message */}
                      {stripePaymentError && selectedPaymentType === "card" && !loading && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-red-600 text-center">
                            {stripePaymentError}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          {/* Transactions History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
              Recent Transactions
            </h3>
            {loadingTransactions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F]" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-[#6b6b6b] font-['Poppins',sans-serif] text-[14px]">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                        {(transaction.description || `${transaction.type} - £${transaction.amount}`).replace(/Stripe/gi, "Card").replace(/stripe/gi, "card")}
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                        {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-['Poppins',sans-serif] text-[16px] font-semibold ${
                          transaction.type === "deposit" || transaction.type === "refund"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "deposit" || transaction.type === "refund" ? "+" : "-"}
                        £{(() => {
                          // For deposits, show the actual deposited amount (fee excluded)
                          // Use metadata.depositAmount if available, otherwise use amount
                          if (transaction.type === "deposit" && transaction.metadata?.depositAmount !== undefined) {
                            return transaction.metadata.depositAmount.toFixed(2);
                          }
                          return transaction.amount.toFixed(2);
                        })()}
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                        Balance: £{transaction.balance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      Showing 5 most recent transactions. View all transactions in the{" "}
                      <button
                        onClick={() => setBillingTab("history")}
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        History tab
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Cards Content */}
      {billingTab === "card" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Payment Methods
            </h3>
            <Button 
              onClick={() => setShowAddCardModal(true)}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Card
            </Button>
          </div>

          {loadingPaymentMethods ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                No payment cards added yet
              </p>
              <Button 
                onClick={() => setShowAddCardModal(true)}
                className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.paymentMethodId}
                  className="bg-white border-2 rounded-xl p-6 hover:border-[#FE8A0F]/50 transition-all"
                  style={{
                    borderColor: method.isDefault ? "#FE8A0F" : "#e5e7eb",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-white border border-gray-200 p-2">
                        {getCardBrandLogo(method.card.brand)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                            •••• {method.card.last4}
                          </span>
                          {method.isDefault && (
                            <span className="px-3 py-1 bg-[#FE8A0F] text-white text-[11px] rounded-full font-['Poppins',sans-serif] font-medium">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                          Expires {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                          Added {new Date(method.createdAt).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.paymentMethodId)}
                          className="font-['Poppins',sans-serif] text-[12px]"
                        >
                          Set as Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCard(method.paymentMethodId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCardModal && publishableKey && (
        <PaymentMethodModal
          isOpen={showAddCardModal}
          onClose={() => setShowAddCardModal(false)}
          onSuccess={handleAddCardSuccess}
          publishableKey={publishableKey}
        />
      )}

      {/* Invoice Content */}
      {billingTab === "invoice" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              No invoices yet
            </p>
          </div>
        </div>
      )}

      {/* Transaction History Content */}
      {billingTab === "history" && (
        <TransactionHistoryTab />
      )}

      {/* Bank Transfer Confirmation Modal */}
      <Dialog open={showBankTransferConfirmModal} onOpenChange={setShowBankTransferConfirmModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
              Confirm Bank Transfer
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Please review the bank information and confirm your transfer request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Bank Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <h3 className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">
                Our bank information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Account Name:</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    {bankAccountDetails.accountName || "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Bank Name:</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    {bankAccountDetails.bankName || "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Sort Code:</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    {bankAccountDetails.sortCode || "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Account Number:</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    {bankAccountDetails.accountNumber || "Loading..."}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Reference ID:</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    {userInfo?.referenceId || "Loading..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="modal-full-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                  Full name:
                </Label>
                <Input
                  id="modal-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1 font-['Poppins',sans-serif]"
                />
              </div>

            </div>

            {/* Transfer Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-['Poppins',sans-serif] text-[15px] font-semibold text-[#2c353f]">
                Transfer Details
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Amount:</span>
                  <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    £{parseFloat(amount || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Processing fee:</span>
                  <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#2c353f]">
                    £{calculateFees().fee.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                  <span className="font-['Poppins',sans-serif] text-[16px] font-semibold text-[#2c353f]">Total:</span>
                  <span className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#2c353f]">
                    £{calculateFees().paymentDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-['Poppins',sans-serif] text-[14px] text-yellow-800">
                <strong>Important:</strong> To complete your transfer, go to your online bank or banking app and transfer £{calculateFees().paymentDue.toFixed(2)} using the account details above. Make sure to include your Reference ID ({userInfo?.referenceId || "N/A"}) in the payment description. Once you confirm, we will process your request and credit your wallet once we receive your payment.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowBankTransferConfirmModal(false)}
                variant="outline"
                className="font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBankTransfer}
                disabled={loading || !fullName}
                className="bg-blue-600 hover:bg-blue-700 text-white font-['Poppins',sans-serif]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Confirm and Submit"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Transaction History Tab Component
function TransactionHistoryTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });
  const [sortField, setSortField] = useState<"createdAt" | "amount" | "type" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchTransactions();
  }, [page, filters, sortField, sortOrder]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.type && filters.type !== "all") params.append("type", filters.type);

      const response = await fetch(resolveApiUrl(`/api/wallet/transactions?${params}`), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: "createdAt" | "amount" | "type" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const getSortIcon = (field: "createdAt" | "amount" | "type" | "status") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-[#FE8A0F]" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-[#FE8A0F]" />
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status-filter" className="font-['Poppins',sans-serif]">
              Status
            </Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => {
                setFilters({ ...filters, status: value });
                setPage(1);
              }}
            >
              <SelectTrigger id="status-filter" className="font-['Poppins',sans-serif]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type-filter" className="font-['Poppins',sans-serif]">
              Type
            </Label>
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => {
                setFilters({ ...filters, type: value });
                setPage(1);
              }}
            >
              <SelectTrigger id="type-filter" className="font-['Poppins',sans-serif]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setFilters({ status: "all", type: "all" });
                setPage(1);
              }}
              variant="outline"
              className="w-full font-['Poppins',sans-serif]"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                Transaction History
              </h3>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mt-1">
                Total: {total} transactions
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FE8A0F]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No transactions found
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th 
                    className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Date & Time
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      Type
                      {getSortIcon("type")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center">
                      Amount
                      {getSortIcon("amount")}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                    Balance
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                    Method
                  </th>
                  <th className="text-left py-3 px-4 font-['Poppins',sans-serif] text-[13px] font-semibold text-[#2c353f]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f] whitespace-nowrap">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      <span className="capitalize font-medium">{transaction.type}</span>
                    </td>
                    <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          transaction.type === "deposit" || transaction.type === "refund"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "deposit" || transaction.type === "refund" ? "+" : "-"}
                        £{transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f] whitespace-nowrap">
                      £{transaction.balance?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-['Poppins',sans-serif] ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="capitalize">{transaction.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                      <span className="capitalize">
                        {transaction.paymentMethod?.replace("_", " ").replace(/stripe/gi, "card") || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] max-w-xs">
                      <div className="truncate" title={transaction.description || "N/A"}>
                        {transaction.description || "N/A"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              Showing page {page} of {totalPages} ({total} total transactions)
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                variant="outline"
                className="font-['Poppins',sans-serif]"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                variant="outline"
                className="font-['Poppins',sans-serif]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Withdraw Section (Professional)
function WithdrawSection() {
  const { userInfo } = useAccount();
  const [withdrawTab, setWithdrawTab] = useState<"balance" | "accounts" | "withdraw" | "history">("balance");
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [showAddPayPal, setShowAddPayPal] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historySortField, setHistorySortField] = useState<"date" | "amount" | "type" | "status">("date");
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc");

  // Fetch wallet balance
  useEffect(() => {
    if (withdrawTab === "balance" || withdrawTab === "withdraw") {
      fetchWalletBalance();
    }
    if (withdrawTab === "history" || withdrawTab === "balance") {
      fetchTransactions();
    }
    if (withdrawTab === "accounts") {
      fetchPaymentMethods();
    }
  }, [withdrawTab]);

  const fetchWalletBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/balance"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(resolveApiUrl("/api/wallet/transactions?limit=200"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch(resolveApiUrl("/api/payment-methods"), {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const creditTypes = ["payment", "deposit", "manual_transfer"];
  const debitTypes = ["withdrawal", "refund"];

  const pendingAmount = useMemo(() => {
    return transactions
      .filter(tx => creditTypes.includes(tx.type) && tx.status === "pending")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const totalEarnings = useMemo(() => {
    return transactions
      .filter(tx => creditTypes.includes(tx.type) && tx.status === "completed")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  // Filter bank accounts and PayPal from payment methods
  const bankAccounts = paymentMethods.filter(method => method.type === 'bank');
  const paypalMethods = paymentMethods.filter(method => method.type === 'paypal');

  const formatMethodLabel = (tx: any) => {
    const method = tx.paymentMethod || tx.method;
    if (method === "paypal") return "PayPal";
    if (method === "stripe" || method === "card") return "Card";
    if (method === "manual_transfer") {
      if (tx.metadata?.bankName) {
        const masked = tx.metadata?.accountNumber
          ? `****${String(tx.metadata.accountNumber).slice(-4)}`
          : "";
        return `${tx.metadata.bankName}${masked ? ` ${masked}` : ""}`;
      }
      return "Bank Transfer";
    }
    if (method === "wallet") return "Wallet";
    return method ? method.toString().replace(/_/g, " ") : "Unknown";
  };

  const formatTypeLabel = (type: string) => {
    if (!type) return "Unknown";
    const map: Record<string, string> = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      payment: "Payment",
      refund: "Refund",
      manual_transfer: "Bank Transfer",
    };
    return map[type] || type.replace(/_/g, " ");
  };

  const formatStatusLabel = (status: string) => {
    if (!status) return "Pending";
    const map: Record<string, string> = {
      completed: "Completed",
      pending: "Pending",
      failed: "Failed",
      cancelled: "Cancelled",
      rejected: "Rejected",
    };
    return map[status] || status;
  };

  const transactionRows = useMemo(() => {
    const rows = transactions.map((tx, index) => {
      const createdAt = tx.createdAt || tx.date || tx.timestamp;
      const dateValue = createdAt ? new Date(createdAt).getTime() : 0;
      const reference = tx.orderId
        ? (typeof tx.orderId === "object" ? tx.orderId._id || tx.orderId : tx.orderId)
        : tx.metadata?.orderNumber || tx.metadata?.orderId;
      return {
        id: tx._id || tx.id || `tx-${index}`,
        dateValue,
        dateLabel: createdAt ? new Date(createdAt).toISOString().split("T")[0] : "",
        amount: tx.amount || 0,
        type: tx.type || "unknown",
        typeLabel: formatTypeLabel(tx.type),
        methodLabel: formatMethodLabel(tx),
        status: tx.status || "pending",
        statusLabel: formatStatusLabel(tx.status),
        description: tx.description || tx.metadata?.description || "",
        reference: reference ? reference.toString() : "",
      };
    });

    const query = historySearch.trim().toLowerCase();
    const filtered = rows.filter(row => {
      if (historyTypeFilter !== "all" && row.type !== historyTypeFilter) return false;
      if (historyStatusFilter !== "all" && row.status !== historyStatusFilter) return false;
      if (!query) return true;
      const haystack = [
        row.id,
        row.typeLabel,
        row.methodLabel,
        row.statusLabel,
        row.reference,
        row.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = historySortOrder === "asc" ? 1 : -1;
      if (historySortField === "amount") return (a.amount - b.amount) * direction;
      if (historySortField === "type") return a.typeLabel.localeCompare(b.typeLabel) * direction;
      if (historySortField === "status") return a.statusLabel.localeCompare(b.statusLabel) * direction;
      return (a.dateValue - b.dateValue) * direction;
    });

    return sorted;
  }, [
    transactions,
    historySearch,
    historyTypeFilter,
    historyStatusFilter,
    historySortField,
    historySortOrder,
  ]);

  const withdrawalSummary = useMemo(() => {
    const withdrawals = transactions.filter(tx => tx.type === "withdrawal");
    return {
      total: withdrawals
        .filter(tx => tx.status === "completed")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0),
      completed: withdrawals.filter(tx => tx.status === "completed").length,
      pending: withdrawals.filter(tx => tx.status === "pending").length,
    };
  }, [transactions]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50) {
      toast.error("Minimum withdrawal amount is £50");
      return;
    }
    if (amount > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!selectedWithdrawMethod) {
      toast.error("Please select a withdrawal method");
      return;
    }
    
    try {
      // TODO: Implement withdrawal API call
      toast.success(`Withdrawal request for £${amount.toFixed(2)} submitted successfully!`);
    setShowWithdrawDialog(false);
    setWithdrawAmount("");
    setSelectedWithdrawMethod("");
      await fetchWalletBalance();
      await fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit withdrawal request");
    }
  };

  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Withdraw Earnings
      </h2>

      {/* Withdraw Tabs */}
      <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {[
            { id: "balance", label: "Balance", icon: Wallet },
            { id: "accounts", label: "Payment Methods", icon: Building2 },
            { id: "withdraw", label: "Request Withdrawal", icon: ArrowDownToLine },
            { id: "history", label: "History", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setWithdrawTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                  withdrawTab === tab.id
                    ? "bg-[#FE8A0F] text-white"
                    : "bg-gray-100 text-[#6b6b6b] hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-['Poppins',sans-serif] text-[14px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Balance Tab */}
      {withdrawTab === "balance" && (
        <div>
          {/* Balance Cards */}
          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            {/* Available Balance */}
            <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl p-4 md:p-6 text-white min-w-[260px] md:min-w-0 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] opacity-90">Available Balance</p>
              </div>
              <h3 className="font-['Poppins',sans-serif] text-[28px] md:text-[36px] mb-2">
                {loadingBalance ? "Loading..." : `£${walletBalance.toFixed(2)}`}
              </h3>
              <Button
                onClick={() => {
                  setWithdrawTab("withdraw");
                }}
                className="bg-white text-[#10b981] hover:bg-gray-100 font-['Poppins',sans-serif] text-[12px] md:text-[13px] h-8 md:h-9"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                Withdraw Now
              </Button>
            </div>

            {/* Pending Amount */}
            <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-2xl p-4 md:p-6 text-white min-w-[260px] md:min-w-0 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] opacity-90">Pending</p>
              </div>
              <h3 className="font-['Poppins',sans-serif] text-[28px] md:text-[36px] mb-2">
                £{pendingAmount.toFixed(2)}
              </h3>
              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] opacity-80">
                From ongoing jobs
              </p>
            </div>

            {/* Total Earnings */}
            <div className="bg-gradient-to-br from-[#3D78CB] to-[#2c5aa0] rounded-2xl p-4 md:p-6 text-white min-w-[260px] md:min-w-0 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] opacity-90">Total Earnings</p>
              </div>
              <h3 className="font-['Poppins',sans-serif] text-[28px] md:text-[36px] mb-2">
                £{totalEarnings.toFixed(2)}
              </h3>
              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] opacity-80">
                All time
              </p>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-['Poppins',sans-serif] text-[15px] text-blue-900 mb-2">
                  Withdrawal Information
                </h4>
                <ul className="space-y-1 font-['Poppins',sans-serif] text-[13px] text-blue-700">
                  <li>• Minimum withdrawal amount: £50</li>
                  <li>• Bank transfers take 2-3 business days</li>
                  <li>• PayPal transfers are processed within 1 business day</li>
                  <li>• No withdrawal fees for amounts over £100</li>
                  <li>• £2.50 fee applies for withdrawals under £100</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">This Month</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                {loadingTransactions ? "Loading..." : `£${transactions.filter(tx => {
                  const txDate = new Date(tx.createdAt || tx.date);
                  const now = new Date();
                  return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear() && tx.type === 'withdrawal' && tx.status === 'completed';
                }).reduce((sum, tx) => sum + (tx.amount || 0), 0).toFixed(2)}`}
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">Last Month</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                {loadingTransactions ? "Loading..." : `£${transactions.filter(tx => {
                  const txDate = new Date(tx.createdAt || tx.date);
                  const now = new Date();
                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                  return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear() && tx.type === 'withdrawal' && tx.status === 'completed';
                }).reduce((sum, tx) => sum + (tx.amount || 0), 0).toFixed(2)}`}
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">Withdrawals</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                {loadingTransactions ? "Loading..." : transactions.filter(tx => tx.type === 'withdrawal').length}
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">Avg. Time</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">
                {loadingTransactions ? "Loading..." : (() => {
                  const completedWithdrawals = transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'completed');
                  if (completedWithdrawals.length === 0) return 'N/A';
                  const avgDays = completedWithdrawals.reduce((sum, tx) => {
                    const createdAt = new Date(tx.createdAt || tx.date);
                    const processedAt = tx.processedAt ? new Date(tx.processedAt) : new Date();
                    return sum + (processedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                  }, 0) / completedWithdrawals.length;
                  return `${Math.round(avgDays)} days`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {withdrawTab === "accounts" && (
        <div>
          <div className="mb-6">
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
              Bank Accounts
            </h3>
            <div className="space-y-3 mb-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="border border-gray-200 rounded-xl p-3 sm:p-5 hover:border-[#FE8A0F] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EFF6FF] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#3B82F6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-['Poppins',sans-serif] text-[14px] sm:text-[15px] text-[#2c353f]">
                            {account.bankName}
                          </h4>
                          {account.isDefault && (
                            <Badge className="bg-[#FE8A0F] text-white border-0 text-[10px] sm:text-[11px]">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b]">
                          {account.accountName}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[11px] sm:text-[13px] text-[#8d8d8d] truncate">
                          Account: {account.accountNumber} • Sort: {account.sortCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-[52px] sm:ml-0">
                      {!account.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#3B82F6] border-[#3B82F6] hover:bg-[#EFF6FF] font-['Poppins',sans-serif] text-[11px] sm:text-[12px] h-8 px-2 sm:px-3"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-['Poppins',sans-serif] text-[11px] sm:text-[12px] h-8 px-2 sm:px-3"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowAddBankAccount(true)}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Bank Account
            </Button>
          </div>

          <Separator className="my-6" />

          {/* Other Payment Methods */}
          <div>
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
              Other Payment Methods
            </h3>
            <div className="space-y-3 mb-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="border border-gray-200 rounded-xl p-3 sm:p-5 hover:border-[#FE8A0F] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFF5EB] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#FE8A0F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-['Poppins',sans-serif] text-[14px] sm:text-[15px] text-[#2c353f]">
                            {method.type}
                          </h4>
                          {method.isVerified && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] sm:text-[11px]">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] truncate">
                          {method.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 font-['Poppins',sans-serif] text-[11px] sm:text-[12px] h-8 px-2 sm:px-3 ml-[52px] sm:ml-0"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowAddPayPal(true)}
              variant="outline"
              className="border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB] font-['Poppins',sans-serif]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add PayPal Account
            </Button>
          </div>
        </div>
      )}

      {/* Request Withdrawal Tab */}
      {withdrawTab === "withdraw" && (
        <div>
          <div className="max-w-2xl">
            {/* Available Balance Display */}
            <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl p-6 text-white mb-6">
              <p className="font-['Poppins',sans-serif] text-[14px] opacity-90 mb-1">Available to Withdraw</p>
              <h3 className="font-['Poppins',sans-serif] text-[42px]">
                {loadingBalance ? "Loading..." : `£${walletBalance.toFixed(2)}`}
              </h3>
            </div>

            {/* Withdrawal Form */}
            <div className="space-y-5">
              <div>
                <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-[18px] text-[#6b6b6b]">
                    £
                  </span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-14 pl-10 pr-4 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[18px] focus:border-[#FE8A0F] outline-none"
                    min="50"
                    max={walletBalance}
                    step="0.01"
                  />
                </div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-1">
                  Minimum: £50 • Maximum: £{walletBalance.toFixed(2)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, walletBalance].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    className="font-['Poppins',sans-serif] text-[13px] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                  >
                    {amount === walletBalance ? "All" : `£${amount}`}
                  </Button>
                ))}
              </div>

              {/* Withdrawal Method */}
              <div>
                <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                  Select Withdrawal Method
                </label>
                <div className="space-y-2">
                  {bankAccounts.length === 0 && !loadingPaymentMethods && (
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] text-center py-4">
                      No bank accounts added. Please add a bank account first.
                    </p>
                  )}
                  {bankAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedWithdrawMethod(`bank-${account.id}`)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        selectedWithdrawMethod === `bank-${account.id}`
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className={`w-5 h-5 ${
                            selectedWithdrawMethod === `bank-${account.id}` ? "text-[#FE8A0F]" : "text-[#6b6b6b]"
                          }`} />
                          <div>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              {account.bankName} {account.accountNumber}
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                              2-3 business days
                            </p>
                          </div>
                        </div>
                        {account.isDefault && (
                          <Badge className="bg-[#FE8A0F] text-white border-0 text-[11px]">
                            Default
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  {paypalMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedWithdrawMethod(`paypal-${method.id}`)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        selectedWithdrawMethod === `paypal-${method.id}`
                          ? "border-[#FE8A0F] bg-[#FFF5EB]"
                          : "border-gray-200 hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className={`w-5 h-5 ${
                          selectedWithdrawMethod === `paypal-${method.id}` ? "text-[#FE8A0F]" : "text-[#6b6b6b]"
                        }`} />
                        <div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {method.type} - {method.email}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                            1 business day
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Information */}
              {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="space-y-2 font-['Poppins',sans-serif] text-[14px]">
                    <div className="flex justify-between">
                      <span className="text-[#6b6b6b]">Withdrawal Amount</span>
                      <span className="text-[#2c353f]">£{parseFloat(withdrawAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b6b6b]">Processing Fee</span>
                      <span className="text-[#2c353f]">
                        {parseFloat(withdrawAmount) >= 100 ? "£0.00" : "£2.50"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-[#2c353f]">You'll Receive</span>
                      <span className="text-[#10b981] font-medium">
                        £{(parseFloat(withdrawAmount) - (parseFloat(withdrawAmount) >= 100 ? 0 : 2.50)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleWithdraw}
                className="w-full h-12 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[15px]"
              >
                <ArrowDownToLine className="w-5 h-5 mr-2" />
                Request Withdrawal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal History Tab */}
      {withdrawTab === "history" && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="relative w-[70%] md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by ID, order, method, status..."
                className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg font-['Poppins',sans-serif] text-[13px] focus:border-[#FE8A0F] outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="manual_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                <SelectTrigger className="w-[150px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingTransactions && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        Loading transactions...
                      </td>
                    </tr>
                  )}
                  {!loadingTransactions && transactionRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        No transactions found
                      </td>
                    </tr>
                  )}
                  {!loadingTransactions && transactionRows.map((transaction) => {
                    const isDebit = debitTypes.includes(transaction.type);
                    return (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[14px] text-[#3D78CB]">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        {transaction.dateValue
                          ? new Date(transaction.dateValue).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                        {transaction.typeLabel}
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        <span className={isDebit ? "text-red-600" : "text-green-600"}>
                          {isDebit ? "-" : "+"}£{transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.methodLabel}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`
                          font-['Poppins',sans-serif] text-[12px]
                          ${transaction.statusLabel === "Completed" ? "bg-green-100 text-green-700 border-green-200" : ""}
                          ${transaction.statusLabel === "Pending" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                          ${transaction.statusLabel === "Failed" ? "bg-red-100 text-red-700 border-red-200" : ""}
                          ${transaction.statusLabel === "Cancelled" ? "bg-gray-100 text-gray-700 border-gray-200" : ""}
                          ${transaction.statusLabel === "Rejected" ? "bg-red-100 text-red-700 border-red-200" : ""}
                        `}>
                          {transaction.statusLabel}
                        </Badge>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-[#EFF6FF] to-white border border-[#3B82F6]/20 rounded-xl p-5">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Total Withdrawn</p>
              <p className="font-['Poppins',sans-serif] text-[28px] text-[#3B82F6]">£{withdrawalSummary.total.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-5">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Completed</p>
              <p className="font-['Poppins',sans-serif] text-[28px] text-green-600">{withdrawalSummary.completed}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-5">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Pending</p>
              <p className="font-['Poppins',sans-serif] text-[28px] text-orange-600">{withdrawalSummary.pending}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Dialog */}
      <Dialog open={showAddBankAccount} onOpenChange={setShowAddBankAccount}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
              Add Bank Account
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Enter your bank account details to add a new withdrawal method
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full h-10 px-4 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] outline-none"
              />
            </div>
            <div>
              <label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="Barclays"
                className="w-full h-10 px-4 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] outline-none"
              />
            </div>
            <div>
              <label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                Account Number
              </label>
              <input
                type="text"
                placeholder="12345678"
                className="w-full h-10 px-4 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] outline-none"
              />
            </div>
            <div>
              <label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                Sort Code
              </label>
              <input
                type="text"
                placeholder="20-00-00"
                className="w-full h-10 px-4 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  alert("Bank account added successfully!");
                  setShowAddBankAccount(false);
                }}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
              >
                Add Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddBankAccount(false)}
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add PayPal Dialog */}
      <Dialog open={showAddPayPal} onOpenChange={setShowAddPayPal}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
              Add PayPal Account
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Connect your PayPal account for faster withdrawals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                PayPal Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                className="w-full h-10 px-4 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#FE8A0F] outline-none"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-['Poppins',sans-serif] text-[12px] text-blue-700">
                You will receive a verification email from PayPal to confirm this account.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  alert("PayPal account added! Please check your email for verification.");
                  setShowAddPayPal(false);
                }}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]"
              >
                Add PayPal
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddPayPal(false)}
                className="flex-1 font-['Poppins',sans-serif]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Security Section
function SecuritySection() {
  const { changePassword, deleteAccount, logout } = useAccount();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0] || "Password does not meet requirements");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password";
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleCancelPasswordChange = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };
  
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    
    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm');
      return;
    }
    
    setIsDeletingAccount(true);
    try {
      await deleteAccount(deleteConfirmText);
      toast.success("Account deleted successfully");
      await logout();
      window.location.href = "/login";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  };
  
  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Security Settings
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-2xl p-6 hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Change Password
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full h-10 px-4 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6] outline-none bg-white ${
                  passwordError ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            <div>
              <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  const newPwd = e.target.value;
                  setNewPassword(newPwd);
                  setPasswordError(null);
                }}
                placeholder="Must include uppercase, lowercase, and numbers"
                className={`w-full h-10 px-4 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6] outline-none bg-white ${
                  passwordError ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {newPassword && !passwordError && (
                <p className="mt-1 text-[11px] text-gray-500 font-['Poppins',sans-serif]">
                  {getPasswordHint(newPassword)}
                </p>
              )}
              {!newPassword && (
                <p className="mt-1 text-[11px] text-gray-500 font-['Poppins',sans-serif]">
                  Password must include uppercase, lowercase, and numbers
                </p>
              )}
            </div>
            <div>
              <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full h-10 px-4 border-2 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6] outline-none bg-white ${
                  passwordError ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {passwordError && (
              <p className="text-[12px] text-red-600 font-['Poppins',sans-serif]">
                {passwordError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] disabled:opacity-70"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelPasswordChange}
                disabled={isChangingPassword}
                className="flex-1 text-[#3B82F6] hover:bg-[#EFF6FF] border-[#3B82F6] font-['Poppins',sans-serif] disabled:opacity-70"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-6 hover:border-red-300 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Delete Account
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white border border-red-100 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="font-['Poppins',sans-serif] text-[13px] text-red-700 mb-2">
                  <strong>You will lose:</strong>
                </p>
                <ul className="font-['Poppins',sans-serif] text-[12px] text-red-600 space-y-1 ml-4 list-disc">
                  <li>All orders and job history</li>
                  <li>All messages and conversations</li>
                  <li>Your profile and settings</li>
                  <li>Pending transactions or earnings</li>
                </ul>
              </div>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full font-['Poppins',sans-serif] hover:bg-red-700 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="w-[70vw]">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-red-700 mb-2">
                <strong>Warning:</strong> You will lose:
              </p>
              <ul className="font-['Poppins',sans-serif] text-[13px] text-red-600 space-y-1 ml-4 list-disc">
                <li>All your orders and job history</li>
                <li>All messages and conversations</li>
                <li>Your profile and account settings</li>
                <li>Any pending transactions or earnings</li>
              </ul>
            </div>
            <div>
              <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Type "DELETE" to confirm
              </label>
              <Input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={`font-['Poppins',sans-serif] text-[14px] ${
                  deleteError ? 'border-red-500' : ''
                }`}
              />
              {deleteError && (
                <p className="text-[12px] text-red-600 font-['Poppins',sans-serif] mt-1">
                  {deleteError}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                disabled={isDeletingAccount}
                className="flex-1 font-['Poppins',sans-serif] disabled:opacity-70"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                className="flex-1 font-['Poppins',sans-serif] hover:bg-red-700 disabled:opacity-70"
              >
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Notifications Section
interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

function NotificationsSection({ onUnreadCountChange }: { onUnreadCountChange: (count: number) => void }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get icon type from notification type
  const getIconType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'account_verified': 'success',
      'listing_approved': 'success',
      'listing_rejected': 'warning',
      'listing_requires_modification': 'warning',
      'message_received': 'message',
      'chat_message_received': 'message',
      'bank_transfer_approved': 'payment',
      'bank_transfer_rejected': 'warning',
      'order_received': 'booking',
      'order_created': 'booking',
      'order_completed': 'service',
      'extension_request_sent': 'info',
      'extension_request_approved': 'success',
      'extension_request_rejected': 'warning',
      'cancellation_requested': 'info',
      'cancellation_accepted': 'success',
      'cancellation_rejected': 'warning',
      'cancellation_withdrawn': 'info',
      'cancellation_reminder': 'warning',
      'order_delivered': 'info',
      'order_delivery_rejected': 'warning',
      'order_delivery_approved': 'success',
      'order_delivery_reminder': 'warning',
      'review_reminder': 'review',
      'dispute_initiated': 'warning',
      'dispute_responded': 'info',
      'dispute_resolved': 'success',
      'review_received': 'review',
      'payment_received': 'payment',
      'abandoned_cart': 'info',
      'system': 'info',
    };
    return typeMap[type] || 'info';
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread' ? 'true' : 'false';
      const response = await fetch(resolveApiUrl(`/api/notifications?page=${pageNum}&limit=20&unreadOnly=${unreadOnly}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        setHasMore(data.pagination?.page < data.pagination?.pages);
        onUnreadCountChange(data.unreadCount || 0);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [filter, onUnreadCountChange]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, true);
  }, [filter, fetchNotifications]);

  // Listen for real-time notifications via Socket.io
  const { userInfo } = useAccount();
  useEffect(() => {
    if (!userInfo?.id) return;

    // Connect socket if not already connected
    const socket = getSocket() || connectSocket(userInfo.id);
    
    // Handler for new notification
    const handleNewNotification = (data: { notification: NotificationItem; unreadCount: number }) => {
      
      // Update unread count
      onUnreadCountChange(data.unreadCount);
      
      // Add new notification to the top of the list (only if showing all or if it's unread)
      if (filter === 'all' || !data.notification.isRead) {
        setNotifications(prev => {
          // Check if notification already exists
          const exists = prev.some(n => n._id === data.notification._id);
          if (exists) return prev;
          return [data.notification, ...prev];
        });
      }
    };

    // Subscribe to notification events
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [userInfo?.id, filter, onUnreadCountChange]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        onUnreadCountChange(data.unreadCount || 0);
      }
    } catch (error) {
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/notifications/mark-all-read'), {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        onUnreadCountChange(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(resolveApiUrl(`/api/notifications/${notificationId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        onUnreadCountChange(data.unreadCount || 0);
      }
    } catch (error) {
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/notifications'), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications([]);
        onUnreadCountChange(0);
        toast.success('All notifications deleted');
      }
    } catch (error) {
    }
  };

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, false);
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] font-semibold">
            Notifications
          </h2>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mt-1">
            Stay updated with your account activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="font-['Poppins',sans-serif] text-[13px] text-[#003D82] hover:text-[#FE8A0F] transition-colors"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={deleteAllNotifications}
              className="font-['Poppins',sans-serif] text-[13px] text-red-500 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-['Poppins',sans-serif] text-[14px] transition-all ${
            filter === 'all'
              ? 'bg-[#003D82] text-white'
              : 'bg-gray-100 text-[#5b5b5b] hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-['Poppins',sans-serif] text-[14px] transition-all ${
            filter === 'unread'
              ? 'bg-[#003D82] text-white'
              : 'bg-gray-100 text-[#5b5b5b] hover:bg-gray-200'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#003D82] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] font-medium mb-2">
              No notifications
            </h3>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d] text-center">
              {filter === 'unread' 
                ? "You've read all your notifications" 
                : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => {
              const iconType = getIconType(notification.type);
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 p-4 border-b border-gray-100 hover:bg-[#FFF5EB] transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    iconType === 'success' ? 'bg-green-100' :
                    iconType === 'warning' ? 'bg-orange-100' :
                    iconType === 'message' ? 'bg-blue-100' :
                    iconType === 'payment' ? 'bg-green-100' :
                    iconType === 'booking' ? 'bg-blue-100' :
                    iconType === 'service' ? 'bg-purple-100' :
                    iconType === 'review' ? 'bg-orange-100' :
                    'bg-gray-100'
                  }`}>
                    {iconType === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {iconType === 'warning' && <AlertCircle className="w-6 h-6 text-orange-600" />}
                    {iconType === 'message' && <MessageCircle className="w-6 h-6 text-blue-600" />}
                    {iconType === 'payment' && <DollarSign className="w-6 h-6 text-green-600" />}
                    {iconType === 'booking' && <Calendar className="w-6 h-6 text-[#003D82]" />}
                    {iconType === 'service' && <Briefcase className="w-6 h-6 text-purple-600" />}
                    {iconType === 'review' && <TrendingUp className="w-6 h-6 text-[#FE8A0F]" />}
                    {iconType === 'info' && <Info className="w-6 h-6 text-gray-600" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-['Poppins',sans-serif] font-medium text-[15px] text-[#2c353f]">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <div className="w-2.5 h-2.5 bg-[#FE8A0F] rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#5b5b5b] mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-2">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="font-['Poppins',sans-serif] text-[14px] text-[#003D82] hover:text-[#FE8A0F] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Messenger Section
function MessengerSection() {
  const navigate = useNavigate();
  const { contacts, getMessages, addMessage, uploadFile, userRole, setUserRole } = useMessenger();
  const { userInfo, userRole: accountUserRole } = useAccount();

  // Sync messenger userRole with account userRole
  useEffect(() => {
    if (accountUserRole && accountUserRole !== userRole) {
      setUserRole(accountUserRole);
    }
  }, [accountUserRole, userRole, setUserRole]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOfferPaymentModal, setShowOfferPaymentModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<{ id: string; price: number; serviceFee: number; total: number } | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; fileName: string; type: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const currentMessages = selectedContactId ? getMessages(selectedContactId) : [];

  const emojis = ["😊", "👍", "❤️", "😂", "🎉", "👏", "🙏", "💯", "✨", "🔥", "😍", "🤔", "😎", "🙌", "💪"];

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string | Date) => {
    if (typeof timestamp === 'string' && timestamp === 'now') {
      return 'now';
    }
    
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      
      // Check if date is valid
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'now';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'now';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedContact) {
      scrollToBottom();
    }
  }, [currentMessages, selectedContact]);

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContactId) return;

    addMessage(selectedContactId, {
      senderId: userInfo?.id || "current-user",
      text: messageText,
      read: false,
      type: "text",
      replyTo: replyToMessage ? {
        id: replyToMessage.id,
        text: replyToMessage.text,
        senderName: replyToMessage.senderName,
      } : undefined,
    });
    setMessageText("");
    setShowEmojiPicker(false);
    setReplyToMessage(null);

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }, 1000);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageText(messageText + emoji);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedContactId) return;

    const fileType = file.type.startsWith("image/") ? "image" : "file";
    const text = fileType === "image" ? "" : `Sent ${file.name}`;

    // Upload file to server
    await uploadFile(selectedContactId, file, text);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Messages
      </h2>

      <div className="h-[600px] bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-200">
        <div className="flex h-full">
          {/* Left Side - Contacts List */}
          <div className={`md:w-[40%] md:flex flex-col h-full border-r-2 border-gray-200 bg-white ${showMobileChat ? 'hidden' : 'flex w-full'}`}>
            {/* Search */}
            <div className="p-4 flex-shrink-0 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[13px] bg-white"
                />
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-hidden bg-white">
              <ScrollArea className="h-full">
                <div className="divide-y divide-gray-100">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContactId(contact.id);
                        setShowMobileChat(true);
                      }}
                      className={`w-full p-3 hover:bg-gray-50 transition-colors text-left ${
                        selectedContactId === contact.id ? "bg-[#FFF5EB] border-l-4 border-[#FE8A0F]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-11 h-11">
                            {resolveAvatarUrl(contact.avatar) && (
                              <AvatarImage src={resolveAvatarUrl(contact.avatar)} />
                            )}
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
                              {contact.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div 
                            className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full"
                            style={{ backgroundColor: contact.online === true ? '#10b981' : '#FFA500' }}
                          ></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] truncate">
                              {contact.name}
                            </h4>
                            <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] whitespace-nowrap flex-shrink-0">
                              {formatTimestamp(contact.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] truncate flex-1">
                              {contact.lastMessage}
                            </p>
                            {contact.unread > 0 && (
                              <Badge className="bg-[#FE8A0F] text-white border-0 text-[11px] w-5 h-5 flex items-center justify-center p-0 flex-shrink-0">
                                {contact.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Side - Chat Area */}
          <div className={`md:w-[60%] flex flex-col bg-white h-full ${showMobileChat ? 'flex w-full' : 'hidden md:flex'}`}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b-2 border-gray-200 bg-white shrink-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="md:hidden -ml-2 text-[#5b5b5b] hover:bg-gray-100"
                      onClick={() => setShowMobileChat(false)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="relative">
                      <Avatar className="w-11 h-11">
                        {resolveAvatarUrl(selectedContact.avatar) && (
                          <AvatarImage src={resolveAvatarUrl(selectedContact.avatar)} />
                        )}
                        <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[15px]">
                          {selectedContact.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full"
                        style={{ backgroundColor: selectedContact.online === true ? '#10b981' : '#FFA500' }}
                      ></div>
                    </div>
                    <div>
                      <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        {selectedContact.name}
                      </h4>
                      <p 
                        className="font-['Poppins',sans-serif] text-[13px]"
                        style={{ color: selectedContact.online === true ? '#10b981' : '#FFA500' }}
                      >
                        {selectedContact.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-[#3D78CB] hover:bg-[#EFF6FF]">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-[#6b6b6b] hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Custom Order Button - Below Header (Always for Professionals, use account role) */}
                {accountUserRole === "professional" && (
                  <div className="px-4 py-3 border-b-2 border-gray-200 bg-gradient-to-r from-[#FFF5EB] to-white">
                    <Button
                      onClick={() => setShowOrderModal(true)}
                      className="w-full bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-lg text-white font-['Poppins',sans-serif] text-[13px] transition-all duration-300"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Create Custom Offer
                    </Button>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 min-h-0 p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="space-y-4">
                    {currentMessages.map((message) => {
                      if ((message.type === "order" || message.type === "custom_offer") && message.orderDetails) {
                        // Order or Custom Offer message
                        return (
                          <div key={message.id} className="flex justify-center">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm w-full shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <ShoppingBag className="w-5 h-5 text-[#FE8A0F]" />
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                  {message.type === "custom_offer" ? "Custom Offer" : "Order Placed"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Service:</span>
                                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                    {message.orderDetails.service}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Amount:</span>
                                  <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                    {message.orderDetails.amount}
                                  </span>
                                </div>
                                {message.type === "custom_offer" && message.orderDetails.deliveryDays && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Delivery:</span>
                                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                      {message.orderDetails.deliveryDays} {message.orderDetails.deliveryDays === 1 ? 'day' : 'days'}
                                    </span>
                                  </div>
                                )}
                                {message.type === "order" && message.orderDetails.date && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Date:</span>
                                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                      {message.orderDetails.date}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Payment:</span>
                                  <Badge className="bg-purple-100 text-purple-700 text-[11px]">
                                    {message.orderDetails.paymentType === "milestone" ? "Milestone" : "Single"}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Status:</span>
                                  <Badge
                                    variant={
                                      message.orderDetails.status === "completed"
                                        ? "default"
                                        : message.orderDetails.status === "pending"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="font-['Poppins',sans-serif] text-[11px] capitalize"
                                  >
                                    {message.orderDetails.status}
                                  </Badge>
                                </div>
                                {message.type === "custom_offer" && message.orderDetails.description && (
                                  <div className="pt-2 border-t border-gray-100">
                                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">Description:</span>
                                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mt-1">
                                      {message.orderDetails.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {message.type === "custom_offer" && message.orderDetails.status === "pending" ? (
                                <div className="space-y-2 mt-3">
                                  {message.orderDetails.responseDeadline && (() => {
                                    const countdown = useCountdown(message.orderDetails.responseDeadline);
                                    return (
                                      <div className="text-center p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mb-1">
                                          {countdown.expired ? "Offer Expired" : "Time Remaining:"}
                                        </p>
                                        {countdown.expired ? (
                                          <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 font-medium">
                                            This offer has expired
                                          </p>
                                        ) : (
                                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F] font-semibold">
                                            {countdown.days > 0 && `${countdown.days}d `}
                                            {countdown.hours.toString().padStart(2, '0')}:
                                            {countdown.minutes.toString().padStart(2, '0')}:
                                            {countdown.seconds.toString().padStart(2, '0')}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                        const offerId = message.orderId || message.orderDetails?.offerId;
                                        if (!offerId) {
                                          toast.error("Offer ID not found");
                                          return;
                                        }
                                        
                                        // Get price from message
                                        const price = message.orderDetails?.price || parseFloat(message.orderDetails?.amount?.replace('£', '') || '0');
                                        const serviceFee = 0; // Will be calculated on backend
                                        const total = price + serviceFee;
                                        
                                        setSelectedOffer({
                                          id: offerId,
                                          price,
                                          serviceFee,
                                          total,
                                        });
                                        setShowOfferPaymentModal(true);
                                    }}
                                    size="sm"
                                    className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px]"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                      onClick={async () => {
                                        try {
                                          const offerId = message.orderId || message.orderDetails?.offerId;
                                          if (!offerId) {
                                            toast.error("Offer ID not found");
                                            return;
                                          }

                                          const response = await fetch(resolveApiUrl(`/api/custom-offers/${offerId}/reject`), {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            credentials: 'include',
                                          });

                                          if (!response.ok) {
                                            const error = await response.json();
                                            throw new Error(error.error || 'Failed to reject offer');
                                          }

                                          toast.success("Offer declined");
                                        } catch (error: any) {
                                          toast.error(error.message || "Failed to reject offer");
                                        }
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 font-['Poppins',sans-serif] text-[12px]"
                                  >
                                    Decline
                                  </Button>
                                  </div>
                                </div>
                              ) : message.orderId && (
                                <Button
                                  onClick={() => {
                                    navigate(`/account?tab=orders&orderId=${message.orderId}`);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-3 font-['Poppins',sans-serif] text-[12px] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Order
                                </Button>
                              )}
                              <p className="font-['Poppins',sans-serif] text-[10px] text-[#8d8d8d] text-center mt-2">
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      // Regular text message
                      const isOwnMessage = message.senderId === userInfo?.id;
                      const senderName = isOwnMessage 
                        ? (userRole === 'professional' ? (userInfo?.tradingName || 'Professional') : `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim() || userInfo?.name)
                        : selectedContact?.name;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } group relative`}
                          onMouseEnter={() => setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          <div
                            className={`max-w-[70%] ${
                              isOwnMessage ? "order-2" : "order-1"
                            } relative`}
                          >
                            {/* Reply button - only show for received messages on hover */}
                            {!isOwnMessage && hoveredMessageId === message.id && (
                              <button
                                onClick={() => {
                                  setReplyToMessage({
                                    id: message.id,
                                    text: message.text || 'Attachment',
                                    senderName: senderName,
                                  });
                                }}
                                className="absolute -top-8 right-0 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors z-10 border border-gray-200"
                                title="Reply"
                              >
                                <Reply className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-sm ${
                                isOwnMessage
                                  ? "bg-[#FFF5EB] text-black rounded-br-sm border-l-[3px] border-b-[3px] border-[#FE8A0F]"
                                  : "bg-white text-black rounded-bl-sm border-r-[3px] border-b-[3px] border-[#FE8A0F] cursor-pointer"
                              }`}
                              onDoubleClick={() => {
                                if (!isOwnMessage) {
                                  setReplyToMessage({
                                    id: message.id,
                                    text: message.text || 'Attachment',
                                    senderName: senderName,
                                  });
                                }
                              }}
                            >
                              {/* Replied message preview with quote */}
                              {message.replyTo && (
                                <div className="mb-2 pb-2 border-l-4 border-[#FE8A0F] pl-3 bg-gray-50/70 rounded-md p-2">
                                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#FE8A0F] font-semibold mb-1">
                                    {message.replyTo.senderName}
                                  </p>
                                  <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600 italic relative pl-4">
                                    <span className="absolute left-0 top-0 text-gray-400 text-[16px] leading-none">"</span>
                                    <span className="line-clamp-2">{message.replyTo.text}</span>
                                    <span className="absolute bottom-0 right-0 text-gray-400 text-[16px] leading-none">"</span>
                                  </p>
                                </div>
                              )}
                              {message.type === "image" && message.fileUrl && (
                                <div
                                  onClick={() => setPreviewAttachment({
                                    url: resolveApiUrl(message.fileUrl),
                                    fileName: message.fileName || "Image",
                                    type: "image"
                                  })}
                                  className="cursor-pointer"
                                >
                                  <img
                                    src={resolveApiUrl(message.fileUrl)}
                                    alt="Shared"
                                    className="rounded-lg mb-2 max-w-full hover:opacity-90 transition-opacity"
                                  />
                                </div>
                              )}
                              {message.type === "file" && message.fileUrl && (
                                <div 
                                  className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-white/50 border border-gray-200 cursor-pointer hover:bg-white/70 transition-colors"
                                  onClick={() => {
                                    const fileExtension = message.fileName?.split('.').pop()?.toLowerCase() || '';
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
                                    const isPdf = fileExtension === 'pdf';
                                    setPreviewAttachment({
                                      url: resolveApiUrl(message.fileUrl),
                                      fileName: message.fileName || "File",
                                      type: isImage ? "image" : isPdf ? "pdf" : "file"
                                    });
                                  }}
                                >
                                  <Paperclip className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                                  <span className="font-['Poppins',sans-serif] text-[13px] truncate flex-1">
                                    {message.fileName}
                                  </span>
                                  <button
                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-lg transition-colors flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const link = document.createElement('a');
                                      link.href = resolveApiUrl(message.fileUrl);
                                      link.download = message.fileName || "file";
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="font-['Poppins',sans-serif] text-[11px]">Download</span>
                                  </button>
                                </div>
                              )}
                              {message.text && (
                              <p className="font-['Poppins',sans-serif] text-[14px] leading-relaxed">
                                {message.text}
                              </p>
                              )}
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 px-1 ${
                                message.senderId === userInfo?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                                {formatTimestamp(message.timestamp)}
                              </span>
                              {message.senderId === userInfo?.id && (
                                <div className="text-[#8d8d8d]">
                                  {message.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#10b981]" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 border-r-[3px] border-b-[3px] border-[#FE8A0F]">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 md:p-4 border-t border-gray-200 bg-white shrink-0">
                  <div className="relative">
                    {/* Emoji Picker - Positioned absolutely above input */}
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 shadow-2xl rounded-t-xl p-4 mb-1 z-50"
                      >
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiClick(emoji)}
                              className="text-[30px] hover:scale-110 transition-transform p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Reply Preview */}
                    {replyToMessage && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-start gap-2 mb-2">
                        <Reply className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-['Poppins',sans-serif] text-[11px] text-[#FE8A0F] font-semibold mb-0.5">
                            Replying to {replyToMessage.senderName}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600 truncate">
                            {replyToMessage.text}
                          </p>
                        </div>
                        <button
                          onClick={() => setReplyToMessage(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#9ca3af] hover:text-[#FE8A0F] hover:bg-[#FFF5EB] h-9 w-8 p-0 flex-shrink-0"
                    >
                      <Paperclip className="w-[18px] h-[18px]" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`h-9 w-8 p-0 flex-shrink-0 ${
                        showEmojiPicker ? "text-[#FE8A0F] bg-[#FFF5EB]" : "text-[#9ca3af] hover:text-[#FE8A0F] hover:bg-[#FFF5EB]"
                      }`}
                    >
                      <Smile className="w-[18px] h-[18px]" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        placeholder="Type"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSendMessage();
                          }
                        }}
                        className="h-9 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-full font-['Poppins',sans-serif] text-[13px] px-4"
                      />
                    </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 h-9 w-9 p-0 rounded-lg flex-shrink-0"
                      >
                        <Send className="w-[16px] h-[16px]" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center px-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3D78CB]/10 to-[#FE8A0F]/10 flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-12 h-12 text-[#3D78CB]" />
                  </div>
                  <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-2">
                    Select a Conversation
                  </h3>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#8d8d8d] max-w-sm mx-auto">
                    Choose a contact from the list to view your conversation history and send messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Order Modal */}
      {showOrderModal && selectedContact && (
        <CustomOfferModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          clientId={selectedContact.id}
          clientName={selectedContact.name}
        />
      )}

      {/* Custom Offer Payment Modal */}
      {selectedOffer && (
        <CustomOfferPaymentModal
          isOpen={showOfferPaymentModal}
          onClose={() => {
            setShowOfferPaymentModal(false);
            setSelectedOffer(null);
          }}
          offerId={selectedOffer.id}
          offerPrice={selectedOffer.price}
          serviceFee={selectedOffer.serviceFee}
          total={selectedOffer.total}
          onSuccess={(orderNumber) => {
            navigate(`/account?tab=orders&orderId=${orderNumber}`);
            setShowOfferPaymentModal(false);
            setSelectedOffer(null);
          }}
        />
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
          <DialogContent className="w-[90vw] max-w-[900px] max-h-[90vh] bg-white p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
                  {previewAttachment.fileName}
                </DialogTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewAttachment.url;
                      link.download = previewAttachment.fileName;
                      link.click();
                    }}
                    className="font-['Poppins',sans-serif] text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(previewAttachment.url, "_blank")}
                    className="font-['Poppins',sans-serif] text-[#FE8A0F] border-[#FE8A0F] hover:bg-[#FE8A0F]/10"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center bg-gray-50">
              {previewAttachment.type === "image" ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : previewAttachment.type === "pdf" ? (
                <iframe
                  src={previewAttachment.url}
                  className="w-full h-[calc(90vh-180px)] min-h-[600px] border-0 rounded-lg"
                  title={previewAttachment.fileName}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-4">
                    Preview not available for this file type
                  </p>
                  <Button
                    onClick={() => window.open(previewAttachment.url, "_blank")}
                    className="font-['Poppins',sans-serif] bg-[#FE8A0F] hover:bg-[#FFB347] text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Document
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Support Section
function SupportSection() {
  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Support Center
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F] hover:bg-[#FFF5EB] transition-all cursor-pointer">
          <HelpCircle className="w-8 h-8 text-[#FE8A0F] mb-3" />
          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            FAQs
          </h3>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Find answers to common questions
          </p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all cursor-pointer">
          <MessageCircle className="w-8 h-8 text-[#3B82F6] mb-3" />
          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
            Live Chat
          </h3>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Chat with our support team
          </p>
        </div>
      </div>
    </div>
  );
}

// Invite Section
function InviteSection() {
  const [mainTab, setMainTab] = useState<"referral-links" | "referral-report">("referral-links");
  const [activeReferralTab, setActiveReferralTab] = useState<"order" | "posted-task">("order");
  const [entriesPerPage, setEntriesPerPage] = useState("25");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "sno",
    direction: "asc"
  });

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleShareFacebook = (link: string) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  const handleShareTwitter = (link: string) => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`, '_blank');
  };

  const handleShareEmail = (link: string) => {
    window.location.href = `mailto:?subject=Join tradespeoplehub&body=${encodeURIComponent(link)}`;
  };

  const handleShareWhatsApp = (link: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank');
  };

  // Mock referral data
  const referralData = [
    {
      sno: 1,
      name: "Diy Ser",
      userType: "Seller",
      signedUp: "01/12/2022",
      ordered: 0,
      orderCompleted: 0,
      earnings: 5.00
    },
    {
      sno: 2,
      name: "trads40 trads",
      userType: "Seller",
      signedUp: "05/12/2022",
      ordered: 0,
      orderCompleted: 0,
      earnings: 0.00
    },
    {
      sno: 3,
      name: "Benito Karlssons",
      userType: "Buyer",
      signedUp: "08/12/2022",
      ordered: 0,
      orderCompleted: 0,
      earnings: 0.00
    },
    {
      sno: 4,
      name: "Terry Brand",
      userType: "Buyer",
      signedUp: "11/12/2022",
      ordered: 0,
      orderCompleted: 0,
      earnings: 0.00
    },
    {
      sno: 5,
      name: "weee mljmjj",
      userType: "Seller",
      signedUp: "11/12/2022",
      ordered: 0,
      orderCompleted: 0,
      earnings: 0.00
    }
  ];

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  const filteredData = referralData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.userType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-6">
        Invite & Earn
      </h2>

      {/* Main Tabs */}
      <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setMainTab("referral-links")}
            className={`font-['Poppins',sans-serif] text-[14px] sm:text-[16px] pb-3 px-4 transition-all whitespace-nowrap flex-shrink-0 ${
              mainTab === "referral-links"
                ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                : "text-[#6b6b6b] hover:text-[#FE8A0F]"
            }`}
          >
            Referral Links
          </button>
          <button
            onClick={() => setMainTab("referral-report")}
            className={`font-['Poppins',sans-serif] text-[14px] sm:text-[16px] pb-3 px-4 transition-all whitespace-nowrap flex-shrink-0 ${
              mainTab === "referral-report"
                ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                : "text-[#6b6b6b] hover:text-[#FE8A0F]"
            }`}
          >
            Referral Report
          </button>
        </div>
      </div>

      {/* Referral Links Tab Content */}
      {mainTab === "referral-links" && (
        <div>
          {/* Banner */}
          <div className="relative bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] rounded-2xl overflow-hidden mb-8">
            {/* Starry Background Effect */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            <div className="relative flex items-center justify-between p-8">
              <div className="flex-1">
                <h3 className="font-['Poppins',sans-serif] text-white mb-2" style={{ fontSize: '32px', fontWeight: 600 }}>
                  Invite Friends & You Both are Earn
                </h3>
                <p className="font-['Poppins',sans-serif] text-white/90 text-[16px]">
                  Introduce your friends to tradespeoplehub
                </p>
              </div>
              <div className="flex-shrink-0">
                <Gift className="w-32 h-32 text-[#FE8A0F]" />
              </div>
            </div>
          </div>

          {/* Shareable Links */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-4">
              Shareable Links
            </h3>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-6">
              Simply copy your referral link below and share it with friends, family, or your social network.
            </p>

            {/* Client Link */}
            <div className="mb-6">
              <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
                Client
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 flex gap-2 w-full">
                  <input
                    type="text"
                    value="https://sortars.com/signup/?referral=65985632"
                    readOnly
                    className="flex-1 h-10 px-4 border border-gray-300 rounded-lg font-['Poppins',sans-serif] text-[13px] bg-gray-50"
                  />
                  <Button
                    onClick={() => handleCopyLink("https://sortars.com/signup/?referral=65985632")}
                    variant="outline"
                    className="font-['Poppins',sans-serif] text-[14px] whitespace-nowrap"
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex gap-2">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mr-2">Share on</span>
                  <button
                    onClick={() => handleShareFacebook("https://sortars.com/signup/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] rounded-lg transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-5 h-5 text-white" fill="white" />
                  </button>
                  <button
                    onClick={() => handleShareTwitter("https://sortars.com/signup/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#1DA1F2] hover:bg-[#1A8CD8] rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-5 h-5 text-white" fill="white" />
                  </button>
                  <button
                    onClick={() => handleShareEmail("https://sortars.com/signup/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#EA4335] hover:bg-[#D93025] rounded-lg transition-colors"
                    title="Share via Email"
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp("https://sortars.com/signup/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#25D366] hover:bg-[#20BD5A] rounded-lg transition-colors"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 text-white" fill="white" />
                  </button>
                </div>
              </div>
            </div>

            {/* General Link */}
            <div>
              <div className="flex gap-2 items-start sm:items-center flex-col sm:flex-row">
                <div className="flex-1 flex gap-2 w-full">
                  <input
                    type="text"
                    value="https://sortars.com/?referral=65985632"
                    readOnly
                    className="flex-1 h-10 px-4 border border-gray-300 rounded-lg font-['Poppins',sans-serif] text-[13px] bg-gray-50"
                  />
                  <Button
                    onClick={() => handleCopyLink("https://sortars.com/?referral=65985632")}
                    variant="outline"
                    className="font-['Poppins',sans-serif] text-[14px] whitespace-nowrap"
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex gap-2">
                  <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mr-2">Share on</span>
                  <button
                    onClick={() => handleShareFacebook("https://sortars.com/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] rounded-lg transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-5 h-5 text-white" fill="white" />
                  </button>
                  <button
                    onClick={() => handleShareTwitter("https://sortars.com/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#1DA1F2] hover:bg-[#1A8CD8] rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-5 h-5 text-white" fill="white" />
                  </button>
                  <button
                    onClick={() => handleShareEmail("https://sortars.com/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#EA4335] hover:bg-[#D93025] rounded-lg transition-colors"
                    title="Share via Email"
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp("https://sortars.com/?referral=65985632")}
                    className="w-9 h-9 flex items-center justify-center bg-[#25D366] hover:bg-[#20BD5A] rounded-lg transition-colors"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 text-white" fill="white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Report Tab Content */}
      {mainTab === "referral-report" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-6">
            Referral Report
          </h3>

          {/* Tabs */}
          <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveReferralTab("order")}
                className={`font-['Poppins',sans-serif] text-[14px] pb-3 px-4 transition-all whitespace-nowrap flex-shrink-0 ${
                  activeReferralTab === "order"
                    ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                    : "text-[#6b6b6b] hover:text-[#FE8A0F]"
                }`}
              >
                Order
              </button>
              <button
                onClick={() => setActiveReferralTab("posted-task")}
                className={`font-['Poppins',sans-serif] text-[14px] pb-3 px-4 transition-all whitespace-nowrap flex-shrink-0 ${
                  activeReferralTab === "posted-task"
                    ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                    : "text-[#6b6b6b] hover:text-[#FE8A0F]"
                }`}
              >
                Posted Task
              </button>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Show</span>
              <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                <SelectTrigger className="w-[80px] h-9 font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">entries</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Search:</span>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[200px] h-9 font-['Poppins',sans-serif] text-[14px]"
                placeholder=""
              />
            </div>
          </div>

          {/* Referral Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("sno")}
                  >
                    <div className="flex items-center gap-2">
                      S.no
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("userType")}
                  >
                    <div className="flex items-center gap-2">
                      User Type
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("signedUp")}
                  >
                    <div className="flex items-center gap-2">
                      Signed-up
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("ordered")}
                  >
                    <div className="flex items-center gap-2">
                      Ordered
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("orderCompleted")}
                  >
                    <div className="flex items-center gap-2">
                      Order Completed
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("earnings")}
                  >
                    <div className="flex items-center gap-2">
                      Earnings
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.sno} className="hover:bg-gray-50">
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.sno}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.name}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.userType}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.signedUp}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.ordered}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.orderCompleted}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px]">
                      {item.earnings.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// Services Section - Professional Only
function ServicesSection() {
  const [activeTab, setActiveTab] = useState<"myservices" | "packageservice" | "reviews" | "analytics">("myservices");
  const [isAddingPackageService, setIsAddingPackageService] = useState(false);
  const { userInfo } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isModificationReasonDialogOpen, setIsModificationReasonDialogOpen] = useState(false);
  const [isDeniedReasonDialogOpen, setIsDeniedReasonDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isToggleDisableDialogOpen, setIsToggleDisableDialogOpen] = useState(false);
  const [serviceToToggle, setServiceToToggle] = useState<{ id: string; currentStatus: boolean } | null>(null);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState("10");

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      if (!userInfo?.id) return;
      
      try {
        setLoading(true);
        const { resolveApiUrl } = await import("../config/api");
        const response = await fetch(
          resolveApiUrl(`/api/services?professionalId=${userInfo.id}&activeOnly=false`),
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          const services = data.services || [];
          // Debug: Check services including draft status
          // console.log('Fetched services:', services.map((s: any) => ({
          //   _id: s._id,
          //   title: s.title,
          //   status: s.status,
          //   modificationReason: s.modificationReason
          // })));
          // console.log('Draft services count:', services.filter((s: any) => s.status === 'draft').length);
          setMyServices(services);
        } else {
          setMyServices([]);
        }
      } catch (error) {
        setMyServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [userInfo?.id]);

  // Mock reviews data
  const serviceReviews = ([
    {
      id: 1,
      serviceTitle: "Bathroom Installation",
      clientName: "David Miller",
      clientAvatar: undefined,
      rating: 5,
      comment: "Excellent work! Very professional and finished on time. The bathroom looks amazing.",
      date: "2024-11-01",
    },
    {
      id: 2,
      serviceTitle: "Emergency Plumbing",
      clientName: "Lisa Anderson",
      clientAvatar: undefined,
      rating: 5,
      comment: "Arrived quickly and fixed the issue efficiently. Highly recommend!",
      date: "2024-10-28",
    },
    {
      id: 3,
      serviceTitle: "Kitchen Sink Repair",
      clientName: "James Taylor",
      clientAvatar: undefined,
      rating: 4,
      comment: "Good service, arrived on time and completed the work well.",
      date: "2024-10-25",
    },
  ]).map((r) => ({
    ...r,
    clientAvatar: undefined,
  }));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleAddService = async (serviceData: any) => {
    // Check if user is blocked
    if (userInfo?.isBlocked) {
      toast.error("Your account has been blocked. You cannot add services. Please contact support.");
      setIsAddServiceOpen(false);
      setIsAddingPackageService(false);
      return;
    }
    
    try {
      setRefreshing(true);
      // Refresh services list
      const { resolveApiUrl } = await import("../config/api");
      const response = await fetch(
        resolveApiUrl(`/api/services?professionalId=${userInfo?.id}&activeOnly=false`),
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMyServices(data.services || []);
      }
    } catch (error) {
    } finally {
      setRefreshing(false);
      setIsAddServiceOpen(false);
      setIsAddingPackageService(false);
    }
  };

  const handleEditService = (service: any) => {
    // Check if user is blocked
    if (userInfo?.isBlocked) {
      toast.error("Your account has been blocked. You cannot edit services. Please contact support.");
      return;
    }
    setSelectedService(service);
    setIsEditServiceOpen(true);
  };

  const handleUpdateService = async (serviceData: any) => {
    // Check if user is blocked
    if (userInfo?.isBlocked) {
      toast.error("Your account has been blocked. You cannot update services. Please contact support.");
      setIsEditServiceOpen(false);
      setSelectedService(null);
      return;
    }
    
    try {
      setRefreshing(true);
      // Refresh services list
      const { resolveApiUrl } = await import("../config/api");
      const response = await fetch(
        resolveApiUrl(`/api/services?professionalId=${userInfo?.id}&activeOnly=false`),
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMyServices(data.services || []);
      }
    } catch (error) {
      toast.error("Failed to refresh services list");
    } finally {
      setRefreshing(false);
      setIsEditServiceOpen(false);
      setSelectedService(null);
    }
  };

  const handleToggleServiceDisable = (serviceId: string, currentStatus: boolean) => {
    setServiceToToggle({ id: serviceId, currentStatus });
    setIsToggleDisableDialogOpen(true);
  };

  const confirmToggleServiceDisable = async () => {
    if (!serviceToToggle) return;

    try {
      const { resolveApiUrl } = await import("../config/api");
      const response = await fetch(
        resolveApiUrl(`/api/services/${serviceToToggle.id}/toggle-disable`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ isActive: !serviceToToggle.currentStatus }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the service in the local state, including status
        setMyServices(prevServices =>
          prevServices.map(service =>
            service._id === serviceToToggle.id
              ? { ...service, isActive: data.service.isActive, status: data.service.status }
              : service
          )
        );
        toast.success(
          data.service.isActive
            ? "Service enabled successfully"
            : "Service disabled successfully"
        );
        setIsToggleDisableDialogOpen(false);
        setServiceToToggle(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to toggle service status");
      }
    } catch (error) {
      toast.error("Failed to toggle service status");
    }
  };

  const handleDeleteService = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      setRefreshing(true);
      const { resolveApiUrl } = await import("../config/api");
      const response = await fetch(
        resolveApiUrl(`/api/services/${serviceToDelete}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Remove from local state (use functional update to avoid stale closure)
        setMyServices((prevServices) =>
          prevServices.filter((s) => s._id !== serviceToDelete)
        );
        toast.success("Service deleted successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete service");
      }
    } catch (error: any) {
      toast.error("Failed to delete service. Please try again.");
    } finally {
      setRefreshing(false);
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleSavePackage = (packages: any[]) => {
    // Save packages to state
    setMyPackages(prev => [...prev, ...packages.map((pkg, idx) => ({
      ...pkg,
      id: `pkg-${Date.now()}-${idx}`,
    }))]);
    setIsCreatePackageOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "draft": "bg-purple-100 text-purple-700 border-purple-200",
      "pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "required_modification": "bg-orange-100 text-orange-700 border-orange-200",
      "denied": "bg-red-100 text-red-700 border-red-200",
      "paused": "bg-blue-100 text-blue-700 border-blue-200",
      "inactive": "bg-gray-100 text-gray-700 border-gray-200",
      "approved": "bg-green-100 text-green-700 border-green-200",
      "blocked": "bg-red-200 text-red-800 border-red-300",
      // Legacy support
      "Active": "bg-green-100 text-green-700 border-green-200",
      "Paused": "bg-blue-100 text-blue-700 border-blue-200",
      "Inactive": "bg-gray-100 text-gray-700 border-gray-200",
      "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Draft": "bg-purple-100 text-purple-700 border-purple-200",
    };
    return styles[status.toLowerCase()] || styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "draft": "Draft",
      "pending": "Pending",
      "required_modification": "Required Modification",
      "denied": "Denied",
      "paused": "Paused",
      "inactive": "Inactive",
      "approved": "Approved",
      "blocked": "Inactive (Contact Support)",
    };
    return labels[status.toLowerCase()] || labels[status] || status || "Unknown";
  };

  // Check if AddServiceSection is open (including package service)
  const isServiceSectionOpen = isAddServiceOpen || isEditServiceOpen || isAddingPackageService;

  return (
    <div className={isServiceSectionOpen ? "h-full flex flex-col" : ""}>
      {/* Hide title and description when AddServiceSection is open */}
      {!isServiceSectionOpen && (
        <>
          <div className="mb-6">
            <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
              Service Management
            </h2>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              Manage your services, reviews, and performance analytics
            </p>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex gap-2 pb-2 border-b-2 border-gray-100">
            {[
              { id: "myservices", label: "Single Service", icon: Briefcase },
              { id: "packageservice", label: "Package Service", icon: Package },
              { id: "reviews", label: "Reviews", icon: Heart },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? "bg-[#FFF5EB] text-[#FE8A0F] border-[#FE8A0F]"
                      : "text-[#6b6b6b] hover:bg-gray-50 hover:text-[#2c353f] border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-['Poppins',sans-serif] text-[14px]">
                    {tab.label}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </>
      )}

      {/* Single Service Tab */}
      {activeTab === "myservices" && (
        <div className={isServiceSectionOpen ? "flex-1 flex flex-col min-h-0" : ""}>
          {/* Show Add Service Section or Service List */}
          {isAddServiceOpen ? (
            <div className="flex-1 flex flex-col min-h-0">
              <AddServiceSection
                onClose={() => setIsAddServiceOpen(false)}
                onSave={handleAddService}
                isPackageService={false}
              />
            </div>
          ) : isEditServiceOpen && selectedService ? (
            <div className="flex-1 flex flex-col min-h-0">
              <AddServiceSection
                onClose={() => {
                  setIsEditServiceOpen(false);
                  setSelectedService(null);
                }}
                onSave={handleUpdateService}
                initialService={selectedService}
                isPackageService={selectedService.packages && Array.isArray(selectedService.packages) && selectedService.packages.length > 0}
              />
            </div>
          ) : (
            <>
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-10 font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#FE8A0F]"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => {
              setFilterStatus(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}>
              <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif] text-[14px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="required_modification">Required Modification</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                if (userInfo?.isBlocked) {
                  toast.error("Your account has been blocked. You cannot add services. Please contact support.");
                  return;
                }
                setIsAddServiceOpen(true);
              }}
              disabled={userInfo?.isBlocked}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Table Controls - Rows per page */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Show</span>
              <Select value={entriesPerPage} onValueChange={(value) => {
                setEntriesPerPage(value);
                setCurrentPage(1); // Reset to first page when changing entries per page
              }}>
                <SelectTrigger className="w-[80px] h-9 font-['Poppins',sans-serif] text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">entries</span>
            </div>
          </div>

          {/* Services Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <TableRow className="border-b border-gray-200/50">
                  <TableHead className="font-['Poppins',sans-serif]">Active</TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100/70 transition-all duration-200 shadow-sm"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2">
                      Service Name
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead className="font-['Poppins',sans-serif]">Category</TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100/70 transition-all duration-200 shadow-sm"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100/70 transition-all duration-200 shadow-sm"
                    onClick={() => handleSort("bookings")}
                  >
                    <div className="flex items-center gap-2">
                      Bookings
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead className="font-['Poppins',sans-serif]">Rating</TableHead>
                  <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
                  <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F] mr-2" />
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Loading services...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  // Filter services - only show services without packages in "myservices" tab
                  const singleServices = myServices.filter((service) => 
                    !service.packages || !Array.isArray(service.packages) || service.packages.length === 0
                  );
                  
                  if (singleServices.length === 0) {
                    return (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            No single services found. Click "Add Service" to create your first service.
                      </p>
                    </TableCell>
                  </TableRow>
                    );
                  }
                  
                  const filteredServices = singleServices.filter((service) => {
                    const matchesSearch = !searchQuery ||
                      service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = filterStatus === "all" ||
                      service.status?.toLowerCase() === filterStatus.toLowerCase();

                    // Debug logging for draft services
                    if (service.status === 'draft') {
                    }

                    return matchesSearch && matchesStatus;
                  });

                  // Sort services
                  const sortedServices = filteredServices.sort((a, b) => {
                    let aValue: any = a[sortField];
                    let bValue: any = b[sortField];

                    if (sortField === "date") {
                      aValue = new Date(a.createdAt || 0).getTime();
                      bValue = new Date(b.createdAt || 0).getTime();
                    } else if (sortField === "price") {
                      aValue = a.price || 0;
                      bValue = b.price || 0;
                    }

                    if (sortDirection === "asc") {
                      return aValue > bValue ? 1 : -1;
                    } else {
                      return aValue < bValue ? 1 : -1;
                    }
                  });

                  // Apply pagination
                  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
                  const endIndex = startIndex + parseInt(entriesPerPage);
                  const paginatedServices = sortedServices.slice(startIndex, endIndex);

                  // Check if filtered results are empty
                  if (filteredServices.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            No services found matching your filters.
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return paginatedServices.map((service) => {
                      const categoryName = typeof service.serviceCategory === 'object' 
                        ? service.serviceCategory?.name 
                        : 'N/A';
                      const statusDisplay = getStatusLabel(service.status || 'pending');
                      
                      return (
                        <TableRow 
                          key={service._id} 
                          className="hover:bg-[#FFF5EB]/30 hover:shadow-md transition-all duration-200 border-b border-gray-100/50 bg-white"
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {service.status !== 'draft' && (
                              <Switch
                                checked={Boolean(service.isActive)}
                                onCheckedChange={() => handleToggleServiceDisable(service._id, Boolean(service.isActive))}
                                className="data-[state=checked]:bg-[#FE8A0F]"
                              />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={service.title}>
                              {service.title && service.title.length > 15
                                ? `${service.title.slice(0, 15)}...`
                                : service.title}
                            </p>
                          </TableCell>
                          <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                            {categoryName}
                          </TableCell>
                          <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            £{service.price?.toFixed(2) || '0.00'}
                            {service.priceUnit && service.priceUnit !== 'fixed' && (
                              <span className="text-[12px] text-[#8d8d8d] ml-1">
                                / {service.priceUnit.replace('per ', '')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                            {service.completedTasks || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                                {service.rating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-[#FE8A0F]">★</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusBadge(statusDisplay)} border font-['Poppins',sans-serif] text-[11px]`}>
                                {statusDisplay}
                              </Badge>
                              {service.status === 'denied' && service.deniedReason && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedService(service);
                                    setIsDeniedReasonDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                                  title="View denial reason"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {service.status === 'draft' ? (
                                // Draft service - show "Continue Editing" and "Delete" buttons
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditService(service);
                                    }}
                                    className="bg-[#FE8A0F] hover:bg-[#E67A00] text-white font-['Poppins',sans-serif] text-[12px]"
                                  >
                                    <Pencil className="w-3 h-3 mr-1" />
                                    Continue Editing
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteService(service._id);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    title="Delete Draft"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {service.status === 'required_modification' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // console.log('Alert icon clicked, service:', {
                                        //   _id: service._id,
                                        //   title: service.title,
                                        //   status: service.status,
                                        //   modificationReason: service.modificationReason
                                        // });
                                        setSelectedService(service);
                                        setIsModificationReasonDialogOpen(true);
                                        // console.log('Dialog state set to true, isModificationReasonDialogOpen should be true');
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                      title={service.modificationReason ? "View Modification Reason" : "No modification reason available"}
                                    >
                                      <AlertCircle className="w-4 h-4 text-red-600" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Only allow viewing approved services
                                      if (service.status === 'approved') {
                                        const serviceIdentifier = service.slug || service._id;
                                        if (serviceIdentifier) {
                                          window.open(`/service/${serviceIdentifier}`, '_blank');
                                        }
                                      } else {
                                        toast.error(`This service is ${getStatusLabel(service.status || 'pending').toLowerCase()} and cannot be viewed. Only approved services can be viewed.`);
                                      }
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                                    title="View Service Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditService(service);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-[#FFF5EB] hover:text-[#FE8A0F]"
                                    title="Edit Service"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteService(service._id);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    title="Delete Service"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
              </TableBody>
            </Table>
          </div>

          {/* Service Stats - Filter by tab type */}
          {(() => {
            // Filter services based on active tab
            const tabServices = myServices.filter((service) => 
              !service.packages || !Array.isArray(service.packages) || service.packages.length === 0
            );
            
            return (
          <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mt-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            <div className="bg-gradient-to-br from-[#EFF6FF] to-white p-3 md:p-4 rounded-xl border border-[#3B82F6]/20 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Services</p>
                  <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">{tabServices.length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-3 md:p-4 rounded-xl border border-[#FE8A0F]/20 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Approved Services</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                    {tabServices.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-3 md:p-4 rounded-xl border border-green-200 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Bookings</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                    {tabServices.reduce((sum, s) => sum + (s.completedTasks || 0), 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-3 md:p-4 rounded-xl border border-purple-200 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Avg Rating</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                    {tabServices.length > 0 
                      ? (tabServices.reduce((sum, s) => sum + (s.rating || 0), 0) / tabServices.length).toFixed(1)
                  : '0.0'
                } ★
              </p>
            </div>
          </div>
            );
          })()}

          {/* Pagination Controls */}
          {(() => {
            const filteredServices = myServices.filter((service) => {
              const matchesSearch = !searchQuery ||
                service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = filterStatus === "all" ||
                service.status?.toLowerCase() === filterStatus.toLowerCase();
              return matchesSearch && matchesStatus;
            });

            const totalPages = Math.ceil(filteredServices.length / parseInt(entriesPerPage));

            if (totalPages <= 1) return null;

            return (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Showing {((currentPage - 1) * parseInt(entriesPerPage)) + 1} to {Math.min(currentPage * parseInt(entriesPerPage), filteredServices.length)} of {filteredServices.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="font-['Poppins',sans-serif] text-[14px]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 p-0 font-['Poppins',sans-serif] text-[14px] ${
                              currentPage === page ? "bg-[#FE8A0F] hover:bg-[#FFB347]" : ""
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="font-['Poppins',sans-serif] text-[14px]"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })()}
            </>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {/* Package Service Tab */}
      {activeTab === "packageservice" && (
        <div className={isServiceSectionOpen ? "flex-1 flex flex-col min-h-0" : ""}>
          {/* Show Add Service Section or Service List */}
          {isAddingPackageService ? (
            <div className="flex-1 flex flex-col min-h-0">
              <AddServiceSection
                onClose={() => setIsAddingPackageService(false)}
                onSave={handleAddService}
                isPackageService={true}
              />
            </div>
          ) : isEditServiceOpen && selectedService ? (
            <div className="flex-1 flex flex-col min-h-0">
              <AddServiceSection
                onClose={() => {
                  setIsEditServiceOpen(false);
                  setSelectedService(null);
                }}
                onSave={handleUpdateService}
                initialService={selectedService}
                isPackageService={true}
              />
            </div>
          ) : (
            <>
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <Input
                placeholder="Search package services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#FE8A0F]"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => {
              setFilterStatus(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif] text-[14px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="required_modification">Required Modification</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                if (userInfo?.isBlocked) {
                  toast.error("Your account has been blocked. You cannot add services. Please contact support.");
                  return;
                }
                setIsAddingPackageService(true);
              }}
              disabled={userInfo?.isBlocked}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Package Service
            </Button>
          </div>

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
              <strong>Package Service:</strong> Create services with multiple package options. The package step is required as the 2nd step in the creation process.
            </p>
          </div>

          {/* Service Stats - Package Services */}
          {(() => {
            const packageServices = myServices.filter((service) => 
              service.packages && Array.isArray(service.packages) && service.packages.length > 0
            );
            
            return (
              <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                <div className="bg-gradient-to-br from-[#EFF6FF] to-white p-3 md:p-4 rounded-xl border border-[#3B82F6]/20 min-w-[200px] md:min-w-0 flex-shrink-0">
                  <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Package Services</p>
                  <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">{packageServices.length}</p>
                </div>
                <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-3 md:p-4 rounded-xl border border-[#FE8A0F]/20 min-w-[200px] md:min-w-0 flex-shrink-0">
                  <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Approved Services</p>
                  <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                    {packageServices.filter(s => s.status === 'approved').length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white p-3 md:p-4 rounded-xl border border-green-200 min-w-[200px] md:min-w-0 flex-shrink-0">
                  <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Bookings</p>
                  <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                    {packageServices.reduce((sum, s) => sum + (s.completedTasks || 0), 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white p-3 md:p-4 rounded-xl border border-purple-200 min-w-[200px] md:min-w-0 flex-shrink-0">
                  <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Avg Rating</p>
                  <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">
                    {packageServices.length > 0 
                      ? (packageServices.reduce((sum, s) => sum + (s.rating || 0), 0) / packageServices.length).toFixed(1)
                      : '0.0'
                    } ★
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Filter services that have packages */}
          {(() => {
            const packageServices = myServices.filter((service) => 
              service.packages && Array.isArray(service.packages) && service.packages.length > 0
            );
            
            // Apply search and filter
            const filteredServices = packageServices.filter((service) => {
              const matchesSearch = !searchQuery || 
                service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = filterStatus === "all" || 
                (service.status?.toLowerCase() === filterStatus.toLowerCase());
              return matchesSearch && matchesStatus;
            });

            // Sort services
            const sortedServices = [...filteredServices].sort((a, b) => {
              let aValue: any, bValue: any;
              switch (sortField) {
                case "title":
                  aValue = a.title?.toLowerCase() || "";
                  bValue = b.title?.toLowerCase() || "";
                  break;
                case "price":
                  aValue = parseFloat(a.price) || 0;
                  bValue = parseFloat(b.price) || 0;
                  break;
                case "date":
                  aValue = new Date(a.createdAt).getTime();
                  bValue = new Date(b.createdAt).getTime();
                  break;
                default:
                  return 0;
              }
              if (sortDirection === "asc") {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
              } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
              }
            });

            // Pagination
            const entriesPerPageNum = parseInt(entriesPerPage);
            const startIndex = (currentPage - 1) * entriesPerPageNum;
            const endIndex = startIndex + entriesPerPageNum;
            const paginatedServices = sortedServices.slice(startIndex, endIndex);
            const totalPages = Math.ceil(sortedServices.length / entriesPerPageNum);

            return (
              <>
                {/* Table Controls - Rows per page */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Show</span>
                    <Select value={entriesPerPage} onValueChange={(value) => {
                      setEntriesPerPage(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-[80px] h-9 font-['Poppins',sans-serif] text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">entries</span>
                  </div>
                </div>

                {/* Services Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <TableRow className="border-b border-gray-200/50">
                        <TableHead className="font-['Poppins',sans-serif]">Active</TableHead>
                        <TableHead 
                          className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100/70 transition-all duration-200 shadow-sm"
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            Service Name
                            <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                          </div>
                        </TableHead>
                        <TableHead className="font-['Poppins',sans-serif]">Packages</TableHead>
                        <TableHead className="font-['Poppins',sans-serif]">Category</TableHead>
                        <TableHead 
                          className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100/70 transition-all duration-200 shadow-sm"
                          onClick={() => handleSort("price")}
                        >
                          <div className="flex items-center gap-2">
                            Price
                            <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                          </div>
                        </TableHead>
                        <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
                        <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F] mr-2" />
                              <span className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">Loading services...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedServices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                              No package services found. Click "Add Package Service" to create your first package service.
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedServices.map((service) => (
                          <TableRow key={service._id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell>
                              <Switch
                                checked={service.isActive !== false}
                                onCheckedChange={() => handleToggleServiceDisable(service._id, service.isActive !== false)}
                                disabled={refreshing}
                              />
                            </TableCell>
                            <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              <div className="max-w-xs">
                                <p className="font-medium truncate" title={service.title || "Untitled"}>
                                  {service.title && service.title.length > 30 
                                    ? `${service.title.substring(0, 30)}...` 
                                    : (service.title || "Untitled")}
                                </p>
                                <p className="text-[12px] text-[#6b6b6b] line-clamp-2 mt-1">
                                  {service.description || "No description"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              <Badge variant="outline" className="font-['Poppins',sans-serif]">
                                {service.packages?.length || 0} packages
                              </Badge>
                            </TableCell>
                            <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              {service.serviceCategory?.name || "N/A"}
                            </TableCell>
                            <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] whitespace-nowrap">
                              £{service.price?.toFixed(2) || "0.00"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge className={`font-['Poppins',sans-serif] text-[11px] ${getStatusBadge(service.status)}`}>
                                  {getStatusLabel(service.status)}
                                </Badge>
                                {service.status === 'denied' && service.deniedReason && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedService(service);
                                      setIsDeniedReasonDialogOpen(true);
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                                    title="View denial reason"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditService(service)}
                                  disabled={refreshing || userInfo?.isBlocked}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteService(service._id)}
                                  disabled={refreshing}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      Showing {startIndex + 1} to {Math.min(endIndex, sortedServices.length)} of {sortedServices.length} package services
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                        variant="outline"
                        className="font-['Poppins',sans-serif]"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                        variant="outline"
                        className="font-['Poppins',sans-serif]"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
            </>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div>
          {/* Reviews content will be implemented here */}
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Reviews section coming soon
          </p>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          {/* Analytics content will be implemented here */}
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Analytics section coming soon
          </p>
        </div>
      )}

      {/* Global Dialogs for ServicesSection */}
          {/* Modification Reason Dialog */}
      <Dialog
        open={isModificationReasonDialogOpen}
        onOpenChange={(open) => {
            setIsModificationReasonDialogOpen(open);
            if (!open) {
              setSelectedService(null);
            }
        }}
      >
            <DialogContent className="font-['Poppins',sans-serif] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[18px] text-[#2c353f] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Modification Required
                </DialogTitle>
                <DialogDescription className="text-[14px] text-[#6b6b6b]">
              Your service "{selectedService?.title || "Unknown"}" requires modifications before it can be approved.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[14px] text-[#2c353f] font-medium mb-2">Reason:</p>
                <p className="text-[14px] text-[#6b6b6b] whitespace-pre-wrap">
              {selectedService?.modificationReason || "No reason provided."}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button
                  onClick={() => {
                    setIsModificationReasonDialogOpen(false);
                    setSelectedService(null);
                  }}
                  className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white font-['Poppins',sans-serif]"
                >
                  Understood
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Service Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="font-['Poppins',sans-serif]">
              <DialogHeader>
                <DialogTitle className="text-[18px] text-[#2c353f]">
                  Delete Service
                </DialogTitle>
                <DialogDescription className="text-[14px] text-[#6b6b6b]">
                  Are you sure you want to delete this service? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setServiceToDelete(null);
                  }}
                  className="font-['Poppins',sans-serif]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteService}
                  className="bg-red-600 hover:bg-red-700 text-white font-['Poppins',sans-serif]"
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Denied Reason Dialog */}
          <Dialog
            open={isDeniedReasonDialogOpen}
            onOpenChange={(open) => {
              setIsDeniedReasonDialogOpen(open);
              if (!open) {
                setSelectedService(null);
              }
            }}
          >
            <DialogContent className="font-['Poppins',sans-serif] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[18px] text-[#2c353f] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Service Denied
                </DialogTitle>
                <DialogDescription className="text-[14px] text-[#6b6b6b]">
                  Your service "{selectedService?.title || "Unknown"}" has been denied.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[14px] text-[#2c353f] font-medium mb-2">Reason:</p>
                <p className="text-[14px] text-[#6b6b6b] whitespace-pre-wrap">
                  {selectedService?.deniedReason || "No reason provided."}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button
                  onClick={() => {
                    setIsDeniedReasonDialogOpen(false);
                    setSelectedService(null);
                  }}
                  className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white font-['Poppins',sans-serif]"
                >
                  Understood
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Toggle Service Disable/Enable Dialog */}
          <Dialog open={isToggleDisableDialogOpen} onOpenChange={setIsToggleDisableDialogOpen}>
            <DialogContent className="font-['Poppins',sans-serif]">
              <DialogHeader>
                <DialogTitle className="text-[18px] text-[#2c353f] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  {serviceToToggle?.currentStatus ? "Disable Service" : "Enable Service"}
                </DialogTitle>
                <DialogDescription className="text-[14px] text-[#6b6b6b]">
                  {serviceToToggle?.currentStatus
                    ? "Are you sure you want to disable this service? It will be hidden from clients."
                    : "Are you sure you want to enable this service? It will become visible to clients again."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsToggleDisableDialogOpen(false);
                    setServiceToToggle(null);
                  }}
                  className="flex-1 font-['Poppins',sans-serif]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmToggleServiceDisable}
                  className={`flex-1 font-['Poppins',sans-serif] ${
                    serviceToToggle?.currentStatus
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {serviceToToggle?.currentStatus ? "Disable" : "Enable"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
    </div>
  );
}

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "paused":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "inactive":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

