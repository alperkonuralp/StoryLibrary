'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StoryReader } from '@/components/story/StoryReader';
import { ProgressTracker } from '@/components/story/ProgressTracker';
import { StoryRating } from '@/components/story/StoryRating';
import { BookOpen, ArrowLeft, Heart, Share2, Bookmark, Star, UserPlus } from 'lucide-react';
import { useStory } from '@/hooks/useStories';
import { useStoryBookmark } from '@/hooks/useBookmarks';
import { ShareButton } from '@/components/social/ShareButton';
import { FollowButton } from '@/components/social/FollowButton';
import { OfflineButton } from '@/components/story/OfflineButton';
import Navigation from '@/components/Navigation';
import type { DisplayMode } from '@/types';
export default function StoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [readingMode, setReadingMode] = useState<DisplayMode>('bilingual');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [storyRating, setStoryRating] = useState({
    average: 0,
    count: 0,
  });

  // Fetch story from API using slug
  const { story, loading, error } = useStory({ slug, autoFetch: !!slug });
  
  // Bookmark functionality
  const {
    isBookmarked,
    loading: bookmarkLoading,
    toggleBookmark,
    error: bookmarkError,
  } = useStoryBookmark(story?.id);

  const handleModeChange = (mode: DisplayMode) => {
    setReadingMode(mode);
    // Save preference to localStorage
    localStorage.setItem('preferredReadingMode', mode);
  };

  const handleProgressUpdate = (paragraph: number) => {
    setCurrentProgress(paragraph);
  };

  const handleRatingUpdate = (newAverage: number, newCount: number) => {
    setStoryRating({ average: newAverage, count: newCount });
  };

  const handleBookmark = async () => {
    try {
      await toggleBookmark();
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // You could show a toast notification here
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story.title.en,
        text: story.shortDescription.en,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
      alert('Link copied to clipboard!');
    }
  };

  // Load reading mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('preferredReadingMode') as DisplayMode;
    if (savedMode) {
      setReadingMode(savedMode);
    }
  }, []);

  // Initialize rating data when story loads
  useEffect(() => {
    if (story) {
      setStoryRating({
        average: story.averageRating || 0,
        count: story.ratingCount || 0,
      });
    }
  }, [story]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        
        {/* Loading State */}
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!loading && !story)) {
    return (
      <div className="min-h-screen">
        <Navigation />
        
        {/* Not Found / Error */}
        <div className="container py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {error ? 'Error Loading Story' : 'Story Not Found'}
            </h1>
            <p className="text-gray-600 mb-8">
              {error || 'The story you\'re looking for doesn\'t exist or has been removed.'}
            </p>
            <Button asChild>
              <Link href="/stories">Back to Stories</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Navigation */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/stories" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Stories
            </Link>
          </Button>
          
          <div className="flex items-center space-x-2">
            <OfflineButton 
              storyId={story.id}
              size="sm"
              variant="outline"
              showText={true}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={`flex items-center gap-2 ${isBookmarked ? 'text-blue-600' : ''}`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              {bookmarkLoading ? 'Loading...' : isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            
            <ShareButton
              storyId={story.id}
              storySlug={story.slug}
              title={story.title.en || story.title.tr}
              description={story.shortDescription.en || story.shortDescription.tr}
              size="sm"
              variant="ghost"
            />
            
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex items-center gap-2"
            >
              <Link href={`/stories/${slug}/ratings`}>
                <Star className="h-4 w-4" />
                Reviews
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="container pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Story Reader */}
          <div className="lg:col-span-3">
            <StoryReader
              story={story}
              initialMode={readingMode}
              onModeChange={handleModeChange}
              showHeader={true}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>

          {/* Sidebar with Progress and Rating */}
          <div className="lg:col-span-1 space-y-4">
            {/* Author Info */}
            {story.authors && story.authors.length > 0 && (
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {story.authors.length === 1 ? 'Author' : 'Authors'}
                </h3>
                <div className="space-y-3">
                  {story.authors.map((authorRef, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserPlus className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <Link
                            href={`/authors/${authorRef.author.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 text-sm"
                          >
                            {authorRef.author.name}
                          </Link>
                          {authorRef.role && (
                            <div className="text-xs text-gray-500 capitalize">
                              {authorRef.role}
                            </div>
                          )}
                        </div>
                      </div>
                      <FollowButton
                        authorId={authorRef.author.slug}
                        authorName={authorRef.author.name}
                        size="sm"
                        variant="outline"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ProgressTracker
              storyId={story.id}
              totalParagraphs={story.content?.en?.length || 0}
              currentParagraph={currentProgress}
              onProgressUpdate={handleProgressUpdate}
            />
            
            <StoryRating
              storyId={story.id}
              storyTitle={story.title.en || story.title.tr}
              averageRating={storyRating.average}
              ratingCount={storyRating.count}
              onRatingUpdate={handleRatingUpdate}
              variant="sidebar"
              showReviews={false}
            />
          </div>
        </div>
      </div>

      {/* Progress indicator - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Reading Progress</span>
            <span>{Math.round((currentProgress / (story.content.en?.length || 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentProgress / (story.content.en?.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}