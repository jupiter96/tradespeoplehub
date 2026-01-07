import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import API_BASE_URL, { resolveApiUrl } from "../config/api";

type UserRole = "client" | "professional" | null;

interface UserInfo {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role?: "client" | "professional";
  phone?: string;
  avatar?: string;
  businessName?: string;
  tradingName?: string;
  isBlocked?: boolean;
  blockReviewInvitation?: boolean;
  address?: string;
  townCity?: string;
  county?: string;
  postcode?: string;
  travelDistance?: string;
  referralCode?: string;
  sector?: string;
  sectors?: string[];
  services?: string[];
  aboutService?: string;
  hasTradeQualification?: string;
  hasPublicLiability?: string;
  professionalIndemnityAmount?: number;
  insuranceExpiryDate?: string | Date;
  publicProfile?: {
    bio?: string;
    portfolio?: Array<{
      id?: string;
      image: string;
      title: string;
      description: string;
    }>;
    publicProfileUrl?: string;
    isPublic?: boolean;
    qualifications?: string;
    certifications?: string;
    companyDetails?: string;
  };
}

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterPayload {
  userType: "client" | "professional";
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  postcode: string;
  referralCode?: string;
  tradingName?: string;
  townCity?: string;
  county?: string;
  address?: string;
  travelDistance?: string;
}

interface SocialRegistrationPayload extends Omit<RegisterPayload, "password"> {
  password?: string;
  agreeTerms: boolean;
}

interface PendingSocialProfile {
  provider: "google" | "facebook";
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface ProfileUpdatePayload {
  firstName?: string; // Read-only after registration, not allowed to be updated
  lastName?: string; // Read-only after registration, not allowed to be updated
  email: string;
  phone: string;
  postcode: string;
  address?: string;
  townCity?: string;
  county?: string;
  tradingName?: string;
  travelDistance?: string;
  sector?: string;
  sectors?: string[];
  services?: string[];
  professionalIndemnityAmount?: number;
  insuranceExpiryDate?: string;
  aboutService?: string;
  hasTradeQualification?: "yes" | "no";
  hasPublicLiability?: "yes" | "no";
}

interface AccountContextType {
  userRole: UserRole;
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  currentUser: UserInfo | null;
  login: (payload: LoginPayload) => Promise<UserInfo>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyRegistrationEmail: (code: string, email?: string) => Promise<void>;
  completeRegistration: (code: string, email?: string) => Promise<UserInfo>;
  fetchPendingSocialProfile: () => Promise<PendingSocialProfile | null>;
  sendSocialPhoneCode: (phone: string) => Promise<{ message: string; phoneCode?: string }>;
  resendSocialPhoneCode: () => Promise<{ message: string; phoneCode?: string }>;
  verifySocialPhone: (code: string, registrationData: SocialRegistrationPayload) => Promise<UserInfo>;
  completeSocialRegistration: (payload: SocialRegistrationPayload) => Promise<UserInfo>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<UserInfo>;
  requestEmailChangeOTP: (email: string) => Promise<{ message: string; emailCode?: string }>;
  requestPhoneChangeOTP: (phone: string) => Promise<{ message: string; phoneCode?: string }>;
  resendEmailChangeOTP: () => Promise<{ message: string; emailCode?: string }>;
  resendPhoneChangeOTP: () => Promise<{ message: string; phoneCode?: string }>;
  verifyOTP: (code: string, type: 'email' | 'phone') => Promise<{ message: string }>;
  uploadAvatar: (file: File) => Promise<UserInfo>;
  removeAvatar: () => Promise<UserInfo>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<UserInfo>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (confirmText: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (updates: Partial<UserInfo>) => void;
  refreshUser: () => Promise<UserInfo | null>;
  authReady: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const formatAvatarUrl = useCallback(
    (value?: string) => {
      if (!value) {
        return value;
      }
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
      }
      return resolveApiUrl(value);
    },
    []
  );

  const applyUserSession = useCallback((incomingUser: UserInfo | null) => {
    if (incomingUser) {
      const fallbackName = [incomingUser.firstName, incomingUser.lastName].filter(Boolean).join(" ").trim();
      const enrichedUser: UserInfo = {
        ...incomingUser,
        name: incomingUser.name || fallbackName || incomingUser.email,
        businessName: incomingUser.businessName || incomingUser.tradingName,
        avatar: incomingUser.avatar ? formatAvatarUrl(incomingUser.avatar) : incomingUser.avatar,
      };

      setUserInfo(enrichedUser);
      setUserRole((enrichedUser.role ?? null) as UserRole);
      setIsLoggedIn(true);
    } else {
      setUserInfo(null);
      setUserRole(null);
      setIsLoggedIn(false);
    }
  }, [formatAvatarUrl]);

  const requestJson = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(resolveApiUrl(path), {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (!response.ok) {
      // Create error with detailed Twilio information
      const error: any = new Error(data.error || "Something went wrong");
      error.twilioErrorCode = data.twilioErrorCode;
      error.twilioErrorMessage = data.twilioErrorMessage;
      error.twilioErrorMoreInfo = data.twilioErrorMoreInfo;
      throw error;
    }

    return data;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      applyUserSession(data.user);
      return data.user;
    },
    [applyUserSession, requestJson]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await requestJson("/api/auth/register/initiate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data;
    },
    [requestJson]
  );

  const verifyRegistrationEmail = useCallback(
    async (code: string, email?: string) => {
      // console.log('[Phone Code] Frontend - AccountContext - Verifying email, will trigger phone code generation');
      const data = await requestJson("/api/auth/register/verify-email", {
        method: "POST",
        body: JSON.stringify({ code, email }),
      });
      // console.log('[Phone Code] Frontend - AccountContext - Email verified, phone code in response:', {
      //   hasPhoneCode: !!data?.phoneCode,
      //   phoneCode: data?.phoneCode || 'not provided'
      // });
      return data;
    },
    [requestJson]
  );

  const completeRegistration = useCallback(
    async (code: string, email?: string) => {
      // console.log('[Phone Code] Frontend - AccountContext - completeRegistration called with phone code:', {
      //   codeLength: code.length,
      //   code: code ? '****' : 'missing',
      //   email: email
      // });
      try {
      const data = await requestJson("/api/auth/register/verify-phone", {
        method: "POST",
          body: JSON.stringify({ code, email }),
        });

        // console.log('[Phone Code] Frontend - AccountContext - Registration API response received:', {
      //     userId: data.user?.id,
      //     email: data.user?.email,
      //     phone: data.user?.phone,
      //     role: data.user?.role
      // });

      applyUserSession(data.user);
      return data.user;
      } catch (error) {
        // console.error('[Phone Code] Frontend - AccountContext - completeRegistration error:', error);
        throw error;
      }
    },
    [applyUserSession, requestJson]
  );

  const fetchPendingSocialProfile = useCallback(async () => {
    const data = await requestJson("/api/auth/social/pending");
    return data.pending ?? null;
  }, [requestJson]);

  const sendSocialPhoneCode = useCallback(
    async (phone: string) => {
      const data = await requestJson("/api/auth/social/send-phone-code", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      return data;
    },
    [requestJson]
  );

  const resendSocialPhoneCode = useCallback(
    async () => {
      const data = await requestJson("/api/auth/social/resend-phone-code", {
        method: "POST",
      });
      return data;
    },
    [requestJson]
  );

  const verifySocialPhone = useCallback(
    async (code: string, registrationData: SocialRegistrationPayload) => {
      // console.log('[Phone Code] Frontend - Verifying phone code:', {
      //   codeLength: code.length,
      //   code: code ? '****' : 'missing',
      //   hasRegistrationData: !!registrationData
      // });
      const data = await requestJson("/api/auth/social/verify-phone", {
        method: "POST",
        body: JSON.stringify({ code, ...registrationData }),
      });
      // console.log('[Phone Code] Frontend - Phone verification response:', {
      //   success: !!data.user,
      //   userId: data.user?.id
      // });
      applyUserSession(data.user);
      return data.user;
    },
    [applyUserSession, requestJson]
  );

  const completeSocialRegistration = useCallback(
    async (payload: SocialRegistrationPayload) => {
      const data = await requestJson("/api/auth/social/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      applyUserSession(data.user);
      return data.user;
    },
    [applyUserSession, requestJson]
  );

  const requestEmailChangeOTP = useCallback(
    async (email: string) => {
      const data = await requestJson("/api/auth/profile/verify-email-change", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return data;
    },
    [requestJson]
  );

  const requestPhoneChangeOTP = useCallback(
    async (phone: string) => {
      const data = await requestJson("/api/auth/profile/verify-phone-change", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      return data;
    },
    [requestJson]
  );

  const resendEmailChangeOTP = useCallback(
    async () => {
      const data = await requestJson("/api/auth/profile/resend-email-change", {
        method: "POST",
      });
      return data;
    },
    [requestJson]
  );

  const resendPhoneChangeOTP = useCallback(
    async () => {
      const data = await requestJson("/api/auth/profile/resend-phone-change", {
        method: "POST",
      });
      return data;
    },
    [requestJson]
  );

  const verifyOTP = useCallback(
    async (code: string, type: 'email' | 'phone') => {
      // console.log('[Phone Verification] AccountContext - verifyOTP called:', { type, code: code ? '****' : 'missing' });
      try {
        const data = await requestJson("/api/auth/profile/verify-otp", {
          method: "POST",
          body: JSON.stringify({ code, type }),
        });
        // console.log('[Phone Verification] AccountContext - verifyOTP response:', data);
        return data;
      } catch (error) {
        // console.error('[Phone Verification] AccountContext - verifyOTP error:', error);
        throw error;
      }
    },
    [requestJson]
  );

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      const data = await requestJson("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      applyUserSession(data.user);
      return data.user;
    },
    [applyUserSession, requestJson]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(resolveApiUrl("/api/auth/profile/avatar"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to upload avatar");
      }

      // Cloudinary returns full URL, no need to format
      applyUserSession(data.user);
      return data.user;
    },
    [applyUserSession]
  );

  const removeAvatar = useCallback(async () => {
    const response = await fetch(resolveApiUrl("/api/auth/profile/avatar"), {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to remove avatar");
    }

    applyUserSession(data.user);
    return data.user;
  }, [applyUserSession]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      await requestJson("/api/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    [requestJson]
  );

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      const data = await requestJson("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });

      applyUserSession(null);
      return data;
    },
    [applyUserSession, requestJson]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await requestJson("/api/auth/profile/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
    [requestJson]
  );

  const deleteAccount = useCallback(
    async (confirmText: string) => {
      await requestJson("/api/auth/profile", {
        method: "DELETE",
        body: JSON.stringify({ confirmText }),
      });
      applyUserSession(null);
    },
    [applyUserSession, requestJson]
  );

  const logout = useCallback(async () => {
    // Clear verification modal flag on logout so it shows again on next login
    try {
      sessionStorage.removeItem("verificationModalShown");
      sessionStorage.removeItem("showVerificationModalAfterLogin");
    } catch {
      // ignore
    }
    try {
      await fetch(resolveApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      applyUserSession(null);
    }
  }, [applyUserSession]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/auth/me"), { credentials: "include" });
      if (!response.ok) {
        applyUserSession(null);
        return null;
      }

      const data = await response.json();
      if (data.user) {
        applyUserSession(data.user);
        return data.user;
      }

      applyUserSession(null);
      return null;
    } catch {
      applyUserSession(null);
      return null;
    }
  }, [applyUserSession]);

  useEffect(() => {
    refreshUser().finally(() => setAuthReady(true));
  }, [refreshUser]);

  const updateUserInfo = (updates: Partial<UserInfo>) => {
    setUserInfo((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AccountContext.Provider
      value={{
        userRole,
        isLoggedIn,
        userInfo,
        currentUser: userInfo,
        login,
        register,
        verifyRegistrationEmail,
        completeRegistration,
        fetchPendingSocialProfile,
        sendSocialPhoneCode,
        resendSocialPhoneCode,
        verifySocialPhone,
        completeSocialRegistration,
        updateProfile,
        requestEmailChangeOTP,
        requestPhoneChangeOTP,
        resendEmailChangeOTP,
        resendPhoneChangeOTP,
        verifyOTP,
        uploadAvatar,
        removeAvatar,
        requestPasswordReset,
        resetPassword,
        changePassword,
        deleteAccount,
        logout,
        updateUserInfo,
        refreshUser,
        authReady,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context !== undefined && context !== null) return context;

  // In rare dev/HMR edge cases (or misconfigured app shells), context can be missing.
  // Returning a guarded fallback prevents a full app crash while keeping failures loud
  // when any account action is attempted.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    // console.error("useAccount was called without an AccountProvider in the React tree.");
  }

  const err = () => {
    throw new Error("useAccount must be used within an AccountProvider");
  };

  return {
    userRole: null,
    isLoggedIn: false,
    userInfo: null,
    currentUser: null,
    login: async () => err(),
    register: async () => err(),
    verifyRegistrationEmail: async () => err(),
    completeRegistration: async () => err(),
    fetchPendingSocialProfile: async () => err(),
    sendSocialPhoneCode: async () => err(),
    resendSocialPhoneCode: async () => err(),
    verifySocialPhone: async () => err(),
    completeSocialRegistration: async () => err(),
    updateProfile: async () => err(),
    requestEmailChangeOTP: async () => err(),
    requestPhoneChangeOTP: async () => err(),
    resendEmailChangeOTP: async () => err(),
    resendPhoneChangeOTP: async () => err(),
    verifyOTP: async () => err(),
    uploadAvatar: async () => err(),
    removeAvatar: async () => err(),
    requestPasswordReset: async () => err(),
    resetPassword: async () => err(),
    changePassword: async () => err(),
    deleteAccount: async () => err(),
    logout: async () => err(),
    updateUserInfo: () => err(),
    refreshUser: async () => err(),
    authReady: false,
  };
}

export type {
  UserInfo,
  LoginPayload,
  RegisterPayload,
  SocialRegistrationPayload,
  PendingSocialProfile,
  ProfileUpdatePayload,
  UserRole,
};
