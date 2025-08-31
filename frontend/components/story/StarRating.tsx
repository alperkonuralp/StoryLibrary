'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showValue = false,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const starSize = sizeClasses[size];
  const displayRating = hoverRating || rating;

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayRating;
          const isPartiallyFilled = 
            starValue > Math.floor(displayRating) && 
            starValue <= Math.ceil(displayRating) && 
            displayRating % 1 !== 0;

          return (
            <button
              key={starValue}
              type="button"
              disabled={readonly}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              className={`relative ${
                readonly 
                  ? 'cursor-default' 
                  : 'cursor-pointer hover:scale-110 transition-transform duration-150'
              } ${!readonly ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded' : ''}`}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSize} transition-colors duration-150 ${
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400'
                    : isPartiallyFilled
                    ? 'text-yellow-400 fill-yellow-200'
                    : readonly
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className={`text-gray-600 ml-1 ${
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        }`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}