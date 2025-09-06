'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Languages, BookOpen, Clock, User, Star, Volume2, VolumeX, Settings, Eye, WifiOff, Wifi } from 'lucide-react';
import { useStoryProgress } from '@/hooks/useProgress';
import { useSettings } from '@/hooks/useSettings';
import { useOfflineReading } from '@/hooks/useOfflineReading';

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
  const [isStoryMarked, setIsStoryMarked] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [visibleParagraphsCount, setVisibleParagraphsCount] = useState(10); // Initially show 10 paragraphs
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Hooks
  const { progress, updateStoryProgress } = useStoryProgress(story.id);
  
  // Mark story as started when component loads
  useEffect(() => {
    if (!isStoryMarked) {
      const totalParagraphs = Math.max(
        story.content.en?.length || 0,
        story.content.tr?.length || 0
      );
      
      // Mark story as started with minimal progress
      updateStoryProgress({
        lastParagraph: 1,
        totalParagraphs,
        completionPercentage: Math.round((1 / totalParagraphs) * 100),
        readingTimeSeconds: 0,
        wordsRead: 0,
        language: mode === 'turkish' ? 'tr' : 'en',
        status: 'STARTED'
      });
      
      setIsStoryMarked(true);
    }
  }, [story.id, isStoryMarked, updateStoryProgress, mode, story.content]);
  const { settings } = useSettings();
  const { isOnline } = useOfflineReading();

  // Initialize from user settings
  useEffect(() => {
    if (settings.defaultReadingLanguage !== 'bilingual') {
      const modeMap: Record<string, DisplayMode> = {
        'en': 'english',
        'tr': 'turkish',
        'bilingual': 'bilingual'
      };
      const settingsMode = modeMap[settings.defaultReadingLanguage] || 'bilingual';
      setMode(settingsMode);
    }
    
    if (settings.autoPlayAudio) {
      setIsAudioEnabled(true);
    }
  }, [settings]);


  const handleModeChange = (newMode: DisplayMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
    // Clear visible translations when switching modes
    setVisibleTranslations(new Set());
  };


  // Text selection handler
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  }, []);

  // Audio reading functions
  const speakText = useCallback((text: string, language: 'en' | 'tr') => {
    if (!isAudioEnabled || !text) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'tr-TR';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
  }, [isAudioEnabled]);

  const toggleTranslation = (index: number) => {
    const newVisible = new Set(visibleTranslations);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    setVisibleTranslations(newVisible);
  };



  // Initialize paragraph refs array
  useEffect(() => {
    const maxParagraphs = Math.max(
      story.content.en?.length || 0,
      story.content.tr?.length || 0
    );
    paragraphRefs.current = Array(maxParagraphs).fill(null);
  }, [story.content]);

  const getDisplayLanguage = () => {
    return mode === 'turkish' ? 'tr' : 'en';
  };

  const renderParagraph = (index: number) => {
    const enParagraph = story.content.en?.[index] || '';
    const trParagraph = story.content.tr?.[index] || '';

    switch (mode) {
      case 'english':
        return (
          <div 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            data-paragraph={index}
            className="mb-4 p-4 bg-slate-50 rounded-lg transition-all duration-200 relative group"
          >
            <div className="flex items-start justify-between">
              <p 
                className={`text-gray-900 leading-relaxed flex-1 ${settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'small' ? 'text-sm' : 'text-base'}`}
                onMouseUp={handleTextSelection}
                style={{ lineHeight: '1.8' }}
              >
                {enParagraph}
              </p>
              <div className="flex items-center gap-1">
                {trParagraph && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTranslation(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-blue-600 hover:text-blue-800 h-6 px-2"
                    title={visibleTranslations.has(index) ? 'Hide Turkish' : 'Show Turkish'}
                  >
                    {visibleTranslations.has(index) ? 'Hide TR' : 'Show TR'}
                  </Button>
                )}
                {isAudioEnabled && enParagraph && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(enParagraph, 'en')}
                    className="ml-1 h-6 w-6 p-0"
                    title="Read aloud"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {trParagraph && visibleTranslations.has(index) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-gray-600 italic leading-relaxed">{trParagraph}</p>
              </div>
            )}
          </div>
        );

      case 'turkish':
        return (
          <div 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            data-paragraph={index}
            className="mb-4 p-4 bg-slate-50 rounded-lg transition-all duration-200 relative group"
          >
            <div className="flex items-start justify-between">
              <p 
                className={`text-gray-900 leading-relaxed flex-1 ${settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'small' ? 'text-sm' : 'text-base'}`}
                onMouseUp={handleTextSelection}
                style={{ lineHeight: '1.8' }}
              >
                {trParagraph}
              </p>
              <div className="flex items-center gap-1">
                {enParagraph && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTranslation(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-blue-600 hover:text-blue-800 h-6 px-2"
                    title={visibleTranslations.has(index) ? 'Hide English' : 'Show English'}
                  >
                    {visibleTranslations.has(index) ? 'Hide EN' : 'Show EN'}
                  </Button>
                )}
                {isAudioEnabled && trParagraph && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(trParagraph, 'tr')}
                    className="ml-1 h-6 w-6 p-0"
                    title="Read aloud"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {enParagraph && visibleTranslations.has(index) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-gray-600 italic leading-relaxed">{enParagraph}</p>
              </div>
            )}
          </div>
        );

      case 'bilingual':
        return (
          <div 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            data-paragraph={index}
            className="mb-6 p-4 bg-slate-50 rounded-lg transition-all duration-200"
          >
            {enParagraph && (
              <div className="flex items-start justify-between mb-3">
                <p 
                  className={`text-gray-900 leading-relaxed flex-1 ${settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'small' ? 'text-sm' : 'text-base'}`}
                  onMouseUp={handleTextSelection}
                  style={{ lineHeight: '1.8' }}
                >
                  {enParagraph}
                </p>
                {isAudioEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(enParagraph, 'en')}
                    className="ml-2 h-6 w-6 p-0"
                    title="Read English aloud"
                  >
                    <Volume2 className="h-3 w-3 text-blue-600" />
                  </Button>
                )}
              </div>
            )}
            {trParagraph && (
              <div className="flex items-start justify-between border-l-4 border-blue-200 pl-4">
                <p 
                  className={`text-gray-700 leading-relaxed flex-1 ${settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'small' ? 'text-sm' : 'text-base'}`}
                  onMouseUp={handleTextSelection}
                  style={{ lineHeight: '1.8' }}
                >
                  {trParagraph}
                </p>
                {isAudioEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(trParagraph, 'tr')}
                    className="ml-2 h-6 w-6 p-0"
                    title="Read Turkish aloud"
                  >
                    <Volume2 className="h-3 w-3 text-red-600" />
                  </Button>
                )}
              </div>
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

  const isLongStory = maxParagraphs > 20;
  const paragraphsToShow = Math.min(visibleParagraphsCount, maxParagraphs);
  const hasMoreParagraphs = paragraphsToShow < maxParagraphs;

  const displayLang = getDisplayLanguage();
  const title = story.title[displayLang] || Object.values(story.title)[0] || 'Untitled';
  const description = story.shortDescription[displayLang] || Object.values(story.shortDescription)[0] || '';

  const loadMoreParagraphs = () => {
    const newVisibleCount = Math.min(visibleParagraphsCount + 10, maxParagraphs);
    setVisibleParagraphsCount(newVisibleCount);
  };

  const showAllParagraphs = () => {
    setVisibleParagraphsCount(maxParagraphs);
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="story-reader">
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
                    <span>{Number(story.averageRating).toFixed(1)} ({story.ratingCount})</span>
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


              {/* Reading Controls */}
              <div className="flex items-center justify-between">
                <LanguageToggle mode={mode} onChange={handleModeChange} />
                
                <div className="flex items-center gap-2">
                  {/* Online/Offline Status */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isOnline ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                  }`}>
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? 'Online' : 'Offline'}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className={`flex items-center gap-2 ${isAudioEnabled ? 'text-blue-600' : 'text-gray-500'}`}
                    title={isAudioEnabled ? 'Disable audio' : 'Enable audio'}
                    disabled={!isOnline}
                  >
                    {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    Audio
                  </Button>
                  
                  {settings.showTranslations && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (visibleTranslations.size > 0) {
                          setVisibleTranslations(new Set());
                        } else {
                          setVisibleTranslations(new Set(Array.from({ length: maxParagraphs }, (_, i) => i)));
                        }
                      }}
                      className="flex items-center gap-2"
                      title={visibleTranslations.size > 0 ? 'Hide all translations' : 'Show all translations'}
                    >
                      <Eye className="h-4 w-4" />
                      {visibleTranslations.size > 0 ? 'Hide All' : 'Show All'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Story content */}
      <Card>
        <CardContent className="p-6">
          {/* Long story warning */}
          {isLongStory && visibleParagraphsCount === 10 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Long Story ({maxParagraphs} paragraphs)</h3>
                  <p className="text-sm text-blue-700">
                    This story has many paragraphs. We're showing the first 10 to improve loading time.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadMoreParagraphs}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Load 10 More
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={showAllParagraphs}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Show All
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="prose max-w-none" data-testid="story-content">
            {Array.from({ length: paragraphsToShow }, (_, index) => renderParagraph(index))}
          </div>
          
          {/* Load more button */}
          {hasMoreParagraphs && (
            <div className="mt-8 text-center w-full">
              <div className="mb-4 text-sm text-gray-600">
                Showing {paragraphsToShow} of {maxParagraphs} paragraphs
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 px-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreParagraphs}
                  className="flex items-center justify-center gap-2 min-w-fit whitespace-nowrap"
                >
                  <BookOpen className="h-4 w-4" />
                  Load 10 More Paragraphs
                </Button>
                <Button 
                  variant="default" 
                  onClick={showAllParagraphs}
                  className="flex items-center justify-center gap-2 min-w-fit whitespace-nowrap"
                >
                  <BookOpen className="h-4 w-4" />
                  Show All ({maxParagraphs - paragraphsToShow} remaining)
                </Button>
              </div>
            </div>
          )}
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