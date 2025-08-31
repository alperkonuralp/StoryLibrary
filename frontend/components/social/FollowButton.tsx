'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Users, Loader2 } from 'lucide-react';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  authorId: string;
  authorName: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showCount?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void;
}

export function FollowButton({
  authorId,
  authorName,
  size = 'md',
  variant = 'default',
  showCount = false,
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    stats,
    loading,
    error,
    followAuthor,
    unfollowAuthor,
    refreshStats,
  } = useAuthorFollow(authorId);

  // Refresh stats when component mounts
  useEffect(() => {
    if (isAuthenticated && authorId) {
      refreshStats(authorId);
    }
  }, [isAuthenticated, authorId, refreshStats]);

  // Notify parent of follow state changes
  useEffect(() => {
    if (stats && onFollowChange) {
      onFollowChange(stats.isFollowing, stats.followersCount);
    }
  }, [stats, onFollowChange]);

  const handleFollowClick = async () => {
    if (!isAuthenticated) {
      // Could trigger login modal here
      alert('Please log in to follow authors');
      return;
    }

    if (!stats) return;

    setIsProcessing(true);
    
    try {
      let success = false;
      
      if (stats.isFollowing) {
        success = await unfollowAuthor(authorId);
      } else {
        success = await followAuthor(authorId);
      }

      if (success) {
        // Refresh stats to get updated counts
        await refreshStats(authorId);
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show button for current user
  if (user && user.id === authorId) {
    return null;
  }

  // Don't show button if not authenticated
  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => alert('Please log in to follow authors')}
        className={className}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Follow
      </Button>
    );
  }

  if (loading && !stats) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => refreshStats(authorId)}
        className={cn('text-red-600 border-red-300', className)}
      >
        Retry
      </Button>
    );
  }

  const isFollowing = stats?.isFollowing || false;
  const followersCount = stats?.followersCount || 0;
  const isLoading = loading || isProcessing;

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollowClick}
      disabled={isLoading}
      className={cn(
        isFollowing 
          ? 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400' 
          : '',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      
      {isLoading ? (
        'Processing...'
      ) : isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
      
      {showCount && followersCount > 0 && (
        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
          {followersCount}
        </span>
      )}
    </Button>
  );
}

// Compact version for use in lists
export function FollowButtonCompact({
  authorId,
  authorName,
  className = '',
  onFollowChange,
}: Pick<FollowButtonProps, 'authorId' | 'authorName' | 'className' | 'onFollowChange'>) {
  const { user, isAuthenticated } = useAuth();
  const {
    stats,
    loading,
    followAuthor,
    unfollowAuthor,
    refreshStats,
  } = useAuthorFollow(authorId);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authorId) {
      refreshStats(authorId);
    }
  }, [isAuthenticated, authorId, refreshStats]);

  useEffect(() => {
    if (stats && onFollowChange) {
      onFollowChange(stats.isFollowing, stats.followersCount);
    }
  }, [stats, onFollowChange]);

  const handleClick = async () => {
    if (!isAuthenticated || !stats) return;

    setIsProcessing(true);
    try {
      if (stats.isFollowing) {
        await unfollowAuthor(authorId);
      } else {
        await followAuthor(authorId);
      }
      await refreshStats(authorId);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated || (user && user.id === authorId)) {
    return null;
  }

  const isFollowing = stats?.isFollowing || false;
  const isLoading = loading || isProcessing;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center space-x-1 text-sm transition-colors',
        isFollowing 
          ? 'text-green-600 hover:text-green-700' 
          : 'text-blue-600 hover:text-blue-700',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={isFollowing ? `Unfollow ${authorName}` : `Follow ${authorName}`}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-3 w-3" />
      ) : (
        <UserPlus className="h-3 w-3" />
      )}
      <span>
        {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </span>
    </button>
  );
}