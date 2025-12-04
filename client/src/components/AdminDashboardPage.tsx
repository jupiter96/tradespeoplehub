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
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import AdminGenericPage from "./admin/AdminGenericPage";
import AdminClientsPage from "./admin/AdminClientsPage";
import AdminProfessionalsPage from "./admin/AdminProfessionalsPage";
import AdminSubAdminsPage from "./admin/AdminSubAdminsPage";
import AdminDeleteAccountPage from "./admin/AdminDeleteAccountPage";
import AdminReferralsClientPage from "./admin/AdminReferralsProfessionalPage";
import AdminReferralsProfessionalPage from "./admin/AdminReferralsProfessionalPage";
import API_BASE_URL from "../config/api";
import { useAdminPermissions } from "../hooks/useAdminPermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const { hasRouteAccess, loading: permissionsLoading } = useAdminPermissions();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardTab, setDashboardTab] = useState("state-cards");
  
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
  
  // Calculate sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 96 : 320;
  
  // Check if desktop view
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Update URL when section changes
  const handleSectionChange = (section: string) => {
    if (section === "dashboard") {
      navigate("/admin/dashboard");
    } else {
      navigate(`/admin/${section}`);
    }
  };

  // Redirect /admin to /admin/dashboard
  useEffect(() => {
    if (location.pathname === "/admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

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

  const cards = useMemo(
    () => [
      {
        title: "Total Users",
        value: "12,480",
        delta: "+8.2%",
        description: "vs last month",
        icon: Users,
      },
      {
        title: "Active Clients",
        value: "4,321",
        delta: "+3.4%",
        description: "using the platform weekly",
        icon: UserCheck,
      },
      {
        title: "Professionals",
        value: "1,204",
        delta: "+12 new",
        description: "verified and ready for jobs",
        icon: BriefcaseBusiness,
      },
      {
        title: "Monthly Revenue",
        value: "£38,920",
        delta: "+15.6%",
        description: "in the last 30 days",
        icon: Wallet,
      },
    ],
    [],
  );

  // Fixed sample data for charts
  const trafficData = [
    { name: "Mon", users: 120 },
    { name: "Tue", users: 180 },
    { name: "Wed", users: 150 },
    { name: "Thu", users: 220 },
    { name: "Fri", users: 260 },
    { name: "Sat", users: 190 },
    { name: "Sun", users: 140 },
  ];

  const revenueData = [
    { name: "Jan", value: 18 },
    { name: "Feb", value: 22 },
    { name: "Mar", value: 26 },
    { name: "Apr", value: 31 },
    { name: "May", value: 29 },
    { name: "Jun", value: 35 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <AdminHeader onMenuToggle={setMobileSidebarOpen} sidebarOpen={mobileSidebarOpen} />

      <div className="relative min-h-[calc(100vh-80px)]">
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onSelectSection={handleSectionChange}
          activeSection={activeSection}
          onCollapsedChange={setSidebarCollapsed}
        />

        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <main 
          className="px-4 py-6 lg:px-8 lg:py-8 transition-all duration-300"
          style={{ marginLeft: isDesktop ? `${sidebarWidth}px` : '0' }}
        >

          {activeSection === "dashboard" ? (
            <div className="space-y-8">
              {/* Dashboard Tabs */}
              <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger 
                    value="state-cards"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#FE8A0F] data-[state=active]:border-b-2 data-[state=active]:border-[#FE8A0F] text-gray-600 dark:text-gray-400"
                  >
                    State Cards
                  </TabsTrigger>
                  <TabsTrigger 
                    value="statistics"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#FE8A0F] data-[state=active]:border-b-2 data-[state=active]:border-[#FE8A0F] text-gray-600 dark:text-gray-400"
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
                          className="bg-white dark:bg-black rounded-lg border border-[#FE8A0F] p-6 shadow-sm"
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
                              <div className="ml-4 flex-shrink-0 p-2 bg-[#FE8A0F]/10 rounded border border-white/50">
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
                      value={statistics?.tradesmen || 0}
                      color="orange"
                      dailyChange={statistics?.tradesmenDailyChange}
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
                      value={statistics?.tradesmenReferrals || 0}
                      color="orange"
                      dailyChange={statistics?.tradesmenReferralsDailyChange}
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
                    <StatCard
                      icon={Clock}
                      title="APPROVAL PENDING SERVICE"
                      value={statistics?.approvalPendingService || 0}
                      color="orange"
                      dailyChange={statistics?.approvalPendingServiceDailyChange}
                      onClick={() => navigate("/admin/approval-pending-service")}
                    />
                  </div>

                  {/* Column 2 - Red Cards */}
                  <div className="space-y-4">
                    <StatCard
                      icon={Users}
                      title="CLIENTS"
                      value={statistics?.homeowners || 0}
                      color="red"
                      dailyChange={statistics?.homeownersDailyChange}
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
                      value={statistics?.homeownerReferrals || 0}
                      color="red"
                      dailyChange={statistics?.homeownerReferralsDailyChange}
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

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 
                                shadow-[0_0_20px_rgba(254,138,15,0.2)]
                                hover:shadow-[0_0_30px_rgba(254,138,15,0.3)]
                                transition-all duration-300 transform hover:-translate-y-1"
                     style={{
                       boxShadow: '0 0 20px rgba(254, 138, 15, 0.2), inset 0 0 10px rgba(254, 138, 15, 0.05)',
                     }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-black dark:text-white">
                        Weekly Activity
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#FE8A0F]">
                        New users per day
                      </h2>
                    </div>
                    <span className="rounded-full bg-[#FE8A0F]/20 px-3 py-1 text-xs font-semibold text-[#FE8A0F]">
                      Live
                    </span>
                  </div>
                  <div className="mt-2 h-64 rounded-2xl bg-white dark:bg-black p-3">
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={trafficData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#f9fafb",
                            fontFamily: "Poppins, sans-serif",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dot={{ r: 5, fill: "#3B82F6" }}
                          activeDot={{ r: 7, fill: "#60A5FA" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-3xl border-2 border-[#FE8A0F] bg-white dark:bg-black p-6 
                                shadow-[0_0_20px_rgba(254,138,15,0.2)]
                                hover:shadow-[0_0_30px_rgba(254,138,15,0.3)]
                                transition-all duration-300 transform hover:-translate-y-1"
                     style={{
                       boxShadow: '0 0 20px rgba(254, 138, 15, 0.2), inset 0 0 10px rgba(254, 138, 15, 0.05)',
                     }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-black dark:text-white">
                        Revenue
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#FE8A0F]">
                        Monthly performance
                      </h2>
                    </div>
                    <span className="rounded-full bg-[#FE8A0F]/20 px-3 py-1 text-xs font-semibold text-[#FE8A0F]">
                      Demo data
                    </span>
                  </div>
                  <div className="mt-2 h-64 rounded-2xl bg-white dark:bg-black p-3">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#f9fafb",
                            fontFamily: "Poppins, sans-serif",
                          }}
                          formatter={(value: number) => [`${value}%`, "Growth"]}
                        />
                        <Bar dataKey="value" fill="#FE8A0F" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <SectionRouter activeSection={activeSection} />
          )}
        </main>
      </div>
    </div>
  );
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
      <div className="absolute right-2 top-2 opacity-10 text-orange-600">
        <Icon className="w-20 h-20" />
      </div>

      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex flex-col gap-1 flex-1 pr-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-black">
            {title}
          </p>
        </div>
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full min-w-[28px] h-7 flex items-center justify-center px-2.5 z-30 shadow-lg ring-2 ring-white">
            {badge}
          </div>
        )}
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

// Section Router Component
function SectionRouter({ activeSection }: { activeSection: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRouteAccess, loading: permissionsLoading } = useAdminPermissions();
  
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
      default:
        return (
          <AdminGenericPage
            title={getSectionLabel(activeSection)}
            description={`Manage ${getSectionLabel(activeSection).toLowerCase()} settings and configurations`}
          />
        );
    }
  };

  return <Suspense fallback={<div>Loading...</div>}>{renderSection()}</Suspense>;
}
