import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Users, UserCheck, BriefcaseBusiness, Wallet } from "lucide-react";
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
import AdminDeleteAccountPage from "./admin/AdminDeleteAccountPage";
import AdminReferralsClientPage from "./admin/AdminReferralsClientPage";
import AdminReferralsProfessionalPage from "./admin/AdminReferralsProfessionalPage";

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Get active section from URL, default to "dashboard"
  // URL section is already in the correct format (clients, professionals, etc.)
  const activeSection = params.section || "dashboard";
  
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
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="group rounded-3xl border-2 border-[#FE8A0F] bg-[#07013d] p-5 
                                 shadow-[0_0_20px_rgba(254,138,15,0.2)]
                                 hover:shadow-[0_0_30px_rgba(254,138,15,0.3)]
                                 transition-all duration-300 transform hover:-translate-y-1"
                      style={{
                        boxShadow: '0 0 20px rgba(254, 138, 15, 0.2), inset 0 0 10px rgba(254, 138, 15, 0.05)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-900 dark:text-white">
                            {card.title}
                          </p>
                          <p className="mt-3 text-3xl font-semibold text-[#FE8A0F]">
                            {card.value}
                          </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FE8A0F] to-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-4 text-xs font-semibold text-[#FE8A0F]">
                        {card.delta}
                      </p>
                      <p className="mt-1 text-xs text-slate-900 dark:text-white">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border-2 border-[#FE8A0F] bg-[#07013d] p-6 
                                shadow-[0_0_20px_rgba(254,138,15,0.2)]
                                hover:shadow-[0_0_30px_rgba(254,138,15,0.3)]
                                transition-all duration-300 transform hover:-translate-y-1"
                     style={{
                       boxShadow: '0 0 20px rgba(254, 138, 15, 0.2), inset 0 0 10px rgba(254, 138, 15, 0.05)',
                     }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-900 dark:text-white">
                        Weekly Activity
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#FE8A0F]">
                        New users per day
                      </h2>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Live
                    </span>
                  </div>
                  <div className="mt-2 h-64 rounded-2xl bg-[#07013d] p-3">
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

                <div className="rounded-3xl border-2 border-[#FE8A0F] bg-[#07013d] p-6 
                                shadow-[0_0_20px_rgba(254,138,15,0.2)]
                                hover:shadow-[0_0_30px_rgba(254,138,15,0.3)]
                                transition-all duration-300 transform hover:-translate-y-1"
                     style={{
                       boxShadow: '0 0 20px rgba(254, 138, 15, 0.2), inset 0 0 10px rgba(254, 138, 15, 0.05)',
                     }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-900 dark:text-white">
                        Revenue
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#FE8A0F]">
                        Monthly performance
                      </h2>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-100">
                      Demo data
                    </span>
                  </div>
                  <div className="mt-2 h-64 rounded-2xl bg-[#07013d] p-3">
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

// Section Router Component
function SectionRouter({ activeSection }: { activeSection: string }) {
  // Get section label from URL
  const getSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      clients: "Clients",
      professionals: "Professionals",
      admins: "Admins",
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
