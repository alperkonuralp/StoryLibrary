import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/constants';

const prisma = new PrismaClient();

// Validation schemas
const createTagSchema = z.object({
  name: z.record(z.string()).refine(obj => Object.keys(obj).length > 0, {
    message: "Name must have at least one language"
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Color must be a valid hex color (e.g., #FF5733)"
  }).optional()
});

const updateTagSchema = createTagSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const tagFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  language: z.enum(['en', 'tr']).optional()
});

export const tagController = {
  // GET /api/tags - Get all tags
  getTags: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, search, language } = tagFilterSchema.parse(req.query);
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.name = {
          path: [language || 'en'],
          string_contains: search
        };
      }

      const [tags, total] = await Promise.all([
        prisma.tag.findMany({
          where,
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
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          }
        }),
        prisma.tag.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tags,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tags'
        }
      });
    }
  },

  // GET /api/tags/:id - Get tag by ID
  getTagById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const tag = await prisma.tag.findUnique({
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
              story: {
                publishedAt: 'desc'
              }
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

      if (!tag) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tag
      });
    } catch (error) {
      console.error('Error fetching tag:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tag'
        }
      });
    }
  },

  // GET /api/tags/slug/:slug - Get tag by slug
  getTagBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;

      const tag = await prisma.tag.findUnique({
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
              story: {
                publishedAt: 'desc'
              }
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

      if (!tag) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tag
      });
    } catch (error) {
      console.error('Error fetching tag by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tag'
        }
      });
    }
  },

  // POST /api/tags - Create new tag
  createTag: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can create tags'
          }
        });
      }

      const validatedData = createTagSchema.parse(req.body);

      // Generate slug from name (English first, then Turkish)
      const name = validatedData.name.en || validatedData.name.tr || Object.values(validatedData.name)[0];
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug already exists
      const existingTag = await prisma.tag.findUnique({ where: { slug } });
      if (existingTag) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A tag with this name already exists'
          }
        });
      }

      // Set default color if not provided
      const color = validatedData.color || '#6B7280'; // Default gray color

      const tag = await prisma.tag.create({
        data: {
          name: validatedData.name!,
          slug,
          color
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
        data: tag
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tag data',
            details: error.errors
          }
        });
      }

      console.error('Error creating tag:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create tag'
        }
      });
    }
  },

  // PUT /api/tags/:id - Update tag
  updateTag: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can update tags'
          }
        });
      }

      const existingTag = await prisma.tag.findUnique({ where: { id } });
      if (!existingTag) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found'
          }
        });
      }

      const validatedData = updateTagSchema.parse(req.body);

      // Update slug if name changed
      let slug = existingTag.slug;
      if (validatedData.name) {
        const name = validatedData.name.en || validatedData.name.tr || Object.values(validatedData.name)[0];
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (newSlug !== existingTag.slug) {
          const slugExists = await prisma.tag.findFirst({
            where: { slug: newSlug, NOT: { id } }
          });
          if (slugExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'A tag with this name already exists'
              }
            });
          }
          slug = newSlug;
        }
      }

      const tag = await prisma.tag.update({
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
        data: tag
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tag data',
            details: error.errors
          }
        });
      }

      console.error('Error updating tag:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update tag'
        }
      });
    }
  },

  // DELETE /api/tags/:id - Delete tag
  deleteTag: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can delete tags'
          }
        });
      }

      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              stories: true
            }
          }
        }
      });

      if (!tag) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found'
          }
        });
      }

      // Check if tag has stories
      if (tag._count.stories > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Cannot delete tag. It has ${tag._count.stories} story(ies) assigned to it.`
          }
        });
      }

      await prisma.tag.delete({ where: { id } });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Tag deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete tag'
        }
      });
    }
  },

  // GET /api/tags/:id/stories - Get stories with tag
  getTagStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const tag = await prisma.tag.findUnique({ where: { id } });
      if (!tag) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found'
          }
        });
      }

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where: {
            status: 'PUBLISHED',
            tags: {
              some: {
                tagId: id
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
          orderBy: {
            publishedAt: 'desc'
          }
        }),
        prisma.story.count({
          where: {
            status: 'PUBLISHED',
            tags: {
              some: {
                tagId: id
              }
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          tag,
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
      console.error('Error fetching tag stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tag stories'
        }
      });
    }
  },

  // GET /api/tags/popular - Get popular tags
  getPopularTags: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = 20 } = req.query;
      const limitNum = Math.min(Number(limit), 50);

      const tags = await prisma.tag.findMany({
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
        },
        orderBy: {
          stories: {
            _count: 'desc'
          }
        },
        take: limitNum
      });

      // Filter out tags with 0 stories
      const popularTags = tags.filter(tag => tag._count.stories > 0);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: popularTags
      });
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch popular tags'
        }
      });
    }
  }
};