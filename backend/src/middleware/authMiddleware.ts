import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { AuthService } from '../services/authService';
import { RATE_LIMIT, USER_ROLES } from '../utils/constants';
import logger from '../utils/logger';
import type { AuthenticatedRequest, JWTPayload } from '../types';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = AuthService.verifyToken(token);

    // Get user from database
    const user = await AuthService.getUserById(decoded.userId);

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't require it
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = AuthService.verifyToken(token);
        const user = await AuthService.getUserById(decoded.userId);
        req.user = user;
      } catch (error) {
        // Ignore authentication errors for optional auth
        logger.warn('Optional authentication failed', { error: (error as any)?.message || 'Unknown error' });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: `${req.method} ${req.path}`,
      });
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Admin-only authorization
 */
export const requireAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Editor and Admin authorization
 */
export const requireEditor = authorize(USER_ROLES.ADMIN, USER_ROLES.EDITOR);

/**
 * Authenticated user authorization (any logged-in user)
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  next();
};

/**
 * Resource ownership middleware
 * Checks if the authenticated user owns the resource or has admin privileges
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admins can access any resource
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      throw new AuthorizationError('Resource ownership cannot be determined');
    }

    if (resourceUserId !== req.user.id) {
      logger.warn('Ownership authorization failed', {
        userId: req.user.id,
        resourceUserId,
        endpoint: `${req.method} ${req.path}`,
      });
      throw new AuthorizationError('You can only access your own resources');
    }

    next();
  };
};

/**
 * Content ownership middleware for stories, categories, etc.
 * Checks if user created the content or has editor/admin privileges
 */
export const requireContentOwnership = (createdByField: string = 'createdBy') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admins and editors can access any content
    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.EDITOR) {
      return next();
    }

    // Check if user created the content
    const createdById = req.params[createdByField] || req.body[createdByField];
    
    if (!createdById) {
      throw new AuthorizationError('Content ownership cannot be determined');
    }

    if (createdById !== req.user.id) {
      logger.warn('Content ownership authorization failed', {
        userId: req.user.id,
        createdById,
        endpoint: `${req.method} ${req.path}`,
      });
      throw new AuthorizationError('You can only modify content you created');
    }

    next();
  };
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiting for password reset endpoints
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many password reset attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API key middleware (for external integrations)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    throw new AuthenticationError('API key required');
  }

  // Validate API key (in production, store these in database)
  const validApiKeys = process.env.API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key used', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    throw new AuthenticationError('Invalid API key');
  }

  next();
};

/**
 * Development-only middleware
 */
export const requireDevelopment = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV !== 'development') {
    throw new AuthorizationError('This endpoint is only available in development mode');
  }
  next();
};

/**
 * CORS preflight handler for authentication
 */
export const handleAuthCors = (req: Request, res: Response, next: NextFunction): void => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
    return;
  }
  next();
};

/**
 * Log authentication events
 */
export const logAuthEvent = (event: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log the event after response is sent
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;
      
      logger.info(`Auth event: ${event}`, {
        success,
        statusCode,
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to attach request metadata for logging
 */
export const attachRequestMetadata = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  req.startTime = Date.now();
  
  // Log request start
  logger.debug(`Request started: ${req.method} ${req.path}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });
  
  next();
};

/**
 * User context middleware
 * Adds commonly needed user-related data to the request
 */
export const addUserContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user) {
    try {
      // Add user statistics to request context
      const userStats = await AuthService.getUserStats(req.user.id);
      req.userContext = {
        ...req.user,
        stats: userStats,
      };
    } catch (error) {
      // Don't fail the request if we can't get user stats
      logger.warn('Failed to get user context', { 
        userId: req.user.id, 
        error: (error as any)?.message || 'Unknown error'
      });
      req.userContext = req.user;
    }
  }
  
  next();
};

// Export authMiddleware as an alias for authenticate (for backward compatibility)
export const authMiddleware = authenticate;