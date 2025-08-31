'use client';

import { useState, useCallback } from 'react';
import { APIError } from '@/lib/errorHandling';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
}

export function useAsyncOperation<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await operation();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const apiError = error instanceof APIError ? error : new APIError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      setState(prev => ({ ...prev, loading: false, error: apiError }));
      throw apiError;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}