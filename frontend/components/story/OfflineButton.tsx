'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check, Loader2, Trash2, WifiOff } from 'lucide-react';
import { useOfflineReading } from '@/hooks/useOfflineReading';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OfflineButtonProps {
  storyId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  showText?: boolean;
  compact?: boolean;
  className?: string;
}

export function OfflineButton({
  storyId,
  size = 'sm',
  variant = 'outline',
  showText = false,
  compact = false,
  className = ''
}: OfflineButtonProps) {
  const { isAuthenticated } = useAuth();
  const {
    isOnline,
    downloading,
    downloadStory,
    removeStory,
    isStoryDownloaded,
    storageStats
  } = useOfflineReading();

  const isDownloaded = isStoryDownloaded(storyId);
  const isDownloading = downloading.has(storyId);
  const canDownload = isAuthenticated && isOnline && !isDownloaded && !isDownloading;
  const storageAlmostFull = storageStats.usedPercentage > 90;

  const handleClick = async () => {
    if (isDownloaded) {
      removeStory(storyId);
    } else if (canDownload) {
      await downloadStory(storyId);
    }
  };

  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span>Downloading...</span>}
        </>
      );
    }

    if (isDownloaded) {
      return (
        <>
          {compact ? <Trash2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {showText && <span>{compact ? 'Remove' : 'Downloaded'}</span>}
        </>
      );
    }

    return (
      <>
        <Download className="h-4 w-4" />
        {showText && <span>Download</span>}
      </>
    );
  };

  const getTooltipContent = () => {
    if (!isAuthenticated) {
      return 'Sign in to download stories for offline reading';
    }
    
    if (!isOnline) {
      return 'Connect to internet to download stories';
    }

    if (isDownloading) {
      return 'Downloading story for offline reading...';
    }

    if (isDownloaded) {
      return compact ? 'Remove from offline storage' : 'Story available offline';
    }

    if (storageAlmostFull) {
      return 'Storage almost full. Remove some stories first.';
    }

    return 'Download for offline reading';
  };

  const getButtonVariant = () => {
    if (isDownloaded && !compact) {
      return 'default';
    }
    if (isDownloaded && compact) {
      return 'ghost';
    }
    return variant;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              variant={getButtonVariant()}
              size={size}
              onClick={handleClick}
              disabled={!canDownload && !isDownloaded}
              className={`gap-2 ${className} ${
                isDownloaded && !compact ? 'bg-green-600 hover:bg-green-700 text-white' : ''
              } ${
                isDownloaded && compact ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : ''
              }`}
            >
              {!isOnline && !isDownloaded && (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              {(isOnline || isDownloaded) && getButtonContent()}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for use in story cards
export function OfflineButtonCompact({
  storyId,
  className = ''
}: {
  storyId: string;
  className?: string;
}) {
  return (
    <OfflineButton
      storyId={storyId}
      size="sm"
      variant="ghost"
      compact={true}
      className={`h-8 w-8 p-0 ${className}`}
    />
  );
}

export default OfflineButton;