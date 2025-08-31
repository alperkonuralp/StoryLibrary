import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdvancedSearch from '../AdvancedSearch'

// Mock data
const mockCategories = [
  { id: 'cat-1', name: { en: 'Fiction', tr: 'Kurgu' }, slug: 'fiction' },
  { id: 'cat-2', name: { en: 'Technology', tr: 'Teknoloji' }, slug: 'technology' },
]

const mockTags = [
  { id: 'tag-1', name: 'Adventure', slug: 'adventure', color: '#FF6B6B' },
  { id: 'tag-2', name: 'Mystery', slug: 'mystery', color: '#4ECDC4' },
]

const mockAuthors = [
  { id: 'author-1', name: { en: 'John Doe', tr: 'John Doe' }, slug: 'john-doe' },
  { id: 'author-2', name: { en: 'Jane Smith', tr: 'Jane Smith' }, slug: 'jane-smith' },
]

const defaultProps = {
  onSearch: jest.fn(),
  onClose: jest.fn(),
  categories: mockCategories,
  tags: mockTags,
  authors: mockAuthors,
}

describe('AdvancedSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all search fields', () => {
    render(<AdvancedSearch {...defaultProps} />)

    expect(screen.getByPlaceholderText(/search stories/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument()
  })

  it('should populate category options', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const categorySelect = screen.getByLabelText(/category/i)
    fireEvent.click(categorySelect)

    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
    })
  })

  it('should populate author options', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const authorSelect = screen.getByLabelText(/author/i)
    fireEvent.click(authorSelect)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('should show tag options with colors', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const tagSelect = screen.getByLabelText(/tags/i)
    fireEvent.click(tagSelect)

    await waitFor(() => {
      const adventureTag = screen.getByText('Adventure')
      const mysteryTag = screen.getByText('Mystery')
      
      expect(adventureTag).toBeInTheDocument()
      expect(mysteryTag).toBeInTheDocument()
    })
  })

  it('should handle basic text search', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    const searchButton = screen.getByRole('button', { name: /search/i })

    fireEvent.change(searchInput, { target: { value: 'adventure story' } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        query: 'adventure story',
        category: '',
        author: '',
        tags: [],
        language: 'all',
        minRating: 0,
        sortBy: 'relevance',
      })
    })
  })

  it('should handle category filter', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const categorySelect = screen.getByLabelText(/category/i)
    fireEvent.click(categorySelect)

    await waitFor(() => {
      const fictionOption = screen.getByText('Fiction')
      fireEvent.click(fictionOption)
    })

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'cat-1',
      })
    )
  })

  it('should handle author filter', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const authorSelect = screen.getByLabelText(/author/i)
    fireEvent.click(authorSelect)

    await waitFor(() => {
      const authorOption = screen.getByText('John Doe')
      fireEvent.click(authorOption)
    })

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        author: 'author-1',
      })
    )
  })

  it('should handle multiple tag selection', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const tagSelect = screen.getByLabelText(/tags/i)
    fireEvent.click(tagSelect)

    await waitFor(() => {
      const adventureTag = screen.getByText('Adventure')
      const mysteryTag = screen.getByText('Mystery')
      
      fireEvent.click(adventureTag)
      fireEvent.click(mysteryTag)
    })

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['tag-1', 'tag-2'],
      })
    )
  })

  it('should handle language filter', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const languageSelect = screen.getByLabelText(/language/i)
    fireEvent.click(languageSelect)

    await waitFor(() => {
      const englishOption = screen.getByText('English')
      fireEvent.click(englishOption)
    })

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'en',
      })
    )
  })

  it('should handle rating filter', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const ratingSlider = screen.getByLabelText(/rating/i)
    fireEvent.change(ratingSlider, { target: { value: '4' } })

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        minRating: 4,
      })
    )
  })

  it('should handle sort option', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const sortSelect = screen.getByLabelText(/sort by/i)
    fireEvent.click(sortSelect)

    await waitFor(() => {
      const ratingOption = screen.getByText('Highest Rated')
      fireEvent.click(ratingOption)
    })

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'rating',
      })
    )
  })

  it('should clear all filters', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    // Set some filters
    const searchInput = screen.getByPlaceholderText(/search stories/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const categorySelect = screen.getByLabelText(/category/i)
    fireEvent.click(categorySelect)
    await waitFor(() => {
      fireEvent.click(screen.getByText('Fiction'))
    })

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear/i })
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(searchInput).toHaveValue('')
      expect(categorySelect).toHaveDisplayValue('')
    })
  })

  it('should close modal when close button is clicked', () => {
    render(<AdvancedSearch {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should close modal on escape key', () => {
    render(<AdvancedSearch {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should show recent searches', () => {
    // Mock localStorage
    const mockRecentSearches = [
      'adventure story',
      'mystery novel',
      'science fiction',
    ]
    
    Storage.prototype.getItem = jest.fn(() => 
      JSON.stringify(mockRecentSearches)
    )

    render(<AdvancedSearch {...defaultProps} />)

    expect(screen.getByText(/recent searches/i)).toBeInTheDocument()
    expect(screen.getByText('adventure story')).toBeInTheDocument()
    expect(screen.getByText('mystery novel')).toBeInTheDocument()
  })

  it('should use recent search when clicked', async () => {
    Storage.prototype.getItem = jest.fn(() => 
      JSON.stringify(['adventure story'])
    )

    render(<AdvancedSearch {...defaultProps} />)

    const recentSearchItem = screen.getByText('adventure story')
    fireEvent.click(recentSearchItem)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    expect(searchInput).toHaveValue('adventure story')
  })

  it('should save search to recent searches', async () => {
    Storage.prototype.setItem = jest.fn()

    render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    const searchButton = screen.getByRole('button', { name: /search/i })

    fireEvent.change(searchInput, { target: { value: 'new search' } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        expect.stringContaining('new search')
      )
    })
  })

  it('should handle empty search gracefully', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: '',
      })
    )
  })

  it('should show filter count badge', async () => {
    render(<AdvancedSearch {...defaultProps} />)

    // Apply multiple filters
    const categorySelect = screen.getByLabelText(/category/i)
    fireEvent.click(categorySelect)
    await waitFor(() => {
      fireEvent.click(screen.getByText('Fiction'))
    })

    const authorSelect = screen.getByLabelText(/author/i)
    fireEvent.click(authorSelect)
    await waitFor(() => {
      fireEvent.click(screen.getByText('John Doe'))
    })

    // Should show filter count
    expect(screen.getByText('2 filters applied')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', () => {
    render(<AdvancedSearch {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search stories/i)
    searchInput.focus()

    // Tab to next element
    fireEvent.keyDown(searchInput, { key: 'Tab' })
    
    const categorySelect = screen.getByLabelText(/category/i)
    expect(categorySelect).toHaveFocus()
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