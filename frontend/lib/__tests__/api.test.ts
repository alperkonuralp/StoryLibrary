import { apiClient } from '../api'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  const originalConsoleError = console.error
  
  beforeEach(() => {
    mockFetch.mockClear()
    // Reset API client headers
    apiClient.clearAuthToken()
    // Mock console.error to avoid noise in test output
    console.error = jest.fn()
  })
  
  afterAll(() => {
    console.error = originalConsoleError
  })

  describe('Authentication', () => {
    it('should set auth token correctly', () => {
      const token = 'test-token-123'
      apiClient.setAuthToken(token)
      
      // Make a request to verify token is included
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })
      
      apiClient.getStories()
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      )
    })

    it('should clear auth token correctly', () => {
      apiClient.setAuthToken('test-token')
      apiClient.clearAuthToken()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })
      
      apiClient.getStories()
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      )
    })
  })

  describe('getStories', () => {
    it('should fetch stories without filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          stories: [
            { id: '1', title: { en: 'Test Story' } }
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.getStories()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should fetch stories with filters', async () => {
      const filters = {
        page: 2,
        limit: 10,
        search: 'test',
        categoryId: 'cat1',
        language: 'en' as const,
        status: 'PUBLISHED' as const
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { stories: [], pagination: {} } })
      })

      await apiClient.getStories(filters)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories?page=2&limit=10&search=test&categoryId=cat1&language=en&status=PUBLISHED',
        expect.any(Object)
      )
    })

    it('should handle API error responses', async () => {
      const errorResponse = {
        error: { message: 'Server error', code: 'INTERNAL_ERROR' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse
      })

      await expect(apiClient.getStories()).rejects.toThrow('Server error')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getStories()).rejects.toThrow('Network error')
    })
  })

  describe('getStoryBySlug', () => {
    it('should fetch story by slug', async () => {
      const mockStory = {
        id: '1',
        slug: 'test-story',
        title: { en: 'Test Story' },
        averageRating: '4.5' // Test string rating from API
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStory })
      })

      const result = await apiClient.getStoryBySlug('test-story')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/slug/test-story',
        expect.any(Object)
      )
      expect(result.data).toEqual(mockStory)
    })
  })

  describe('createStory', () => {
    it('should create story with authentication', async () => {
      const storyData = {
        title: { en: 'New Story' },
        shortDescription: { en: 'A new story' },
        content: { en: ['Paragraph 1'] }
      }

      apiClient.setAuthToken('auth-token')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', ...storyData } })
      })

      await apiClient.createStory(storyData)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer auth-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(storyData)
        })
      )
    })
  })

  describe('rateStory', () => {
    it('should submit story rating', async () => {
      apiClient.setAuthToken('auth-token')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { rating: 5 } })
      })

      await apiClient.rateStory('story-id', 5)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/story-id/rate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 5 })
        })
      )
    })
  })

  describe('login', () => {
    it('should login with credentials', async () => {
      const loginData = { email: 'test@test.com', password: 'password123' }
      const mockResponse = {
        success: true,
        data: { token: 'jwt-token', user: { id: '1', email: 'test@test.com' } }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.login(loginData.email, loginData.password)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(loginData)
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = [
        { id: '1', name: { en: 'Fiction' }, slug: 'fiction' },
        { id: '2', name: { en: 'Technology' }, slug: 'technology' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCategories })
      })

      const result = await apiClient.getCategories()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/categories',
        expect.any(Object)
      )
      expect(result.data).toEqual(mockCategories)
    })
  })

  describe('Error handling', () => {
    it('should throw error for non-ok response without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({})
      })

      await expect(apiClient.getStories()).rejects.toThrow('API request failed')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      await expect(apiClient.getStories()).rejects.toThrow('Invalid JSON')
    })
  })
})