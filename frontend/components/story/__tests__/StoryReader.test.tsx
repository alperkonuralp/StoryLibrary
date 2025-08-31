import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StoryReader } from '../StoryReader'
import { useProgress } from '../../../hooks/useProgress'
import { useAuth } from '../../../hooks/useAuth'

// Mock hooks
jest.mock('../../../hooks/useProgress', () => ({
  useProgress: jest.fn(),
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

const mockUseProgress = useProgress as jest.MockedFunction<typeof useProgress>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

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
  authors: [
    {
      author: {
        id: 'author-1',
        name: { en: 'John Doe', tr: 'John Doe' },
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
        name: 'Adventure',
        slug: 'adventure',
        color: '#FF6B6B',
      },
    },
  ],
}

describe('StoryReader', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', role: 'USER' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
    })

    mockUseProgress.mockReturnValue({
      progress: 50,
      updateProgress: jest.fn(),
      loading: false,
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

    const turkishButton = screen.getByRole('button', { name: /turkish/i })
    fireEvent.click(turkishButton)

    await waitFor(() => {
      expect(screen.getByText('Test Hikaye')).toBeInTheDocument()
      expect(screen.getByText('Bu Türkçe birinci paragraf.')).toBeInTheDocument()
    })
  })

  it('should display bilingual mode when selected', async () => {
    render(<StoryReader story={mockStory} />)

    const bilingualButton = screen.getByRole('button', { name: /bilingual/i })
    fireEvent.click(bilingualButton)

    await waitFor(() => {
      // Both languages should be visible
      expect(screen.getByText('This is the first paragraph in English.')).toBeInTheDocument()
      expect(screen.getByText('Bu Türkçe birinci paragraf.')).toBeInTheDocument()
    })
  })

  it('should display story metadata', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Adventure')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
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

    render(<StoryReader story={mockStory} />)

    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('should update progress when scrolling', async () => {
    const mockUpdateProgress = jest.fn()
    mockUseProgress.mockReturnValue({
      progress: 50,
      updateProgress: mockUpdateProgress,
      loading: false,
    })

    render(<StoryReader story={mockStory} />)

    // Simulate scroll event
    const readerContainer = screen.getByTestId('story-reader')
    fireEvent.scroll(readerContainer, { target: { scrollTop: 500 } })

    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalled()
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
    const turkishButton = screen.getByRole('button', { name: /turkish/i })
    fireEvent.click(turkishButton)

    // Should show a message about missing translation
    expect(screen.getByText(/translation not available/i)).toBeInTheDocument()
  })

  it('should display reading time estimate', () => {
    render(<StoryReader story={mockStory} />)

    // Should calculate reading time based on word count
    expect(screen.getByText(/min read/i)).toBeInTheDocument()
  })

  it('should show rating component for authenticated users', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText(/rate this story/i)).toBeInTheDocument()
  })

  it('should not show rating component for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
    })

    render(<StoryReader story={mockStory} />)

    expect(screen.queryByText(/rate this story/i)).not.toBeInTheDocument()
  })

  it('should handle long stories with pagination', () => {
    const longStory = {
      ...mockStory,
      content: {
        en: Array(100).fill(0).map((_, i) => `This is paragraph ${i + 1} in English.`),
        tr: Array(100).fill(0).map((_, i) => `Bu Türkçe ${i + 1}. paragraf.`),
      },
    }

    render(<StoryReader story={longStory} />)

    // Should show pagination controls
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
  })

  it('should handle font size adjustment', async () => {
    render(<StoryReader story={mockStory} />)

    const fontSizeButton = screen.getByRole('button', { name: /font size/i })
    fireEvent.click(fontSizeButton)

    const increaseFontButton = screen.getByRole('button', { name: /increase/i })
    fireEvent.click(increaseFontButton)

    // Font size should be applied to content
    const content = screen.getByTestId('story-content')
    expect(content).toHaveClass('text-lg')
  })

  it('should support keyboard navigation', () => {
    render(<StoryReader story={mockStory} />)

    const readerContainer = screen.getByTestId('story-reader')
    
    // Test arrow key navigation
    fireEvent.keyDown(readerContainer, { key: 'ArrowDown' })
    expect(readerContainer).toHaveFocus()

    fireEvent.keyDown(readerContainer, { key: 'ArrowUp' })
    expect(readerContainer).toHaveFocus()
  })

  it('should handle loading state', () => {
    mockUseProgress.mockReturnValue({
      progress: null,
      updateProgress: jest.fn(),
      loading: true,
    })

    render(<StoryReader story={mockStory} />)

    expect(screen.getByTestId('progress-loading')).toBeInTheDocument()
  })

  it('should display publication date', () => {
    render(<StoryReader story={mockStory} />)

    expect(screen.getByText(/january 1, 2023/i)).toBeInTheDocument()
  })
})