import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/constants';

const prisma = new PrismaClient();

// Validation schemas
const createStorySchema = z.object({
  title: z.record(z.string()).refine(obj => Object.keys(obj).length > 0, {
    message: "Title must have at least one language"
  }),
  shortDescription: z.record(z.string()).refine(obj => Object.keys(obj).length > 0, {
    message: "Short description must have at least one language"
  }),
  content: z.record(z.array(z.string())).refine(obj => Object.keys(obj).length > 0, {
    message: "Content must have at least one language"
  }),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  authorIds: z.array(z.string().uuid()).optional(),
  seriesId: z.string().uuid().optional(),
  orderInSeries: z.number().int().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  sourceInfo: z.object({
    siteName: z.string().optional(),
    originalUrl: z.string().url().optional(),
    scrapedAt: z.string().optional(),
    translator: z.string().optional()
  }).optional(),
  editorRating: z.number().min(0).max(5).optional(),
  metadata: z.record(z.any()).optional()
});

const updateStorySchema = createStorySchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const storyFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  seriesId: z.string().uuid().optional(),
  language: z.enum(['en', 'tr']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional()
});

const ratingSchema = z.object({
  rating: z.number().min(1).max(5)
});

export const storyController = {
  // GET /api/stories - Get all stories with filtering and pagination
  getStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, search, categoryId, tagId, authorId, seriesId, language, status } = 
        storyFilterSchema.parse(req.query);

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status) {
        where.status = status;
      } else {
        // Default to published for non-editors
        if (!req.user || req.user.role === 'USER') {
          where.status = 'PUBLISHED';
        }
      }

      if (search) {
        where.OR = [
          {
            title: {
              path: [language || 'en'],
              string_contains: search
            }
          },
          {
            shortDescription: {
              path: [language || 'en'],
              string_contains: search
            }
          }
        ];
      }

      if (categoryId) {
        where.categories = {
          some: {
            categoryId
          }
        };
      }

      if (tagId) {
        where.tags = {
          some: {
            tagId
          }
        };
      }

      if (authorId) {
        where.authors = {
          some: {
            authorId
          }
        };
      }

      if (seriesId) {
        where.series = {
          some: {
            seriesId
          }
        };
      }

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where,
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
              },
              orderBy: {
                orderInSeries: 'asc'
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
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.story.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

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
      console.error('Error fetching stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch stories'
        }
      });
    }
  },

  // GET /api/stories/:id - Get story by ID
  getStoryById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const story = await prisma.story.findUnique({
        where: { id },
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
          },
          ratings: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      });

      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      // Check if user can access draft stories
      if (story.status === 'DRAFT' && (!req.user || (req.user.role === 'USER' && story.createdBy !== req.user.id))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: story
      });
    } catch (error) {
      console.error('Error fetching story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch story'
        }
      });
    }
  },

  // GET /api/stories/slug/:slug - Get story by slug
  getStoryBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;

      const story = await prisma.story.findUnique({
        where: { slug },
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

      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      // Check if user can access draft stories
      if (story.status === 'DRAFT' && (!req.user || (req.user.role === 'USER' && story.createdBy !== req.user.id))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: story
      });
    } catch (error) {
      console.error('Error fetching story by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch story'
        }
      });
    }
  },

  // POST /api/stories - Create new story
  createStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can create stories'
          }
        });
      }

      const validatedData = createStorySchema.parse(req.body);
      const { categoryIds, tagIds, authorIds, seriesId, orderInSeries } = validatedData;

      // Generate slug from title (English first, then Turkish)
      const title = validatedData.title.en || validatedData.title.tr || Object.values(validatedData.title)[0];
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug already exists
      const existingStory = await prisma.story.findUnique({ where: { slug } });
      if (existingStory) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A story with this title already exists'
          }
        });
      }

      // Calculate statistics
      const statistics = {
        wordCount: {},
        charCount: {},
        estimatedReadingTime: {},
        sentenceCount: {}
      };

      for (const [lang, content] of Object.entries(validatedData.content)) {
        const text = content.join(' ');
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        const charCount = text.length;
        const sentenceCount = content.length;
        const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute

        statistics.wordCount[lang] = wordCount;
        statistics.charCount[lang] = charCount;
        statistics.estimatedReadingTime[lang] = estimatedReadingTime;
        statistics.sentenceCount[lang] = sentenceCount;
      }

      const story = await prisma.story.create({
        data: {
          title: validatedData.title,
          shortDescription: validatedData.shortDescription,
          content: validatedData.content,
          status: validatedData.status || 'DRAFT',
          sourceInfo: validatedData.sourceInfo,
          editorRating: validatedData.editorRating,
          metadata: validatedData.metadata,
          slug,
          statistics,
          createdBy: req.user!.id,
          // Connect categories
          categories: categoryIds ? {
            create: categoryIds.map(categoryId => ({ categoryId }))
          } : undefined,
          // Connect tags
          tags: tagIds ? {
            create: tagIds.map(tagId => ({ tagId }))
          } : undefined,
          // Connect authors
          authors: authorIds ? {
            create: authorIds.map(authorId => ({ authorId, role: 'author' }))
          } : undefined,
          // Connect series
          series: seriesId ? {
            create: { seriesId, orderInSeries: orderInSeries || 1 }
          } : undefined
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

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: story
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid story data',
            details: error.errors
          }
        });
      }

      console.error('Error creating story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create story'
        }
      });
    }
  },

  // PUT /api/stories/:id - Update story
  updateStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can update stories'
          }
        });
      }

      const existingStory = await prisma.story.findUnique({ where: { id } });
      if (!existingStory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      // Check if user can edit this story (editors can only edit their own stories unless admin)
      if (req.user.role === 'EDITOR' && existingStory.createdBy !== req.user.id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'You can only edit your own stories'
          }
        });
      }

      const validatedData = updateStorySchema.parse(req.body);
      const { categoryIds, tagIds, authorIds, seriesId, orderInSeries, ...storyData } = validatedData;

      // Update slug if title changed
      let slug = existingStory.slug;
      if (storyData.title) {
        const title = storyData.title.en || storyData.title.tr || Object.values(storyData.title)[0];
        const newSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (newSlug !== existingStory.slug) {
          const slugExists = await prisma.story.findFirst({
            where: { slug: newSlug, NOT: { id } }
          });
          if (slugExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'A story with this title already exists'
              }
            });
          }
          slug = newSlug;
        }
      }

      // Calculate statistics if content changed
      let statistics = existingStory.statistics;
      if (validatedData.content) {
        statistics = {
          wordCount: {},
          charCount: {},
          estimatedReadingTime: {},
          sentenceCount: {}
        };

        for (const [lang, content] of Object.entries(validatedData.content)) {
          const text = content.join(' ');
          const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
          const charCount = text.length;
          const sentenceCount = content.length;
          const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));

          statistics.wordCount[lang] = wordCount;
          statistics.charCount[lang] = charCount;
          statistics.estimatedReadingTime[lang] = estimatedReadingTime;
          statistics.sentenceCount[lang] = sentenceCount;
        }
      }

      // Delete existing relationships if updating
      if (categoryIds !== undefined) {
        await prisma.storyCategory.deleteMany({ where: { storyId: id } });
      }
      if (tagIds !== undefined) {
        await prisma.storyTag.deleteMany({ where: { storyId: id } });
      }
      if (authorIds !== undefined) {
        await prisma.storyAuthor.deleteMany({ where: { storyId: id } });
      }
      if (seriesId !== undefined) {
        await prisma.storySeries.deleteMany({ where: { storyId: id } });
      }

      const story = await prisma.story.update({
        where: { id },
        data: {
          ...storyData,
          slug,
          statistics,
          // Reconnect relationships
          categories: categoryIds ? {
            create: categoryIds.map(categoryId => ({ categoryId }))
          } : undefined,
          tags: tagIds ? {
            create: tagIds.map(tagId => ({ tagId }))
          } : undefined,
          authors: authorIds ? {
            create: authorIds.map(authorId => ({ authorId, role: 'author' }))
          } : undefined,
          series: seriesId ? {
            create: { seriesId, orderInSeries: orderInSeries || 1 }
          } : undefined
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
        data: story
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid story data',
            details: error.errors
          }
        });
      }

      console.error('Error updating story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update story'
        }
      });
    }
  },

  // DELETE /api/stories/:id - Delete story
  deleteStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can delete stories'
          }
        });
      }

      const story = await prisma.story.findUnique({ where: { id } });
      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      await prisma.story.delete({ where: { id } });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Story deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete story'
        }
      });
    }
  },

  // POST /api/stories/:id/publish - Publish story
  publishStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can publish stories'
          }
        });
      }

      const story = await prisma.story.findUnique({ where: { id } });
      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      // Check if user can publish this story
      if (req.user.role === 'EDITOR' && story.createdBy !== req.user.id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'You can only publish your own stories'
          }
        });
      }

      if (story.status === 'PUBLISHED') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Story is already published'
          }
        });
      }

      const updatedStory = await prisma.story.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
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
        data: updatedStory
      });
    } catch (error) {
      console.error('Error publishing story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to publish story'
        }
      });
    }
  },

  // POST /api/stories/:id/unpublish - Unpublish story
  unpublishStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can unpublish stories'
          }
        });
      }

      const story = await prisma.story.findUnique({ where: { id } });
      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      // Check if user can unpublish this story
      if (req.user.role === 'EDITOR' && story.createdBy !== req.user.id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'You can only unpublish your own stories'
          }
        });
      }

      if (story.status === 'DRAFT') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Story is already a draft'
          }
        });
      }

      const updatedStory = await prisma.story.update({
        where: { id },
        data: {
          status: 'DRAFT',
          publishedAt: null
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
        data: updatedStory
      });
    } catch (error) {
      console.error('Error unpublishing story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unpublish story'
        }
      });
    }
  },

  // POST /api/stories/:id/rate - Rate a story
  rateStory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'You must be logged in to rate stories'
          }
        });
      }

      const { rating } = ratingSchema.parse(req.body);

      const story = await prisma.story.findUnique({ where: { id } });
      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      if (story.status !== 'PUBLISHED') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'You can only rate published stories'
          }
        });
      }

      // Upsert user rating
      const userRating = await prisma.userStoryRating.upsert({
        where: {
          userId_storyId: {
            userId: req.user.id,
            storyId: id
          }
        },
        create: {
          userId: req.user.id,
          storyId: id,
          rating
        },
        update: {
          rating
        }
      });

      // Recalculate average rating
      const ratings = await prisma.userStoryRating.findMany({
        where: { storyId: id }
      });

      const averageRating = ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length;
      const ratingCount = ratings.length;

      // Update story with new average
      const updatedStory = await prisma.story.update({
        where: { id },
        data: {
          averageRating,
          ratingCount
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          rating: userRating,
          averageRating: updatedStory.averageRating,
          ratingCount: updatedStory.ratingCount
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid rating',
            details: error.errors
          }
        });
      }

      console.error('Error rating story:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to rate story'
        }
      });
    }
  },

  // GET /api/stories/top-rated - Get top rated stories
  getTopRatedStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const limitNum = Math.min(Number(limit), 50);

      const stories = await prisma.story.findMany({
        where: {
          status: 'PUBLISHED',
          averageRating: {
            gte: 1
          },
          ratingCount: {
            gte: 1
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
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: [
          { averageRating: 'desc' },
          { ratingCount: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: limitNum
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stories
      });
    } catch (error) {
      console.error('Error fetching top rated stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch top rated stories'
        }
      });
    }
  },

  // GET /api/stories/recent - Get recently published stories
  getRecentStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { days = 30, limit = 10 } = req.query;
      const daysNum = Math.min(Number(days), 365);
      const limitNum = Math.min(Number(limit), 50);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNum);

      const stories = await prisma.story.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: cutoffDate
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
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: [
          { publishedAt: 'desc' }
        ],
        take: limitNum
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stories
      });
    } catch (error) {
      console.error('Error fetching recent stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch recent stories'
        }
      });
    }
  }
};