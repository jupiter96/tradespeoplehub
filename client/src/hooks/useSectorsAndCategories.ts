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
  displayName?: string;
  subtitle?: string;
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
        let url = '/api/sectors?activeOnly=true';
        if (includeCategories) {
          url += '&includeCategories=true';
        }
        
        const response = await fetch(resolveApiUrl(url), {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch sectors');
        }
        
        const data = await response.json();
        let sectorsData = data.sectors || [];
        
        // If subcategories are requested, fetch them for each category
        if (includeSubCategories && includeCategories) {
          sectorsData = await Promise.all(
            sectorsData.map(async (sector: Sector) => {
              if (sector.categories && sector.categories.length > 0) {
                const categoriesWithSubCategories = await Promise.all(
                  sector.categories.map(async (category: Category) => {
                    try {
                      const subCatResponse = await fetch(
                        resolveApiUrl(`/api/subcategories?categoryId=${category._id}&activeOnly=true`),
                        { credentials: 'include' }
                      );
                      if (subCatResponse.ok) {
                        const subCatData = await subCatResponse.json();
                        return { ...category, subCategories: subCatData.subCategories || [] };
                      }
                    } catch (err) {
                      console.error(`Error fetching subcategories for category ${category._id}:`, err);
                    }
                    return category;
                  })
                );
                return { ...sector, categories: categoriesWithSubCategories };
              }
              return sector;
            })
          );
        }
        
        setSectors(sectorsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching sectors:', err);
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
        let url = '/api/categories?activeOnly=true';
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
        console.error('Error fetching categories:', err);
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
        let url = '/api/subcategories?activeOnly=true';
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
        console.error('Error fetching subcategories:', err);
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
          ? `/api/sectors/${identifier}?includeCategories=true`
          : `/api/sectors/${identifier}`;
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
        console.error('Error fetching sector:', err);
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

