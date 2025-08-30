import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Story, StoryFilters, PaginationInfo } from '@/types';

interface UseStoriesOptions {
  filters?: StoryFilters;
  autoFetch?: boolean;
}

interface UseStoriesReturn {
  stories: Story[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  refetch: () => Promise<void>;
}

export function useStories(options: UseStoriesOptions = {}): UseStoriesReturn {
  const { filters, autoFetch = true } = options;
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getStories(filters);
      
      if (response.success && response.data) {
        setStories(response.data.stories);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch stories');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stories';
      setError(errorMessage);
      console.error('Failed to fetch stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchStories();
    }
  }, [JSON.stringify(filters), autoFetch]);

  return {
    stories,
    loading,
    error,
    pagination,
    refetch: fetchStories,
  };
}

interface UseStoryOptions {
  id?: string;
  slug?: string;
  autoFetch?: boolean;
}

interface UseStoryReturn {
  story: Story | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStory(options: UseStoryOptions = {}): UseStoryReturn {
  const { id, slug, autoFetch = true } = options;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(autoFetch && (!!id || !!slug));
  const [error, setError] = useState<string | null>(null);

  const fetchStory = async () => {
    if (!id && !slug) {
      setError('Either id or slug must be provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = slug 
        ? await apiClient.getStoryBySlug(slug)
        : await apiClient.getStory(id!);
      
      if (response.success && response.data) {
        setStory(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch story');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch story';
      setError(errorMessage);
      console.error('Failed to fetch story:', err);
      setStory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && (id || slug)) {
      fetchStory();
    }
  }, [id, slug, autoFetch]);

  return {
    story,
    loading,
    error,
    refetch: fetchStory,
  };
}