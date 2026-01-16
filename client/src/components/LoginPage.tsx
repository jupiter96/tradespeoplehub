import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Check,
  MapPin,
  Building2,
  Home,
  Briefcase,
  FolderTree,
  Shield,
  FileText,
  ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import PhoneInput from "./PhoneInput";
import { Checkbox } from "./ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import Nav from "../imports/Nav";
import SEOHead from "./SEOHead";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import AddressAutocomplete from "./AddressAutocomplete";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

import API_BASE_URL from "../config/api";
import { validatePassword } from "../utils/passwordValidation";
import { validatePhoneNumber, normalizePhoneForBackend } from "../utils/phoneValidation";
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    register: initiateRegistration,
    verifyRegistrationEmail,
    completeRegistration,
    requestPasswordReset,
    isLoggedIn,
    updateProfile,
    userInfo,
  } = useAccount();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"client" | "professional">("client");
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);
  
  // Email & Phone Verification states (after registration)
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1); // 1: email, 2: phone
  
  // Timer states for resend functionality (2 minutes = 120 seconds)
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  
  // Helper function to format timer as MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Redirect to account page if already logged in (but not during registration)
  useEffect(() => {
    // Don't redirect if user is in the middle of registration process
    if (isLoggedIn && !showEmailVerification && !isCompletingRegistration) {
      // Professionals should land on Account after login (even if profile setup is incomplete).
      navigate("/account", { replace: true });
    }
  }, [isLoggedIn, navigate, showEmailVerification, userInfo, isCompletingRegistration]);

  // Start email resend timer when email verification modal opens
  useEffect(() => {
    if (showEmailVerification && verificationStep === 1 && emailResendTimer === 0) {
      setEmailResendTimer(120); // Start with 2 minutes
    }
  }, [showEmailVerification, verificationStep, emailResendTimer]);

  // Countdown email resend timer
  useEffect(() => {
    if (emailResendTimer > 0) {
      const interval = setInterval(() => {
        setEmailResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [emailResendTimer]);

  // Start phone resend timer when phone verification step is shown
  useEffect(() => {
    if (showEmailVerification && verificationStep === 2 && phoneResendTimer === 0) {
      setPhoneResendTimer(120); // Start with 2 minutes
    }
  }, [showEmailVerification, verificationStep, phoneResendTimer]);

  // Countdown phone resend timer
  useEffect(() => {
    if (phoneResendTimer > 0) {
      const interval = setInterval(() => {
        setPhoneResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phoneResendTimer]);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationPhone, setVerificationPhone] = useState("");
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    postcode?: string;
    address?: string;
    townCity?: string;
    county?: string;
    tradingName?: string;
  } | null>(null);

  // (duplicate redirect effect removed - handled above)
  
  
  // Forgot Password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetRequestSent, setResetRequestSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load rememberMe state and email from localStorage on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('savedEmail');
    
    if (savedRememberMe && savedEmail) {
      setRememberMe(true);
      setLoginEmail(savedEmail);
    }

    // Check for error messages from URL params
    const errorParam = searchParams.get('error');
    if (errorParam === 'account_deleted') {
      setLoginError('Your account has been suspended. Please contact support@sortars.com');
    } else if (errorParam === 'account_blocked') {
      setLoginError('Your account has been suspended. Please contact support@sortars.com');
    } else if (errorParam === 'admin_not_allowed') {
      setLoginError('Admin users must login through admin panel');
    } else if (searchParams.get('social') === 'failed') {
      setLoginError('Your account has been suspended. Please contact support@sortars.com');
    }
  }, [searchParams]);

  // Register form state - Common fields
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPostcode, setRegisterPostcode] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerReferralCode, setRegisterReferralCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Register form state - Professional only fields
  const [registerTradingName, setRegisterTradingName] = useState("");
  const [registerTownCity, setRegisterTownCity] = useState("");
  const [registerCounty, setRegisterCounty] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [registerTravelDistance, setRegisterTravelDistance] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingRegistration, setIsSendingRegistration] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isResendingPhone, setIsResendingPhone] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const user = await login({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });

      // Save rememberMe state and email to localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', loginEmail);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
      }

      // If PRO has any verification step not yet passed, always land on Account -> Verification
      if (user.role === "professional") {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/verification`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            const v = data?.verification || {};
            const requiredTypes = ["address", "idCard", "paymentMethod", "publicLiabilityInsurance"] as const;
            const isPassed = (s: string) => s === "verified" || s === "completed";
            const hasUnpassed = requiredTypes.some((t) => !isPassed(String(v?.[t]?.status || "not-started")));
            if (hasUnpassed) {
              // Show modal on AccountPage after redirect
              try {
                sessionStorage.setItem("showVerificationModalAfterLogin", "1");
              } catch {
                // ignore
              }
              // Land on Account overview (default), while showing modal.
              navigate("/account");
              return;
            }
          }
        } catch {
          // ignore and fall back to default navigation
        }

        // Professional users should always land on Account after login.
        navigate("/account", { replace: true });
        return;
      }

      navigate("/account");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setFieldErrors({});

    // Validate all required fields
    const errors: Record<string, string> = {};

    if (!registerFirstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!registerLastName.trim()) {
      errors.lastName = "Last name is required";
    }
    // Address is required for both client and professional
    if (!registerAddress.trim()) {
      errors.address = "Address is required";
    }
    if (!registerTownCity.trim()) {
      errors.townCity = "Town/City is required";
    }
    if (!registerPostcode.trim()) {
      errors.postcode = "Postcode is required";
    }
    // Professional-specific required fields
    if (userType === "professional") {
      if (!registerTradingName.trim()) {
        errors.tradingName = "Trading name is required";
      }
      if (!registerTravelDistance) {
        errors.travelDistance = "Travel distance is required";
      }
    }
    // Parse phone value: format is "{countryCode}|{phoneNumber}"
    const phoneParts = registerPhone.includes('|') ? registerPhone.split('|') : ['+44', registerPhone.replace(/\D/g, '')];
    const countryCode = phoneParts[0] || '+44';
    const phoneNumber = phoneParts[1] || '';
    
    if (!phoneNumber.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error || "Invalid phone number format";
      }
    }
    if (!registerEmail.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      errors.email = "Please enter a valid email address";
    }
    if (!registerPassword) {
      errors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(registerPassword);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0] || "Password does not meet requirements";
      }
    }
    if (!registerConfirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerPassword !== registerConfirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }
    if (!agreeTerms) {
      errors.agreeTerms = "Please accept the terms and conditions";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // phoneParts, countryCode, and phoneNumber are already declared above
    const registerData = {
      firstName: registerFirstName,
      lastName: registerLastName,
      email: registerEmail,
      phone: normalizePhoneForBackend(phoneNumber, countryCode), // Add country code before sending
      postcode: registerPostcode,
      password: registerPassword,
      referralCode: registerReferralCode,
      userType,
      address: registerAddress.trim(), // Address is required for both client and professional
      townCity: registerTownCity.trim(), // Town/City is required for both client and professional
      county: registerCounty.trim(), // County is available for both client and professional
      ...(userType === "professional" && {
        tradingName: registerTradingName.trim(),
        travelDistance: registerTravelDistance,
      })
    };
    setIsSendingRegistration(true);
    setVerificationEmail(registerEmail);
    setVerificationPhone(registerPhone);
    // Store registration data for later use
    setNewlyRegisteredUser({
      firstName: registerFirstName,
      lastName: registerLastName,
      email: registerEmail,
      phone: registerPhone,
      postcode: registerPostcode,
      address: registerAddress.trim(),
      townCity: registerTownCity.trim(),
      county: registerCounty.trim(),
      ...(userType === "professional" && {
        tradingName: registerTradingName.trim(),
      })
    });
    try {
      const response = await initiateRegistration(registerData);
      setVerificationStep(1);
      setEmailVerificationCode("");
      setPhoneVerificationCode("");
      setShowEmailVerification(true);
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Unable to start registration");
    } finally {
      setIsSendingRegistration(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailVerificationCode.length !== 4) {
      alert("Please enter a 4-digit code");
      return;
    }
    setRegisterError(null);
    setIsVerifyingEmail(true);
    try {
      await verifyRegistrationEmail(emailVerificationCode, registerEmail);
      setVerificationStep(2);
      setEmailVerificationCode("");
    } catch (error: any) {
      setRegisterError("Email verification failed");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneVerificationCode.length !== 4) {
      alert("Please enter a 4-digit code");
      return;
    }
    setRegisterError(null);
    setIsRegistering(true);
    setIsCompletingRegistration(true);
    try {
      const user = await completeRegistration(phoneVerificationCode, registerEmail);

      // Close verification modal first
      setShowEmailVerification(false);
      setVerificationStep(1);
      setEmailVerificationCode("");
      setPhoneVerificationCode("");

      // Navigate immediately based on user role
      if (user.role === "professional") {
        navigate("/professional-registration-steps", { replace: true });
      } else {
        navigate("/account", { replace: true });
      }
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Registration failed");
      setIsCompletingRegistration(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBackFromVerification = () => {
    if (verificationStep > 1) {
      // Go back to previous step
      setVerificationStep(verificationStep - 1);
    } else {
      // Close verification modal
      setShowEmailVerification(false);
      setVerificationStep(1);
      setEmailVerificationCode("");
      setPhoneVerificationCode("");
      setRegisterError(null);
      setIsRegistering(false);
      setNewlyRegisteredUser(null);
      // Reset professional fields
      setProfessionalSector("");
      setProfessionalCategory("");
      setProfessionalSubcategories([]);
      setProfessionalInsurance("no");
      setProfessionalAboutMe("");
    }
  };

  const handleNextStep = async () => {
    if (verificationStep === 7) {
      // Final step: Save all and redirect
      setIsUpdatingProfile(true);
      setRegisterError(null);
      try {
        // Combine category and subcategories for final save
        const allServices = professionalCategory 
          ? [professionalCategory, ...professionalSubcategories]
          : professionalSubcategories;

        await updateProfile({
          firstName: newlyRegisteredUser?.firstName || "",
          lastName: newlyRegisteredUser?.lastName || "",
          email: newlyRegisteredUser?.email || "",
          phone: newlyRegisteredUser?.phone || "",
          postcode: newlyRegisteredUser?.postcode || "",
          address: newlyRegisteredUser?.address || "",
          tradingName: newlyRegisteredUser?.tradingName || "",
          sector: professionalSector,
          services: allServices,
          aboutService: professionalAboutMe,
          hasPublicLiability: professionalInsurance,
        });

        setShowEmailVerification(false);
        setVerificationStep(1);
        // After PRO setup, go straight to account verification section
        navigate("/account?tab=verification");
      } catch (error) {
        setRegisterError(error instanceof Error ? error.message : "Failed to save profile");
      } finally {
        setIsUpdatingProfile(false);
      }
    } else {
      // Move to next step
      setVerificationStep(verificationStep + 1);
    }
  };

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate current step
    let isValid = true;
    
    if (verificationStep === 3 && !professionalSector.trim()) {
      setRegisterError("Please select a sector");
      isValid = false;
    } else if (verificationStep === 4 && !professionalCategory.trim()) {
      setRegisterError("Please select a category");
      isValid = false;
    } else if (verificationStep === 5 && professionalSubcategories.length === 0) {
      setRegisterError("Please select at least one subcategory");
      isValid = false;
    } else if (verificationStep === 6 && !professionalInsurance) {
      setRegisterError("Please select insurance status");
      isValid = false;
    } else if (verificationStep === 7 && !professionalAboutMe.trim()) {
      setRegisterError("Please write about yourself");
      isValid = false;
    }

    if (!isValid) return;

    // Save current step data
    if (verificationStep >= 3 && verificationStep < 7) {
      setIsUpdatingProfile(true);
      setRegisterError(null);
      try {
        const updateData: any = {
          firstName: newlyRegisteredUser?.firstName || "",
          lastName: newlyRegisteredUser?.lastName || "",
          email: newlyRegisteredUser?.email || "",
          phone: newlyRegisteredUser?.phone || "",
          postcode: newlyRegisteredUser?.postcode || "",
          address: newlyRegisteredUser?.address || "",
          townCity: newlyRegisteredUser?.townCity || "",
          county: newlyRegisteredUser?.county || "",
          tradingName: newlyRegisteredUser?.tradingName || "",
        };

        if (verificationStep >= 3) updateData.sector = professionalSector;
        if (verificationStep >= 4) {
          // Save category as first service
          updateData.services = professionalCategory ? [professionalCategory] : [];
        }
        if (verificationStep >= 5) {
          // Combine category and subcategories
          const allServices = professionalCategory 
            ? [professionalCategory, ...professionalSubcategories]
            : professionalSubcategories;
          updateData.services = allServices;
        }
        if (verificationStep >= 6) updateData.hasPublicLiability = professionalInsurance;
        if (verificationStep >= 7) updateData.aboutService = professionalAboutMe;

        await updateProfile(updateData);
        handleNextStep();
      } catch (error) {
        setRegisterError(error instanceof Error ? error.message : "Failed to save");
      } finally {
        setIsUpdatingProfile(false);
      }
    } else {
      handleNextStep();
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    window.location.href = `${API_BASE_URL}/api/auth/${provider}`;
  };

  // Forgot Password handlers
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError("Please enter your email address");
      return;
    }

    setResetError(null);
    setIsRequestingReset(true);
    try {
      const response = await requestPasswordReset(resetEmail);
      const notFound = response?.userNotFound || false;
      setUserNotFound(notFound);
      // Only show modal after we have the response (with or without resetLink)
      setResetRequestSent(true);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Unable to send reset link");
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleCloseResetModal = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetRequestSent(false);
    setResetError(null);
    setIsRequestingReset(false);
  };

  const handleResendEmailCode = async () => {
    if (isResendingEmail || emailResendTimer > 0) return;
    
    setIsResendingEmail(true);
    setRegisterError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: verificationEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }
      
      // Reset timer to 2 minutes (120 seconds) after successful resend
      setEmailResendTimer(120);
      toast.success('Verification code resent to your email');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend code';
      toast.error(errorMessage);
      setRegisterError(errorMessage);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleResendPhoneCode = async () => {
    if (isResendingPhone || phoneResendTimer > 0) return;
    
    setIsResendingPhone(true);
    setRegisterError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/resend-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: verificationEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }
      
      // Reset timer to 2 minutes (120 seconds) after successful resend
      setPhoneResendTimer(120);
      toast.success('Verification code resent to your phone');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend code';
      toast.error(errorMessage);
      setRegisterError(errorMessage);
    } finally {
      setIsResendingPhone(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Login"
        description="Login page"
        robots="noindex,nofollow"
      />
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] via-white to-[#FFF5EB]">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>
      
      <div className="pt-[50px] py-6 md:py-6 px-4 md:px-6">
        <div className="max-w-[500px] mx-auto">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-5 md:p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 bg-[#f5f5f5] p-1 rounded-xl h-10">
                <TabsTrigger 
                  value="login"
                  className="rounded-lg font-['Poppins',sans-serif] text-[14px] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="rounded-lg font-['Poppins',sans-serif] text-[14px] data-[state=active]:bg-white data-[state=active]:text-[#FE8A0F] data-[state=active]:shadow-sm transition-all"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <div className="mb-4">
                  <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1">
                    Welcome Back!
                  </h2>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Login to access your account
                  </p>
                </div>

                {/* Social Login */}
                <div className="space-y-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border-2 border-gray-200 hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all font-['Poppins',sans-serif] text-[13px]"
                    onClick={() => handleSocialLogin("google")}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border-2 border-gray-200 hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all font-['Poppins',sans-serif] text-[13px]"
                    onClick={() => handleSocialLogin("facebook")}
                  >
                    <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
                    or login with email
                  </span>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <Label htmlFor="login-email" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-10 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[13px]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-10 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[13px]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label 
                        htmlFor="remember" 
                        className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] cursor-pointer"
                      >
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-['Poppins',sans-serif] text-[12px] text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? "Signing in..." : "Login to Account"}
                  </Button>
                  {loginError && (
                    <p className="text-[12px] text-red-600 text-center font-['Poppins',sans-serif]">
                      {loginError}
                    </p>
                  )}
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-0">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
                    Create Account
                  </h2>
                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                      <Button
                        type="button"
                        onClick={() => {
                          // Random UK data
                          const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Robert', 'Sophia', 'William', 'Isabella'];
                          const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Johnson'];
                          const tradingNames = ['ABC Plumbing Services', 'XYZ Electrical Solutions', 'Premier Home Repairs', 'Expert Builders Ltd', 'Quality Carpentry Co'];
                          const addresses = ['123 High Street', '45 Oak Avenue', '78 Park Lane', '12 Garden Road', '56 Market Square'];
                          const towns = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'];
                          const postcodes = ['SW1A 1AA', 'M1 1AA', 'B1 1AA', 'LS1 1AA', 'L1 1AA'];
                          const travelDistances = ['5 miles', '10 miles', '15 miles', '20 miles', '30 miles'];
                          
                          const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                          const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                          const randomEmail = `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com`;
                          const randomPhone = `+44${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                          const randomPostcode = postcodes[Math.floor(Math.random() * postcodes.length)];
                          const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
                          const randomTown = towns[Math.floor(Math.random() * towns.length)];
                          const randomTradingName = tradingNames[Math.floor(Math.random() * tradingNames.length)];
                          const randomTravelDistance = travelDistances[Math.floor(Math.random() * travelDistances.length)];
                          const randomPassword = 'Test123';
                          
                          setRegisterFirstName(randomFirstName);
                          setRegisterLastName(randomLastName);
                          setRegisterEmail(randomEmail);
                          setRegisterPhone(randomPhone);
                          setRegisterPostcode(randomPostcode);
                          setRegisterPassword(randomPassword);
                          setRegisterConfirmPassword(randomPassword);
                          if (userType === 'professional') {
                            setRegisterTradingName(randomTradingName);
                            setRegisterAddress(randomAddress);
                            setRegisterTownCity(randomTown);
                            setRegisterTravelDistance(randomTravelDistance);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 border-[#FE8A0F] text-[#FE8A0F] hover:bg-[#FE8A0F] hover:text-white"
                      >
                        Fill Random Data
                      </Button>
                    )}
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                    Join our community today
                  </p>
                </div>

                {/* Social Login */}
                <div className="space-y-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border-2 border-gray-200 hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all font-['Poppins',sans-serif] text-[13px]"
                    onClick={() => handleSocialLogin("google")}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border-2 border-gray-200 hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all font-['Poppins',sans-serif] text-[13px]"
                    onClick={() => handleSocialLogin("facebook")}
                  >
                    <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
                </div>

                {/* User Type Selection */}
                <div className="mb-4">
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                    Account Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserType("client")}
                      className={`p-3 rounded-xl border-2 transition-all font-['Poppins',sans-serif] text-[13px] ${
                        userType === "client"
                          ? "border-[#FE8A0F] bg-[#FFF5EB] text-[#FE8A0F]"
                          : "border-gray-200 bg-white text-[#6b6b6b] hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <User className="w-5 h-5 mx-auto mb-1.5" />
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType("professional")}
                      className={`p-3 rounded-xl border-2 transition-all font-['Poppins',sans-serif] text-[13px] ${
                        userType === "professional"
                          ? "border-[#FE8A0F] bg-[#FFF5EB] text-[#FE8A0F]"
                          : "border-gray-200 bg-white text-[#6b6b6b] hover:border-[#FE8A0F]/50"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5" />
                      Professional
                    </button>
                  </div>
                </div>

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-3">
                  {/* First Name & Last Name - 2 columns on desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="register-first-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                        First Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          id="register-first-name"
                          type="text"
                          placeholder="Jane"
                          value={registerFirstName}
                          onChange={(e) => {
                            setRegisterFirstName(e.target.value);
                            if (fieldErrors.firstName) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.firstName;
                                return newErrors;
                              });
                            }
                          }}
                          className={`pl-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                            fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                          }`}
                          required
                        />
                      </div>
                      {fieldErrors.firstName && (
                        <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                          {fieldErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-last-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                        Last Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          id="register-last-name"
                          type="text"
                          placeholder="Smith"
                          value={registerLastName}
                          onChange={(e) => {
                            setRegisterLastName(e.target.value);
                            if (fieldErrors.lastName) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.lastName;
                                return newErrors;
                              });
                            }
                          }}
                          className={`pl-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                            fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                          }`}
                          required
                        />
                      </div>
                      {fieldErrors.lastName && (
                        <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                          {fieldErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Trading Name (Professional only) */}
                  {userType === "professional" && (
                    <div>
                      <Label htmlFor="register-trading-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                        Trading Name *
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          id="register-trading-name"
                          type="text"
                          placeholder="Smith Services Ltd"
                          value={registerTradingName}
                          onChange={(e) => {
                            setRegisterTradingName(e.target.value);
                            if (fieldErrors.tradingName) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.tradingName;
                                return newErrors;
                              });
                            }
                          }}
                          className={`pl-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                            fieldErrors.tradingName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                          }`}
                          required
                        />
                      </div>
                      {fieldErrors.tradingName && (
                        <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                          {fieldErrors.tradingName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Postcode & Address Autocomplete */}
                  <div className={userType === "professional" ? "md:col-span-2" : ""}>
                    <AddressAutocomplete
                      postcode={registerPostcode}
                      onPostcodeChange={(value) => {
                        setRegisterPostcode(value);
                        if (fieldErrors.postcode) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.postcode;
                            return newErrors;
                          });
                        }
                      }}
                      address={registerAddress}
                      onAddressChange={(value) => {
                        setRegisterAddress(value);
                        if (fieldErrors.address || fieldErrors.townCity) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.address;
                            delete newErrors.townCity;
                            return newErrors;
                          });
                        }
                      }}
                      townCity={registerTownCity}
                      onTownCityChange={(value) => {
                        setRegisterTownCity(value);
                        if (fieldErrors.townCity) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.townCity;
                            return newErrors;
                          });
                        }
                      }}
                      county={registerCounty}
                      onCountyChange={(value) => {
                        setRegisterCounty(value);
                      }}
                      onAddressSelect={(address) => {
                        setRegisterPostcode(address.postcode || "");
                        setRegisterAddress(address.address || "");
                        setRegisterTownCity(address.townCity || "");
                        setRegisterCounty(address.county || "");
                        // Clear any related errors
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.postcode;
                          delete newErrors.address;
                          delete newErrors.townCity;
                          return newErrors;
                        });
                      }}
                      label="Postcode"
                          required
                      showAddressField={true}
                      showTownCityField={true}
                      showCountyField={true}
                      addressLabel="Address"
                      className="font-['Poppins',sans-serif]"
                    />
                    {fieldErrors.postcode && (
                      <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.postcode}
                      </p>
                    )}
                    {fieldErrors.address && (
                      <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.address}
                      </p>
                    )}
                    {fieldErrors.townCity && (
                      <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.townCity}
                      </p>
                  )}
                  </div>

                  {/* Travel Distance (Professional only) */}
                  {userType === "professional" && (
                    <div>
                      <Label htmlFor="register-travel-distance" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                        How long are you willing to travel for work? *
                      </Label>
                      <Select 
                        value={registerTravelDistance} 
                        onValueChange={(value) => {
                          setRegisterTravelDistance(value);
                          if (fieldErrors.travelDistance) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.travelDistance;
                              return newErrors;
                            });
                          }
                        }}
                      >
                        <SelectTrigger className={`h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                          fieldErrors.travelDistance ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                        }`}>
                          <SelectValue placeholder="Select distance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5miles">5 miles</SelectItem>
                          <SelectItem value="10miles">10 miles</SelectItem>
                          <SelectItem value="15miles">15 miles</SelectItem>
                          <SelectItem value="20miles">20 miles</SelectItem>
                          <SelectItem value="30miles">30 miles</SelectItem>
                          <SelectItem value="40miles">40 miles</SelectItem>
                          <SelectItem value="50miles">50 miles</SelectItem>
                          <SelectItem value="morethan50miles">More than 50 miles</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.travelDistance && (
                        <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                          {fieldErrors.travelDistance}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Phone Number */}
                  <PhoneInput
                        id="register-phone"
                    label="Phone Number"
                        value={registerPhone}
                    onChange={(value) => {
                      setRegisterPhone(value);
                      // Parse phone value: format is "{countryCode}|{phoneNumber}"
                      const phoneParts = value.includes('|') ? value.split('|') : ['+44', value.replace(/\D/g, '')];
                      const phoneNumber = phoneParts[1] || '';
                      
                      // Clear field error when user starts typing or when validation passes
                      if (phoneNumber) {
                        const phoneValidation = validatePhoneNumber(phoneNumber);
                        if (phoneValidation.isValid) {
                          if (fieldErrors.phone) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.phone;
                              return newErrors;
                            });
                          }
                        }
                      } else if (fieldErrors.phone) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.phone;
                              return newErrors;
                            });
                          }
                        }}
                    placeholder="7123 456789"
                    error={fieldErrors.phone}
                        required
                      />

                  {/* Email */}
                  <div>
                    <Label htmlFor="register-email" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="jane@gmail.com"
                        value={registerEmail}
                        onChange={(e) => {
                          setRegisterEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.email;
                              return newErrors;
                            });
                          }
                        }}
                        className={`pl-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                          fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="register-password" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={registerPassword}
                        onChange={(e) => {
                          const newPassword = e.target.value;
                          setRegisterPassword(newPassword);
                          
                          // Validate password in real-time
                          if (newPassword) {
                            const passwordValidation = validatePassword(newPassword);
                            if (!passwordValidation.isValid) {
                              setFieldErrors(prev => ({
                                ...prev,
                                password: passwordValidation.errors[0] || "Password does not meet requirements"
                              }));
                            } else {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.password;
                                return newErrors;
                              });
                            }
                          } else {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.password;
                              return newErrors;
                            });
                          }
                          
                          // Clear confirmPassword error if passwords match
                          if (fieldErrors.confirmPassword && newPassword === registerConfirmPassword) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.confirmPassword;
                              return newErrors;
                            });
                          }
                        }}
                        className={`pl-10 pr-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                          fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="register-confirm-password" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={registerConfirmPassword}
                        onChange={(e) => {
                          setRegisterConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.confirmPassword;
                              return newErrors;
                            });
                          }
                        }}
                        className={`pl-10 pr-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
                          fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#FE8A0F] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Referral Code (Optional) */}
                  <div>
                    <Label htmlFor="register-referral-code" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                      Referral Code
                    </Label>
                    <Input
                      id="register-referral-code"
                      type="text"
                      placeholder="Enter referral code (optional)"
                      value={registerReferralCode}
                      onChange={(e) => setRegisterReferralCode(e.target.value)}
                      className="h-10 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[13px]"
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div>
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreeTerms}
                        onCheckedChange={(checked) => {
                          setAgreeTerms(checked as boolean);
                          if (fieldErrors.agreeTerms) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.agreeTerms;
                              return newErrors;
                            });
                          }
                        }}
                      className="mt-0.5"
                    />
                    <Label 
                      htmlFor="terms" 
                      className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] leading-snug cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link to="/terms" className="text-[#3B82F6] hover:text-[#2563EB]">
                        Terms & Conditions
                      </Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-[#3B82F6] hover:text-[#2563EB]">
                        Privacy Policy
                      </Link>
                    </Label>
                    </div>
                    {fieldErrors.agreeTerms && (
                      <p className="mt-1 ml-7 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                        {fieldErrors.agreeTerms}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSendingRegistration}
                    className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSendingRegistration ? "Sending verification..." : "Create Account"}
                  </Button>
                  {registerError && !showEmailVerification && (
                    <p className="text-[12px] text-red-600 text-center font-['Poppins',sans-serif]">
                      {registerError}
                    </p>
                  )}
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer Note */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Email & Phone Verification Modal (after registration) */}
          {showEmailVerification && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-[480px] w-full relative">
                <button
                  onClick={handleBackFromVerification}
                  className="flex items-center gap-2 mb-4 font-['Poppins',sans-serif] text-[13px] text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${verificationStep >= 1 ? 'bg-[#FE8A0F]' : 'bg-gray-200'}`} />
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${verificationStep >= 2 ? 'bg-[#FE8A0F]' : 'bg-gray-200'}`} />
                </div>
                
                {/* Email Verification Step */}
                {verificationStep === 1 && (
                  <>
                    <div className="text-center mb-5">
                      <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-7 h-7 text-[#FE8A0F]" />
                      </div>
                      
                      <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                        Verify Your Email
                      </h2>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                        Code sent to
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]">
                        {verificationEmail}
                      </p>
                    </div>
                    
                    <form onSubmit={handleVerifyEmailCode} className="space-y-4">
                      <div>
                        <Label htmlFor="email-code" className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-2 block text-center">
                          Enter 4-Digit Code
                        </Label>
                        <Input
                          id="email-code"
                          type="text"
                          placeholder="0000"
                          value={emailVerificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setEmailVerificationCode(value);
                          }}
                          className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[20px] text-center tracking-[0.5em] px-4"
                          maxLength={4}
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isVerifyingEmail}
                        className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isVerifyingEmail ? "Verifying..." : "Verify & Continue"}
                      </Button>
                      {registerError && (
                        <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                          {registerError}
                        </p>
                      )}
                      
                      <div className="text-center">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                          Didn't receive the code?{" "}
                          <button
                            type="button"
                            onClick={handleResendEmailCode}
                            disabled={isResendingEmail || emailResendTimer > 0}
                            className="text-[#3B82F6] hover:text-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isResendingEmail 
                              ? "Resending..." 
                              : emailResendTimer > 0 
                                ? `Resend (${formatTimer(emailResendTimer)})`
                                : "Resend"}
                          </button>
                        </p>
                      </div>
                    </form>
                  </>
                )}

                {/* Phone Verification Step */}
                {verificationStep === 2 && (
                  <>
                    <div className="text-center mb-5">
                      <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Phone className="w-7 h-7 text-[#FE8A0F]" />
                      </div>
                      
                      <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                        Verify Your Phone
                      </h2>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                        Code sent to
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#FE8A0F]">
                        {verificationPhone}
                      </p>
                    </div>
                    
                    <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                      <div>
                        <Label htmlFor="phone-code" className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] mb-2 block text-center">
                          Enter 4-Digit Code
                        </Label>
                        <Input
                          id="phone-code"
                          type="text"
                          placeholder="0000"
                          value={phoneVerificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPhoneVerificationCode(value);
                          }}
                          className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[20px] text-center tracking-[0.5em] px-4"
                          maxLength={4}
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isRegistering}
                        className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isRegistering ? "Creating account..." : "Complete Verification"}
                      </Button>
                      
                      {registerError && (
                        <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                          {registerError}
                        </p>
                      )}
                      
                      <div className="text-center">
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                          Didn't receive the code?{" "}
                          <button
                            type="button"
                            onClick={handleResendPhoneCode}
                            disabled={isResendingPhone || phoneResendTimer > 0}
                            className="text-[#3B82F6] hover:text-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isResendingPhone 
                              ? "Resending..." 
                              : phoneResendTimer > 0 
                                ? `Resend (${formatTimer(phoneResendTimer)})`
                                : "Resend"}
                          </button>
                        </p>
                      </div>
                    </form>
                  </>
                )}

                {/* Professional Profile Setup Steps - Removed, now handled by separate page */}
                {false && userType === "professional" && verificationStep >= 3 && (
                  <>
                    {/* Step 3: Sector */}
                    {verificationStep === 3 && (
                      <form onSubmit={handleStepSubmit} className="space-y-4">
                        <div className="text-center mb-5">
                          <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="w-7 h-7 text-[#FE8A0F]" />
              </div>
                          <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                            Select Your Sector
                          </h2>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Choose the main sector you work in
                          </p>
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                            Sector <span className="text-red-500">*</span>
                          </Label>
                          <Select value={professionalSector} onValueChange={setProfessionalSector}>
                            <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl">
                              <SelectValue placeholder="Select your sector" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                              <SelectItem value="Plumbing">Plumbing</SelectItem>
                              <SelectItem value="Electrical">Electrical</SelectItem>
                              <SelectItem value="Heating & Cooling">Heating & Cooling</SelectItem>
                              <SelectItem value="Building & Construction">Building & Construction</SelectItem>
                              <SelectItem value="Painting & Decorating">Painting & Decorating</SelectItem>
                              <SelectItem value="Carpentry & Joinery">Carpentry & Joinery</SelectItem>
                              <SelectItem value="Roofing">Roofing</SelectItem>
                              <SelectItem value="Flooring">Flooring</SelectItem>
                              <SelectItem value="Landscaping">Landscaping</SelectItem>
                              <SelectItem value="Cleaning">Cleaning</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {registerError && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                            {registerError}
                          </p>
                        )}

                        <Button
                          type="submit"
                          disabled={isUpdatingProfile || !professionalSector}
                          className="w-full h-11 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60"
                        >
                          {isUpdatingProfile ? "Saving..." : "Next"}
                        </Button>
                      </form>
                    )}

                    {/* Step 4: Category */}
                    {verificationStep === 4 && (
                      <form onSubmit={handleStepSubmit} className="space-y-4">
                        <div className="text-center mb-5">
                          <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                            <FolderTree className="w-7 h-7 text-[#FE8A0F]" />
                          </div>
                          <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                            Select Category
                          </h2>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Choose your main service category
                          </p>
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                            Category <span className="text-red-500">*</span>
                          </Label>
                          <Select value={professionalCategory} onValueChange={setProfessionalCategory}>
                            <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Emergency Repairs">Emergency Repairs</SelectItem>
                              <SelectItem value="Installation">Installation</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                              <SelectItem value="Renovation">Renovation</SelectItem>
                              <SelectItem value="Consultation">Consultation</SelectItem>
                              <SelectItem value="Inspection">Inspection</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {registerError && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                            {registerError}
                          </p>
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackFromVerification}
                            className="flex-1 h-11 border-2 border-gray-200 text-[#2c353f] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={isUpdatingProfile || !professionalCategory}
                            className="flex-1 h-11 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60"
                          >
                            {isUpdatingProfile ? "Saving..." : "Next"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Step 5: Subcategories */}
                    {verificationStep === 5 && (
                      <form onSubmit={handleStepSubmit} className="space-y-4">
                        <div className="text-center mb-5">
                          <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                            <FolderTree className="w-7 h-7 text-[#FE8A0F]" />
                          </div>
                          <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                            Select Subcategories
                          </h2>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Choose all services you offer (select multiple)
                          </p>
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                            Subcategories <span className="text-red-500">*</span>
                          </Label>
                          <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl p-4">
                            {[
                              "Pipe Repair", "Drain Cleaning", "Boiler Installation", "Radiator Repair",
                              "Wiring", "Fuse Box", "Lighting Installation", "Socket Installation",
                              "Wall Painting", "Ceiling Painting", "Exterior Painting", "Wallpapering",
                              "Kitchen Fitting", "Bathroom Fitting", "Flooring Installation", "Tiling",
                              "Roof Repair", "Gutter Cleaning", "Chimney Repair", "Flat Roofing",
                              "Garden Design", "Lawn Care", "Tree Surgery", "Fencing",
                              "Window Cleaning", "Carpet Cleaning", "Deep Cleaning", "End of Tenancy"
                            ].map((subcat) => (
                              <label
                                key={subcat}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                              >
                                <Checkbox
                                  checked={professionalSubcategories.includes(subcat)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setProfessionalSubcategories([...professionalSubcategories, subcat]);
                                    } else {
                                      setProfessionalSubcategories(professionalSubcategories.filter(s => s !== subcat));
                                    }
                                  }}
                                />
                                <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                                  {subcat}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {registerError && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                            {registerError}
                          </p>
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackFromVerification}
                            className="flex-1 h-11 border-2 border-gray-200 text-[#2c353f] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={isUpdatingProfile || professionalSubcategories.length === 0}
                            className="flex-1 h-11 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60"
                          >
                            {isUpdatingProfile ? "Saving..." : "Next"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Step 6: Insurance */}
                    {verificationStep === 6 && (
                      <form onSubmit={handleStepSubmit} className="space-y-4">
                        <div className="text-center mb-5">
                          <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                            <Shield className="w-7 h-7 text-[#FE8A0F]" />
                          </div>
                          <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                            Public Liability Insurance
                          </h2>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Do you have public liability insurance?
                          </p>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-[#FE8A0F] cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="insurance"
                              value="yes"
                              checked={professionalInsurance === "yes"}
                              onChange={(e) => setProfessionalInsurance(e.target.value as "yes" | "no")}
                              className="w-4 h-4 text-[#FE8A0F]"
                            />
                            <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              Yes, I have public liability insurance
                            </span>
                          </label>
                          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-[#FE8A0F] cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="insurance"
                              value="no"
                              checked={professionalInsurance === "no"}
                              onChange={(e) => setProfessionalInsurance(e.target.value as "yes" | "no")}
                              className="w-4 h-4 text-[#FE8A0F]"
                            />
                            <span className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                              No, I don't have insurance yet
                            </span>
                          </label>
                        </div>

                        {registerError && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                            {registerError}
                          </p>
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackFromVerification}
                            className="flex-1 h-11 border-2 border-gray-200 text-[#2c353f] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="flex-1 h-11 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60"
                          >
                            {isUpdatingProfile ? "Saving..." : "Next"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Step 7: About Me */}
                    {verificationStep === 7 && (
                      <form onSubmit={handleStepSubmit} className="space-y-4">
                        <div className="text-center mb-5">
                          <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-7 h-7 text-[#FE8A0F]" />
                          </div>
                          <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f] mb-1.5">
                            Tell Us About Yourself
                          </h2>
                          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                            Describe your experience and what makes you unique
                          </p>
                        </div>

                        <div>
                          <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
                            About Me <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            value={professionalAboutMe}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 500) {
                                setProfessionalAboutMe(value);
                              }
                            }}
                            placeholder="Tell clients about your experience, qualifications, and what you can offer..."
                            className="min-h-[120px] border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
                            maxLength={500}
                            required
                          />
                          <p className={`mt-1 text-[11px] font-['Poppins',sans-serif] ${
                            professionalAboutMe.length >= 450 
                              ? "text-orange-600" 
                              : professionalAboutMe.length >= 500 
                              ? "text-red-600" 
                              : "text-[#6b6b6b]"
                          }`}>
                            {professionalAboutMe.length}/500 characters
                          </p>
                        </div>

                        {registerError && (
                          <p className="font-['Poppins',sans-serif] text-[12px] text-red-600 text-center">
                            {registerError}
                          </p>
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackFromVerification}
                            className="flex-1 h-11 border-2 border-gray-200 text-[#2c353f] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={isUpdatingProfile || !professionalAboutMe.trim() || professionalAboutMe.length > 500}
                            className="flex-1 h-11 bg-[#FE8A0F] hover:bg-[#FFB347] text-white rounded-xl font-['Poppins',sans-serif] text-[14px] disabled:opacity-60"
                          >
                            {isUpdatingProfile ? "Completing..." : "Complete Setup"}
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-[480px] w-full relative">
                <button
                  onClick={handleCloseResetModal}
                  className="flex items-center gap-2 mb-4 font-['Poppins',sans-serif] text-[13px] text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>

                {!resetRequestSent ? (
                  <form onSubmit={handleSendResetLink} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
                        Forgot Password?
                      </h2>
                      <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                        Enter your email and we’ll send you a secure reset link.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="reset-email" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="your.email@gmail.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[14px]"
                          required
                        />
                      </div>
                    </div>

                    {resetError && (
                      <p className="text-[12px] text-red-600 text-center font-['Poppins',sans-serif]">
                        {resetError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={isRequestingReset}
                      className="w-full h-11 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-70"
                    >
                      {isRequestingReset ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
                      Check your email
                    </h2>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                      We've sent a password reset link to{" "}
                      <span className="text-[#3B82F6]">{resetEmail}</span>. Follow the instructions to
                      set a new password.
                    </p>
                    <Button
                      onClick={handleCloseResetModal}
                      className="w-full h-11 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px]"
                    >
                      Back to Login
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
    </>
  );
}
