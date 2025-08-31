import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProgressSchema = z.object({
  storyId: z.string().uuid(),
  lastParagraph: z.number().int().min(0).optional(),
  totalParagraphs: z.number().int().min(1).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  readingTimeSeconds: z.number().int().min(0).optional(),
  wordsRead: z.number().int().min(0).optional(),
  language: z.enum(['en', 'tr']).optional(),
  status: z.enum(['STARTED', 'COMPLETED']).optional(),
});

const getProgressParamsSchema = z.object({
  storyId: z.string().uuid(),
});

// GET /api/progress/:storyId - Get reading progress for a specific story
router.get('/:storyId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = getProgressParamsSchema.parse(req.params);
    const userId = req.user.id;

    const progress = await prisma.userReadingProgress.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
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

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error fetching reading progress:', error);
    
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
        message: 'Failed to fetch reading progress',
      },
    });
  }
});

// POST/PUT /api/progress - Update reading progress
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      storyId, 
      lastParagraph, 
      totalParagraphs,
      completionPercentage,
      readingTimeSeconds,
      wordsRead,
      language,
      status 
    } = updateProgressSchema.parse(req.body);
    const userId = req.user.id;

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, status: true },
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
          message: 'Cannot track progress for unpublished stories',
        },
      });
    }

    const updateData: any = {
      lastReadAt: new Date(), // Always update last read time
    };
    
    if (lastParagraph !== undefined) updateData.lastParagraph = lastParagraph;
    if (totalParagraphs !== undefined) updateData.totalParagraphs = totalParagraphs;
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;
    if (readingTimeSeconds !== undefined) updateData.readingTimeSeconds = readingTimeSeconds;
    if (wordsRead !== undefined) updateData.wordsRead = wordsRead;
    if (language !== undefined) updateData.language = language;
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completionPercentage = 100; // Auto-set to 100% when completed
      }
    }

    const progress = await prisma.userReadingProgress.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
      update: updateData,
      create: {
        userId,
        storyId,
        status: status || 'STARTED',
        lastParagraph: lastParagraph || 0,
        totalParagraphs: totalParagraphs,
        completionPercentage: completionPercentage || 0,
        readingTimeSeconds: readingTimeSeconds || 0,
        wordsRead: wordsRead || 0,
        language: language,
        lastReadAt: new Date(),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
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

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error updating reading progress:', error);
    
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
        message: 'Failed to update reading progress',
      },
    });
  }
});

// GET /api/progress - Get all reading progress for the user
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause: any = { userId };
    if (status && (status === 'STARTED' || status === 'COMPLETED')) {
      whereClause.status = status;
    }

    const progressList = await prisma.userReadingProgress.findMany({
      where: whereClause,
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
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // STARTED first, then COMPLETED
        { startedAt: 'desc' }, // Most recent first
      ],
    });

    res.json({
      success: true,
      data: progressList,
      meta: {
        total: progressList.length,
        started: progressList.filter(p => p.status === 'STARTED').length,
        completed: progressList.filter(p => p.status === 'COMPLETED').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reading progress list:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reading progress',
      },
    });
  }
});

// DELETE /api/progress/:storyId - Remove reading progress
router.delete('/:storyId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = getProgressParamsSchema.parse(req.params);
    const userId = req.user.id;

    const deleted = await prisma.userReadingProgress.delete({
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
    console.error('Error deleting reading progress:', error);
    
    if (error.code === 'P2025') { // Prisma not found error
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reading progress not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete reading progress',
      },
    });
  }
});

export default router;