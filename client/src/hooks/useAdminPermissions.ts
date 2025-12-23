import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  permissions?: string[];
  [key: string]: any;
}

export function useAdminPermissions() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          setAdminUser(user);
          
          // If user has no permissions array or it's empty, they are super admin
          if (!user.permissions || user.permissions.length === 0) {
            setIsSuperAdmin(true);
            setPermissions([]); // Super admin has access to everything
          } else {
            setIsSuperAdmin(false);
            setPermissions(user.permissions || []);
          }
        } else {
          setAdminUser(null);
          setPermissions([]);
          setIsSuperAdmin(false);
        }
      } catch (error) {
        // console.error("Error fetching admin user:", error);
        setAdminUser(null);
        setPermissions([]);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminUser();
  }, []);

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  // Check if user has access to a route
  const hasRouteAccess = (route: string): boolean => {
    if (isSuperAdmin) return true;
    
    // Sub-admins cannot access sub-admin management (only super admin)
    if (route === "/admin/sub-admins") {
      return false;
    }
    
    // Map routes to permissions
    const routePermissionMap: Record<string, string> = {
      "/admin/dashboard": "dashboard", // Dashboard is always accessible (but tabs are super admin only)
      "/admin/email-campaign": "email-campaign", // Requires email-campaign permission
      "/admin/clients": "clients-management",
      "/admin/professionals": "professionals-management",
      // "/admin/sub-admins" is handled above - only super admin can access (admin-management permission removed from sub-admins)
      "/admin/delete-account": "user-management",
      "/admin/sectors": "category-management",
      "/admin/categories": "category-management",
      "/admin/service-category": "category-management",
      "/admin/service-titles": "category-management",
      "/admin/default-content": "category-management",
      "/admin/favourite-categories": "category-management",
      "/admin/packages": "package-management",
      "/admin/package-addons": "package-management",
      "/admin/coupon-manage": "coupon-manage",
      "/admin/client-requests": "clients-management", // Client requests require clients-management
      "/admin/professional-requests": "professionals-management", // Professional requests require professionals-management
      "/admin/contact-requests": "contact-management", // General contact requests require contact-management
      "/admin/countries": "region-management",
      "/admin/cities": "region-management",
      "/admin/homepage-content": "content-management",
      "/admin/blog-content": "content-management",
      "/admin/banner-content": "content-management",
      "/admin/cost-guide": "content-management",
      "/admin/transaction-history": "transaction-history",
      "/admin/user-plans": "user-plans-management",
      "/admin/post-a-job": "job-management",
      "/admin/job-posts": "job-management",
      "/admin/bids-on-posts": "job-management",
      "/admin/send-emails": "job-management",
      "/admin/generate-html": "job-management",
      "/admin/job-amount": "job-management",
      "/admin/ratings-manage": "ratings-management",
      "/admin/payment-settings": "payment-settings",
      "/admin/bank-transfer-request": "payment-settings",
      "/admin/withdrawal-request": "withdrawal-request",
      "/admin/refunds": "refunds",
      "/admin/dispute-list": "dispute-management",
      "/admin/ask-step-in": "dispute-management",
      "/admin/rewards": "rewards",
      "/admin/message-center": "message-center", // Also accessible with professionals-management permission
      "/admin/affiliates": "affiliate",
      "/admin/sharable-links": "affiliate",
      "/admin/pay-outs": "affiliate",
      "/admin/affiliate-setting": "affiliate",
      "/admin/affiliate-metadata": "affiliate",
      "/admin/affiliate-support": "affiliate",
      "/admin/referrals-client": "referrals",
      "/admin/referrals-professional": "referrals",
      "/admin/flagged": "flagged",
      "/admin/service-category": "service",
      "/admin/approval-pending-service": "service",
      "/admin/required-modification-service": "service",
      "/admin/approved-service": "service",
      "/admin/all-service": "service",
      "/admin/locations": "service",
      "/admin/completed-order": "service-order",
      "/admin/pending-order": "service-order",
      "/admin/cancel-order": "service-order",
      "/admin/disputed-order": "service-order",
      "/admin/active-order": "service-order",
      "/admin/pending-orders": "custom-order",
      "/admin/accepted-orders": "custom-order",
      "/admin/rejected-orders": "custom-order",
    };

    const requiredPermission = routePermissionMap[route];
    if (!requiredPermission) return true; // Unknown routes are accessible
    
    // Special handling for message-center - accessible with message-center or professionals-management permission
    if (route === "/admin/message-center") {
      return hasPermission("message-center") || hasPermission("professionals-management");
    }
    
    return hasPermission(requiredPermission);
  };

  return {
    adminUser,
    permissions,
    isSuperAdmin,
    hasPermission,
    hasRouteAccess,
    loading,
  };
}




