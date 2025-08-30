import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch categories');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

interface UseCategoryOptions {
  id: string;
  autoFetch?: boolean;
}

interface UseCategoryReturn {
  category: Category | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategory(options: UseCategoryOptions): UseCategoryReturn {
  const { id, autoFetch = true } = options;
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getCategory(id);
      
      if (response.success && response.data) {
        setCategory(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category';
      setError(errorMessage);
      console.error('Failed to fetch category:', err);
      setCategory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && id) {
      fetchCategory();
    }
  }, [id, autoFetch]);

  return {
    category,
    loading,
    error,
    refetch: fetchCategory,
  };
}