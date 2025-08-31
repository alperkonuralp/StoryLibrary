'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { MessageCircle, User, Calendar, MoreVertical } from 'lucide-react';

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReviewsListProps {
  ratings: Rating[];
  loading?: boolean;
  hasMoreRatings?: boolean;
  onLoadMore?: () => void;
  currentUserId?: string;
  className?: string;
}

export function ReviewsList({
  ratings,
  loading = false,
  hasMoreRatings = false,
  onLoadMore,
  currentUserId,
  className = '',
}: ReviewsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (ratings.length === 0 && !loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No reviews yet</p>
        <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ratings.map((rating) => {
        const isOwnReview = currentUserId && rating.user.id === currentUserId;
        
        return (
          <Card key={rating.id} className="relative">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800">
                      {getInitials(rating.user.name)}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {rating.user.name}
                      </h4>
                      {isOwnReview && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Your Review
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(rating.createdAt)}</span>
                      {rating.updatedAt !== rating.createdAt && (
                        <span className="text-xs">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-end">
                  <StarRating rating={rating.rating} readonly size="sm" />
                  <span className="text-sm text-gray-600 mt-1">
                    {rating.rating}.0
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              {rating.comment && (
                <div className="mt-3">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {rating.comment}
                  </p>
                </div>
              )}

              {/* Actions for own review */}
              {isOwnReview && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      <MoreVertical className="h-3 w-3 mr-1" />
                      Edit Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Load More Button */}
      {hasMoreRatings && !loading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}