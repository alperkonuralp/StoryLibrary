'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, User, Star, Languages, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { useStoryProgress } from '@/hooks/useProgress';
import { useStoryBookmark } from '@/hooks/useBookmarks';
import SearchHighlight from '@/components/search/SearchHighlight';

interface Story {
  id: string;
  slug: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  statistics?: {
    wordCount: Record<string, number>;
    estimatedReadingTime: Record<string, number>;
  };
  categories?: Array<{
    category: {
      id: string;
      name: Record<string, string>;
      slug: string;
    };
  }>;
  tags?: Array<{
    tag: {
      id: string;
      name: Record<string, string>;
      color: string;
      slug: string;
    };
  }>;
  authors?: Array<{
    author: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  }>;
  averageRating?: number;
  ratingCount?: number;
  publishedAt?: string;
}

interface StoryCardProps {
  story: Story;
  language?: 'en' | 'tr';
  showDescription?: boolean;
  showStats?: boolean;
  showTags?: boolean;
  showProgress?: boolean;
  showBookmark?: boolean;
  searchTerm?: string;
  className?: string;
}

export function StoryCard({ 
  story, 
  language = 'en',
  showDescription = true,
  showStats = true,
  showTags = true,
  showProgress = true,
  showBookmark = true,
  searchTerm,
  className = ''
}: StoryCardProps) {
  const title = story.title[language] || Object.values(story.title)[0] || 'Untitled';
  const description = story.shortDescription[language] || Object.values(story.shortDescription)[0] || '';
  
  // Progress and bookmark hooks
  const { progress, loading: progressLoading } = useStoryProgress(story.id);
  const { isBookmarked, loading: bookmarkLoading, toggle: toggleBookmark } = useStoryBookmark(story.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleBookmark();
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors flex-1 mr-2">
              <Link href={`/stories/${story.slug}`}>
                <SearchHighlight text={title} searchTerm={searchTerm} />
              </Link>
            </CardTitle>
            
            {/* Progress Status & Bookmark */}
            <div className="flex items-center gap-2">
              {showProgress && progress?.status === 'COMPLETED' && (
                <div className="flex items-center text-green-600" title="Completed">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              
              {showBookmark && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={handleBookmarkToggle}
                  disabled={bookmarkLoading}
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && progress && progress.status !== 'COMPLETED' && progress.completionPercentage && progress.completionPercentage > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{Math.round(progress.completionPercentage)}%</span>
              </div>
              <Progress value={progress.completionPercentage} className="h-1.5" />
            </div>
          )}
          
          {showDescription && description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              <SearchHighlight text={description} searchTerm={searchTerm} />
            </p>
          )}

          {/* Categories */}
          {story.categories && story.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {story.categories.slice(0, 2).map(({ category }) => (
                <Badge key={category.id} variant="secondary" className="text-xs">
                  {category.name[language] || Object.values(category.name)[0]}
                </Badge>
              ))}
              {story.categories.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{story.categories.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Author and stats */}
          {(showStats || story.authors) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {story.authors && story.authors.length > 0 && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate">
                    {story.authors.slice(0, 2).map(a => a.author.name).join(', ')}
                    {story.authors.length > 2 && ` +${story.authors.length - 2}`}
                  </span>
                </div>
              )}
              
              {showStats && story.statistics && (
                <>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{story.statistics.wordCount[language] || story.statistics.wordCount.en || 0} words</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{story.statistics.estimatedReadingTime[language] || story.statistics.estimatedReadingTime.en || 1} min</span>
                  </div>
                </>
              )}

              {story.averageRating && story.ratingCount && story.ratingCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{Number(story.averageRating).toFixed(1)} ({story.ratingCount})</span>
                </div>
              )}

              {story.publishedAt && (
                <div className="flex items-center gap-1 ml-auto text-xs text-gray-400">
                  {formatDate(story.publishedAt)}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {showTags && story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {story.tags.slice(0, 3).map(({ tag }) => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: tag.color, 
                    color: tag.color,
                    fontSize: '10px'
                  }}
                >
                  {tag.name[language] || Object.values(tag.name)[0]}
                </Badge>
              ))}
              {story.tags.length > 3 && (
                <Badge variant="outline" className="text-xs" style={{ fontSize: '10px' }}>
                  +{story.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Languages className="w-3 h-3" />
              <span>
                {Object.keys(story.title).includes('en') && Object.keys(story.title).includes('tr') 
                  ? 'EN/TR' 
                  : Object.keys(story.title).includes('en') 
                    ? 'EN' 
                    : 'TR'
                }
              </span>
            </div>
            
            <Link href={`/stories/${story.slug}`}>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                Read Story
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StoryCard;