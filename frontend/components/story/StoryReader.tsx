'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Languages, BookOpen, Clock, User, Star } from 'lucide-react';

export type DisplayMode = 'english' | 'turkish' | 'bilingual';

interface Story {
  id: string;
  title: Record<string, string>;
  content: Record<string, string[]>;
  shortDescription: Record<string, string>;
  statistics?: {
    wordCount: Record<string, number>;
    estimatedReadingTime: Record<string, number>;
    sentenceCount: Record<string, number>;
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
}

interface StoryReaderProps {
  story: Story;
  initialMode?: DisplayMode;
  onModeChange?: (mode: DisplayMode) => void;
  showHeader?: boolean;
}

export function StoryReader({ 
  story, 
  initialMode = 'bilingual', 
  onModeChange,
  showHeader = true
}: StoryReaderProps) {
  const [mode, setMode] = useState<DisplayMode>(initialMode);
  const [visibleTranslations, setVisibleTranslations] = useState<Set<number>>(new Set());

  const handleModeChange = (newMode: DisplayMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
    // Clear visible translations when switching modes
    setVisibleTranslations(new Set());
  };

  const toggleTranslation = (index: number) => {
    const newVisible = new Set(visibleTranslations);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    setVisibleTranslations(newVisible);
  };

  const getDisplayLanguage = () => {
    return mode === 'turkish' ? 'tr' : 'en';
  };

  const renderParagraph = (index: number) => {
    const enParagraph = story.content.en?.[index] || '';
    const trParagraph = story.content.tr?.[index] || '';

    switch (mode) {
      case 'english':
        return (
          <div key={index} className="mb-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-gray-900 leading-relaxed">{enParagraph}</p>
            {trParagraph && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTranslation(index)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {visibleTranslations.has(index) ? 'Hide Turkish' : 'Show Turkish'}
                </Button>
                {visibleTranslations.has(index) && (
                  <p className="mt-2 text-gray-600 italic leading-relaxed">{trParagraph}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'turkish':
        return (
          <div key={index} className="mb-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-gray-900 leading-relaxed">{trParagraph}</p>
            {enParagraph && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTranslation(index)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {visibleTranslations.has(index) ? 'Hide English' : 'Show English'}
                </Button>
                {visibleTranslations.has(index) && (
                  <p className="mt-2 text-gray-600 italic leading-relaxed">{enParagraph}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'bilingual':
        return (
          <div key={index} className="mb-6 p-4 bg-slate-50 rounded-lg">
            {enParagraph && (
              <p className="text-gray-900 leading-relaxed mb-3">{enParagraph}</p>
            )}
            {trParagraph && (
              <p className="text-gray-700 leading-relaxed border-l-4 border-blue-200 pl-4">
                {trParagraph}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const maxParagraphs = Math.max(
    story.content.en?.length || 0,
    story.content.tr?.length || 0
  );

  const displayLang = getDisplayLanguage();
  const title = story.title[displayLang] || Object.values(story.title)[0] || 'Untitled';
  const description = story.shortDescription[displayLang] || Object.values(story.shortDescription)[0] || '';

  return (
    <div className="max-w-4xl mx-auto">
      {showHeader && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <CardTitle className="text-3xl font-bold text-gray-900">
                {title}
              </CardTitle>
              
              {description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {description}
                </p>
              )}

              {/* Story metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {story.authors && story.authors.length > 0 && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{story.authors.map(a => a.author.name).join(', ')}</span>
                  </div>
                )}
                
                {story.statistics && (
                  <>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{story.statistics.wordCount[displayLang] || 0} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{story.statistics.estimatedReadingTime[displayLang] || 1} min read</span>
                    </div>
                  </>
                )}

                {story.averageRating && story.ratingCount && story.ratingCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{story.averageRating.toFixed(1)} ({story.ratingCount})</span>
                  </div>
                )}
              </div>

              {/* Categories and tags */}
              <div className="flex flex-wrap gap-2">
                {story.categories?.map(({ category }) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name[displayLang] || Object.values(category.name)[0]}
                  </Badge>
                ))}
                {story.tags?.map(({ tag }) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name[displayLang] || Object.values(tag.name)[0]}
                  </Badge>
                ))}
              </div>

              {/* Language toggle */}
              <LanguageToggle mode={mode} onChange={handleModeChange} />
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Story content */}
      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            {Array.from({ length: maxParagraphs }, (_, index) => renderParagraph(index))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LanguageToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export function LanguageToggle({ mode, onChange }: LanguageToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={mode === 'english' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('english')}
        className="flex items-center gap-2"
      >
        English Only
      </Button>
      <Button
        variant={mode === 'turkish' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('turkish')}
        className="flex items-center gap-2"
      >
        Türkçe Only
      </Button>
      <Button
        variant={mode === 'bilingual' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('bilingual')}
        className="flex items-center gap-2"
      >
        <Languages className="w-4 h-4" />
        Bilingual
      </Button>
    </div>
  );
}