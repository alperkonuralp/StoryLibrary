const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running with authentication' });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login'
      }
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: 'USER',
        profile: {
          firstName: username || email.split('@')[0],
          lastName: '',
          bio: 'New Story Library user'
        }
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user'
      }
    });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Admin-only: Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
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
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

// Get all published stories
app.get('/api/stories', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, categoryId, authorId, language = 'en' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        {
          title: {
            path: [language],
            string_contains: search,
          },
        },
        {
          shortDescription: {
            path: [language],
            string_contains: search,
          },
        },
      ];
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }

    if (authorId) {
      where.authors = {
        some: {
          authorId: authorId,
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
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
      });
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

// Admin-only: Update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    const { id } = req.params;
    const { username, role, profile } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(role && { role }),
        ...(profile && { profile }),
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

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user'
      }
    });
  }
});

// Get authors
app.get('/api/authors', async (req, res) => {
  try {
    const authors = await prisma.author.findMany({
      include: {
        stories: {
          select: {
            story: {
              select: {
                id: true,
                title: true,
                status: true,
                publishedAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            stories: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: authors,
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

// ===== READING PROGRESS ENDPOINTS =====

// GET /api/progress/:storyId - Get reading progress for a specific story
app.get('/api/progress/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(storyId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid story ID format',
        },
      });
    }

    const progress = await prisma.userReadingProgress.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error fetching reading progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reading progress',
      },
    });
  }
});

// POST /api/progress - Update reading progress
app.post('/api/progress', authenticateToken, async (req, res) => {
  try {
    const { storyId, lastParagraph, status } = req.body;
    const userId = req.user.id;

    // Basic validation
    if (!storyId || typeof storyId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Story ID is required',
        },
      });
    }

    if (status && !['STARTED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be STARTED or COMPLETED',
        },
      });
    }

    // Check if story exists and is published
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, status: true },
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
      });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot track progress for unpublished stories',
        },
      });
    }

    const updateData = {};
    if (lastParagraph !== undefined) updateData.lastParagraph = parseInt(lastParagraph);
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    const progress = await prisma.userReadingProgress.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
      update: updateData,
      create: {
        userId,
        storyId,
        status: status || 'STARTED',
        lastParagraph: lastParagraph ? parseInt(lastParagraph) : 0,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error updating reading progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update reading progress',
      },
    });
  }
});

// GET /api/progress - Get all reading progress for the user
app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status && (status === 'STARTED' || status === 'COMPLETED')) {
      whereClause.status = status;
    }

    const progressList = await prisma.userReadingProgress.findMany({
      where: whereClause,
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            publishedAt: true,
            averageRating: true,
            ratingCount: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // STARTED first, then COMPLETED
        { startedAt: 'desc' }, // Most recent first
      ],
    });

    res.json({
      success: true,
      data: progressList,
      meta: {
        total: progressList.length,
        started: progressList.filter(p => p.status === 'STARTED').length,
        completed: progressList.filter(p => p.status === 'COMPLETED').length,
      },
    });
  } catch (error) {
    console.error('Error fetching reading progress list:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reading progress',
      },
    });
  }
});

// DELETE /api/progress/:storyId - Remove reading progress
app.delete('/api/progress/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    await prisma.userReadingProgress.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting reading progress:', error);
    
    if (error.code === 'P2025') { // Prisma not found error
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reading progress not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete reading progress',
      },
    });
  }
});

// ===== STORY RATING ENDPOINTS =====

// POST /api/stories/:storyId/rating - Add or update story rating
app.post('/api/stories/:storyId/rating', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 1 and 5',
        },
      });
    }

    // Check if story exists and is published
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, status: true },
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
      });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot rate unpublished stories',
        },
      });
    }

    // Upsert rating
    const userRating = await prisma.userStoryRating.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
      update: {
        rating: parseFloat(rating),
      },
      create: {
        userId,
        storyId,
        rating: parseFloat(rating),
      },
    });

    // Recalculate story averages
    const ratings = await prisma.userStoryRating.findMany({
      where: { storyId },
      select: { rating: true },
    });

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
      : 0;

    // Update story with new averages
    await prisma.story.update({
      where: { id: storyId },
      data: {
        averageRating: averageRating,
        ratingCount: ratings.length,
      },
    });

    res.json({
      success: true,
      data: {
        ...userRating,
        rating: Number(userRating.rating), // Convert Decimal to number
        storyStats: {
          averageRating: averageRating,
          ratingCount: ratings.length,
        },
      },
    });
  } catch (error) {
    console.error('Error adding/updating story rating:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add/update rating',
      },
    });
  }
});

// GET /api/stories/:storyId/rating - Get user's rating for a story
app.get('/api/stories/:storyId/rating', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const rating = await prisma.userStoryRating.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: rating ? {
        ...rating,
        rating: Number(rating.rating), // Convert Decimal to number
      } : null,
    });
  } catch (error) {
    console.error('Error fetching story rating:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch rating',
      },
    });
  }
});

// DELETE /api/stories/:storyId/rating - Remove user's rating
app.delete('/api/stories/:storyId/rating', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Delete the rating
    await prisma.userStoryRating.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    // Recalculate story averages
    const ratings = await prisma.userStoryRating.findMany({
      where: { storyId },
      select: { rating: true },
    });

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
      : 0;

    // Update story with new averages
    await prisma.story.update({
      where: { id: storyId },
      data: {
        averageRating: averageRating,
        ratingCount: ratings.length,
      },
    });

    res.json({
      success: true,
      data: {
        deleted: true,
        storyStats: {
          averageRating: averageRating,
          ratingCount: ratings.length,
        },
      },
    });
  } catch (error) {
    console.error('Error deleting story rating:', error);
    
    if (error.code === 'P2025') { // Prisma not found error
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rating not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete rating',
      },
    });
  }
});

// GET /api/bookmarks - Get all user bookmarks
app.get('/api/bookmarks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            publishedAt: true,
            averageRating: true,
            ratingCount: true,
            statistics: true,
            authors: {
              select: {
                author: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            categories: {
              select: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch bookmarks',
      },
    });
  }
});

// POST /api/bookmarks/:storyId - Add story to bookmarks
app.post('/api/bookmarks/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Check if story exists and is published
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, status: true },
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
      });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot bookmark unpublished stories',
        },
      });
    }

    // Create bookmark (will fail if already exists due to unique constraint)
    const bookmark = await prisma.userBookmark.create({
      data: {
        userId,
        storyId,
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    
    if (error.code === 'P2002') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Story is already bookmarked',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create bookmark',
      },
    });
  }
});

// DELETE /api/bookmarks/:storyId - Remove story from bookmarks
app.delete('/api/bookmarks/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    await prisma.userBookmark.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    
    if (error.code === 'P2025') { // Record not found
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Bookmark not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete bookmark',
      },
    });
  }
});

// GET /api/bookmarks/:storyId - Check if story is bookmarked
app.get('/api/bookmarks/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const bookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        bookmark: bookmark || null,
      },
    });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check bookmark status',
      },
    });
  }
});

// Admin-only: Publish/Unpublish story
app.patch('/api/admin/stories/:id/publish', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    const { id } = req.params;
    const story = await prisma.story.update({
      where: { id },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error publishing story:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to publish story'
      }
    });
  }
});

app.patch('/api/admin/stories/:id/unpublish', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    const { id } = req.params;
    const story = await prisma.story.update({
      where: { id },
      data: { 
        status: 'DRAFT',
        publishedAt: null
      }
    });

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error unpublishing story:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unpublish story'
      }
    });
  }
});

// Admin-only: Delete story
app.delete('/api/admin/stories/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    const { id } = req.params;
    await prisma.story.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete story'
      }
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} with authentication`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Authentication endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/auth/me`);
});