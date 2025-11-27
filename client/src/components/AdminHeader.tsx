import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, MessageCircle, Bell, Sun, Moon } from "lucide-react";
import logoImage from "figma:asset/71632be70905a17fd389a8d053249645c4e8a4df.png";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// const API_BASE_URL = "http://localhost:5000";
const API_BASE_URL = "https://tradespeoplehub.vercel.app";

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  createdAt: string;
  [key: string]: any;
}

interface AdminHeaderProps {
  onMenuToggle?: (isOpen: boolean) => void;
  sidebarOpen?: boolean;
}

export default function AdminHeader({ onMenuToggle, sidebarOpen = false }: AdminHeaderProps) {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messageCount] = useState(3); // Example: message count
  const [notificationCount] = useState(5); // Example: notification count

  // Sync with sidebarOpen prop
  useEffect(() => {
    // This is handled by parent component, we just need to reflect the state
  }, [sidebarOpen]);

  // Check admin authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          credentials: "include",
        });
        if (!response.ok) {
          navigate("/admin-login");
          return;
        }
        const data = await response.json();
        setCurrentAdmin(data.user);
      } catch (error) {
        navigate("/admin-login");
      }
    };
    checkAuth();
  }, [navigate]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const savedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const htmlHasDark = document.documentElement.classList.contains("dark");
      const shouldBeDark =
        savedTheme === "dark" || (!savedTheme && prefersDark) || htmlHasDark;

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      }
    } catch {
      // Fallback: keep default light mode
    }
  }, []);

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

  const headerThemeStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? "var(--sidebar)" : "#ffffff",
      color: isDarkMode ? "var(--sidebar-foreground)" : "#2c353f",
    }),
    [isDarkMode],
  );

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

  const handleMenuToggle = () => {
    const newState = !sidebarOpen;
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 shadow-lg transition-colors border-b border-transparent"
      style={headerThemeStyles}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenuToggle}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <img 
            src={logoImage} 
            alt="Professional Services Platform" 
            className="h-[40px] lg:h-[48px] w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Message Icon with Badge - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isDarkMode ? "text-white hover:text-[#60A5FA]" : "text-gray-600 hover:text-[#3B82F6]"
            }`}
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
            {messageCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 dark:bg-red-600 text-white text-[10px] font-semibold">
                {messageCount > 9 ? "9+" : messageCount}
              </Badge>
            )}
          </Button>

          {/* Notification Icon with Badge - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isDarkMode ? "text-white hover:text-[#60A5FA]" : "text-gray-600 hover:text-[#3B82F6]"
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 dark:bg-red-600 text-white text-[10px] font-semibold">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Theme Toggle Button - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isDarkMode ? "text-white hover:text-[#FFB347]" : "text-gray-600 hover:text-[#FE8A0F]"
            }`}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Admin Name */}
          <span
            className={`font-['Poppins',sans-serif] text-[14px] px-2 transition-colors ${
              isDarkMode ? "text-white" : "text-gray-600"
            }`}
          >
            {currentAdmin?.name || "Admin"}
          </span>

          {/* Logout Button - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={`hidden lg:flex hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
              isDarkMode ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"
            }`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

