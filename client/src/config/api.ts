
// Export function that gets base URL at runtime
// This ensures it works correctly in both development and production
export const resolveApiUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Ensure path has leading slash so base + path is valid
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Always determine base URL at runtime
  if (typeof window !== 'undefined') {
    const env = (import.meta as any).env;
    const base = env?.VITE_API_BASE_URL
      ? (env.VITE_API_BASE_URL as string).replace(/\/$/, '')
      : (env?.PROD || env?.MODE === 'production' ||
          (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'))
        ? window.location.origin
        : 'http://localhost:5000';
    return `${base}${normalizedPath}`;
  }

  return `http://localhost:5000${normalizedPath}`;
};

// Get API base URL (for backward compatibility)
// This is also determined at runtime
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const env = (import.meta as any).env;
    
    if (env?.VITE_API_BASE_URL) {
      return env.VITE_API_BASE_URL;
    }
    
    if (env?.PROD || env?.MODE === 'production' || 
        (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return window.location.origin;
    }
    
    return "http://localhost:5000";
  }
  
  return "http://localhost:5000";
};

// For backward compatibility - this is now determined at runtime
const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
