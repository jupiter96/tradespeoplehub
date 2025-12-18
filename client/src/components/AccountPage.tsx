import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import defaultAvatar from "../assets/c1e5f236e69ba84c123ce1336bb460f448af2762.png";
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
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Wallet,
  History,
  PlusCircle,
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
  Eye,
  Building2,
  Banknote,
  ArrowDownToLine,
  AlertCircle,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Menu,
  ChevronLeft,
  ArrowLeft,
  Shield,
  Facebook,
  Twitter,
  Share2,
  Copy,
  Ticket,
  Package,
  PoundSterling,
} from "lucide-react";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount, ProfileUpdatePayload } from "./AccountContext";
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
import AddServiceSection from "./AddServiceSection";
import CreatePackageModal from "./CreatePackageModal";
import PromoCodeSection from "./PromoCodeSection";
import FavouriteSection from "./FavouriteSection";
import ProfileSection from "./ProfileSection";
import VerificationProgressModal from "./VerificationProgressModal";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import API_BASE_URL from "../config/api";
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, userInfo, logout, isLoggedIn } = useAccount();
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [verificationPendingCount, setVerificationPendingCount] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState<any>(null);
  const verificationModalRetryRef = useRef(0);
  const verificationModalTimeoutRef = useRef<number | null>(null);

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
  useEffect(() => {
    const isPro = userInfo?.role === "professional";
    if (!isLoggedIn || !isPro) return;

    let shouldShow = false;
    try {
      shouldShow = sessionStorage.getItem("showVerificationModalAfterLogin") === "1";
    } catch {
      shouldShow = false;
    }
    if (!shouldShow) return;

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

    const attemptFetchAndShow = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verification`, { credentials: "include" });
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
        setShowVerificationModal(hasUnpassed);
        clearFlag();
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
  const clientMenu = [
    { id: "overview", label: "Overview", icon: User },
    { id: "favourites", label: "Favourites", icon: Heart },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "my-jobs", label: "My Jobs", icon: FileText },
    { id: "details", label: "My Details", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
    { id: "messenger", label: "Messenger", icon: MessageCircle, badge: "3" },
    { id: "support", label: "Support Center", icon: HelpCircle },
    { id: "invite", label: "Invite & Earn", icon: Gift },
  ];

  // Menu items for Professional (dynamically generated to include verification badge)
  const professionalMenu = useMemo(() => [
    { id: "overview", label: "Overview", icon: User },
    { id: "profile", label: "Profile", icon: User },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "my-jobs", label: "My Jobs", icon: FileText },
    { id: "promo-code", label: "Promo Code", icon: Ticket },
    { 
      id: "verification", 
      label: "Verification", 
      icon: Shield,
      badge: verificationPendingCount > 0 ? verificationPendingCount.toString() : undefined
    },
    { id: "details", label: "My Details", icon: Settings },
    { id: "withdraw", label: "Withdraw", icon: Wallet },
    { id: "security", label: "Security", icon: Lock },
    { id: "messenger", label: "Messenger", icon: MessageCircle, badge: "3" },
    { id: "support", label: "Support Center", icon: HelpCircle },
    { id: "invite", label: "Invite & Earn", icon: Gift },
  ], [verificationPendingCount]);

  const menuItems = userRole === "client" ? clientMenu : professionalMenu;

  return (
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
                    <AvatarImage src={userInfo?.avatar} />
                    <AvatarFallback className="bg-[#FE8A0F] text-white font-['Poppins',sans-serif] text-[20px]">
                      {(() => {
                        if (userInfo?.firstName && userInfo?.lastName) {
                          return (userInfo.firstName[0] + userInfo.lastName[0]).toUpperCase();
                        }
                        const name = userInfo?.name || "";
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
                      {userRole === "professional" && userInfo?.tradingName
                        ? userInfo.tradingName
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
              {activeSection === "promo-code" && userRole === "professional" && <PromoCodeSection />}
              {activeSection === "verification" && (
                <AccountVerificationSection 
                  onVerificationStatusChange={() => {
                    // Refresh verification status when status changes
                    if (userRole === "professional" && isLoggedIn) {
                      fetch(`${API_BASE_URL}/api/auth/verification`, {
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
                        .catch(err => console.error("Error refreshing verification:", err));
                    }
                  }}
                />
              )}
              {activeSection === "details" && <DetailsSection />}
              {activeSection === "billing" && <BillingSection />}
              {activeSection === "withdraw" && <WithdrawSection />}
              {activeSection === "security" && <SecuritySection />}
              {activeSection === "messenger" && <MessengerSection />}
              {activeSection === "support" && <SupportSection />}
              {activeSection === "invite" && <InviteSection />}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
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
                <Tooltip 
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
      
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-[#EFF6FF] to-[#FFF5EB] border border-[#3B82F6]/30 rounded-xl p-6 mb-8">
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
      clientAvatar: defaultAvatar,
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
    clientAvatar: defaultAvatar,
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
                        <AvatarImage src={job.clientAvatar} alt={job.client} />
                        <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif] text-[12px]">
                          {job.client.split(' ').map(n => n[0]).join('')}
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
                        <AvatarImage src={selectedJob.clientAvatar} alt={selectedJob.client} />
                        <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif]">
                          {selectedJob.client.split(' ').map((n: string) => n[0]).join('')}
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
  const { userInfo, userRole, updateProfile, requestEmailChangeOTP, requestPhoneChangeOTP, verifyOTP, uploadAvatar, removeAvatar } = useAccount();
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
      console.log('[AccountPage] userInfo updated, updating formData:', {
        townCity: userInfo.townCity,
        county: userInfo.county,
        address: userInfo.address,
        postcode: userInfo.postcode,
      });
    setFormData(buildFormState(initialFormState));
    }
  }, [userInfo, buildFormState, initialFormState]);

  // Sectors and services data (same as ProfessionalProfileSetup)
  const sectors = {
    "Home & Garden": [
      "Basic Outline Plans for quote and planning applications",
      "Full regulation plans for builder and building reg",
      "Structural calculations",
      "Bathroom Fitters",
      "Handyman",
      "Builders",
      "Gardeners",
      "Cleaners",
      "Plumbers",
      "Electricians",
      "Painters & Decorators",
      "Carpenters",
      "Landscaping",
      "Roofing",
      "Kitchen Fitters"
    ],
    "Business Services": [
      "Legal & Advice",
      "Accounting & Bookkeeping",
      "Marketing & Advertising",
      "Web Design & Development",
      "Graphic Design",
      "Content Writing",
      "SEO Services",
      "Social Media Management",
      "Business Consulting",
      "Virtual Assistant"
    ],
    "Personal Services": [
      "Personal Training",
      "Massage Therapy",
      "Hair & Beauty",
      "Photography",
      "Event Planning",
      "Catering",
      "Tutoring",
      "Music Lessons",
      "Pet Care",
      "Childcare"
    ],
    "Repair & Maintenance": [
      "General Repairs",
      "Appliance Repair",
      "Furniture Repair",
      "Lock & Key Services",
      "Window & Door Repair",
      "Drywall Repair",
      "Fence Repair",
      "Pressure Washing"
    ],
    "Technology Services": [
      "Computer Repair",
      "IT Support",
      "Software Development",
      "Network Setup",
      "Data Recovery",
      "Phone Repair",
      "Smart Home Installation",
      "Cybersecurity"
    ],
    "Education & Tutoring": [
      "Academic Tutoring",
      "Language Learning",
      "Music Lessons",
      "Art Classes",
      "Test Preparation",
      "Career Coaching",
      "Professional Training",
      "Online Courses"
    ],
    "Beauty & Wellness": [
      "Hair Styling",
      "Makeup Services",
      "Nail Services",
      "Spa Services",
      "Skin Care",
      "Barber Services",
      "Beauty Consultation",
      "Mobile Beauty Services"
    ],
    "Health & Wellness": [
      "Physiotherapy",
      "Nutrition Consulting",
      "Yoga Instruction",
      "Mental Health Counseling",
      "Chiropractor",
      "Acupuncture",
      "Personal Care",
      "Fitness Training"
    ],
    "Legal & Financial": [
      "Legal Consulting",
      "Tax Services",
      "Financial Planning",
      "Accounting",
      "Insurance Services",
      "Real Estate Law",
      "Business Law",
      "Estate Planning"
    ],
    "Event Services": [
      "Event Planning",
      "Catering",
      "Photography",
      "Videography",
      "DJ Services",
      "Decoration",
      "Entertainment",
      "Venue Setup"
    ],
    "Pet Services": [
      "Pet Grooming",
      "Dog Walking",
      "Pet Sitting",
      "Veterinary Services",
      "Pet Training",
      "Pet Photography",
      "Pet Transportation",
      "Pet Boarding"
    ],
    "Automotive": [
      "Car Repair & Maintenance",
      "Mobile Mechanic",
      "Car Detailing",
      "Tyre Services",
      "Car Inspection",
      "Auto Electrical",
      "Body Shop & Paint",
      "Car Locksmith"
    ],
    "Moving & Storage": [
      "House Moving",
      "Office Relocation",
      "Packing Services",
      "Storage Solutions",
      "Furniture Moving",
      "International Moving",
      "Same Day Moving",
      "Moving Supplies"
    ]
  };

  const handleSaveChanges = async () => {
    if (!userInfo) {
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.postcode) {
      toast.error("Please complete the required fields.");
      return;
    }

    // Check if email or phone changed and require OTP verification
    const emailIsChanged = formData.email.trim() !== (userInfo?.email || "");
    const phoneIsChanged = formData.phone.trim() !== (userInfo?.phone || "");
    
    if (emailIsChanged && !emailOTPVerified) {
      toast.error("Please verify your new email address with the OTP code");
      return;
    }

    if (phoneIsChanged && !phoneOTPVerified) {
      toast.error("Please verify your new phone number with the OTP code");
      return;
    }
    setIsSaving(true);

    const payload: ProfileUpdatePayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
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
              {userInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
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
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6]"
            />
          </div>
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6]"
            />
          </div>
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Email Address
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const newEmail = e.target.value;
                setFormData({ ...formData, email: newEmail });
                const isChanged = newEmail.trim() !== (userInfo?.email || "");
                setEmailChanged(isChanged);
                if (isChanged) {
                  setEmailOTPVerified(false);
                  setEmailOTPSent(false);
                  setEmailOTPCode("");
                  setEmailOTPHint(null);
                }
              }}
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6]"
            />
            {emailChanged && !emailOTPVerified && (
              <div className="mt-2 space-y-2">
                {!emailOTPSent ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      setIsSendingEmailOTP(true);
                      try {
                        const response = await requestEmailChangeOTP(formData.email);
                        setEmailOTPSent(true);
                        setEmailOTPHint(response?.emailCode || null);
                        toast.success("Verification code sent to new email");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to send verification code");
                      } finally {
                        setIsSendingEmailOTP(false);
                      }
                    }}
                    disabled={isSendingEmailOTP}
                    className="w-full h-9 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[12px] font-['Poppins',sans-serif]"
                  >
                    {isSendingEmailOTP ? "Sending..." : "Send Verification Code"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter 4-digit code"
                      value={emailOTPCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setEmailOTPCode(value);
                      }}
                      className="h-9 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] text-center tracking-widest"
                      maxLength={4}
                    />
                    {emailOTPHint && (
                      <p className="text-[11px] text-red-600 font-['Poppins',sans-serif] text-center">
                        Hint: {emailOTPHint}
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={async () => {
                        if (emailOTPCode.length !== 4) {
                          toast.error("Please enter a 4-digit code");
                          return;
                        }
                        setIsVerifyingEmailOTP(true);
                        try {
                          await verifyOTP(emailOTPCode, 'email');
                          setEmailOTPVerified(true);
                          toast.success("Email verified successfully");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Invalid verification code");
                        } finally {
                          setIsVerifyingEmailOTP(false);
                        }
                      }}
                      disabled={isVerifyingEmailOTP || emailOTPCode.length !== 4}
                      className="w-full h-9 bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-['Poppins',sans-serif]"
                    >
                      {isVerifyingEmailOTP ? "Verifying..." : "Verify Code"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
              Phone Number
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const newPhone = e.target.value;
                setFormData({...formData, phone: newPhone});
                const isChanged = newPhone.trim() !== (userInfo?.phone || "");
                setPhoneChanged(isChanged);
                if (isChanged) {
                  setPhoneOTPVerified(false);
                  setPhoneOTPSent(false);
                  setPhoneOTPCode("");
                  setPhoneOTPHint(null);
                }
              }}
              className="h-10 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] focus:border-[#3B82F6]"
            />
            {phoneChanged && !phoneOTPVerified && (
              <div className="mt-2 space-y-2">
                {!phoneOTPSent ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      console.log('[Phone Verification] AccountPage - Requesting phone change OTP for:', formData.phone);
                      setIsSendingPhoneOTP(true);
                      try {
                        const response = await requestPhoneChangeOTP(formData.phone);
                        console.log('[Phone Verification] AccountPage - Phone change OTP request successful');
                        setPhoneOTPSent(true);
                        // Only show hint in development (when Twilio is not configured)
                        if (response?.phoneCode) {
                          setPhoneOTPHint(response.phoneCode);
                          console.log('[Phone Verification] AccountPage - OTP code hint provided (development mode)');
                        } else {
                          setPhoneOTPHint(null);
                        }
                        toast.success("Verification code sent to your phone number");
                      } catch (error: any) {
                        console.error('[Phone Verification] AccountPage - Failed to send phone change OTP');
                        console.error('[Phone Verification] AccountPage - Error object:', error);
                        console.error('[Phone Verification] AccountPage - Error message:', error?.message);
                        console.error('[Phone Verification] AccountPage - Twilio error code:', error?.twilioErrorCode);
                        console.error('[Phone Verification] AccountPage - Twilio error message:', error?.twilioErrorMessage);
                        console.error('[Phone Verification] AccountPage - Twilio error moreInfo:', error?.twilioErrorMoreInfo);
                        
                        // Extract detailed error message
                        let errorMessage = "Failed to send verification code";
                        if (error?.message) {
                          errorMessage = error.message;
                        }
                        
                        // Add Twilio error details if available
                        if (error?.twilioErrorCode) {
                          errorMessage += ` (Twilio Error Code: ${error.twilioErrorCode})`;
                        }
                        if (error?.twilioErrorMoreInfo) {
                          errorMessage += ` - ${error.twilioErrorMoreInfo}`;
                        }
                        
                        toast.error(errorMessage);
                      } finally {
                        setIsSendingPhoneOTP(false);
                      }
                    }}
                    disabled={isSendingPhoneOTP}
                    className="w-full h-9 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[12px] font-['Poppins',sans-serif]"
                  >
                    {isSendingPhoneOTP ? "Sending..." : "Send Verification Code"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter 4-digit code"
                      value={phoneOTPCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneOTPCode(value);
                      }}
                      className="h-9 border-2 border-gray-200 rounded-xl font-['Poppins',sans-serif] text-[14px] text-center tracking-widest"
                      maxLength={4}
                    />
                    {phoneOTPHint && (
                      <p className="text-[11px] text-red-600 font-['Poppins',sans-serif] text-center">
                        Hint: {phoneOTPHint}
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={async () => {
                        if (phoneOTPCode.length !== 4) {
                          toast.error("Please enter a 4-digit code");
                          return;
                        }
                        console.log('[Phone Verification] AccountPage - Verifying phone OTP, code length:', phoneOTPCode.length);
                        setIsVerifyingPhoneOTP(true);
                        try {
                          await verifyOTP(phoneOTPCode, 'phone');
                          console.log('[Phone Verification] AccountPage - Phone OTP verified successfully');
                          setPhoneOTPVerified(true);
                          toast.success("Phone number verified successfully");
                        } catch (error) {
                          console.error('[Phone Verification] AccountPage - Phone OTP verification failed:', error);
                          const errorMessage = error instanceof Error ? error.message : "Invalid verification code";
                          toast.error(errorMessage);
                          // Clear the code input on error
                          setPhoneOTPCode("");
                        } finally {
                          setIsVerifyingPhoneOTP(false);
                        }
                      }}
                      disabled={isVerifyingPhoneOTP || phoneOTPCode.length !== 4}
                      className="w-full h-9 bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-['Poppins',sans-serif]"
                    >
                      {isVerifyingPhoneOTP ? "Verifying..." : "Verify Code"}
                    </Button>
                  </div>
                )}
              </div>
            )}
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

// Billing Section
function BillingSection() {
  const [billingTab, setBillingTab] = useState<"wallet" | "card" | "invoice" | "history">("wallet");

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
            <h3 className="font-['Poppins',sans-serif] text-[42px] mb-6">£2,450.00</h3>
            <div className="flex gap-3">
              <Button className="bg-white text-[#3D78CB] hover:bg-gray-100 font-['Poppins',sans-serif]">
                Add Funds
              </Button>
              <Button className="bg-white text-[#3D78CB] hover:bg-gray-100 font-['Poppins',sans-serif]">
                Withdraw
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Cards Content */}
      {billingTab === "card" && (
        <div className="space-y-4">
          <Button className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif] w-full md:w-auto">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Card
          </Button>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              No payment cards added yet
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Withdraw Section (Professional)
function WithdrawSection() {
  const [withdrawTab, setWithdrawTab] = useState<"balance" | "accounts" | "withdraw" | "history">("balance");
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [showAddPayPal, setShowAddPayPal] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState("");

  // Mock data
  const availableBalance = 3850.50;
  const pendingAmount = 1200.00;
  const totalEarnings = 12450.00;

  const bankAccounts = [
    {
      id: 1,
      accountName: "John Doe",
      bankName: "Barclays",
      accountNumber: "****1234",
      sortCode: "20-00-00",
      isDefault: true,
    },
    {
      id: 2,
      accountName: "John Doe Business",
      bankName: "HSBC",
      accountNumber: "****5678",
      sortCode: "40-00-00",
      isDefault: false,
    },
  ];

  const paymentMethods = [
    {
      id: 3,
      type: "PayPal",
      email: "john.doe@gmail.com",
      isVerified: true,
    },
  ];

  const withdrawHistory = [
    {
      id: "WD-001",
      date: "2024-11-08",
      amount: 1500.00,
      method: "Barclays ****1234",
      status: "Completed",
      processingTime: "2-3 business days",
    },
    {
      id: "WD-002",
      date: "2024-11-05",
      amount: 850.00,
      method: "PayPal",
      status: "Completed",
      processingTime: "1 business day",
    },
    {
      id: "WD-003",
      date: "2024-11-09",
      amount: 2000.00,
      method: "HSBC ****5678",
      status: "Pending",
      processingTime: "2-3 business days",
    },
  ];

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50) {
      alert("Minimum withdrawal amount is £50");
      return;
    }
    if (amount > availableBalance) {
      alert("Insufficient balance");
      return;
    }
    if (!selectedWithdrawMethod) {
      alert("Please select a withdrawal method");
      return;
    }
    alert(`Withdrawal request for £${amount} submitted successfully!`);
    setShowWithdrawDialog(false);
    setWithdrawAmount("");
    setSelectedWithdrawMethod("");
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
                £{availableBalance.toFixed(2)}
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
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">£2,340</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">Last Month</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">£1,980</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">Withdrawals</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">8</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d] mb-1">Avg. Time</p>
              <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f]">2 days</p>
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
                £{availableBalance.toFixed(2)}
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
                    max={availableBalance}
                    step="0.01"
                  />
                </div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d] mt-1">
                  Minimum: £50 • Maximum: £{availableBalance.toFixed(2)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, availableBalance].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    className="font-['Poppins',sans-serif] text-[13px] border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FFF5EB]"
                  >
                    {amount === availableBalance ? "All" : `£${amount}`}
                  </Button>
                ))}
              </div>

              {/* Withdrawal Method */}
              <div>
                <label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                  Select Withdrawal Method
                </label>
                <div className="space-y-2">
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
                  {paymentMethods.map((method) => (
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
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      Processing Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawHistory.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[14px] text-[#3D78CB]">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        {new Date(transaction.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                        £{transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        {transaction.method}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`
                          font-['Poppins',sans-serif] text-[12px]
                          ${transaction.status === "Completed" ? "bg-green-100 text-green-700 border-green-200" : ""}
                          ${transaction.status === "Pending" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                          ${transaction.status === "Failed" ? "bg-red-100 text-red-700 border-red-200" : ""}
                        `}>
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                        {transaction.processingTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-[#EFF6FF] to-white border border-[#3B82F6]/20 rounded-xl p-5">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Total Withdrawn</p>
              <p className="font-['Poppins',sans-serif] text-[28px] text-[#3B82F6]">£4,350</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-5">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Completed</p>
              <p className="font-['Poppins',sans-serif] text-[28px] text-green-600">8</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-5">
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">Pending</p>
              <p className="font-['Poppins',sans-serif] text-[28px] text-orange-600">1</p>
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

// Messenger Section
function MessengerSection() {
  const navigate = useNavigate();
  const { contacts, getMessages, addMessage, userRole, setUserRole } = useMessenger();
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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const currentMessages = selectedContactId ? getMessages(selectedContactId) : [];

  const emojis = ["😊", "👍", "❤️", "😂", "🎉", "👏", "🙏", "💯", "✨", "🔥", "😍", "🤔", "😎", "🙌", "💪"];

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    });
    setMessageText("");
    setShowEmojiPicker(false);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedContactId) return;

    const fileType = file.type.startsWith("image/") ? "Sent an image" : `Sent ${file.name}`;
    addMessage(selectedContactId, {
      senderId: userInfo?.id || "current-user",
      text: fileType,
      read: false,
      type: "text",
    });
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
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[14px]">
                              {contact.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <h4 className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] truncate">
                              {contact.name}
                            </h4>
                            <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] whitespace-nowrap flex-shrink-0">
                              {contact.timestamp}
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
                        <AvatarImage src={selectedContact.avatar} />
                        <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[15px]">
                          {selectedContact.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {selectedContact.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                        {selectedContact.name}
                      </h4>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#10b981]">
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

                {/* Custom Order Button - Below Header (Only for Professionals) */}
                {userRole === "professional" && (
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
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    onClick={() => {
                                      toast.success("Offer accepted! Order created.");
                                    }}
                                    size="sm"
                                    className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px]"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      toast.info("Offer declined");
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 font-['Poppins',sans-serif] text-[12px]"
                                  >
                                    Decline
                                  </Button>
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
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === userInfo?.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              message.senderId === userInfo?.id ? "order-2" : "order-1"
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                message.senderId === userInfo?.id
                                  ? "bg-[#FE8A0F] text-white rounded-br-sm"
                                  : "bg-white text-[#2c353f] rounded-bl-sm"
                              }`}
                            >
                              <p className="font-['Poppins',sans-serif] text-[14px] leading-relaxed">
                                {message.text}
                              </p>
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 px-1 ${
                                message.senderId === userInfo?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                                {message.timestamp}
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
                        <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3">
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
                    
                    <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
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
  const [activeTab, setActiveTab] = useState<"myservices" | "orders" | "packages" | "reviews" | "analytics">("myservices");
  const { userInfo } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [newService, setNewService] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    duration: "",
    availability: "available"
  });

  // Mock services data
  const myServices = [
    {
      id: "SVC001",
      title: "Bathroom Installation",
      category: "Plumbing",
      description: "Complete bathroom fitting including tiling, plumbing, and fixtures",
      price: "£450",
      priceValue: 450,
      duration: "2-3 days",
      status: "Active",
      bookings: 12,
      rating: 4.8,
      lastBooked: "2024-11-10",
    },
    {
      id: "SVC002",
      title: "Kitchen Sink Repair",
      category: "Plumbing",
      description: "Fix leaking sinks, replace taps, and drainage work",
      price: "£85",
      priceValue: 85,
      duration: "2-4 hours",
      status: "Active",
      bookings: 28,
      rating: 4.9,
      lastBooked: "2024-11-11",
    },
    {
      id: "SVC003",
      title: "Emergency Plumbing",
      category: "Plumbing",
      description: "24/7 emergency plumbing services for urgent issues",
      price: "£120",
      priceValue: 120,
      duration: "1-2 hours",
      status: "Active",
      bookings: 45,
      rating: 4.7,
      lastBooked: "2024-11-11",
    },
    {
      id: "SVC004",
      title: "Boiler Servicing",
      category: "Heating",
      description: "Annual boiler maintenance and safety checks",
      price: "£95",
      priceValue: 95,
      duration: "1-2 hours",
      status: "Paused",
      bookings: 8,
      rating: 4.6,
      lastBooked: "2024-10-28",
    },
  ];

  // Mock reviews data
  const serviceReviews = ([
    {
      id: 1,
      serviceTitle: "Bathroom Installation",
      clientName: "David Miller",
      clientAvatar: defaultAvatar,
      rating: 5,
      comment: "Excellent work! Very professional and finished on time. The bathroom looks amazing.",
      date: "2024-11-01",
    },
    {
      id: 2,
      serviceTitle: "Emergency Plumbing",
      clientName: "Lisa Anderson",
      clientAvatar: defaultAvatar,
      rating: 5,
      comment: "Arrived quickly and fixed the issue efficiently. Highly recommend!",
      date: "2024-10-28",
    },
    {
      id: 3,
      serviceTitle: "Kitchen Sink Repair",
      clientName: "James Taylor",
      clientAvatar: defaultAvatar,
      rating: 4,
      comment: "Good service, arrived on time and completed the work well.",
      date: "2024-10-25",
    },
  ]).map((r) => ({
    ...r,
    clientAvatar: defaultAvatar,
  }));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleAddService = (serviceData: any) => {
    // Check if user is blocked
    if (userInfo?.isBlocked) {
      toast.error("Your account has been blocked. You cannot add services. Please contact support.");
      setIsAddServiceOpen(false);
      return;
    }
    console.log("Adding service:", serviceData);
    // Here you would typically save to your backend/context
    // For now, just log it
    setIsAddServiceOpen(false);
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

  const handleDeleteService = (serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      console.log("Deleting service:", serviceId);
    }
  };

  const handleSavePackage = (packages: any[]) => {
    console.log("Saving packages:", packages);
    // Here you would typically save to your backend/context
    setIsCreatePackageOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "Active": "bg-green-100 text-green-700 border-green-200",
      "Paused": "bg-orange-100 text-orange-700 border-orange-200",
      "Inactive": "bg-gray-100 text-gray-700 border-gray-200",
      "Confirmed": "bg-blue-100 text-blue-700 border-blue-200",
      "Pending": "bg-orange-100 text-orange-700 border-orange-200",
      "Completed": "bg-green-100 text-green-700 border-green-200",
      "Cancelled": "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div>
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
          { id: "myservices", label: "My Services", icon: Briefcase },
          { id: "servicepackages", label: "Service Packages", icon: Package },
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

      {/* My Services Tab */}
      {activeTab === "myservices" && (
        <div>
          {/* Show Add Service Section or Service List */}
          {isAddServiceOpen ? (
            <AddServiceSection
              onClose={() => setIsAddServiceOpen(false)}
              onSave={handleAddService}
            />
          ) : (
            <>
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#FE8A0F]"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px] font-['Poppins',sans-serif] text-[14px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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

          {/* Services Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-2">
                      Service ID
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2">
                      Service Name
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead className="font-['Poppins',sans-serif]">Category</TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      <ArrowUpDown className="w-4 h-4 text-[#6b6b6b]" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-['Poppins',sans-serif] cursor-pointer hover:bg-gray-100 transition-colors"
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
                {myServices.map((service) => (
                  <TableRow 
                    key={service.id} 
                    className="hover:bg-[#FFF5EB]/30 transition-colors"
                  >
                    <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB]">
                      {service.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {service.title}
                        </p>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                          {service.duration}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      {service.category}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      {service.price}
                    </TableCell>
                    <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                      {service.bookings}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                          {service.rating}
                        </span>
                        <span className="text-[#FE8A0F]">★</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadge(service.status)} border font-['Poppins',sans-serif] text-[11px]`}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedService(service)}
                          className="h-8 w-8 p-0 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditService(service)}
                          className="h-8 w-8 p-0 hover:bg-[#FFF5EB] hover:text-[#FE8A0F]"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Service Stats */}
          <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mt-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            <div className="bg-gradient-to-br from-[#EFF6FF] to-white p-3 md:p-4 rounded-xl border border-[#3B82F6]/20 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Services</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">4</p>
            </div>
            <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-3 md:p-4 rounded-xl border border-[#FE8A0F]/20 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Active Services</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">3</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-3 md:p-4 rounded-xl border border-green-200 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Bookings</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">93</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-3 md:p-4 rounded-xl border border-purple-200 min-w-[200px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Avg Rating</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">4.8 ★</p>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* Service Packages Tab */}
      {activeTab === "servicepackages" && (
        <div>
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div>
              <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-1">
                Service Packages
              </h3>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                Create bundled service packages for your clients
              </p>
            </div>
            <Button 
              onClick={() => setIsCreatePackageOpen(true)}
              className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Package
            </Button>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example Package 1 */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F] hover:shadow-lg transition-all duration-300 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                    Complete Home Plumbing
                  </h4>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    3 services included
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-[#6b6b6b]" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-[#6b6b6b]" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Leak Detection & Repair</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Pipe Installation</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Drain Cleaning</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">Package Price</p>
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F]">£450</p>
                  </div>
                  <div className="text-right">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">You Save</p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-green-600">£50 (10%)</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-['Poppins',sans-serif] text-[#6b6b6b]">Status:</span>
                  <span className="font-['Poppins',sans-serif] px-3 py-1 rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Example Package 2 */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F] hover:shadow-lg transition-all duration-300 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                    Electrical Safety Bundle
                  </h4>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    4 services included
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-[#6b6b6b]" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-[#6b6b6b]" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Full Home Inspection</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Wiring Upgrade</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Safety Certificate</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Free Follow-up Visit</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">Package Price</p>
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F]">£620</p>
                  </div>
                  <div className="text-right">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">You Save</p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-green-600">£80 (12%)</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-['Poppins',sans-serif] text-[#6b6b6b]">Status:</span>
                  <span className="font-['Poppins',sans-serif] px-3 py-1 rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Example Package 3 */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F] hover:shadow-lg transition-all duration-300 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-1">
                    Garden Maintenance Pro
                  </h4>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                    5 services included
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-[#6b6b6b]" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-[#6b6b6b]" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Lawn Mowing (4 visits)</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Hedge Trimming</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Weed Control</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Fertilization</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-['Poppins',sans-serif] text-[#2c353f]">Seasonal Planting</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">Package Price</p>
                    <p className="font-['Poppins',sans-serif] text-[20px] text-[#FE8A0F]">£380</p>
                  </div>
                  <div className="text-right">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">You Save</p>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-green-600">£70 (15%)</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-['Poppins',sans-serif] text-[#6b6b6b]">Status:</span>
                  <span className="font-['Poppins',sans-serif] px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                    Draft
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-gradient-to-r from-[#FFF5EB] to-white border border-[#FE8A0F]/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FE8A0F] rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-2">
                  Why Create Service Packages?
                </h4>
                <ul className="space-y-2 font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                    <span>Increase revenue by bundling complementary services together</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                    <span>Offer better value to clients with discounted package pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                    <span>Streamline your workflow by creating standard service combinations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FE8A0F] flex-shrink-0 mt-0.5" />
                    <span>Stand out from competitors with unique package offerings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {isCreatePackageOpen && (
        <CreatePackageModal
          onClose={() => setIsCreatePackageOpen(false)}
          onSave={handleSavePackage}
        />
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div>
          <div className="space-y-4">
            {serviceReviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-xl p-6 hover:border-[#FE8A0F]/30 hover:bg-[#FFF5EB]/20 transition-all">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 border-2 border-gray-200">
                    <AvatarImage src={review.clientAvatar} alt={review.clientName} />
                    <AvatarFallback className="bg-[#3B82F6] text-white font-['Poppins',sans-serif]">
                      {review.clientName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
                          {review.clientName}
                        </h4>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#8d8d8d]">
                          {review.serviceTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <span key={i} className="text-[#FE8A0F] text-[16px]">★</span>
                        ))}
                      </div>
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                      {review.comment}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                      {review.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Review Stats */}
          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 mt-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-3 md:p-4 rounded-xl border border-[#FE8A0F]/20 min-w-[220px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Average Rating</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">4.8 ★</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-3 md:p-4 rounded-xl border border-green-200 min-w-[220px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Reviews</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">23</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white p-3 md:p-4 rounded-xl border border-blue-200 min-w-[220px] md:min-w-0 flex-shrink-0">
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">5-Star Reviews</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">18</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-[#EFF6FF] to-white p-6 rounded-xl border border-[#3B82F6]/20">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4">
                Monthly Revenue
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[
                  { month: "Jun", revenue: 1200 },
                  { month: "Jul", revenue: 1850 },
                  { month: "Aug", revenue: 1650 },
                  { month: "Sep", revenue: 2100 },
                  { month: "Oct", revenue: 1950 },
                  { month: "Nov", revenue: 2450 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b6b6b" style={{ fontSize: '12px', fontFamily: 'Poppins' }} />
                  <YAxis stroke="#6b6b6b" style={{ fontSize: '12px', fontFamily: 'Poppins' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3D78CB" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-6 rounded-xl border border-[#FE8A0F]/20">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4">
                Service Popularity
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { service: "Emergency", bookings: 45 },
                  { service: "Sink Repair", bookings: 28 },
                  { service: "Bathroom", bookings: 12 },
                  { service: "Boiler", bookings: 8 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="service" stroke="#6b6b6b" style={{ fontSize: '11px', fontFamily: 'Poppins' }} />
                  <YAxis stroke="#6b6b6b" style={{ fontSize: '12px', fontFamily: 'Poppins' }} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#FE8A0F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            <div className="bg-gradient-to-br from-green-50 to-white p-3 md:p-4 rounded-xl border border-green-200 min-w-[220px] md:min-w-0 flex-shrink-0">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-600 mb-1 md:mb-2" />
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Total Revenue</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">£11,200</p>
              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-green-600 mt-1">+18% this month</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white p-3 md:p-4 rounded-xl border border-blue-200 min-w-[220px] md:min-w-0 flex-shrink-0">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mb-1 md:mb-2" />
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Bookings</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">93</p>
              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-blue-600 mt-1">12 this week</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-3 md:p-4 rounded-xl border border-purple-200 min-w-[220px] md:min-w-0 flex-shrink-0">
              <Heart className="w-6 h-6 md:w-8 md:h-8 text-purple-600 mb-1 md:mb-2" />
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Customer Satisfaction</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">96%</p>
              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-purple-600 mt-1">Excellent</p>
            </div>
            <div className="bg-gradient-to-br from-[#FFF5EB] to-white p-3 md:p-4 rounded-xl border border-[#FE8A0F]/20 min-w-[220px] md:min-w-0 flex-shrink-0">
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-[#FE8A0F] mb-1 md:mb-2" />
              <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-[#6b6b6b] mb-1">Avg Response Time</p>
              <p className="font-['Poppins',sans-serif] text-[20px] md:text-[24px] text-[#2c353f]">2.5h</p>
              <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#FE8A0F] mt-1">Very responsive</p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}


