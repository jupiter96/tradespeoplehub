import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, MessageCircle, Bell, Sun, Moon, Key, ChevronDown, User } from "lucide-react";
import logoImage from "figma:asset/71632be70905a17fd389a8d053249645c4e8a4df.png";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import API_BASE_URL from "../config/api";
import { validatePassword, getPasswordHint } from "../utils/passwordValidation";

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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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
  // For admin pages, default to light theme if no saved preference
  useEffect(() => {
    try {
      const savedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const htmlHasDark = document.documentElement.classList.contains("dark");
      
      // For admin pages, default to light theme if no saved preference
      // Only use dark theme if explicitly saved as "dark"
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

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword || !passwordData.currentPassword) {
      toast.error("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || "Password does not meet requirements");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleMenuToggle = () => {
    const newState = !sidebarOpen;
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name || !profileData.email) {
      toast.error("Name and email are required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: profileData.name.trim(),
          email: profileData.email.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
        return;
      }

      const data = await response.json();
      setCurrentAdmin(data.user);
      toast.success("Profile updated successfully");
      setShowEditProfile(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
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

          {/* Theme Toggle Button - Hidden for now, will be used later */}
          {/* <Button
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
          </Button> */}

          {/* Admin Name Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`font-['Poppins',sans-serif] text-[14px] px-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? "text-white" : "text-gray-600"
                }`}
              >
                {currentAdmin?.name || "Admin"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-black border-0 shadow-xl shadow-gray-300 dark:shadow-gray-900">
              <DropdownMenuItem
                onClick={() => {
                  setShowEditProfile(true);
                  if (currentAdmin) {
                    setProfileData({
                      name: currentAdmin.name || "",
                      email: currentAdmin.email || "",
                    });
                  }
                }}
                className="cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowChangePassword(true)}
                className="cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Change Password Dialog */}
          <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
            <DialogContent className="w-[70vw] bg-white dark:bg-black border-0 shadow-2xl shadow-gray-400 dark:shadow-gray-950">
              <DialogHeader>
                <DialogTitle className="text-black dark:text-white">Change Password</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Enter your current password and choose a new password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-black dark:text-white">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-black dark:text-white">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                    placeholder="Must include uppercase, lowercase, and numbers"
                  />
                  {passwordData.newPassword && (
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {getPasswordHint(passwordData.newPassword)}
                    </p>
                  )}
                  {!passwordData.newPassword && (
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Password must include uppercase, lowercase, and numbers
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-black dark:text-white">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/90 text-white"
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Profile Dialog */}
          <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
            <DialogContent className="w-[70vw] bg-white dark:bg-black border-0 shadow-2xl shadow-gray-400 dark:shadow-gray-950">
              <DialogHeader>
                <DialogTitle className="text-black dark:text-white">Edit Profile</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Update your name and email address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="profileName" className="text-black dark:text-white">
                    Name *
                  </Label>
                  <Input
                    id="profileName"
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="profileEmail" className="text-black dark:text-white">
                    Email *
                  </Label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-black border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditProfile(false);
                      if (currentAdmin) {
                        setProfileData({
                          name: currentAdmin.name || "",
                          email: currentAdmin.email || "",
                        });
                      }
                    }}
                    className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-black dark:text-white focus:shadow-lg focus:shadow-[#FE8A0F]/30 transition-shadow"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                    className="bg-[#FE8A0F] hover:bg-[#FE8A0F]/90 text-white border-0 shadow-lg shadow-[#FE8A0F]/40 hover:shadow-xl hover:shadow-[#FE8A0F]/50 transition-all"
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

