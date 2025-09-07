'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  BookOpen,
  Edit3,
  Eye,
  TrendingUp,
  Users,
  Star,
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Award,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DraftsList } from '@/components/editor/DraftsList';

interface AuthorStats {
  totalStories: number;
  publishedStories: number;
  draftStories: number;
  archivedStories: number;
  totalViews: number;
  totalRatings: number;
  averageRating: number;
  totalBookmarks: number;
  recentActivity: number;
}

interface RecentStory {
  id: string;
  title: Record<string, string>;
  status: string;
  updatedAt: string;
  viewCount: number;
  ratingCount: number;
  averageRating: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  target?: number;
}

export default function AuthorDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has author/editor/admin role
    if (user && !['author', 'editor', 'admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch author statistics
      const statsResponse = await fetch('/api/authors/stats', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent stories
      const storiesResponse = await fetch('/api/stories?author=mine&limit=5&sort=updatedAt', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        setRecentStories(storiesData.stories || []);
      }

      // Mock achievements data (could be fetched from API)
      setAchievements([
        {
          id: '1',
          title: 'First Story',
          description: 'Publish your first story',
          icon: '📝',
          earned: true,
          earnedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Rising Author',
          description: 'Publish 5 stories',
          icon: '📚',
          earned: false,
          progress: 2,
          target: 5,
        },
        {
          id: '3',
          title: 'Reader\'s Choice',
          description: 'Get 100 total ratings',
          icon: '⭐',
          earned: false,
          progress: 45,
          target: 100,
        },
        {
          id: '4',
          title: 'Popular Author',
          description: 'Get 1000 total views',
          icon: '👁️',
          earned: false,
          progress: 750,
          target: 1000,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!['author', 'editor', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You need author privileges to access this dashboard.
            </p>
            <Button asChild>
              <Link href="/dashboard">Go to User Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Author Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user.profile?.firstName || user.username || user.email}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/editor">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Manage Stories
                </Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/editor?action=new">
                  <Plus className="h-4 w-4 mr-2" />
                  Write New Story
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.publishedStories}
                    </div>
                    <div className="text-sm text-gray-600">Published Stories</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Eye className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalViews.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.draftStories}
                    </div>
                    <div className="text-sm text-gray-600">Drafts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Stories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentStories.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No stories yet</p>
                      <Button asChild size="sm">
                        <Link href="/editor?action=new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Story
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentStories.map((story) => (
                        <div key={story.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 line-clamp-1">
                                {story.title.en || story.title.tr || 'Untitled'}
                              </h4>
                              <Badge className={getStatusColor(story.status)}>
                                {getStatusIcon(story.status)}
                                <span className="ml-1">{story.status}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Updated {new Date(story.updatedAt).toLocaleDateString()}</span>
                              {story.viewCount > 0 && (
                                <span>{story.viewCount} views</span>
                              )}
                              {story.ratingCount > 0 && (
                                <span>{story.averageRating.toFixed(1)}★ ({story.ratingCount})</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/editor?action=edit&id=${story.id}`}>
                                <Edit3 className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full justify-start" size="lg">
                      <Link href="/editor?action=new">
                        <Plus className="h-5 w-5 mr-3" />
                        Write New Story
                      </Link>
                    </Button>

                    <Button variant="outline" asChild className="w-full justify-start" size="lg">
                      <Link href="/editor">
                        <BookOpen className="h-5 w-5 mr-3" />
                        Manage Stories
                      </Link>
                    </Button>

                    <Button variant="outline" asChild className="w-full justify-start" size="lg">
                      <Link href="/profile">
                        <Users className="h-5 w-5 mr-3" />
                        Update Profile
                      </Link>
                    </Button>

                    <Button variant="outline" asChild className="w-full justify-start" size="lg">
                      <Link href="/stories">
                        <Eye className="h-5 w-5 mr-3" />
                        Browse Stories
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Writing Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Writing Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">📚 Bilingual Content</h4>
                    <p className="text-sm text-gray-600">
                      Write in both English and Turkish to reach a wider audience. Our bilingual reader helps language learners.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">🎯 Choose Categories</h4>
                    <p className="text-sm text-gray-600">
                      Proper categorization helps readers discover your stories. Select relevant categories and tags.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">✨ Engaging Descriptions</h4>
                    <p className="text-sm text-gray-600">
                      Write compelling short descriptions that give readers a taste of your story without spoilers.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">📝 Regular Updates</h4>
                    <p className="text-sm text-gray-600">
                      Keep your audience engaged by publishing regularly. Drafts are saved automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Your Drafts
                  </div>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <Link href="/editor?action=new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Draft
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DraftsList showActions={true} showCreateButton={true} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Story Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Total Stories</span>
                        <span className="text-xl font-bold">{stats.totalStories}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Published</span>
                        <span className="text-xl font-bold text-green-600">{stats.publishedStories}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">Drafts</span>
                        <span className="text-xl font-bold text-yellow-600">{stats.draftStories}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Total Views</span>
                        <span className="text-xl font-bold text-blue-600">{stats.totalViews}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Total Ratings</span>
                        <span className="text-xl font-bold text-purple-600">{stats.totalRatings}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No analytics data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Reading Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="space-y-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.totalBookmarks}
                          </div>
                          <div className="text-xs text-gray-600">Bookmarks</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {Math.round((stats.totalRatings / Math.max(stats.totalViews, 1)) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">Rating Rate</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No metrics data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Your Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`p-4 border rounded-lg ${
                        achievement.earned 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className={`font-medium mb-1 ${
                            achievement.earned ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {achievement.title}
                            {achievement.earned && (
                              <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600" />
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {achievement.description}
                          </p>
                          
                          {!achievement.earned && achievement.progress !== undefined && achievement.target && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.target}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${(achievement.progress / achievement.target) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {achievement.earned && achievement.earnedAt && (
                            <p className="text-xs text-green-600 mt-2">
                              Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}