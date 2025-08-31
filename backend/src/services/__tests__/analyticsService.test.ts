import { AnalyticsService } from '../analyticsService';
import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockPrisma = {
  userReadingProgress: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  userStoryRating: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  story: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as any;

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackStoryView', () => {
    it('should track story view for authenticated user', async () => {
      const storyId = 'story-1';
      const userId = 'user-1';
      const sessionId = 'session-123';

      await AnalyticsService.trackStoryView(storyId, userId, sessionId);

      expect(mockLogger.info).toHaveBeenCalledWith('Story view tracked', {
        storyId: 'story-1',
        userId: 'user-1',
        sessionId: 'session-123',
        timestamp: expect.any(String),
      });
    });

    it('should track story view for anonymous user', async () => {
      const storyId = 'story-1';

      await AnalyticsService.trackStoryView(storyId);

      expect(mockLogger.info).toHaveBeenCalledWith('Story view tracked', {
        storyId: 'story-1',
        userId: 'anonymous',
        sessionId: 'unknown',
        timestamp: expect.any(String),
      });
    });

    it('should handle tracking errors gracefully', async () => {
      const storyId = 'story-1';
      const error = new Error('Tracking failed');

      // Mock logger.info to throw an error
      mockLogger.info.mockImplementation(() => {
        throw error;
      });

      await AnalyticsService.trackStoryView(storyId);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to track story view:', error);
    });
  });

  describe('trackReadingProgress', () => {
    const storyId = 'story-1';
    const userId = 'user-1';
    const progress = 75;
    const lastParagraph = 10;

    it('should track reading progress successfully', async () => {
      const mockProgress = {
        userId,
        storyId,
        progress,
        currentPosition: lastParagraph,
        updatedAt: new Date(),
      };

      mockPrisma.userReadingProgress.upsert.mockResolvedValue(mockProgress);

      await AnalyticsService.trackReadingProgress(storyId, userId, progress, lastParagraph);

      expect(mockPrisma.userReadingProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId,
            storyId,
          },
        },
        create: {
          userId,
          storyId,
          progress,
          currentPosition: lastParagraph,
        },
        update: {
          progress,
          currentPosition: lastParagraph,
        },
      });
    });

    it('should track reading progress without last paragraph', async () => {
      const mockProgress = {
        userId,
        storyId,
        progress,
        currentPosition: null,
        updatedAt: new Date(),
      };

      mockPrisma.userReadingProgress.upsert.mockResolvedValue(mockProgress);

      await AnalyticsService.trackReadingProgress(storyId, userId, progress);

      expect(mockPrisma.userReadingProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId,
            storyId,
          },
        },
        create: {
          userId,
          storyId,
          progress,
          currentPosition: undefined,
        },
        update: {
          progress,
          currentPosition: undefined,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.userReadingProgress.upsert.mockRejectedValue(error);

      await expect(
        AnalyticsService.trackReadingProgress(storyId, userId, progress, lastParagraph)
      ).rejects.toThrow('Database error');
    });
  });

  describe('submitRating', () => {
    const storyId = 'story-1';
    const userId = 'user-1';
    const rating = 4;
    const review = 'Great story!';

    it('should submit rating successfully', async () => {
      const mockRating = {
        userId,
        storyId,
        rating,
        review,
        createdAt: new Date(),
      };

      mockPrisma.userStoryRating.upsert.mockResolvedValue(mockRating);

      await AnalyticsService.submitRating(storyId, userId, rating, review);

      expect(mockPrisma.userStoryRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId,
            storyId,
          },
        },
        create: {
          userId,
          storyId,
          rating,
          review,
        },
        update: {
          rating,
          review,
        },
      });
    });

    it('should submit rating without review', async () => {
      const mockRating = {
        userId,
        storyId,
        rating,
        review: null,
        createdAt: new Date(),
      };

      mockPrisma.userStoryRating.upsert.mockResolvedValue(mockRating);

      await AnalyticsService.submitRating(storyId, userId, rating);

      expect(mockPrisma.userStoryRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId,
            storyId,
          },
        },
        create: {
          userId,
          storyId,
          rating,
          review: undefined,
        },
        update: {
          rating,
          review: undefined,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.userStoryRating.upsert.mockRejectedValue(error);

      await expect(
        AnalyticsService.submitRating(storyId, userId, rating, review)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserReadingStats', () => {
    const userId = 'user-1';

    it('should return user reading statistics', async () => {
      const mockProgressData = [
        {
          id: 'progress-1',
          storyId: 'story-1',
          progress: 100,
          isCompleted: true,
          story: {
            id: 'story-1',
            title: { en: 'Story 1' },
            slug: 'story-1',
          },
        },
        {
          id: 'progress-2',
          storyId: 'story-2',
          progress: 50,
          isCompleted: false,
          story: {
            id: 'story-2',
            title: { en: 'Story 2' },
            slug: 'story-2',
          },
        },
      ];

      mockPrisma.userReadingProgress.findMany.mockResolvedValue(mockProgressData);

      const result = await AnalyticsService.getUserReadingStats(userId);

      expect(mockPrisma.userReadingProgress.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual({
        totalStories: 2,
        completedStories: 1,
        inProgressStories: 1,
        averageProgress: 75, // (100 + 50) / 2
        stories: mockProgressData,
      });
    });

    it('should handle empty reading history', async () => {
      mockPrisma.userReadingProgress.findMany.mockResolvedValue([]);

      const result = await AnalyticsService.getUserReadingStats(userId);

      expect(result).toEqual({
        totalStories: 0,
        completedStories: 0,
        inProgressStories: 0,
        averageProgress: 0,
        stories: [],
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.userReadingProgress.findMany.mockRejectedValue(error);

      await expect(AnalyticsService.getUserReadingStats(userId)).rejects.toThrow('Database error');
    });
  });

  describe('getUserRatings', () => {
    const userId = 'user-1';

    it('should return user ratings', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          storyId: 'story-1',
          rating: 5,
          review: 'Excellent!',
          createdAt: new Date(),
          story: {
            id: 'story-1',
            title: { en: 'Story 1' },
            slug: 'story-1',
          },
        },
        {
          id: 'rating-2',
          storyId: 'story-2',
          rating: 4,
          review: 'Very good',
          createdAt: new Date(),
          story: {
            id: 'story-2',
            title: { en: 'Story 2' },
            slug: 'story-2',
          },
        },
      ];

      mockPrisma.userStoryRating.findMany.mockResolvedValue(mockRatings);

      const result = await AnalyticsService.getUserRatings(userId);

      expect(mockPrisma.userStoryRating.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockRatings);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.userStoryRating.findMany.mockRejectedValue(error);

      await expect(AnalyticsService.getUserRatings(userId)).rejects.toThrow('Database error');
    });
  });

  describe('getStoryAnalytics', () => {
    const storyId = 'story-1';

    it('should return story analytics', async () => {
      const mockProgressData = [
        { progress: 100 },
        { progress: 75 },
        { progress: 50 },
      ];
      const mockRatingData = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
      ];

      mockPrisma.userReadingProgress.findMany.mockResolvedValue(mockProgressData);
      mockPrisma.userStoryRating.findMany.mockResolvedValue(mockRatingData);

      const result = await AnalyticsService.getStoryAnalytics(storyId);

      expect(result).toEqual({
        totalReaders: 3,
        completionRate: 33.33, // 1 out of 3 completed (progress >= 100)
        averageProgress: 75, // (100 + 75 + 50) / 3
        averageRating: 4.67, // (5 + 4 + 5) / 3
        totalRatings: 3,
        ratingDistribution: {
          5: 2,
          4: 1,
          3: 0,
          2: 0,
          1: 0,
        },
      });
    });

    it('should handle stories with no analytics data', async () => {
      mockPrisma.userReadingProgress.findMany.mockResolvedValue([]);
      mockPrisma.userStoryRating.findMany.mockResolvedValue([]);

      const result = await AnalyticsService.getStoryAnalytics(storyId);

      expect(result).toEqual({
        totalReaders: 0,
        completionRate: 0,
        averageProgress: 0,
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      });
    });
  });

  describe('getSystemAnalytics', () => {
    it('should return system-wide analytics', async () => {
      const mockStoryCount = 100;
      const mockUserCount = 250;
      const mockCompletionData = [
        { isCompleted: true },
        { isCompleted: true },
        { isCompleted: false },
      ];

      mockPrisma.story.count.mockResolvedValue(mockStoryCount);
      mockPrisma.user.count.mockResolvedValue(mockUserCount);
      mockPrisma.userReadingProgress.findMany.mockResolvedValue(mockCompletionData);

      const result = await AnalyticsService.getSystemAnalytics();

      expect(result).toEqual({
        totalStories: 100,
        totalUsers: 250,
        totalReadingSessions: 3,
        overallCompletionRate: 66.67, // 2 out of 3 completed
      });
    });

    it('should handle empty system data', async () => {
      mockPrisma.story.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.userReadingProgress.findMany.mockResolvedValue([]);

      const result = await AnalyticsService.getSystemAnalytics();

      expect(result).toEqual({
        totalStories: 0,
        totalUsers: 0,
        totalReadingSessions: 0,
        overallCompletionRate: 0,
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrisma.story.count.mockRejectedValue(error);

      await expect(AnalyticsService.getSystemAnalytics()).rejects.toThrow('Database error');
    });
  });

  describe('getPopularStories', () => {
    const limit = 10;

    it('should return popular stories based on ratings', async () => {
      const mockPopularStories = [
        {
          id: 'story-1',
          title: { en: 'Popular Story 1' },
          averageRating: 4.8,
          ratingCount: 50,
        },
        {
          id: 'story-2',
          title: { en: 'Popular Story 2' },
          averageRating: 4.7,
          ratingCount: 45,
        },
      ];

      mockPrisma.story.findMany.mockResolvedValue(mockPopularStories);

      const result = await AnalyticsService.getPopularStories(limit);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          ratingCount: {
            gte: 5, // Minimum rating threshold
          },
        },
        orderBy: [
          { averageRating: 'desc' },
          { ratingCount: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          averageRating: true,
          ratingCount: true,
          publishedAt: true,
        },
      });
      expect(result).toEqual(mockPopularStories);
    });

    it('should use default limit if not provided', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await AnalyticsService.getPopularStories();

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20, // Default limit
        })
      );
    });
  });
});