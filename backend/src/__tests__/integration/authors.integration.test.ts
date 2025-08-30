import request from 'supertest';
import app from '../../app-auth';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  author: {
    findMany: jest.fn(),
  },
} as jest.Mocked<Pick<PrismaClient, 'author'>>;

// Mock Prisma module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Authors API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/authors', () => {
    it('should return authors with story counts correctly', async () => {
      const mockAuthors = [
        {
          id: 'author-1',
          name: 'Jane Doe',
          bio: {
            en: 'Jane Doe is a bestselling author.',
            tr: 'Jane Doe çok satan bir yazardır.',
          },
          slug: 'jane-doe',
          createdAt: '2024-01-01T00:00:00Z',
          stories: [
            {
              story: {
                id: 'story-1',
                title: { en: 'Story 1', tr: 'Hikaye 1' },
                status: 'PUBLISHED',
                publishedAt: '2024-01-01T00:00:00Z',
              },
            },
            {
              story: {
                id: 'story-2',
                title: { en: 'Story 2', tr: 'Hikaye 2' },
                status: 'PUBLISHED',
                publishedAt: '2024-01-02T00:00:00Z',
              },
            },
          ],
          _count: {
            stories: 2,
          },
        },
        {
          id: 'author-2',
          name: 'Ayşe Yılmaz',
          bio: {
            en: 'Ayşe Yılmaz is a Turkish writer.',
            tr: 'Ayşe Yılmaz Türk bir yazardır.',
          },
          slug: 'ayse-yilmaz',
          createdAt: '2024-01-01T00:00:00Z',
          stories: [], // No stories
          _count: {
            stories: 0,
          },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      const response = await request(app)
        .get('/api/authors')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAuthors,
      });

      // Verify the Prisma query structure
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith({
        include: {
          stories: {
            select: {
              story: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  publishedAt: true,
                },
              },
            },
          },
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
    });

    it('should handle authors with no stories', async () => {
      const mockAuthors = [
        {
          id: 'author-3',
          name: 'New Author',
          bio: { en: 'New author bio', tr: 'Yeni yazar biyografisi' },
          slug: 'new-author',
          createdAt: '2024-01-01T00:00:00Z',
          stories: [],
          _count: { stories: 0 },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      const response = await request(app)
        .get('/api/authors')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0]._count.stories).toBe(0);
      expect(response.body.data[0].stories).toEqual([]);
    });

    it('should handle Prisma errors gracefully', async () => {
      mockPrisma.author.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/authors')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch authors',
        },
      });
    });

    it('should sort authors by name in ascending order', async () => {
      const mockAuthors = [
        {
          id: 'author-1',
          name: 'Alice Smith',
          slug: 'alice-smith',
          stories: [],
          _count: { stories: 0 },
        },
        {
          id: 'author-2', 
          name: 'Bob Johnson',
          slug: 'bob-johnson',
          stories: [],
          _count: { stories: 0 },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      await request(app)
        .get('/api/authors')
        .expect(200);

      // Verify sorting was requested
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            name: 'asc',
          },
        })
      );
    });

    it('should include story relationships correctly', async () => {
      const mockAuthors = [
        {
          id: 'author-1',
          name: 'Test Author',
          stories: [
            {
              story: {
                id: 'story-1',
                title: { en: 'Published Story', tr: 'Yayınlanmış Hikaye' },
                status: 'PUBLISHED',
                publishedAt: '2024-01-01T00:00:00Z',
              },
            },
            {
              story: {
                id: 'story-2',
                title: { en: 'Draft Story', tr: 'Taslak Hikaye' },
                status: 'DRAFT',
                publishedAt: null,
              },
            },
          ],
          _count: { stories: 2 },
        },
      ];

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors);

      const response = await request(app)
        .get('/api/authors')
        .expect(200);

      const author = response.body.data[0];
      expect(author.stories).toHaveLength(2);
      expect(author.stories[0].story.id).toBe('story-1');
      expect(author.stories[0].story.status).toBe('PUBLISHED');
      expect(author._count.stories).toBe(2);
    });
  });
});