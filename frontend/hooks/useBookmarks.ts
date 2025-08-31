import { useState, useEffect, useCallback } from 'react';

// Types
interface Bookmark {
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
    statistics?: any;
    categories: Array<{
      category: {
        id: string;
        name: Record<string, string>;
        slug: string;
      };
    }>;
    authors: Array<{
      author: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };
}

interface BookmarkToggleResponse {
  isBookmarked: boolean;
  bookmark?: Bookmark;
  storyTitle: Record<string, string>;
}

// Bookmarks hook
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Fetch all bookmarks
  const fetchBookmarks = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/bookmarks', process.env.NEXT_PUBLIC_API_URL);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch bookmarks');
      }

      if (data.success) {
        setBookmarks(data.data || []);
        setPagination(data.pagination);
        return data.data;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if story is bookmarked
  const checkBookmarkStatus = useCallback(async (storyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookmarks/${storyId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to check bookmark status');
      }

      return data.success ? data.data.isBookmarked : false;
    } catch (err: any) {
      console.error('Error checking bookmark status:', err);
      return false;
    }
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback(async (storyId: string): Promise<BookmarkToggleResponse | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookmarks/toggle`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to toggle bookmark');
      }

      if (data.success) {
        // Update local state
        if (data.data.isBookmarked && data.data.bookmark) {
          // Add bookmark
          setBookmarks(prev => [data.data.bookmark, ...prev]);
        } else {
          // Remove bookmark
          setBookmarks(prev => prev.filter(b => b.storyId !== storyId));
        }

        return data.data;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error toggling bookmark:', err);
      return null;
    }
    return null;
  }, []);

  // Remove bookmark
  const removeBookmark = useCallback(async (storyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookmarks/${storyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to remove bookmark');
      }

      if (data.success) {
        // Remove from local state
        setBookmarks(prev => prev.filter(b => b.storyId !== storyId));
        return true;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error removing bookmark:', err);
    }
    return false;
  }, []);

  return {
    bookmarks,
    loading,
    error,
    pagination,
    fetchBookmarks,
    checkBookmarkStatus,
    toggleBookmark,
    removeBookmark,
  };
};

// Story-specific bookmark hook
export const useStoryBookmark = (storyId: string) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { checkBookmarkStatus, toggleBookmark } = useBookmarks();

  // Check bookmark status on mount
  useEffect(() => {
    if (storyId) {
      checkStatus();
    }
  }, [storyId]);

  const checkStatus = async () => {
    setLoading(true);
    const status = await checkBookmarkStatus(storyId);
    setIsBookmarked(status);
    setLoading(false);
  };

  const toggle = async () => {
    setLoading(true);
    const result = await toggleBookmark(storyId);
    if (result) {
      setIsBookmarked(result.isBookmarked);
    }
    setLoading(false);
    return result;
  };

  return {
    isBookmarked,
    loading,
    toggle,
    checkStatus,
  };
};