import { Request } from 'express';
import { User } from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

// User type without sensitive fields (like passwordHash)
export type SafeUser = Omit<User, 'passwordHash'>;

// Extended Request interface with user and additional properties
export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  requestId?: string;
  startTime?: number;
  userContext?: any;
}

// Language types
export type Language = 'en' | 'tr';
export type MultilingualContent = Record<Language, string>;
export type MultilingualContentArray = Record<Language, string[]>;

// Story types
export interface StoryContent {
  title: MultilingualContent;
  shortDescription: MultilingualContent;
  content: MultilingualContentArray;
}

export interface StoryStatistics {
  wordCount: Record<Language, number>;
  charCount: Record<Language, number>;
  estimatedReadingTime: Record<Language, number>;
}

export interface SourceInfo {
  siteName?: string;
  originalUrl?: string;
  scrapedAt?: string;
  translator?: string;
}

// Auth types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filter types
export interface StoryFilters extends PaginationParams {
  search?: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  seriesId?: string;
  language?: Language;
  status?: 'DRAFT' | 'PUBLISHED';
}

// Cache types
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

// Environment variables
export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL: string;
  REDIS_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TRANSLATE_API_KEY?: string;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Validation types
export type ValidationError = {
  field: string;
  message: string;
  code?: string;
};

// Search types
export interface SearchOptions {
  query: string;
  languages?: Language[];
  fuzzy?: boolean;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions?: string[];
}