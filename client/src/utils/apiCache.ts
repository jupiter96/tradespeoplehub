/**
 * Simple in-memory cache for API responses
 * Helps reduce duplicate API calls and improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Clear expired entries every 10 minutes
setInterval(() => {
  apiCache.clearExpired();
}, 10 * 60 * 1000);

/**
 * Fetch with cache support
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  cacheTTL?: number
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options || {})}`;
  
  // Check cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the response
  apiCache.set(cacheKey, data, cacheTTL);
  
  return data;
}

/**
 * Invalidate cache for specific patterns
 * Useful after mutations (POST, PUT, DELETE)
 */
export function invalidateCache(pattern: string | RegExp): void {
  apiCache.clearPattern(pattern);
}

