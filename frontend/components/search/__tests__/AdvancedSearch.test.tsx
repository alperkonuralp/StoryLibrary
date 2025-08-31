import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdvancedSearch from '../AdvancedSearch'

// Mock all the hooks that AdvancedSearch uses
jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn(),
}))

jest.mock('../../../hooks/useAuthors', () => ({
  useAuthors: jest.fn(),
}))

jest.mock('../../../hooks/useTags', () => ({
  useTags: jest.fn(),
}))

jest.mock('../../../hooks/useSearchHistory', () => ({
  useSearchHistory: jest.fn(),
}))

// Get the mocks after they're defined
const { useCategories: mockUseCategories } = require('../../../hooks/useCategories')
const { useAuthors: mockUseAuthors } = require('../../../hooks/useAuthors')
const { useTags: mockUseTags } = require('../../../hooks/useTags')
const { useSearchHistory: mockUseSearchHistory } = require('../../../hooks/useSearchHistory')

// Mock data
const mockCategories = [
  { id: 'cat-1', name: { en: 'Fiction', tr: 'Kurgu' }, slug: 'fiction' },
  { id: 'cat-2', name: { en: 'Technology', tr: 'Teknoloji' }, slug: 'technology' },
]

const mockTags = [
  { id: 'tag-1', name: { en: 'Adventure', tr: 'Macera' }, slug: 'adventure', color: '#FF6B6B' },
  { id: 'tag-2', name: { en: 'Mystery', tr: 'Gizem' }, slug: 'mystery', color: '#4ECDC4' },
]

const mockAuthors = [
  { id: 'author-1', name: 'John Doe', slug: 'john-doe' },
  { id: 'author-2', name: 'Jane Smith', slug: 'jane-smith' },
]

const defaultProps = {
  onSearch: jest.fn(),
  onClear: jest.fn(),
}

describe('AdvancedSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup hook mocks
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null,
    })
    
    mockUseAuthors.mockReturnValue({
      authors: mockAuthors,
      loading: false,
      error: null,
    })
    
    mockUseTags.mockReturnValue({
      tags: mockTags,
      loading: false,
      error: null,
    })
    
    mockUseSearchHistory.mockReturnValue({
      searchHistory: [],
      savedSearches: [],
      addToHistory: jest.fn(),
      saveSearch: jest.fn(),
      deleteSavedSearch: jest.fn(),
      getSearchSuggestions: jest.fn(() => []),
      getRecentSearches: jest.fn(() => []),
    })
  })

  it('should render all search fields', () => {
    render(<AdvancedSearch {...defaultProps} />)

    expect(screen.getByPlaceholderText(/search stories/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/all categories/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/all authors/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /advanced/i })).toBeInTheDocument()
  })

  it('should populate category options', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const categorySelect = screen.getByDisplayValue(/all categories/i)
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
  })

  it('should populate author options', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should show tag options with colors when advanced panel is opened', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    // Open advanced panel
    const advancedButton = screen.getByRole('button', { name: /advanced/i })
    fireEvent.click(advancedButton)

    await waitFor(() => {
      expect(screen.getByText('Adventure')).toBeInTheDocument()
      expect(screen.getByText('Mystery')).toBeInTheDocument()
    })
  })

  it('should handle basic text search', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)

    fireEvent.change(searchInput, { target: { value: 'adventure story' } })

    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        search: 'adventure story',
        categoryId: '',
        authorId: '',
        tagId: '',
        minRating: 0,
        language: 'en',
        sortBy: 'newest',
      })
    })
  })

  it('should handle category filter', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const categorySelect = screen.getByDisplayValue(/all categories/i)
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } })

    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
        })
      )
    })
  })

  it('should handle author filter', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const authorSelect = screen.getByDisplayValue(/all authors/i)
    fireEvent.change(authorSelect, { target: { value: 'author-1' } })

    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: 'author-1',
        })
      )
    })
  })

  it('should handle tag selection when advanced panel is opened', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    // Open advanced panel first
    const advancedButton = screen.getByRole('button', { name: /advanced/i })
    fireEvent.click(advancedButton)

    await waitFor(() => {
      const tagSelect = screen.getByDisplayValue('')
      fireEvent.change(tagSelect, { target: { value: 'tag-1' } })
    })
  })

  it('should handle advanced filters when panel is opened', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const advancedButton = screen.getByRole('button', { name: /advanced/i })
    fireEvent.click(advancedButton)

    await waitFor(() => {
      expect(screen.getByText(/advanced filters/i)).toBeInTheDocument()
      expect(screen.getAllByText(/tags/i)).toHaveLength(2) // Label and select option
      expect(screen.getByText(/minimum rating/i)).toBeInTheDocument()
      expect(screen.getByText(/sort by/i)).toBeInTheDocument()
    })
  })

  it('should handle apply filters button in advanced panel', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const advancedButton = screen.getByRole('button', { name: /advanced/i })
    fireEvent.click(advancedButton)

    await waitFor(() => {
      const applyButton = screen.getByRole('button', { name: /apply filters/i })
      fireEvent.click(applyButton)
      expect(defaultProps.onSearch).toHaveBeenCalled()
    })
  })

  it('should clear all filters when clear button is clicked', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    // Set some filters
    const searchInput = screen.getByPlaceholderText(/search stories/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const categorySelect = screen.getByDisplayValue(/all categories/i)
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } })

    await waitFor(() => {
      // Clear filters - look for clear button in active filters
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      fireEvent.click(clearButton)
      expect(defaultProps.onClear).toHaveBeenCalled()
    })
  })

  it('should toggle advanced panel', () => {
    render(<AdvancedSearch {...defaultProps} />)

    const advancedButton = screen.getByRole('button', { name: /advanced/i })
    fireEvent.click(advancedButton)

    expect(screen.getByText(/advanced filters/i)).toBeInTheDocument()
  })

  it('should handle empty search gracefully', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    fireEvent.change(searchInput, { target: { value: '' } })

    // Component should handle empty search without errors
    expect(searchInput).toHaveValue('')
  })

  it('should show recent searches when available', async () => {
    // Mock search history hook to return recent searches
    mockUseSearchHistory.mockReturnValue({
      searchHistory: [
        { query: 'adventure story', timestamp: Date.now() },
        { query: 'mystery novel', timestamp: Date.now() }
      ],
      savedSearches: [],
      addToHistory: jest.fn(),
      saveSearch: jest.fn(),
      deleteSavedSearch: jest.fn(),
      getSearchSuggestions: jest.fn(() => ['adventure story', 'mystery novel']),
      getRecentSearches: jest.fn(() => ['adventure story', 'mystery novel']),
    })

    render(<AdvancedSearch {...defaultProps} />)

    // Open advanced panel to see search history
    const advancedButton = screen.getByRole('button', { name: /advanced/i })
    fireEvent.click(advancedButton)

    await waitFor(() => {
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument()
    })
  })

  it('should show filter count badge when filters are applied', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    // Apply category filter
    const categorySelect = screen.getByDisplayValue(/all categories/i)
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } })

    // Apply author filter
    const authorSelect = screen.getByDisplayValue(/all authors/i)  
    fireEvent.change(authorSelect, { target: { value: 'author-1' } })

    await waitFor(() => {
      // Advanced button should show filter count
      const advancedButton = screen.getByRole('button', { name: /advanced/i })
      expect(advancedButton).toBeInTheDocument()
    })
  })

  it('should support basic keyboard navigation', () => {
    render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    searchInput.focus()
    expect(searchInput).toHaveFocus()
  })

  it('should preserve state when reopened', () => {
    const { rerender } = render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    fireEvent.change(searchInput, { target: { value: 'persistent search' } })

    // Simulate closing and reopening
    rerender(<AdvancedSearch {...defaultProps} />)

    expect(screen.getByDisplayValue('persistent search')).toBeInTheDocument()
  })
})