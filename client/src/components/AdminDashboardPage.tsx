import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense } from "react";
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
  Star,
  Truck,
  CheckCircle,
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
import AdminServiceCategoriesPage from "./admin/AdminServiceCategoriesPage";
import AdminServiceTitlesPage from "./admin/AdminServiceTitlesPage";
import AdminServiceAttributesPage from "./admin/AdminServiceAttributesPage";
import AdminEmailCampaignPage from "./admin/AdminEmailCampaignPage";
import AdminServicesPage from "./admin/AdminServicesPage";
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
  const { hasRouteAccess, loading: permissionsLoading, isSuperAdmin, hasPermission } = useAdminPermissions();
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const isInitialLoadRef = useRef(true);
  const [dashboardTab, setDashboardTab] = useState("state");
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

  // Fetch dashboard statistics (only for super admin)
  const fetchStatistics = useCallback(async (showLoading = false) => {
    // Don't fetch statistics for subadmins
    if (!isSuperAdmin) {
      setLoadingStats(false);
      return;
    }
    
    try {
      // Only show loading indicator on initial load or when explicitly requested
      if (showLoading || isInitialLoadRef.current) {
        setLoadingStats(true);
      }
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/statistics`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // console.log("Statistics data received:", data);
        if (data.statistics) {
          setStatistics(data.statistics);
          // console.log("Statistics set:", data.statistics);
        } else {
          // console.error("No statistics in response:", data);
        }
      } else {
        // console.error("Failed to fetch statistics:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        // console.error("Error data:", errorData);
      }
    } catch (error) {
      // console.error("Error fetching statistics:", error);
    } finally {
      if (showLoading || isInitialLoadRef.current) {
        setLoadingStats(false);
        isInitialLoadRef.current = false;
      }
    }
  }, [isSuperAdmin]);


  // Fetch dashboard statistics on mount and when activeSection changes
  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchStatistics();
    }
  }, [activeSection, fetchStatistics]);

  // Real-time updates: Poll statistics every 30 seconds when on dashboard
  // Update silently in background without showing loading indicator
  useEffect(() => {
    if (activeSection !== "dashboard") {
      return;
    }

    const interval = setInterval(() => {
      fetchStatistics(false); // Don't show loading indicator for background updates
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [activeSection, fetchStatistics]);

  // Get section label from URL
  const getSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      clients: "Clients",
      professionals: "Professionals",
      "sub-admins": "Sub Admins",
      "delete-account": "Deleted Account",
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
      case "service-category":
        return <AdminServiceCategoriesPage />;
      case "service-titles":
        return <AdminServiceTitlesPage />;
      case "service-attributes":
        return <AdminServiceAttributesPage />;
      case "all-service":
        return (
          <AdminServicesPage
            initialTab="all"
            title="All Services"
            description="View and manage all professional services"
          />
        );
      case "approval-pending-service":
        return (
          <AdminServicesPage
            initialTab="pending"
            title="Approval Pending Services"
            description="View and manage services pending approval"
            hideStatusFilter={true}
          />
        );
      case "required-modification-service":
        return (
          <AdminServicesPage
            initialTab="required_modification"
            title="Required Modification Services"
            description="View and manage services that require modification"
            hideStatusFilter={true}
          />
        );
      case "approved-service":
        return (
          <AdminServicesPage
            initialTab="approved"
            title="Approved Services"
            description="View and manage approved services"
            hideStatusFilter={true}
          />
        );
      case "email-campaign":
        // Check permission-based access for email campaign
        if (!hasRouteAccess("/admin/email-campaign")) {
          navigate("/admin/dashboard", { replace: true });
          return null;
        }
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

  // Map state cards to required permissions
  const getCardPermission = (cardTitle: string): string | null => {
    const cardPermissionMap: Record<string, string> = {
      "CLIENTS": "clients-management",
      "CLIENT REFERRALS": "clients-management", // Requires clients-management to see client referrals
      "PROFESSIONALS": "professionals-management",
      "PROFESSIONAL REFERRALS": "professionals-management", // Requires professionals-management to see professional referrals
      "ACCOUNT VERIFICATION DOCUMENT": "professionals-management", // Related to professionals
      "TOTAL VERIFICATION USERS": "professionals-management",
      "VERIFICATION USERS TODAY": "professionals-management",
      "TOTAL JOB CATEGORY": "category-management",
      "TOTAL SECTOR": "sector-management",
      "TOTAL JOB SUB CATEGORY": "category-management",
      "TOTAL SERVICE CATEGORY": "service-category-management",
      "TOTAL SERVICE SUB CATEGORY": "service-category-management",
      "TOTAL PLANS & PACKAGES": "package-management",
      "NEW CONTACT REQUEST": "contact-management", // Visible if has contact-management, clients-management, or professionals-management
      "TOTAL JOB": "job-management",
      "TOTAL JOB IN DISPUTE": "dispute-management",
      "PENDING WITHDRAWAL REQUEST": "withdrawal-request",
      "MESSAGE CENTER": "message-center",
      "ORDERS": "service-order",
      "APPROVAL PENDING SERVICE": "service",
      "SERVICE LISTING": "service",
      "CUSTOM ORDERS": "custom-order",
      "ASK TO STEP IN": "dispute-management",
      "AFFILIATE": "affiliate",
      "FLAGGED": "flagged",
      "SUBADMIN": "admin-management",
      "DELETED ACCOUNT": "user-management",
    };
    return cardPermissionMap[cardTitle] || null;
  };

  // Check if a card should be visible based on permissions
  const shouldShowCard = (cardTitle: string): boolean => {
    if (isSuperAdmin) return true;
    const requiredPermission = getCardPermission(cardTitle);
    if (!requiredPermission) return false; // Unknown cards hidden for subadmins
    
    // Special handling for NEW CONTACT REQUEST - visible if has contact-management, clients-management, or professionals-management
    if (cardTitle === "NEW CONTACT REQUEST") {
      return hasPermission("contact-management") || 
             hasPermission("clients-management") || 
             hasPermission("professionals-management");
    }
    
    // Special handling for MESSAGE CENTER - visible if has message-center or professionals-management permission
    if (cardTitle === "MESSAGE CENTER") {
      return hasPermission("message-center") || 
             hasPermission("professionals-management");
    }
    
    return hasPermission(requiredPermission);
  };

  // Render dashboard content or other sections
  if (activeSection === "dashboard") {
    // Subadmins can see dashboard but only their permission-related cards
    // Super admin sees all cards and tabs
    if (!isSuperAdmin) {
      // For subadmins, show only state cards (no statistics tab)
      return (
        <div className="space-y-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
              Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Overview of your assigned management areas
            </p>
          </div>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8A0F] mx-auto mb-4"></div>
                <p className="text-black dark:text-white">Loading statistics...</p>
              </div>
            </div>
          ) : (
            <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {/* Collect all cards and filter by permissions, then render in 3-column grid */}
              {[
                // Orange Cards
                { title: "PROFESSIONALS", icon: Users, color: "orange" as const, value: statistics?.professionals || 0, dailyChange: statistics?.professionalsDailyChange, badge: statistics?.professionalsNew, onClick: () => navigate("/admin/professionals") },
                { title: "TOTAL JOB", icon: Hammer, color: "orange" as const, value: statistics?.totalJob || 0, dailyChange: statistics?.totalJobDailyChange, badge: statistics?.totalJobDailyChange, onClick: () => navigate("/admin/job-manage") },
                { title: "TOTAL JOB CATEGORY", icon: FolderTree, color: "orange" as const, value: statistics?.totalJobCategory || 0, dailyChange: statistics?.totalJobCategoryDailyChange, badge: statistics?.totalJobCategoryDailyChange, onClick: () => navigate("/admin/categories") },
                { title: "TOTAL SECTOR", icon: FolderTree, color: "orange" as const, value: statistics?.totalSector || 0, dailyChange: statistics?.totalSectorDailyChange, badge: statistics?.totalSectorDailyChange, onClick: () => navigate("/admin/sectors") },
                { title: "TOTAL JOB SUB CATEGORY", icon: FolderTree, color: "orange" as const, value: statistics?.totalJobSubCategory || 0, dailyChange: statistics?.totalJobSubCategoryDailyChange, badge: statistics?.totalJobSubCategoryDailyChange, onClick: () => navigate("/admin/categories") },
                { title: "TOTAL SERVICE CATEGORY", icon: FolderTree, color: "orange" as const, value: statistics?.totalServiceCategory || 0, dailyChange: statistics?.totalServiceCategoryDailyChange, badge: statistics?.totalServiceCategoryDailyChange, onClick: () => navigate("/admin/service-categories") },
                { title: "TOTAL SERVICE SUB CATEGORY", icon: FolderTree, color: "orange" as const, value: statistics?.totalServiceSubCategory || 0, dailyChange: statistics?.totalServiceSubCategoryDailyChange, badge: statistics?.totalServiceSubCategoryDailyChange, onClick: () => navigate("/admin/service-categories") },
                { title: "ACCOUNT VERIFICATION DOCUMENT", icon: ShieldCheck, color: "orange" as const, value: statistics?.accountVerificationDocument || 0, dailyChange: statistics?.accountVerificationDocumentDailyChange, badge: statistics?.accountVerificationDocumentNew || 0, onClick: () => navigate("/admin/professionals") },
                { title: "TOTAL VERIFICATION USERS", icon: UserCheck, color: "orange" as const, value: statistics?.totalVerificationUsers || 0, dailyChange: undefined, badge: undefined, onClick: () => navigate("/admin/professionals") },
                { title: "VERIFICATION USERS TODAY", icon: Calendar, color: "orange" as const, value: statistics?.verificationUsersToday || 0, dailyChange: undefined, badge: undefined, onClick: () => navigate("/admin/professionals") },
                { title: "PROFESSIONAL REFERRALS", icon: TrendingUp, color: "orange" as const, value: statistics?.professionalsReferrals || 0, dailyChange: statistics?.professionalsReferralsDailyChange, badge: statistics?.professionalsReferralsDailyChange, onClick: () => navigate("/admin/referrals-professional") },
                { title: "FLAGGED", icon: AlertCircle, color: "orange" as const, value: statistics?.flagged || 0, dailyChange: statistics?.flaggedDailyChange, badge: statistics?.flaggedDailyChange, onClick: () => navigate("/admin/flagged") },
                // Red Cards
                { title: "CLIENTS", icon: Users, color: "red" as const, value: statistics?.clients || 0, dailyChange: statistics?.clientsDailyChange, badge: statistics?.clientsNew, onClick: () => navigate("/admin/clients") },
                { title: "TOTAL JOB IN DISPUTE", icon: Gavel, color: "red" as const, value: statistics?.totalJobInDispute || 0, dailyChange: statistics?.totalJobInDisputeDailyChange, badge: statistics?.totalJobInDisputeDailyChange, onClick: () => navigate("/admin/dispute-list") },
                { title: "PENDING WITHDRAWAL REQUEST", icon: CreditCard, color: "red" as const, value: statistics?.pendingWithdrawalRequest || 0, dailyChange: statistics?.pendingWithdrawalRequestDailyChange, badge: statistics?.pendingWithdrawalRequestDailyChange, onClick: () => navigate("/admin/withdrawal-request") },
                { title: "MESSAGE CENTER", icon: MessageCircle, color: "red" as const, value: statistics?.messageCenter || 0, dailyChange: statistics?.messageCenterDailyChange, badge: statistics?.messageCenterNew || 0, onClick: () => navigate("/admin/message-center") },
                { title: "CLIENT REFERRALS", icon: TrendingUp, color: "red" as const, value: statistics?.clientsReferrals || 0, dailyChange: statistics?.clientsReferralsDailyChange, badge: statistics?.clientsReferralsDailyChange, onClick: () => navigate("/admin/referrals-client") },
                { title: "DELETED ACCOUNT", icon: Archive, color: "red" as const, value: statistics?.deletedAccount || 0, dailyChange: statistics?.deletedAccountDailyChange, badge: statistics?.deletedAccountNew || 0, onClick: () => navigate("/admin/delete-account") },
                { title: "ORDERS", icon: Package, color: "red" as const, value: statistics?.orders || 0, dailyChange: statistics?.ordersDailyChange, badge: statistics?.ordersNew || 0, onClick: () => navigate("/admin/service-order") },
                { title: "APPROVAL PENDING SERVICE", icon: Clock, color: "red" as const, value: statistics?.approvalPendingService || 0, dailyChange: statistics?.approvalPendingServiceDailyChange, badge: statistics?.approvalPendingService || 0, onClick: () => navigate("/admin/approval-pending-service") },
                // Green Cards
                { title: "SUBADMIN", icon: Users, color: "green" as const, value: statistics?.subadmin || 0, dailyChange: statistics?.subadminDailyChange, badge: statistics?.subadminNew, onClick: () => navigate("/admin/sub-admins") },
                { title: "TOTAL PLANS & PACKAGES", icon: Package, color: "green" as const, value: statistics?.totalPlansPackages || 0, dailyChange: statistics?.totalPlansPackagesDailyChange, badge: statistics?.totalPlansPackagesDailyChange, onClick: () => navigate("/admin/packages") },
                { title: "NEW CONTACT REQUEST", icon: Send, color: "green" as const, value: statistics?.newContactRequest || 0, dailyChange: statistics?.newContactRequestDailyChange, badge: statistics?.newContactRequestNew || 0, onClick: () => {
                    // Navigate to appropriate page based on permissions
                    if (hasPermission("professionals-management") && !hasPermission("clients-management")) {
                      navigate("/admin/professional-requests");
                    } else if (hasPermission("clients-management") && !hasPermission("professionals-management")) {
                      navigate("/admin/client-requests");
                    } else {
                      navigate("/admin/contact-requests");
                    }
                  } },
                { title: "AFFILIATE", icon: Gift, color: "green" as const, value: statistics?.affiliate || 0, dailyChange: statistics?.affiliateDailyChange, badge: statistics?.affiliateNew || 0, onClick: () => navigate("/admin/affiliate") },
                { title: "ASK TO STEP IN", icon: Handshake, color: "green" as const, value: statistics?.askToStepIn || 0, dailyChange: statistics?.askToStepInDailyChange, badge: statistics?.askToStepInDailyChange, onClick: () => navigate("/admin/ask-step-in") },
                { title: "SERVICE LISTING", icon: List, color: "green" as const, value: statistics?.serviceListing || 0, dailyChange: statistics?.serviceListingDailyChange, badge: statistics?.serviceListingDailyChange, onClick: () => navigate("/admin/service") },
                { title: "CUSTOM ORDERS", icon: Box, color: "green" as const, value: statistics?.customOrders || 0, dailyChange: statistics?.customOrdersDailyChange, badge: statistics?.customOrdersNew || 0, onClick: () => navigate("/admin/custom-order") },
              ]
                .filter(card => shouldShowCard(card.title))
                .map((card, index) => (
                  <StatCard
                    key={`${card.title}-${index}`}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    color={card.color}
                    dailyChange={card.dailyChange}
                    badge={card.badge}
                    onClick={card.onClick}
                  />
                ))}
            </section>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-8">
              {/* Dashboard Tabs - Only for Super Admin */}
              <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger 
                    value="state"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-md data-[state=active]:shadow-[#FE8A0F]/30 text-gray-600 dark:text-gray-400 border-0 transition-all"
                  >
                    State
                  </TabsTrigger>
                  <TabsTrigger 
                    value="statistics"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-md data-[state=active]:shadow-[#FE8A0F]/30 text-gray-600 dark:text-gray-400 border-0 transition-all"
                  >
                    Statistics
                  </TabsTrigger>
                </TabsList>

                {/* State Tab */}
                <TabsContent value="state" className="mt-6">
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8A0F] mx-auto mb-4"></div>
                        <p className="text-black dark:text-white">Loading statistics...</p>
                      </div>
                    </div>
                  ) : (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        // Orange
                        { show: shouldShowCard("PROFESSIONALS"), icon: Users, title: "PROFESSIONALS", value: statistics?.professionals || 0, color: "orange" as const, dailyChange: statistics?.professionalsDailyChange, badge: statistics?.professionalsNew, onClick: () => navigate("/admin/professionals") },
                        { show: shouldShowCard("TOTAL JOB"), icon: Hammer, title: "TOTAL JOB", value: statistics?.totalJob || 0, color: "orange" as const, dailyChange: statistics?.totalJobDailyChange, badge: statistics?.totalJobDailyChange, onClick: () => navigate("/admin/job-manage") },
                        { show: shouldShowCard("TOTAL JOB CATEGORY"), icon: FolderTree, title: "TOTAL JOB CATEGORY", value: statistics?.totalJobCategory || 0, color: "orange" as const, dailyChange: statistics?.totalJobCategoryDailyChange, badge: statistics?.totalJobCategoryDailyChange, onClick: () => navigate("/admin/categories") },
                        { show: shouldShowCard("TOTAL SECTOR"), icon: FolderTree, title: "TOTAL SECTOR", value: statistics?.totalSector || 0, color: "orange" as const, dailyChange: statistics?.totalSectorDailyChange, badge: statistics?.totalSectorDailyChange, onClick: () => navigate("/admin/sectors") },
                        { show: shouldShowCard("TOTAL JOB SUB CATEGORY"), icon: FolderTree, title: "TOTAL JOB SUB CATEGORY", value: statistics?.totalJobSubCategory || 0, color: "orange" as const, dailyChange: statistics?.totalJobSubCategoryDailyChange, badge: statistics?.totalJobSubCategoryDailyChange, onClick: () => navigate("/admin/categories") },
                        { show: shouldShowCard("TOTAL SERVICE CATEGORY"), icon: FolderTree, title: "TOTAL SERVICE CATEGORY", value: statistics?.totalServiceCategory || 0, color: "orange" as const, dailyChange: statistics?.totalServiceCategoryDailyChange, badge: statistics?.totalServiceCategoryDailyChange, onClick: () => navigate("/admin/service-categories") },
                        { show: shouldShowCard("TOTAL SERVICE SUB CATEGORY"), icon: FolderTree, title: "TOTAL SERVICE SUB CATEGORY", value: statistics?.totalServiceSubCategory || 0, color: "orange" as const, dailyChange: statistics?.totalServiceSubCategoryDailyChange, badge: statistics?.totalServiceSubCategoryDailyChange, onClick: () => navigate("/admin/service-categories") },
                        { show: shouldShowCard("ACCOUNT VERIFICATION DOCUMENT"), icon: ShieldCheck, title: "ACCOUNT VERIFICATION DOCUMENT", value: statistics?.accountVerificationDocument || 0, color: "orange" as const, dailyChange: statistics?.accountVerificationDocumentDailyChange, badge: statistics?.accountVerificationDocumentNew || 0, onClick: () => navigate("/admin/professionals") },
                        { show: shouldShowCard("TOTAL VERIFICATION USERS"), icon: UserCheck, title: "TOTAL VERIFICATION USERS", value: statistics?.totalVerificationUsers || 0, color: "orange" as const, onClick: () => navigate("/admin/professionals") },
                        { show: shouldShowCard("VERIFICATION USERS TODAY"), icon: Calendar, title: "VERIFICATION USERS TODAY", value: statistics?.verificationUsersToday || 0, color: "orange" as const, onClick: () => navigate("/admin/professionals") },
                        { show: shouldShowCard("PROFESSIONAL REFERRALS"), icon: TrendingUp, title: "PROFESSIONAL REFERRALS", value: statistics?.professionalsReferrals || 0, color: "orange" as const, dailyChange: statistics?.professionalsReferralsDailyChange, badge: statistics?.professionalsReferralsDailyChange, onClick: () => navigate("/admin/referrals-professional") },
                        { show: shouldShowCard("FLAGGED"), icon: AlertCircle, title: "FLAGGED", value: statistics?.flagged || 0, color: "orange" as const, dailyChange: statistics?.flaggedDailyChange, badge: statistics?.flaggedDailyChange, onClick: () => navigate("/admin/flagged") },

                        // Red
                        { show: shouldShowCard("CLIENTS"), icon: Users, title: "CLIENTS", value: statistics?.clients || 0, color: "red" as const, dailyChange: statistics?.clientsDailyChange, badge: statistics?.clientsNew, onClick: () => navigate("/admin/clients") },
                        { show: shouldShowCard("TOTAL JOB IN DISPUTE"), icon: Gavel, title: "TOTAL JOB IN DISPUTE", value: statistics?.totalJobInDispute || 0, color: "red" as const, dailyChange: statistics?.totalJobInDisputeDailyChange, badge: statistics?.totalJobInDisputeDailyChange, onClick: () => navigate("/admin/dispute-list") },
                        { show: shouldShowCard("PENDING WITHDRAWAL REQUEST"), icon: CreditCard, title: "PENDING WITHDRAWAL REQUEST", value: statistics?.pendingWithdrawalRequest || 0, color: "red" as const, dailyChange: statistics?.pendingWithdrawalRequestDailyChange, badge: statistics?.pendingWithdrawalRequestDailyChange, onClick: () => navigate("/admin/withdrawal-request") },
                        { show: shouldShowCard("MESSAGE CENTER"), icon: MessageCircle, title: "MESSAGE CENTER", value: statistics?.messageCenter || 0, color: "red" as const, dailyChange: statistics?.messageCenterDailyChange, badge: statistics?.messageCenterNew || 0, onClick: () => navigate("/admin/message-center") },
                        { show: shouldShowCard("CLIENT REFERRALS"), icon: TrendingUp, title: "CLIENT REFERRALS", value: statistics?.clientsReferrals || 0, color: "red" as const, dailyChange: statistics?.clientsReferralsDailyChange, badge: statistics?.clientsReferralsDailyChange, onClick: () => navigate("/admin/referrals-client") },
                        { show: shouldShowCard("DELETED ACCOUNT"), icon: Archive, title: "DELETED ACCOUNT", value: statistics?.deletedAccount || 0, color: "red" as const, dailyChange: statistics?.deletedAccountDailyChange, badge: statistics?.deletedAccountNew || 0, onClick: () => navigate("/admin/delete-account") },
                        { show: shouldShowCard("ORDERS"), icon: Package, title: "ORDERS", value: statistics?.orders || 0, color: "red" as const, dailyChange: statistics?.ordersDailyChange, badge: statistics?.ordersNew || 0, onClick: () => navigate("/admin/service-order") },
                        { show: shouldShowCard("APPROVAL PENDING SERVICE"), icon: Clock, title: "APPROVAL PENDING SERVICE", value: statistics?.approvalPendingService || 0, color: "red" as const, dailyChange: statistics?.approvalPendingServiceDailyChange, badge: statistics?.approvalPendingServiceDailyChange, onClick: () => navigate("/admin/approval-pending-service") },

                        // Green
                        { show: shouldShowCard("SUBADMIN"), icon: Users, title: "SUBADMIN", value: statistics?.subadmin || 0, color: "green" as const, dailyChange: statistics?.subadminDailyChange, badge: statistics?.subadminNew, onClick: () => navigate("/admin/sub-admins") },
                        { show: shouldShowCard("TOTAL PLANS & PACKAGES"), icon: Package, title: "TOTAL PLANS & PACKAGES", value: statistics?.totalPlansPackages || 0, color: "green" as const, dailyChange: statistics?.totalPlansPackagesDailyChange, badge: statistics?.totalPlansPackagesDailyChange, onClick: () => navigate("/admin/packages") },
                        { show: shouldShowCard("NEW CONTACT REQUEST"), icon: Send, title: "NEW CONTACT REQUEST", value: statistics?.newContactRequest || 0, color: "green" as const, dailyChange: statistics?.newContactRequestDailyChange, badge: statistics?.newContactRequestNew || 0, onClick: () => {
                          if (hasPermission("professionals-management") && !hasPermission("clients-management")) {
                            navigate("/admin/professional-requests");
                          } else if (hasPermission("clients-management") && !hasPermission("professionals-management")) {
                            navigate("/admin/client-requests");
                          } else {
                            navigate("/admin/contact-requests");
                          }
                        } },
                        { show: shouldShowCard("AFFILIATE"), icon: Gift, title: "AFFILIATE", value: statistics?.affiliate || 0, color: "green" as const, dailyChange: statistics?.affiliateDailyChange, badge: statistics?.affiliateNew || 0, onClick: () => navigate("/admin/affiliate") },
                        { show: shouldShowCard("ASK TO STEP IN"), icon: Handshake, title: "ASK TO STEP IN", value: statistics?.askToStepIn || 0, color: "green" as const, dailyChange: statistics?.askToStepInDailyChange, badge: statistics?.askToStepInDailyChange, onClick: () => navigate("/admin/ask-step-in") },
                        { show: shouldShowCard("SERVICE LISTING"), icon: List, title: "SERVICE LISTING", value: statistics?.serviceListing || 0, color: "green" as const, dailyChange: statistics?.serviceListingDailyChange, badge: statistics?.serviceListingDailyChange, onClick: () => navigate("/admin/service") },
                        { show: shouldShowCard("CUSTOM ORDERS"), icon: Box, title: "CUSTOM ORDERS", value: statistics?.customOrders || 0, color: "green" as const, dailyChange: statistics?.customOrdersDailyChange, badge: statistics?.customOrdersNew || 0, onClick: () => navigate("/admin/custom-order") },
                      ]
                        .filter((c) => c.show)
                        .map((c, idx) => (
                          <StatCard
                            key={`${c.title}-${idx}`}
                            icon={c.icon}
                            title={c.title}
                            value={c.value}
                            color={c.color}
                            dailyChange={c.dailyChange}
                            badge={c.badge}
                            onClick={c.onClick}
                          />
                        ))}
                    </section>
                  )}
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="statistics" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Users */}
                    <StatCard
                      icon={Users}
                      title="TOTAL USERS"
                      value={statistics?.totalUsers || 0}
                      color="orange"
                      dailyChange={statistics?.totalUsersDailyChange}
                      onClick={() => navigate("/admin/dashboard")}
                    />
                    
                    {/* Active Clients */}
                    <StatCard
                      icon={UserCheck}
                      title="ACTIVE CLIENTS"
                      value={statistics?.activeClients || 0}
                      color="red"
                      dailyChange={statistics?.clientsDailyChange}
                      onClick={() => navigate("/admin/clients")}
                    />
                    
                    {/* Professionals */}
                    <StatCard
                      icon={BriefcaseBusiness}
                      title="PROFESSIONALS"
                      value={statistics?.professionals || 0}
                      color="green"
                      dailyChange={statistics?.professionalsDailyChange}
                      badge={statistics?.professionalsNew}
                      onClick={() => navigate("/admin/professionals")}
                    />
                    
                    {/* Monthly Revenue */}
                    <StatCard
                      icon={Wallet}
                      title="MONTHLY REVENUE"
                      value={statistics?.monthlyRevenue || 0}
                      color="orange"
                      dailyChange={statistics?.monthlyRevenueDailyChange}
                      onClick={() => navigate("/admin/payment-finance")}
                    />
                    
                    {/* Total Jobs */}
                    <StatCard
                      icon={Hammer}
                      title="TOTAL JOBS"
                      value={statistics?.totalJobs || 0}
                      color="orange"
                      dailyChange={statistics?.totalJobsDailyChange}
                      badge={statistics?.totalJobsDailyChange}
                      onClick={() => navigate("/admin/job-manage")}
                    />
                    
                    {/* Total Services */}
                    <StatCard
                      icon={List}
                      title="TOTAL SERVICES"
                      value={statistics?.totalServices || 0}
                      color="orange"
                      dailyChange={statistics?.totalServicesDailyChange}
                      badge={statistics?.totalServicesDailyChange}
                      onClick={() => navigate("/admin/service")}
                    />
                    
                    {/* Total Orders */}
                    <StatCard
                      icon={Package}
                      title="TOTAL ORDERS"
                      value={statistics?.totalOrders || 0}
                      color="red"
                      dailyChange={statistics?.totalOrdersDailyChange}
                      badge={statistics?.totalOrdersDailyChange}
                      onClick={() => navigate("/admin/service-order")}
                    />
                    
                    {/* Total Deliveries */}
                    <StatCard
                      icon={Truck}
                      title="TOTAL DELIVERIES"
                      value={statistics?.totalDeliveries || 0}
                      color="green"
                      dailyChange={statistics?.totalDeliveriesDailyChange}
                      badge={statistics?.totalDeliveriesDailyChange}
                      onClick={() => navigate("/admin/deliveries")}
                    />
                    
                    {/* Total Reviews */}
                    <StatCard
                      icon={Star}
                      title="TOTAL REVIEWS"
                      value={statistics?.totalReviews || 0}
                      color="green"
                      dailyChange={statistics?.totalReviewsDailyChange}
                      badge={statistics?.totalReviewsDailyChange}
                      onClick={() => navigate("/admin/reviews")}
                    />
                  </div>

                  {/* Chart Cards Section */}
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
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  badge?: number;
  color: "orange" | "red" | "green";
  onClick?: () => void;
  dailyChange?: number;
}) {
  // Show badge if badge value is provided and greater than 0
  // Badge displays new count in real-time
  const shouldShowBadge = badge !== undefined && badge !== null && badge > 0;

  return (
    <div 
      className={`relative rounded-2xl bg-white dark:bg-black border border-[#FE8A0F]/20 p-6 shadow-lg shadow-[#FE8A0F]/10 hover:shadow-2xl hover:shadow-[#FE8A0F]/20 transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      {/* Badge - Shows new count in real-time */}
      {shouldShowBadge && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full min-w-[28px] h-7 flex items-center justify-center px-2.5 z-30 shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-black">
          {badge}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left side - Content */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-[#FE8A0F]">
            {value.toLocaleString()}
          </p>
          {dailyChange !== undefined && (
            <p className={`text-sm font-medium ${dailyChange > 0 ? "text-green-600" : dailyChange < 0 ? "text-red-600" : "text-gray-500"}`}>
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

