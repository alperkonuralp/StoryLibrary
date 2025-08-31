// Application constants
export const APP_NAME = 'Story Library';
export const APP_VERSION = '1.0.0';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  USER: 'USER',
} as const;

// Story Status
export const STORY_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

// Reading Status
export const READING_STATUS = {
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
} as const;

// Supported Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  TURKISH: 'tr',
} as const;

export const SUPPORTED_LANGUAGES = [LANGUAGES.ENGLISH, LANGUAGES.TURKISH] as const;

// Default Pagination
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256',
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 1000, // Increased for development
  AUTH_WINDOW_MS: process.env.NODE_ENV === 'development' ? 30 * 1000 : 15 * 60 * 1000, // 30 seconds in dev, 15 minutes in prod
  AUTH_MAX_REQUESTS: process.env.NODE_ENV === 'development' ? 100 : 5, // 100 attempts in dev, 5 in prod
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  UPLOAD_PATH: 'uploads',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 255,
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 500,
  CONTENT_MAX_PARAGRAPHS: 1000,
  TAG_NAME_MAX_LENGTH: 50,
  CATEGORY_NAME_MAX_LENGTH: 100,
  AUTHOR_NAME_MAX_LENGTH: 100,
  SERIES_NAME_MAX_LENGTH: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  TOO_MANY_REQUESTS: 'Too many requests',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  STORY_NOT_FOUND: 'Story not found',
  USER_NOT_FOUND: 'User not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  TAG_NOT_FOUND: 'Tag not found',
  AUTHOR_NOT_FOUND: 'Author not found',
  SERIES_NOT_FOUND: 'Series not found',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File too large',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  STORY_CREATED: 'Story created successfully',
  STORY_UPDATED: 'Story updated successfully',
  STORY_DELETED: 'Story deleted successfully',
  STORY_PUBLISHED: 'Story published successfully',
  STORY_UNPUBLISHED: 'Story unpublished successfully',
  RATING_SUBMITTED: 'Rating submitted successfully',
  PROGRESS_UPDATED: 'Reading progress updated successfully',
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  TAG_CREATED: 'Tag created successfully',
  TAG_UPDATED: 'Tag updated successfully',
  TAG_DELETED: 'Tag deleted successfully',
  AUTHOR_CREATED: 'Author created successfully',
  AUTHOR_UPDATED: 'Author updated successfully',
  AUTHOR_DELETED: 'Author deleted successfully',
  SERIES_CREATED: 'Series created successfully',
  SERIES_UPDATED: 'Series updated successfully',
  SERIES_DELETED: 'Series deleted successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
  STORY_PUBLISHED: 'story-published',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    GOOGLE: '/api/auth/google',
  },
  STORIES: {
    BASE: '/api/stories',
    BY_ID: '/api/stories/:id',
    BY_SLUG: '/api/stories/slug/:slug',
    PUBLISH: '/api/stories/:id/publish',
    UNPUBLISH: '/api/stories/:id/unpublish',
    RATE: '/api/stories/:id/rate',
    TOP_RATED: '/api/stories/top-rated',
    NEW: '/api/stories/new',
  },
  AUTHORS: {
    BASE: '/api/authors',
    BY_ID: '/api/authors/:id',
    BY_SLUG: '/api/authors/slug/:slug',
    STORIES: '/api/authors/:id/stories',
  },
  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: '/api/categories/:id',
  },
  TAGS: {
    BASE: '/api/tags',
    BY_ID: '/api/tags/:id',
  },
  SERIES: {
    BASE: '/api/series',
    BY_ID: '/api/series/:id',
    STORIES: '/api/series/:id/stories',
  },
  USERS: {
    BASE: '/api/users',
    PROGRESS: '/api/users/progress',
    COMPLETED: '/api/users/completed',
    RATINGS: '/api/users/ratings',
  },
} as const;