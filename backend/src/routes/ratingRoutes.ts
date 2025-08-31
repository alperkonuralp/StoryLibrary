import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
});

const ratingParamsSchema = z.object({
  storyId: z.string().uuid(),
});

// GET /api/stories/:storyId/rating - Get user's rating for a story
router.get('/:storyId/rating', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = ratingParamsSchema.parse(req.params);
    const userId = req.user.id;

    const rating = await prisma.userStoryRating.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: rating,
    });
  } catch (error: any) {
    console.error('Error fetching user rating:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch rating',
      },
    });
  }
});

// POST /api/stories/:storyId/rating - Submit or update rating
router.post('/:storyId/rating', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = ratingParamsSchema.parse(req.params);
    const { rating } = ratingSchema.parse(req.body);
    const userId = req.user.id;

    // Check if story exists and is published
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, status: true, title: true },
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
      });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot rate unpublished stories',
        },
      });
    }

    // Upsert user rating
    const userRating = await prisma.userStoryRating.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
      update: {
        rating,
        updatedAt: new Date(),
      },
      create: {
        userId,
        storyId,
        rating,
      },
    });

    // Update story's average rating
    await updateStoryAverageRating(storyId);

    res.json({
      success: true,
      data: userRating,
    });
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit rating',
      },
    });
  }
});

// GET /api/stories/:storyId/ratings - Get all ratings for a story
router.get('/:storyId/ratings', async (req, res) => {
  try {
    const { storyId } = ratingParamsSchema.parse(req.params);
    const { page = '1', limit = '20', sort = 'newest' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // newest first
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'lowest') {
      orderBy = { rating: 'asc' };
    }

    const ratings = await prisma.userStoryRating.findMany({
      where: { storyId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.userStoryRating.count({
      where: { storyId },
    });

    // Get rating statistics
    const ratingStats = await prisma.userStoryRating.groupBy({
      by: ['rating'],
      where: { storyId },
      _count: {
        rating: true,
      },
    });

    const distribution = [1, 2, 3, 4, 5].map(star => ({
      stars: star,
      count: ratingStats.find(stat => Number(stat.rating) === star)?._count.rating || 0,
    }));

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
      : 0;

    res.json({
      success: true,
      data: {
        ratings,
        statistics: {
          averageRating,
          totalCount,
          distribution,
        },
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching story ratings:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch ratings',
      },
    });
  }
});

// DELETE /api/stories/:storyId/rating - Delete user's rating
router.delete('/:storyId/rating', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = ratingParamsSchema.parse(req.params);
    const userId = req.user.id;

    await prisma.userStoryRating.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    // Update story's average rating
    await updateStoryAverageRating(storyId);

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error: any) {
    console.error('Error deleting rating:', error);
    
    if (error.code === 'P2025') { // Prisma not found error
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rating not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete rating',
      },
    });
  }
});

// Helper function to update story's average rating
async function updateStoryAverageRating(storyId: string) {
  const ratings = await prisma.userStoryRating.findMany({
    where: { storyId },
    select: { rating: true },
  });

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
    : null;

  const ratingCount = ratings.length;

  await prisma.story.update({
    where: { id: storyId },
    data: {
      averageRating,
      ratingCount,
    },
  });
}

export default router;