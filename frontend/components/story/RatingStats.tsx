'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { Star, Users, TrendingUp } from 'lucide-react';

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface RatingStatsProps {
  stats: RatingStats;
  variant?: 'card' | 'inline';
  showDistribution?: boolean;
  className?: string;
}

export function RatingStats({
  stats,
  variant = 'card',
  showDistribution = true,
  className = '',
}: RatingStatsProps) {
  const { averageRating, totalRatings, ratingDistribution } = stats;

  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  const renderDistributionBar = (rating: number, count: number) => {
    const percentage = getPercentage(count);
    
    return (
      <div key={rating} className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1 min-w-[60px]">
          <span className="text-gray-600">{rating}</span>
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        </div>
        
        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[100px]">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex items-center space-x-1 min-w-[60px] justify-end">
          <span className="text-gray-600">{count}</span>
          <span className="text-xs text-gray-500">({percentage}%)</span>
        </div>
      </div>
    );
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <StarRating rating={averageRating} readonly size="sm" showValue />
          <span className="text-sm text-gray-600">
            ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
          </span>
        </div>
        
        {showDistribution && totalRatings > 0 && (
          <div className="hidden md:flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {getPercentage(ratingDistribution[5] + ratingDistribution[4])}% positive
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span>Ratings & Reviews</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} readonly size="md" />
          <div className="flex items-center justify-center space-x-2 mt-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{totalRatings} review{totalRatings !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Rating Distribution */}
        {showDistribution && totalRatings > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) =>
                renderDistributionBar(rating, ratingDistribution[rating as keyof typeof ratingDistribution])
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {totalRatings > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {getPercentage(ratingDistribution[5] + ratingDistribution[4])}%
                </div>
                <div className="text-sm text-gray-600">Positive</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {Math.round(averageRating)}
                </div>
                <div className="text-sm text-gray-600">Average</div>
              </div>
            </div>
          </div>
        )}

        {/* No ratings message */}
        {totalRatings === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No ratings yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}