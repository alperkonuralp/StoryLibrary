'use client';

import { StoryCard } from './StoryCard';

interface Story {
  id: string;
  slug: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  statistics?: {
    wordCount: Record<string, number>;
    estimatedReadingTime: Record<string, number>;
  };
  categories?: Array<{
    category: {
      id: string;
      name: Record<string, string>;
      slug: string;
    };
  }>;
  tags?: Array<{
    tag: {
      id: string;
      name: Record<string, string>;
      color: string;
      slug: string;
    };
  }>;
  authors?: Array<{
    author: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  }>;
  averageRating?: number;
  ratingCount?: number;
  publishedAt?: string;
}

interface StoryListProps {
  stories: Story[];
  language?: 'en' | 'tr';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
  showDescription?: boolean;
  showStats?: boolean;
  searchTerm?: string;
  showTags?: boolean;
}

export function StoryList({ 
  stories,
  language = 'en',
  loading = false,
  emptyMessage = 'No stories found.',
  className = '',
  cardClassName = '',
  showDescription = true,
  showStats = true,
  searchTerm,
  showTags = true
}: StoryListProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48 w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Stories</h3>
          <p className="text-gray-500 max-w-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          language={language}
          className={cardClassName}
          showDescription={showDescription}
          showStats={showStats}
          showTags={showTags}
          searchTerm={searchTerm || ''}
        />
      ))}
    </div>
  );
}

export default StoryList;