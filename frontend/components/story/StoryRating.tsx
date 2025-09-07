'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, Eye } from 'lucide-react';
import { useStoryRating } from '@/hooks/useStoryRating';
import { useAuth } from '@/hooks/useAuth';
import { StarRating } from './StarRating';
import { RatingModal } from './RatingModal';
import { RatingStats } from './RatingStats';
import { ReviewsList } from './ReviewsList';
import { cn } from '@/lib/utils';

interface StoryRatingProps {
  storyId: string;
  storyTitle: string;
  initialRating?: number;
  averageRating?: number;
  ratingCount?: number;
  onRatingUpdate?: (newAverage: number, newCount: number) => void;
  variant?: 'full' | 'compact' | 'sidebar';
  showReviews?: boolean;
  className?: string;
}

export function StoryRating({
  storyId,
  storyTitle,
  onRatingUpdate,
  variant = 'full',
  showReviews = true,
  className
}: StoryRatingProps) {
  const { user } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const {
    userRating,
    ratings,
    stats,
    loading,
    error,
    submitRating,
    updateRating,
    deleteRating,
    loadMoreRatings,
    hasMoreRatings,
  } = useStoryRating(storyId);

  const handleRatingSuccess = (newAverage: number, newCount: number) => {
    onRatingUpdate?.(newAverage, newCount);
  };

  // Handle rating modal
  const handleRatingModalSubmit = async (rating: number, comment?: string) => {
    const success = await submitRating(rating, comment);
    if (success && stats) {
      handleRatingSuccess(stats.averageRating, stats.totalRatings);
    }
    return success;
  };

  const handleRatingModalUpdate = async (rating: number, comment?: string) => {
    const success = await updateRating(rating, comment);
    if (success && stats) {
      handleRatingSuccess(stats.averageRating, stats.totalRatings);
    }
    return success;
  };

  const handleRatingModalDelete = async () => {
    const success = await deleteRating();
    if (success && stats) {
      handleRatingSuccess(stats.averageRating, stats.totalRatings);
    }
    return success;
  };

  if (loading && !stats) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading ratings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="text-sm">Failed to load ratings</p>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant for inline display
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-4", className)}>
        {stats && (
          <>
            <StarRating 
              rating={stats.averageRating} 
              readonly 
              size="sm" 
              showValue 
            />
            <span className="text-sm text-gray-600">
              ({stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''})
            </span>
          </>
        )}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRatingModal(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Star className="h-4 w-4 mr-1" />
            {userRating ? 'Update Rating' : 'Rate Story'}
          </Button>
        )}
      </div>
    );
  }

  // Sidebar variant for story page sidebar
  if (variant === 'sidebar') {
    return (
      <div className={cn("space-y-4", className)}>
        {stats && (
          <RatingStats 
            stats={stats} 
            showDistribution={false} 
          />
        )}
        
        {user && (
          <div className="space-y-2">
            <Button
              onClick={() => setShowRatingModal(true)}
              className="w-full"
              variant={userRating ? "outline" : "default"}
            >
              <Star className="h-4 w-4 mr-2" />
              {userRating ? 'Update Your Rating' : 'Rate This Story'}
            </Button>
            
            {userRating && (
              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  Your rating: {userRating.rating} stars
                </Badge>
              </div>
            )}
          </div>
        )}

        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          storyTitle={storyTitle}
          existingRating={userRating}
          onSubmit={handleRatingModalSubmit}
          onUpdate={handleRatingModalUpdate}
          onDelete={handleRatingModalDelete}
          loading={loading}
        />
      </div>
    );
  }

  // Full variant for comprehensive rating display
  return (
    <div className={cn("space-y-6", className)}>
      {/* Rating Stats */}
      {stats && (
        <RatingStats stats={stats} />
      )}

      {/* User Actions */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Rating</span>
              {userRating && (
                <Badge variant="secondary">
                  {userRating.rating} stars
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {userRating ? (
                  <StarRating rating={userRating.rating} readonly size="md" />
                ) : (
                  <span className="text-gray-500">Not rated yet</span>
                )}
              </div>
              <Button
                onClick={() => setShowRatingModal(true)}
                variant={userRating ? "outline" : "default"}
              >
                <Star className="h-4 w-4 mr-2" />
                {userRating ? 'Update Rating' : 'Rate Story'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      {showReviews && ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Reviews</span>
              </div>
              {ratings.length > 3 && !showAllReviews && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllReviews(true)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewsList
              ratings={showAllReviews ? ratings : ratings.slice(0, 3)}
              loading={loading}
              hasMoreRatings={hasMoreRatings && showAllReviews}
              onLoadMore={loadMoreRatings}
              currentUserId={user?.id || ''}
            />
          </CardContent>
        </Card>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        storyTitle={storyTitle}
        existingRating={userRating}
        onSubmit={handleRatingModalSubmit}
        onUpdate={handleRatingModalUpdate}
        onDelete={handleRatingModalDelete}
        loading={loading}
      />
    </div>
  );
}

export default StoryRating;