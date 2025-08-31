import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Import route modules
import progressRoutes from './routes/progress';
import bookmarkRoutes from './routes/bookmarks';
import userRoutes from './routes/userRoutes';
import ratingRoutes from './routes/ratingRoutes';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Mount route modules
app.use('/api/progress', progressRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', ratingRoutes);

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      }
    });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
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
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
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
      { expiresIn: JWT_EXPIRES_IN } as any
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
      { expiresIn: JWT_EXPIRES_IN } as any
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
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} with authentication`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Authentication endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/auth/me`);
});