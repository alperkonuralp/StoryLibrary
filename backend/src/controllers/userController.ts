import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { HTTP_STATUS } from '../utils/constants';

let prisma = new PrismaClient();

// For testing dependency injection
export const setPrismaClient = (client: PrismaClient): void => {
  prisma = client;
};

// Validation schemas
const updateProfileSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    preferences: z.object({
      language: z.enum(['en', 'tr']).optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      readingMode: z.enum(['english', 'turkish', 'bilingual']).optional()
    }).optional()
  }).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100)
});

const updateReadingProgressSchema = z.object({
  storyId: z.string().uuid(),
  lastParagraph: z.number().int().min(0),
  status: z.enum(['STARTED', 'COMPLETED'])
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const userController = {
  // GET /api/users - Get all users (Admin only)
  getAllUsers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Access denied. Admin role required.'
          }
        });
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stories: true,
              ratings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch users'
        }
      });
    }
  },

  // PUT /api/users/:id - Update user (Admin only)
  updateUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Access denied. Admin role required.'
          }
        });
      }

      const { id } = req.params;
      const { username, email, role, profile } = req.body;

      // Get existing user to validate existence and get profile data
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          profile: true
        }
      });

      if (!existingUser) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Merge existing profile with new profile data, but clean up any malformed data
      const cleanExistingProfile = existingUser?.profile as any;
      let baseProfile = {};
      
      // If existing profile exists and is an object, extract only valid profile fields
      if (cleanExistingProfile && typeof cleanExistingProfile === 'object') {
        const validFields = ['firstName', 'lastName', 'bio'];
        baseProfile = validFields.reduce((acc, field) => {
          if (cleanExistingProfile[field]) {
            acc[field] = cleanExistingProfile[field];
          }
          return acc;
        }, {} as any);
      }
      
      const updatedProfile = profile ? {
        ...baseProfile,
        ...profile
      } : baseProfile;

      // Update user with all data including profile
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(username && { username }),
          ...(email && { email }),
          ...(role && { role }),
          ...(profile && { profile: updatedProfile })
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update user'
        }
      });
    }
  },

  // DELETE /api/users/:id - Delete user (Admin only)
  deleteUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Access denied. Admin role required.'
          }
        });
      }

      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === req.user.id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'SELF_DELETE_ERROR',
            message: 'Cannot delete your own account'
          }
        });
      }

      // Validate the user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Delete user (this will cascade delete related data due to Prisma schema)
      await prisma.user.delete({
        where: { id }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { message: 'User deleted successfully' }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to delete user'
        }
      });
    }
  },

  // GET /api/users/profile - Get current user profile
  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user profile'
        }
      });
    }
  },

  // PUT /api/users/profile - Update current user profile
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const validatedData = updateProfileSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: validatedData,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            details: error.errors
          }
        });
      }

      console.error('Error updating user profile:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user profile'
        }
      });
    }
  },

  // PUT /api/users/password - Change user password
  changePassword: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.passwordHash) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password is incorrect'
          }
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          passwordHash: newPasswordHash
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Password changed successfully'
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid password data',
            details: error.errors
          }
        });
      }

      console.error('Error changing password:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to change password'
        }
      });
    }
  },

  // GET /api/users/progress - Get user's reading progress
  getReadingProgress: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const { page, limit } = paginationSchema.parse(req.query);
      const { status } = req.query;
      const skip = (page - 1) * limit;

      const where: any = { userId: req.user.id };
      if (status && ['STARTED', 'COMPLETED'].includes(status as string)) {
        where.status = status;
      }

      const [progress, total] = await Promise.all([
        prisma.userReadingProgress.findMany({
          where,
          include: {
            story: {
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
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: [
            { completedAt: 'desc' },
            { startedAt: 'desc' }
          ]
        }),
        prisma.userReadingProgress.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: progress,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching reading progress:', error);
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
  updateReadingProgress: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const { storyId, lastParagraph, status } = updateReadingProgressSchema.parse(req.body);

      // Check if story exists and is published
      const story = await prisma.story.findUnique({
        where: { id: storyId }
      });

      if (!story || story.status !== 'PUBLISHED') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found or not published'
          }
        });
      }

      const progressData: any = {
        lastParagraph,
        status
      };

      if (status === 'COMPLETED') {
        progressData.completedAt = new Date();
      }

      const progress = await prisma.userReadingProgress.upsert({
        where: {
          userId_storyId: {
            userId: req.user.id,
            storyId
          }
        },
        create: {
          userId: req.user.id,
          storyId,
          ...progressData
        },
        update: progressData,
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              statistics: true
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

      console.error('Error updating reading progress:', error);
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
            message: 'Not authenticated'
          }
        });
      }

      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const [progress, total] = await Promise.all([
        prisma.userReadingProgress.findMany({
          where: {
            userId: req.user.id,
            status: 'COMPLETED'
          },
          include: {
            story: {
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
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            completedAt: 'desc'
          }
        }),
        prisma.userReadingProgress.count({
          where: {
            userId: req.user.id,
            status: 'COMPLETED'
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);
      const stories = progress.map(p => p.story);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stories,
        pagination: {
          page,
          limit,
          total,
          totalPages
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

  // GET /api/users/ratings - Get user's story ratings
  getUserRatings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const [ratings, total] = await Promise.all([
        prisma.userStoryRating.findMany({
          where: { userId: req.user.id },
          include: {
            story: {
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
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.userStoryRating.count({
          where: { userId: req.user.id }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: ratings,
        pagination: {
          page,
          limit,
          total,
          totalPages
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
  },

  // GET /api/users/stats - Get user statistics
  getUserStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const [
        totalStarted,
        totalCompleted,
        totalRatings,
        averageRating,
        recentProgress
      ] = await Promise.all([
        prisma.userReadingProgress.count({
          where: { userId: req.user.id }
        }),
        prisma.userReadingProgress.count({
          where: { userId: req.user.id, status: 'COMPLETED' }
        }),
        prisma.userStoryRating.count({
          where: { userId: req.user.id }
        }),
        prisma.userStoryRating.aggregate({
          where: { userId: req.user.id },
          _avg: { rating: true }
        }),
        prisma.userReadingProgress.findMany({
          where: { userId: req.user.id },
          include: {
            story: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          },
          take: 5,
          orderBy: [
            { completedAt: 'desc' },
            { startedAt: 'desc' }
          ]
        })
      ]);

      const stats = {
        totalStoriesStarted: totalStarted,
        totalStoriesCompleted: totalCompleted,
        completionRate: totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0,
        totalRatings,
        averageRating: averageRating._avg.rating || 0,
        recentProgress
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user statistics'
        }
      });
    }
  },

  // DELETE /api/users/account - Delete user account
  // GET /api/users/:id - Get user by ID (Admin or own profile)
  getUserById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const userId = req.params.id;
      
      // Allow admin to view any user, or user to view their own profile
      if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Access denied'
          }
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stories: true,
              ratings: true
            }
          }
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user'
        }
      });
    }
  },

  // GET /api/users/progress - Get user reading progress
  getUserProgress: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const progress = await prisma.userReadingProgress.findMany({
        where: { userId: req.user.id },
        include: {
          story: {
            select: {
              id: true,
              slug: true,
              title: true,
              statistics: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch progress'
        }
      });
    }
  },

  // POST /api/users/progress - Update user reading progress
  updateUserProgress: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const validation = updateReadingProgressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validation.error.errors
          }
        });
      }

      const { storyId, lastParagraph, status } = validation.data;

      const progress = await prisma.userReadingProgress.upsert({
        where: {
          userId_storyId: {
            userId: req.user.id,
            storyId
          }
        },
        create: {
          userId: req.user.id,
          storyId,
          lastParagraph,
          status,
          completionPercentage: status === 'COMPLETED' ? 100 : 0,
          readingTimeSeconds: 0
        },
        update: {
          lastParagraph,
          status,
          completionPercentage: status === 'COMPLETED' ? 100 : 0,
          completedAt: status === 'COMPLETED' ? new Date() : null
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update progress'
        }
      });
    }
  },

  // POST /api/users/ratings - Submit story rating
  submitRating: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      const { storyId, rating, comment } = req.body;

      if (!storyId || !rating) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Story ID and rating are required'
          }
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rating must be between 1 and 5'
          }
        });
      }

      const ratingRecord = await prisma.userStoryRating.upsert({
        where: {
          userId_storyId: {
            userId: req.user.id,
            storyId
          }
        },
        create: {
          userId: req.user.id,
          storyId,
          rating
        },
        update: {
          rating
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: ratingRecord
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit rating'
        }
      });
    }
  },

  deleteAccount: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Not authenticated'
          }
        });
      }

      // Delete user and all related data (cascading deletes will handle the rest)
      await prisma.user.delete({
        where: { id: req.user.id }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Account deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete account'
        }
      });
    }
  }
};