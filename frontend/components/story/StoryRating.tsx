'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StoryRatingProps {
  storyId: string;
  initialRating?: number;
  averageRating?: number;
  ratingCount?: number;
  onRatingUpdate?: (newAverage: number, newCount: number) => void;
  className?: string;
}

interface UserRating {
  id: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export function StoryRating({
  storyId,
  initialRating,
  averageRating = 0,
  ratingCount = 0,
  onRatingUpdate,
  className
}: StoryRatingProps) {
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's existing rating
  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const response = await apiClient.request<UserRating>(`/stories/${storyId}/rating`, {
          method: 'GET',
        });
        if (response.success) {
          setUserRating(response.data);
        }
      } catch (err) {
        // No rating exists, which is fine
        setUserRating(null);
      }
    };

    fetchUserRating();
  }, [storyId]);

  const handleRating = async (rating: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.request<{ 
        userRating: UserRating;
        averageRating: number;
        ratingCount: number;
      }>(`/stories/${storyId}/rating`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      });

      if (response.success) {
        setUserRating(response.data.userRating);
        onRatingUpdate?.(response.data.averageRating, response.data.ratingCount);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rate story';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.request<{
        averageRating: number;
        ratingCount: number;
      }>(`/stories/${storyId}/rating`, {
        method: 'DELETE',
      });

      if (response.success) {
        setUserRating(null);
        onRatingUpdate?.(response.data.averageRating, response.data.ratingCount);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rating';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, isInteractive = false, isHover = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starIndex = index + 1;
      const isFilled = rating >= starIndex;
      const isHalfFilled = rating >= starIndex - 0.5 && rating < starIndex;

      return (
        <Star
          key={index}
          className={cn(
            'h-5 w-5 transition-colors',
            isInteractive && 'cursor-pointer hover:scale-110 transition-transform',
            isFilled || isHalfFilled
              ? 'fill-yellow-400 text-yellow-400'
              : isHover
                ? 'text-yellow-200'
                : 'text-gray-300'
          )}
          onClick={isInteractive ? () => handleRating(starIndex) : undefined}
          onMouseEnter={isInteractive ? () => setHoveredRating(starIndex) : undefined}
          onMouseLeave={isInteractive ? () => setHoveredRating(0) : undefined}
        />
      );
    });
  };

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="text-sm">Failed to load rating</p>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5" />
          Story Rating
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Rating Display */}
        {ratingCount > 0 && (
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="flex items-center gap-1">
              {renderStars(averageRating)}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="ml-1">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
            </div>
          </div>
        )}

        {/* User Rating Section */}
        <div className="space-y-3">
          {userRating ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Rating</span>
                <Badge variant="secondary">
                  {userRating.rating.toFixed(1)} stars
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {renderStars(userRating.rating, true, hoveredRating > 0)}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteRating}
                  disabled={loading}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Rated on {new Date(userRating.createdAt).toLocaleDateString()}
                {userRating.createdAt !== userRating.updatedAt && ' (updated)'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-sm font-medium">Rate this Story</span>
              <div className="flex items-center gap-1">
                {renderStars(hoveredRating, true, true)}
              </div>
              <p className="text-xs text-gray-500">
                Click a star to rate this story
              </p>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center text-sm text-gray-500">
            Updating rating...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StoryRating;