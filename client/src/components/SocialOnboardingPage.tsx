import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  User, 
  Building2,
  CheckCircle2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import PhoneInput from "./PhoneInput";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import AddressAutocomplete from "./AddressAutocomplete";
import API_BASE_URL from "../config/api";
import SEOHead from "./SEOHead";

export default function SocialOnboardingPage() {
  const navigate = useNavigate();
  const {
    fetchPendingSocialProfile,
    sendSocialPhoneCode,
    verifySocialPhone,
    isLoggedIn,
  } = useAccount();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  // Form state
  const [userType, setUserType] = useState<"client" | "professional">("client");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [townCity, setTownCity] = useState("");
  const [county, setCounty] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [travelDistance, setTravelDistance] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Redirect if already logged in
    if (isLoggedIn) {
      navigate("/account", { replace: true });
      return;
    }

    // Fetch pending social profile
    const loadProfile = async () => {
      try {
        const profile = await fetchPendingSocialProfile();
        if (!profile) {
          // No pending profile, redirect to login
          navigate("/login?social=failed", { replace: true });
          return;
        }

        setPendingProfile(profile);
        // Pre-fill form with social profile data (Google or Facebook)
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setEmail(profile.email || "");
      } catch (err) {
        navigate("/login?social=failed", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [fetchPendingSocialProfile, isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate all required fields
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!address.trim()) {
      errors.address = "Address is required";
    }
    if (!townCity.trim()) {
      errors.townCity = "Town/City is required";
    }
    if (!postcode.trim()) {
      errors.postcode = "Postcode is required";
    }
    // Professional-specific required fields
    if (userType === "professional") {
      if (!tradingName.trim()) {
        errors.tradingName = "Trading name is required";
      }
      if (!travelDistance) {
        errors.travelDistance = "Travel distance is required";
      }
    }
    // Parse phone value: format is "{countryCode}|{phoneNumber}"
    const phoneParts = phone.includes('|') ? phone.split('|') : ['+44', phone.replace(/\D/g, '')];
    const countryCode = phoneParts[0] || '+44';
    const phoneNumber = phoneParts[1] || '';
    
    if (!phoneNumber.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const { validatePhoneNumber } = await import("../utils/phoneValidation");
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error || "Invalid phone number format";
      }
    }
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!agreeTerms) {
      errors.agreeTerms = "Please accept the terms and conditions";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Store registration data for after phone verification
    const { normalizePhoneForBackend } = await import("../utils/phoneValidation");
    // phoneParts, countryCode, and phoneNumber are already declared above
    const normalizedPhone = normalizePhoneForBackend(phoneNumber, countryCode); // Add country code before sending
    
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: normalizedPhone,
      postcode: postcode.trim(),
      referralCode: referralCode.trim(),
      userType,
      address: address.trim(),
      townCity: townCity.trim(),
      county: county.trim(),
      agreeTerms: true,
      ...(userType === "professional" && {
        tradingName: tradingName.trim(),
        travelDistance: travelDistance,
      })
    };
    setRegistrationData(data);

    setIsSendingPhoneCode(true);
    try {
      // normalizedPhone is already calculated above
      await sendSocialPhoneCode(normalizedPhone); // Remove country code before sending
      setShowPhoneVerification(true);
    } catch (err: any) {
      setError("Failed to send verification code");
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneCode.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }

    setError(null);
    setIsVerifyingPhone(true);
    try {
      const user = await verifySocialPhone(phoneCode, registrationData);

      // Navigate based on user role
      if (user.role === "professional") {
        navigate("/professional-registration-steps", { replace: true });
      } else {
        navigate("/account", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phone verification failed");
      setPhoneCode("");
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEOHead
          title="Social Onboarding"
          description="Social onboarding page"
          robots="noindex,nofollow"
        />
        <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] via-white to-[#FFF5EB] relative" aria-busy="true">
          <span className="sr-only">Loading</span>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] via-white to-[#FFF5EB]">
      <header className="sticky top-0 h-[100px] md:h-[122px] z-50 bg-white">
        <Nav />
      </header>
      
      <div className="pt-[50px] py-6 md:py-6 px-4 md:px-6">
        <div className="max-w-[500px] mx-auto">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-5 md:p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-[#FFF5EB] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h2 className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
                  Complete Your Profile
                </h2>
              </div>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                We've filled in some information from your {pendingProfile?.provider === 'google' ? 'Google' : 'Facebook'} account. Please complete the rest to finish signing up.
              </p>
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                    First Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
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
                  <Label htmlFor="last-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                    Last Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
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
                  <Label htmlFor="trading-name" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                    Trading Name *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                    <Input
                      id="trading-name"
                      type="text"
                      placeholder="Smith Services Ltd"
                      value={tradingName}
                      onChange={(e) => {
                        setTradingName(e.target.value);
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
              <div>
                <AddressAutocomplete
                  postcode={postcode}
                  onPostcodeChange={(value) => {
                    setPostcode(value);
                    if (fieldErrors.postcode) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.postcode;
                        return newErrors;
                      });
                    }
                  }}
                  address={address}
                  onAddressChange={(value) => {
                    setAddress(value);
                    if (fieldErrors.address || fieldErrors.townCity) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.address;
                        delete newErrors.townCity;
                        return newErrors;
                      });
                    }
                  }}
                  townCity={townCity}
                  onTownCityChange={(value) => {
                    setTownCity(value);
                    if (fieldErrors.townCity) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.townCity;
                        return newErrors;
                      });
                    }
                  }}
                  county={county}
                  onCountyChange={(value) => {
                    setCounty(value);
                  }}
                  onAddressSelect={(address) => {
                    setPostcode(address.postcode || "");
                    setAddress(address.address || "");
                    setTownCity(address.townCity || "");
                    setCounty(address.county || "");
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
                  <Label htmlFor="travel-distance" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                    How long are you willing to travel for work? *
                  </Label>
                  <Select 
                    value={travelDistance} 
                    onValueChange={(value) => {
                      setTravelDistance(value);
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
                id="phone"
                label="Phone Number"
                value={phone}
                onChange={async (value) => {
                  setPhone(value);
                  // Parse phone value: format is "{countryCode}|{phoneNumber}"
                  const phoneParts = value.includes('|') ? value.split('|') : ['+44', value.replace(/\D/g, '')];
                  const phoneNumber = phoneParts[1] || '';
                  
                  // Clear field error when user starts typing or when validation passes
                  if (phoneNumber) {
                    const { validatePhoneNumber } = await import("../utils/phoneValidation");
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
                <Label htmlFor="email" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
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

              {/* Referral Code (Optional) */}
              <div>
                <Label htmlFor="referral-code" className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5">
                  Referral Code
                </Label>
                <Input
                  id="referral-code"
                  type="text"
                  placeholder="Enter referral code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
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
                    <a href="/terms" className="text-[#3B82F6] hover:text-[#2563EB]">
                      Terms & Conditions
                    </a>
                    {" "}and{" "}
                    <a href="/privacy" className="text-[#3B82F6] hover:text-[#2563EB]">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
                {fieldErrors.agreeTerms && (
                  <p className="mt-1 ml-7 text-[11px] text-red-600 font-['Poppins',sans-serif]">
                    {fieldErrors.agreeTerms}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-[12px] text-red-600 text-center font-['Poppins',sans-serif]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSendingPhoneCode}
                className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSendingPhoneCode ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>

            {/* Phone Verification Modal */}
            {showPhoneVerification && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-[480px] w-full relative">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-[#FFF5EB] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="w-7 h-7 text-[#FE8A0F]" />
                    </div>
                    <h3 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] mb-2">
                      Verify Your Phone Number
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
                      We've sent a 4-digit code to {phone}
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
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={phoneCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPhoneCode(value);
                          if (error) setError(null);
                        }}
                        className="h-12 border-2 border-gray-200 focus:border-[#FE8A0F] rounded-xl font-['Poppins',sans-serif] text-[20px] text-center tracking-[0.5em] px-4"
                        maxLength={4}
                        required
                        autoFocus
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isVerifyingPhone || phoneCode.length !== 4}
                      className="w-full h-10 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isVerifyingPhone ? "Verifying..." : "Verify & Complete Registration"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPhoneVerification(false);
                        setPhoneCode("");
                        setError(null);
                      }}
                      className="w-full text-[#6b6b6b] hover:text-[#2c353f] font-['Poppins',sans-serif] text-[13px]"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 text-[#3B82F6] hover:text-[#2563EB] transition-colors font-['Poppins',sans-serif] text-[12px] mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      </div>
    </>
  );
}

