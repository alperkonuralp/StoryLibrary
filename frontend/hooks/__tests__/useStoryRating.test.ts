import { renderHook, act, waitFor } from '@testing-library/react'
import { useStoryRating } from '../useStoryRating'

// Mock the useAuth hook
const mockUseAuth = {
  token: 'mock-token',
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
}

jest.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock data
const mockRating = {
  id: 'rating-1',
  rating: 4,
  comment: 'Great story!',
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z',
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
}

const mockOtherRating = {
  id: 'rating-2',
  rating: 5,
  comment: 'Amazing!',
  createdAt: '2023-01-01T11:00:00Z',
  updatedAt: '2023-01-01T11:00:00Z',
  user: {
    id: 'user-2',
    name: 'Other User',
    email: 'other@example.com',
  },
}

const mockRatingsList = [mockRating, mockOtherRating]

const mockRatingStats = {
  averageRating: 4.5,
  totalRatings: 2,
  ratingDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 1,
    5: 1,
  },
}

const mockRatingsResponse = {
  success: true,
  data: {
    ratings: mockRatingsList,
    stats: mockRatingStats,
    hasMore: false,
  },
}

describe('useStoryRating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Initial state and loading', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useStoryRating('story-1'))

      expect(result.current.userRating).toBeNull()
      expect(result.current.ratings).toEqual([])
      expect(result.current.stats).toBeNull()
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.hasMoreRatings).toBe(true)
    })

    it('should fetch ratings on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/story-1/ratings?page=1&limit=10&includeComments=true',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(result.current.ratings).toEqual(mockRatingsList)
      expect(result.current.stats).toEqual(mockRatingStats)
      expect(result.current.userRating).toEqual(mockRating) // User's own rating
      expect(result.current.hasMoreRatings).toBe(false)
    })

    it('should not fetch if storyId is empty', () => {
      renderHook(() => useStoryRating(''))

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Network error')
      })

      expect(result.current.ratings).toEqual([])
      expect(result.current.stats).toBeNull()
    })

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Failed to fetch ratings: 404')
      })
    })
  })

  describe('submitRating', () => {
    beforeEach(() => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ratings: [], stats: mockRatingStats, hasMore: false },
        }),
      })
    })

    it('should submit rating successfully', async () => {
      const newRatingResponse = {
        success: true,
        data: {
          rating: mockRating,
        },
      }

      // Mock submit rating call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newRatingResponse),
      })

      // Mock refresh call after submit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let submitResult
      await act(async () => {
        submitResult = await result.current.submitRating(4, 'Great story!')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/story-1/rate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({ rating: 4, comment: 'Great story!' }),
        }
      )

      expect(submitResult).toBe(true)
      expect(result.current.userRating).toEqual(mockRating)
    })

    it('should handle submission without authentication', async () => {
      // Mock no auth
      mockUseAuth.token = null
      mockUseAuth.user = null

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let submitResult
      await act(async () => {
        submitResult = await result.current.submitRating(4, 'Great story!')
      })

      expect(submitResult).toBe(false)
      expect(result.current.error).toBe('You must be logged in to rate stories')

      // Restore auth for other tests
      mockUseAuth.token = 'mock-token'
      mockUseAuth.user = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      }
    })

    it('should handle submission errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let submitResult
      await act(async () => {
        submitResult = await result.current.submitRating(4)
      })

      expect(submitResult).toBe(false)
      expect(result.current.error).toBe('Failed to submit rating: 400')
    })

    it('should submit rating without comment', async () => {
      const newRatingResponse = {
        success: true,
        data: {
          rating: { ...mockRating, comment: undefined },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newRatingResponse),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let submitResult
      await act(async () => {
        submitResult = await result.current.submitRating(4)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/rate'),
        expect.objectContaining({
          body: JSON.stringify({ rating: 4 }),
        })
      )

      expect(submitResult).toBe(true)
    })
  })

  describe('updateRating', () => {
    beforeEach(() => {
      // Mock initial fetch with user rating
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })
    })

    it('should update existing rating successfully', async () => {
      const updatedRating = {
        ...mockRating,
        rating: 5,
        comment: 'Updated comment',
        updatedAt: '2023-01-01T12:00:00Z',
      }

      const updateResponse = {
        success: true,
        data: { rating: updatedRating },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updateResponse),
      })

      // Mock refresh after update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockRatingsResponse,
          data: {
            ...mockRatingsResponse.data,
            ratings: [updatedRating, mockOtherRating],
          },
        }),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toEqual(mockRating)
      })

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateRating(5, 'Updated comment')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/story-1/ratings/rating-1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({ rating: 5, comment: 'Updated comment' }),
        }
      )

      expect(updateResult).toBe(true)
      expect(result.current.userRating).toEqual(updatedRating)
    })

    it('should handle update without existing rating', async () => {
      // Mock response without user rating
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ratings: [mockOtherRating], stats: mockRatingStats, hasMore: false },
        }),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toBeNull()
      })

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateRating(5)
      })

      expect(updateResult).toBe(false)
      expect(result.current.error).toBe('No existing rating to update')
    })

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toEqual(mockRating)
      })

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateRating(5)
      })

      expect(updateResult).toBe(false)
      expect(result.current.error).toBe('Failed to update rating: 403')
    })
  })

  describe('deleteRating', () => {
    beforeEach(() => {
      // Mock initial fetch with user rating
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })
    })

    it('should delete rating successfully', async () => {
      const deleteResponse = { success: true }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(deleteResponse),
      })

      // Mock refresh after delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ratings: [mockOtherRating], stats: mockRatingStats, hasMore: false },
        }),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toEqual(mockRating)
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteRating()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/story-1/ratings/rating-1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(deleteResult).toBe(true)
      expect(result.current.userRating).toBeNull()
    })

    it('should handle delete without existing rating', async () => {
      // Mock response without user rating
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ratings: [mockOtherRating], stats: mockRatingStats, hasMore: false },
        }),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toBeNull()
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteRating()
      })

      expect(deleteResult).toBe(false)
      expect(result.current.error).toBe('No rating to delete')
    })

    it('should handle delete errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toEqual(mockRating)
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteRating()
      })

      expect(deleteResult).toBe(false)
      expect(result.current.error).toBe('Failed to delete rating: 404')
    })
  })

  describe('loadMoreRatings', () => {
    it('should load more ratings when available', async () => {
      const page1Response = {
        success: true,
        data: {
          ratings: [mockRating],
          stats: mockRatingStats,
          hasMore: true,
        },
      }

      const page2Response = {
        success: true,
        data: {
          ratings: [mockOtherRating],
          stats: mockRatingStats,
          hasMore: false,
        },
      }

      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page1Response),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.ratings).toHaveLength(1)
        expect(result.current.hasMoreRatings).toBe(true)
      })

      // Load more
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page2Response),
      })

      await act(async () => {
        await result.current.loadMoreRatings()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stories/story-1/ratings?page=2&limit=10&includeComments=true',
        expect.objectContaining({ method: 'GET' })
      )

      expect(result.current.ratings).toHaveLength(2)
      expect(result.current.hasMoreRatings).toBe(false)
    })

    it('should not load more when hasMoreRatings is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ratings: mockRatingsList, stats: mockRatingStats, hasMore: false },
        }),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.hasMoreRatings).toBe(false)
      })

      mockFetch.mockClear()

      await act(async () => {
        await result.current.loadMoreRatings()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not load more while loading', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { ratings: [], stats: mockRatingStats, hasMore: true },
            }),
          }), 100)
        })
      )

      const { result } = renderHook(() => useStoryRating('story-1'))

      // While still loading initial data
      expect(result.current.loading).toBe(true)

      await act(async () => {
        await result.current.loadMoreRatings()
      })

      // Should not make additional calls while loading
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('storyId changes', () => {
    it('should refetch when storyId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })

      const { result, rerender } = renderHook(
        ({ storyId }) => useStoryRating(storyId),
        { initialProps: { storyId: 'story-1' } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Change story ID
      rerender({ storyId: 'story-2' })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:3001/api/stories/story-2/ratings?page=1&limit=10&includeComments=true',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should reset state when storyId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRatingsResponse),
      })

      const { result, rerender } = renderHook(
        ({ storyId }) => useStoryRating(storyId),
        { initialProps: { storyId: 'story-1' } }
      )

      await waitFor(() => {
        expect(result.current.ratings).toHaveLength(2)
      })

      // Change story ID - should start with loading state
      rerender({ storyId: 'story-2' })

      expect(result.current.loading).toBe(true)
      // State should be reset during loading
    })
  })

  describe('user identification', () => {
    it('should identify user rating correctly', async () => {
      const ratingsWithUserFirst = {
        success: true,
        data: {
          ratings: [mockRating, mockOtherRating], // User's rating first
          stats: mockRatingStats,
          hasMore: false,
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(ratingsWithUserFirst),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toEqual(mockRating)
        expect(result.current.ratings).toEqual([mockRating, mockOtherRating])
      })
    })

    it('should handle no user rating in list', async () => {
      const ratingsWithoutUser = {
        success: true,
        data: {
          ratings: [mockOtherRating], // Only other user's rating
          stats: mockRatingStats,
          hasMore: false,
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(ratingsWithoutUser),
      })

      const { result } = renderHook(() => useStoryRating('story-1'))

      await waitFor(() => {
        expect(result.current.userRating).toBeNull()
        expect(result.current.ratings).toEqual([mockOtherRating])
      })
    })
  })
})