import { StoryService } from '../storyService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  story: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
  tag: {
    findMany: jest.fn(),
  },
  author: {
    findMany: jest.fn(),
  },
} as any;

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('StoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStories', () => {
    const mockStories = [
      {
        id: 'story-1',
        title: { en: 'Test Story 1', tr: 'Test Hikaye 1' },
        slug: 'test-story-1',
        shortDescription: { en: 'Test description 1', tr: 'Test açıklama 1' },
        status: 'PUBLISHED',
        publishedAt: new Date(),
        averageRating: 4.5,
        ratingCount: 10,
      },
      {
        id: 'story-2',
        title: { en: 'Test Story 2', tr: 'Test Hikaye 2' },
        slug: 'test-story-2',
        shortDescription: { en: 'Test description 2', tr: 'Test açıklama 2' },
        status: 'PUBLISHED',
        publishedAt: new Date(),
        averageRating: 4.2,
        ratingCount: 8,
      },
    ];

    const mockFilters = {
      page: 1,
      limit: 20,
      language: 'en' as const,
    };

    it('should return stories with default filters', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockStories);
      mockPrisma.story.count.mockResolvedValue(2);

      const result = await StoryService.getStories(mockFilters);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(mockPrisma.story.count).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
        },
      });
      expect(result).toEqual({
        stories: mockStories,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should filter stories by search term', async () => {
      const filtersWithSearch = {
        ...mockFilters,
        search: 'test query',
      };

      mockPrisma.story.findMany.mockResolvedValue([mockStories[0]]);
      mockPrisma.story.count.mockResolvedValue(1);

      await StoryService.getStories(filtersWithSearch);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          OR: [
            {
              title: {
                path: ['en'],
                string_contains: 'test query',
              },
            },
            {
              shortDescription: {
                path: ['en'],
                string_contains: 'test query',
              },
            },
          ],
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter stories by category', async () => {
      const filtersWithCategory = {
        ...mockFilters,
        categoryId: 'category-1',
      };

      mockPrisma.story.findMany.mockResolvedValue([mockStories[0]]);
      mockPrisma.story.count.mockResolvedValue(1);

      await StoryService.getStories(filtersWithCategory);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          categories: {
            some: {
              categoryId: 'category-1',
            },
          },
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter stories by tag', async () => {
      const filtersWithTag = {
        ...mockFilters,
        tagId: 'tag-1',
      };

      mockPrisma.story.findMany.mockResolvedValue([mockStories[0]]);
      mockPrisma.story.count.mockResolvedValue(1);

      await StoryService.getStories(filtersWithTag);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          tags: {
            some: {
              tagId: 'tag-1',
            },
          },
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter stories by author', async () => {
      const filtersWithAuthor = {
        ...mockFilters,
        authorId: 'author-1',
      };

      mockPrisma.story.findMany.mockResolvedValue([mockStories[0]]);
      mockPrisma.story.count.mockResolvedValue(1);

      await StoryService.getStories(filtersWithAuthor);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          authors: {
            some: {
              authorId: 'author-1',
            },
          },
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter stories by series', async () => {
      const filtersWithSeries = {
        ...mockFilters,
        seriesId: 'series-1',
      };

      mockPrisma.story.findMany.mockResolvedValue([mockStories[0]]);
      mockPrisma.story.count.mockResolvedValue(1);

      await StoryService.getStories(filtersWithSeries);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          series: {
            some: {
              seriesId: 'series-1',
            },
          },
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      const filtersWithPagination = {
        ...mockFilters,
        page: 2,
        limit: 10,
      };

      mockPrisma.story.findMany.mockResolvedValue([]);
      mockPrisma.story.count.mockResolvedValue(25);

      const result = await StoryService.getStories(filtersWithPagination);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 10, // (page - 1) * limit = (2 - 1) * 10
        take: 10,
      });
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3, // Math.ceil(25 / 10)
      });
    });

    it('should filter by custom status', async () => {
      const filtersWithStatus = {
        ...mockFilters,
        status: 'DRAFT' as const,
      };

      mockPrisma.story.findMany.mockResolvedValue([]);
      mockPrisma.story.count.mockResolvedValue(0);

      await StoryService.getStories(filtersWithStatus);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'DRAFT',
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.story.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(StoryService.getStories(mockFilters)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getStoryBySlug', () => {
    const mockStory = {
      id: 'story-1',
      title: { en: 'Test Story', tr: 'Test Hikaye' },
      slug: 'test-story',
      content: { en: ['Paragraph 1'], tr: ['Paragraf 1'] },
      status: 'PUBLISHED',
      publishedAt: new Date(),
    };

    it('should return story by slug', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(mockStory);

      const result = await StoryService.getStoryBySlug('test-story');

      expect(mockPrisma.story.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'test-story',
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockStory);
    });

    it('should return null if story not found', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(null);

      const result = await StoryService.getStoryBySlug('nonexistent-story');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.story.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(StoryService.getStoryBySlug('test-story')).rejects.toThrow('Database error');
    });
  });

  describe('getPopularStories', () => {
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

    it('should return popular stories ordered by rating', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockPopularStories);

      const result = await StoryService.getPopularStories(10);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          ratingCount: {
            gte: 5, // Minimum ratings threshold
          },
        },
        orderBy: [
          { averageRating: 'desc' },
          { ratingCount: 'desc' },
        ],
        take: 10,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPopularStories);
    });

    it('should use default limit if not provided', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockPopularStories);

      await StoryService.getPopularStories();

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20, // Default limit
        })
      );
    });
  });

  describe('getRecentStories', () => {
    const mockRecentStories = [
      {
        id: 'story-1',
        title: { en: 'Recent Story 1' },
        publishedAt: new Date('2023-12-01'),
      },
      {
        id: 'story-2',
        title: { en: 'Recent Story 2' },
        publishedAt: new Date('2023-11-30'),
      },
    ];

    it('should return recent stories ordered by published date', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockRecentStories);

      const result = await StoryService.getRecentStories(5);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 5,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockRecentStories);
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time for English content', () => {
      const content = ['This is a test paragraph with multiple words.', 'Another paragraph here.'];
      const result = StoryService.calculateReadingTime(content, 'en');

      // Expected: ~8 words / 200 WPM = ~0.04 minutes, rounded up to 1 minute minimum
      expect(result).toBe(1);
    });

    it('should calculate reading time for Turkish content', () => {
      const content = ['Bu bir test paragrafıdır birden fazla kelime ile.', 'Burada başka bir paragraf.'];
      const result = StoryService.calculateReadingTime(content, 'tr');

      // Expected: ~9 words / 200 WPM = ~0.045 minutes, rounded up to 1 minute minimum
      expect(result).toBe(1);
    });

    it('should return minimum 1 minute for very short content', () => {
      const content = ['Short.'];
      const result = StoryService.calculateReadingTime(content, 'en');

      expect(result).toBe(1);
    });

    it('should handle longer content correctly', () => {
      // Create content with approximately 400 words
      const longContent = Array(20).fill('This is a paragraph with exactly twenty words in it to test the calculation properly.').join(' ');
      const result = StoryService.calculateReadingTime([longContent], 'en');

      // Expected: ~400 words / 200 WPM = 2 minutes
      expect(result).toBe(2);
    });
  });

  describe('getStoriesByAuthor', () => {
    const mockAuthorStories = [
      {
        id: 'story-1',
        title: { en: 'Author Story 1' },
        authorId: 'author-1',
      },
    ];

    it('should return stories by specific author', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockAuthorStories);

      const result = await StoryService.getStoriesByAuthor('author-1');

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          authors: {
            some: {
              authorId: 'author-1',
            },
          },
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
      });
      expect(result).toEqual(mockAuthorStories);
    });
  });

  describe('getStoriesByCategory', () => {
    const mockCategoryStories = [
      {
        id: 'story-1',
        title: { en: 'Category Story 1' },
        categoryId: 'category-1',
      },
    ];

    it('should return stories by specific category', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockCategoryStories);

      const result = await StoryService.getStoriesByCategory('category-1');

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          categories: {
            some: {
              categoryId: 'category-1',
            },
          },
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
      });
      expect(result).toEqual(mockCategoryStories);
    });
  });

  describe('searchStories', () => {
    const mockSearchResults = [
      {
        id: 'story-1',
        title: { en: 'Matching Story' },
        shortDescription: { en: 'Contains search term' },
      },
    ];

    it('should search stories with multilingual support', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockSearchResults);
      mockPrisma.story.count.mockResolvedValue(1);

      const result = await StoryService.searchStories('search term', 'en', 1, 20);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          OR: [
            {
              title: {
                path: ['en'],
                string_contains: 'search term',
              },
            },
            {
              shortDescription: {
                path: ['en'],
                string_contains: 'search term',
              },
            },
            {
              authors: {
                some: {
                  author: {
                    name: {
                      path: ['en'],
                      string_contains: 'search term',
                    },
                  },
                },
              },
            },
            {
              categories: {
                some: {
                  category: {
                    name: {
                      path: ['en'],
                      string_contains: 'search term',
                    },
                  },
                },
              },
            },
            {
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: 'search term',
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
        },
        include: expect.any(Object),
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        stories: mockSearchResults,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });
});