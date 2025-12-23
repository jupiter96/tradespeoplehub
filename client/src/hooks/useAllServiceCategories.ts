import { useState, useEffect, useRef } from 'react';
import { resolveApiUrl } from '../config/api';
import type { ServiceCategory, Sector } from './useSectorsAndCategories';

// Global cache to share across all components
// Cache key includes includeSubCategories and limit to differentiate requests
type CacheKey = string;
let globalCache: Map<CacheKey, {
  data: Record<string, ServiceCategory[]>;
  loading: boolean;
  timestamp: number;
}> = new Map();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (includeSubCategories: boolean, limit?: number): CacheKey => {
  const effectiveLimit = limit ?? DEFAULT_LIMIT;
  return `${includeSubCategories ? 'with' : 'without'}_subs_limit${effectiveLimit}`;
};

// Default limit to fetch more categories at once and reduce API calls
const DEFAULT_LIMIT = 100;

// Fetch all service categories for all sectors in parallel
const fetchAllServiceCategories = async (
  sectors: Sector[],
  includeSubCategories: boolean = false,
  limit?: number
): Promise<Record<string, ServiceCategory[]>> => {
  if (sectors.length === 0) return {};

  const { resolveApiUrl } = await import('../config/api');
  const categoriesMap: Record<string, ServiceCategory[]> = {};

  // Use default limit of 100 if not specified to reduce API calls
  const effectiveLimit = limit ?? DEFAULT_LIMIT;

  // Fetch all in parallel
  const promises = sectors.map(async (sector: Sector) => {
    try {
      const url = `/api/service-categories?sectorId=${sector._id}&activeOnly=true&includeSubCategories=${includeSubCategories}&sortBy=order&sortOrder=asc&limit=${effectiveLimit}`;

      const response = await fetch(resolveApiUrl(url), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { sectorId: sector._id, categories: data.serviceCategories || [] };
      }
      return { sectorId: sector._id, categories: [] };
    } catch (error) {
      // console.error(`Error fetching service categories for sector ${sector._id}:`, error);
      return { sectorId: sector._id, categories: [] };
    }
  });

  const results = await Promise.all(promises);
  results.forEach(({ sectorId, categories }) => {
    categoriesMap[sectorId] = categories;
  });

  return categoriesMap;
};

/**
 * Hook to fetch and cache service categories for all sectors
 * This hook ensures data is fetched only once and shared across all components
 */
export const useAllServiceCategories = (
  sectors: Sector[],
  options: {
    includeSubCategories?: boolean;
    limit?: number;
    forceRefresh?: boolean;
  } = {}
) => {
  const { includeSubCategories = false, limit, forceRefresh = false } = options;
  const cacheKey = getCacheKey(includeSubCategories, limit);
  const cachedData = globalCache.get(cacheKey);
  
  const [serviceCategoriesBySector, setServiceCategoriesBySector] = useState<Record<string, ServiceCategory[]>>(
    cachedData?.data || {}
  );
  const [loading, setLoading] = useState(cachedData?.loading || false);
  const fetchRef = useRef<string | null>(null);

  useEffect(() => {
    const currentCache = globalCache.get(cacheKey);
    const shouldFetch =
      forceRefresh ||
      !currentCache ||
      Object.keys(currentCache.data).length === 0 ||
      Date.now() - currentCache.timestamp > CACHE_DURATION;

    if (!shouldFetch && currentCache && Object.keys(currentCache.data).length > 0) {
      setServiceCategoriesBySector(currentCache.data);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Prevent multiple simultaneous fetches for the same cache key
      if (currentCache?.loading) {
        // Wait for existing fetch to complete
        const checkInterval = setInterval(() => {
          const updatedCache = globalCache.get(cacheKey);
          if (!updatedCache?.loading) {
            clearInterval(checkInterval);
            setServiceCategoriesBySector(updatedCache?.data || {});
            setLoading(false);
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }

      if (sectors.length === 0) {
        setLoading(false);
        return;
      }

      // Mark this fetch as in progress
      const fetchId = `${cacheKey}_${Date.now()}`;
      fetchRef.current = fetchId;

      try {
        // Initialize cache entry if it doesn't exist
        if (!globalCache.has(cacheKey)) {
          globalCache.set(cacheKey, {
            data: {},
            loading: true,
            timestamp: 0,
          });
        }
        
        const cacheEntry = globalCache.get(cacheKey)!;
        cacheEntry.loading = true;
        setLoading(true);

        const categoriesMap = await fetchAllServiceCategories(sectors, includeSubCategories, limit);
        
        // Only update if this is still the current fetch
        if (fetchRef.current === fetchId) {
          cacheEntry.data = categoriesMap;
          cacheEntry.timestamp = Date.now();
          cacheEntry.loading = false;
          
          setServiceCategoriesBySector(categoriesMap);
          setLoading(false);
        }
      } catch (error) {
        // console.error('Error fetching all service categories:', error);
        const cacheEntry = globalCache.get(cacheKey);
        if (cacheEntry && fetchRef.current === fetchId) {
          cacheEntry.loading = false;
          setLoading(false);
        }
      }
    };

    loadData();
  }, [sectors.length, includeSubCategories, limit, forceRefresh, cacheKey]);

  return {
    serviceCategoriesBySector,
    loading,
    refresh: () => {
      const cacheEntry = globalCache.get(cacheKey);
      if (cacheEntry) {
        cacheEntry.timestamp = 0;
      }
      fetchRef.current = null;
    },
  };
};

