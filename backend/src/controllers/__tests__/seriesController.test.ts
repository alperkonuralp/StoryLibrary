import { Request, Response } from 'express';
import { seriesController, setPrismaClient } from '../seriesController';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');

const mockPrisma = {
  series: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  storySeries: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

// Setup series controller to use our mock
setPrismaClient(mockPrisma);

describe('SeriesController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getSeries', () => {
    it('should return all series with story counts', async () => {
      const mockSeries = [
        {
          id: 'series-1',
          name: { en: 'Epic Fantasy Series', tr: 'Epik Fantezi Serisi' },
          slug: 'epic-fantasy-series',
          description: { en: 'A magical journey', tr: 'Büyülü bir yolculuk' },
          _count: { stories: 5 },
        },
        {
          id: 'series-2',
          name: { en: 'Mystery Chronicles', tr: 'Gizem Günlükleri' },
          slug: 'mystery-chronicles',
          description: { en: 'Solve the mysteries', tr: 'Gizemleri çöz' },
          _count: { stories: 3 },
        },
      ];

      mockPrisma.series.findMany.mockResolvedValue(mockSeries);

      await seriesController.getSeries(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.series.findMany).toHaveBeenCalledWith({
        include: {
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
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSeries,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.series.findMany.mockRejectedValue(new Error('Database error'));

      await seriesController.getSeries(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Failed to fetch series',
          code: 'FETCH_ERROR',
          statusCode: 500,
        },
      });
    });
  });

  describe('getSeriesById', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1' };
    });

    it('should return series by ID', async () => {
      const mockSeries = {
        id: 'series-1',
        name: { en: 'Epic Fantasy Series', tr: 'Epik Fantezi Serisi' },
        slug: 'epic-fantasy-series',
        description: { en: 'A magical journey', tr: 'Büyülü bir yolculuk' },
        image: 'https://example.com/series.jpg',
        _count: { stories: 5 },
      };

      mockPrisma.series.findUnique.mockResolvedValue(mockSeries);

      await seriesController.getSeriesById(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.series.findUnique).toHaveBeenCalledWith({
        where: { id: 'series-1' },
        include: {
          _count: {
            select: {
              stories: true,
            },
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSeries,
      });
    });

    it('should return 404 for non-existent series', async () => {
      mockPrisma.series.findUnique.mockResolvedValue(null);

      await seriesController.getSeriesById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Series not found',
          code: 'SERIES_NOT_FOUND',
          statusCode: 404,
        },
      });
    });
  });

  describe('getSeriesBySlug', () => {
    beforeEach(() => {
      mockRequest.params = { slug: 'epic-fantasy-series' };
    });

    it('should return series by slug', async () => {
      const mockSeries = {
        id: 'series-1',
        name: { en: 'Epic Fantasy Series', tr: 'Epik Fantezi Serisi' },
        slug: 'epic-fantasy-series',
        description: { en: 'A magical journey', tr: 'Büyülü bir yolculuk' },
        _count: { stories: 5 },
      };

      mockPrisma.series.findUnique.mockResolvedValue(mockSeries);

      await seriesController.getSeriesBySlug(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.series.findUnique).toHaveBeenCalledWith({
        where: { slug: 'epic-fantasy-series' },
        include: {
          _count: {
            select: {
              stories: true,
            },
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent slug', async () => {
      mockPrisma.series.findUnique.mockResolvedValue(null);

      await seriesController.getSeriesBySlug(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createSeries', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: { en: 'New Fantasy Series', tr: 'Yeni Fantezi Serisi' },
        slug: 'new-fantasy-series',
        description: { en: 'A new adventure', tr: 'Yeni bir macera' },
        image: 'https://example.com/new-series.jpg',
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should create series with admin privileges', async () => {
      const mockCreatedSeries = {
        id: 'series-new',
        ...mockRequest.body,
        createdAt: new Date(),
      };

      mockPrisma.series.create.mockResolvedValue(mockCreatedSeries);

      await seriesController.createSeries(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.series.create).toHaveBeenCalledWith({
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedSeries,
      });
    });

    it('should validate required fields', async () => {
      mockRequest.body = { name: { en: 'Test' } }; // Missing slug

      await seriesController.createSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject creation for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await seriesController.createSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          statusCode: 403,
        },
      });
    });

    it('should handle slug conflicts', async () => {
      mockPrisma.series.create.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await seriesController.createSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Series slug already exists',
          code: 'SLUG_EXISTS',
          statusCode: 409,
        },
      });
    });

    it('should validate multilingual name format', async () => {
      mockRequest.body = {
        name: 'Simple string instead of object',
        slug: 'test-series',
      };

      await seriesController.createSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateSeries', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1' };
      mockRequest.body = {
        name: { en: 'Updated Fantasy Series', tr: 'Güncellenmiş Fantezi Serisi' },
        description: { en: 'Updated description', tr: 'Güncellenmiş açıklama' },
        image: 'https://example.com/updated-series.jpg',
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should update series with admin privileges', async () => {
      const mockUpdatedSeries = {
        id: 'series-1',
        ...mockRequest.body,
        slug: 'epic-fantasy-series',
        updatedAt: new Date(),
      };

      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.series.update.mockResolvedValue(mockUpdatedSeries);

      await seriesController.updateSeries(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.series.update).toHaveBeenCalledWith({
        where: { id: 'series-1' },
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedSeries,
      });
    });

    it('should return 404 for non-existent series', async () => {
      mockPrisma.series.findUnique.mockResolvedValue(null);

      await seriesController.updateSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Series not found',
          code: 'SERIES_NOT_FOUND',
          statusCode: 404,
        },
      });
    });

    it('should reject update for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await seriesController.updateSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle slug conflicts on update', async () => {
      mockRequest.body = { slug: 'existing-slug' };
      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.series.update.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await seriesController.updateSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteSeries', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1' };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should delete series with admin privileges', async () => {
      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.series.delete.mockResolvedValue({ id: 'series-1' });

      await seriesController.deleteSeries(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.series.delete).toHaveBeenCalledWith({
        where: { id: 'series-1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series deleted successfully',
      });
    });

    it('should return 404 for non-existent series', async () => {
      mockPrisma.series.findUnique.mockResolvedValue(null);

      await seriesController.deleteSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject deletion for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await seriesController.deleteSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle foreign key constraint errors', async () => {
      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.series.delete.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
      });

      await seriesController.deleteSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Cannot delete series with associated stories',
          code: 'CONSTRAINT_ERROR',
          statusCode: 409,
        },
      });
    });
  });

  describe('getSeriesStories', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1' };
    });

    it('should return stories in series ordered by position', async () => {
      const mockStories = [
        {
          position: 1,
          story: {
            id: 'story-1',
            title: { en: 'First Story', tr: 'İlk Hikaye' },
            slug: 'first-story',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            averageRating: 4.5,
            ratingCount: 10,
          },
        },
        {
          position: 2,
          story: {
            id: 'story-2',
            title: { en: 'Second Story', tr: 'İkinci Hikaye' },
            slug: 'second-story',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            averageRating: 4.2,
            ratingCount: 8,
          },
        },
      ];

      mockPrisma.storySeries.findMany.mockResolvedValue(mockStories);

      await seriesController.getSeriesStories(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.storySeries.findMany).toHaveBeenCalledWith({
        where: {
          seriesId: 'series-1',
          story: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              shortDescription: true,
              slug: true,
              status: true,
              publishedAt: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
        orderBy: {
          position: 'asc',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStories.map(item => ({
          ...item.story,
          seriesPosition: item.position,
        })),
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.storySeries.findMany.mockRejectedValue(new Error('Database error'));

      await seriesController.getSeriesStories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addStoryToSeries', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1' };
      mockRequest.body = {
        storyId: 'story-1',
        position: 3,
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should add story to series with admin privileges', async () => {
      const mockSeriesStory = {
        seriesId: 'series-1',
        storyId: 'story-1',
        position: 3,
        createdAt: new Date(),
      };

      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.storySeries.create.mockResolvedValue(mockSeriesStory);

      await seriesController.addStoryToSeries(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.storySeries.create).toHaveBeenCalledWith({
        data: {
          seriesId: 'series-1',
          storyId: 'story-1',
          position: 3,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSeriesStory,
      });
    });

    it('should auto-assign position if not provided', async () => {
      mockRequest.body = { storyId: 'story-1' }; // No position
      const mockExistingStories = [{ position: 1 }, { position: 2 }];

      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.storySeries.findMany.mockResolvedValue(mockExistingStories);
      mockPrisma.storySeries.create.mockResolvedValue({
        seriesId: 'series-1',
        storyId: 'story-1',
        position: 3,
      });

      await seriesController.addStoryToSeries(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.storySeries.create).toHaveBeenCalledWith({
        data: {
          seriesId: 'series-1',
          storyId: 'story-1',
          position: 3,
        },
      });
    });

    it('should return 404 for non-existent series', async () => {
      mockPrisma.series.findUnique.mockResolvedValue(null);

      await seriesController.addStoryToSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await seriesController.addStoryToSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle duplicate story in series', async () => {
      mockPrisma.series.findUnique.mockResolvedValue({ id: 'series-1' });
      mockPrisma.storySeries.create.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
      });

      await seriesController.addStoryToSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Story is already in this series',
          code: 'DUPLICATE_STORY_IN_SERIES',
          statusCode: 409,
        },
      });
    });
  });

  describe('updateStoryPosition', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1', storyId: 'story-1' };
      mockRequest.body = { position: 1 };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should update story position with admin privileges', async () => {
      const mockUpdatedSeriesStory = {
        seriesId: 'series-1',
        storyId: 'story-1',
        position: 1,
        updatedAt: new Date(),
      };

      mockPrisma.storySeries.update.mockResolvedValue(mockUpdatedSeriesStory);

      await seriesController.updateStoryPosition(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.storySeries.update).toHaveBeenCalledWith({
        where: {
          seriesId_storyId: {
            seriesId: 'series-1',
            storyId: 'story-1',
          },
        },
        data: { position: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent series-story relationship', async () => {
      mockPrisma.storySeries.update.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
      });

      await seriesController.updateStoryPosition(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should validate position is positive integer', async () => {
      mockRequest.body = { position: -1 };

      await seriesController.updateStoryPosition(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('removeStoryFromSeries', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'series-1', storyId: 'story-1' };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should remove story from series with admin privileges', async () => {
      mockPrisma.storySeries.delete.mockResolvedValue({
        seriesId: 'series-1',
        storyId: 'story-1',
      });

      await seriesController.removeStoryFromSeries(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.storySeries.delete).toHaveBeenCalledWith({
        where: {
          seriesId_storyId: {
            seriesId: 'series-1',
            storyId: 'story-1',
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Story removed from series successfully',
      });
    });

    it('should return 404 for non-existent series-story relationship', async () => {
      mockPrisma.storySeries.delete.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
      });

      await seriesController.removeStoryFromSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await seriesController.removeStoryFromSeries(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});