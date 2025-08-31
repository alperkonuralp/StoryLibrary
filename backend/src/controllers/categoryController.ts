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
const createCategorySchema = z.object({
  name: z.record(z.string()).refine(obj => Object.keys(obj).length > 0, {
    message: "Name must have at least one language"
  }),
  description: z.record(z.string()).optional()
});

const updateCategorySchema = createCategorySchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const categoryFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  language: z.enum(['en', 'tr']).optional()
});

export const categoryController = {
  // GET /api/categories - Get all categories
  getCategories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, search, language } = categoryFilterSchema.parse(req.query);
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

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
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
                    publishedAt: true
                  }
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
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          }
        }),
        prisma.category.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch categories'
        }
      });
    }
  },

  // GET /api/categories/:id - Get category by ID
  getCategoryById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
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

      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch category'
        }
      });
    }
  },

  // GET /api/categories/slug/:slug - Get category by slug
  getCategoryBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;

      const category = await prisma.category.findUnique({
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

      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch category'
        }
      });
    }
  },

  // POST /api/categories - Create new category
  createCategory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can create categories'
          }
        });
      }

      const validatedData = createCategorySchema.parse(req.body);

      // Generate slug from name (English first, then Turkish)
      const name = validatedData.name.en || validatedData.name.tr || Object.values(validatedData.name)[0];
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug already exists
      const existingCategory = await prisma.category.findUnique({ where: { slug } });
      if (existingCategory) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A category with this name already exists'
          }
        });
      }

      const category = await prisma.category.create({
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
        data: category
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category data',
            details: error.errors
          }
        });
      }

      console.error('Error creating category:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create category'
        }
      });
    }
  },

  // PUT /api/categories/:id - Update category
  updateCategory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can update categories'
          }
        });
      }

      const existingCategory = await prisma.category.findUnique({ where: { id } });
      if (!existingCategory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found'
          }
        });
      }

      const validatedData = updateCategorySchema.parse(req.body);

      // Update slug if name changed
      let slug = existingCategory.slug;
      if (validatedData.name) {
        const name = validatedData.name.en || validatedData.name.tr || Object.values(validatedData.name)[0];
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (newSlug !== existingCategory.slug) {
          const slugExists = await prisma.category.findFirst({
            where: { slug: newSlug, NOT: { id } }
          });
          if (slugExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'A category with this name already exists'
              }
            });
          }
          slug = newSlug;
        }
      }

      const category = await prisma.category.update({
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
        data: category
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category data',
            details: error.errors
          }
        });
      }

      console.error('Error updating category:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update category'
        }
      });
    }
  },

  // DELETE /api/categories/:id - Delete category
  deleteCategory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can delete categories'
          }
        });
      }

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              stories: true
            }
          }
        }
      });

      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found'
          }
        });
      }

      // Check if category has stories
      if (category._count.stories > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Cannot delete category. It has ${category._count.stories} story(ies) assigned to it.`
          }
        });
      }

      await prisma.category.delete({ where: { id } });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Category deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete category'
        }
      });
    }
  },

  // GET /api/categories/:id/stories - Get stories in category
  getCategoryStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found'
          }
        });
      }

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where: {
            status: 'PUBLISHED',
            categories: {
              some: {
                categoryId: id
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
            categories: {
              some: {
                categoryId: id
              }
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          category,
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
      console.error('Error fetching category stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch category stories'
        }
      });
    }
  }
};