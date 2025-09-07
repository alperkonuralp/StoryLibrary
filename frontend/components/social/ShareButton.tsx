'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Send, 
  Mail, 
  Copy,
  Check,
  ExternalLink,
  X
} from 'lucide-react';
import { useStoryShare } from '@/hooks/useStoryShare';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  storyId: string;
  storySlug: string;
  title: string;
  description: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
  position?: 'bottom' | 'top' | 'left' | 'right';
  className?: string;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  action: () => Promise<boolean>;
}

export function ShareButton({
  storyId,
  storySlug,
  title,
  description,
  size = 'default',
  variant = 'outline',
  showLabel = true,
  position = 'bottom',
  className = '',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedRecently, setCopiedRecently] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    shareToTelegram,
    shareViaEmail,
    copyToClipboard,
    shareWithNativeAPI,
    trackShare,
    generateShareUrl,
    generateShareText,
    loading,
    error,
  } = useStoryShare();

  const shareUrl = generateShareUrl(storySlug);
  const shareText = generateShareText(title, description);
  const shareData = { url: shareUrl, title, text: shareText };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleShare = async (platform: string, shareAction: () => Promise<boolean>) => {
    const success = await shareAction();
    if (success) {
      await trackShare(storyId, platform);
      setIsOpen(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedRecently(true);
      await trackShare(storyId, 'copy');
      setTimeout(() => setCopiedRecently(false), 2000);
      setIsOpen(false);
    }
  };

  const handleNativeShare = async () => {
    const success = await shareWithNativeAPI(shareData);
    if (success) {
      await trackShare(storyId, 'native');
      setIsOpen(false);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="h-4 w-4" />,
      color: 'text-blue-400',
      action: () => shareToTwitter(shareData),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="h-4 w-4" />,
      color: 'text-blue-600',
      action: () => shareToFacebook(shareData),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4" />,
      color: 'text-green-500',
      action: () => shareToWhatsApp(shareData),
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="h-4 w-4" />,
      color: 'text-blue-500',
      action: () => shareToTelegram(shareData),
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="h-4 w-4" />,
      color: 'text-gray-600',
      action: () => shareViaEmail(shareData),
    },
  ];

  const getDropdownPosition = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-full mt-2';
    }
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn('relative', className)}
      >
        <Share2 className="h-4 w-4" />
        {showLabel && <span className="ml-2">Share</span>}
      </Button>

      {isOpen && (
        <Card 
          ref={dropdownRef}
          className={cn(
            'absolute z-50 w-64 shadow-lg',
            getDropdownPosition()
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Share this story</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Native Share API (Mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <div className="mb-3 pb-3 border-b">
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Share...</span>
                </button>
              </div>
            )}

            {/* Social Media Options */}
            <div className="space-y-1 mb-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleShare(option.id, option.action)}
                  disabled={loading}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <span className={option.color}>{option.icon}</span>
                  <span className="text-sm font-medium">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link */}
            <div className="pt-3 border-t">
              <button
                onClick={handleCopy}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {copiedRecently ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm font-medium">
                  {copiedRecently ? 'Copied!' : 'Copy link'}
                </span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="pt-2 border-t mt-2">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for inline use
export function ShareButtonCompact({
  storyId,
  storySlug,
  title,
  description,
  className = '',
}: Pick<ShareButtonProps, 'storyId' | 'storySlug' | 'title' | 'description' | 'className'>) {
  const [copied, setCopied] = useState(false);
  const {
    copyToClipboard,
    shareWithNativeAPI,
    trackShare,
    generateShareUrl,
    generateShareText,
  } = useStoryShare();

  const shareUrl = generateShareUrl(storySlug);
  const shareText = generateShareText(title, description);
  const shareData = { url: shareUrl, title, text: shareText };

  const handleQuickShare = async () => {
    // Try native share first (mobile), fallback to copy
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      const success = await shareWithNativeAPI(shareData);
      if (success) {
        await trackShare(storyId, 'native');
      }
    } else {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopied(true);
        await trackShare(storyId, 'copy');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <button
      onClick={handleQuickShare}
      className={cn(
        'inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors',
        className
      )}
      title="Share this story"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Share2 className="h-3 w-3" />
      )}
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}