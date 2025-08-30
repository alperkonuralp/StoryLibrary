import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export function useAuthors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAuthors();
      
      if (response.success) {
        setAuthors(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch authors');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  return {
    authors,
    loading,
    error,
    refetch: fetchAuthors,
  };
}