'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  User, 
  Eye, 
  Star, 
  Clock,
  TrendingUp,
  Users,
  RefreshCw,
  Heart,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { StarRating } from '../story/StarRating';
import { FollowButtonCompact } from './FollowButton';
import { ShareButtonCompact } from './ShareButton';

interface FeedItem {
  id: string;
  type: 'story_published' | 'story_updated' | 'author_followed';
  timestamp: string;
  author: {
    id: string;
    name: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  story?: {
    id: string;
    slug: string;
    title: Record<string, string>;
    shortDescription: Record<string, string>;
    publishedAt: string;
    averageRating: number;
    ratingCount: number;
    viewCount: number;
    categories: Array<{
      category: {
        id: string;
        name: Record<string, string>;
      };
    }>;
  };
  targetAuthor?: {
    id: string;
    name: string;
  };
}

interface FollowingFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function FollowingFeed({
  limit = 10,
  showHeader = true,
  className = '',
}: FollowingFeedProps) {
  const { user, token, isAuthenticated } = useAuth();
  const { following, loadFollowing } = useAuthorFollow();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFeed();
      loadFollowing(); // Load following list for context
    }
  }, [isAuthenticated, user]);

  const loadFeed = async (isRefresh = false) => {
    if (!token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(
        `${API_BASE_URL}/users/following-feed?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load feed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFeedItems(data.data.items || []);
      } else {
        throw new Error(data.message || 'Failed to load feed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFeed(true);
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getAuthorDisplayName = (author: FeedItem['author']) => {
    if (author.profile?.firstName && author.profile?.lastName) {
      return `${author.profile.firstName} ${author.profile.lastName}`;
    }
    return author.name;
  };

  const renderFeedItem = (item: FeedItem) => {
    const authorName = getAuthorDisplayName(item.author);

    switch (item.type) {
      case 'story_published':
        return (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Activity header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      <Link 
                        href={`/authors/${item.author.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {authorName}
                      </Link>
                      {' '}published a new story
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>

                  {/* Story content */}
                  {item.story && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <Link 
                        href={`/stories/${item.story.slug}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {item.story.title.en || item.story.title.tr}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {item.story.shortDescription.en || item.story.shortDescription.tr}
                        </p>
                      </Link>

                      {/* Story metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {item.story.averageRating > 0 && (
                            <div className="flex items-center space-x-1">
                              <StarRating rating={item.story.averageRating} readonly size="sm" />
                              <span>({item.story.ratingCount})</span>
                            </div>
                          )}
                          
                          {item.story.viewCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{item.story.viewCount}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatTimeAgo(item.story.publishedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <ShareButtonCompact
                            storyId={item.story.id}
                            storySlug={item.story.slug}
                            title={item.story.title.en || item.story.title.tr}
                            description={item.story.shortDescription.en || item.story.shortDescription.tr}
                          />
                          <Link
                            href={`/stories/${item.story.slug}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Read Story →
                          </Link>
                        </div>
                      </div>

                      {/* Categories */}
                      {item.story.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.story.categories.slice(0, 3).map(({ category }) => (
                            <Badge key={category.id} variant="outline" className="text-xs">
                              {category.name.en || category.name.tr}
                            </Badge>
                          ))}
                          {item.story.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.story.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social actions */}
                  <div className="flex items-center space-x-4 text-sm">
                    <FollowButtonCompact
                      authorId={item.author.id}
                      authorName={authorName}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'author_followed':
        return (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-600">
                    <Link 
                      href={`/authors/${item.author.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {authorName}
                    </Link>
                    {' '}followed{' '}
                    <Link 
                      href={`/authors/${item.targetAuthor?.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {item.targetAuthor?.name}
                    </Link>
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Follow Authors to See Updates
          </h3>
          <p className="text-gray-600 mb-4">
            Log in and follow your favorite authors to see their latest stories here.
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Following Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading feed...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Following Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadFeed()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedItems.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Following Feed
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Updates Yet
            </h3>
            <p className="text-gray-600 mb-4">
              {following.length === 0 
                ? "You're not following any authors yet. Follow some authors to see their updates here!"
                : "No recent activity from the authors you follow. Check back later!"
              }
            </p>
            <div className="flex justify-center space-x-2">
              <Button asChild variant="outline">
                <Link href="/authors">Discover Authors</Link>
              </Button>
              <Button asChild>
                <Link href="/stories">Browse Stories</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Following Feed
                <Badge variant="secondary" className="ml-2">
                  {feedItems.length}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="space-y-4">
        {feedItems.map(renderFeedItem)}
      </div>

      {feedItems.length >= limit && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => loadFeed()}>
            Load More Updates
          </Button>
        </div>
      )}
    </div>
  );
}