import { renderHook, waitFor } from '@testing-library/react'
import { useStories } from '../useStories'
import { apiClient } from '../../lib/api'

// Mock the API client
jest.mock('../../lib/api', () => ({
  apiClient: {
    getStories: jest.fn()
  }
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('useStories', () => {
  beforeEach(() => {
    mockApiClient.getStories.mockClear()
  })

  it('should initialize with correct default state', () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }
    })

    const { result } = renderHook(() => useStories())

    expect(result.current.stories).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.pagination).toBe(null)
  })

  it('should fetch stories successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        stories: [
          {
            id: '1',
            title: { en: 'Test Story' },
            slug: 'test-story',
            averageRating: '4.5', // String rating from API
            ratingCount: 10
          }
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      }
    }

    mockApiClient.getStories.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useStories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stories).toEqual(mockResponse.data.stories)
    expect(result.current.pagination).toEqual(mockResponse.data.pagination)
    expect(result.current.error).toBe(null)
  })

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch stories'
    mockApiClient.getStories.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useStories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stories).toEqual([])
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.pagination).toBe(null)
  })

  it('should handle API response errors', async () => {
    mockApiClient.getStories.mockResolvedValue({
      success: false,
      error: { message: 'Server error', code: 'INTERNAL_ERROR' }
    })

    const { result } = renderHook(() => useStories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stories).toEqual([])
    expect(result.current.error).toBe('Server error')
    expect(result.current.pagination).toBe(null)
  })

  it('should pass filters to API client', async () => {
    const filters = {
      page: 2,
      limit: 10,
      search: 'test',
      categoryId: 'cat1',
      language: 'en' as const,
      status: 'PUBLISHED' as const
    }

    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 1 } }
    })

    renderHook(() => useStories({ filters }))

    await waitFor(() => {
      expect(mockApiClient.getStories).toHaveBeenCalledWith(filters)
    })
  })

  it('should refetch when filters change', async () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }
    })

    const { rerender } = renderHook(
      ({ filters }) => useStories({ filters }),
      { initialProps: { filters: { page: 1, limit: 20 } } }
    )

    await waitFor(() => {
      expect(mockApiClient.getStories).toHaveBeenCalledTimes(1)
    })

    // Change filters
    rerender({ filters: { page: 2, limit: 20 } })

    await waitFor(() => {
      expect(mockApiClient.getStories).toHaveBeenCalledTimes(2)
    })

    expect(mockApiClient.getStories).toHaveBeenLastCalledWith({ page: 2, limit: 20 })
  })

  it('should not auto-fetch when autoFetch is false', () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }
    })

    const { result } = renderHook(() => useStories({ autoFetch: false }))

    expect(result.current.loading).toBe(false)
    expect(mockApiClient.getStories).not.toHaveBeenCalled()
  })

  it('should provide refetch function', async () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }
    })

    const { result } = renderHook(() => useStories({ autoFetch: false }))

    expect(mockApiClient.getStories).not.toHaveBeenCalled()

    await result.current.refetch()

    expect(mockApiClient.getStories).toHaveBeenCalledTimes(1)
  })

  it('should handle stories with string ratings correctly', async () => {
    const mockResponse = {
      success: true,
      data: {
        stories: [
          {
            id: '1',
            title: { en: 'Test Story 1' },
            slug: 'test-story-1',
            averageRating: '4.5', // String from database
            ratingCount: 10
          },
          {
            id: '2',
            title: { en: 'Test Story 2' },
            slug: 'test-story-2',
            averageRating: 3.8, // Number
            ratingCount: 5
          },
          {
            id: '3',
            title: { en: 'Test Story 3' },
            slug: 'test-story-3',
            averageRating: null,
            ratingCount: 0
          }
        ],
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 }
      }
    }

    mockApiClient.getStories.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useStories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stories).toHaveLength(3)
    expect(result.current.stories[0].averageRating).toBe('4.5')
    expect(result.current.stories[1].averageRating).toBe(3.8)
    expect(result.current.stories[2].averageRating).toBe(null)
  })

  it('should handle empty API response data', async () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: null as any
    })

    const { result } = renderHook(() => useStories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stories).toEqual([])
    expect(result.current.error).toBe('Failed to fetch stories')
  })

  it('should handle missing pagination in response', async () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: {
        stories: [{ id: '1', title: { en: 'Test' }, slug: 'test' }],
        pagination: undefined as any
      }
    })

    const { result } = renderHook(() => useStories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stories).toHaveLength(1)
    expect(result.current.pagination).toBe(undefined)
  })

  it('should debounce API calls when filters change rapidly', async () => {
    jest.useFakeTimers()
    
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }
    })

    const { rerender } = renderHook(
      ({ filters }) => useStories({ filters }),
      { initialProps: { filters: { authorId: 'author1' } } }
    )

    // Change filters rapidly
    rerender({ filters: { authorId: 'author2' } })
    rerender({ filters: { authorId: 'author3' } })
    rerender({ filters: { authorId: 'author4' } })

    // Should not have made API calls yet due to debounce
    expect(mockApiClient.getStories).not.toHaveBeenCalled()

    // Fast-forward time past debounce delay (50ms)
    jest.advanceTimersByTime(50)

    await waitFor(() => {
      expect(mockApiClient.getStories).toHaveBeenCalledTimes(1)
    })

    // Should be called with the final filter value
    expect(mockApiClient.getStories).toHaveBeenCalledWith({ authorId: 'author4' })

    jest.useRealTimers()
  })

  it('should clear stories immediately when filters change', async () => {
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { 
        stories: [{ id: '1', title: { en: 'Story 1' }, slug: 'story-1' }], 
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } 
      }
    })

    const { result, rerender } = renderHook(
      ({ filters }) => useStories({ filters }),
      { initialProps: { filters: { authorId: 'author1' } } }
    )

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.stories).toHaveLength(1)
    })

    // Change filters - stories should be cleared immediately
    rerender({ filters: { authorId: 'author2' } })

    // Stories should be cleared immediately (not waiting for API)
    expect(result.current.stories).toEqual([])
    expect(result.current.pagination).toBe(null)
  })

  it('should handle authorId filter parameter correctly', async () => {
    const authorId = '8dda7276-ebce-4f90-bd16-9b9f0bb0b019'
    
    mockApiClient.getStories.mockResolvedValue({
      success: true,
      data: { stories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }
    })

    renderHook(() => useStories({ filters: { authorId, language: 'en', status: 'PUBLISHED' } }))

    await waitFor(() => {
      expect(mockApiClient.getStories).toHaveBeenCalledWith({
        authorId,
        language: 'en',
        status: 'PUBLISHED'
      })
    })
  })
})