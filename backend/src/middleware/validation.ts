import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { REGEX_PATTERNS, VALIDATION_RULES } from '../utils/constants';
import { ValidationError } from './errorHandler';

/**
 * Generic validation middleware for Zod schemas
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate query parameters only
 */
export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate route parameters only
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation schemas

/**
 * UUID parameter validation
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

/**
 * Slug parameter validation
 */
export const slugParamSchema = z.object({
  slug: z.string().regex(REGEX_PATTERNS.SLUG, 'Invalid slug format'),
});

/**
 * Pagination query validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Search query validation
 */
export const searchSchema = paginationSchema.extend({
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Auth validation schemas

/**
 * User registration validation
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(VALIDATION_RULES.EMAIL_MAX_LENGTH, 'Email too long'),
  password: z
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, `Password must be no more than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  username: z
    .string()
    .min(VALIDATION_RULES.USERNAME_MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USERNAME_MAX_LENGTH, `Username must be no more than ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters`)
    .regex(REGEX_PATTERNS.USERNAME, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
});

/**
 * User login validation
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Token refresh validation
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Password reset request validation
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Password reset validation
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, `Password must be no more than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`),
});

// Story validation schemas

/**
 * Multilingual content validation
 */
const multilingualContentSchema = z.object({
  en: z.string().min(1, 'English content is required'),
  tr: z.string().min(1, 'Turkish content is required'),
});

/**
 * Multilingual content array validation
 */
const multilingualContentArraySchema = z.object({
  en: z.array(z.string().min(1, 'Paragraph cannot be empty')).min(1, 'At least one paragraph is required'),
  tr: z.array(z.string().min(1, 'Paragraph cannot be empty')).min(1, 'At least one paragraph is required'),
});

/**
 * Story creation validation
 */
export const createStorySchema = z.object({
  title: multilingualContentSchema,
  shortDescription: multilingualContentSchema,
  content: multilingualContentArraySchema,
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  authorIds: z.array(z.object({
    id: z.string().uuid(),
    role: z.enum(['author', 'co-author', 'translator']).default('author'),
  })).optional(),
  seriesId: z.string().uuid().optional(),
  orderInSeries: z.number().int().min(1).optional(),
  sourceInfo: z.object({
    siteName: z.string().optional(),
    originalUrl: z.string().url().optional(),
    scrapedAt: z.string().optional(),
    translator: z.string().optional(),
  }).optional(),
});

/**
 * Story update validation (all fields optional)
 */
export const updateStorySchema = createStorySchema.partial();

/**
 * Story rating validation
 */
export const ratingSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').multipleOf(0.5, 'Rating must be in increments of 0.5'),
});

/**
 * Story filter validation
 */
export const storyFilterSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  seriesId: z.string().uuid().optional(),
  language: z.enum(['en', 'tr']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title', 'averageRating', 'ratingCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Category validation schemas

/**
 * Category creation validation
 */
export const createCategorySchema = z.object({
  name: multilingualContentSchema,
  description: multilingualContentSchema.optional(),
});

/**
 * Category update validation
 */
export const updateCategorySchema = createCategorySchema.partial();

// Tag validation schemas

/**
 * Tag creation validation
 */
export const createTagSchema = z.object({
  name: multilingualContentSchema,
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
});

/**
 * Tag update validation
 */
export const updateTagSchema = createTagSchema.partial();

// Author validation schemas

/**
 * Author creation validation
 */
export const createAuthorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(VALIDATION_RULES.AUTHOR_NAME_MAX_LENGTH, 'Name too long'),
  bio: multilingualContentSchema.optional(),
});

/**
 * Author update validation
 */
export const updateAuthorSchema = createAuthorSchema.partial();

// Series validation schemas

/**
 * Series creation validation
 */
export const createSeriesSchema = z.object({
  name: multilingualContentSchema,
  description: multilingualContentSchema.optional(),
});

/**
 * Series update validation
 */
export const updateSeriesSchema = createSeriesSchema.partial();

// User progress validation schemas

/**
 * Reading progress validation
 */
export const progressSchema = z.object({
  storyId: z.string().uuid('Invalid story ID'),
  lastParagraph: z.number().int().min(0).optional(),
  status: z.enum(['STARTED', 'COMPLETED']).default('STARTED'),
});

/**
 * User profile update validation
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(VALIDATION_RULES.USERNAME_MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USERNAME_MAX_LENGTH, `Username must be no more than ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters`)
    .regex(REGEX_PATTERNS.USERNAME, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  profile: z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
  }).optional(),
});

/**
 * Change password validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, `Password must be no more than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`),
});

/**
 * Sanitize input by removing potentially dangerous characters
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    Object.keys(input).forEach(key => {
      sanitized[key] = sanitizeInput(input[key]);
    });
    return sanitized;
  }
  
  return input;
};

/**
 * Sanitization middleware
 */
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

/**
 * Custom validation helpers
 */
export const validateUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export const validateEmail = (email: string): boolean => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

export const validateSlug = (slug: string): boolean => {
  return REGEX_PATTERNS.SLUG.test(slug);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be no more than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters long`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};