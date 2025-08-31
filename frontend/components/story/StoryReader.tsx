'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  onProgressUpdate?: (paragraph: number) => void;
  showHeader?: boolean;
}

export function StoryReader({ 
  story, 
  initialMode = 'bilingual', 
  onModeChange,
  onProgressUpdate,
  showHeader = true
}: StoryReaderProps) {
  const [mode, setMode] = useState<DisplayMode>(initialMode);
  const [visibleTranslations, setVisibleTranslations] = useState<Set<number>>(new Set());
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [readingStartTime, setReadingStartTime] = useState<number>(0);
  const [readingSession, setReadingSession] = useState<{ startTime: number; startParagraph: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Hooks
  const { progress, updateStoryProgress, startReadingSession, endReadingSession } = useStoryProgress(story.id);
  const { settings } = useSettings();
  const { isOnline } = useOfflineReading();

  // Initialize from user settings and progress
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
    
    if (progress?.lastParagraph && progress.lastParagraph > 0) {
      setCurrentParagraph(progress.lastParagraph - 1);
      // Scroll to last read position
      setTimeout(() => {
        paragraphRefs.current[progress.lastParagraph - 1]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    }
  }, [settings, progress]);

  // Start reading session when component mounts
  useEffect(() => {
    const session = startReadingSession();
    setReadingSession(session);
    setReadingStartTime(Date.now());
    
    return () => {
      // End reading session when component unmounts
      if (session) {
        const totalParagraphs = Math.max(
          story.content.en?.length || 0,
          story.content.tr?.length || 0
        );
        const wordsRead = calculateWordsRead(session.startParagraph, currentParagraph);
        const currentLang = mode === 'turkish' ? 'tr' : 'en';
        
        endReadingSession(session, currentParagraph, totalParagraphs, currentLang, wordsRead);
      }
    };
  }, []);

  const handleModeChange = (newMode: DisplayMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
    // Clear visible translations when switching modes
    setVisibleTranslations(new Set());
  };

  // Helper function to calculate words read
  const calculateWordsRead = useCallback((startParagraph: number, endParagraph: number): number => {
    const currentLang = mode === 'turkish' ? 'tr' : 'en';
    let totalWords = 0;
    
    for (let i = startParagraph; i <= endParagraph; i++) {
      const paragraph = story.content[currentLang]?.[i] || '';
      totalWords += paragraph.split(' ').length;
    }
    
    return totalWords;
  }, [story.content, mode]);

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

  // Track reading progress with intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const paragraphIndex = parseInt(entry.target.getAttribute('data-paragraph') || '0');
            if (paragraphIndex > currentParagraph) {
              setCurrentParagraph(paragraphIndex);
              onProgressUpdate?.(paragraphIndex + 1); // +1 because we want 1-based indexing
              
              // Update progress in backend periodically (every 5 paragraphs or on completion)
              const totalParagraphs = Math.max(
                story.content.en?.length || 0,
                story.content.tr?.length || 0
              );
              
              if (paragraphIndex % 5 === 0 || paragraphIndex >= totalParagraphs - 1) {
                const completionPercentage = Math.round(((paragraphIndex + 1) / totalParagraphs) * 100);
                const currentLang = mode === 'turkish' ? 'tr' : 'en';
                const wordsRead = readingSession ? calculateWordsRead(readingSession.startParagraph, paragraphIndex) : 0;
                const readingTime = readingSession ? Math.floor((Date.now() - readingSession.startTime) / 1000) : 0;
                
                updateStoryProgress({
                  lastParagraph: paragraphIndex + 1,
                  totalParagraphs,
                  completionPercentage,
                  readingTimeSeconds: readingTime,
                  wordsRead,
                  language: currentLang,
                  status: completionPercentage >= 100 ? 'COMPLETED' : 'STARTED'
                });
              }
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of paragraph is visible
        rootMargin: '-100px 0px -100px 0px' // Only track paragraphs in the middle of viewport
      }
    );

    paragraphRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [currentParagraph, onProgressUpdate]);

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
    const isCurrentParagraph = index === currentParagraph;

    switch (mode) {
      case 'english':
        return (
          <div 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            data-paragraph={index}
            className={`mb-4 p-4 bg-slate-50 rounded-lg transition-all duration-200 ${
              isCurrentParagraph ? 'ring-2 ring-blue-300 bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <p 
                className={`text-gray-900 leading-relaxed flex-1 ${settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'small' ? 'text-sm' : 'text-base'}`}
                onMouseUp={handleTextSelection}
                style={{ lineHeight: '1.8' }}
              >
                {enParagraph}
              </p>
              {isAudioEnabled && enParagraph && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(enParagraph, 'en')}
                  className="ml-2 h-6 w-6 p-0"
                  title="Read aloud"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
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
          <div 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            data-paragraph={index}
            className={`mb-4 p-4 bg-slate-50 rounded-lg transition-all duration-200 ${
              isCurrentParagraph ? 'ring-2 ring-blue-300 bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <p 
                className={`text-gray-900 leading-relaxed flex-1 ${settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'small' ? 'text-sm' : 'text-base'}`}
                onMouseUp={handleTextSelection}
                style={{ lineHeight: '1.8' }}
              >
                {trParagraph}
              </p>
              {isAudioEnabled && trParagraph && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(trParagraph, 'tr')}
                  className="ml-2 h-6 w-6 p-0"
                  title="Read aloud"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
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
          <div 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            data-paragraph={index}
            className={`mb-6 p-4 bg-slate-50 rounded-lg transition-all duration-200 ${
              isCurrentParagraph ? 'ring-2 ring-blue-300 bg-blue-50' : ''
            }`}
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

  const displayLang = getDisplayLanguage();
  const title = story.title[displayLang] || Object.values(story.title)[0] || 'Untitled';
  const description = story.shortDescription[displayLang] || Object.values(story.shortDescription)[0] || '';

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

              {/* Reading Progress */}
              {progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reading Progress</span>
                    <span className="font-medium">{Math.round(progress.completionPercentage || 0)}%</span>
                  </div>
                  <Progress value={progress.completionPercentage || 0} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Paragraph {currentParagraph + 1} of {maxParagraphs}
                  </div>
                </div>
              )}

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
          <div className="prose max-w-none" data-testid="story-content">
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