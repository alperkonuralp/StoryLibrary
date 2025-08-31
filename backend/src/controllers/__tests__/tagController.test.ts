import { Request, Response } from 'express';
import { tagController, setPrismaClient } from '../tagController';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');

const mockPrisma = {
  tag: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  storyTag: {
    findMany: jest.fn(),
  },
} as any;

// Setup tag controller to use our mock
setPrismaClient(mockPrisma);

describe('TagController', () => {
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

  describe('getTags', () => {
    it('should return all tags with story counts', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'Adventure',
          slug: 'adventure',
          color: '#FF6B6B',
          _count: { stories: 12 },
        },
        {
          id: 'tag-2',
          name: 'Romance',
          slug: 'romance',
          color: '#4ECDC4',
          _count: { stories: 8 },
        },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      await tagController.getTags(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
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
        data: mockTags,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.tag.findMany.mockRejectedValue(new Error('Database error'));

      await tagController.getTags(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Failed to fetch tags',
          code: 'FETCH_ERROR',
          statusCode: 500,
        },
      });
    });
  });

  describe('getTagById', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'tag-1' };
    });

    it('should return tag by ID', async () => {
      const mockTag = {
        id: 'tag-1',
        name: 'Adventure',
        slug: 'adventure',
        color: '#FF6B6B',
        description: 'Stories with adventure themes',
        _count: { stories: 12 },
      };

      mockPrisma.tag.findUnique.mockResolvedValue(mockTag);

      await tagController.getTagById(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
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
        data: mockTag,
      });
    });

    it('should return 404 for non-existent tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await tagController.getTagById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Tag not found',
          code: 'TAG_NOT_FOUND',
          statusCode: 404,
        },
      });
    });
  });

  describe('getTagBySlug', () => {
    beforeEach(() => {
      mockRequest.params = { slug: 'adventure' };
    });

    it('should return tag by slug', async () => {
      const mockTag = {
        id: 'tag-1',
        name: 'Adventure',
        slug: 'adventure',
        color: '#FF6B6B',
        _count: { stories: 12 },
      };

      mockPrisma.tag.findUnique.mockResolvedValue(mockTag);

      await tagController.getTagBySlug(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({
        where: { slug: 'adventure' },
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
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await tagController.getTagBySlug(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createTag', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: 'Mystery',
        slug: 'mystery',
        color: '#9B59B6',
        description: 'Mystery and thriller stories',
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should create tag with admin privileges', async () => {
      const mockCreatedTag = {
        id: 'tag-new',
        ...mockRequest.body,
        createdAt: new Date(),
      };

      mockPrisma.tag.create.mockResolvedValue(mockCreatedTag);

      await tagController.createTag(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedTag,
      });
    });

    it('should validate required fields', async () => {
      mockRequest.body = { name: 'Test' }; // Missing slug

      await tagController.createTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject creation for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await tagController.createTag(mockRequest as any, mockResponse as Response);

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
      mockPrisma.tag.create.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await tagController.createTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Tag slug already exists',
          code: 'SLUG_EXISTS',
          statusCode: 409,
        },
      });
    });

    it('should validate color format', async () => {
      mockRequest.body = {
        name: 'Test Tag',
        slug: 'test-tag',
        color: 'invalid-color',
      };

      await tagController.createTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should set default color if not provided', async () => {
      mockRequest.body = {
        name: 'Test Tag',
        slug: 'test-tag',
      };

      const mockCreatedTag = {
        id: 'tag-new',
        name: 'Test Tag',
        slug: 'test-tag',
        color: '#6B7280',
      };

      mockPrisma.tag.create.mockResolvedValue(mockCreatedTag);

      await tagController.createTag(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Tag',
          slug: 'test-tag',
          color: '#6B7280',
        },
      });
    });
  });

  describe('updateTag', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'tag-1' };
      mockRequest.body = {
        name: 'Updated Mystery',
        description: 'Updated description for mystery stories',
        color: '#8E44AD',
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should update tag with admin privileges', async () => {
      const mockUpdatedTag = {
        id: 'tag-1',
        ...mockRequest.body,
        slug: 'mystery',
        updatedAt: new Date(),
      };

      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1' });
      mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag);

      await tagController.updateTag(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedTag,
      });
    });

    it('should return 404 for non-existent tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await tagController.updateTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Tag not found',
          code: 'TAG_NOT_FOUND',
          statusCode: 404,
        },
      });
    });

    it('should reject update for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await tagController.updateTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should validate color format on update', async () => {
      mockRequest.body = { color: 'not-a-hex-color' };
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1' });

      await tagController.updateTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle slug conflicts on update', async () => {
      mockRequest.body = { slug: 'existing-slug' };
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1' });
      mockPrisma.tag.update.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await tagController.updateTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteTag', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'tag-1' };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should delete tag with admin privileges', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1' });
      mockPrisma.tag.delete.mockResolvedValue({ id: 'tag-1' });

      await tagController.deleteTag(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tag deleted successfully',
      });
    });

    it('should return 404 for non-existent tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await tagController.deleteTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject deletion for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await tagController.deleteTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle foreign key constraint errors', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1' });
      mockPrisma.tag.delete.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
      });

      await tagController.deleteTag(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Cannot delete tag with associated stories',
          code: 'CONSTRAINT_ERROR',
          statusCode: 409,
        },
      });
    });
  });

  describe('getTagStories', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'tag-1' };
    });

    it('should return stories by tag', async () => {
      const mockStories = [
        {
          story: {
            id: 'story-1',
            title: { en: 'Adventure Story', tr: 'Macera Hikayesi' },
            slug: 'adventure-story',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            averageRating: 4.5,
            ratingCount: 10,
          },
        },
        {
          story: {
            id: 'story-2',
            title: { en: 'Another Adventure', tr: 'Başka Macera' },
            slug: 'another-adventure',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            averageRating: 4.2,
            ratingCount: 15,
          },
        },
      ];

      mockPrisma.storyTag.findMany.mockResolvedValue(mockStories);

      await tagController.getTagStories(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.storyTag.findMany).toHaveBeenCalledWith({
        where: {
          tagId: 'tag-1',
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
          story: {
            publishedAt: 'desc',
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStories.map(item => item.story),
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.storyTag.findMany.mockRejectedValue(new Error('Database error'));

      await tagController.getTagStories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPopularTags', () => {
    it('should return tags ordered by story count', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'Adventure',
          slug: 'adventure',
          color: '#FF6B6B',
          _count: { stories: 25 },
        },
        {
          id: 'tag-2',
          name: 'Romance',
          slug: 'romance',
          color: '#4ECDC4',
          _count: { stories: 18 },
        },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      await tagController.getPopularTags(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              stories: true,
            },
          },
        },
        orderBy: {
          stories: {
            _count: 'desc',
          },
        },
        take: 20,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('searchTags', () => {
    beforeEach(() => {
      mockRequest.query = { q: 'adven' };
    });

    it('should search tags by name', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'Adventure',
          slug: 'adventure',
          color: '#FF6B6B',
          _count: { stories: 12 },
        },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      await tagController.searchTags(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              name: {
                contains: 'adven',
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: 'adven',
                mode: 'insensitive',
              },
            },
          ],
        },
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
    });

    it('should return empty results for no query', async () => {
      mockRequest.query = {};

      await tagController.searchTags(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should handle minimum query length requirement', async () => {
      mockRequest.query = { q: 'a' }; // Too short

      await tagController.searchTags(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Search query must be at least 2 characters long',
          code: 'INVALID_QUERY',
          statusCode: 400,
        },
      });
    });
  });

  describe('getTagsByColor', () => {
    beforeEach(() => {
      mockRequest.query = { color: '#FF6B6B' };
    });

    it('should return tags filtered by color', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'Adventure',
          slug: 'adventure',
          color: '#FF6B6B',
          _count: { stories: 12 },
        },
        {
          id: 'tag-3',
          name: 'Action',
          slug: 'action',
          color: '#FF6B6B',
          _count: { stories: 8 },
        },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      await tagController.getTagsByColor(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: {
          color: '#FF6B6B',
        },
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
    });

    it('should validate color format', async () => {
      mockRequest.query = { color: 'invalid-color' };

      await tagController.getTagsByColor(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});