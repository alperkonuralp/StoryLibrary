import React from 'react'
import { render, screen } from '@testing-library/react'
import { StoryCard } from '../StoryCard'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const mockStory = {
  id: '1',
  slug: 'test-story',
  title: { en: 'Test Story', tr: 'Test Hikaye' },
  shortDescription: { en: 'A test story', tr: 'Bir test hikayesi' },
  statistics: {
    wordCount: { en: 100, tr: 95 },
    estimatedReadingTime: { en: 1, tr: 1 }
  },
  categories: [{
    category: {
      id: 'cat1',
      name: { en: 'Fiction', tr: 'Kurgu' },
      slug: 'fiction'
    }
  }],
  tags: [{
    tag: {
      id: 'tag1',
      name: { en: 'Beginner', tr: 'Başlangıç' },
      color: '#10B981',
      slug: 'beginner'
    }
  }],
  authors: [{
    author: {
      id: 'author1',
      name: 'John Doe',
      slug: 'john-doe'
    },
    role: 'author'
  }],
  averageRating: 4.5,
  ratingCount: 10,
  publishedAt: '2024-01-01T00:00:00Z'
}

describe('StoryCard', () => {
  it('renders story title and description', () => {
    render(<StoryCard story={mockStory} />)
    
    expect(screen.getByText('Test Story')).toBeInTheDocument()
    expect(screen.getByText('A test story')).toBeInTheDocument()
  })

  it('renders story in Turkish when language is set to tr', () => {
    render(<StoryCard story={mockStory} language="tr" />)
    
    expect(screen.getByText('Test Hikaye')).toBeInTheDocument()
    expect(screen.getByText('Bir test hikayesi')).toBeInTheDocument()
  })

  it('displays categories correctly', () => {
    render(<StoryCard story={mockStory} />)
    
    expect(screen.getByText('Fiction')).toBeInTheDocument()
  })

  it('displays author information', () => {
    render(<StoryCard story={mockStory} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays word count and reading time statistics', () => {
    render(<StoryCard story={mockStory} />)
    
    expect(screen.getByText('100 words')).toBeInTheDocument()
    expect(screen.getByText('1 min')).toBeInTheDocument()
  })

  describe('Rating display', () => {
    it('displays average rating when averageRating is a number', () => {
      render(<StoryCard story={mockStory} />)
      
      expect(screen.getByText('4.5 (10)')).toBeInTheDocument()
    })

    it('handles string averageRating correctly', () => {
      const storyWithStringRating = {
        ...mockStory,
        averageRating: '4.7' as any // Simulate API returning string
      }
      
      render(<StoryCard story={storyWithStringRating} />)
      
      expect(screen.getByText('4.7 (10)')).toBeInTheDocument()
    })

    it('handles null averageRating correctly', () => {
      const storyWithoutRating = {
        ...mockStory,
        averageRating: null,
        ratingCount: 0
      }
      
      render(<StoryCard story={storyWithoutRating} />)
      
      expect(screen.queryByText(/\d\.\d \(\d+\)/)).not.toBeInTheDocument()
    })

    it('handles undefined averageRating correctly', () => {
      const storyWithoutRating = {
        ...mockStory,
        averageRating: undefined,
        ratingCount: 0
      }
      
      render(<StoryCard story={storyWithoutRating} />)
      
      expect(screen.queryByText(/\d\.\d \(\d+\)/)).not.toBeInTheDocument()
    })

    it('handles zero ratingCount correctly', () => {
      const storyWithZeroRatings = {
        ...mockStory,
        averageRating: 4.5,
        ratingCount: 0
      }
      
      render(<StoryCard story={storyWithZeroRatings} />)
      
      expect(screen.queryByText(/\d\.\d \(\d+\)/)).not.toBeInTheDocument()
    })
  })

  it('displays published date', () => {
    render(<StoryCard story={mockStory} />)
    
    // Check for date specifically in the date container
    const dateElement = screen.getByText('Jan 1, 2024')
    expect(dateElement).toBeInTheDocument()
    expect(dateElement.closest('.text-gray-400')).toBeInTheDocument()
  })

  it('creates correct story link', () => {
    render(<StoryCard story={mockStory} />)
    
    const link = screen.getByRole('link', { name: 'Test Story' })
    expect(link).toHaveAttribute('href', '/stories/test-story')
  })

  it('hides description when showDescription is false', () => {
    render(<StoryCard story={mockStory} showDescription={false} />)
    
    expect(screen.queryByText('A test story')).not.toBeInTheDocument()
  })

  it('hides statistics when showStats is false', () => {
    render(<StoryCard story={mockStory} showStats={false} />)
    
    expect(screen.queryByText('100 words')).not.toBeInTheDocument()
    expect(screen.queryByText('1 min')).not.toBeInTheDocument()
  })

  it('handles stories with multiple categories', () => {
    const storyWithMultipleCategories = {
      ...mockStory,
      categories: [
        {
          category: {
            id: 'cat1',
            name: { en: 'Fiction', tr: 'Kurgu' },
            slug: 'fiction'
          }
        },
        {
          category: {
            id: 'cat2',
            name: { en: 'Adventure', tr: 'Macera' },
            slug: 'adventure'
          }
        },
        {
          category: {
            id: 'cat3',
            name: { en: 'Mystery', tr: 'Gizem' },
            slug: 'mystery'
          }
        }
      ]
    }
    
    render(<StoryCard story={storyWithMultipleCategories} />)
    
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Adventure')).toBeInTheDocument()
    expect(screen.getByText('+1 more')).toBeInTheDocument()
  })

  it('handles stories with multiple authors', () => {
    const storyWithMultipleAuthors = {
      ...mockStory,
      authors: [
        {
          author: {
            id: 'author1',
            name: 'John Doe',
            slug: 'john-doe'
          },
          role: 'author'
        },
        {
          author: {
            id: 'author2',
            name: 'Jane Smith',
            slug: 'jane-smith'
          },
          role: 'co-author'
        },
        {
          author: {
            id: 'author3',
            name: 'Bob Wilson',
            slug: 'bob-wilson'
          },
          role: 'translator'
        }
      ]
    }
    
    render(<StoryCard story={storyWithMultipleAuthors} />)
    
    expect(screen.getByText('John Doe, Jane Smith +1')).toBeInTheDocument()
  })
})