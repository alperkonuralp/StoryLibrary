import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/constants';

let prisma: PrismaClient;

// Allow dependency injection for testing
const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// For testing - allow injecting a mock client
export const setPrismaClient = (client: PrismaClient): void => {
  prisma = client;
};

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const adminController = {
  // GET /api/admin/stories/deleted - Get all soft-deleted stories
  getDeletedStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can access deleted stories'
          }
        });
      }

      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const [stories, total] = await Promise.all([
        getPrismaClient().story.findMany({
          where: {
            deletedAt: {
              not: null // Only get soft-deleted stories
            }
          },
          include: {
            categories: {
              include: {
                category: true
              }
            },
            tags: {
              include: {
                tag: true
              }
            },
            authors: {
              include: {
                author: true
              }
            },
            series: {
              include: {
                series: true
              }
            },
            creator: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: [
            { deletedAt: 'desc' }
          ]
        }),
        getPrismaClient().story.count({
          where: {
            deletedAt: {
              not: null
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          stories,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      console.error('Error fetching deleted stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch deleted stories'
        }
      });
    }
  },

  // POST /api/admin/stories/:id/restore - Restore soft-deleted story
  restoreStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can restore deleted stories'
          }
        });
      }

      // Find the soft-deleted story
      const story = await getPrismaClient().story.findFirst({
        where: {
          id,
          deletedAt: {
            not: null // Only find soft-deleted stories
          }
        }
      });

      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deleted story not found'
          }
        });
      }

      // Restore the story by setting deletedAt to null
      const restoredStory = await getPrismaClient().story.update({
        where: { id },
        data: {
          deletedAt: null
        },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          authors: {
            include: {
              author: true
            }
          },
          series: {
            include: {
              series: true
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: restoredStory
      });
    } catch (error) {
      console.error('Error restoring story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to restore story'
        }
      });
    }
  },

  // DELETE /api/admin/stories/:id/permanent - Permanently delete story
  permanentDeleteStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can permanently delete stories'
          }
        });
      }

      // Find the soft-deleted story
      const story = await getPrismaClient().story.findFirst({
        where: {
          id,
          deletedAt: {
            not: null // Only permanently delete already soft-deleted stories
          }
        }
      });

      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deleted story not found or story is not deleted'
          }
        });
      }

      // Permanently delete the story (hard delete)
      await getPrismaClient().story.delete({
        where: { id }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Story permanently deleted successfully',
          deletedStory: {
            id: story.id,
            title: story.title,
            deletedAt: story.deletedAt
          }
        }
      });
    } catch (error) {
      console.error('Error permanently deleting story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to permanently delete story'
        }
      });
    }
  }
};