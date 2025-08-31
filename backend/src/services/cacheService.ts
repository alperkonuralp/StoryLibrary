import Redis from 'ioredis';
import logger from '../utils/logger';

// Create Redis client if REDIS_URL is provided
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    
    redis.on('connect', () => {
      logger.info('✅ Connected to Redis');
    });

    redis.on('error', (err) => {
      logger.error('❌ Redis connection error:', err);
      redis = null; // Disable Redis on error
    });
  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error);
    redis = null;
  }
} else {
  logger.info('ℹ️ Redis not configured, caching disabled');
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T = any>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  static async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    if (!redis) return;

    const { ttl = 3600, tags = [] } = options;

    try {
      const serializedValue = JSON.stringify(value);
      await redis.set(key, serializedValue, 'EX', ttl);

      // Store tags for cache invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
          await redis.sadd(`tag:${tag}`, key);
          await redis.expire(`tag:${tag}`, ttl + 300); // Tag expires slightly after cache
        }
      }

      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.warn('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<void> {
    if (!redis) return;

    try {
      await redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.warn('Cache delete error:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cache invalidated pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.warn('Cache invalidate pattern error:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateTag(tag: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`tag:${tag}`);
        logger.debug(`Cache invalidated tag: ${tag} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.warn('Cache invalidate tag error:', error);
    }
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    if (!redis) return;

    try {
      await redis.flushdb();
      logger.info('All cache cleared');
    } catch (error) {
      logger.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache info
   */
  static async info(): Promise<any> {
    if (!redis) return { enabled: false };

    try {
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        enabled: true,
        connected: redis.status === 'ready',
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      logger.warn('Cache info error:', error);
      return { enabled: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Cache wrapper function
   */
  static async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // Execute function and cache result
    logger.debug(`Cache miss: ${key}`);
    const result = await fn();
    await this.set(key, result, options);
    
    return result;
  }

  /**
   * Check if Redis is available
   */
  static isEnabled(): boolean {
    return redis !== null && redis.status === 'ready';
  }
}

// Cache key builders
export const CacheKeys = {
  story: (id: string) => `story:${id}`,
  storyBySlug: (slug: string) => `story:slug:${slug}`,
  stories: (filters: any) => `stories:${JSON.stringify(filters)}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  author: (id: string) => `author:${id}`,
  authors: () => 'authors:all',
  tags: () => 'tags:all',
  series: () => 'series:all',
  userProgress: (userId: string) => `user:${userId}:progress`,
  topRated: (limit: number) => `stories:top:${limit}`,
  recent: (days: number, limit: number) => `stories:recent:${days}:${limit}`
};

// Cache tags for invalidation
export const CacheTags = {
  STORIES: 'stories',
  CATEGORIES: 'categories',
  AUTHORS: 'authors',
  TAGS: 'tags',
  SERIES: 'series',
  USER_PROGRESS: 'user_progress'
};

export default CacheService;