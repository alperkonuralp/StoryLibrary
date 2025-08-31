import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { storyController, setPrismaClient } from '../storyController'
import { AuthenticatedRequest } from '../../types'

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>

// Mock response object
const mockResponse = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// Mock authenticated request
const mockAuthRequest = (user?: any, query?: any, body?: any, params?: any): AuthenticatedRequest => ({
  user,
  query: query || {},
  body: body || {},
  params: params || {},
} as AuthenticatedRequest)

describe('StoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setPrismaClient(mockPrisma)
  })

  describe('getStories', () => {
    it('should return published stories for non-authenticated users', async () => {
      const mockStories = [
        {
          id: '1',
          title: { en: 'Test Story' },
          averageRating: 4.5, // This will be converted to string by Prisma
          ratingCount: 10,
          status: 'PUBLISHED'
        }
      ]

      mockPrisma.story.findMany = jest.fn().mockResolvedValue(mockStories)
      mockPrisma.story.count = jest.fn().mockResolvedValue(1)

      const req = mockAuthRequest(null, { page: '1', limit: '20' })
      const res = mockResponse()

      await storyController.getStories(req, res)

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PUBLISHED' }
        })
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
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
    })

    it('should handle search filters correctly', async () => {
      mockPrisma.story.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.story.count = jest.fn().mockResolvedValue(0)

      const req = mockAuthRequest(
        null, 
        { search: 'test query', language: 'en', page: '1', limit: '20' }
      )
      const res = mockResponse()

      await storyController.getStories(req, res)

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PUBLISHED',
            OR: expect.arrayContaining([
              {
                title: {
                  path: ['en'],
                  string_contains: 'test query'
                }
              },
              {
                title: {
                  path: ['tr'],
                  string_contains: 'test query'
                }
              },
              {
                shortDescription: {
                  path: ['en'],
                  string_contains: 'test query'
                }
              },
              {
                shortDescription: {
                  path: ['tr'],
                  string_contains: 'test query'
                }
              }
            ])
          }
        })
      )
    })

    it('should handle category filter', async () => {
      mockPrisma.story.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.story.count = jest.fn().mockResolvedValue(0)

      const req = mockAuthRequest(
        null,
        { categoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', page: '1', limit: '20' }
      )
      const res = mockResponse()

      await storyController.getStories(req, res)

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PUBLISHED',
            categories: {
              some: {
                categoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
              }
            }
          }
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.story.findMany = jest.fn().mockRejectedValue(new Error('Database error'))

      const req = mockAuthRequest(null, { page: '1', limit: '20' })
      const res = mockResponse()

      await storyController.getStories(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch stories'
        }
      })
    })
  })

  describe('createStory', () => {
    const validStoryData = {
      title: { en: 'New Story', tr: 'Yeni Hikaye' },
      shortDescription: { en: 'A new story', tr: 'Yeni bir hikaye' },
      content: { en: ['First paragraph'], tr: ['İlk paragraf'] },
      status: 'DRAFT' as const
    }

    it('should create story successfully for admin user', async () => {
      const mockUser = { id: 'user-123', role: 'ADMIN' }
      const mockCreatedStory = {
        id: 'story-123',
        ...validStoryData,
        slug: 'new-story',
        statistics: {
          wordCount: { en: 2, tr: 2 },
          charCount: { en: 15, tr: 13 },
          estimatedReadingTime: { en: 1, tr: 1 },
          sentenceCount: { en: 1, tr: 1 }
        }
      }

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(null) // No existing story
      mockPrisma.story.create = jest.fn().mockResolvedValue(mockCreatedStory)

      const req = mockAuthRequest(mockUser, {}, validStoryData)
      const res = mockResponse()

      await storyController.createStory(req, res)

      expect(mockPrisma.story.create).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedStory
      })
    })

    it('should reject story creation for non-admin user', async () => {
      const mockUser = { id: 'user-123', role: 'USER' }

      const req = mockAuthRequest(mockUser, {}, validStoryData)
      const res = mockResponse()

      await storyController.createStory(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only editors and admins can create stories'
        }
      })
    })

    it('should reject creation if story with same slug exists', async () => {
      const mockUser = { id: 'user-123', role: 'ADMIN' }
      mockPrisma.story.findUnique = jest.fn().mockResolvedValue({ id: 'existing-story' })

      const req = mockAuthRequest(mockUser, {}, validStoryData)
      const res = mockResponse()

      await storyController.createStory(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A story with this title already exists'
        }
      })
    })

    it('should validate story data and reject invalid data', async () => {
      const mockUser = { id: 'user-123', role: 'ADMIN' }
      const invalidStoryData = {
        title: {}, // Empty title object
        shortDescription: { en: 'Description' },
        content: { en: ['Content'] }
      }

      const req = mockAuthRequest(mockUser, {}, invalidStoryData)
      const res = mockResponse()

      await storyController.createStory(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid story data',
          details: expect.any(Array)
        }
      })
    })
  })

  describe('rateStory', () => {
    it('should rate story successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockStory = { id: 'story-123', status: 'PUBLISHED' }
      const mockRating = { id: 'rating-123', rating: 4.5 }
      const mockRatings = [{ rating: 4.5 }, { rating: 3.0 }]

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(mockStory)
      mockPrisma.userStoryRating.upsert = jest.fn().mockResolvedValue(mockRating)
      mockPrisma.userStoryRating.findMany = jest.fn().mockResolvedValue(mockRatings)
      mockPrisma.story.update = jest.fn().mockResolvedValue({
        ...mockStory,
        averageRating: 3.75,
        ratingCount: 2
      })

      const req = mockAuthRequest(mockUser, {}, { rating: 4.5 }, { id: 'story-123' })
      const res = mockResponse()

      await storyController.rateStory(req, res)

      expect(mockPrisma.userStoryRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId: 'user-123',
            storyId: 'story-123'
          }
        },
        create: {
          userId: 'user-123',
          storyId: 'story-123',
          rating: 4.5
        },
        update: {
          rating: 4.5
        }
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should reject rating for non-published story', async () => {
      const mockUser = { id: 'user-123' }
      const mockStory = { id: 'story-123', status: 'DRAFT' }

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(mockStory)

      const req = mockAuthRequest(mockUser, {}, { rating: 4.5 }, { id: 'story-123' })
      const res = mockResponse()

      await storyController.rateStory(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'You can only rate published stories'
        }
      })
    })

    it('should reject invalid rating values', async () => {
      const mockUser = { id: 'user-123' }

      const req = mockAuthRequest(mockUser, {}, { rating: 6 }, { id: 'story-123' })
      const res = mockResponse()

      await storyController.rateStory(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid rating',
          details: expect.any(Array)
        }
      })
    })
  })

  describe('deleteStory', () => {
    it('should delete story successfully for admin user', async () => {
      const mockUser = { id: 'user-123', role: 'ADMIN' }
      const mockStory = { id: 'story-123', title: { en: 'Test Story' } }

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(mockStory)
      mockPrisma.story.delete = jest.fn().mockResolvedValue(mockStory)

      const req = mockAuthRequest(mockUser, {}, {}, { id: 'story-123' })
      const res = mockResponse()

      await storyController.deleteStory(req, res)

      expect(mockPrisma.story.delete).toHaveBeenCalledWith({
        where: { id: 'story-123' }
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Story deleted successfully'
        }
      })
    })

    it('should reject deletion for non-admin user', async () => {
      const mockUser = { id: 'user-123', role: 'EDITOR' }

      const req = mockAuthRequest(mockUser, {}, {}, { id: 'story-123' })
      const res = mockResponse()

      await storyController.deleteStory(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only admins can delete stories'
        }
      })
    })

    it('should handle non-existent story deletion', async () => {
      const mockUser = { id: 'user-123', role: 'ADMIN' }

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(null)

      const req = mockAuthRequest(mockUser, {}, {}, { id: 'story-123' })
      const res = mockResponse()

      await storyController.deleteStory(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found'
        }
      })
    })
  })

  describe('Statistics calculation', () => {
    it('should calculate story statistics correctly', async () => {
      const mockUser = { id: 'user-123', role: 'ADMIN' }
      const storyData = {
        title: { en: 'Test Story' },
        shortDescription: { en: 'Test description' },
        content: { 
          en: ['This is a test story.', 'It has two sentences.'],
          tr: ['Bu bir test hikayesi.', 'İki cümle içerir.']
        }
      }

      mockPrisma.story.findUnique = jest.fn().mockResolvedValue(null)
      mockPrisma.story.create = jest.fn().mockImplementation((data) => {
        // Verify statistics calculation exists and has correct structure
        expect(data.data.statistics).toBeDefined()
        expect(data.data.statistics.wordCount).toHaveProperty('en')
        expect(data.data.statistics.wordCount).toHaveProperty('tr')
        expect(data.data.statistics.charCount).toHaveProperty('en')
        expect(data.data.statistics.charCount).toHaveProperty('tr')
        expect(data.data.statistics.estimatedReadingTime).toHaveProperty('en')
        expect(data.data.statistics.estimatedReadingTime).toHaveProperty('tr')
        expect(data.data.statistics.sentenceCount).toHaveProperty('en')
        expect(data.data.statistics.sentenceCount).toHaveProperty('tr')
        return Promise.resolve({ id: 'story-123', ...data.data })
      })

      const req = mockAuthRequest(mockUser, {}, storyData)
      const res = mockResponse()

      await storyController.createStory(req, res)

      expect(mockPrisma.story.create).toHaveBeenCalled()
    })
  })
})