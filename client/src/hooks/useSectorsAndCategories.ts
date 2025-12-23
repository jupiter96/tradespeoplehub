import { useState, useEffect } from 'react';
import { resolveApiUrl } from '../config/api';

export interface Sector {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  icon?: string;
  bannerImage?: string;
  order: number;
  isActive: boolean;
  categories?: Category[];
}

export interface SubCategory {
  _id: string;
  category: string | Category;
  name: string;
  slug?: string;
  description?: string;
  order: number;
  icon?: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  sector: string | Sector;
  name: string;
  slug?: string;
  question?: string;
  order: number;
  description?: string;
  icon?: string;
  isActive: boolean;
  subCategories?: SubCategory[];
}

export const useSectors = (includeCategories = false, includeSubCategories = false) => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        setLoading(true);
        let url = '/api/sectors?activeOnly=true&sortBy=order&sortOrder=asc';
        if (includeCategories) {
          url += '&includeCategories=true';
          if (includeSubCategories) {
            // Let the backend return categories + subcategories in one response (fewer HTTP calls).
            url += '&includeSubCategories=true';
          }
        }
        
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch sectors');
        }
        
        const data = await response.json();
        let sectorsData = data.sectors || [];
        
        setSectors(sectorsData);
        setError(null);
      } catch (err) {
        // console.error('Error fetching sectors:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sectors');
        setSectors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, [includeCategories, includeSubCategories]);

  return { sectors, loading, error };
};

export const useCategories = (sectorId?: string, sectorSlug?: string, includeSubCategories = false) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        let url = '/api/categories?activeOnly=true&sortBy=order&sortOrder=asc';
        if (includeSubCategories) {
          url += '&includeSubCategories=true';
        }
        if (sectorId) {
          url += `&sectorId=${sectorId}`;
        } else if (sectorSlug) {
          url += `&sectorSlug=${sectorSlug}`;
        }
        
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
        setError(null);
      } catch (err) {
        // console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [sectorId, sectorSlug, includeSubCategories]);

  return { categories, loading, error };
};

export const useSubCategories = (categoryId?: string, categorySlug?: string) => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        setLoading(true);
        let url = '/api/subcategories?activeOnly=true&sortBy=order&sortOrder=asc';
        if (categoryId) {
          url += `&categoryId=${categoryId}`;
        } else if (categorySlug) {
          url += `&categorySlug=${categorySlug}`;
        }
        
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subcategories');
        }
        
        const data = await response.json();
        setSubCategories(data.subCategories || []);
        setError(null);
      } catch (err) {
        // console.error('Error fetching subcategories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subcategories');
        setSubCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId || categorySlug) {
      fetchSubCategories();
    } else {
      setLoading(false);
    }
  }, [categoryId, categorySlug]);

  return { subCategories, loading, error };
};

export const useSector = (identifier: string, includeCategories = false) => {
  const [sector, setSector] = useState<Sector | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSector = async () => {
      try {
        setLoading(true);
        const url = includeCategories
          ? `/api/sectors/${identifier}?includeCategories=true&activeOnly=true`
          : `/api/sectors/${identifier}?activeOnly=true`;
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Sector not found');
          }
          throw new Error('Failed to fetch sector');
        }
        
        const data = await response.json();
        setSector(data.sector || null);
        setError(null);
      } catch (err) {
        // console.error('Error fetching sector:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sector');
        setSector(null);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchSector();
    }
  }, [identifier, includeCategories]);

  return { sector, loading, error };
};

// Service Category interfaces and hooks
export interface ServiceCategory {
  _id: string;
  sector: string | Sector;
  name: string;
  slug?: string;
  question?: string;
  order: number;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  icon?: string;
  bannerImage?: string;
  isActive: boolean;
  level?: number;
  categoryLevelMapping?: Array<{
    level: number;
    attributeType: string;
    title?: string;
    thumbnail?: string;
    icon?: string;
    metadata?: any;
  }>;
  serviceIdealFor?: Array<{
    name: string;
    order: number;
  }>;
  extraServices?: Array<{
    name: string;
    price: number;
    days: number;
    order: number;
  }>;
  pricePerUnit?: {
    enabled: boolean;
    units: Array<{
      name: string;
      price: number;
      order: number;
    }>;
  };
  subCategories?: ServiceSubCategory[];
}

export interface ServiceSubCategory {
  _id: string;
  serviceCategory?: string | ServiceCategory;
  parentSubCategory?: string | ServiceSubCategory;
  name: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  bannerImage?: string;
  icon?: string;
  order: number;
  level: number;
  attributeType?: string;
  isActive: boolean;
}

export const useServiceCategories = (sectorId?: string, sectorSlug?: string, includeSubCategories = false) => {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        setLoading(true);
        let url = '/api/service-categories?activeOnly=true&sortBy=order&sortOrder=asc';
        if (includeSubCategories) {
          url += '&includeSubCategories=true';
        }
        if (sectorId) {
          url += `&sectorId=${sectorId}`;
        } else if (sectorSlug) {
          url += `&sectorSlug=${sectorSlug}`;
        }
        
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch service categories');
        }
        
        const data = await response.json();
        setServiceCategories(data.serviceCategories || []);
        setError(null);
      } catch (err) {
        // console.error('Error fetching service categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch service categories');
        setServiceCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceCategories();
  }, [sectorId, sectorSlug, includeSubCategories]);

  return { serviceCategories, loading, error };
};

export const useServiceCategory = (identifier: string, includeSubCategories = false) => {
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceCategory = async () => {
      try {
        setLoading(true);
        const url = includeSubCategories
          ? `/api/service-categories/${identifier}?includeSector=true&includeSubCategories=true&activeOnly=true`
          : `/api/service-categories/${identifier}?includeSector=true&activeOnly=true`;
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Service category not found');
          }
          throw new Error('Failed to fetch service category');
        }
        
        const data = await response.json();
        setServiceCategory(data.serviceCategory || null);
        setError(null);
      } catch (err) {
        // console.error('Error fetching service category:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch service category');
        setServiceCategory(null);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchServiceCategory();
    }
  }, [identifier, includeSubCategories]);

  return { serviceCategory, loading, error };
};

