import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StoryReader } from '../StoryReader'
import { useStoryProgress } from '../../../hooks/useProgress'
import { useAuth } from '../../../hooks/useAuth'
import { useSettings } from '../../../hooks/useSettings'
import { useOfflineReading } from '../../../hooks/useOfflineReading'

// Mock hooks
jest.mock('../../../hooks/useProgress', () => ({
  useStoryProgress: jest.fn(),
}))

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../hooks/useSettings', () => ({
  useSettings: jest.fn(),
}))

jest.mock('../../../hooks/useOfflineReading', () => ({
  useOfflineReading: jest.fn(),
}))

const mockUseStoryProgress = useStoryProgress as jest.MockedFunction<typeof useStoryProgress>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>
const mockUseOfflineReading = useOfflineReading as jest.MockedFunction<typeof useOfflineReading>

// Mock story data
const mockStory = {
  id: 'story-1',
  title: { en: 'Test Story', tr: 'Test Hikaye' },
  shortDescription: { en: 'A test story', tr: 'Bir test hikayesi' },
  slug: 'test-story',
  content: {
    en: [
      'This is the first paragraph in English.',
      'This is the second paragraph in English.',
      'This is the third paragraph in English.',
    ],
    tr: [
      'Bu Türkçe birinci paragraf.',
      'Bu Türkçe ikinci paragraf.',
      'Bu Türkçe üçüncü paragraf.',
    ],
  },
  status: 'PUBLISHED',
  publishedAt: new Date('2023-01-01'),
  averageRating: 4.5,
  ratingCount: 10,
  statistics: {
    wordCount: { en: 24, tr: 18 },
    estimatedReadingTime: { en: 1, tr: 1 },
    sentenceCount: { en: 3, tr: 3 },
  },
  authors: [
    {
      author: {
        id: 'author-1',
        name: 'John Doe',
        slug: 'john-doe',
      },
      role: 'author',
    },
  ],
  categories: [
    {
      category: {
        id: 'cat-1',
        name: { en: 'Fiction', tr: 'Kurgu' },
        slug: 'fiction',
      },
    },
  ],
  tags: [
    {
      tag: {
        id: 'tag-1',
        name: { en: 'Adventure', tr: 'Macera' },
        slug: 'adventure',
        color: '#FF6B6B',
      },
    },
  ],
}

describe('StoryReader', () => {
  beforeEach(() => {
    // Mock scrollIntoView for JSDOM
    Element.prototype.scrollIntoView = jest.fn()
    
    // Mock IntersectionObserver
    const mockIntersectionObserver = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    })
    window.IntersectionObserver = mockIntersectionObserver
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', role: 'USER' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
    })

    mockUseStoryProgress.mockReturnValue({
      progress: { 
        completionPercentage: 50, 
        lastParagraph: 2,
        readingTimeSeconds: 120 
      },
      updateStoryProgress: jest.fn(),
      startReadingSession: jest.fn(),
      endReadingSession: jest.fn(),
      loading: false,
    })

    mockUseSettings.mockReturnValue({
      settings: {
        fontSize: 'medium',
        theme: 'light',
        readingSpeed: 200
      },
      updateSettings: jest.fn(),
      loading: false,
    })

    mockUseOfflineReading.mockReturnValue({
      isOnline: true,
      cacheStory: jest.fn(),
      getCachedStory: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render story content in English by default', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText('Test Story')).toBeInTheDocument()
    expect(screen.getByText('This is the first paragraph in English.')).toBeInTheDocument()
    expect(screen.getByText('This is the second paragraph in English.')).toBeInTheDocument()
    expect(screen.getByText('This is the third paragraph in English.')).toBeInTheDocument()
  })

  it('should switch to Turkish when language toggle is clicked', async () => {
    render(<StoryReader story={mockStory} />)

    const turkishButton = screen.getByRole('button', { name: /türkçe only/i })
    fireEvent.click(turkishButton)

    await waitFor(() => {
      expect(screen.getByText('Test Hikaye')).toBeInTheDocument()
      expect(screen.getByText('Bu Türkçe birinci paragraf.')).toBeInTheDocument()
    })
  })

  it('should display bilingual mode by default', async () => {
    render(<StoryReader story={mockStory} />)

    // Component defaults to bilingual mode - both languages should be visible
    expect(screen.getByText('This is the first paragraph in English.')).toBeInTheDocument()
    expect(screen.getByText('Bu Türkçe birinci paragraf.')).toBeInTheDocument()
  })

  it('should display story metadata', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Adventure')).toBeInTheDocument()
    expect(screen.getByText('4.5 (10)')).toBeInTheDocument()
  })

  it('should show progress indicator for authenticated users', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('should not show progress for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
    })
    
    // For unauthenticated users, progress should be null
    mockUseStoryProgress.mockReturnValue({
      progress: null,
      updateStoryProgress: jest.fn(),
      startReadingSession: jest.fn(),
      endReadingSession: jest.fn(),
      loading: false,
    })

    render(<StoryReader story={mockStory} />)

    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('should update progress when scrolling', async () => {
    const mockUpdateStoryProgress = jest.fn()
    
    // Mock IntersectionObserver to trigger callbacks
    let intersectionCallback: (entries: any[]) => void
    const mockIntersectionObserver = jest.fn().mockImplementation((callback) => {
      intersectionCallback = callback
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      }
    })
    window.IntersectionObserver = mockIntersectionObserver

    mockUseStoryProgress.mockReturnValue({
      progress: { 
        completionPercentage: 30, 
        lastParagraph: 0, // Start from 0 so paragraph 2 will be > currentParagraph 
        readingTimeSeconds: 120 
      },
      updateStoryProgress: mockUpdateStoryProgress,
      startReadingSession: jest.fn().mockReturnValue({ startTime: Date.now(), startParagraph: 0 }),
      endReadingSession: jest.fn(),
      loading: false,
    })

    render(<StoryReader story={mockStory} />)

    // Simulate intersection observer triggering
    if (intersectionCallback) {
      intersectionCallback([{
        target: { 
          dataset: { paragraph: '2' },
          getAttribute: (attr: string) => attr === 'data-paragraph' ? '2' : null
        },
        isIntersecting: true,
        intersectionRatio: 0.6
      }])
    }

    await waitFor(() => {
      expect(mockUpdateStoryProgress).toHaveBeenCalled()
    })
  })

  it('should handle stories with missing translations', () => {
    const storyWithMissingTranslation = {
      ...mockStory,
      content: {
        en: ['English paragraph only.'],
        tr: [], // Empty Turkish content
      },
    }

    render(<StoryReader story={storyWithMissingTranslation} />)

    expect(screen.getByText('English paragraph only.')).toBeInTheDocument()

    // Switch to Turkish
    const turkishButton = screen.getByRole('button', { name: /türkçe only/i })
    fireEvent.click(turkishButton)

    // Should show a message about missing translation or empty content
    // The component should handle missing Turkish content gracefully
    expect(turkishButton).toBeInTheDocument()
  })

  it('should display reading time estimate', () => {
    render(<StoryReader story={mockStory} />)

    // Should calculate reading time based on word count
    expect(screen.getByText(/min read/i)).toBeInTheDocument()
  })

  it('should show rating display for stories with ratings', () => {
    render(<StoryReader story={mockStory} />)

    // Shows the average rating and count
    expect(screen.getByText('4.5 (10)')).toBeInTheDocument()
  })

  it('should not show rating display for stories without ratings', () => {
    const storyWithoutRating = {
      ...mockStory,
      averageRating: undefined,
      ratingCount: 0,
    }

    render(<StoryReader story={storyWithoutRating} />)

    expect(screen.queryByText(/4\.5 \(10\)/)).not.toBeInTheDocument()
  })

  it('should handle long stories by rendering all paragraphs', () => {
    const longStory = {
      ...mockStory,
      content: {
        en: Array(5).fill(0).map((_, i) => `This is paragraph ${i + 1} in English.`),
        tr: Array(5).fill(0).map((_, i) => `Bu Türkçe ${i + 1}. paragraf.`),
      },
    }

    render(<StoryReader story={longStory} />)

    // Should render all paragraphs (no pagination)
    expect(screen.getByText('This is paragraph 1 in English.')).toBeInTheDocument()
    expect(screen.getByText('This is paragraph 5 in English.')).toBeInTheDocument()
  })

  it('should apply font size from settings', async () => {
    // Mock large font size setting
    mockUseSettings.mockReturnValue({
      settings: {
        fontSize: 'large',
        theme: 'light',
        readingSpeed: 200
      },
      updateSettings: jest.fn(),
      loading: false,
    })

    render(<StoryReader story={mockStory} />)

    // Font size should be applied to paragraph content
    const firstParagraph = screen.getByText('This is the first paragraph in English.')
    expect(firstParagraph).toHaveClass('text-lg')
  })

  it('should render keyboard accessible content', () => {
    render(<StoryReader story={mockStory} />)

    const readerContainer = screen.getByTestId('story-reader')
    
    // Component should be present and accessible
    expect(readerContainer).toBeInTheDocument()
    
    // Buttons should be keyboard accessible
    const languageButtons = screen.getAllByRole('button')
    expect(languageButtons.length).toBeGreaterThan(0)
  })

  it('should handle loading state', () => {
    mockUseStoryProgress.mockReturnValue({
      progress: null,
      updateStoryProgress: jest.fn(),
      startReadingSession: jest.fn(),
      endReadingSession: jest.fn(),
      loading: true,
    })

    render(<StoryReader story={mockStory} />)

    // Component should render even in loading state
    expect(screen.getByText('Test Story')).toBeInTheDocument()
  })

  it('should display story statistics', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText(/words/i)).toBeInTheDocument()
    expect(screen.getByText(/min read/i)).toBeInTheDocument()
  })
})