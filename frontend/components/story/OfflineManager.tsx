'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Trash2, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Eye,
  AlertCircle
} from 'lucide-react';
import { useOfflineReading } from '@/hooks/useOfflineReading';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface OfflineManagerProps {
  className?: string;
  compact?: boolean;
}

export function OfflineManager({ className = '', compact = false }: OfflineManagerProps) {
  const {
    offlineStories,
    isOnline,
    error,
    removeStory,
    clearAllOfflineStories,
    storageStats
  } = useOfflineReading();

  const [showClearDialog, setShowClearDialog] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sortedStories = [...offlineStories].sort((a, b) => 
    new Date(b.lastAccessedAt || b.downloadedAt).getTime() - 
    new Date(a.lastAccessedAt || a.downloadedAt).getTime()
  );

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Offline Stories
              <Badge variant="secondary">
                {offlineStories.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Storage Used</span>
              <span>{storageStats.formattedUsed} / {storageStats.formattedTotal}</span>
            </div>
            <Progress value={storageStats.usedPercentage} className="h-2" />
            
            {offlineStories.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sortedStories.slice(0, 3).map((story) => (
                  <div key={story.id} className="flex items-center justify-between p-2 border rounded text-xs">
                    <Link 
                      href={`/stories/${story.slug}`}
                      className="flex-1 truncate hover:underline"
                    >
                      {story.title.en || story.title.tr}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStory(story.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {offlineStories.length > 3 && (
                  <div className="text-center text-xs text-gray-500">
                    +{offlineStories.length - 3} more stories
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                No offline stories yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Storage Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Offline Storage
              </CardTitle>
              <CardDescription>
                Manage your downloaded stories for offline reading
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="default" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{storageStats.storiesCount}</div>
                <div className="text-sm text-gray-600">Stories Downloaded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{storageStats.formattedUsed}</div>
                <div className="text-sm text-gray-600">Space Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{storageStats.formattedAvailable}</div>
                <div className="text-sm text-gray-600">Space Available</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage Usage</span>
                <span>{Math.round(storageStats.usedPercentage)}%</span>
              </div>
              <Progress value={storageStats.usedPercentage} className="h-2" />
              <div className="text-xs text-gray-500">
                {storageStats.formattedUsed} of {storageStats.formattedTotal} used
              </div>
            </div>

            {storageStats.usedPercentage > 80 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Storage is running low. Consider removing some stories.</span>
              </div>
            )}

            {offlineStories.length > 0 && (
              <div className="flex justify-end">
                <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1">
                      <Trash2 className="h-3 w-3" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Offline Stories?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all {offlineStories.length} downloaded stories from your device. 
                        You can re-download them later when you're online.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          clearAllOfflineStories();
                          setShowClearDialog(false);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stories List */}
      <Card>
        <CardHeader>
          <CardTitle>Downloaded Stories</CardTitle>
          <CardDescription>
            {offlineStories.length === 0 
              ? "No stories downloaded yet"
              : `${offlineStories.length} story${offlineStories.length === 1 ? '' : 'ies'} available offline`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offlineStories.length === 0 ? (
            <div className="text-center py-12">
              <Download className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Offline Stories</h3>
              <p className="text-gray-600 mb-4">
                Download stories to read them offline when you don't have an internet connection.
              </p>
              <Link href="/stories">
                <Button>
                  Browse Stories
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStories.map((story) => (
                <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/stories/${story.slug}`}
                      className="font-medium hover:underline block"
                    >
                      {story.title.en || story.title.tr}
                    </Link>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {story.shortDescription.en || story.shortDescription.tr}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>Downloaded {formatDate(story.downloadedAt)}</span>
                      </div>
                      {story.lastAccessedAt && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>Last read {formatDate(story.lastAccessedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        <span>{(story.estimatedSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/stories/${story.slug}`}>
                      <Button variant="outline" size="sm">
                        Read
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStory(story.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflineManager;