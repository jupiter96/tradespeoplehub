import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  Users, 
  UserCheck, 
  BriefcaseBusiness, 
  Wallet,
  FileText,
  Link2,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Banknote,
  Gavel,
  Server,
  Package,
  Mail,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  Hammer,
  FolderTree,
  Shield,
  ShieldCheck,
  Calendar,
  TrendingUp,
  CreditCard,
  Archive,
  Send,
  UserCog,
  Gift,
  Handshake,
  List,
  Box,
} from "lucide-react";
import AdminGenericPage from "./admin/AdminGenericPage";
import AdminClientsPage from "./admin/AdminClientsPage";
import AdminProfessionalsPage from "./admin/AdminProfessionalsPage";
import AdminSubAdminsPage from "./admin/AdminSubAdminsPage";
import AdminDeleteAccountPage from "./admin/AdminDeleteAccountPage";
import AdminReferralsClientPage from "./admin/AdminReferralsProfessionalPage";
import AdminReferralsProfessionalPage from "./admin/AdminReferralsProfessionalPage";
import AdminHomepageContentPage from "./admin/AdminHomepageContentPage";
import AdminBlogContentPage from "./admin/AdminBlogContentPage";
import AdminCostGuidePage from "./admin/AdminCostGuidePage";
import AdminSectorsPage from "./admin/AdminSectorsPage";
import AdminCategoriesPage from "./admin/AdminCategoriesPage";
import AdminEmailCampaignPage from "./admin/AdminEmailCampaignPage";
import API_BASE_URL from "../config/api";
import { useAdminPermissions } from "../hooks/useAdminPermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const { hasRouteAccess, loading: permissionsLoading } = useAdminPermissions();
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardTab, setDashboardTab] = useState("statistics");
  
  // Get active section from URL, default to "dashboard"
  // URL section is already in the correct format (clients, professionals, etc.)
  const activeSection = params.section || "dashboard";
  
  // Check route access and redirect if unauthorized
  useEffect(() => {
    if (!permissionsLoading) {
      const currentPath = location.pathname;
      // Dashboard is always accessible
      if (currentPath !== "/admin/dashboard" && !hasRouteAccess(currentPath)) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [location.pathname, hasRouteAccess, permissionsLoading, navigate]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/statistics`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStatistics(data.statistics);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (activeSection === "dashboard") {
      fetchStatistics();
    }
  }, [activeSection]);

  // Get section label from URL
  const getSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      clients: "Clients",
      professionals: "Professionals",
      "sub-admins": "Sub Admins",
      "delete-account": "Delete Account",
      "category-manage": "Category Manage",
      sectors: "Sectors",
      categories: "Categories",
      "default-content": "Default Content",
      "favourite-categories": "Favourite Categories",
      packages: "Packages",
      "package-addons": "Package Addons",
      "coupon-manage": "Coupon Manage",
      "contact-requests": "Contact Requests",
      "client-requests": "Client Requests",
      "professional-requests": "Professional Requests",
      "region-manage": "Region Manage",
      countries: "Countries",
      cities: "Cities",
      "content-manage": "Content Manage",
      "homepage-content": "Homepage Content",
      "blog-content": "Blog Content",
      "banner-content": "Banner Content",
      "cost-guide": "Cost Guide",
      "transaction-history": "Transaction History",
      "user-plans": "User Plans",
      "job-manage": "Job Manage",
      "post-a-job": "Post a Job",
      "job-posts": "Job Posts",
      "bids-on-posts": "Bids on Posts",
      "send-emails": "Send Emails",
      "generate-html": "Generate HTML",
      "job-amount": "Job Amount",
      "ratings-manage": "Ratings Manage",
      "payment-finance": "Payment & Finance",
      "payment-settings": "Payment Settings",
      "bank-transfer-request": "Bank Transfer Request",
      "withdrawal-request": "Withdrawal Request",
      refunds: "Refunds",
      "dispute-manage": "Dispute Manage",
      "dispute-list": "Dispute List",
      "ask-step-in": "Ask Step In",
      rewards: "Rewards",
      "message-center": "Message Center",
      affiliate: "Affiliate",
      affiliates: "Affiliates",
      "sharable-links": "Sharable Links",
      "pay-outs": "Pay Outs",
      "affiliate-setting": "Affiliate Setting",
      "affiliate-metadata": "Affiliate Metadata",
      "affiliate-support": "Affiliate Support",
      referrals: "Referrals",
      "referrals-client": "Referrals - Client",
      "referrals-professional": "Referrals - Professional",
      flagged: "Flagged",
      service: "Service",
      "service-category": "Service Category",
      "approval-pending-service": "Approval Pending Service",
      "required-modification-service": "Required Modification Service",
      "approved-service": "Approved Service",
      "all-service": "All Service",
      locations: "Locations",
      "service-order": "Service Order",
      "completed-order": "Completed Order",
      "pending-order": "Pending Order",
      "cancel-order": "Cancel Order",
      "disputed-order": "Disputed Order",
      "active-order": "Active Order",
      "custom-order": "Custom Order",
      "pending-orders": "Pending Orders",
      "accepted-orders": "Accepted Orders",
      "rejected-orders": "Rejected Orders",
    };
    return labels[section] || section.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // Route to specific page components
  const renderSection = () => {
    switch (activeSection) {
      case "clients":
        return <AdminClientsPage />;
      case "professionals":
        return <AdminProfessionalsPage />;
      case "sub-admins":
        return <AdminSubAdminsPage />;
      case "delete-account":
        return <AdminDeleteAccountPage />;
      case "referrals-client":
        return <AdminReferralsClientPage />;
      case "referrals-professional":
        return <AdminReferralsProfessionalPage />;
      case "homepage-content":
        return <AdminHomepageContentPage />;
      case "blog-content":
        return <AdminBlogContentPage />;
      case "cost-guide":
        return <AdminCostGuidePage />;
      case "sectors":
        return <AdminSectorsPage />;
      case "categories":
        return <AdminCategoriesPage />;
      case "email-campaign":
        return <AdminEmailCampaignPage />;
      default:
        return (
          <AdminGenericPage
            title={getSectionLabel(activeSection)}
            description={`Manage ${getSectionLabel(activeSection).toLowerCase()} settings and configurations`}
          />
        );
    }
  };

  const cards = useMemo(
    () => [
      {
        title: "Total Users",
        value: statistics?.totalUsers?.toLocaleString() || "0",
        delta: statistics?.totalUsersDailyChange 
          ? (statistics.totalUsersDailyChange >= 0 ? "+" : "") + statistics.totalUsersDailyChange 
          : "0",
        description: "total registered users",
        icon: Users,
      },
      {
        title: "Active Clients",
        value: statistics?.activeClients?.toLocaleString() || "0",
        delta: statistics?.clientsDailyChange 
          ? (statistics.clientsDailyChange >= 0 ? "+" : "") + statistics.clientsDailyChange 
          : "0",
        description: "active client accounts",
        icon: UserCheck,
      },
      {
        title: "Professionals",
        value: statistics?.professionals?.toLocaleString() || "0",
        delta: statistics?.professionalsDailyChange 
          ? (statistics.professionalsDailyChange >= 0 ? "+" : "") + statistics.professionalsDailyChange 
          : "0",
        description: statistics?.verifiedProfessionals 
          ? `${statistics.verifiedProfessionals} verified` 
          : "professional accounts",
        icon: BriefcaseBusiness,
      },
      {
        title: "Monthly Revenue",
        value: "£0",
        delta: "0",
        description: "revenue tracking not implemented",
        icon: Wallet,
      },
    ],
    [statistics],
  );

  // Render dashboard content or other sections
  if (activeSection === "dashboard") {
    return (
      <div className="space-y-8">
              {/* Dashboard Tabs */}
              <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger 
                    value="statistics"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-md data-[state=active]:shadow-[#FE8A0F]/30 text-gray-600 dark:text-gray-400 border-0 transition-all"
                  >
                    State Cards
                  </TabsTrigger>
                  <TabsTrigger 
                    value="state-cards"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-md data-[state=active]:shadow-[#FE8A0F]/30 text-gray-600 dark:text-gray-400 border-0 transition-all"
                  >
                    Statistics
                  </TabsTrigger>
                </TabsList>

                {/* State Cards Tab */}
                <TabsContent value="state-cards" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card, index) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={index}
                          className="bg-white dark:bg-black rounded-lg border-0 p-6 shadow-lg shadow-[#FE8A0F]/20 hover:shadow-xl hover:shadow-[#FE8A0F]/30 transition-all relative"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-black dark:text-white text-xs font-semibold uppercase mb-3 tracking-wide">
                                {card.title}
                              </h3>
                              <p className="text-[#FE8A0F] text-4xl font-bold mb-2 leading-tight">
                                {card.value}
                              </p>
                              <p className="text-[#FE8A0F] text-sm font-semibold mb-1">
                                {card.delta}
                              </p>
                              <p className="text-black dark:text-white text-xs text-gray-600 dark:text-gray-400">
                                {card.description}
                              </p>
                            </div>
                            {Icon && (
                              <div className="ml-4 flex-shrink-0 p-2 bg-[#FE8A0F]/10 rounded border-0 shadow-md shadow-[#FE8A0F]/20 absolute bottom-0 right-6">
                                <Icon className="w-5 h-5 text-[#FE8A0F]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Statistics Cards Tab */}
                <TabsContent value="statistics" className="mt-6">
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8A0F] mx-auto mb-4"></div>
                        <p className="text-black dark:text-white">Loading statistics...</p>
                      </div>
                    </div>
                  ) : (
                    <section className="grid gap-4 md:grid-cols-3">
                  {/* Column 1 - Orange Cards */}
                  <div className="space-y-4">
                    <StatCard
                      icon={Users}
                      title="PROFESSIONALS"
                      value={statistics?.professionals || 0}
                      color="orange"
                      dailyChange={statistics?.professionalsDailyChange}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={Hammer}
                      title="TOTAL JOB"
                      value={statistics?.totalJob || 0}
                      color="orange"
                      dailyChange={statistics?.totalJobDailyChange}
                      onClick={() => navigate("/admin/job-manage")}
                    />
                    <StatCard
                      icon={FolderTree}
                      title="TOTAL CATEGORY"
                      value={statistics?.totalCategory || 0}
                      color="orange"
                      dailyChange={statistics?.totalCategoryDailyChange}
                      onClick={() => navigate("/admin/category-manage")}
                    />
                    <StatCard
                      icon={ShieldCheck}
                      title="ACCOUNT VERIFICATION DOCUMENT"
                      value={statistics?.accountVerificationDocument || 0}
                      badge={statistics?.accountVerificationDocumentNew || 0}
                      color="orange"
                      dailyChange={statistics?.accountVerificationDocumentDailyChange}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={UserCheck}
                      title="TOTAL VERIFICATION USERS"
                      value={statistics?.totalVerificationUsers || 0}
                      color="orange"
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={Calendar}
                      title="VERIFICATION USERS TODAY"
                      value={statistics?.verificationUsersToday || 0}
                      color="orange"
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={TrendingUp}
                      title="PROFESSIONAL REFERRALS"
                      value={statistics?.professionalsReferrals || 0}
                      color="orange"
                      dailyChange={statistics?.professionalsReferralsDailyChange}
                      onClick={() => navigate("/admin/referrals-professional")}
                    />
                    <StatCard
                      icon={AlertCircle}
                      title="FLAGGED"
                      value={statistics?.flagged || 0}
                      color="orange"
                      dailyChange={statistics?.flaggedDailyChange}
                      onClick={() => navigate("/admin/flagged")}
                    />
                  </div>

                  {/* Column 2 - Red Cards */}
                  <div className="space-y-4">
                    <StatCard
                      icon={Users}
                      title="CLIENTS"
                      value={statistics?.clients || 0}
                      color="red"
                      dailyChange={statistics?.clientsDailyChange}
                      onClick={() => navigate("/admin/clients")}
                    />
                    <StatCard
                      icon={Gavel}
                      title="TOTAL JOB IN DISPUTE"
                      value={statistics?.totalJobInDispute || 0}
                      color="red"
                      dailyChange={statistics?.totalJobInDisputeDailyChange}
                      onClick={() => navigate("/admin/dispute-list")}
                    />
                    <StatCard
                      icon={CreditCard}
                      title="PENDING WITHDRAWAL REQUEST"
                      value={statistics?.pendingWithdrawalRequest || 0}
                      color="red"
                      dailyChange={statistics?.pendingWithdrawalRequestDailyChange}
                      onClick={() => navigate("/admin/withdrawal-request")}
                    />
                    <StatCard
                      icon={MessageCircle}
                      title="MESSAGE CENTER"
                      value={statistics?.messageCenter || 0}
                      badge={statistics?.messageCenterNew || 0}
                      color="red"
                      dailyChange={statistics?.messageCenterDailyChange}
                      onClick={() => navigate("/admin/message-center")}
                    />
                    <StatCard
                      icon={TrendingUp}
                      title="CLIENT REFERRALS"
                      value={statistics?.clientsReferrals || 0}
                      color="red"
                      dailyChange={statistics?.clientsReferralsDailyChange}
                      onClick={() => navigate("/admin/referrals-client")}
                    />
                    <StatCard
                      icon={Archive}
                      title="DELETED ACCOUNT"
                      value={statistics?.deletedAccount || 0}
                      badge={statistics?.deletedAccountNew || 0}
                      color="red"
                      dailyChange={statistics?.deletedAccountDailyChange}
                      onClick={() => navigate("/admin/delete-account")}
                    />
                    <StatCard
                      icon={Package}
                      title="ORDERS"
                      value={statistics?.orders || 0}
                      badge={statistics?.ordersNew || 0}
                      color="red"
                      dailyChange={statistics?.ordersDailyChange}
                      onClick={() => navigate("/admin/service-order")}
                    />
                    <StatCard
                      icon={Clock}
                      title="APPROVAL PENDING SERVICE"
                      value={statistics?.approvalPendingService || 0}
                      color="red"
                      dailyChange={statistics?.approvalPendingServiceDailyChange}
                      onClick={() => navigate("/admin/approval-pending-service")}
                    />
                  </div>

                  {/* Column 3 - Green Cards */}
                  <div className="space-y-4">
                    <StatCard
                      icon={Users}
                      title="SUBADMIN"
                      value={statistics?.subadmin || 0}
                      color="green"
                      dailyChange={statistics?.subadminDailyChange}
                      onClick={() => navigate("/admin/sub-admins")}
                    />
                    <StatCard
                      icon={Package}
                      title="TOTAL PLANS & PACKAGES"
                      value={statistics?.totalPlansPackages || 0}
                      color="green"
                      dailyChange={statistics?.totalPlansPackagesDailyChange}
                      onClick={() => navigate("/admin/packages")}
                    />
                    <StatCard
                      icon={Send}
                      title="NEW CONTACT REQUEST"
                      value={statistics?.newContactRequest || 0}
                      badge={statistics?.newContactRequestNew || 0}
                      color="green"
                      dailyChange={statistics?.newContactRequestDailyChange}
                      onClick={() => navigate("/admin/contact-requests")}
                    />
                    <StatCard
                      icon={Gift}
                      title="AFFILIATE"
                      value={statistics?.affiliate || 0}
                      badge={statistics?.affiliateNew || 0}
                      color="green"
                      dailyChange={statistics?.affiliateDailyChange}
                      onClick={() => navigate("/admin/affiliate")}
                    />
                    <StatCard
                      icon={Handshake}
                      title="ASK TO STEP IN"
                      value={statistics?.askToStepIn || 0}
                      color="green"
                      dailyChange={statistics?.askToStepInDailyChange}
                      onClick={() => navigate("/admin/ask-step-in")}
                    />
                    <StatCard
                      icon={List}
                      title="SERVICE LISTING"
                      value={statistics?.serviceListing || 0}
                      color="green"
                      dailyChange={statistics?.serviceListingDailyChange}
                      onClick={() => navigate("/admin/service")}
                    />
                    <StatCard
                      icon={Box}
                      title="CUSTOM ORDERS"
                      value={statistics?.customOrders || 0}
                      badge={statistics?.customOrdersNew || 0}
                      color="green"
                      dailyChange={statistics?.customOrdersDailyChange}
                      onClick={() => navigate("/admin/custom-order")}
                    />
                  </div>
                    </section>
                  )}
                </TabsContent>
              </Tabs>
      </div>
    );
  }

  // Render other sections
  return <Suspense fallback={<div>Loading...</div>}>{renderSection()}</Suspense>;
}

// Statistics Card Component
function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  badge, 
  color,
  onClick,
  dailyChange
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  badge?: number;
  color: "orange" | "red" | "green";
  onClick?: () => void;
  dailyChange?: number;
}) {
  const bgGradient = {
    orange: "from-orange-50 to-white dark:from-orange-950 dark:to-black",
    red: "from-red-50 to-white dark:from-red-950 dark:to-black",
    green: "from-green-50 to-white dark:from-green-950 dark:to-black",
  };

  return (
    <div 
      className={`relative rounded-xl bg-gradient-to-br ${bgGradient[color]} p-4 shadow-lg hover:shadow-xl transition-all h-32 flex flex-col justify-between overflow-hidden ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      {/* Background Icon - Right Side */}
      <div className="absolute right-2 top-2 opacity-10 text-orange-600 mt-8">
        <Icon className="w-20 h-20" />
      </div>

      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex flex-col gap-1 flex-1 pr-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-black">
            {title}
          </p>
        </div>
        {/* Show badge if provided, otherwise show dailyChange as badge if available */}
        {(badge !== undefined && badge > 0) || (dailyChange !== undefined && dailyChange !== 0 && badge === undefined) ? (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full min-w-[28px] h-7 flex items-center justify-center px-2.5 z-30 shadow-lg ring-2 ring-white">
            {badge !== undefined && badge > 0 ? badge : (dailyChange !== undefined && dailyChange !== 0 ? Math.abs(dailyChange) : 0)}
          </div>
        ) : null}
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-bold text-orange-600">
          {value.toLocaleString()}
        </p>
        {dailyChange !== undefined && dailyChange !== 0 && (
          <p className={`text-xs mt-1 ${dailyChange > 0 ? "text-green-600" : "text-red-600"}`}>
            {dailyChange > 0 ? "+" : ""}{dailyChange} today
          </p>
        )}
      </div>
    </div>
  );
}

