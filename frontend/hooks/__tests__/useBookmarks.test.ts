import { renderHook, act, waitFor } from '@testing-library/react'
import { useBookmarks, useStoryBookmark } from '../useBookmarks'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock data
const mockBookmark = {
  id: 'bookmark-1',
  userId: 'user-1',
  storyId: 'story-1',
  createdAt: '2023-01-01T10:00:00Z',
  story: {
    id: 'story-1',
    title: { en: 'Test Story', tr: 'Test Hikaye' },
    slug: 'test-story',
    shortDescription: { en: 'A test story', tr: 'Bir test hikayesi' },
    publishedAt: '2023-01-01T09:00:00Z',
    averageRating: 4.5,
    ratingCount: 10,
    categories: [
      {
        category: {
          id: 'cat-1',
          name: { en: 'Fiction', tr: 'Kurgu' },
          slug: 'fiction',
        },
      },
    ],
    authors: [
      {
        author: {
          id: 'author-1',
          name: 'John Doe',
          slug: 'john-doe',
        },
      },
    ],
  },
}

const mockBookmarksList = [
  mockBookmark,
  {
    ...mockBookmark,
    id: 'bookmark-2',
    storyId: 'story-2',
    story: {
      ...mockBookmark.story,
      id: 'story-2',
      title: { en: 'Another Story', tr: 'Başka Hikaye' },
      slug: 'another-story',
    },
  },
]

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  pages: 1,
}

describe('useBookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    mockFetch.mockClear()
  })

  describe('Initial state', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBookmarks())

      expect(result.current.bookmarks).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      })
    })
  })

  describe('fetchBookmarks', () => {
    it('should fetch bookmarks successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockBookmarksList,
        pagination: mockPagination,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useBookmarks())

      await act(async () => {
        await result.current.fetchBookmarks()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/bookmarks?page=1&limit=20',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(result.current.bookmarks).toEqual(mockBookmarksList)
      expect(result.current.pagination).toEqual(mockPagination)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should fetch with custom page and limit', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 2, limit: 10, total: 15, pages: 2 },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useBookmarks())

      await act(async () => {
        await result.current.fetchBookmarks(2, 10)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/bookmarks?page=2&limit=10',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should handle API errors', async () => {
      const errorResponse = {
        error: { message: 'Unauthorized' },
      }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      })

      const { result } = renderHook(() => useBookmarks())

      await act(async () => {
        await result.current.fetchBookmarks()
      })

      expect(result.current.bookmarks).toEqual([])
      expect(result.current.error).toBe('Unauthorized')
      expect(result.current.loading).toBe(false)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useBookmarks())

      await act(async () => {
        await result.current.fetchBookmarks()
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.loading).toBe(false)
    })

    it('should set loading state during fetch', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: [], pagination: mockPagination }),
            }), 100
          )
        )
      )

      const { result } = renderHook(() => useBookmarks())

      act(() => {
        result.current.fetchBookmarks()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('checkBookmarkStatus', () => {
    it('should check bookmark status successfully', async () => {
      const mockResponse = {
        success: true,
        data: { isBookmarked: true },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useBookmarks())

      let status
      await act(async () => {
        status = await result.current.checkBookmarkStatus('story-1')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/bookmarks/story-1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(status).toBe(true)
    })

    it('should handle check status errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Not found' } }),
      })

      const { result } = renderHook(() => useBookmarks())

      let status
      await act(async () => {
        status = await result.current.checkBookmarkStatus('story-1')
      })

      expect(status).toBe(false)
    })

    it('should handle network errors in check status', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useBookmarks())

      let status
      await act(async () => {
        status = await result.current.checkBookmarkStatus('story-1')
      })

      expect(status).toBe(false)
    })
  })

  describe('toggleBookmark', () => {
    it('should add bookmark when not bookmarked', async () => {
      // Mock check status (not bookmarked)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      // Mock add bookmark
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockBookmark }),
      })

      // Mock refetch bookmarks after add
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockBookmark], pagination: mockPagination }),
      })

      const { result } = renderHook(() => useBookmarks())

      let toggleResult
      await act(async () => {
        toggleResult = await result.current.toggleBookmark('story-1')
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'http://localhost:3001/api/bookmarks/story-1',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(toggleResult?.isBookmarked).toBe(true)
      expect(result.current.bookmarks).toEqual([mockBookmark])
    })

    it('should remove bookmark when bookmarked', async () => {
      // Set initial bookmarks
      const { result } = renderHook(() => useBookmarks())
      result.current.bookmarks = [mockBookmark]

      // Mock check status (bookmarked)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: true } }),
      })

      // Mock remove bookmark
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      let toggleResult
      await act(async () => {
        toggleResult = await result.current.toggleBookmark('story-1')
      })

      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'http://localhost:3001/api/bookmarks/story-1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(toggleResult?.isBookmarked).toBe(false)
      expect(result.current.bookmarks).toEqual([])
    })

    it('should handle toggle errors', async () => {
      // Mock check status
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      // Mock toggle error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Toggle failed' } }),
      })

      const { result } = renderHook(() => useBookmarks())

      let toggleResult
      await act(async () => {
        toggleResult = await result.current.toggleBookmark('story-1')
      })

      expect(result.current.error).toBe('Toggle failed')
      expect(toggleResult).toBeNull()
    })
  })

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      const mockResponse = { success: true }

      // First mock fetchBookmarks call for initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [...mockBookmarksList],
          meta: { page: 1, limit: 20, total: 2, pages: 1 }
        }),
      })

      const { result } = renderHook(() => useBookmarks())

      // Fetch initial bookmarks to establish state
      await act(async () => {
        await result.current.fetchBookmarks()
      })

      // Now mock remove call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      let removeResult
      await act(async () => {
        removeResult = await result.current.removeBookmark('story-1')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/bookmarks/story-1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(removeResult).toBe(true)
      expect(result.current.bookmarks).toHaveLength(1)
      expect(result.current.bookmarks[0].storyId).toBe('story-2')
    })

    it('should handle remove errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Remove failed' } }),
      })

      const { result } = renderHook(() => useBookmarks())

      let removeResult
      await act(async () => {
        removeResult = await result.current.removeBookmark('story-1')
      })

      expect(result.current.error).toBe('Remove failed')
      expect(removeResult).toBe(false)
    })
  })
})

describe('useStoryBookmark', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    mockFetch.mockClear()
  })

  describe('Initial state and mounting', () => {
    it('should initialize with default state', async () => {
      // Mock the checkBookmarkStatus call that happens on mount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      expect(result.current.isBookmarked).toBe(false)
      
      // Wait for the mounting API call to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
    })

    it('should check bookmark status on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: true } }),
      })

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.isBookmarked).toBe(true)
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/bookmarks/story-1',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should not check status without auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.isBookmarked).toBe(false)
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not check status with empty storyId', () => {
      const { result } = renderHook(() => useStoryBookmark(''))

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
    })
  })

  describe('toggle functionality', () => {
    beforeEach(() => {
      // Mock initial status check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })
    })

    it('should toggle bookmark successfully', async () => {
      // Mock check status for toggle
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      // Mock toggle action
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockBookmark }),
      })

      // Mock refetch after toggle
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockBookmark], pagination: mockPagination }),
      })

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let toggleResult
      await act(async () => {
        toggleResult = await result.current.toggle()
      })

      expect(toggleResult?.isBookmarked).toBe(true)
      expect(result.current.isBookmarked).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    it('should set loading state during toggle', async () => {
      // Mock slow toggle response
      mockFetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
            }), 100
          )
        )
      )

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.toggle()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle toggle errors', async () => {
      // Mock check status that happens on mount (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock toggle operation that fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Toggle failed' } }),
      })

      let toggleResult
      await act(async () => {
        toggleResult = await result.current.toggle()
      })

      expect(toggleResult).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })

  describe('checkStatus functionality', () => {
    it('should manually check status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: true } }),
      })

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockFetch.mockClear()

      await act(async () => {
        await result.current.checkStatus()
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.current.isBookmarked).toBe(true)
    })

    it('should handle no auth token in checkStatus', async () => {
      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockLocalStorage.getItem.mockReturnValue(null)
      mockFetch.mockClear()

      await act(async () => {
        await result.current.checkStatus()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isBookmarked).toBe(false)
    })
  })

  describe('storyId changes', () => {
    it('should refetch when storyId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      const { result, rerender } = renderHook(
        ({ storyId }) => useStoryBookmark(storyId),
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
        'http://localhost:3001/api/bookmarks/story-2',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should not refetch with empty storyId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      const { result, rerender } = renderHook(
        ({ storyId }) => useStoryBookmark(storyId),
        { initialProps: { storyId: 'story-1' } }
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      mockFetch.mockClear()

      // Change to empty story ID
      rerender({ storyId: '' })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('integration with useBookmarks', () => {
    it('should use the same functions from useBookmarks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isBookmarked: false } }),
      })

      const { result } = renderHook(() => useStoryBookmark('story-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // The hook should have access to toggle and checkStatus functions
      expect(typeof result.current.toggle).toBe('function')
      expect(typeof result.current.checkStatus).toBe('function')
    })
  })
})