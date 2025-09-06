'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/hooks/useProgress';
import { BookOpen, Clock, Target, TrendingUp, CheckCircle } from 'lucide-react';

export default function ReadingProgressPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { progressList, loading, error, fetchProgress, deleteProgress } = useProgress();
  const [activeTab, setActiveTab] = useState('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load progress on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
    }
  }, [isAuthenticated, fetchProgress]);

  const handleRemoveProgress = async (storyId: string) => {
    if (confirm('Are you sure you want to remove this reading progress?')) {
      await deleteProgress(storyId);
    }
  };

  const handleContinueReading = (storyId: string) => {
    const story = progressList.find(p => p.storyId === storyId)?.story;
    if (story?.slug) {
      router.push(`/stories/${story.slug}`);
    }
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

  const startedStories = progressList.filter(p => p.status === 'STARTED');
  const completedStories = progressList.filter(p => p.status === 'COMPLETED');
  
  // Calculate statistics
  const totalReadingTime = progressList.reduce((acc, p) => acc + (p.readingTimeSeconds || 0), 0);
  const totalWordsRead = progressList.reduce((acc, p) => acc + (p.wordsRead || 0), 0);
  const averageCompletion = progressList.length > 0 
    ? Math.round(progressList.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) / progressList.length)
    : 0;

  const formatReadingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container py-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">Reading Progress</h1>
              <p className="text-gray-600">Track your learning journey through stories</p>
            </div>
            <Link href="/stories">
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Stories
              </Button>
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stories Read</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedStories.length}</div>
                <p className="text-xs text-muted-foreground">
                  {startedStories.length} in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatReadingTime(totalReadingTime)}</div>
                <p className="text-xs text-muted-foreground">
                  Total time spent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Words Read</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWordsRead.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Vocabulary exposure
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageCompletion}%</div>
                <p className="text-xs text-muted-foreground">
                  Across all stories
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stories</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p>Loading your progress...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Error: {error}</p>
                </div>
              ) : progressList.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reading progress yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start reading stories to track your language learning progress.
                  </p>
                  <Link href="/stories">
                    <Button>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Stories
                    </Button>
                  </Link>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All ({progressList.length})</TabsTrigger>
                    <TabsTrigger value="reading">Reading ({startedStories.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedStories.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    <div className="space-y-4">
                      {progressList.map((progress) => (
                        <div key={progress.id} className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Link 
                                href={`/stories/${progress.story.slug}`}
                                className="font-medium hover:underline"
                              >
                                {progress.story.title?.en || progress.story.title?.tr || 'Untitled'}
                              </Link>
                              <Badge variant={progress.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {progress.status === 'COMPLETED' ? 'Completed' : 'Reading'}
                              </Badge>
                            </div>
                            <ProgressIndicator 
                              progress={progress}
                              variant="compact"
                            />
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {progress.status !== 'COMPLETED' && (
                              <Button 
                                size="sm"
                                onClick={() => handleContinueReading(progress.storyId)}
                              >
                                Continue
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveProgress(progress.storyId)}
                              className="text-red-500 hover:text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="reading" className="mt-6">
                    <div className="space-y-4">
                      {startedStories.map((progress) => (
                        <div key={progress.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Link 
                              href={`/stories/${progress.story.slug}`}
                              className="font-medium hover:underline text-lg"
                            >
                              {progress.story.title?.en || progress.story.title?.tr || 'Untitled'}
                            </Link>
                            <Button onClick={() => handleContinueReading(progress.storyId)}>
                              Continue Reading
                            </Button>
                          </div>
                          <ProgressIndicator 
                            progress={progress}
                            variant="detailed"
                            showActions={true}
                            storyId={progress.storyId}
                            onRemove={handleRemoveProgress}
                            onContinue={handleContinueReading}
                          />
                        </div>
                      ))}
                      {startedStories.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No stories in progress</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="completed" className="mt-6">
                    <div className="space-y-4">
                      {completedStories.map((progress) => (
                        <div key={progress.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Link 
                              href={`/stories/${progress.story.slug}`}
                              className="font-medium hover:underline text-lg"
                            >
                              {progress.story.title?.en || progress.story.title?.tr || 'Untitled'}
                            </Link>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Completed</span>
                            </div>
                          </div>
                          <ProgressIndicator 
                            progress={progress}
                            variant="detailed"
                            showActions={true}
                            storyId={progress.storyId}
                            onRemove={handleRemoveProgress}
                          />
                        </div>
                      ))}
                      {completedStories.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No completed stories yet</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}