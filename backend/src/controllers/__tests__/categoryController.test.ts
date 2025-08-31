import { Request, Response } from 'express';
import { categoryController, setPrismaClient } from '../categoryController';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

// Setup category controller to use our mock
setPrismaClient(mockPrisma);

describe('CategoryController', () => {
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

  describe('getCategories', () => {
    it('should return all categories with story counts', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: { en: 'Fiction', tr: 'Kurgu' },
          slug: 'fiction',
          description: { en: 'Fiction stories', tr: 'Kurgu hikayeleri' },
          _count: { stories: 5 },
        },
        {
          id: 'cat-2',
          name: { en: 'Technology', tr: 'Teknoloji' },
          slug: 'technology',
          description: { en: 'Tech stories', tr: 'Teknoloji hikayeleri' },
          _count: { stories: 3 },
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      await categoryController.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
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
        data: mockCategories,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Database error'));

      await categoryController.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Failed to fetch categories',
          code: 'FETCH_ERROR',
          statusCode: 500,
        },
      });
    });
  });

  describe('getCategoryById', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'cat-1' };
    });

    it('should return category by ID', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: { en: 'Fiction', tr: 'Kurgu' },
        slug: 'fiction',
        description: { en: 'Fiction stories', tr: 'Kurgu hikayeleri' },
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      await categoryController.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
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
        data: mockCategory,
      });
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await categoryController.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Category not found',
          code: 'CATEGORY_NOT_FOUND',
          statusCode: 404,
        },
      });
    });
  });

  describe('createCategory', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: { en: 'Science Fiction', tr: 'Bilim Kurgu' },
        slug: 'science-fiction',
        description: { en: 'Sci-fi stories', tr: 'Bilim kurgu hikayeleri' },
      };
      mockRequest.user = { id: 'user-1', role: 'ADMIN' };
    });

    it('should create category with admin privileges', async () => {
      const mockCreatedCategory = {
        id: 'cat-new',
        ...mockRequest.body,
        createdAt: new Date(),
      };

      mockPrisma.category.create.mockResolvedValue(mockCreatedCategory);

      await categoryController.createCategory(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedCategory,
      });
    });

    it('should validate required fields', async () => {
      mockRequest.body = { name: { en: 'Test' } }; // Missing slug

      await categoryController.createCategory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject creation for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await categoryController.createCategory(mockRequest as any, mockResponse as Response);

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
  });

  describe('updateCategory', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = {
        name: { en: 'Updated Fiction', tr: 'Güncellenmiş Kurgu' },
        description: { en: 'Updated description', tr: 'Güncellenmiş açıklama' },
      };
      mockRequest.user = { id: 'user-1', role: 'ADMIN' };
    });

    it('should update category with admin privileges', async () => {
      const mockUpdatedCategory = {
        id: 'cat-1',
        ...mockRequest.body,
        slug: 'fiction',
        updatedAt: new Date(),
      };

      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.category.update.mockResolvedValue(mockUpdatedCategory);

      await categoryController.updateCategory(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await categoryController.updateCategory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject update for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await categoryController.updateCategory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteCategory', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'cat-1' };
      mockRequest.user = { id: 'user-1', role: 'ADMIN' };
    });

    it('should delete category with admin privileges', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.category.delete.mockResolvedValue({ id: 'cat-1' });

      await categoryController.deleteCategory(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully',
      });
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await categoryController.deleteCategory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject deletion for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await categoryController.deleteCategory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getCategoriesByStoryCount', () => {
    it('should return categories ordered by story count', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: { en: 'Fiction', tr: 'Kurgu' },
          _count: { stories: 10 },
        },
        {
          id: 'cat-2',
          name: { en: 'Technology', tr: 'Teknoloji' },
          _count: { stories: 5 },
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      await categoryController.getCategoriesByStoryCount(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
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
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});