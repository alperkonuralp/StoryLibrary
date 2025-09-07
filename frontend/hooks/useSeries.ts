import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export function useSeries() {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getSeries();
      
      if (response.success) {
        setSeries(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch series');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return {
    series,
    loading,
    error,
    refetch: fetchSeries,
  };
}