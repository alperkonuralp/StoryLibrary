import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Get all published stories
app.get('/api/stories', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, categoryId, language = 'en' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        {
          title: {
            path: [language as string],
            string_contains: search as string,
          },
        },
        {
          shortDescription: {
            path: [language as string],
            string_contains: search as string,
          },
        },
      ];
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          authors: {
            include: {
              author: true,
            },
          },
          _count: {
            select: {
              ratings: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.story.count({ where }),
    ]);

    // Calculate average rating for each story
    const storiesWithRatings = await Promise.all(
      stories.map(async (story) => {
        const ratings = await prisma.userStoryRating.findMany({
          where: { storyId: story.id },
        });
        
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
          : 0;

        return {
          ...story,
          averageRating,
          ratingCount: ratings.length,
        };
      })
    );

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: {
        stories: storiesWithRatings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch stories',
      },
    });
  }
});

// Get story by slug
app.get('/api/stories/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const story = await prisma.story.findUnique({
      where: { slug, status: 'PUBLISHED' },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        authors: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!story) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
      });
      return;
    }

    // Get ratings
    const ratings = await prisma.userStoryRating.findMany({
      where: { storyId: story.id },
    });

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
      : 0;

    const storyWithRating = {
      ...story,
      averageRating,
      ratingCount: ratings.length,
    };

    res.json({
      success: true,
      data: storyWithRating,
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch story',
      },
    });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch categories',
      },
    });
  }
});

// Get authors
app.get('/api/authors', async (req, res) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search as string,
            mode: 'insensitive'
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
        skip: offset,
        take: limitNum,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.author.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: authors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch authors',
      },
    });
  }
});

// Get author by ID
app.get('/api/authors/:id', async (req, res) => {
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
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Author not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: author,
    });
  } catch (error) {
    console.error('Error fetching author:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch author',
      },
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
});