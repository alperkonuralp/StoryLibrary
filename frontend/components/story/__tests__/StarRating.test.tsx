import { render, screen, fireEvent } from '@testing-library/react'
import StarRating from '../StarRating'

describe('StarRating', () => {
  it('should render 5 stars by default', () => {
    render(<StarRating rating={0} onRatingChange={jest.fn()} />)
    
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
  })

  it('should display filled stars based on rating', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} />)
    
    const filledStars = screen.getAllByTestId('star-filled')
    const emptyStars = screen.getAllByTestId('star-empty')
    
    expect(filledStars).toHaveLength(3)
    expect(emptyStars).toHaveLength(2)
  })

  it('should handle partial ratings', () => {
    render(<StarRating rating={3.5} onRatingChange={jest.fn()} />)
    
    const filledStars = screen.getAllByTestId('star-filled')
    const halfStar = screen.getByTestId('star-half')
    const emptyStars = screen.getAllByTestId('star-empty')
    
    expect(filledStars).toHaveLength(3)
    expect(halfStar).toBeInTheDocument()
    expect(emptyStars).toHaveLength(1)
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
    
    // Should show 4 stars as hovered
    const hoveredStars = screen.getAllByTestId('star-hover')
    expect(hoveredStars).toHaveLength(4)
  })

  it('should reset hover state on mouse leave', () => {
    render(<StarRating rating={2} onRatingChange={jest.fn()} />)
    
    const fourthStar = screen.getAllByRole('button')[3]
    fireEvent.mouseEnter(fourthStar)
    fireEvent.mouseLeave(fourthStar)
    
    // Should return to showing original rating
    const filledStars = screen.getAllByTestId('star-filled')
    expect(filledStars).toHaveLength(2)
  })

  it('should be read-only when specified', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} readOnly />)
    
    const stars = screen.getAllByTestId(/star-/)
    stars.forEach(star => {
      expect(star).not.toHaveAttribute('role', 'button')
    })
  })

  it('should not call onRatingChange when read-only', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={3} onRatingChange={mockOnRatingChange} readOnly />)
    
    const star = screen.getAllByTestId(/star-/)[0]
    fireEvent.click(star)
    
    expect(mockOnRatingChange).not.toHaveBeenCalled()
  })

  it('should support custom size', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} size="large" />)
    
    const container = screen.getByTestId('star-rating-container')
    expect(container).toHaveClass('text-2xl')
  })

  it('should support custom colors', () => {
    render(
      <StarRating 
        rating={3} 
        onRatingChange={jest.fn()} 
        filledColor="text-yellow-400"
        emptyColor="text-gray-300"
      />
    )
    
    const filledStars = screen.getAllByTestId('star-filled')
    const emptyStars = screen.getAllByTestId('star-empty')
    
    expect(filledStars[0]).toHaveClass('text-yellow-400')
    expect(emptyStars[0]).toHaveClass('text-gray-300')
  })

  it('should handle keyboard navigation', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={0} onRatingChange={mockOnRatingChange} />)
    
    const firstStar = screen.getAllByRole('button')[0]
    firstStar.focus()
    
    // Navigate to third star with arrow keys
    fireEvent.keyDown(firstStar, { key: 'ArrowRight' })
    fireEvent.keyDown(firstStar, { key: 'ArrowRight' })
    
    // Press enter to select
    fireEvent.keyDown(firstStar, { key: 'Enter' })
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(3)
  })

  it('should show rating value as text for accessibility', () => {
    render(<StarRating rating={4} onRatingChange={jest.fn()} />)
    
    expect(screen.getByText('4 out of 5 stars')).toBeInTheDocument()
  })

  it('should handle zero rating', () => {
    render(<StarRating rating={0} onRatingChange={jest.fn()} />)
    
    const emptyStars = screen.getAllByTestId('star-empty')
    expect(emptyStars).toHaveLength(5)
    expect(screen.getByText('0 out of 5 stars')).toBeInTheDocument()
  })

  it('should handle maximum rating', () => {
    render(<StarRating rating={5} onRatingChange={jest.fn()} />)
    
    const filledStars = screen.getAllByTestId('star-filled')
    expect(filledStars).toHaveLength(5)
    expect(screen.getByText('5 out of 5 stars')).toBeInTheDocument()
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
    
    const filledStars = screen.getAllByTestId('star-filled')
    const halfStar = screen.queryByTestId('star-half')
    const emptyStars = screen.getAllByTestId('star-empty')
    
    expect(filledStars).toHaveLength(2)
    expect(halfStar).toBeInTheDocument()
    expect(emptyStars).toHaveLength(2)
  })

  it('should show tooltip with rating value on hover', () => {
    render(<StarRating rating={3} onRatingChange={jest.fn()} showTooltip />)
    
    const fourthStar = screen.getAllByRole('button')[3]
    fireEvent.mouseEnter(fourthStar)
    
    expect(screen.getByText('Rate 4 stars')).toBeInTheDocument()
  })

  it('should clear rating when clicked on same star', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={3} onRatingChange={mockOnRatingChange} allowClear />)
    
    const thirdStar = screen.getAllByRole('button')[2]
    fireEvent.click(thirdStar)
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(0)
  })

  it('should disable interaction when disabled prop is true', () => {
    const mockOnRatingChange = jest.fn()
    render(<StarRating rating={3} onRatingChange={mockOnRatingChange} disabled />)
    
    const stars = screen.getAllByRole('button')
    stars.forEach(star => {
      expect(star).toBeDisabled()
    })
    
    fireEvent.click(stars[4])
    expect(mockOnRatingChange).not.toHaveBeenCalled()
  })
})