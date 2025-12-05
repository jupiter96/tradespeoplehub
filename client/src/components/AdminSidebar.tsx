import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { useAdminPermissions } from "../hooks/useAdminPermissions";
import {
  Users,
  UserRound,
  BriefcaseBusiness,
  ShieldCheck,
  KeyRound,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  LayoutDashboard,
  X,
  FolderTree,
  Package,
  Tag,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Calendar,
  Star,
  Settings,
  Banknote,
  AlertCircle,
  Gift,
  MessageSquare,
  Share2,
  Flag,
  ShoppingBag,
  FileCheck,
  Trash2,
  Building2,
  Globe,
  BookOpen,
  Image,
  DollarSign,
  Send,
  Code,
  TrendingUp,
  Award,
  UserX,
  Clock,
  MessageCircle,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface MenuChild {
  key: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string; // Direct path for navigation
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path?: string; // Path for main menu items that are direct links (no children)
  children: MenuChild[];
}

const menuItems: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
    children: [],
  },
  {
    key: "user-manage",
    label: "User Manage",
    icon: Users,
    children: [
      { key: "client", label: "Client", icon: UserRound, path: "/admin/clients" },
      { key: "professional", label: "Professional", icon: BriefcaseBusiness, path: "/admin/professionals" },
      { key: "sub-admin", label: "Sub Admin", icon: KeyRound, path: "/admin/sub-admins" },
      { key: "delete-account", label: "Delete Account", icon: UserX, path: "/admin/delete-account" },
    ],
  },
  {
    key: "category-manage",
    label: "Category Manage",
    icon: FolderTree,
    children: [
      { key: "sector", label: "Sector", icon: FolderTree, path: "/admin/sectors" },
      { key: "category", label: "Category", icon: FolderTree, path: "/admin/categories" },
      { key: "default-content", label: "Default Content", icon: FileText, path: "/admin/default-content" },
      { key: "favourite-categories", label: "Favourite Categories", icon: Star, path: "/admin/favourite-categories" },
    ],
  },
  {
    key: "packages",
    label: "Packages & Addons",
    icon: Package,
    children: [
      { key: "packages", label: "Packages", icon: Package, path: "/admin/packages" },
      { key: "package-addons", label: "Package Addons", icon: Package, path: "/admin/package-addons" },
    ],
  },
  {
    key: "coupon-manage",
    label: "Coupon Manage",
    icon: Tag,
    path: "/admin/coupon-manage",
    children: [],
  },
  {
    key: "contact-requests",
    label: "Contact Requests",
    icon: Mail,
    children: [
      { key: "client-requests", label: "Client Requests", icon: UserRound, path: "/admin/client-requests" },
      { key: "professional-requests", label: "Professional Requests", icon: BriefcaseBusiness, path: "/admin/professional-requests" },
    ],
  },
  {
    key: "region-manage",
    label: "Region Manage",
    icon: MapPin,
    children: [
      { key: "country", label: "Country", icon: Globe, path: "/admin/countries" },
      { key: "city", label: "City", icon: Building2, path: "/admin/cities" },
    ],
  },
  {
    key: "content-manage",
    label: "Content Manage",
    icon: FileText,
    children: [
      { key: "homepage-content", label: "Homepage Content", icon: FileText, path: "/admin/homepage-content" },
      { key: "blog-content", label: "Blog Content", icon: BookOpen, path: "/admin/blog-content" },
      { key: "banner-content", label: "Banner Content", icon: Image, path: "/admin/banner-content" },
      { key: "cost-guide", label: "Cost Guide", icon: DollarSign, path: "/admin/cost-guide" },
    ],
  },
  {
    key: "transaction-history",
    label: "Transaction History",
    icon: CreditCard,
    path: "/admin/transaction-history",
    children: [],
  },
  {
    key: "user-plans",
    label: "User Plans",
    icon: Calendar,
    path: "/admin/user-plans",
    children: [],
  },
  {
    key: "job-manage",
    label: "Job Manage",
    icon: BriefcaseBusiness,
    children: [
      { key: "post-a-job", label: "Post a Job", icon: Send, path: "/admin/post-a-job" },
      { key: "job-posts", label: "Job Posts", icon: FileText, path: "/admin/job-posts" },
      { key: "bids-on-posts", label: "Bids on Posts", icon: TrendingUp, path: "/admin/bids-on-posts" },
      { key: "send-emails", label: "Send Emails", icon: Mail, path: "/admin/send-emails" },
      { key: "generate-html", label: "Generate HTML", icon: Code, path: "/admin/generate-html" },
      { key: "job-amount", label: "Job Amount", icon: DollarSign, path: "/admin/job-amount" },
    ],
  },
  {
    key: "ratings-manage",
    label: "Ratings Manage",
    icon: Star,
    path: "/admin/ratings-manage",
    children: [],
  },
  {
    key: "payment-finance",
    label: "Payment & Finance",
    icon: Settings,
    children: [
      { key: "payment-settings", label: "Payment Settings", icon: Settings, path: "/admin/payment-settings" },
      { key: "bank-transfer-request", label: "Bank Transfer Request", icon: Banknote, path: "/admin/bank-transfer-request" },
      { key: "withdrawal-request", label: "Withdrawal Request", icon: DollarSign, path: "/admin/withdrawal-request" },
      { key: "refund", label: "Refund", icon: CreditCard, path: "/admin/refunds" },
    ],
  },
  {
    key: "dispute-manage",
    label: "Dispute Manage",
    icon: AlertCircle,
    children: [
      { key: "dispute-list", label: "Dispute List", icon: AlertCircle, path: "/admin/dispute-list" },
      { key: "ask-step-in", label: "Ask Step In", icon: AlertCircle, path: "/admin/ask-step-in" },
    ],
  },
  {
    key: "rewards",
    label: "Rewards",
    icon: Gift,
    path: "/admin/rewards",
    children: [],
  },
  {
    key: "message-center",
    label: "Message Center",
    icon: MessageSquare,
    path: "/admin/message-center",
    children: [],
  },
  {
    key: "affiliate",
    label: "Affiliate",
    icon: Share2,
    children: [
      { key: "affiliates", label: "Affiliates", icon: Users, path: "/admin/affiliates" },
      { key: "sharable-links", label: "Sharable Links", icon: Share2, path: "/admin/sharable-links" },
      { key: "pay-outs", label: "Pay Outs", icon: DollarSign, path: "/admin/pay-outs" },
      { key: "affiliate-setting", label: "Affiliate Setting", icon: Settings, path: "/admin/affiliate-setting" },
      { key: "affiliate-metadata", label: "Affiliate Metadata", icon: FileText, path: "/admin/affiliate-metadata" },
      { key: "affiliate-support", label: "Affiliate Support", icon: MessageSquare, path: "/admin/affiliate-support" },
    ],
  },
  {
    key: "referrals",
    label: "Referrals",
    icon: Share2,
    children: [
      { key: "referrals-client", label: "Client", icon: UserRound, path: "/admin/referrals-client" },
      { key: "referrals-professional", label: "Professional", icon: BriefcaseBusiness, path: "/admin/referrals-professional" },
    ],
  },
  {
    key: "flagged",
    label: "Flagged",
    icon: Flag,
    path: "/admin/flagged",
    children: [],
  },
  {
    key: "service",
    label: "Service",
    icon: ShoppingBag,
    children: [
      { key: "service-category", label: "Service Category", icon: FolderTree, path: "/admin/service-category" },
      { key: "approval-pending-service", label: "Approval Pending Service", icon: FileCheck, path: "/admin/approval-pending-service" },
      { key: "required-modification-service", label: "Required Modification Service", icon: AlertCircle, path: "/admin/required-modification-service" },
      { key: "approved-service", label: "Approved Service", icon: FileCheck, path: "/admin/approved-service" },
      { key: "all-service", label: "All Service", icon: ShoppingBag, path: "/admin/all-service" },
      { key: "location", label: "Location", icon: MapPin, path: "/admin/locations" },
    ],
  },
  {
    key: "service-order",
    label: "Service Order",
    icon: ShoppingBag,
    children: [
      { key: "completed-order", label: "Completed Order", icon: FileCheck, path: "/admin/completed-order" },
      { key: "pending-order", label: "Pending Order", icon: Clock, path: "/admin/pending-order" },
      { key: "cancel-order", label: "Cancel Order", icon: X, path: "/admin/cancel-order" },
      { key: "disputed-order", label: "Disputed Order", icon: AlertCircle, path: "/admin/disputed-order" },
      { key: "active-order", label: "Active Order", icon: ShoppingBag, path: "/admin/active-order" },
    ],
  },
  {
    key: "custom-order",
    label: "Custom Order",
    icon: Package,
    children: [
      { key: "pending-orders", label: "Pending Orders", icon: Clock, path: "/admin/pending-orders" },
      { key: "accepted-orders", label: "Accepted Orders", icon: FileCheck, path: "/admin/accepted-orders" },
      { key: "rejected-orders", label: "Rejected Orders", icon: X, path: "/admin/rejected-orders" },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSelectSection?: (key: string) => void;
  activeSection?: string;
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
  onSelectSection,
  activeSection = "dashboard",
  onCollapsedChange,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin, hasRouteAccess } = useAdminPermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollPositionRef = useRef<number | null>(null);

  // Detect dark mode and initialize theme for admin pages
  useEffect(() => {
    // Initialize theme to light for admin pages if no saved preference
    try {
      const savedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      const htmlHasDark = document.documentElement.classList.contains("dark");
      
      // For admin pages, default to light theme if no saved preference
      const shouldBeDark = savedTheme === "dark" || (savedTheme === null && htmlHasDark);

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
        // Ensure light theme is set in localStorage for admin pages
        if (!savedTheme) {
          try {
            localStorage.setItem("theme", "light");
          } catch {
            // ignore storage errors
          }
        }
      }
    } catch {
      // Fallback: keep default light mode
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Notify parent when collapsed state changes
  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  // Determine which menu item is active based on current URL
  const getActiveMenuInfo = useMemo(() => {
    const currentPath = location.pathname;
    
    // Check if current path matches any child path
    for (const menu of menuItems) {
      for (const child of menu.children) {
        if (child.path === currentPath) {
          return {
            activeMenuKey: menu.key,
            activeChildKey: child.key,
          };
        }
      }
      // Check if current path matches main menu path (for items without children)
      if (menu.path === currentPath) {
        return {
          activeMenuKey: menu.key,
          activeChildKey: null,
        };
      }
    }
    
    // Default to dashboard
    return {
      activeMenuKey: "dashboard",
      activeChildKey: null,
    };
  }, [location.pathname]);

  const { activeMenuKey, activeChildKey } = getActiveMenuInfo;

  // Auto-expand parent menu if a child is active
  useEffect(() => {
    if (activeMenuKey && activeMenuKey !== "dashboard") {
      setExpandedMenus((prev) => new Set([...prev, activeMenuKey]));
    }
  }, [activeMenuKey]);

  const palette = useMemo(
    () => ({
      background: "var(--sidebar)",
      foreground: "var(--sidebar-foreground)",
      border: "var(--sidebar-border)",
      accent: "var(--sidebar-accent)",
      primary: "var(--primary)",
      secondary: "var(--secondary)",
    }),
    [],
  );

  const desktopWidth = isCollapsed ? 96 : 320;

  // Toggle menu expansion - preserve scroll position
  const toggleMenu = (menuKey: string) => {
    // Save current scroll position before state update
    if (scrollContainerRef.current) {
      savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
    
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuKey)) {
        newSet.delete(menuKey);
      } else {
        newSet.add(menuKey);
      }
      return newSet;
    });
  };

  // Restore scroll position after menu expansion state changes
  useEffect(() => {
    if (savedScrollPositionRef.current !== null && scrollContainerRef.current) {
      // Use multiple requestAnimationFrame calls and setTimeout to ensure DOM is fully updated
      // This handles the case where the DOM height changes due to menu expansion/collapse
      const restoreScroll = () => {
        if (scrollContainerRef.current && savedScrollPositionRef.current !== null) {
          scrollContainerRef.current.scrollTop = savedScrollPositionRef.current;
          savedScrollPositionRef.current = null;
        }
      };
      
      // Use multiple animation frames to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Add a small timeout to ensure all DOM updates are complete
          setTimeout(() => {
            restoreScroll();
          }, 0);
        });
      });
    }
  }, [expandedMenus]);

  // Extract section from path (e.g., "/admin/clients" -> "clients")
  const getSectionFromPath = (path: string): string => {
    const match = path.match(/\/admin\/(.+)$/);
    return match ? match[1] : "dashboard";
  };

  // Handle main menu item click
  const handleMainMenuClick = (menu: MenuItem, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      // Prevent any default anchor behavior
      if (event.currentTarget instanceof HTMLAnchorElement) {
        event.currentTarget.href = 'javascript:void(0);';
      }
    }
    
    // If menu has no children, navigate directly
    if (menu.children.length === 0 && menu.path) {
      const section = getSectionFromPath(menu.path);
      navigate(menu.path, { replace: false });
      onSelectSection?.(section);
      onMobileClose?.();
      return;
    }
    
    // If menu has children, toggle expansion (preserve scroll)
    if (menu.children.length > 0) {
      // Save scroll position before toggling
      if (scrollContainerRef.current) {
        savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
      }
      toggleMenu(menu.key);
    }
  };

  // Handle child menu item click
  const handleChildClick = (child: MenuChild, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      // Prevent any default anchor behavior
      if (event.currentTarget instanceof HTMLAnchorElement) {
        event.currentTarget.href = 'javascript:void(0);';
      }
    }
    
    const section = getSectionFromPath(child.path);
    navigate(child.path, { replace: false });
    onSelectSection?.(section);
    onMobileClose?.();
  };

  // Theme toggle function
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;

      if (next) {
        document.documentElement.classList.add("dark");
        try {
          localStorage.setItem("theme", "dark");
        } catch {
          // ignore storage errors
        }
      } else {
        document.documentElement.classList.remove("dark");
        try {
          localStorage.setItem("theme", "light");
        } catch {
          // ignore storage errors
        }
      }

      return next;
    });
  };

  // Message and notification counts (example values)
  const messageCount = 3;
  const notificationCount = 5;

  // Logout function
  const handleLogout = async () => {
    try {

      await fetch(`${API_BASE_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/admin-login");
    } catch (error) {
      navigate("/admin-login");
    }
  };

  // Scrollbar styles based on theme
  const scrollbarStyles = useMemo(() => {
    if (isDarkMode) {
      return {
        scrollbarTrack: "#1e293b", // slate-800
        scrollbarThumb: "#475569", // slate-600
        scrollbarThumbHover: "#64748b", // slate-500
      };
    } else {
      return {
        scrollbarTrack: "#f1f5f9", // slate-100
        scrollbarThumb: "#cbd5e1", // slate-300
        scrollbarThumbHover: "#94a3b8", // slate-400
      };
    }
  }, [isDarkMode]);

  return (
    <>
      {/* Scrollbar Styles */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: ${scrollbarStyles.scrollbarTrack};
          border-radius: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: ${scrollbarStyles.scrollbarThumb};
          border-radius: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: ${scrollbarStyles.scrollbarThumbHover};
        }
        /* Firefox */
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${scrollbarStyles.scrollbarThumb} ${scrollbarStyles.scrollbarTrack};
        }
      `}</style>

      {/* Desktop Sidebar - Fixed position */}
      <div
        className="hidden lg:flex fixed left-0 z-40"
        style={{
          top: "80px", // Header height
          height: "calc(100vh - 80px)",
          width: desktopWidth,
          transition: "width 0.3s ease",
        }}
      >
        <div
          className="flex h-full flex-col"
          style={{
            backgroundColor: palette.background,
            color: palette.foreground,
            borderRight: `1px solid ${palette.border}`,
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-4 shrink-0"
            style={{ borderBottom: `1px solid ${palette.border}` }}
          >
            {/* Desktop: Show collapse button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 lg:flex"
                onClick={() => setIsCollapsed((prev) => !prev)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sidebar-scroll" 
            style={{ 
              minHeight: 0,
              // Prevent scroll chaining to parent
              overscrollBehavior: 'contain'
            }}
            onScroll={(e) => {
              // Prevent scroll event from bubbling up
              e.stopPropagation();
            }}
          >
            {menuItems
              .filter((menu) => {
                // Dashboard is always accessible
                if (menu.key === "dashboard") return true;
                
                // Sub Admin menu is only for super admin or admin with admin-management permission
                if (menu.key === "user-manage") {
                  // Filter children - sub-admin is only for super admin or admin with admin-management permission
                  const filteredChildren = menu.children.filter((child) => {
                    if (child.key === "sub-admin") {
                      return isSuperAdmin || hasRouteAccess(child.path);
                    }
                    // Check route access for other children
                    return hasRouteAccess(child.path);
                  });
                  
                  // Only show menu if it has accessible children
                  return filteredChildren.length > 0;
                }
                
                // Check if main menu path is accessible
                if (menu.path && !hasRouteAccess(menu.path)) {
                  return false;
                }
                
                // For menus with children, check if any child is accessible
                if (menu.children.length > 0) {
                  return menu.children.some((child) => hasRouteAccess(child.path));
                }
                
                return true;
              })
              .map((menu) => {
                // Filter children based on permissions
                const accessibleChildren = menu.children.filter((child) => {
                  if (child.key === "sub-admin") {
                    return isSuperAdmin;
                  }
                  return hasRouteAccess(child.path);
                });
                
                // Use filtered children for rendering
                const menuToRender = {
                  ...menu,
                  children: accessibleChildren,
                };
                
                const Icon = menuToRender.icon;
                const isExpanded = expandedMenus.has(menuToRender.key);
                const isMainActive = activeMenuKey === menuToRender.key && activeChildKey === null;
                const hasActiveChild = activeMenuKey === menuToRender.key && activeChildKey !== null;

              return (
                <div key={menuToRender.key} className="mb-4">
                  {/* Main Menu Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMainMenuClick(menuToRender, e);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleMainMenuClick(menuToRender);
                      }
                    }}
                    className={`group relative flex w-full cursor-pointer items-center rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                      isMainActive
                        ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30"
                        : hasActiveChild
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "justify-start w-full"}`}
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors duration-200 ${
                          isMainActive ? "text-white" : "group-hover:text-[#3B82F6]"
                        }`}
                      />
                      {!isCollapsed && (
                        <span
                          className={`text-sm font-semibold tracking-wide transition-colors duration-200 ${
                            isMainActive ? "text-white" : "group-hover:text-[#3B82F6]"
                          }`}
                        >
                          {menuToRender.label}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && menuToRender.children.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Save scroll position before toggling
                          if (scrollContainerRef.current) {
                            savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
                          }
                          toggleMenu(menuToRender.key);
                        }}
                        className="ml-auto flex items-center rounded-xl p-1.5 text-slate-900 transition-colors duration-200 hover:bg-white/10 dark:text-white"
                        title={isExpanded ? "Collapse submenu" : "Expand submenu"}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Submenu Items */}
                  {isExpanded && menuToRender.children.length > 0 && (
                    <div
                      className={`${
                        isCollapsed
                          ? "flex flex-col items-center gap-2 py-3"
                          : "mt-2 space-y-2 pl-4"
                      }`}
                    >
                      {menuToRender.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeChildKey === child.key;

                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChildClick(child, e);
                            }}
                            title={isCollapsed ? child.label : undefined}
                            className={`group relative flex w-full cursor-pointer items-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              isChildActive
                                ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 font-semibold"
                                : "text-current hover:bg-white/5 hover:text-[#3B82F6]"
                            } ${isCollapsed ? "justify-center" : "justify-start gap-3 w-full"}`}
                          >
                            <ChildIcon
                              className={`h-4 w-4 transition-colors duration-200 ${
                                isChildActive ? "text-white" : "group-hover:text-[#3B82F6]"
                              }`}
                            />
                            {!isCollapsed && (
                              <span
                                className={`transition-colors duration-200 ${
                                  isChildActive ? "text-white" : "group-hover:text-[#3B82F6]"
                                }`}
                              >
                                {child.label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-auto px-3 py-4 shrink-0" style={{ borderTop: `1px solid ${palette.border}` }} />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed left-0 z-50 w-[80vw] transform shadow-2xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          top: "80px", // Header height
          height: "calc(100vh - 80px)",
          backgroundColor: palette.background,
          color: palette.foreground,
          visibility: mobileOpen ? "visible" : "hidden",
        }}
      >
        <div
          className="flex h-full flex-col"
          style={{
            backgroundColor: palette.background,
            color: palette.foreground,
            borderRight: `1px solid ${palette.border}`,
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-4 shrink-0"
            style={{ borderBottom: `1px solid ${palette.border}` }}
          >
            {/* Mobile: Show message, notification, and theme icons */}
            <div className="flex items-center gap-3 w-full">
              {/* Message Icon with Badge */}
              <Button
                variant="ghost"
                size="icon"
                className={`relative hover:bg-white/10 dark:hover:bg-white/20 transition-colors ${
                  isDarkMode ? "text-white hover:text-[#60A5FA]" : "text-slate-700 hover:text-[#3B82F6]"
                }`}
                title="Messages"
              >
                <MessageCircle className="w-5 h-5" />
                {messageCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 dark:bg-red-600 text-white text-[10px] font-semibold border-0">
                    {messageCount > 9 ? "9+" : messageCount}
                  </Badge>
                )}
              </Button>

              {/* Notification Icon with Badge */}
              <Button
                variant="ghost"
                size="icon"
                className={`relative hover:bg-white/10 dark:hover:bg-white/20 transition-colors ${
                  isDarkMode ? "text-white hover:text-[#60A5FA]" : "text-slate-700 hover:text-[#3B82F6]"
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 dark:bg-red-600 text-white text-[10px] font-semibold border-0">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
              </Button>

              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`hover:bg-white/10 dark:hover:bg-white/20 transition-colors ${
                  isDarkMode ? "text-white hover:text-[#FFB347]" : "text-slate-700 hover:text-[#FE8A0F]"
                }`}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className={`hover:bg-white/10 dark:hover:bg-white/20 transition-colors ${
                  isDarkMode ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"
                }`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sidebar-scroll" 
            style={{ 
              minHeight: 0,
              // Prevent scroll chaining to parent
              overscrollBehavior: 'contain'
            }}
            onScroll={(e) => {
              // Prevent scroll event from bubbling up
              e.stopPropagation();
            }}
          >
            {menuItems
              .filter((menu) => {
                // Dashboard is always accessible
                if (menu.key === "dashboard") return true;
                
                // Sub Admin menu is only for super admin or admin with admin-management permission
                if (menu.key === "user-manage") {
                  // Filter children - sub-admin is only for super admin or admin with admin-management permission
                  const filteredChildren = menu.children.filter((child) => {
                    if (child.key === "sub-admin") {
                      return isSuperAdmin || hasRouteAccess(child.path);
                    }
                    // Check route access for other children
                    return hasRouteAccess(child.path);
                  });
                  
                  // Only show menu if it has accessible children
                  return filteredChildren.length > 0;
                }
                
                // Check if main menu path is accessible
                if (menu.path && !hasRouteAccess(menu.path)) {
                  return false;
                }
                
                // For menus with children, check if any child is accessible
                if (menu.children.length > 0) {
                  return menu.children.some((child) => hasRouteAccess(child.path));
                }
                
                return true;
              })
              .map((menu) => {
                // Filter children based on permissions
                const accessibleChildren = menu.children.filter((child) => {
                  if (child.key === "sub-admin") {
                    return isSuperAdmin;
                  }
                  return hasRouteAccess(child.path);
                });
                
                // Use filtered children for rendering
                const menuToRender = {
                  ...menu,
                  children: accessibleChildren,
                };
                
                const Icon = menuToRender.icon;
                const isExpanded = expandedMenus.has(menuToRender.key);
                const isMainActive = activeMenuKey === menuToRender.key && activeChildKey === null;
                const hasActiveChild = activeMenuKey === menuToRender.key && activeChildKey !== null;

              return (
                <div key={menuToRender.key} className="mb-4">
                  {/* Main Menu Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMainMenuClick(menuToRender, e);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleMainMenuClick(menuToRender);
                      }
                    }}
                    className={`group relative flex w-full cursor-pointer items-center rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                      isMainActive
                        ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30"
                        : hasActiveChild
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 justify-start w-full"
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors duration-200 ${
                          isMainActive ? "text-white" : "group-hover:text-[#3B82F6]"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold tracking-wide transition-colors duration-200 ${
                          isMainActive ? "text-white" : "group-hover:text-[#3B82F6]"
                        }`}
                      >
                        {menuToRender.label}
                      </span>
                    </div>
                    {menuToRender.children.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Save scroll position before toggling
                          if (scrollContainerRef.current) {
                            savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
                          }
                          toggleMenu(menuToRender.key);
                        }}
                        className="ml-auto flex items-center rounded-xl p-1.5 text-slate-900 transition-colors duration-200 hover:bg-white/10 dark:text-white"
                        title={isExpanded ? "Collapse submenu" : "Expand submenu"}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Submenu Items */}
                  {isExpanded && menuToRender.children.length > 0 && (
                    <div
                      className="mt-2 space-y-2 pl-4"
                    >
                      {menuToRender.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeChildKey === child.key;

                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChildClick(child, e);
                            }}
                            title={child.label}
                            className={`group relative flex w-full cursor-pointer items-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              isChildActive
                                ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 font-semibold"
                                : "text-current hover:bg-white/5 hover:text-[#3B82F6]"
                            } justify-start gap-3 w-full`}
                          >
                            <ChildIcon
                              className={`h-4 w-4 transition-colors duration-200 ${
                                isChildActive ? "text-white" : "group-hover:text-[#3B82F6]"
                              }`}
                            />
                            <span
                              className={`transition-colors duration-200 ${
                                isChildActive ? "text-white" : "group-hover:text-[#3B82F6]"
                              }`}
                            >
                              {child.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-auto px-3 py-4 shrink-0" style={{ borderTop: `1px solid ${palette.border}` }} />
        </div>
      </div>
    </>
  );
}
