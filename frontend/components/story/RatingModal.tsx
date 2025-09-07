'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { X, MessageCircle, Save, Trash2 } from 'lucide-react';

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

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyTitle: string;
  existingRating?: Rating | null;
  onSubmit: (rating: number, comment?: string) => Promise<boolean>;
  onUpdate?: (rating: number, comment?: string) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  loading?: boolean;
}

export function RatingModal({
  isOpen,
  onClose,
  storyTitle,
  existingRating,
  onSubmit,
  onUpdate,
  onDelete,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing rating data
  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingRating, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      let success = false;
      
      if (existingRating && onUpdate) {
        success = await onUpdate(rating, comment.trim() || undefined);
      } else {
        success = await onSubmit(rating, comment.trim() || undefined);
      }

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating || !onDelete) return;

    setIsSubmitting(true);

    try {
      const success = await onDelete();
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            {existingRating ? 'Update Your Rating' : 'Rate This Story'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Story Title */}
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-1">{storyTitle}</h3>
              <p className="text-sm text-gray-600">
                How would you rate this story?
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center space-y-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                className="justify-center"
              />
              <p className="text-sm text-gray-600">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label 
                htmlFor="comment" 
                className="block text-sm font-medium text-gray-700 flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Review (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your thoughts about this story..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              {existingRating && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Rating
                </Button>
              )}
              
              <div className="flex space-x-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={rating === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {existingRating ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {existingRating ? 'Update Rating' : 'Submit Rating'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}