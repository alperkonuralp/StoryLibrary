'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Book, BookOpen, Clock, Target, Trash2, Check } from 'lucide-react';

interface ReadingProgress {
  id: string;
  status: 'STARTED' | 'COMPLETED';
  lastParagraph?: number;
  totalParagraphs?: number;
  completionPercentage?: number;
  readingTimeSeconds?: number;
  wordsRead?: number;
  language?: 'en' | 'tr';
  lastReadAt?: string;
  completedAt?: string;
}

interface ProgressIndicatorProps {
  progress: ReadingProgress | null;
  storyId?: string;
  variant?: 'compact' | 'detailed' | 'card';
  showActions?: boolean;
  onRemove?: (storyId: string) => void;
  onContinue?: (storyId: string) => void;
  className?: string;
}

export function ProgressIndicator({
  progress,
  storyId,
  variant = 'compact',
  showActions = false,
  onRemove,
  onContinue,
  className = '',
}: ProgressIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (progress?.lastReadAt) {
      const updateTimeAgo = () => {
        const lastRead = new Date(progress.lastReadAt!);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - lastRead.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) {
          setTimeAgo('Just now');
        } else if (diffInMinutes < 60) {
          setTimeAgo(`${diffInMinutes}m ago`);
        } else if (diffInMinutes < 1440) {
          const hours = Math.floor(diffInMinutes / 60);
          setTimeAgo(`${hours}h ago`);
        } else {
          const days = Math.floor(diffInMinutes / 1440);
          setTimeAgo(`${days}d ago`);
        }
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
    return undefined;
  }, [progress?.lastReadAt]);

  if (!progress) {
    return null;
  }

  const completionPercentage = progress.completionPercentage || 0;
  const isCompleted = progress.status === 'COMPLETED';
  const readingTime = progress.readingTimeSeconds ? Math.ceil(progress.readingTimeSeconds / 60) : 0;
  
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {isCompleted ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <BookOpen className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-xs font-medium">
            {completionPercentage}%
          </span>
        </div>
        {timeAgo && (
          <span className="text-xs text-gray-500">{timeAgo}</span>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <BookOpen className="h-4 w-4 text-blue-600" />
            )}
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {isCompleted ? 'Completed' : 'Reading'}
            </Badge>
          </div>
          {showActions && storyId && (
            <div className="flex items-center gap-1">
              {!isCompleted && onContinue && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onContinue(storyId)}
                  className="h-6 px-2"
                >
                  Continue
                </Button>
              )}
              {onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(storyId)}
                  className="h-6 px-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <Progress value={completionPercentage} className="h-2 mb-2" />
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{completionPercentage}% complete</span>
          {timeAgo && <span>{timeAgo}</span>}
        </div>
        
        {(readingTime > 0 || progress.wordsRead) && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {readingTime > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{readingTime} min read</span>
              </div>
            )}
            {progress.wordsRead && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{progress.wordsRead} words</span>
              </div>
            )}
            {progress.language && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {progress.language.toUpperCase()}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  // 'detailed' variant
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <BookOpen className="h-5 w-5 text-blue-600" />
          )}
          <div>
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
            {timeAgo && (
              <span className="text-sm text-gray-500 ml-2">{timeAgo}</span>
            )}
          </div>
        </div>
        {showActions && storyId && (
          <div className="flex items-center gap-2">
            {!isCompleted && onContinue && (
              <Button
                size="sm"
                onClick={() => onContinue(storyId)}
              >
                <Book className="h-4 w-4 mr-1" />
                Continue Reading
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(storyId)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Progress value={completionPercentage} className="h-3" />
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{completionPercentage}% complete</span>
          {progress.lastParagraph !== undefined && progress.totalParagraphs && (
            <span className="text-gray-500">
              {progress.lastParagraph} / {progress.totalParagraphs} paragraphs
            </span>
          )}
        </div>
      </div>
      
      {(readingTime > 0 || progress.wordsRead) && (
        <div className="flex items-center gap-6 text-sm text-gray-600">
          {readingTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{readingTime} minutes read</span>
            </div>
          )}
          {progress.wordsRead && (
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{progress.wordsRead} words read</span>
            </div>
          )}
          {progress.language && (
            <div className="flex items-center gap-1">
              <span>Language:</span>
              <Badge variant="outline">
                {progress.language === 'en' ? 'English' : 'Turkish'}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}