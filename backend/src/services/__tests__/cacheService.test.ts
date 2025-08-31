import { CacheService } from '../cacheService';
import Redis from 'ioredis';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  on: jest.fn(),
} as any;

const MockRedis = Redis as jest.MockedClass<typeof Redis>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the Redis instance for testing
    MockRedis.mockImplementation(() => mockRedis);
    
    // Mock environment variable
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterEach(() => {
    delete process.env.REDIS_URL;
  });

  describe('Redis initialization', () => {
    it('should initialize Redis when REDIS_URL is provided', () => {
      // Re-require the module to trigger initialization
      jest.resetModules();
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      require('../cacheService');
      
      expect(MockRedis).toHaveBeenCalledWith('redis://localhost:6379');
      expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should disable caching when REDIS_URL is not provided', () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      
      require('../cacheService');
      
      expect(mockLogger.info).toHaveBeenCalledWith('ℹ️ Redis not configured, caching disabled');
    });
  });

  describe('get', () => {
    it('should return cached value when Redis is available', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await CacheService.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await CacheService.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null when Redis is not available', async () => {
      // Simulate Redis being disabled
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid-json{');

      const result = await CacheService.get('test-key');

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache get error:', expect.any(Error));
      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.get.mockRejectedValue(error);

      const result = await CacheService.get('test-key');

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache get error:', error);
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    const testData = { id: 1, name: 'Test' };
    const testKey = 'test-key';

    it('should cache value with default TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await CacheService.set(testKey, testData);

      expect(mockRedis.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData),
        'EX',
        3600 // Default TTL
      );
      expect(result).toBe(true);
    });

    it('should cache value with custom TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await CacheService.set(testKey, testData, { ttl: 300 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData),
        'EX',
        300
      );
      expect(result).toBe(true);
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.set(testKey, testData);

      expect(result).toBe(false);
    });

    it('should handle Redis set errors gracefully', async () => {
      const error = new Error('Redis set failed');
      mockRedis.set.mockRejectedValue(error);

      const result = await CacheService.set(testKey, testData);

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache set error:', error);
      expect(result).toBe(false);
    });

    it('should handle JSON serialization errors gracefully', async () => {
      // Create circular reference that can't be serialized
      const circularData: any = { name: 'test' };
      circularData.self = circularData;

      const result = await CacheService.set(testKey, circularData);

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache set error:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete single key', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await CacheService.delete('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should delete multiple keys', async () => {
      mockRedis.del.mockResolvedValue(2);

      const result = await CacheService.delete(['key1', 'key2']);

      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
      expect(result).toBe(true);
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.delete('test-key');

      expect(result).toBe(false);
    });

    it('should handle Redis delete errors gracefully', async () => {
      const error = new Error('Redis delete failed');
      mockRedis.del.mockRejectedValue(error);

      const result = await CacheService.delete('test-key');

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache delete error:', error);
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await CacheService.exists('test-key');

      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await CacheService.exists('test-key');

      expect(result).toBe(false);
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.exists('test-key');

      expect(result).toBe(false);
    });

    it('should handle Redis exists errors gracefully', async () => {
      const error = new Error('Redis exists failed');
      mockRedis.exists.mockRejectedValue(error);

      const result = await CacheService.exists('test-key');

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache exists error:', error);
      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('should set expiration time for key', async () => {
      mockRedis.expire.mockResolvedValue(1);

      const result = await CacheService.expire('test-key', 300);

      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 300);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedis.expire.mockResolvedValue(0);

      const result = await CacheService.expire('nonexistent-key', 300);

      expect(result).toBe(false);
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.expire('test-key', 300);

      expect(result).toBe(false);
    });

    it('should handle Redis expire errors gracefully', async () => {
      const error = new Error('Redis expire failed');
      mockRedis.expire.mockRejectedValue(error);

      const result = await CacheService.expire('test-key', 300);

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache expire error:', error);
      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return keys matching pattern', async () => {
      const matchingKeys = ['story:1', 'story:2', 'story:3'];
      mockRedis.keys.mockResolvedValue(matchingKeys);

      const result = await CacheService.keys('story:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('story:*');
      expect(result).toEqual(matchingKeys);
    });

    it('should return empty array when no keys match', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await CacheService.keys('nonexistent:*');

      expect(result).toEqual([]);
    });

    it('should return empty array when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.keys('test:*');

      expect(result).toEqual([]);
    });

    it('should handle Redis keys errors gracefully', async () => {
      const error = new Error('Redis keys failed');
      mockRedis.keys.mockRejectedValue(error);

      const result = await CacheService.keys('test:*');

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache keys error:', error);
      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all cache when no pattern provided', async () => {
      mockRedis.flushall.mockResolvedValue('OK');

      const result = await CacheService.clear();

      expect(mockRedis.flushall).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should clear specific pattern', async () => {
      const matchingKeys = ['story:1', 'story:2'];
      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockResolvedValue(2);

      const result = await CacheService.clear('story:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('story:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...matchingKeys);
      expect(result).toBe(true);
    });

    it('should handle empty pattern results', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await CacheService.clear('nonexistent:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.clear();

      expect(result).toBe(false);
    });

    it('should handle Redis clear errors gracefully', async () => {
      const error = new Error('Redis clear failed');
      mockRedis.flushall.mockRejectedValue(error);

      const result = await CacheService.clear();

      expect(mockLogger.warn).toHaveBeenCalledWith('Cache clear error:', error);
      expect(result).toBe(false);
    });
  });

  describe('wrap', () => {
    const testKey = 'test-key';
    const testData = { id: 1, name: 'Test' };

    it('should return cached value when available', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));
      const fetchFunction = jest.fn();

      const result = await CacheService.wrap(testKey, fetchFunction);

      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      expect(fetchFunction).not.toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it('should fetch and cache value when not in cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      const fetchFunction = jest.fn().mockResolvedValue(testData);

      const result = await CacheService.wrap(testKey, fetchFunction);

      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      expect(fetchFunction).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData),
        'EX',
        3600
      );
      expect(result).toEqual(testData);
    });

    it('should use custom TTL when provided', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      const fetchFunction = jest.fn().mockResolvedValue(testData);

      await CacheService.wrap(testKey, fetchFunction, { ttl: 300 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData),
        'EX',
        300
      );
    });

    it('should return fresh data when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');
      
      const fetchFunction = jest.fn().mockResolvedValue(testData);

      const result = await DisabledCacheService.wrap(testKey, fetchFunction);

      expect(fetchFunction).toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it('should handle fetch function errors gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      const error = new Error('Fetch failed');
      const fetchFunction = jest.fn().mockRejectedValue(error);

      await expect(CacheService.wrap(testKey, fetchFunction)).rejects.toThrow('Fetch failed');
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidateByTags', () => {
    it('should invalidate keys by tags', async () => {
      const keys = ['story:1', 'story:2'];
      mockRedis.keys.mockImplementation((pattern) => {
        if (pattern === 'tag:stories:*') return Promise.resolve(keys);
        return Promise.resolve([]);
      });
      mockRedis.del.mockResolvedValue(2);

      const result = await CacheService.invalidateByTags(['stories']);

      expect(mockRedis.keys).toHaveBeenCalledWith('tag:stories:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
      expect(result).toBe(true);
    });

    it('should handle multiple tags', async () => {
      mockRedis.keys
        .mockResolvedValueOnce(['story:1', 'story:2'])  // stories tag
        .mockResolvedValueOnce(['user:1', 'user:2']);   // users tag
      mockRedis.del
        .mockResolvedValueOnce(2)  // stories deletion
        .mockResolvedValueOnce(2); // users deletion

      const result = await CacheService.invalidateByTags(['stories', 'users']);

      expect(mockRedis.keys).toHaveBeenCalledWith('tag:stories:*');
      expect(mockRedis.keys).toHaveBeenCalledWith('tag:users:*');
      expect(result).toBe(true);
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { CacheService: DisabledCacheService } = require('../cacheService');

      const result = await DisabledCacheService.invalidateByTags(['stories']);

      expect(result).toBe(false);
    });
  });
});