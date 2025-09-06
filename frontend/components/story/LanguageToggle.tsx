'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DisplayMode = 'english' | 'turkish' | 'bilingual';

interface LanguageToggleProps {
  currentMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const modeConfig = {
  english: {
    label: 'English Only',
    shortLabel: 'EN',
    flag: '🇺🇸',
    description: 'Show only English content'
  },
  turkish: {
    label: 'Turkish Only',
    shortLabel: 'TR',
    flag: '🇹🇷',
    description: 'Show only Turkish content'
  },
  bilingual: {
    label: 'Bilingual',
    shortLabel: 'EN/TR',
    flag: '🌐',
    description: 'Show both languages side by side'
  }
};

export function LanguageToggle({
  currentMode,
  onModeChange,
  className,
  size = 'md',
  showLabels = true
}: LanguageToggleProps) {
  const modes: DisplayMode[] = ['english', 'turkish', 'bilingual'];

  const buttonSize = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }[size];

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {modes.map((mode) => {
        const config = modeConfig[mode];
        const isActive = currentMode === mode;
        
        return (
          <Button
            key={mode}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              buttonSize,
              'transition-all duration-200',
              isActive && 'shadow-sm ring-2 ring-primary/20'
            )}
            onClick={() => onModeChange(mode)}
            title={config.description}
            aria-label={`Switch to ${config.label.toLowerCase()}`}
          >
            <span className="mr-1">{config.flag}</span>
            {showLabels ? (
              <span className="hidden sm:inline">{config.label}</span>
            ) : (
              <span>{config.shortLabel}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Simplified version for stories listing pages
interface SimpleLanguageToggleProps {
  currentLanguage: 'en' | 'tr';
  onLanguageChange: (language: 'en' | 'tr') => void;
  className?: string;
}

export function SimpleLanguageToggle({
  currentLanguage,
  onLanguageChange,
  className
}: SimpleLanguageToggleProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onLanguageChange('en')}
        className="h-8 px-3"
        title="Show English stories"
      >
        🇺🇸 English Stories
      </Button>
      <Button
        variant={currentLanguage === 'tr' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onLanguageChange('tr')}
        className="h-8 px-3"
        title="Show Turkish stories"
      >
        🇹🇷 Turkish Stories
      </Button>
    </div>
  );
}

// Reading mode indicator for story reader
interface ReadingModeIndicatorProps {
  mode: DisplayMode;
  className?: string;
}

export function ReadingModeIndicator({ mode, className }: ReadingModeIndicatorProps) {
  const config = modeConfig[mode];
  
  return (
    <Badge 
      variant="outline" 
      className={cn('gap-1', className)}
    >
      <span>{config.flag}</span>
      <span className="text-xs">{config.shortLabel}</span>
    </Badge>
  );
}

// Hook for managing language toggle state
export function useLanguageToggle(initialMode: DisplayMode = 'bilingual') {
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>(initialMode);

  const handleModeChange = React.useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reading-mode', mode);
    }
  }, []);

  // Load saved preference on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('reading-mode') as DisplayMode;
      if (savedMode && ['english', 'turkish', 'bilingual'].includes(savedMode)) {
        setDisplayMode(savedMode);
      }
    }
  }, []);

  return {
    displayMode,
    setDisplayMode: handleModeChange
  };
}

// Utility function to get content based on display mode
export function getContentByMode<T>(
  content: { en: T; tr: T },
  mode: DisplayMode
): T | { en: T; tr: T } {
  switch (mode) {
    case 'english':
      return content.en;
    case 'turkish':
      return content.tr;
    case 'bilingual':
      return content;
    default:
      return content;
  }
}

// Component for rendering content based on display mode
interface BilingualContentProps {
  content: {
    en: string | React.ReactNode;
    tr: string | React.ReactNode;
  };
  mode: DisplayMode;
  className?: string;
  containerClassName?: string;
}

export function BilingualContent({
  content,
  mode,
  className,
  containerClassName
}: BilingualContentProps) {
  if (mode === 'english') {
    return <div className={className}>{content.en}</div>;
  }
  
  if (mode === 'turkish') {
    return <div className={className}>{content.tr}</div>;
  }
  
  // Bilingual mode - show both languages
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', containerClassName)}>
      <div className={cn('space-y-2', className)}>
        <Badge variant="outline" className="text-xs mb-2">🇺🇸 English</Badge>
        {content.en}
      </div>
      <div className={cn('space-y-2', className)}>
        <Badge variant="outline" className="text-xs mb-2">🇹🇷 Turkish</Badge>
        {content.tr}
      </div>
    </div>
  );
}