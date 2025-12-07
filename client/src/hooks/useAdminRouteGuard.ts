import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminPermissions } from "./useAdminPermissions";

/**
 * Hook to guard admin routes and redirect to dashboard if user lacks permission
 * Use this hook in all admin page components
 */
export function useAdminRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRouteAccess, loading } = useAdminPermissions();

  useEffect(() => {
    if (!loading) {
      const currentPath = location.pathname;
      // Dashboard is always accessible
      if (currentPath !== "/admin/dashboard" && !hasRouteAccess(currentPath)) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [location.pathname, hasRouteAccess, loading, navigate]);
}



