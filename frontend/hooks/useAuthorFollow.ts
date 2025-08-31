import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

interface FollowedAuthor {
  id: string;
  name: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
  followedAt: string;
  storiesCount: number;
  latestStory?: {
    id: string;
    title: Record<string, string>;
    publishedAt: string;
  };
}

interface Follower {
  id: string;
  name: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
  followedAt: string;
}

interface UseAuthorFollowReturn {
  stats: FollowStats | null;
  followers: Follower[];
  following: FollowedAuthor[];
  loading: boolean;
  error: string | null;
  followAuthor: (authorId: string) => Promise<boolean>;
  unfollowAuthor: (authorId: string) => Promise<boolean>;
  checkFollowStatus: (authorId: string) => Promise<FollowStats | null>;
  loadFollowers: (authorId?: string) => Promise<void>;
  loadFollowing: (authorId?: string) => Promise<void>;
  refreshStats: (authorId?: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const useAuthorFollow = (targetAuthorId?: string): UseAuthorFollowReturn => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<FollowedAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFollowStatus = useCallback(async (authorId: string): Promise<FollowStats | null> => {
    if (!token || !user) return null;

    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/authors/${authorId}/follow-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check follow status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to check follow status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check follow status');
      return null;
    }
  }, [token, user]);

  const followAuthor = useCallback(async (authorId: string): Promise<boolean> => {
    if (!token || !user) {
      setError('You must be logged in to follow authors');
      return false;
    }

    if (authorId === user.id) {
      setError('You cannot follow yourself');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/authors/${authorId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to follow author: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local stats if this is the target author
        if (targetAuthorId === authorId && stats) {
          setStats({
            ...stats,
            isFollowing: true,
            followersCount: stats.followersCount + 1,
          });
        }
        return true;
      } else {
        throw new Error(data.message || 'Failed to follow author');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to follow author');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user, targetAuthorId, stats]);

  const unfollowAuthor = useCallback(async (authorId: string): Promise<boolean> => {
    if (!token || !user) {
      setError('You must be logged in to unfollow authors');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/authors/${authorId}/follow`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to unfollow author: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local stats if this is the target author
        if (targetAuthorId === authorId && stats) {
          setStats({
            ...stats,
            isFollowing: false,
            followersCount: Math.max(0, stats.followersCount - 1),
          });
        }

        // Remove from following list
        setFollowing(prev => prev.filter(author => author.id !== authorId));
        return true;
      } else {
        throw new Error(data.message || 'Failed to unfollow author');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unfollow author');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user, targetAuthorId, stats]);

  const loadFollowers = useCallback(async (authorId?: string) => {
    const targetId = authorId || user?.id;
    if (!token || !targetId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/authors/${targetId}/followers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load followers: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFollowers(data.data.followers || []);
      } else {
        throw new Error(data.message || 'Failed to load followers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const loadFollowing = useCallback(async (authorId?: string) => {
    const targetId = authorId || user?.id;
    if (!token || !targetId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/authors/${targetId}/following`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load following: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFollowing(data.data.following || []);
      } else {
        throw new Error(data.message || 'Failed to load following');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load following');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const refreshStats = useCallback(async (authorId?: string) => {
    const targetId = authorId || targetAuthorId || user?.id;
    if (!targetId) return;

    const newStats = await checkFollowStatus(targetId);
    if (newStats) {
      setStats(newStats);
    }
  }, [targetAuthorId, user, checkFollowStatus]);

  // Load initial stats for target author
  useEffect(() => {
    if (targetAuthorId && token && user) {
      refreshStats(targetAuthorId);
    }
  }, [targetAuthorId, token, user, refreshStats]);

  return {
    stats,
    followers,
    following,
    loading,
    error,
    followAuthor,
    unfollowAuthor,
    checkFollowStatus,
    loadFollowers,
    loadFollowing,
    refreshStats,
  };
};