
// Export function that gets base URL at runtime
// This ensures it works correctly in both development and production
export const resolveApiUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // Always determine base URL at runtime
  if (typeof window !== 'undefined') {
    const env = (import.meta as any).env;
    
    // Check for environment variable first
    if (env?.VITE_API_BASE_URL) {
      return `${env.VITE_API_BASE_URL}${path}`;
    }
    
    // In production or when not on localhost, use current origin
    if (env?.PROD || env?.MODE === 'production' || 
        (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return `${window.location.origin}${path}`;
    }
    
    // Development: use localhost:5000
    return `http://localhost:5000${path}`;
  }
  
  // Server-side rendering fallback
  return `http://localhost:5000${path}`;
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
