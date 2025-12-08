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
  AreaChart,
  Area,
} from "recharts";

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const { hasRouteAccess, loading: permissionsLoading } = useAdminPermissions();
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardTab, setDashboardTab] = useState("statistics");
  const [viewedCards, setViewedCards] = useState<Record<string, string>>({});
  
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

  // Handle card click - mark as viewed
  const handleCardClick = async (cardKey: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/dashboard/card-viewed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cardKey }),
      });
      setViewedCards(prev => ({ ...prev, [cardKey]: new Date().toISOString() }));
    } catch (error) {
      console.error('Error marking card as viewed:', error);
    }
  };

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
          setViewedCards(data.statistics.viewedCards || {});
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
      case "category-manage":
        // Redirect category-manage to sectors
        navigate("/admin/sectors", { replace: true });
        return <AdminSectorsPage />;
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
                          className="relative rounded-2xl bg-white dark:bg-black border border-[#FE8A0F]/20 p-6 shadow-lg shadow-[#FE8A0F]/10 hover:shadow-2xl hover:shadow-[#FE8A0F]/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Content */}
                            <div className="flex flex-col gap-2 flex-1 min-w-0">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                {card.title}
                              </h3>
                              <p className="text-3xl font-bold text-[#FE8A0F]">
                                {card.value}
                              </p>
                              {card.delta && card.delta !== "0" && (
                                <p className={`text-sm font-medium ${card.delta.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                                  {card.delta} today
                                </p>
                              )}
                              <p className="text-black dark:text-white text-xs text-gray-600 dark:text-gray-400">
                                {card.description}
                              </p>
                            </div>

                            {/* Right side - Large Icon */}
                            {Icon && (
                              <div className="flex-shrink-0">
                                <div className="p-4 bg-[#FE8A0F]/10 rounded-xl shadow-md shadow-[#FE8A0F]/20">
                                  <Icon className="w-12 h-12 text-[#FE8A0F]" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart Cards Section - Inside Statistics Tab */}
                  <div className="mt-8 space-y-6">
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Analytics Overview</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* User Growth Chart */}
                      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">User Growth Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart
                            data={[
                              { month: "Jan", users: 120, professionals: 45 },
                              { month: "Feb", users: 180, professionals: 62 },
                              { month: "Mar", users: 250, professionals: 85 },
                              { month: "Apr", users: 320, professionals: 110 },
                              { month: "May", users: 410, professionals: 135 },
                              { month: "Jun", users: 520, professionals: 168 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="professionals" stackId="1" stroke="#FE8A0F" fill="#FE8A0F" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Revenue Chart */}
                      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Monthly Revenue</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { month: "Jan", revenue: 12500 },
                              { month: "Feb", revenue: 18900 },
                              { month: "Mar", revenue: 24500 },
                              { month: "Apr", revenue: 31200 },
                              { month: "May", revenue: 38900 },
                              { month: "Jun", revenue: 45600 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
                            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Job Status Distribution */}
                      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Job Status Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Completed", value: 45, color: "#10B981" },
                                { name: "In Progress", value: 30, color: "#3B82F6" },
                                { name: "Pending", value: 15, color: "#F59E0B" },
                                { name: "Cancelled", value: 10, color: "#EF4444" },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[
                                { name: "Completed", value: 45, color: "#10B981" },
                                { name: "In Progress", value: 30, color: "#3B82F6" },
                                { name: "Pending", value: 15, color: "#F59E0B" },
                                { name: "Cancelled", value: 10, color: "#EF4444" },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Verification Status */}
                      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Verification Status</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { status: "Verified", count: 320 },
                              { status: "Pending", count: 85 },
                              { status: "Rejected", count: 25 },
                              { status: "Not Started", count: 120 },
                            ]}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" />
                            <YAxis dataKey="status" type="category" stroke="#6b7280" width={100} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#FE8A0F" radius={[0, 8, 8, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Category Popularity */}
                      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Top Categories</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { category: "Plumbing", jobs: 145 },
                              { category: "Electrical", jobs: 128 },
                              { category: "Carpentry", jobs: 98 },
                              { category: "Painting", jobs: 87 },
                              { category: "Gardening", jobs: 76 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="category" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Bar dataKey="jobs" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Monthly Activity */}
                      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Monthly Activity</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={[
                              { month: "Jan", jobs: 45, messages: 120, reviews: 38 },
                              { month: "Feb", jobs: 62, messages: 145, reviews: 52 },
                              { month: "Mar", jobs: 78, messages: 168, reviews: 65 },
                              { month: "Apr", jobs: 95, messages: 192, reviews: 78 },
                              { month: "May", jobs: 112, messages: 215, reviews: 92 },
                              { month: "Jun", jobs: 128, messages: 238, reviews: 105 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="jobs" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="messages" stroke="#10B981" strokeWidth={2} />
                            <Line type="monotone" dataKey="reviews" stroke="#F59E0B" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
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
                      cardKey="professionals"
                      badge={statistics?.professionalsDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={Hammer}
                      title="TOTAL JOB"
                      value={statistics?.totalJob || 0}
                      color="orange"
                      dailyChange={statistics?.totalJobDailyChange}
                      cardKey="totalJob"
                      badge={statistics?.totalJobDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/job-manage")}
                    />
                    <StatCard
                      icon={FolderTree}
                      title="TOTAL CATEGORY"
                      value={statistics?.totalCategory || 0}
                      color="orange"
                      dailyChange={statistics?.totalCategoryDailyChange}
                      cardKey="totalCategory"
                      badge={statistics?.totalCategoryDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/sectors")}
                    />
                    <StatCard
                      icon={ShieldCheck}
                      title="ACCOUNT VERIFICATION DOCUMENT"
                      value={statistics?.accountVerificationDocument || 0}
                      badge={statistics?.accountVerificationDocumentNew || 0}
                      color="orange"
                      dailyChange={statistics?.accountVerificationDocumentDailyChange}
                      cardKey="accountVerificationDocument"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={UserCheck}
                      title="TOTAL VERIFICATION USERS"
                      value={statistics?.totalVerificationUsers || 0}
                      color="orange"
                      cardKey="totalVerificationUsers"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={Calendar}
                      title="VERIFICATION USERS TODAY"
                      value={statistics?.verificationUsersToday || 0}
                      color="orange"
                      cardKey="verificationUsersToday"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    <StatCard
                      icon={TrendingUp}
                      title="PROFESSIONAL REFERRALS"
                      value={statistics?.professionalsReferrals || 0}
                      color="orange"
                      dailyChange={statistics?.professionalsReferralsDailyChange}
                      cardKey="professionalsReferrals"
                      badge={statistics?.professionalsReferralsDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/referrals-professional")}
                    />
                    <StatCard
                      icon={AlertCircle}
                      title="FLAGGED"
                      value={statistics?.flagged || 0}
                      color="orange"
                      dailyChange={statistics?.flaggedDailyChange}
                      cardKey="flagged"
                      badge={statistics?.flaggedDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
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
                      cardKey="clients"
                      badge={statistics?.clientsDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/clients")}
                    />
                    <StatCard
                      icon={Gavel}
                      title="TOTAL JOB IN DISPUTE"
                      value={statistics?.totalJobInDispute || 0}
                      color="red"
                      dailyChange={statistics?.totalJobInDisputeDailyChange}
                      cardKey="totalJobInDispute"
                      badge={statistics?.totalJobInDisputeDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/dispute-list")}
                    />
                    <StatCard
                      icon={CreditCard}
                      title="PENDING WITHDRAWAL REQUEST"
                      value={statistics?.pendingWithdrawalRequest || 0}
                      color="red"
                      dailyChange={statistics?.pendingWithdrawalRequestDailyChange}
                      cardKey="pendingWithdrawalRequest"
                      badge={statistics?.pendingWithdrawalRequestDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/withdrawal-request")}
                    />
                    <StatCard
                      icon={MessageCircle}
                      title="MESSAGE CENTER"
                      value={statistics?.messageCenter || 0}
                      badge={statistics?.messageCenterNew || 0}
                      color="red"
                      dailyChange={statistics?.messageCenterDailyChange}
                      cardKey="messageCenter"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/message-center")}
                    />
                    <StatCard
                      icon={TrendingUp}
                      title="CLIENT REFERRALS"
                      value={statistics?.clientsReferrals || 0}
                      color="red"
                      dailyChange={statistics?.clientsReferralsDailyChange}
                      cardKey="clientsReferrals"
                      badge={statistics?.clientsReferralsDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/referrals-client")}
                    />
                    <StatCard
                      icon={Archive}
                      title="DELETED ACCOUNT"
                      value={statistics?.deletedAccount || 0}
                      badge={statistics?.deletedAccountNew || 0}
                      color="red"
                      dailyChange={statistics?.deletedAccountDailyChange}
                      cardKey="deletedAccount"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/delete-account")}
                    />
                    <StatCard
                      icon={Package}
                      title="ORDERS"
                      value={statistics?.orders || 0}
                      badge={statistics?.ordersNew || 0}
                      color="red"
                      dailyChange={statistics?.ordersDailyChange}
                      cardKey="orders"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/service-order")}
                    />
                    <StatCard
                      icon={Clock}
                      title="APPROVAL PENDING SERVICE"
                      value={statistics?.approvalPendingService || 0}
                      color="red"
                      dailyChange={statistics?.approvalPendingServiceDailyChange}
                      cardKey="approvalPendingService"
                      badge={statistics?.approvalPendingServiceDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
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
                      cardKey="subadmin"
                      badge={statistics?.subadminDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/sub-admins")}
                    />
                    <StatCard
                      icon={Package}
                      title="TOTAL PLANS & PACKAGES"
                      value={statistics?.totalPlansPackages || 0}
                      color="green"
                      dailyChange={statistics?.totalPlansPackagesDailyChange}
                      cardKey="totalPlansPackages"
                      badge={statistics?.totalPlansPackagesDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/packages")}
                    />
                    <StatCard
                      icon={Send}
                      title="NEW CONTACT REQUEST"
                      value={statistics?.newContactRequest || 0}
                      badge={statistics?.newContactRequestNew || 0}
                      color="green"
                      dailyChange={statistics?.newContactRequestDailyChange}
                      cardKey="newContactRequest"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/contact-requests")}
                    />
                    <StatCard
                      icon={Gift}
                      title="AFFILIATE"
                      value={statistics?.affiliate || 0}
                      badge={statistics?.affiliateNew || 0}
                      color="green"
                      dailyChange={statistics?.affiliateDailyChange}
                      cardKey="affiliate"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/affiliate")}
                    />
                    <StatCard
                      icon={Handshake}
                      title="ASK TO STEP IN"
                      value={statistics?.askToStepIn || 0}
                      color="green"
                      dailyChange={statistics?.askToStepInDailyChange}
                      cardKey="askToStepIn"
                      badge={statistics?.askToStepInDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/ask-step-in")}
                    />
                    <StatCard
                      icon={List}
                      title="SERVICE LISTING"
                      value={statistics?.serviceListing || 0}
                      color="green"
                      dailyChange={statistics?.serviceListingDailyChange}
                      cardKey="serviceListing"
                      badge={statistics?.serviceListingDailyChange}
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
                      onClick={() => navigate("/admin/service")}
                    />
                    <StatCard
                      icon={Box}
                      title="CUSTOM ORDERS"
                      value={statistics?.customOrders || 0}
                      badge={statistics?.customOrdersNew || 0}
                      color="green"
                      dailyChange={statistics?.customOrdersDailyChange}
                      cardKey="customOrders"
                      viewedCards={viewedCards}
                      onCardClick={handleCardClick}
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
  dailyChange,
  cardKey,
  viewedCards,
  onCardClick
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  badge?: number;
  color: "orange" | "red" | "green";
  onClick?: () => void;
  dailyChange?: number;
  cardKey?: string;
  viewedCards?: Record<string, string>;
  onCardClick?: (cardKey: string) => void | Promise<void>;
}) {
  // Check if card has been viewed
  const isViewed = cardKey && viewedCards && viewedCards[cardKey];
  // Only show badge if card has not been viewed and has badge value
  const shouldShowBadge = !isViewed && ((badge !== undefined && badge > 0) || (dailyChange !== undefined && dailyChange !== 0 && badge === undefined));

  const handleClick = async () => {
    // Mark card as viewed if cardKey is provided
    if (cardKey && onCardClick && !isViewed) {
      await onCardClick(cardKey);
    }
    // Navigate if onClick is provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`relative rounded-2xl bg-white dark:bg-black border border-[#FE8A0F]/20 p-6 shadow-lg shadow-[#FE8A0F]/10 hover:shadow-2xl hover:shadow-[#FE8A0F]/20 transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={handleClick}
    >
      {/* Badge */}
      {shouldShowBadge ? (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full min-w-[28px] h-7 flex items-center justify-center px-2.5 z-30 shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-black">
          {badge !== undefined && badge > 0 ? badge : (dailyChange !== undefined && dailyChange !== 0 ? Math.abs(dailyChange) : 0)}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        {/* Left side - Content */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-[#FE8A0F]">
            {value.toLocaleString()}
          </p>
          {dailyChange !== undefined && dailyChange !== 0 && (
            <p className={`text-sm font-medium ${dailyChange > 0 ? "text-green-600" : "text-red-600"}`}>
              {dailyChange > 0 ? "+" : ""}{dailyChange} today
            </p>
          )}
        </div>

        {/* Right side - Large Icon */}
        <div className="flex-shrink-0">
          <div className="p-4 bg-[#FE8A0F]/10 rounded-xl shadow-md shadow-[#FE8A0F]/20">
            <Icon className="w-12 h-12 text-[#FE8A0F]" />
          </div>
        </div>
      </div>
    </div>
  );
}

