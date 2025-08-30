import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Tag } from '@/types';

interface UseTagsReturn {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getTags();
      
      if (response.success && response.data) {
        setTags(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tags');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(errorMessage);
      console.error('Failed to fetch tags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
  };
}

interface UseTagOptions {
  id: string;
  autoFetch?: boolean;
}

interface UseTagReturn {
  tag: Tag | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTag(options: UseTagOptions): UseTagReturn {
  const { id, autoFetch = true } = options;
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchTag = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getTag(id);
      
      if (response.success && response.data) {
        setTag(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tag');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tag';
      setError(errorMessage);
      console.error('Failed to fetch tag:', err);
      setTag(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && id) {
      fetchTag();
    }
  }, [id, autoFetch]);

  return {
    tag,
    loading,
    error,
    refetch: fetchTag,
  };
}