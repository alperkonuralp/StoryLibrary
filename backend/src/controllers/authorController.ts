import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/constants';

const prisma = new PrismaClient();

// Validation schemas
const createAuthorSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.record(z.string()).optional()
});

const updateAuthorSchema = createAuthorSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const authorFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  language: z.enum(['en', 'tr']).optional()
});

export const authorController = {
  // GET /api/authors - Get all authors
  getAuthors: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, search, language } = authorFilterSchema.parse(req.query);
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            bio: {
              path: [language || 'en'],
              string_contains: search
            }
          }
        ];
      }

      const [authors, total] = await Promise.all([
        prisma.author.findMany({
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
        prisma.author.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: authors,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching authors:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch authors'
        }
      });
    }
  },

  // GET /api/authors/:id - Get author by ID
  getAuthorById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const author = await prisma.author.findUnique({
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

      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: author
      });
    } catch (error) {
      console.error('Error fetching author:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch author'
        }
      });
    }
  },

  // GET /api/authors/slug/:slug - Get author by slug
  getAuthorBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;

      const author = await prisma.author.findUnique({
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

      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: author
      });
    } catch (error) {
      console.error('Error fetching author by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch author'
        }
      });
    }
  },

  // POST /api/authors - Create new author
  createAuthor: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can create authors'
          }
        });
      }

      const validatedData = createAuthorSchema.parse(req.body);

      // Generate slug from name
      const slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug already exists
      const existingAuthor = await prisma.author.findUnique({ where: { slug } });
      if (existingAuthor) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'An author with this name already exists'
          }
        });
      }

      const author = await prisma.author.create({
        data: {
          name: validatedData.name!,
          bio: validatedData.bio,
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
        data: author
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid author data',
            details: error.errors
          }
        });
      }

      console.error('Error creating author:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create author'
        }
      });
    }
  },

  // PUT /api/authors/:id - Update author
  updateAuthor: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only editors and admins can update authors'
          }
        });
      }

      const existingAuthor = await prisma.author.findUnique({ where: { id } });
      if (!existingAuthor) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      const validatedData = updateAuthorSchema.parse(req.body);

      // Update slug if name changed
      let slug = existingAuthor.slug;
      if (validatedData.name) {
        const newSlug = validatedData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (newSlug !== existingAuthor.slug) {
          const slugExists = await prisma.author.findFirst({
            where: { slug: newSlug, NOT: { id } }
          });
          if (slugExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'An author with this name already exists'
              }
            });
          }
          slug = newSlug;
        }
      }

      const author = await prisma.author.update({
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
        data: author
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid author data',
            details: error.errors
          }
        });
      }

      console.error('Error updating author:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update author'
        }
      });
    }
  },

  // DELETE /api/authors/:id - Delete author
  deleteAuthor: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Only admins can delete authors'
          }
        });
      }

      const author = await prisma.author.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              stories: true
            }
          }
        }
      });

      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      // Check if author has stories
      if (author._count.stories > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Cannot delete author. They have ${author._count.stories} story(ies) assigned to them.`
          }
        });
      }

      await prisma.author.delete({ where: { id } });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Author deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting author:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete author'
        }
      });
    }
  },

  // GET /api/authors/:id/stories - Get stories by author
  getAuthorStories: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const author = await prisma.author.findUnique({ where: { id } });
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where: {
            status: 'PUBLISHED',
            authors: {
              some: {
                authorId: id
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
            authors: {
              some: {
                authorId: id
              }
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          author,
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
      console.error('Error fetching author stories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch author stories'
        }
      });
    }
  },

  // GET /api/authors/popular - Get popular authors
  getPopularAuthors: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = 20 } = req.query;
      const limitNum = Math.min(Number(limit), 50);

      const authors = await prisma.author.findMany({
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

      // Filter out authors with 0 stories
      const popularAuthors = authors.filter(author => author._count.stories > 0);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: popularAuthors
      });
    } catch (error) {
      console.error('Error fetching popular authors:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch popular authors'
        }
      });
    }
  }
};