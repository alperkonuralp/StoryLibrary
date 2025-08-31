import { Request, Response } from 'express';
import { authorController, setPrismaClient } from '../authorController';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');

const mockPrisma = {
  author: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  storyAuthor: {
    findMany: jest.fn(),
  },
} as any;

// Setup author controller to use our mock
setPrismaClient(mockPrisma);

describe('AuthorController', () => {
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

  describe('getAuthors', () => {
    it('should return all authors with story counts', async () => {
      const mockAuthors = [
        {
          id: 'author-1',
          name: { en: 'Jane Doe', tr: 'Jane Doe' },
          slug: 'jane-doe',
          bio: { en: 'Author bio', tr: 'Yazar biyografisi' },
          _count: { stories: 5 },
        },
        {
          id: 'author-2',
          name: { en: 'John Smith', tr: 'John Smith' },
          slug: 'john-smith',
          bio: { en: 'Another bio', tr: 'Başka bir biyografi' },
          _count: { stories: 3 },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      await authorController.getAuthors(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.author.findMany).toHaveBeenCalledWith({
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
        data: mockAuthors,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.author.findMany.mockRejectedValue(new Error('Database error'));

      await authorController.getAuthors(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Failed to fetch authors',
          code: 'FETCH_ERROR',
          statusCode: 500,
        },
      });
    });
  });

  describe('getAuthorById', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'author-1' };
    });

    it('should return author by ID', async () => {
      const mockAuthor = {
        id: 'author-1',
        name: { en: 'Jane Doe', tr: 'Jane Doe' },
        slug: 'jane-doe',
        bio: { en: 'Author biography', tr: 'Yazar biyografisi' },
        image: 'https://example.com/author.jpg',
        website: 'https://janedoe.com',
        social: {
          twitter: '@janedoe',
          linkedin: 'linkedin.com/in/janedoe',
        },
      };

      mockPrisma.author.findUnique.mockResolvedValue(mockAuthor);

      await authorController.getAuthorById(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.author.findUnique).toHaveBeenCalledWith({
        where: { id: 'author-1' },
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
        data: mockAuthor,
      });
    });

    it('should return 404 for non-existent author', async () => {
      mockPrisma.author.findUnique.mockResolvedValue(null);

      await authorController.getAuthorById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Author not found',
          code: 'AUTHOR_NOT_FOUND',
          statusCode: 404,
        },
      });
    });
  });

  describe('getAuthorBySlug', () => {
    beforeEach(() => {
      mockRequest.params = { slug: 'jane-doe' };
    });

    it('should return author by slug', async () => {
      const mockAuthor = {
        id: 'author-1',
        name: { en: 'Jane Doe', tr: 'Jane Doe' },
        slug: 'jane-doe',
        bio: { en: 'Author biography', tr: 'Yazar biyografisi' },
      };

      mockPrisma.author.findUnique.mockResolvedValue(mockAuthor);

      await authorController.getAuthorBySlug(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.author.findUnique).toHaveBeenCalledWith({
        where: { slug: 'jane-doe' },
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
      mockPrisma.author.findUnique.mockResolvedValue(null);

      await authorController.getAuthorBySlug(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createAuthor', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: { en: 'New Author', tr: 'Yeni Yazar' },
        slug: 'new-author',
        bio: { en: 'Author biography', tr: 'Yazar biyografisi' },
        image: 'https://example.com/author.jpg',
        website: 'https://newauthor.com',
        social: {
          twitter: '@newauthor',
        },
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should create author with admin privileges', async () => {
      const mockCreatedAuthor = {
        id: 'author-new',
        ...mockRequest.body,
        createdAt: new Date(),
      };

      mockPrisma.author.create.mockResolvedValue(mockCreatedAuthor);

      await authorController.createAuthor(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedAuthor,
      });
    });

    it('should validate required fields', async () => {
      mockRequest.body = { name: { en: 'Test' } }; // Missing slug

      await authorController.createAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject creation for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await authorController.createAuthor(mockRequest as any, mockResponse as Response);

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
      mockPrisma.author.create.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await authorController.createAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Author slug already exists',
          code: 'SLUG_EXISTS',
          statusCode: 409,
        },
      });
    });
  });

  describe('updateAuthor', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'author-1' };
      mockRequest.body = {
        name: { en: 'Updated Author', tr: 'Güncellenmiş Yazar' },
        bio: { en: 'Updated biography', tr: 'Güncellenmiş biyografi' },
        website: 'https://updated-author.com',
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should update author with admin privileges', async () => {
      const mockUpdatedAuthor = {
        id: 'author-1',
        ...mockRequest.body,
        slug: 'jane-doe',
        updatedAt: new Date(),
      };

      mockPrisma.author.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.author.update.mockResolvedValue(mockUpdatedAuthor);

      await authorController.updateAuthor(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.author.update).toHaveBeenCalledWith({
        where: { id: 'author-1' },
        data: mockRequest.body,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedAuthor,
      });
    });

    it('should return 404 for non-existent author', async () => {
      mockPrisma.author.findUnique.mockResolvedValue(null);

      await authorController.updateAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Author not found',
          code: 'AUTHOR_NOT_FOUND',
          statusCode: 404,
        },
      });
    });

    it('should reject update for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await authorController.updateAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle slug conflicts on update', async () => {
      mockRequest.body = { slug: 'existing-slug' };
      mockPrisma.author.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.author.update.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await authorController.updateAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteAuthor', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'author-1' };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should delete author with admin privileges', async () => {
      mockPrisma.author.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.author.delete.mockResolvedValue({ id: 'author-1' });

      await authorController.deleteAuthor(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.author.delete).toHaveBeenCalledWith({
        where: { id: 'author-1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Author deleted successfully',
      });
    });

    it('should return 404 for non-existent author', async () => {
      mockPrisma.author.findUnique.mockResolvedValue(null);

      await authorController.deleteAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should reject deletion for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'EDITOR' };

      await authorController.deleteAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle foreign key constraint errors', async () => {
      mockPrisma.author.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.author.delete.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
      });

      await authorController.deleteAuthor(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Cannot delete author with associated stories',
          code: 'CONSTRAINT_ERROR',
          statusCode: 409,
        },
      });
    });
  });

  describe('getAuthorStories', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'author-1' };
    });

    it('should return stories by author', async () => {
      const mockStories = [
        {
          story: {
            id: 'story-1',
            title: { en: 'Story 1', tr: 'Hikaye 1' },
            slug: 'story-1',
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        },
        {
          story: {
            id: 'story-2',
            title: { en: 'Story 2', tr: 'Hikaye 2' },
            slug: 'story-2',
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        },
      ];

      mockPrisma.storyAuthor.findMany.mockResolvedValue(mockStories);

      await authorController.getAuthorStories(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.storyAuthor.findMany).toHaveBeenCalledWith({
        where: {
          authorId: 'author-1',
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
      mockPrisma.storyAuthor.findMany.mockRejectedValue(new Error('Database error'));

      await authorController.getAuthorStories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPopularAuthors', () => {
    it('should return authors ordered by story count', async () => {
      const mockAuthors = [
        {
          id: 'author-1',
          name: { en: 'Popular Author', tr: 'Popüler Yazar' },
          slug: 'popular-author',
          _count: { stories: 15 },
        },
        {
          id: 'author-2',
          name: { en: 'Another Author', tr: 'Başka Yazar' },
          slug: 'another-author',
          _count: { stories: 10 },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      await authorController.getPopularAuthors(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.author.findMany).toHaveBeenCalledWith({
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
        take: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('searchAuthors', () => {
    beforeEach(() => {
      mockRequest.query = { q: 'Jane' };
    });

    it('should search authors by name', async () => {
      const mockAuthors = [
        {
          id: 'author-1',
          name: { en: 'Jane Doe', tr: 'Jane Doe' },
          slug: 'jane-doe',
          _count: { stories: 5 },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      await authorController.searchAuthors(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.author.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              name: {
                path: ['en'],
                string_contains: 'Jane',
              },
            },
            {
              name: {
                path: ['tr'],
                string_contains: 'Jane',
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

      await authorController.searchAuthors(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });
});