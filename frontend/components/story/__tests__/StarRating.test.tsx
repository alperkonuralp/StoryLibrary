import { render, screen, fireEvent } from '@testing-library/react'
import { StarRating } from '../StarRating'

describe('StarRating', () => {
  it('should render 5 stars by default', () => {
    render(<StarRating rating={0} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
  })

  it('should display stars based on rating', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
    
    // Check that first 3 stars have filled styling
    const filledStars = stars.slice(0, 3)
    filledStars.forEach(star => {
      const starIcon = star.querySelector('svg')
      expect(starIcon).toHaveClass('fill-yellow-400')
    })
  })

  it('should handle partial ratings', () => {
    render(<StarRating rating={3.5} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
    
    // Check that 4th star has partial fill styling
    const fourthStar = stars[3].querySelector('svg')
    expect(fourthStar).toHaveClass('fill-yellow-200')
  })

  it('should call onRatingChange when star is clicked', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={0} onRatingChange={mockOnRatingChange} />)
    
    const fourthStar = screen.getAllByRole('button')[3]
    fireEvent.click(fourthStar)
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(4)
  })

  it('should show hover effect', () => {
    render(<StarRating rating={2} onRatingChange={jest.fn()} />)
    
    const fourthStar = screen.getAllByRole('button')[3]
    fireEvent.mouseEnter(fourthStar)
    
    // Check that stars show hover state by checking filled styling
    const stars = screen.getAllByRole('button')
    const hoveredStars = stars.slice(0, 4) // First 4 stars should be filled on hover
    hoveredStars.forEach(star => {
      const starIcon = star.querySelector('svg')
      expect(starIcon).toHaveClass('fill-yellow-400')
    })
  })

  it('should reset hover state on mouse leave', () => {
    render(<StarRating rating={2} onRatingChange={jest.fn()} />)
    
    const container = screen.getAllByRole('button')[0].parentElement
    const fourthStar = screen.getAllByRole('button')[3]
    
    fireEvent.mouseEnter(fourthStar)
    fireEvent.mouseLeave(container) // Leave the container
    
    // Should return to showing original rating (2 stars)
    const stars = screen.getAllByRole('button')
    const filledStars = stars.slice(0, 2)
    filledStars.forEach(star => {
      const starIcon = star.querySelector('svg')
      expect(starIcon).toHaveClass('fill-yellow-400')
    })
  })

  it('should be read-only when specified', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} readonly />)
    
    const stars = screen.getAllByRole('button')
    stars.forEach(star => {
      expect(star).toBeDisabled()
    })
  })

  it('should not call onRatingChange when read-only', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={3} onRatingChange={mockOnRatingChange} readonly />)
    
    const star = screen.getAllByRole('button')[0]
    fireEvent.click(star)
    
    expect(mockOnRatingChange).not.toHaveBeenCalled()
  })

  it('should support custom size', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} size="lg" />)
    
    const star = screen.getAllByRole('button')[0].querySelector('svg')
    expect(star).toHaveClass('h-6')
    expect(star).toHaveClass('w-6')
  })

  it('should apply default colors correctly', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    const filledStar = stars[0].querySelector('svg')
    const emptyStar = stars[4].querySelector('svg')
    
    expect(filledStar).toHaveClass('text-yellow-400')
    expect(emptyStar).toHaveClass('text-gray-400')
  })

  it('should be keyboard accessible', () => {
    render(<StarRating rating={0} onRatingChange={jest.fn()} />)
    
    const firstStar = screen.getAllByRole('button')[0]
    firstStar.focus()
    
    expect(firstStar).toHaveFocus()
    expect(firstStar).toHaveAttribute('aria-label', '1 star')
  })

  it('should show rating value when showValue is enabled', () => {
    render(<StarRating rating={4.2} onRatingChange={jest.fn()} showValue />)
    
    expect(screen.getByText('4.2')).toBeInTheDocument()
  })

  it('should handle zero rating', () => {
    render(<StarRating rating={0} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
    
    // All stars should be empty (not filled)
    stars.forEach(star => {
      const starIcon = star.querySelector('svg')
      expect(starIcon).not.toHaveClass('fill-yellow-400')
    })
  })

  it('should handle maximum rating', () => {
    render(<StarRating rating={5} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
    
    // All stars should be filled
    stars.forEach(star => {
      const starIcon = star.querySelector('svg')
      expect(starIcon).toHaveClass('fill-yellow-400')
    })
  })

  it('should prevent rating above maximum', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={5} onRatingChange={mockOnRatingChange} />)
    
    // Try to click beyond 5th star (shouldn't exist)
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
  })

  it('should handle decimal ratings correctly', () => {
    render(<StarRating rating={2.7} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
    
    // First 2 stars should be filled, 3rd star should be partially filled
    const filledStars = stars.slice(0, 2)
    filledStars.forEach(star => {
      const starIcon = star.querySelector('svg')
      expect(starIcon).toHaveClass('fill-yellow-400')
    })
    
    const partialStar = stars[2].querySelector('svg')
    expect(partialStar).toHaveClass('fill-yellow-200')
  })

  it('should have proper aria labels for accessibility', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars[0]).toHaveAttribute('aria-label', '1 star')
    expect(stars[1]).toHaveAttribute('aria-label', '2 stars')
    expect(stars[4]).toHaveAttribute('aria-label', '5 stars')
  })

  it('should handle click events properly', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={1} onRatingChange={mockOnRatingChange} />)
    
    const thirdStar = screen.getAllByRole('button')[2]
    fireEvent.click(thirdStar)
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(3)
  })

  it('should handle readonly state correctly', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={3} onRatingChange={mockOnRatingChange} readonly />)
    
    const stars = screen.getAllByRole('button')
    expect(stars[0]).toBeDisabled()
    
    fireEvent.click(stars[4])
    expect(mockOnRatingChange).not.toHaveBeenCalled()
  })
})