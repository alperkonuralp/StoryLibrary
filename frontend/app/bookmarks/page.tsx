'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, Star, Trash2, Bookmark, Clock, User } from 'lucide-react';
import { useAllBookmarks, type Bookmark } from '@/hooks/useBookmarks';
import { apiClient } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { cn } from '@/lib/utils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (storyId: string) => void;
}

function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const handleDelete = async () => {
    if (onDelete) {
      try {
        await apiClient.removeBookmark(bookmark.storyId);
        onDelete(bookmark.storyId);
      } catch (err) {
        console.error('Failed to delete bookmark:', err);
      }
    }
  };

  const displayLanguage = 'en'; // Could be made dynamic
  const title = bookmark.story.title[displayLanguage] || bookmark.story.title.tr || 'Untitled Story';
  const description = bookmark.story.shortDescription?.[displayLanguage] || bookmark.story.shortDescription?.tr || '';
  const authorNames = bookmark.story.authors.map(a => a.author.name).join(', ');
  const categoryNames = bookmark.story.categories.map(c => c.category.name[displayLanguage] || c.category.name.tr || 'Unknown').join(', ');

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant="outline">
              <Bookmark className="h-3 w-3 mr-1" />
              Saved
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Story Details */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {authorNames && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-32">{authorNames}</span>
              </div>
            )}
            {bookmark.story.averageRating && bookmark.story.ratingCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{Number(bookmark.story.averageRating).toFixed(1)} ({bookmark.story.ratingCount})</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories and Reading Time */}
        <div className="flex flex-wrap gap-2">
          {categoryNames && (
            <Badge variant="secondary" className="text-xs">
              {categoryNames}
            </Badge>
          )}
          {bookmark.story.statistics?.estimatedReadingTime?.[displayLanguage] && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {bookmark.story.statistics.estimatedReadingTime[displayLanguage]} min read
            </Badge>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/stories/${bookmark.story.slug}`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Read Story
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Bookmark Date */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Bookmarked on {new Date(bookmark.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookmarksPage() {
  const { bookmarks, loading, error, refetch } = useAllBookmarks();

  const handleDeleteBookmark = (storyId: string) => {
    // Optimistically update the UI
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navigation />

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
          <p className="text-gray-600">
            Stories you've saved for later reading
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
                  <p className="text-3xl font-bold text-blue-600">{bookmarks.length}</p>
                </div>
                <Bookmark className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookmarks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p className="text-sm">Failed to load bookmarks</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
                <Button variant="outline" onClick={refetch} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : bookmarks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookmarks yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Save stories you want to read later by clicking the bookmark button
                </p>
                <Button asChild>
                  <Link href="/stories">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Stories
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDeleteBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}