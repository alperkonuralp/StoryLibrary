import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/constants';

let prisma = new PrismaClient();

// For testing dependency injection
export const setPrismaClient = (client: PrismaClient): void => {
  prisma = client;
};

// Validation schemas
const createSeriesSchema = z.object({
  name: z.record(z.string()).refine(obj => Object.keys(obj).length > 0, {
    message: "Name must have at least one language"
  }),
  description: z.record(z.string()).optional()
});

const updateSeriesSchema = createSeriesSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const seriesFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  language: z.enum(['en', 'tr']).optional()
});

export const seriesController = {
  // GET /api/series - Get all series
  getSeries: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, search, language } = seriesFilterSchema.parse(req.query);
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          {
            name: {
              path: [language || 'en'],
              string_contains: search
            }
          },
          {
            description: {
              path: [language || 'en'],
              string_contains: search
            }
          }
        ];
      }

      const [series, total] = await Promise.all([
        prisma.series.findMany({
          where,
          include: {
            stories: {
              where: {
                story: {
                  status: 'PUBLISHED'
                }
              },
              include: {
                story: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    publishedAt: true,
                    statistics: true
                  }
                }
              },
              orderBy: {
                orderInSeries: 'asc'
              }
            },
            _count: {
              select: {
                stories: {
                  where: {
                    story: {
                      status: 'PUBLISHED'
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          }
        }),
        prisma.series.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: series,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching series:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch series'
        }
      });
    }
  },

  // GET /api/series/:id - Get series by ID
  getSeriesById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const series = await prisma.series.findUnique({
        where: { id },
        include: {
          stories: {
            where: {
              story: {
                status: 'PUBLISHED'
              }
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
                  },
                  creator: {
                    select: {
                      id: true,
                      username: true,
                      email: true
                    }
                  }
                }
              }
            },
            orderBy: {
              orderInSeries: 'asc'
            }
          },
          _count: {
            select: {
              stories: {
                where: {
                  story: {
                    status: 'PUBLISHED'
                  }
                }
              }
            }
          }
        }
      });

      if (!series) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Series not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: series
      });
    } catch (error) {
      console.error('Error fetching series:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch series'
        }
      });
    }
  },

  // GET /api/series/slug/:slug - Get series by slug
  getSeriesBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;

      const series = await prisma.series.findUnique({
        where: { slug },
        include: {
          stories: {
            where: {
              story: {
                status: 'PUBLISHED'
              }
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
                  },
                  creator: {
                    select: {
                      id: true,
                      username: true,
                      email: true
                    }
                  }
                }
              }
            },
            orderBy: {
              orderInSeries: 'asc'
            }
          },
          _count: {
            select: {
              stories: {
                where: {
                  story: {
                    status: 'PUBLISHED'
                  }
                }
              }
            }
          }
        }
      });

      if (!series) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Series not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: series
      });
    } catch (error) {
      console.error('Error fetching series by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch series'
        }
      });
    }
  },

  // POST /api/series - Create new series
  createSeries: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can create series'
          }
        });
      }

      const validatedData = createSeriesSchema.parse(req.body);

      // Generate slug from name (English first, then Turkish)
      const name = validatedData.name.en || validatedData.name.tr || Object.values(validatedData.name)[0];
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug already exists
      const existingSeries = await prisma.series.findUnique({ where: { slug } });
      if (existingSeries) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A series with this name already exists'
          }
        });
      }

      const series = await prisma.series.create({
        data: {
          name: validatedData.name!,
          description: validatedData.description,
          slug
        },
        include: {
          _count: {
            select: {
              stories: {
                where: {
                  story: {
                    status: 'PUBLISHED'
                  }
                }
              }
            }
          }
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: series
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid series data',
            details: error.errors
          }
        });
      }

      console.error('Error creating series:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create series'
        }
      });
    }
  },

  // PUT /api/series/:id - Update series
  updateSeries: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can update series'
          }
        });
      }

      const existingSeries = await prisma.series.findUnique({ where: { id } });
      if (!existingSeries) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Series not found'
          }
        });
      }

      const validatedData = updateSeriesSchema.parse(req.body);

      // Update slug if name changed
      let slug = existingSeries.slug;
      if (validatedData.name) {
        const name = validatedData.name.en || validatedData.name.tr || Object.values(validatedData.name)[0];
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (newSlug !== existingSeries.slug) {
          const slugExists = await prisma.series.findFirst({
            where: { slug: newSlug, NOT: { id } }
          });
          if (slugExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'A series with this name already exists'
              }
            });
          }
          slug = newSlug;
        }
      }

      const series = await prisma.series.update({
        where: { id },
        data: {
          ...validatedData,
          slug
        },
        include: {
          _count: {
            select: {
              stories: {
                where: {
                  story: {
                    status: 'PUBLISHED'
                  }
                }
              }
            }
          }
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: series
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid series data',
            details: error.errors
          }
        });
      }

      console.error('Error updating series:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update series'
        }
      });
    }
  },

  // DELETE /api/series/:id - Delete series
  deleteSeries: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can delete series'
          }
        });
      }

      const series = await prisma.series.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              stories: true
            }
          }
        }
      });

      if (!series) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Series not found'
          }
        });
      }

      // Check if series has stories
      if (series._count.stories > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Cannot delete series. It has ${series._count.stories} story(ies) assigned to it.`
          }
        });
      }

      await prisma.series.delete({ where: { id } });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Series deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting series:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete series'
        }
      });
    }
  },

  // GET /api/series/:id/stories - Get stories in series
  getSeriesStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const series = await prisma.series.findUnique({ where: { id } });
      if (!series) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Series not found'
          }
        });
      }

      const stories = await prisma.story.findMany({
        where: {
          status: 'PUBLISHED',
          series: {
            some: {
              seriesId: id
            }
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
            where: {
              seriesId: id
            },
            select: {
              orderInSeries: true
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
        data: {
          series,
          stories
        }
      });
    } catch (error) {
      console.error('Error fetching series stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch series stories'
        }
      });
    }
  },

  // PUT /api/series/:id/reorder - Reorder stories in series
  reorderSeriesStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { storyOrders } = z.object({
        storyOrders: z.array(z.object({
          storyId: z.string().uuid(),
          orderInSeries: z.number().int().min(1)
        }))
      }).parse(req.body);

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can reorder series'
          }
        });
      }

      const series = await prisma.series.findUnique({ where: { id } });
      if (!series) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Series not found'
          }
        });
      }

      // Update story orders
      await Promise.all(
        storyOrders.map(({ storyId, orderInSeries }) =>
          prisma.storySeries.update({
            where: {
              storyId_seriesId: {
                storyId,
                seriesId: id
              }
            },
            data: { orderInSeries }
          })
        )
      );

      // Return updated series with stories
      const updatedSeries = await prisma.series.findUnique({
        where: { id },
        include: {
          stories: {
            where: {
              story: {
                status: 'PUBLISHED'
              }
            },
            include: {
              story: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  publishedAt: true
                }
              }
            },
            orderBy: {
              orderInSeries: 'asc'
            }
          }
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedSeries
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reorder data',
            details: error.errors
          }
        });
      }

      console.error('Error reordering series stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reorder series stories'
        }
      });
    }
  }
};