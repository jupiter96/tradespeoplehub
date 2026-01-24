// Order-related utility functions
import { resolveApiUrl } from "../../config/api";

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatMoney = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return "0.00";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00";
  return numAmount.toFixed(2);
};

export const getStatusBadge = (status?: string): string => {
  switch (status) {
    case "active":
    case "In Progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "delivered":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "completed":
    case "Completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "cancelled":
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    case "Cancellation Pending":
      return "bg-red-50 text-red-700 border-red-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "disputed":
    case "dispute":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export const getDeliveryStatusBadge = (status?: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "active":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "delivered":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export const getDeliveryStatusLabel = (status?: string): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "active":
      return "In Progress";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
};

/** Display label for order status badge. "Cancellation Pending" shown as-is on detail page. */
export const getStatusLabel = (status?: string): string => {
  if (!status) return "";
  if (status === "Cancellation Pending") return "Cancellation Pending";
  return status.toUpperCase();
};

/** Table/list: show actual status; "Cancellation Pending" and "Cancelled" as-is. */
export const getStatusLabelForTable = (status?: string): string => {
  if (!status) return "";
  if (status === "Cancellation Pending") return "Cancellation Pending";
  if (status === "Cancelled" || status === "cancelled") return "Cancelled";
  return status.toUpperCase();
};

export const resolveFileUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return resolveApiUrl(path);
};

// Status icon helper
import React from "react";
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export const getStatusIcon = (status?: string): React.ReactNode => {
  switch (status) {
    case "active":
      return <Package className="w-4 h-4" />;
    case "delivered":
      return <CheckCircle2 className="w-4 h-4" />;
    case "completed":
    case "Completed":
      return <CheckCircle2 className="w-4 h-4" />;
    case "cancelled":
    case "Cancelled":
    case "Cancellation Pending":
      return <XCircle className="w-4 h-4" />;
    case "Rejected":
      return <XCircle className="w-4 h-4" />;
    case "dispute":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <ShoppingBag className="w-4 h-4" />;
  }
};

// Helper function to resolve and validate avatar URL
// Returns undefined for hash-based filenames (e.g., "c1e5f236e69ba84c123ce1336bb460f448af2762.png")
// to force text-based avatar fallback
export const resolveAvatarUrl = (avatar?: string): string | undefined => {
  // Return undefined if avatar is empty, null, or just whitespace
  if (!avatar || !avatar.trim()) return undefined;
  
  const trimmedAvatar = avatar.trim();
  
  // Extract filename from path/URL
  const getFilename = (path: string): string => {
    // Remove query parameters and hash
    const withoutQuery = path.split('?')[0].split('#')[0];
    // Get the last part after /
    const parts = withoutQuery.split('/');
    return parts[parts.length - 1];
  };
  
  const filename = getFilename(trimmedAvatar);
  
  // Filter out hash-based filenames (32-64 character hex strings with image extensions)
  // Pattern: 32-64 hex characters followed by image extension
  const hashPattern = /^[a-f0-9]{32,64}\.(png|jpg|jpeg|gif|webp|svg)$/i;
  if (hashPattern.test(filename)) {
    return undefined;
  }
  
  // Filter out fake/placeholder images and common invalid patterns
  if (/images\.unsplash\.com/i.test(trimmedAvatar) || 
      /placeholder|dummy|fake|default-avatar|broken|error|404/i.test(trimmedAvatar.toLowerCase()) ||
      trimmedAvatar === 'null' ||
      trimmedAvatar === 'undefined' ||
      trimmedAvatar === 'false') {
    return undefined;
  }
  
  // If it's already a full URL, validate it
  if (trimmedAvatar.startsWith("http://") || trimmedAvatar.startsWith("https://")) {
    // Additional validation for common invalid URLs
    if (/images\.unsplash\.com/i.test(trimmedAvatar) || 
        /placeholder|dummy|fake|default-avatar/i.test(trimmedAvatar.toLowerCase())) {
      return undefined;
    }
    // Check for hash filename in URL
    if (hashPattern.test(filename)) {
      return undefined;
    }
    return trimmedAvatar;
  }
  
  // Otherwise, resolve using API URL
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const resolvedUrl = `${baseUrl}${trimmedAvatar.startsWith("/") ? "" : "/"}${trimmedAvatar}`;
  
  // Final check - don't return if it looks invalid
  if (!resolvedUrl || resolvedUrl === baseUrl || resolvedUrl === `${baseUrl}/`) {
    return undefined;
  }
  
  // Final hash pattern check on resolved URL
  if (hashPattern.test(filename)) {
    return undefined;
  }
  
  return resolvedUrl;
};

// Check if file is video
export const isVideoFile = (url?: string): boolean => {
  if (!url) return false;
  return /\.(mp4|mpeg|mov|avi|webm|mkv)$/i.test(url) || 
         /video/i.test(url.toLowerCase());
};
