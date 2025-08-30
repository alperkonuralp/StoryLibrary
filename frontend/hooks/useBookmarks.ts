import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface Bookmark {
  id: string;
  userId: string;
  storyId: string;
  createdAt: string;
  story: {
    id: string;
    title: Record<string, string>;
    slug: string;
    shortDescription: Record<string, string>;
    publishedAt: string;
    averageRating?: number;
    ratingCount: number;
    statistics?: {
      wordCount?: Record<string, number>;
      estimatedReadingTime?: Record<string, number>;
    };
    authors: Array<{
      author: {
        name: string;
      };
    }>;
    categories: Array<{
      category: {
        name: Record<string, string>;
      };
    }>;
  };
}

// Hook for managing a specific story's bookmark status
export function useStoryBookmark(storyId?: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarkStatus = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.checkBookmark(id);
      
      if (response.success) {
        setIsBookmarked(response.data.isBookmarked);
      } else {
        setError(response.error?.message || 'Failed to check bookmark status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bookmark status';
      setError(errorMessage);
      setIsBookmarked(false);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async () => {
    if (!storyId) {
      setError('Story ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.addBookmark(storyId);

      if (response.success) {
        setIsBookmarked(true);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to add bookmark');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add bookmark';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async () => {
    if (!storyId) {
      setError('Story ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.removeBookmark(storyId);

      if (response.success) {
        setIsBookmarked(false);
      } else {
        throw new Error(response.error?.message || 'Failed to remove bookmark');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove bookmark';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (isBookmarked) {
      await removeBookmark();
    } else {
      await addBookmark();
    }
  };

  useEffect(() => {
    if (storyId) {
      fetchBookmarkStatus(storyId);
    }
  }, [storyId]);

  return {
    isBookmarked,
    loading,
    error,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    refetch: () => storyId ? fetchBookmarkStatus(storyId) : Promise.resolve(),
  };
}

// Hook for fetching all user bookmarks
export function useAllBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getBookmarks();
      
      if (response.success) {
        setBookmarks(response.data as Bookmark[]);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch bookmarks');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookmarks';
      setError(errorMessage);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return {
    bookmarks,
    loading,
    error,
    refetch: fetchBookmarks,
  };
}