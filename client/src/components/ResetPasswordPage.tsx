import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from "./AccountContext";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { validatePassword, getPasswordHint } from "../utils/passwordValidation";
import SEOHead from "./SEOHead";

export default function ResetPasswordPage() {
  const { resetPassword } = useAccount();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset link is invalid or missing.");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0] || "Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <>
      <SEOHead
        title="Reset Password"
        description="Reset password page"
        robots="noindex,nofollow"
      />
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] via-white to-[#FFF5EB] flex flex-col">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white shadow-sm">
        <Nav />
      </header>

      <main className="flex-1 w-full px-4 py-10">
        <div className="max-w-[480px] mx-auto">
          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 md:p-8">
            {!isComplete ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center">
                  <h1 className="font-['Poppins',sans-serif] text-[26px] text-[#2c353f] mb-2">
                    Reset Password
                  </h1>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Choose a new password for your account.
                </p>
                </div>

                {!token && (
                  <p className="text-center text-[13px] text-red-600 font-['Poppins',sans-serif]">
                    This reset link is invalid or has expired. Please request a new one.
                  </p>
                )}

                <div>
                  <Label htmlFor="new-password" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Must include uppercase, lowercase, and numbers"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                    disabled={!token || isSubmitting}
                    required
                  />
                  {password && !error && (
                    <p className="mt-1 text-[11px] text-gray-500 font-['Poppins',sans-serif]">
                      {getPasswordHint(password)}
                    </p>
                  )}
                  {!password && (
                    <p className="mt-1 text-[11px] text-gray-500 font-['Poppins',sans-serif]">
                      Password must include uppercase, lowercase, and numbers
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="confirm-password"
                    className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5"
                  >
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                    disabled={!token || isSubmitting}
                    required
                  />
                </div>

                {error && (
                  <p className="text-[13px] text-red-600 text-center font-['Poppins',sans-serif]">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!token || isSubmitting}
                  className="w-full h-11 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px] disabled:opacity-60"
                >
                  {isSubmitting ? "Updating password..." : "Update Password"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f]">
                  Password updated!
                </h2>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  You can now sign in with your new password.
                </p>
                <Button
                  onClick={handleBackToLogin}
                  className="w-full h-11 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px]"
                >
                  Back to login
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
}


