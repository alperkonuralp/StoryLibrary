'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/hooks/useProgress';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStories } from '@/hooks/useStories';
import Navigation from '@/components/Navigation';
import { StoryCard } from '@/components/story/StoryCard';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { FollowingFeed } from '@/components/social/FollowingFeed';
import { OfflineManager } from '@/components/story/OfflineManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Bookmark, 
  TrendingUp,
  Star,
  PlayCircle,
  Target,
  Zap,
  Heart,
  Users,
  Sparkles,
  BookmarkCheck,
  UserPlus,
  Download
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks for data
  const { progressList, fetchProgress } = useProgress();
  const { bookmarks, fetchBookmarks } = useBookmarks();
  const { fetchStats } = useUserProfile();
  
  // Get recommendations - stories similar to what user has read
  const { stories: recommendedStories } = useStories({
    filters: { status: 'PUBLISHED', page: 1, limit: 6 }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
      fetchBookmarks(1, 5);
      fetchStats();
    }
  }, [isAuthenticated, fetchProgress, fetchBookmarks, fetchStats]);

  // Calculate statistics
  const dashboardStats = useMemo(() => {
    const completedStories = progressList.filter(p => p.status === 'COMPLETED');
    const totalReadingTime = progressList.reduce((acc, p) => acc + (p.readingTimeSeconds || 0), 0);
    const totalWordsRead = progressList.reduce((acc, p) => acc + (p.wordsRead || 0), 0);
    
    // Calculate reading streak (days with reading activity)
    const recentActivity = progressList
      .filter(p => p.lastReadAt)
      .map(p => new Date(p.lastReadAt!).toDateString());
    const uniqueDays = [...new Set(recentActivity)];
    
    return {
      totalStarted: progressList.length,
      totalCompleted: completedStories.length,
      totalBookmarks: bookmarks.length,
      totalReadingMinutes: Math.floor(totalReadingTime / 60),
      totalWordsRead,
      readingStreak: uniqueDays.length,
      averageCompletion: progressList.length > 0 
        ? Math.round(progressList.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) / progressList.length)
        : 0
    };
  }, [progressList, bookmarks]);

  // Get recommendations based on user's reading history
  const personalizedRecommendations = useMemo(() => {
    if (!recommendedStories || progressList.length === 0) return recommendedStories;

    // For now, just filter out stories the user has already read
    // TODO: Implement proper personalized recommendations when progress data includes category/author info
    return recommendedStories
      .filter(story => !progressList.some(p => p.storyId === story.id))
      .slice(0, 6);
  }, [recommendedStories, progressList]);

  const formatReadingTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container py-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.username || user?.email?.split('@')[0]}</h1>
              <p className="text-gray-600">Your personalized reading dashboard</p>
            </div>
          </div>

          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stories Started</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalStarted}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats.totalCompleted} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatReadingTime(dashboardStats.totalReadingMinutes)}</div>
                <p className="text-xs text-muted-foreground">
                  Total time spent reading
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Words Read</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalWordsRead.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Vocabulary exposure
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalBookmarks}</div>
                <p className="text-xs text-muted-foreground">
                  Stories saved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">For You</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="offline">Offline</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/stories">
                      <Button className="w-full justify-start">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Stories
                      </Button>
                    </Link>
                    <Link href="/reading-progress">
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Progress
                      </Button>
                    </Link>
                    <Link href="/bookmarks">
                      <Button variant="outline" className="w-full justify-start">
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                        My Bookmarks
                      </Button>
                    </Link>
                    <Link href="/social/following">
                      <Button variant="outline" className="w-full justify-start">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Social Feed
                      </Button>
                    </Link>
                    <Link href="/offline">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Offline Reading
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Reading Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressList.slice(0, 5).length > 0 ? (
                    <div className="space-y-4">
                      {progressList.slice(0, 5).map((progress) => (
                        <div key={progress.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <Link 
                              href={`/stories/${progress.story.slug}`}
                              className="font-medium hover:underline"
                            >
                              {progress.story.title?.en || progress.story.title?.tr || 'Untitled'}
                            </Link>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <Badge variant={progress.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {progress.status === 'COMPLETED' ? 'Completed' : 'Reading'}
                              </Badge>
                              <span>{Math.round(progress.completionPercentage || 0)}% complete</span>
                              {progress.lastReadAt && (
                                <span>{formatDate(progress.lastReadAt)}</span>
                              )}
                            </div>
                          </div>
                          <div className="w-16">
                            <Progress value={progress.completionPercentage || 0} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Reading Journey</h3>
                      <p className="text-gray-500 mb-4">
                        Begin reading stories to see your activity here.
                      </p>
                      <Link href="/stories">
                        <Button>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Browse Stories
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Recommended For You
                  </CardTitle>
                  <CardDescription>
                    Based on your reading history and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {personalizedRecommendations && personalizedRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {personalizedRecommendations.map((story) => (
                        <StoryCard
                          key={story.id}
                          story={story}
                          showDescription={true}
                          showStats={true}
                          showTags={false}
                          showProgress={false}
                          showBookmark={true}
                          className="h-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Start reading some stories to get personalized recommendations.
                      </p>
                      <Link href="/stories">
                        <Button>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Explore Stories
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Your Progress
                    </span>
                    <Link href="/reading-progress">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressList.length > 0 ? (
                    <div className="space-y-4">
                      {progressList.slice(0, 5).map((progress) => (
                        <ProgressIndicator
                          key={progress.id}
                          progress={progress}
                          variant="detailed"
                          showActions={true}
                          storyId={progress.storyId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Start reading stories to track your progress.
                      </p>
                      <Link href="/stories">
                        <Button>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Reading
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Your Bookmarks
                    </span>
                    <Link href="/bookmarks">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookmarks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookmarks.slice(0, 6).map((bookmark) => (
                        <div key={bookmark.id} className="border rounded-lg p-4">
                          <Link 
                            href={`/stories/${bookmark.story.slug}`}
                            className="font-medium hover:underline block mb-2"
                          >
                            {bookmark.story.title?.en || bookmark.story.title?.tr || 'Untitled'}
                          </Link>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {bookmark.story.shortDescription?.en || bookmark.story.shortDescription?.tr || ''}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            Saved {formatDate(bookmark.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookmarks Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Bookmark stories to save them for later reading.
                      </p>
                      <Link href="/stories">
                        <Button>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Find Stories
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Social Feed
                  </CardTitle>
                  <CardDescription>
                    Updates from authors you follow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FollowingFeed limit={10} showHeader={false} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Offline Tab */}
            <TabsContent value="offline" className="space-y-6">
              <OfflineManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}