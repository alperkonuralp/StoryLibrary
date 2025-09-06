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

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['STARTED', 'COMPLETED']).optional()
});

export const userProgressController = {
  // GET /api/users/progress - Get user reading progress
  getUserProgress: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required'
          }
        });
      }

      const { page, limit, status } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const userId = req.user.id;

      // Build where clause
      const where: any = { 
        userId,
        story: {
          deletedAt: null // Only include progress for active stories
        }
      };
      if (status) {
        where.status = status;
      }

      const [progressList, total] = await Promise.all([
        getPrismaClient().userReadingProgress.findMany({
          where,
          include: {
            story: {
              select: {
                id: true,
                title: true,
                shortDescription: true,
                slug: true,
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
                        slug: true
                      }
                    }
                  }
                },
                authors: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: [
            { lastReadAt: 'desc' }
          ]
        }),
        getPrismaClient().userReadingProgress.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);
      const startedCount = await getPrismaClient().userReadingProgress.count({
        where: { ...where, status: 'STARTED' }
      });
      const completedCount = await getPrismaClient().userReadingProgress.count({
        where: { ...where, status: 'COMPLETED' }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          progress: progressList,
          pagination: {
            page,
            limit,
            total,
            totalPages
          },
          summary: {
            total,
            started: startedCount,
            completed: completedCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch reading progress'
        }
      });
    }
  },

  // POST /api/users/progress - Update reading progress
  updateUserProgress: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required'
          }
        });
      }

      const validatedData = updateProgressSchema.parse(req.body);
      const { storyId, status, ...progressData } = validatedData;
      const userId = req.user.id;

      // Check if story exists and is published
      const story = await getPrismaClient().story.findFirst({
        where: {
          id: storyId,
          status: 'PUBLISHED',
          deletedAt: null
        }
      });

      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Published story not found'
          }
        });
      }

      // Prepare update data
      const updateData: any = {
        lastReadAt: new Date(),
        ...progressData
      };

      if (status) {
        updateData.status = status;
        if (status === 'COMPLETED') {
          updateData.completedAt = new Date();
          updateData.completionPercentage = 100;
        }
      }

      // Upsert progress record
      const progress = await getPrismaClient().userReadingProgress.upsert({
        where: {
          userId_storyId: {
            userId,
            storyId
          }
        },
        update: updateData,
        create: {
          userId,
          storyId,
          status: status || 'STARTED',
          lastReadAt: new Date(),
          ...progressData,
          ...(status === 'COMPLETED' && { 
            completedAt: new Date(),
            completionPercentage: 100
          })
        },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              averageRating: true,
              ratingCount: true
            }
          }
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: progress
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid progress data',
            details: error.errors
          }
        });
      }

      console.error('Error updating user progress:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update reading progress'
        }
      });
    }
  },

  // GET /api/users/completed - Get completed stories
  getCompletedStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required'
          }
        });
      }

      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const userId = req.user.id;

      const [completedStories, total] = await Promise.all([
        getPrismaClient().userReadingProgress.findMany({
          where: {
            userId,
            status: 'COMPLETED',
            story: {
              deletedAt: null
            }
          },
          include: {
            story: {
              include: {
                categories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                },
                authors: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                },
                series: {
                  include: {
                    series: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: [
            { completedAt: 'desc' }
          ]
        }),
        getPrismaClient().userReadingProgress.count({
          where: {
            userId,
            status: 'COMPLETED',
            story: {
              deletedAt: null
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          stories: completedStories,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      console.error('Error fetching completed stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch completed stories'
        }
      });
    }
  },

  // GET /api/users/ratings - Get user ratings
  getUserRatings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required'
          }
        });
      }

      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const userId = req.user.id;

      const [ratings, total] = await Promise.all([
        getPrismaClient().userStoryRating.findMany({
          where: {
            userId,
            story: {
              deletedAt: null
            }
          },
          include: {
            story: {
              select: {
                id: true,
                title: true,
                shortDescription: true,
                slug: true,
                publishedAt: true,
                averageRating: true,
                ratingCount: true,
                categories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                },
                authors: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: [
            { updatedAt: 'desc' }
          ]
        }),
        getPrismaClient().userStoryRating.count({
          where: {
            userId,
            story: {
              deletedAt: null
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);
      
      // Calculate user rating statistics
      const avgUserRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
        : 0;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          ratings,
          pagination: {
            page,
            limit,
            total,
            totalPages
          },
          summary: {
            total,
            averageRating: Number(avgUserRating.toFixed(2)),
            ratingDistribution: {
              5: ratings.filter(r => Number(r.rating) === 5).length,
              4: ratings.filter(r => Number(r.rating) === 4).length,
              3: ratings.filter(r => Number(r.rating) === 3).length,
              2: ratings.filter(r => Number(r.rating) === 2).length,
              1: ratings.filter(r => Number(r.rating) === 1).length,
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user ratings'
        }
      });
    }
  }
};