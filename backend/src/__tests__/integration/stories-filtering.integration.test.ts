import request from 'supertest';
import app from '../../app'; // Use the main app with filtering

// Mock Prisma first with proper hoisting
const mockPrisma = {
  story: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('Stories API Filtering Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stories with authorId filter', () => {
    it('should filter stories by authorId correctly', async () => {
      const mockStories = [
        {
          id: '1',
          title: { en: 'Story by Author 1', tr: 'Yazar 1 Hikayesi' },
          shortDescription: { en: 'Description', tr: 'Açıklama' },
          slug: 'story-author-1',
          status: 'PUBLISHED',
          publishedAt: '2024-01-01T00:00:00Z',
          averageRating: 4.5,
          ratingCount: 10,
          authors: [{
            authorId: 'author-123',
            role: 'author',
            author: { id: 'author-123', name: 'Jane Doe' }
          }],
          categories: [],
          tags: [],
          _count: { ratings: 10 }
        }
      ];

      mockPrisma.story.findMany.mockResolvedValue(mockStories);
      mockPrisma.story.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/stories?authorId=author-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toHaveLength(1);
      expect(response.body.data.stories[0].authors[0].authorId).toBe('author-123');
      
      // Verify the Prisma query was called with correct filter
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authors: {
              some: {
                authorId: 'author-123'
              }
            }
          })
        })
      );
    });

    it('should return empty results for author with no stories', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);
      mockPrisma.story.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/stories?authorId=author-with-no-stories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should combine authorId with other filters correctly', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);
      mockPrisma.story.count.mockResolvedValue(0);

      await request(app)
        .get('/api/stories?authorId=author-123&categoryId=cat-456&search=test')
        .expect(200);

      // Verify complex filtering
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authors: {
              some: { authorId: 'author-123' }
            },
            categories: {
              some: { categoryId: 'cat-456' }
            },
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  path: ['en'],
                  string_contains: 'test'
                })
              })
            ])
          })
        })
      );
    });
  });

  describe('GET /api/stories with categoryId filter', () => {
    it('should filter stories by categoryId correctly', async () => {
      const mockStories = [
        {
          id: '1',
          title: { en: 'Fiction Story', tr: 'Kurgu Hikayesi' },
          slug: 'fiction-story',
          status: 'PUBLISHED',
          categories: [{
            categoryId: 'fiction-123',
            category: { id: 'fiction-123', name: { en: 'Fiction', tr: 'Kurgu' } }
          }],
          authors: [],
          tags: [],
          _count: { ratings: 5 }
        }
      ];

      mockPrisma.story.findMany.mockResolvedValue(mockStories);
      mockPrisma.story.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/stories?categoryId=fiction-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories[0].categories[0].categoryId).toBe('fiction-123');
      
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: {
              some: {
                categoryId: 'fiction-123'
              }
            }
          })
        })
      );
    });
  });
});