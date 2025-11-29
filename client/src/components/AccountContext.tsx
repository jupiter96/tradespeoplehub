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
  postcode?: string;
  travelDistance?: string;
  referralCode?: string;
  sector?: string;
  sectors?: string[];
  services?: string[];
  aboutService?: string;
  hasTradeQualification?: string;
  hasPublicLiability?: string;
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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  address?: string;
  townCity?: string;
  tradingName?: string;
  travelDistance?: string;
  sector?: string;
  services?: string[];
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
  verifyRegistrationEmail: (code: string) => Promise<void>;
  completeRegistration: (code: string) => Promise<UserInfo>;
  fetchPendingSocialProfile: () => Promise<PendingSocialProfile | null>;
  completeSocialRegistration: (payload: SocialRegistrationPayload) => Promise<UserInfo>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<UserInfo>;
  requestEmailChangeOTP: (email: string) => Promise<{ message: string; emailCode?: string }>;
  requestPhoneChangeOTP: (phone: string) => Promise<{ message: string; phoneCode?: string }>;
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
      throw new Error(data.error || "Something went wrong");
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
    async (code: string) => {
      const data = await requestJson("/api/auth/register/verify-email", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      return data;
    },
    [requestJson]
  );

  const completeRegistration = useCallback(
    async (code: string) => {
      const data = await requestJson("/api/auth/register/verify-phone", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      applyUserSession(data.user);
      return data.user;
    },
    [applyUserSession, requestJson]
  );

  const fetchPendingSocialProfile = useCallback(async () => {
    const data = await requestJson("/api/auth/social/pending");
    return data.pending ?? null;
  }, [requestJson]);

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

  const verifyOTP = useCallback(
    async (code: string, type: 'email' | 'phone') => {
      const data = await requestJson("/api/auth/profile/verify-otp", {
        method: "POST",
        body: JSON.stringify({ code, type }),
      });
      return data;
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
        completeSocialRegistration,
        updateProfile,
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
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
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
