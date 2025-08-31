'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Languages, 
  Calendar, 
  User, 
  Folder, 
  Tag, 
  BookOpen,
  Clock,
  Target,
  Globe
} from 'lucide-react';

interface StoryData {
  id?: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  content: {
    en: string[];
    tr: string[];
  };
  categoryIds: string[];
  tagIds: string[];
  authorIds: Array<{
    id: string;
    role: 'author' | 'co-author' | 'translator';
  }>;
  status: 'draft' | 'published' | 'archived';
  metadata?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    ageGroup?: string;
    themes?: string[];
  };
  publishedAt?: string;
}

interface StoryPreviewProps {
  story: StoryData;
  categories?: Array<{ id: string; name: Record<string, string> }>;
  tags?: Array<{ id: string; name: Record<string, string>; color: string }>;
  authors?: Array<{ id: string; name: string }>;
  className?: string;
}

type DisplayMode = 'en' | 'tr' | 'bilingual';

export function StoryPreview({
  story,
  categories = [],
  tags = [],
  authors = [],
  className = '',
}: StoryPreviewProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bilingual');

  const getStoryCategories = () => {
    return categories.filter(cat => story.categoryIds.includes(cat.id));
  };

  const getStoryTags = () => {
    return tags.filter(tag => story.tagIds.includes(tag.id));
  };

  const getStoryAuthors = () => {
    return story.authorIds.map(authorRef => {
      const author = authors.find(a => a.id === authorRef.id);
      return { ...authorRef, name: author?.name || 'Unknown Author' };
    });
  };

  const getWordCount = (language: 'en' | 'tr') => {
    return story.content[language]
      .join(' ')
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  };

  const getEstimatedReadingTime = (language: 'en' | 'tr') => {
    const wordCount = getWordCount(language);
    return Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed: 200 words per minute
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderParagraph = (enParagraph: string, trParagraph: string, index: number) => {
    switch (displayMode) {
      case 'en':
        return enParagraph ? (
          <p key={index} className="mb-4 leading-relaxed">
            {enParagraph}
          </p>
        ) : null;
      
      case 'tr':
        return trParagraph ? (
          <p key={index} className="mb-4 leading-relaxed">
            {trParagraph}
          </p>
        ) : null;
      
      case 'bilingual':
        return (
          <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
            {enParagraph && (
              <p className="mb-2 text-gray-900 leading-relaxed">
                <span className="inline-flex items-center text-xs font-medium text-blue-600 mb-1">
                  🇺🇸 EN
                </span>
                <br />
                {enParagraph}
              </p>
            )}
            {trParagraph && (
              <p className="text-gray-900 leading-relaxed">
                <span className="inline-flex items-center text-xs font-medium text-red-600 mb-1">
                  🇹🇷 TR
                </span>
                <br />
                {trParagraph}
              </p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const maxParagraphs = Math.max(story.content.en.length, story.content.tr.length);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {story.title.en || story.title.tr || 'Untitled Story'}
              </CardTitle>
              {(story.title.en && story.title.tr && story.title.en !== story.title.tr) && (
                <p className="text-lg text-gray-600 mb-2">
                  {displayMode === 'en' ? story.title.tr : story.title.en}
                </p>
              )}
              <p className="text-gray-600 leading-relaxed">
                {displayMode === 'bilingual' 
                  ? (story.shortDescription.en || story.shortDescription.tr)
                  : story.shortDescription[displayMode] || story.shortDescription.en || story.shortDescription.tr
                }
              </p>
            </div>

            {/* Display Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={displayMode === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayMode('en')}
              >
                🇺🇸 EN
              </Button>
              <Button
                variant={displayMode === 'tr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayMode('tr')}
              >
                🇹🇷 TR
              </Button>
              <Button
                variant={displayMode === 'bilingual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayMode('bilingual')}
              >
                <Languages className="h-4 w-4 mr-1" />
                Both
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Story Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Authors */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <div>
                <p className="font-medium">Authors</p>
                <p>{getStoryAuthors().map(a => a.name).join(', ') || 'No authors'}</p>
              </div>
            </div>

            {/* Word Count */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <div>
                <p className="font-medium">Word Count</p>
                <p>
                  EN: {getWordCount('en')} | TR: {getWordCount('tr')}
                </p>
              </div>
            </div>

            {/* Reading Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-medium">Reading Time</p>
                <p>
                  {displayMode === 'en' 
                    ? `${getEstimatedReadingTime('en')} min`
                    : displayMode === 'tr'
                    ? `${getEstimatedReadingTime('tr')} min`
                    : `${Math.max(getEstimatedReadingTime('en'), getEstimatedReadingTime('tr'))} min`
                  }
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target className="h-4 w-4" />
              <div>
                <p className="font-medium">Status</p>
                <Badge variant="outline" className={
                  story.status === 'published' ? 'border-green-300 text-green-700' :
                  story.status === 'draft' ? 'border-yellow-300 text-yellow-700' :
                  'border-gray-300 text-gray-700'
                }>
                  {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Categories and Tags */}
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Categories */}
            {getStoryCategories().length > 0 && (
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Categories:</span>
                <div className="flex flex-wrap gap-1">
                  {getStoryCategories().map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name.en || category.name.tr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {getStoryTags().length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {getStoryTags().map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                    >
                      {tag.name.en || tag.name.tr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {story.metadata && (
              <div className="flex items-center space-x-4">
                {story.metadata.difficulty && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Difficulty:</span>
                    <Badge className={getDifficultyColor(story.metadata.difficulty)}>
                      {story.metadata.difficulty.charAt(0).toUpperCase() + story.metadata.difficulty.slice(1)}
                    </Badge>
                  </div>
                )}

                {story.metadata.ageGroup && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Age Group:</span>
                    <span className="text-sm text-gray-600">{story.metadata.ageGroup}</span>
                  </div>
                )}
              </div>
            )}

            {/* Themes */}
            {story.metadata?.themes && story.metadata.themes.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Themes:</span>
                <div className="flex flex-wrap gap-1">
                  {story.metadata.themes.map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Story Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Story Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {Array.from({ length: maxParagraphs }, (_, index) => 
              renderParagraph(
                story.content.en[index] || '',
                story.content.tr[index] || '',
                index
              )
            )}
          </div>

          {/* Empty State */}
          {maxParagraphs === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No content added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publication Info */}
      {story.publishedAt && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Published on {new Date(story.publishedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}