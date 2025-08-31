'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OfflineStory {
  id: string;
  slug: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  content: Record<string, string[]>;
  authors: Array<{
    author: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  }>;
  categories: Array<{
    category: {
      id: string;
      name: Record<string, string>;
      slug: string;
    };
  }>;
  tags: Array<{
    tag: {
      id: string;
      name: Record<string, string>;
      color: string;
      slug: string;
    };
  }>;
  averageRating?: number;
  ratingCount?: number;
  publishedAt: string;
  downloadedAt: string;
  lastAccessedAt?: string;
  estimatedSize: number; // in bytes
}

interface OfflineReadingState {
  stories: OfflineStory[];
  totalSize: number;
  maxSize: number; // 50MB default
  downloading: Set<string>;
  isOnline: boolean;
}

export function useOfflineReading() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<OfflineReadingState>({
    stories: [],
    totalSize: 0,
    maxSize: 50 * 1024 * 1024, // 50MB
    downloading: new Set(),
    isOnline: navigator.onLine
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline stories from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      loadOfflineStories();
    }
  }, [isAuthenticated, user]);

  const loadOfflineStories = useCallback(() => {
    try {
      const stored = localStorage.getItem(`offlineStories_${user?.id}`);
      if (stored) {
        const stories: OfflineStory[] = JSON.parse(stored);
        const totalSize = stories.reduce((sum, story) => sum + story.estimatedSize, 0);
        setState(prev => ({
          ...prev,
          stories,
          totalSize
        }));
      }
    } catch (err) {
      console.error('Failed to load offline stories:', err);
      setError('Failed to load offline stories');
    }
  }, [user?.id]);

  const saveOfflineStories = useCallback((stories: OfflineStory[]) => {
    try {
      localStorage.setItem(`offlineStories_${user?.id}`, JSON.stringify(stories));
      const totalSize = stories.reduce((sum, story) => sum + story.estimatedSize, 0);
      setState(prev => ({
        ...prev,
        stories,
        totalSize
      }));
    } catch (err) {
      console.error('Failed to save offline stories:', err);
      setError('Failed to save offline stories');
    }
  }, [user?.id]);

  const downloadStory = useCallback(async (storyId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('Please log in to download stories');
      return false;
    }

    if (state.downloading.has(storyId)) {
      return false;
    }

    try {
      setState(prev => ({
        ...prev,
        downloading: new Set([...prev.downloading, storyId])
      }));
      setError(null);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download story: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to download story');
      }

      const story = data.data;
      
      // Calculate estimated size
      const contentSize = JSON.stringify(story.content).length * 2; // UTF-16
      const metadataSize = JSON.stringify({
        ...story,
        content: undefined
      }).length * 2;
      const estimatedSize = contentSize + metadataSize;

      // Check if there's enough space
      if (state.totalSize + estimatedSize > state.maxSize) {
        throw new Error('Not enough storage space. Please remove some offline stories first.');
      }

      const offlineStory: OfflineStory = {
        id: story.id,
        slug: story.slug,
        title: story.title,
        shortDescription: story.shortDescription,
        content: story.content,
        authors: story.authors || [],
        categories: story.categories || [],
        tags: story.tags || [],
        averageRating: story.averageRating,
        ratingCount: story.ratingCount,
        publishedAt: story.publishedAt,
        downloadedAt: new Date().toISOString(),
        estimatedSize
      };

      const updatedStories = [...state.stories.filter(s => s.id !== storyId), offlineStory];
      saveOfflineStories(updatedStories);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download story');
      return false;
    } finally {
      setState(prev => ({
        ...prev,
        downloading: new Set([...prev.downloading].filter(id => id !== storyId))
      }));
    }
  }, [isAuthenticated, user, state.downloading, state.stories, state.totalSize, state.maxSize, saveOfflineStories]);

  const removeStory = useCallback((storyId: string) => {
    const updatedStories = state.stories.filter(s => s.id !== storyId);
    saveOfflineStories(updatedStories);
  }, [state.stories, saveOfflineStories]);

  const isStoryDownloaded = useCallback((storyId: string): boolean => {
    return state.stories.some(s => s.id === storyId);
  }, [state.stories]);

  const getOfflineStory = useCallback((storyId: string): OfflineStory | null => {
    const story = state.stories.find(s => s.id === storyId);
    if (story) {
      // Update last accessed time
      const updatedStory = {
        ...story,
        lastAccessedAt: new Date().toISOString()
      };
      const updatedStories = state.stories.map(s => 
        s.id === storyId ? updatedStory : s
      );
      saveOfflineStories(updatedStories);
      return updatedStory;
    }
    return null;
  }, [state.stories, saveOfflineStories]);

  const clearAllOfflineStories = useCallback(() => {
    try {
      localStorage.removeItem(`offlineStories_${user?.id}`);
      setState(prev => ({
        ...prev,
        stories: [],
        totalSize: 0
      }));
    } catch (err) {
      setError('Failed to clear offline stories');
    }
  }, [user?.id]);

  const getStorageStats = useCallback(() => {
    return {
      used: state.totalSize,
      available: state.maxSize - state.totalSize,
      total: state.maxSize,
      usedPercentage: (state.totalSize / state.maxSize) * 100,
      storiesCount: state.stories.length,
      formattedUsed: formatBytes(state.totalSize),
      formattedAvailable: formatBytes(state.maxSize - state.totalSize),
      formattedTotal: formatBytes(state.maxSize)
    };
  }, [state.totalSize, state.maxSize, state.stories.length]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return {
    offlineStories: state.stories,
    isOnline: state.isOnline,
    downloading: state.downloading,
    loading,
    error,
    downloadStory,
    removeStory,
    isStoryDownloaded,
    getOfflineStory,
    clearAllOfflineStories,
    storageStats: getStorageStats(),
    setMaxSize: (size: number) => setState(prev => ({ ...prev, maxSize: size }))
  };
}