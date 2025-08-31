'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useStory } from '@/hooks/useStories';
import { useStoryRating } from '@/hooks/useStoryRating';
import { RatingStats } from '@/components/story/RatingStats';
import { ReviewsList } from '@/components/story/ReviewsList';
import { RatingModal } from '@/components/story/RatingModal';
import { StarRating } from '@/components/story/StarRating';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function StoryRatingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);

  const { story, loading: storyLoading, error: storyError } = useStory({ 
    slug, 
    autoFetch: !!slug 
  });

  const {
    userRating,
    ratings,
    stats,
    loading: ratingsLoading,
    error: ratingsError,
    submitRating,
    updateRating,
    deleteRating,
    loadMoreRatings,
    hasMoreRatings,
  } = useStoryRating(story?.id || '');

  const handleRatingModalSubmit = async (rating: number, comment?: string) => {
    return await submitRating(rating, comment);
  };

  const handleRatingModalUpdate = async (rating: number, comment?: string) => {
    return await updateRating(rating, comment);
  };

  const handleRatingModalDelete = async () => {
    return await deleteRating();
  };

  if (storyLoading) {
    return (
      <div className=\"min-h-screen\">
        <header className=\"sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60\">
          <div className=\"container flex h-14 items-center\">
            <div className=\"mr-4 flex\">
              <Link className=\"mr-6 flex items-center space-x-2\" href=\"/\">
                <BookOpen className=\"h-6 w-6\" />
                <span className=\"font-bold\">Story Library</span>
              </Link>
            </div>
          </div>
        </header>
        
        <div className=\"container py-8\">
          <div className=\"animate-pulse space-y-4\">
            <div className=\"h-8 bg-gray-200 rounded w-1/3\"></div>
            <div className=\"h-4 bg-gray-200 rounded w-2/3\"></div>
            <div className=\"h-32 bg-gray-200 rounded\"></div>
          </div>
        </div>
      </div>
    );
  }

  if (storyError || !story) {
    return (
      <div className=\"min-h-screen\">
        <header className=\"sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60\">
          <div className=\"container flex h-14 items-center\">
            <div className=\"mr-4 flex\">
              <Link className=\"mr-6 flex items-center space-x-2\" href=\"/\">
                <BookOpen className=\"h-6 w-6\" />
                <span className=\"font-bold\">Story Library</span>
              </Link>
            </div>
          </div>
        </header>
        
        <div className=\"container py-16\">
          <div className=\"text-center\">
            <h1 className=\"text-4xl font-bold text-gray-900 mb-4\">Story Not Found</h1>
            <p className=\"text-gray-600 mb-8\">The story you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href=\"/stories\">Back to Stories</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen\">
      {/* Header */}
      <header className=\"sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60\">
        <div className=\"container flex h-14 items-center\">
          <div className=\"mr-4 flex\">
            <Link className=\"mr-6 flex items-center space-x-2\" href=\"/\">
              <BookOpen className=\"h-6 w-6\" />
              <span className=\"font-bold\">Story Library</span>
            </Link>
          </div>
          <div className=\"flex flex-1 items-center justify-between space-x-2 md:justify-end\">
            <nav className=\"flex items-center space-x-6 text-sm font-medium\">
              <Link href=\"/stories\">Stories</Link>
              <Link href=\"/authors\">Authors</Link>
              <Link href=\"/categories\">Categories</Link>
            </nav>
            <div className=\"flex items-center space-x-2\">
              <Button variant=\"ghost\" size=\"sm\" asChild>
                <Link href=\"/login\">Login</Link>
              </Button>
              <Button size=\"sm\" asChild>
                <Link href=\"/register\">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className=\"container py-4\">
        <div className=\"flex items-center justify-between\">
          <Button variant=\"ghost\" size=\"sm\" asChild>
            <Link href={`/stories/${slug}`} className=\"flex items-center gap-2\">
              <ArrowLeft className=\"h-4 w-4\" />
              Back to Story
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className=\"container pb-8\">
        <div className=\"max-w-4xl mx-auto space-y-6\">
          {/* Story Header */}
          <div className=\"text-center space-y-4\">
            <h1 className=\"text-3xl font-bold text-gray-900\">
              {story.title.en || story.title.tr}
            </h1>
            <p className=\"text-gray-600\">
              {story.shortDescription.en || story.shortDescription.tr}
            </p>
            
            {/* Quick Rating Display */}
            {stats && (
              <div className=\"flex items-center justify-center space-x-4\">
                <StarRating 
                  rating={stats.averageRating} 
                  readonly 
                  size=\"lg\" 
                  showValue 
                />
                <span className=\"text-gray-600\">
                  Based on {stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* User Rating Action */}
          {user && (
            <Card>
              <CardContent className=\"pt-6\">
                <div className=\"flex items-center justify-between\">
                  <div className=\"flex items-center space-x-4\">
                    <span className=\"font-medium\">Your Rating:</span>
                    {userRating ? (
                      <StarRating rating={userRating.rating} readonly size=\"md\" />
                    ) : (
                      <span className=\"text-gray-500\">Not rated yet</span>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowRatingModal(true)}
                    variant={userRating ? \"outline\" : \"default\"}
                  >
                    {userRating ? 'Update Rating' : 'Rate This Story'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
            {/* Rating Statistics */}
            <div className=\"lg:col-span-1\">
              {stats && (
                <RatingStats 
                  stats={stats} 
                  showDistribution={true}
                />
              )}
            </div>

            {/* Reviews List */}
            <div className=\"lg:col-span-2\">
              <Card>
                <CardHeader>
                  <CardTitle>
                    All Reviews ({ratings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ratingsError ? (
                    <div className=\"text-center text-red-600 py-8\">
                      <p>Failed to load reviews</p>
                      <p className=\"text-sm text-gray-500\">{ratingsError}</p>
                    </div>
                  ) : (
                    <ReviewsList
                      ratings={ratings}
                      loading={ratingsLoading}
                      hasMoreRatings={hasMoreRatings}
                      onLoadMore={loadMoreRatings}
                      currentUserId={user?.id}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        storyTitle={story.title.en || story.title.tr}
        existingRating={userRating}
        onSubmit={handleRatingModalSubmit}
        onUpdate={handleRatingModalUpdate}
        onDelete={handleRatingModalDelete}
        loading={ratingsLoading}
      />
    </div>
  );
}