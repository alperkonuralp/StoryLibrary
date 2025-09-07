import { useState, useCallback } from 'react';

// Types
interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  profile?: any;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalStarted: number;
  totalCompleted: number;
  totalRatings: number;
  averageRating: number;
  recentProgress: Array<{
    id: string;
    status: string;
    completionPercentage: number;
    lastReadAt: string;
    story: {
      id: string;
      title: Record<string, string>;
      slug: string;
    };
  }>;
}

interface ProfileUpdateData {
  username?: string;
  profile?: any;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User profile hook
export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch profile');
      }

      if (data.success) {
        setProfile(data.data);
        return data.data;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Fetch user statistics
  const fetchStats = useCallback(async (): Promise<UserStats | null> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch statistics');
      }

      if (data.success) {
        setStats(data.data);
        return data.data;
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
    return null;
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (profileData: ProfileUpdateData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      if (data.success) {
        setProfile(data.data);
        return true;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
    return false;
  }, []);

  // Change password
  const changePassword = useCallback(async (passwordData: PasswordChangeData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to change password');
      }

      return data.success;
    } catch (err: any) {
      setError(err.message);
      console.error('Error changing password:', err);
    } finally {
      setLoading(false);
    }
    return false;
  }, []);

  // Delete account
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete account');
      }

      return data.success;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting account:', err);
    } finally {
      setLoading(false);
    }
    return false;
  }, []);

  return {
    profile,
    stats,
    loading,
    error,
    fetchProfile,
    fetchStats,
    updateProfile,
    changePassword,
    deleteAccount,
  };
};