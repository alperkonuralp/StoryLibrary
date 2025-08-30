import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { REGEX_PATTERNS, VALIDATION_RULES } from './constants';
import type { JWTPayload, PaginationInfo, Language } from '../types';

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '15m'): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn } as any);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn } as any);
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JWTPayload;
}

/**
 * Calculate pagination info
 */
export function calculatePagination(page: number, limit: number, total: number): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: string | number, limit?: string | number) {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : (page || 1);
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (limit || 20);
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error('Invalid page number');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new Error('Invalid limit (must be between 1 and 100)');
  }
  
  return { page: pageNum, limit: limitNum };
}

/**
 * Sanitize and validate email
 */
export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email.trim().toLowerCase());
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
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
}

/**
 * Generate a random string
 */
export function generateRandomString(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return result;
}

/**
 * Calculate estimated reading time (words per minute)
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Extract text content from JSON content structure
 */
export function extractTextFromContent(content: Record<Language, string[]>): Record<Language, string> {
  const result: Record<Language, string> = {} as Record<Language, string>;
  
  for (const [lang, paragraphs] of Object.entries(content)) {
    result[lang as Language] = paragraphs.join(' ');
  }
  
  return result;
}

/**
 * Calculate story statistics
 */
export function calculateStoryStatistics(content: Record<Language, string[]>) {
  const statistics: Record<string, Record<Language, number>> = {
    wordCount: {} as Record<Language, number>,
    charCount: {} as Record<Language, number>,
    estimatedReadingTime: {} as Record<Language, number>,
  };
  
  for (const [lang, paragraphs] of Object.entries(content)) {
    const fullText = paragraphs.join(' ');
    const language = lang as Language;
    
    statistics.wordCount![language] = countWords(fullText);
    statistics.charCount![language] = countCharacters(fullText);
    statistics.estimatedReadingTime![language] = calculateReadingTime(fullText);
  }
  
  return statistics;
}

/**
 * Validate multilingual content
 */
export function validateMultilingualContent(content: any): boolean {
  if (!content || typeof content !== 'object') {
    return false;
  }
  
  const requiredLanguages: Language[] = ['en', 'tr'];
  
  for (const lang of requiredLanguages) {
    if (!content[lang] || !Array.isArray(content[lang]) || content[lang].length === 0) {
      return false;
    }
    
    // Check if all paragraphs are strings and not empty
    for (const paragraph of content[lang]) {
      if (typeof paragraph !== 'string' || paragraph.trim().length === 0) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Clean and normalize text
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .replace(/\t+/g, ' '); // Replace tabs with spaces
}

/**
 * Generate cache key
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Format error for API response
 */
export function formatError(error: unknown): { code: string; message: string; details?: any } {
  if (error instanceof z.ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors,
    };
  }
  
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }
  
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if environment is test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}