import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Extract section from path (e.g., "/admin/clients" -> "clients")
  const getSectionFromPath = (path: string): string => {
    const match = path.match(/\/admin\/(.+)$/);
    return match ? match[1] : "dashboard";
  };

  const activeSection = getSectionFromPath(location.pathname);

  // Check if desktop view
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 96 : 320;

  // Redirect /admin to /admin/dashboard
  useEffect(() => {
    if (location.pathname === "/admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleSectionChange = (section: string) => {
    if (section === "dashboard") {
      navigate("/admin/dashboard");
    } else {
      navigate(`/admin/${section}`);
    }
  };

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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

