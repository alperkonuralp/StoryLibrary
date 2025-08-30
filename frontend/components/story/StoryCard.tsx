'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, User, Star, Languages } from 'lucide-react';

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
  className?: string;
}

export function StoryCard({ 
  story, 
  language = 'en',
  showDescription = true,
  showStats = true,
  showTags = true,
  className = ''
}: StoryCardProps) {
  const title = story.title[language] || Object.values(story.title)[0] || 'Untitled';
  const description = story.shortDescription[language] || Object.values(story.shortDescription)[0] || '';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3">
          <CardTitle className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            <Link href={`/stories/${story.slug}`}>
              {title}
            </Link>
          </CardTitle>
          
          {showDescription && description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {description}
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
                  <span>{story.averageRating.toFixed(1)} ({story.ratingCount})</span>
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