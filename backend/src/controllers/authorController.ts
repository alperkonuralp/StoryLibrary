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
  },

  // GET /api/authors/:id/follow-status - Get follow status between current user and author
  getFollowStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: authorId } = req.params;
      const userId = req.user!.id;

      if (userId === authorId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot check follow status for yourself'
          }
        });
      }

      // Check if author exists
      const author = await prisma.user.findUnique({ where: { id: authorId } });
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      // Get follow relationship
      const followRelation = await prisma.userFollow.findUnique({
        where: {
          followerId_followedId: {
            followerId: userId,
            followedId: authorId
          }
        }
      });

      // Get mutual follow (if author follows current user back)
      const mutualFollow = await prisma.userFollow.findUnique({
        where: {
          followerId_followedId: {
            followerId: authorId,
            followedId: userId
          }
        }
      });

      // Get followers and following counts
      const [followersCount, followingCount] = await Promise.all([
        prisma.userFollow.count({ where: { followedId: authorId } }),
        prisma.userFollow.count({ where: { followerId: authorId } })
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          isFollowing: !!followRelation,
          isFollowedBy: !!mutualFollow,
          followersCount,
          followingCount
        }
      });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check follow status'
        }
      });
    }
  },

  // POST /api/authors/:id/follow - Follow an author
  followAuthor: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: authorId } = req.params;
      const userId = req.user!.id;

      if (userId === authorId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot follow yourself'
          }
        });
      }

      // Check if author exists
      const author = await prisma.user.findUnique({ where: { id: authorId } });
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      // Check if already following
      const existingFollow = await prisma.userFollow.findUnique({
        where: {
          followerId_followedId: {
            followerId: userId,
            followedId: authorId
          }
        }
      });

      if (existingFollow) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Already following this author'
          }
        });
      }

      // Create follow relationship
      await prisma.userFollow.create({
        data: {
          followerId: userId,
          followedId: authorId
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Successfully followed author'
        }
      });
    } catch (error) {
      console.error('Error following author:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to follow author'
        }
      });
    }
  },

  // DELETE /api/authors/:id/follow - Unfollow an author
  unfollowAuthor: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: authorId } = req.params;
      const userId = req.user!.id;

      if (userId === authorId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot unfollow yourself'
          }
        });
      }

      // Check if follow exists
      const followRelation = await prisma.userFollow.findUnique({
        where: {
          followerId_followedId: {
            followerId: userId,
            followedId: authorId
          }
        }
      });

      if (!followRelation) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Not following this author'
          }
        });
      }

      // Delete follow relationship
      await prisma.userFollow.delete({
        where: {
          followerId_followedId: {
            followerId: userId,
            followedId: authorId
          }
        }
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Successfully unfollowed author'
        }
      });
    } catch (error) {
      console.error('Error unfollowing author:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unfollow author'
        }
      });
    }
  },

  // GET /api/authors/:id/followers - Get author's followers
  getFollowers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: authorId } = req.params;
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      // Check if author exists
      const author = await prisma.user.findUnique({ where: { id: authorId } });
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      const [followers, total] = await Promise.all([
        prisma.userFollow.findMany({
          where: { followedId: authorId },
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                email: true,
                profile: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.userFollow.count({ where: { followedId: authorId } })
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          followers: followers.map(f => ({
            ...f.follower,
            followedAt: f.createdAt
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch followers'
        }
      });
    }
  },

  // GET /api/authors/:id/following - Get users that author is following
  getFollowing: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: authorId } = req.params;
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;

      // Check if author exists
      const author = await prisma.user.findUnique({ where: { id: authorId } });
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Author not found'
          }
        });
      }

      const [following, total] = await Promise.all([
        prisma.userFollow.findMany({
          where: { followerId: authorId },
          include: {
            followed: {
              select: {
                id: true,
                username: true,
                email: true,
                profile: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.userFollow.count({ where: { followerId: authorId } })
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          following: following.map(f => ({
            ...f.followed,
            followedAt: f.createdAt
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch following'
        }
      });
    }
  },

  // SLUG-BASED METHODS

  // GET /api/authors/slug/:slug/stories - Get author stories by slug
  getAuthorStoriesBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      
      // First find the author by slug
      const author = await prisma.author.findUnique({
        where: { slug },
        select: { id: true }
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

      // Use the existing getAuthorStories logic but with the found author ID
      req.params.id = author.id;
      return authorController.getAuthorStories(req, res);
    } catch (error) {
      console.error('Error fetching author stories by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch author stories'
        }
      });
    }
  },

  // GET /api/authors/slug/:slug/follow-status - Get follow status by slug
  getFollowStatusBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      
      // First find the author by slug
      const author = await prisma.author.findUnique({
        where: { slug },
        select: { id: true }
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

      // Use the existing getFollowStatus logic but with the found author ID
      req.params.id = author.id;
      return authorController.getFollowStatus(req, res);
    } catch (error) {
      console.error('Error fetching follow status by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch follow status'
        }
      });
    }
  },

  // POST /api/authors/slug/:slug/follow - Follow author by slug
  followAuthorBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      
      // First find the author by slug
      const author = await prisma.author.findUnique({
        where: { slug },
        select: { id: true }
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

      // Use the existing followAuthor logic but with the found author ID
      req.params.id = author.id;
      return authorController.followAuthor(req, res);
    } catch (error) {
      console.error('Error following author by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to follow author'
        }
      });
    }
  },

  // DELETE /api/authors/slug/:slug/follow - Unfollow author by slug
  unfollowAuthorBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      
      // First find the author by slug
      const author = await prisma.author.findUnique({
        where: { slug },
        select: { id: true }
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

      // Use the existing unfollowAuthor logic but with the found author ID
      req.params.id = author.id;
      return authorController.unfollowAuthor(req, res);
    } catch (error) {
      console.error('Error unfollowing author by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unfollow author'
        }
      });
    }
  },

  // GET /api/authors/slug/:slug/followers - Get followers by slug
  getFollowersBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      
      // First find the author by slug
      const author = await prisma.author.findUnique({
        where: { slug },
        select: { id: true }
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

      // Use the existing getFollowers logic but with the found author ID
      req.params.id = author.id;
      return authorController.getFollowers(req, res);
    } catch (error) {
      console.error('Error fetching followers by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch followers'
        }
      });
    }
  },

  // GET /api/authors/slug/:slug/following - Get following by slug
  getFollowingBySlug: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      
      // First find the author by slug
      const author = await prisma.author.findUnique({
        where: { slug },
        select: { id: true }
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

      // Use the existing getFollowing logic but with the found author ID
      req.params.id = author.id;
      return authorController.getFollowing(req, res);
    } catch (error) {
      console.error('Error fetching following by slug:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch following'
        }
      });
    }
  }
};