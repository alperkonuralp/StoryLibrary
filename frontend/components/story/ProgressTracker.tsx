'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, BookOpen, Trash2 } from 'lucide-react';
import { useStoryProgress, useProgressCalculations } from '@/hooks/useReadingProgress';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  storyId: string;
  totalParagraphs: number;
  currentParagraph?: number;
  onProgressUpdate?: (paragraph: number) => void;
  className?: string;
}

export function ProgressTracker({ 
  storyId, 
  totalParagraphs, 
  currentParagraph = 0,
  onProgressUpdate,
  className 
}: ProgressTrackerProps) {
  const { isAuthenticated } = useAuth();
  const {
    progress,
    loading,
    error,
    markAsStarted,
    markAsCompleted,
    updateLastParagraph,
    deleteProgress,
  } = useStoryProgress(storyId);

  const calculations = useProgressCalculations(progress, totalParagraphs);
  const [localProgress, setLocalProgress] = useState(currentParagraph);

  // Update local progress when currentParagraph prop changes
  useEffect(() => {
    setLocalProgress(currentParagraph);
  }, [currentParagraph]);

  // Update backend progress when local progress changes
  useEffect(() => {
    if (localProgress > 0 && localProgress !== (progress?.lastParagraph || 0)) {
      const timeoutId = setTimeout(async () => {
        try {
          if (!progress) {
            await markAsStarted(localProgress);
          } else {
            await updateLastParagraph(localProgress);
          }
        } catch (err) {
          console.error('Failed to update progress:', err);
        }
      }, 1000); // Debounce updates

      return () => clearTimeout(timeoutId);
    }
  }, [localProgress, progress, markAsStarted, updateLastParagraph]);

  const handleStart = async () => {
    try {
      await markAsStarted(localProgress);
    } catch (err) {
      console.error('Failed to start reading:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await markAsCompleted();
      onProgressUpdate?.(totalParagraphs);
    } catch (err) {
      console.error('Failed to complete reading:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProgress();
      setLocalProgress(0);
      onProgressUpdate?.(0);
    } catch (err) {
      console.error('Failed to delete progress:', err);
    }
  };

  const updateProgress = (paragraph: number) => {
    setLocalProgress(paragraph);
    onProgressUpdate?.(paragraph);
  };

  // Hide error message if user is not authenticated - progress is expected to fail for anonymous users
  if (error && isAuthenticated) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="text-sm">Failed to load progress</p>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Don't show progress tracker for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          Reading Progress
          {calculations.isCompleted && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
          {calculations.isStarted && !calculations.isCompleted && (
            <Badge variant="outline" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              Reading
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{calculations.percentage}%</span>
          </div>
          <Progress value={calculations.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Paragraph {calculations.currentParagraph}</span>
            <span>of {totalParagraphs}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!calculations.isStarted ? (
            <Button 
              onClick={handleStart} 
              disabled={loading}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Start Reading
            </Button>
          ) : (
            <>
              {!calculations.isCompleted ? (
                <Button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => updateProgress(0)}
                  disabled={loading}
                  className="flex-1"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read Again
                </Button>
              )}
              <Button 
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Progress Details */}
        {progress && (
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <div>Started: {new Date(progress.startedAt).toLocaleDateString()}</div>
            {progress.completedAt && (
              <div>Completed: {new Date(progress.completedAt).toLocaleDateString()}</div>
            )}
            {calculations.remainingParagraphs > 0 && (
              <div>{calculations.remainingParagraphs} paragraphs remaining</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressTracker;