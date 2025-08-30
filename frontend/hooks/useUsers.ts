import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getUsers();
      
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}