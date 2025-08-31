'use client';

import { useState, useEffect } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Bookmark, 
  TrendingUp,
  Calendar,
  Star,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

// Analytics data interface
interface DashboardData {
  recentProgress: Array<{
    id: string;
    storyId: string;
    status: 'STARTED' | 'COMPLETED';
    lastParagraph?: number;
    totalParagraphs?: number;
    completionPercentage?: number;
    readingTimeSeconds?: number;
    lastReadAt?: string;
    story: {
      id: string;
      title: Record<string, string>;
      slug: string;
      shortDescription: Record<string, string>;
      averageRating?: number;
      categories: Array<{
        category: {
          name: Record<string, string>;
        };
      }>;
    };
  }>;
  monthlyStats: {
    storiesCompleted: number;
    totalReadingMinutes: number;
  };
  favoriteCategories: Array<{
    name: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { progressList, fetchProgress } = useProgress();
  const { bookmarks, fetchBookmarks } = useBookmarks();

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load dashboard data from analytics endpoint
      const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data);
        }
      }

      // Load user analytics
      const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/user?period=30`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success) {
          setAnalyticsData(analyticsResult.data);
        }
      }

      // Also load progress and bookmarks
      await fetchProgress();
      await fetchBookmarks(1, 5); // Just recent bookmarks

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatReadingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Reading Dashboard</h1>
        <p className="text-gray-600">Track your progress and discover new stories</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.summary?.totalStoriesCompleted || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.summary?.totalStoriesStarted || 0} started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.summary?.totalReadingTimeMinutes || 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.summary?.currentStreak || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.summary?.bookmarksCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Saved stories
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reading Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlayCircle className="mr-2 h-5 w-5" />
              Continue Reading
            </CardTitle>
            <CardDescription>
              Pick up where you left off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentProgress?.slice(0, 3).map((progress) => (
                <div key={progress.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/stories/${progress.story.slug}`}>
                      <h4 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                        {progress.story.title.en || progress.story.title.tr}
                      </h4>
                    </Link>
                    <p className="text-sm text-gray-500 truncate">
                      {progress.story.shortDescription.en || progress.story.shortDescription.tr}
                    </p>
                    <div className="flex items-center mt-2">
                      {progress.status === 'COMPLETED' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={progress.completionPercentage || 0} 
                            className="w-20 h-2" 
                          />
                          <span className="text-xs text-gray-500">
                            {Math.round(progress.completionPercentage || 0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {progress.lastReadAt && (
                      <p className="text-xs text-gray-500">
                        {formatDate(progress.lastReadAt)}
                      </p>
                    )}
                    {progress.story.averageRating && (
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 ml-1">
                          {Number(progress.story.averageRating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p>Start reading stories to see your progress here</p>
                  <Link href="/stories">
                    <Button className="mt-4">Browse Stories</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reading Goals & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              This Month's Progress
            </CardTitle>
            <CardDescription>
              Your reading goals and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Monthly Reading Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Stories Completed</span>
                  <span className="text-sm text-gray-500">
                    {dashboardData?.monthlyStats?.storiesCompleted || 0} / 5
                  </span>
                </div>
                <Progress 
                  value={((dashboardData?.monthlyStats?.storiesCompleted || 0) / 5) * 100} 
                  className="mb-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Reading Time</span>
                  <span className="text-sm text-gray-500">
                    {dashboardData?.monthlyStats?.totalReadingMinutes || 0} / 300 min
                  </span>
                </div>
                <Progress 
                  value={((dashboardData?.monthlyStats?.totalReadingMinutes || 0) / 300) * 100} 
                  className="mb-2"
                />
              </div>

              {/* Favorite Categories */}
              <div>
                <h4 className="text-sm font-medium mb-3">Favorite Categories</h4>
                <div className="space-y-2">
                  {dashboardData?.favoriteCategories?.slice(0, 3).map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{category.name}</span>
                      <Badge variant="secondary">{category.count} stories</Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">Read stories to discover your preferences</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookmarks */}
      {bookmarks.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Bookmark className="mr-2 h-5 w-5" />
                  Recent Bookmarks
                </CardTitle>
                <CardDescription>
                  Your saved stories
                </CardDescription>
              </div>
              <Link href="/bookmarks">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.slice(0, 3).map((bookmark) => (
                <div key={bookmark.id} className="p-4 rounded-lg border hover:border-blue-300 transition-colors">
                  <Link href={`/stories/${bookmark.story.slug}`}>
                    <h4 className="font-medium text-gray-900 hover:text-blue-600 mb-2">
                      {bookmark.story.title.en || bookmark.story.title.tr}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {bookmark.story.shortDescription.en || bookmark.story.shortDescription.tr}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Saved {formatDate(bookmark.createdAt)}</span>
                    {bookmark.story.averageRating && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="ml-1">{Number(bookmark.story.averageRating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}