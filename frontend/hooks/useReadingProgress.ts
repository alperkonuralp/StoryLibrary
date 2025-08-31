import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface ReadingProgress {
  id: string;
  userId: string;
  storyId: string;
  status: 'STARTED' | 'COMPLETED';
  lastParagraph?: number;
  startedAt: string;
  completedAt?: string;
  story: {
    id: string;
    title: Record<string, string>;
    slug: string;
  };
}

export interface ReadingProgressSummary {
  id: string;
  userId: string;
  storyId: string;
  status: 'STARTED' | 'COMPLETED';
  lastParagraph?: number;
  startedAt: string;
  completedAt?: string;
  story: {
    id: string;
    title: Record<string, string>;
    slug: string;
    shortDescription: Record<string, string>;
    publishedAt: string;
    averageRating?: number;
    ratingCount: number;
  };
}

// Hook for a specific story's progress
export function useStoryProgress(storyId?: string) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async (id: string) => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setProgress(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getProgress(id);
      
      if (response.success) {
        setProgress(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch progress');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (data: {
    lastParagraph?: number;
    status?: 'STARTED' | 'COMPLETED';
  }) => {
    if (!storyId) {
      setError('Story ID is required');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.updateProgress({
        storyId,
        ...data,
      });

      if (response.success) {
        setProgress(response.data);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update progress');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAsStarted = (lastParagraph = 0) => {
    return updateProgress({ status: 'STARTED', lastParagraph });
  };

  const markAsCompleted = () => {
    return updateProgress({ status: 'COMPLETED' });
  };

  const updateLastParagraph = (paragraph: number) => {
    return updateProgress({ lastParagraph: paragraph });
  };

  const deleteProgress = async () => {
    if (!storyId) {
      setError('Story ID is required');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.deleteProgress(storyId);

      if (response.success) {
        setProgress(null);
      } else {
        throw new Error(response.error?.message || 'Failed to delete progress');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete progress';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      fetchProgress(storyId);
    }
  }, [storyId]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    markAsStarted,
    markAsCompleted,
    updateLastParagraph,
    deleteProgress,
    refetch: () => storyId ? fetchProgress(storyId) : Promise.resolve(),
  };
}

// Hook for all user's reading progress
export function useAllReadingProgress(status?: 'STARTED' | 'COMPLETED') {
  const [progressList, setProgressList] = useState<ReadingProgressSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    total: number;
    started: number;
    completed: number;
  } | null>(null);

  const fetchAllProgress = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setProgressList([]);
      setLoading(false);
      setError(null);
      setMeta(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAllProgress(status);
      
      if (response.success) {
        setProgressList(response.data as ReadingProgressSummary[]);
        setMeta((response as any).meta || null);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch progress');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
      setProgressList([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProgress();
  }, [status]);

  return {
    progressList,
    loading,
    error,
    meta,
    refetch: fetchAllProgress,
  };
}

// Utility hook for progress calculations
export function useProgressCalculations(
  progress: ReadingProgress | null,
  totalParagraphs?: number
) {
  if (!progress || !totalParagraphs) {
    return {
      percentage: 0,
      isStarted: false,
      isCompleted: false,
      remainingParagraphs: totalParagraphs || 0,
    };
  }

  const currentParagraph = progress.lastParagraph || 0;
  const percentage = Math.round((currentParagraph / totalParagraphs) * 100);
  const isStarted = progress.status === 'STARTED' || progress.status === 'COMPLETED';
  const isCompleted = progress.status === 'COMPLETED';
  const remainingParagraphs = Math.max(0, totalParagraphs - currentParagraph);

  return {
    percentage,
    isStarted,
    isCompleted,
    remainingParagraphs,
    currentParagraph,
  };
}