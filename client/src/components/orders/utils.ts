// Order-related utility functions

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

export const resolveFileUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Assume it's a relative path and prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_URL || "";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

