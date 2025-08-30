import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'next/navigation';
import StoriesPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({})),
}));

jest.mock('@/hooks/useStories', () => ({
  useStories: jest.fn(() => ({
    stories: [],
    loading: false,
    error: null,
    pagination: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('@/hooks/useCategories', () => ({
  useCategories: jest.fn(() => ({
    categories: [
      { id: 'cat1', name: { en: 'Fiction', tr: 'Kurgu' } },
      { id: 'cat2', name: { en: 'Technology', tr: 'Teknoloji' } },
    ],
    loading: false,
  })),
}));

jest.mock('@/hooks/useAuthors', () => ({
  useAuthors: jest.fn(() => ({
    authors: [
      { id: 'author1', name: 'Jane Doe' },
      { id: 'author2', name: 'John Smith' },
      { id: 'author3', name: 'Ayşe Yılmaz' },
    ],
    loading: false,
  })),
}));

jest.mock('@/components/story/StoryList', () => {
  return function MockStoryList({ language, stories }: any) {
    return (
      <div data-testid="story-list">
        <span data-testid="language">{language}</span>
        <span data-testid="story-count">{stories.length}</span>
      </div>
    );
  };
});

jest.mock('@/components/Navigation', () => {
  return function MockNavigation() {
    return <nav data-testid="navigation">Navigation</nav>;
  };
});

const mockUseStories = require('@/hooks/useStories').useStories;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('StoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);
  });

  it('should render page with correct default state', () => {
    render(<StoriesPage />);

    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('Discover engaging bilingual stories for language learning')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search stories...')).toBeInTheDocument();
    expect(screen.getByTestId('story-list')).toBeInTheDocument();
  });

  it('should handle URL parameter for authorId', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'authorId') return 'author1';
        return null;
      }),
    } as any);

    render(<StoriesPage />);

    // Should call useStories with authorId filter
    expect(mockUseStories).toHaveBeenCalledWith({
      filters: expect.objectContaining({
        authorId: 'author1',
      }),
    });
  });

  it('should handle URL parameter for categoryId', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'categoryId') return 'cat1';
        return null;
      }),
    } as any);

    render(<StoriesPage />);

    expect(mockUseStories).toHaveBeenCalledWith({
      filters: expect.objectContaining({
        categoryId: 'cat1',
      }),
    });
  });

  it('should display active filter with author name', async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'authorId') return 'author1';
        return null;
      }),
    } as any);

    render(<StoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('should display active filter with category name', async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'categoryId') return 'cat1';
        return null;
      }),
    } as any);

    render(<StoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Fiction')).toBeInTheDocument();
    });
  });

  it('should toggle story language correctly', async () => {
    const user = userEvent.setup();
    render(<StoriesPage />);

    const toggleButton = screen.getByRole('button', { name: /Turkish Stories/i });
    await user.click(toggleButton);

    // Should pass Turkish language to StoryList
    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('tr');
    });

    // Button text should change
    expect(screen.getByRole('button', { name: /English Stories/i })).toBeInTheDocument();
  });

  it('should maintain English interface when toggling story language', async () => {
    const user = userEvent.setup();
    render(<StoriesPage />);

    const toggleButton = screen.getByRole('button', { name: /Turkish Stories/i });
    await user.click(toggleButton);

    // Interface should remain in English
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('Active filters:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search stories...')).toBeInTheDocument();
  });

  it('should handle search input correctly', async () => {
    const user = userEvent.setup();
    render(<StoriesPage />);

    const searchInput = screen.getByPlaceholderText('Search stories...');
    await user.type(searchInput, 'test query');

    await waitFor(() => {
      expect(mockUseStories).toHaveBeenCalledWith({
        filters: expect.objectContaining({
          search: 'test query',
        }),
      });
    });
  });

  it('should clear filters when remove buttons are clicked', async () => {
    const user = userEvent.setup();
    
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'authorId') return 'author1';
        return null;
      }),
    } as any);

    render(<StoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: '×' });
    await user.click(removeButton);

    // Filter should be cleared
    await waitFor(() => {
      expect(mockUseStories).toHaveBeenCalledWith({
        filters: expect.objectContaining({
          authorId: undefined,
        }),
      });
    });
  });

  it('should display error message when API fails', () => {
    mockUseStories.mockReturnValue({
      stories: [],
      loading: false,
      error: 'Failed to load stories',
      pagination: null,
      refetch: jest.fn(),
    });

    render(<StoriesPage />);

    expect(screen.getByText('Failed to load stories. Please try again later.')).toBeInTheDocument();
  });

  it('should handle unknown author/category IDs gracefully', async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((key) => {
        if (key === 'authorId') return 'unknown-author';
        return null;
      }),
    } as any);

    render(<StoriesPage />);

    await waitFor(() => {
      // Should show the ID as fallback
      expect(screen.getByText('unknown-author')).toBeInTheDocument();
    });
  });
});