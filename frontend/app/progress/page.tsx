'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, CheckCircle, ArrowRight, Star, Trash2 } from 'lucide-react';
import { useAllReadingProgress, useProgressCalculations } from '@/hooks/useReadingProgress';
import { cn } from '@/lib/utils';
import Navigation from '@/components/Navigation';

interface ProgressCardProps {
  progress: any;
  onDelete?: (storyId: string) => void;
}

function ProgressCard({ progress, onDelete }: ProgressCardProps) {
  const totalParagraphs = progress.story.content?.en?.length || 1;
  const calculations = useProgressCalculations(progress, totalParagraphs);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(progress.storyId);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {progress.story.title.en || progress.story.title.tr || 'Untitled Story'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {progress.story.shortDescription?.en || progress.story.shortDescription?.tr || ''}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant={calculations.isCompleted ? "default" : "secondary"}>
              {calculations.isCompleted ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Reading
                </>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{calculations.percentage}%</span>
          </div>
          <Progress value={calculations.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Paragraph {calculations.currentParagraph}</span>
            <span>of {totalParagraphs}</span>
          </div>
        </div>

        {/* Story Details */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {progress.story.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{Number(progress.story.averageRating).toFixed(1)}</span>
              </div>
            )}
            {progress.story.publishedAt && (
              <span>{new Date(progress.story.publishedAt).getFullYear()}</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/stories/${progress.story.slug}`}>
              <BookOpen className="h-4 w-4 mr-2" />
              {calculations.isCompleted ? 'Read Again' : 'Continue Reading'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <div>Started: {new Date(progress.startedAt).toLocaleDateString()}</div>
          {progress.completedAt && (
            <div>Completed: {new Date(progress.completedAt).toLocaleDateString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'completed'>('all');
  
  const { 
    progressList: allProgress, 
    loading: allLoading, 
    error: allError,
    meta: allMeta,
    refetch: refetchAll
  } = useAllReadingProgress();
  
  const { 
    progressList: readingProgress, 
    loading: readingLoading, 
    error: readingError,
    refetch: refetchReading
  } = useAllReadingProgress('STARTED');
  
  const { 
    progressList: completedProgress, 
    loading: completedLoading, 
    error: completedError,
    refetch: refetchCompleted
  } = useAllReadingProgress('COMPLETED');

  const handleDeleteProgress = async (storyId: string) => {
    // This would call the delete API and refresh the lists
    // For now, we'll just refresh the data
    refetchAll();
    refetchReading();
    refetchCompleted();
  };

  const getTabData = (tab: string) => {
    switch (tab) {
      case 'reading':
        return {
          data: readingProgress,
          loading: readingLoading,
          error: readingError,
        };
      case 'completed':
        return {
          data: completedProgress,
          loading: completedLoading,
          error: completedError,
        };
      default:
        return {
          data: allProgress,
          loading: allLoading,
          error: allError,
        };
    }
  };

  const { data, loading, error } = getTabData(activeTab);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navigation />

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reading Progress</h1>
          <p className="text-gray-600">
            Track your reading journey and continue where you left off
          </p>
        </div>

        {/* Statistics Cards */}
        {allMeta && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Stories</p>
                    <p className="text-3xl font-bold text-gray-900">{allMeta.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Currently Reading</p>
                    <p className="text-3xl font-bold text-orange-600">{allMeta.started}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{allMeta.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="all">All ({allMeta?.total || 0})</TabsTrigger>
            <TabsTrigger value="reading">Reading ({allMeta?.started || 0})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({allMeta?.completed || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p className="text-sm">Failed to load reading progress</p>
                    <p className="text-xs text-gray-500 mt-1">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : data.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === 'reading' 
                        ? 'No stories in progress'
                        : activeTab === 'completed'
                        ? 'No completed stories'
                        : 'No reading progress yet'
                      }
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {activeTab === 'reading' 
                        ? 'Start reading a story to track your progress'
                        : activeTab === 'completed'
                        ? 'Complete a story to see it here'
                        : 'Start your reading journey with our collection of stories'
                      }
                    </p>
                    <Button asChild>
                      <Link href="/stories">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Stories
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((progress) => (
                  <ProgressCard
                    key={progress.id}
                    progress={progress}
                    onDelete={handleDeleteProgress}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}