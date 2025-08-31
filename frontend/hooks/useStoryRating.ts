import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface UseStoryRatingReturn {
  userRating: Rating | null;
  ratings: Rating[];
  stats: RatingStats | null;
  loading: boolean;
  error: string | null;
  submitRating: (rating: number, comment?: string) => Promise<boolean>;
  updateRating: (rating: number, comment?: string) => Promise<boolean>;
  deleteRating: () => Promise<boolean>;
  loadMoreRatings: () => Promise<void>;
  hasMoreRatings: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const useStoryRating = (storyId: string): UseStoryRatingReturn => {
  const { token, user } = useAuth();
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreRatings, setHasMoreRatings] = useState(true);

  const fetchRatings = useCallback(async (pageNum = 1, reset = true) => {
    if (!storyId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/stories/${storyId}/ratings?page=${pageNum}&limit=10&includeComments=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ratings: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (reset) {
          setRatings(data.data.ratings || []);
        } else {
          setRatings(prev => [...prev, ...(data.data.ratings || [])]);
        }
        
        setStats(data.data.stats);
        setHasMoreRatings(data.data.hasMore || false);

        // Find user's rating if logged in
        if (user && data.data.ratings) {
          const currentUserRating = data.data.ratings.find((r: Rating) => r.user.id === user.id);
          setUserRating(currentUserRating || null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }, [storyId, token, user]);

  const submitRating = useCallback(async (rating: number, comment?: string): Promise<boolean> => {
    if (!token || !user) {
      setError('You must be logged in to rate stories');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit rating: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update user rating
        setUserRating(data.data.rating);
        
        // Refresh ratings and stats
        await fetchRatings(1, true);
        return true;
      }

      throw new Error(data.message || 'Failed to submit rating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
      return false;
    }
  }, [token, user, storyId, fetchRatings]);

  const updateRating = useCallback(async (rating: number, comment?: string): Promise<boolean> => {
    if (!token || !user || !userRating) {
      setError('No existing rating to update');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/ratings/${userRating.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update rating: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update user rating
        setUserRating(data.data.rating);
        
        // Refresh ratings and stats
        await fetchRatings(1, true);
        return true;
      }

      throw new Error(data.message || 'Failed to update rating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rating');
      return false;
    }
  }, [token, user, userRating, storyId, fetchRatings]);

  const deleteRating = useCallback(async (): Promise<boolean> => {
    if (!token || !user || !userRating) {
      setError('No rating to delete');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/ratings/${userRating.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete rating: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Clear user rating
        setUserRating(null);
        
        // Refresh ratings and stats
        await fetchRatings(1, true);
        return true;
      }

      throw new Error(data.message || 'Failed to delete rating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rating');
      return false;
    }
  }, [token, user, userRating, storyId, fetchRatings]);

  const loadMoreRatings = useCallback(async () => {
    if (!hasMoreRatings || loading) return;

    const nextPage = page + 1;
    await fetchRatings(nextPage, false);
    setPage(nextPage);
  }, [hasMoreRatings, loading, page, fetchRatings]);

  // Load initial ratings
  useEffect(() => {
    if (storyId) {
      fetchRatings(1, true);
      setPage(1);
    }
  }, [storyId, fetchRatings]);

  return {
    userRating,
    ratings,
    stats,
    loading,
    error,
    submitRating,
    updateRating,
    deleteRating,
    loadMoreRatings,
    hasMoreRatings,
  };
};