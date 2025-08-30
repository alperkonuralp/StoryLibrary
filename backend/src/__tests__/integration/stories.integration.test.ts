import request from 'supertest'
import app from '../../app-simple'
import { PrismaClient } from '@prisma/client'
import { setPrismaClient } from '../../controllers/storyController'

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>

describe('Stories API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setPrismaClient(mockPrisma)
  })

  describe('GET /api/stories', () => {
    it('should return stories with proper response format', async () => {
      const mockStories = [
        {
          id: '1',
          title: { en: 'Test Story', tr: 'Test Hikaye' },
          shortDescription: { en: 'Description', tr: 'Açıklama' },
          slug: 'test-story',
          averageRating: '4.5', // String from database (common Prisma decimal issue)
          ratingCount: 10,
          status: 'PUBLISHED',
          publishedAt: '2024-01-01T00:00:00Z',
          categories: [],
          tags: [],
          authors: [],
          series: [],
          creator: { id: '1', username: 'admin', email: 'admin@test.com' }
        }
      ]

      mockPrisma.story.findMany = jest.fn().mockResolvedValue(mockStories)
      mockPrisma.story.count = jest.fn().mockResolvedValue(1)

      const response = await request(app)
        .get('/api/stories')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: {
          stories: mockStories,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        }
      })

      // Verify the response structure that frontend expects
      expect(response.body.data).toHaveProperty('stories')
      expect(response.body.data).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data.stories)).toBe(true)
    })

    it('should handle pagination parameters correctly', async () => {
      mockPrisma.story.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.story.count = jest.fn().mockResolvedValue(50)

      await request(app)
        .get('/api/stories?page=2&limit=10')
        .expect(200)

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page-1) * limit = (2-1) * 10
          take: 10,
        })
      )
    })

    it('should handle search filters', async () => {
      mockPrisma.story.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.story.count = jest.fn().mockResolvedValue(0)

      await request(app)
        .get('/api/stories?search=test&language=en')
        .expect(200)

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                title: {
                  path: ['en'],
                  string_contains: 'test'
                }
              },
              {
                shortDescription: {
                  path: ['en'],
                  string_contains: 'test'
                }
              }
            ]
          })
        })
      )
    })

    it('should filter by category', async () => {
      mockPrisma.story.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.story.count = jest.fn().mockResolvedValue(0)

      await request(app)
        .get('/api/stories?categoryId=f47ac10b-58cc-4372-a567-0e02b2c3d479')
        .expect(200)

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: {
              some: {
                categoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
              }
            }
          })
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.story.findMany = jest.fn().mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/api/stories')
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch stories'
        }
      })
    })
  })

  describe('GET /api/stories/slug/:slug', () => {
    it('should return story by slug', async () => {
      const mockStory = {
        id: '1',
        slug: 'test-story',
        title: { en: 'Test Story' },
        averageRating: '4.5', // Test string rating
        ratingCount: 10,
        status: 'PUBLISHED',
        categories: [],
        tags: [],
        authors: [],
        series: [],
        creator: { id: '1', username: 'admin', email: 'admin@test.com' }
      }

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(mockStory)

      const response = await request(app)
        .get('/api/stories/slug/test-story')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockStory
      })

      expect(mockPrisma.story.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-story' },
        include: expect.any(Object)
      })
    })

    it('should return 404 for non-existent story', async () => {
      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(null)

      const response = await request(app)
        .get('/api/stories/slug/non-existent')
        .expect(404)

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found'
        }
      })
    })
  })

  // Note: Authentication-dependent tests removed for integration testing
  // They are covered in the unit test suite
})