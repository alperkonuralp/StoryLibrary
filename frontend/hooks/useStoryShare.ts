import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface ShareData {
  url: string;
  title: string;
  text: string;
}

interface ShareStats {
  shareCount: number;
  platforms: {
    twitter: number;
    facebook: number;
    whatsapp: number;
    telegram: number;
    email: number;
    copy: number;
  };
}

interface UseStoryShareReturn {
  loading: boolean;
  error: string | null;
  shareToTwitter: (data: ShareData) => Promise<boolean>;
  shareToFacebook: (data: ShareData) => Promise<boolean>;
  shareToWhatsApp: (data: ShareData) => Promise<boolean>;
  shareToTelegram: (data: ShareData) => Promise<boolean>;
  shareViaEmail: (data: ShareData) => Promise<boolean>;
  copyToClipboard: (url: string) => Promise<boolean>;
  shareWithNativeAPI: (data: ShareData) => Promise<boolean>;
  trackShare: (storyId: string, platform: string) => Promise<void>;
  getShareStats: (storyId: string) => Promise<ShareStats | null>;
  generateShareUrl: (storySlug: string) => string;
  generateShareText: (title: string, description: string) => string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const useStoryShare = (): UseStoryShareReturn => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackShare = useCallback(async (storyId: string, platform: string) => {
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/stories/${storyId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });
    } catch (error) {
      // Silently fail for analytics
      console.warn('Failed to track share:', error);
    }
  }, [token]);

  const shareToTwitter = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const tweetText = `${data.text}\n\n${data.url}\n\n#StoryLibrary #BilingualStories`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      return true;
    } catch (err) {
      setError('Failed to share to Twitter');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const shareToFacebook = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}&quote=${encodeURIComponent(data.text)}`;
      
      window.open(facebookUrl, '_blank', 'width=555,height=400');
      return true;
    } catch (err) {
      setError('Failed to share to Facebook');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const shareToWhatsApp = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const whatsappText = `${data.title}\n\n${data.text}\n\n${data.url}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      
      window.open(whatsappUrl, '_blank');
      return true;
    } catch (err) {
      setError('Failed to share to WhatsApp');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const shareToTelegram = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const telegramText = `${data.title}\n\n${data.text}`;
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(telegramText)}`;
      
      window.open(telegramUrl, '_blank');
      return true;
    } catch (err) {
      setError('Failed to share to Telegram');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const shareViaEmail = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const subject = `Check out this story: ${data.title}`;
      const body = `Hi there!\n\nI thought you might enjoy this story:\n\n${data.title}\n${data.text}\n\nRead it here: ${data.url}\n\nBest regards!`;
      
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = emailUrl;
      return true;
    } catch (err) {
      setError('Failed to share via email');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (url: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      return true;
    } catch (err) {
      setError('Failed to copy to clipboard');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const shareWithNativeAPI = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        return true;
      } else {
        // Fallback to copy to clipboard
        const success = await copyToClipboard(data.url);
        if (success) {
          // You might want to show a toast notification here
          console.log('Link copied to clipboard!');
        }
        return success;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled the share
        return false;
      }
      setError('Failed to share');
      return false;
    } finally {
      setLoading(false);
    }
  }, [copyToClipboard]);

  const getShareStats = useCallback(async (storyId: string): Promise<ShareStats | null> => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/share-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get share stats: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get share stats');
      }
    } catch (err) {
      console.warn('Failed to load share stats:', err);
      return null;
    }
  }, [token]);

  const generateShareUrl = useCallback((storySlug: string): string => {
    return `${BASE_URL}/stories/${storySlug}?utm_source=share&utm_medium=social&utm_campaign=story_share`;
  }, []);

  const generateShareText = useCallback((title: string, description: string): string => {
    const truncatedDesc = description.length > 100 
      ? `${description.substring(0, 100)}...`
      : description;
    
    return `📖 ${title}\n\n${truncatedDesc}\n\n#StoryLibrary #Reading`;
  }, []);

  return {
    loading,
    error,
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    shareToTelegram,
    shareViaEmail,
    copyToClipboard,
    shareWithNativeAPI,
    trackShare,
    getShareStats,
    generateShareUrl,
    generateShareText,
  };
};