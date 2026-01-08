
// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // Check for environment variable (Vite uses import.meta.env)
  // Type assertion needed for TypeScript
  const env = (import.meta as any).env;
  
  if (env?.VITE_API_BASE_URL) {
    return env.VITE_API_BASE_URL;
  }
  
  // Fallback: use current origin in production, localhost in development
  if (env?.PROD || env?.MODE === 'production') {
    // In production, use the current origin (same domain)
    return window.location.origin;
  }
  
  // Development fallback
  return "http://localhost:5000";
};

const API_BASE_URL = getApiBaseUrl();

export const resolveApiUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

export default API_BASE_URL;
