import { renderHook, act, waitFor } from '@testing-library/react'
import { useProgress, useStoryProgress } from '../useProgress'

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
const mockProgressItem = {
  id: 'progress-1',
  userId: 'user-1',
  storyId: 'story-1',
  status: 'STARTED' as const,
  lastParagraph: 5,
  totalParagraphs: 20,
  completionPercentage: 25,
  readingTimeSeconds: 300,
  wordsRead: 150,
  language: 'en' as const,
  startedAt: '2023-01-01T10:00:00Z',
  lastReadAt: '2023-01-01T11:00:00Z',
  story: {
    id: 'story-1',
    title: { en: 'Test Story', tr: 'Test Hikaye' },
    slug: 'test-story',
  },
}

const mockProgressList = [
  mockProgressItem,
  {
    ...mockProgressItem,
    id: 'progress-2',
    storyId: 'story-2',
    status: 'COMPLETED' as const,
    completionPercentage: 100,
    completedAt: '2023-01-01T12:00:00Z',
  },
]

describe('useProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    mockFetch.mockClear()
  })

  describe('Initial state', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProgress())

      expect(result.current.progressList).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchProgress', () => {
    it('should fetch progress list successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockProgressList,
        meta: { total: 2 },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useProgress())

      await act(async () => {
        await result.current.fetchProgress()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/progress',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(result.current.progressList).toEqual(mockProgressList)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should fetch progress with status filter', async () => {
      const mockResponse = {
        success: true,
        data: [mockProgressList[1]], // Only completed
        meta: { total: 1 },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useProgress())

      await act(async () => {
        await result.current.fetchProgress('COMPLETED')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/progress?status=COMPLETED',
        expect.objectContaining({
          method: 'GET',
        })
      )

      expect(result.current.progressList).toEqual([mockProgressList[1]])
    })

    it('should handle no auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useProgress())

      await act(async () => {
        await result.current.fetchProgress()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.progressList).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should handle API errors', async () => {
      const errorResponse = {
        error: { message: 'Unauthorized' },
      }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      })

      const { result } = renderHook(() => useProgress())

      await act(async () => {
        await result.current.fetchProgress()
      })

      expect(result.current.progressList).toEqual([])
      expect(result.current.error).toBe('Unauthorized')
      expect(result.current.loading).toBe(false)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useProgress())

      await act(async () => {
        await result.current.fetchProgress()
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
              json: () => Promise.resolve({ success: true, data: [] }),
            }), 100
          )
        )
      )

      const { result } = renderHook(() => useProgress())

      act(() => {
        result.current.fetchProgress()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('getStoryProgress', () => {
    it('should fetch story progress successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockProgressItem,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useProgress())

      let storyProgress
      await act(async () => {
        storyProgress = await result.current.getStoryProgress('story-1')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/progress/story-1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(storyProgress).toEqual(mockProgressItem)
    })

    it('should return null for no auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useProgress())

      let storyProgress
      await act(async () => {
        storyProgress = await result.current.getStoryProgress('story-1')
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(storyProgress).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Not found' } }),
      })

      const { result } = renderHook(() => useProgress())

      let storyProgress
      await act(async () => {
        storyProgress = await result.current.getStoryProgress('story-1')
      })

      expect(storyProgress).toBeNull()
    })
  })

  describe('updateProgress', () => {
    it('should update progress successfully', async () => {
      const updateData = {
        storyId: 'story-1',
        lastParagraph: 10,
        totalParagraphs: 20,
        completionPercentage: 50,
      }

      const updatedProgress = {
        ...mockProgressItem,
        ...updateData,
      }

      const mockResponse = {
        success: true,
        data: updatedProgress,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useProgress())

      // Set initial state
      act(() => {
        result.current.progressList = [mockProgressItem]
      })

      let updatedResult
      await act(async () => {
        updatedResult = await result.current.updateProgress(updateData)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/progress',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify(updateData),
        }
      )

      expect(updatedResult).toEqual(updatedProgress)
    })

    it('should add new progress item to list', async () => {
      const newProgressData = {
        storyId: 'story-new',
        lastParagraph: 1,
        totalParagraphs: 15,
        status: 'STARTED' as const,
      }

      const newProgress = {
        ...mockProgressItem,
        id: 'progress-new',
        storyId: 'story-new',
        ...newProgressData,
      }

      const mockResponse = {
        success: true,
        data: newProgress,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      // First mock fetchProgress call for initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [mockProgressItem],
        }),
      })

      const { result } = renderHook(() => useProgress())

      // Fetch initial progress
      await act(async () => {
        await result.current.fetchProgress()
      })

      // Now mock updateProgress call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await act(async () => {
        await result.current.updateProgress(newProgressData)
      })

      expect(result.current.progressList).toHaveLength(2)
      expect(result.current.progressList[1]).toEqual(newProgress)
    })

    it('should handle no auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useProgress())

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProgress({ storyId: 'story-1' })
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(updateResult).toBeNull()
    })

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Update failed' } }),
      })

      const { result } = renderHook(() => useProgress())

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProgress({ storyId: 'story-1' })
      })

      expect(result.current.error).toBe('Update failed')
      expect(updateResult).toBeNull()
    })
  })

  describe('deleteProgress', () => {
    it('should delete progress successfully', async () => {
      // First mock fetchProgress call for initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [...mockProgressList],
        }),
      })

      // Then mock delete call
      const mockDeleteResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeleteResponse),
      })

      const { result } = renderHook(() => useProgress())

      // Fetch initial progress to establish state
      await act(async () => {
        await result.current.fetchProgress()
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteProgress('story-1')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/progress/story-1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(deleteResult).toBe(true)
      expect(result.current.progressList).toHaveLength(1)
      expect(result.current.progressList[0].storyId).toBe('story-2')
    })

    it('should handle no auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useProgress())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteProgress('story-1')
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(deleteResult).toBe(false)
    })

    it('should handle delete errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Delete failed' } }),
      })

      const { result } = renderHook(() => useProgress())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteProgress('story-1')
      })

      expect(result.current.error).toBe('Delete failed')
      expect(deleteResult).toBe(false)
    })
  })
})

describe('useStoryProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    mockFetch.mockClear()
  })

  it('should load story progress on mount', async () => {
    const mockResponse = {
      success: true,
      data: mockProgressItem,
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useStoryProgress('story-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.progress).toEqual(mockProgressItem)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/progress/story-1',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should not load progress without auth token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useStoryProgress('story-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.progress).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should update story progress', async () => {
    const updateData = { lastParagraph: 8, completionPercentage: 40 }
    const updatedProgress = { ...mockProgressItem, ...updateData }

    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProgressItem }),
    })

    // Mock update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: updatedProgress }),
    })

    const { result } = renderHook(() => useStoryProgress('story-1'))

    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgressItem)
    })

    let updateResult
    await act(async () => {
      updateResult = await result.current.updateStoryProgress(updateData)
    })

    expect(updateResult).toEqual(updatedProgress)
    expect(result.current.progress).toEqual(updatedProgress)
  })

  it('should calculate completion percentage', () => {
    const { result } = renderHook(() => useStoryProgress('story-1'))

    const completion1 = result.current.calculateCompletion(5, 20)
    const completion2 = result.current.calculateCompletion(20, 20)
    const completion3 = result.current.calculateCompletion(0, 0)

    expect(completion1).toBe(25)
    expect(completion2).toBe(100)
    expect(completion3).toBe(0)
  })

  it('should start and end reading session', async () => {
    const mockResponse = {
      success: true,
      data: mockProgressItem,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    // Mock update for end session
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProgressItem }),
    })

    const { result } = renderHook(() => useStoryProgress('story-1'))

    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgressItem)
    })

    // Start session
    const session = result.current.startReadingSession()
    expect(session.startTime).toBeLessThanOrEqual(Date.now())
    expect(session.startParagraph).toBe(5) // From mockProgressItem

    // End session after a delay
    setTimeout(async () => {
      await act(async () => {
        await result.current.endReadingSession(
          session,
          10, // currentParagraph
          20, // totalParagraphs
          'en',
          50 // wordsRead
        )
      })
    }, 100)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/progress',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"lastParagraph":10'),
        })
      )
    })
  })

  it('should reload progress manually', async () => {
    const mockResponse = {
      success: true,
      data: mockProgressItem,
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useStoryProgress('story-1'))

    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgressItem)
    })

    // Clear the fetch calls from initial load
    mockFetch.mockClear()

    // Manually reload
    await act(async () => {
      await result.current.loadProgress()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/progress/story-1',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should handle story ID changes', async () => {
    const mockResponse1 = {
      success: true,
      data: { ...mockProgressItem, storyId: 'story-1' },
    }

    const mockResponse2 = {
      success: true,
      data: { ...mockProgressItem, storyId: 'story-2' },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse1),
    })

    const { result, rerender } = renderHook(
      ({ storyId }) => useStoryProgress(storyId),
      { initialProps: { storyId: 'story-1' } }
    )

    await waitFor(() => {
      expect(result.current.progress?.storyId).toBe('story-1')
    })

    // Change story ID
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse2),
    })

    rerender({ storyId: 'story-2' })

    await waitFor(() => {
      expect(result.current.progress?.storyId).toBe('story-2')
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})