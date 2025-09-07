import { useState, useEffect, useCallback } from 'react';

// Types
interface ReadingProgress {
  id: string;
  userId: string;
  storyId: string;
  status: 'STARTED' | 'COMPLETED';
  lastParagraph?: number;
  totalParagraphs?: number;
  completionPercentage?: number;
  readingTimeSeconds?: number;
  wordsRead?: number;
  language?: 'en' | 'tr';
  startedAt: string;
  completedAt?: string;
  lastReadAt?: string;
  story: {
    id: string;
    title: Record<string, string>;
    slug: string;
  };
}

interface UpdateProgressData {
  storyId: string;
  lastParagraph?: number;
  totalParagraphs?: number;
  completionPercentage?: number;
  readingTimeSeconds?: number;
  wordsRead?: number;
  language?: 'en' | 'tr';
  status?: 'STARTED' | 'COMPLETED';
}

// Progress hook
export const useProgress = () => {
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all user progress
  const fetchProgress = useCallback(async (status?: 'STARTED' | 'COMPLETED') => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setProgressList([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/progress`);
      if (status) url.searchParams.append('status', status);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch progress');
      }

      if (data.success) {
        setProgressList(data.data || []);
        return { data: data.data, meta: data.meta };
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching progress:', err);
      return null;
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Get progress for specific story
  const getStoryProgress = useCallback(async (storyId: string): Promise<ReadingProgress | null> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return null;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/progress/${storyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch story progress');
      }

      return data.success ? data.data : null;
    } catch (err: any) {
      console.error('Error fetching story progress:', err);
      return null;
    }
  }, []);

  // Update reading progress
  const updateProgress = useCallback(async (progressData: UpdateProgressData): Promise<ReadingProgress | null> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return null;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(progressData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update progress');
      }

      if (data.success) {
        // Update local state
        setProgressList(prev => {
          const existingIndex = prev.findIndex(p => p.storyId === progressData.storyId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = data.data;
            return updated;
          } else {
            return [...prev, data.data];
          }
        });

        return data.data;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating progress:', err);
      return null;
    }
    return null;
  }, []);

  // Delete reading progress
  const deleteProgress = useCallback(async (storyId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return false;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/progress/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete progress');
      }

      if (data.success) {
        // Remove from local state
        setProgressList(prev => prev.filter(p => p.storyId !== storyId));
        return true;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting progress:', err);
    }
    return false;
  }, []);

  return {
    progressList,
    loading,
    error,
    fetchProgress,
    getStoryProgress,
    updateProgress,
    deleteProgress,
  };
};

// Story-specific progress hook
export const useStoryProgress = (storyId: string) => {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const { getStoryProgress, updateProgress } = useProgress();

  // Load progress on mount
  useEffect(() => {
    if (storyId) {
      loadProgress();
    }
  }, [storyId]);

  const loadProgress = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setProgress(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const data = await getStoryProgress(storyId);
    setProgress(data);
    setLoading(false);
  };

  const updateStoryProgress = async (progressData: Partial<UpdateProgressData>) => {
    const updated = await updateProgress({
      storyId,
      ...progressData,
    });
    if (updated) {
      setProgress(updated);
    }
    return updated;
  };

  // Helper to calculate completion percentage
  const calculateCompletion = useCallback((currentParagraph: number, totalParagraphs: number): number => {
    if (totalParagraphs <= 0) return 0;
    return Math.round((currentParagraph / totalParagraphs) * 100);
  }, []);

  // Helper to track reading session
  const startReadingSession = useCallback(() => {
    return {
      startTime: Date.now(),
      startParagraph: progress?.lastParagraph || 0,
    };
  }, [progress]);

  const endReadingSession = useCallback(async (
    session: { startTime: number; startParagraph: number },
    currentParagraph: number,
    totalParagraphs: number,
    language: 'en' | 'tr',
    wordsRead: number
  ) => {
    const readingTime = Math.round((Date.now() - session.startTime) / 1000);
    const completionPercentage = calculateCompletion(currentParagraph, totalParagraphs);

    await updateStoryProgress({
      lastParagraph: currentParagraph,
      totalParagraphs,
      completionPercentage,
      readingTimeSeconds: (progress?.readingTimeSeconds || 0) + readingTime,
      wordsRead: (progress?.wordsRead || 0) + wordsRead,
      language,
      status: completionPercentage >= 100 ? 'COMPLETED' : 'STARTED',
    });
  }, [progress, updateStoryProgress, calculateCompletion]);

  return {
    progress,
    loading,
    loadProgress,
    updateStoryProgress,
    calculateCompletion,
    startReadingSession,
    endReadingSession,
  };
};