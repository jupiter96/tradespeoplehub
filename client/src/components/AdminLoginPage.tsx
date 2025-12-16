import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import API_BASE_URL from "../config/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const parseJsonSafely = async (response: Response) => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Unexpected response from server. Please try again later.");
    }
  };

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await parseJsonSafely(response);
          if (data?.user) {
            navigate("/admin/dashboard");
            return;
          }
        }
      } catch {
        // ignore errors; stay on login page
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkAdminSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success("Login successful");
      navigate("/admin/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
          Checking admin session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6] rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-['Roboto',sans-serif] text-[28px] font-semibold text-[#2c353f] mb-2">
              Admin Login
            </h1>
            <p className="font-['Roboto',sans-serif] text-[14px] text-[#6b6b6b]">
              Sign in to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="admin-email" className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-2 border-gray-200 focus:border-[#3B82F6] rounded-xl font-['Roboto',sans-serif] text-[14px]"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-password" className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f] mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-2 border-gray-200 focus:border-[#3B82F6] rounded-xl font-['Roboto',sans-serif] text-[14px]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-['Roboto',sans-serif] text-[13px] text-red-600 text-center">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-11 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all duration-300 font-['Roboto',sans-serif] text-[14px] disabled:opacity-70"
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

