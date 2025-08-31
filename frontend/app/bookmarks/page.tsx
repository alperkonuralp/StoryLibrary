'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Bookmark, 
  BookmarkX,
  Search,
  Star,
  Clock,
  Filter,
  MoreVertical,
  Calendar,
  Tag,
  User
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function BookmarksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { bookmarks, loading, error, pagination, fetchBookmarks, removeBookmark } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState(bookmarks);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load bookmarks on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks(1, 20);
    }
  }, [isAuthenticated, fetchBookmarks]);

  // Filter bookmarks based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookmarks(bookmarks);
      return;
    }

    const filtered = bookmarks.filter(bookmark => {
      const title = (bookmark.story.title.en || bookmark.story.title.tr || '').toLowerCase();
      const description = (bookmark.story.shortDescription.en || bookmark.story.shortDescription.tr || '').toLowerCase();
      const authorNames = bookmark.story.authors.map(a => a.author.name.toLowerCase());
      const categoryNames = bookmark.story.categories.map(c => (c.category.name.en || c.category.name.tr || '').toLowerCase());
      
      const searchTerm = searchQuery.toLowerCase();
      
      return title.includes(searchTerm) || 
             description.includes(searchTerm) ||
             authorNames.some(name => name.includes(searchTerm)) ||
             categoryNames.some(name => name.includes(searchTerm));
    });

    setFilteredBookmarks(filtered);
  }, [searchQuery, bookmarks]);

  const handleRemoveBookmark = async (storyId: string) => {
    if (confirm('Remove this story from your bookmarks?')) {
      await removeBookmark(storyId);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (statistics: any): string => {
    if (!statistics) return '';
    
    const wordCount = statistics.wordCount?.en || statistics.wordCount?.tr || 0;
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    
    return `${readingTimeMinutes} min read`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading && bookmarks.length === 0) {
    return (
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your bookmarks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Bookmarks</h1>
          <p className="text-gray-600">
            {pagination.total > 0 
              ? `${pagination.total} saved ${pagination.total === 1 ? 'story' : 'stories'}`
              : 'No bookmarks yet'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <span className="text-sm text-gray-500">
                {filteredBookmarks.length} of {bookmarks.length}
              </span>
            </div>
          </div>
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length > 0 ? (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-4">
                      {/* Title and Description */}
                      <div className="mb-3">
                        <Link href={`/stories/${bookmark.story.slug}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1">
                            {bookmark.story.title.en || bookmark.story.title.tr}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {bookmark.story.shortDescription.en || bookmark.story.shortDescription.tr}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        {/* Authors */}
                        {bookmark.story.authors.length > 0 && (
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            <span>
                              {bookmark.story.authors.map(a => a.author.name).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Reading Time */}
                        {bookmark.story.statistics && (
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>{getReadingTime(bookmark.story.statistics)}</span>
                          </div>
                        )}

                        {/* Rating */}
                        {bookmark.story.averageRating && (
                          <div className="flex items-center">
                            <Star className="mr-1 h-3 w-3 text-yellow-400 fill-current" />
                            <span>{Number(bookmark.story.averageRating).toFixed(1)}</span>
                            <span className="ml-1">({bookmark.story.ratingCount})</span>
                          </div>
                        )}

                        {/* Bookmark Date */}
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>Saved {formatDate(bookmark.createdAt)}</span>
                        </div>
                      </div>

                      {/* Categories */}
                      {bookmark.story.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {bookmark.story.categories.slice(0, 3).map((storyCategory) => (
                            <Badge key={storyCategory.category.id} variant="secondary" className="text-xs">
                              <Tag className="mr-1 h-2 w-2" />
                              {storyCategory.category.name.en || storyCategory.category.name.tr}
                            </Badge>
                          ))}
                          {bookmark.story.categories.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{bookmark.story.categories.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Menu */}
                    <div className="flex items-start gap-2">
                      <Link href={`/stories/${bookmark.story.slug}`}>
                        <Button size="sm">
                          Read Story
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveBookmark(bookmark.storyId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <Bookmark className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start exploring stories and bookmark your favorites to keep track of what you want to read.
            </p>
            <Link href="/stories">
              <Button>
                Browse Stories
              </Button>
            </Link>
          </div>
        ) : (
          // No search results
          <div className="text-center py-12">
            <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or clear the search to see all bookmarks.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => fetchBookmarks()}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}