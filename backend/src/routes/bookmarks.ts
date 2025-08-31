import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const bookmarkToggleSchema = z.object({
  storyId: z.string().uuid(),
});

const bookmarkParamsSchema = z.object({
  storyId: z.string().uuid(),
});

// GET /api/bookmarks - Get all user bookmarks
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            publishedAt: true,
            averageRating: true,
            ratingCount: true,
            statistics: true,
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            authors: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.userBookmark.count({
      where: { userId },
    });

    res.json({
      success: true,
      data: bookmarks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch bookmarks',
      },
    });
  }
});

// POST /api/bookmarks/toggle - Toggle bookmark for a story
router.post('/toggle', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = bookmarkToggleSchema.parse(req.body);
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
          message: 'Cannot bookmark unpublished stories',
        },
      });
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    let isBookmarked: boolean;
    let bookmark = null;

    if (existingBookmark) {
      // Remove bookmark
      await prisma.userBookmark.delete({
        where: {
          userId_storyId: {
            userId,
            storyId,
          },
        },
      });
      isBookmarked = false;
    } else {
      // Add bookmark
      bookmark = await prisma.userBookmark.create({
        data: {
          userId,
          storyId,
        },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });
      isBookmarked = true;
    }

    res.json({
      success: true,
      data: {
        isBookmarked,
        bookmark,
        storyTitle: story.title,
      },
    });
  } catch (error: any) {
    console.error('Error toggling bookmark:', error);
    
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
        message: 'Failed to toggle bookmark',
      },
    });
  }
});

// GET /api/bookmarks/:storyId - Check if story is bookmarked
router.get('/:storyId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = bookmarkParamsSchema.parse(req.params);
    const userId = req.user.id;

    const bookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        bookmark,
      },
    });
  } catch (error: any) {
    console.error('Error checking bookmark status:', error);
    
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
        message: 'Failed to check bookmark status',
      },
    });
  }
});

// DELETE /api/bookmarks/:storyId - Remove specific bookmark
router.delete('/:storyId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = bookmarkParamsSchema.parse(req.params);
    const userId = req.user.id;

    const deleted = await prisma.userBookmark.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error: any) {
    console.error('Error deleting bookmark:', error);
    
    if (error.code === 'P2025') { // Prisma not found error
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Bookmark not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete bookmark',
      },
    });
  }
});

export default router;