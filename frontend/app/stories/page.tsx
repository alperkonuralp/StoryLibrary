'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { StoryList } from '@/components/story/StoryList';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { Search, Filter } from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import { useCategories } from '@/hooks/useCategories';
import { useAuthors } from '@/hooks/useAuthors';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import type { DisplayMode, StoryFilters } from '@/types';

export default function StoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [storyLanguage, setStoryLanguage] = useState<'en' | 'tr'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'averageRating' | 'ratingCount'>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Create filters object for API calls
  const filters = useMemo((): StoryFilters => {
    const filterObj = {
      search: searchQuery || undefined,
      categoryId: selectedCategory || undefined,
      authorId: selectedAuthor || undefined,
      tagId: selectedTag || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      sortBy,
      sortOrder,
      language: storyLanguage,
      status: 'PUBLISHED' as const,
      page: 1,
      limit: 20
    };
    return filterObj;
  }, [searchQuery, selectedCategory, selectedAuthor, selectedTag, minRating, sortBy, sortOrder, storyLanguage]);

  // Fetch stories from API
  const { stories, loading, error, pagination, refetch } = useStories({ filters });
  
  // Read URL parameters and update state
  useEffect(() => {
    const categoryId = searchParams.get('categoryId') || '';
    const authorId = searchParams.get('authorId') || '';
    
    
    setSelectedCategory(categoryId);
    setSelectedAuthor(authorId);
    setSearchQuery(''); // Clear search when coming from URL
  }, [searchParams]);
  
  // Fetch categories and authors from API
  const { categories: categoriesData, loading: categoriesLoading } = useCategories();
  const { authors: authorsData, loading: authorsLoading } = useAuthors();
  
  // Get author and category names for display in active filters
  const selectedAuthorName = useMemo(() => {
    if (!selectedAuthor || !authorsData) return '';
    const author = authorsData.find((a: any) => a.id === selectedAuthor);
    return author ? author.name : selectedAuthor;
  }, [selectedAuthor, authorsData]);
  
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory || !categoriesData) return '';
    const category = categoriesData.find((c: any) => c.id === selectedCategory);
    return category ? category.name.en : selectedCategory;
  }, [selectedCategory, categoriesData]);


  // Toggle story content language (not page interface)
  const handleStoryLanguageToggle = () => {
    setStoryLanguage(storyLanguage === 'en' ? 'tr' : 'en');
  };

  // Search handler - now just updates state, API call is handled by useStories hook
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Category filter handler - now just updates state, API call is handled by useStories hook  
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Prepare categories for dropdown (interface always English)
  const categories = useMemo(() => [
    { id: '', name: 'All Categories' },
    ...(categoriesData?.map(cat => ({
      id: cat.id,
      name: cat.name.en || 'Unknown Category'
    })) || [])
  ], [categoriesData]);

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Page Header */}
      <section className="container space-y-6 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">
                Stories
              </h1>
              <p className="text-gray-600">
                Discover engaging bilingual stories for language learning
              </p>
            </div>
            
            {/* Story Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleStoryLanguageToggle}
              className="w-fit"
              title="Change story display language"
            >
              {storyLanguage === 'en' ? '🇹🇷 Turkish Stories' : '🇺🇸 English Stories'}
            </Button>
          </div>

          {/* Advanced Search Component */}
          <AdvancedSearch
            onSearch={(searchFilters) => {
              setSearchQuery(searchFilters.search || '');
              setSelectedCategory(searchFilters.categoryId || '');
              setSelectedAuthor(searchFilters.authorId || '');
              setSelectedTag(searchFilters.tagId || '');
              setMinRating(searchFilters.minRating || 0);
              
              // Map AdvancedSearch sort values to backend API values
              const mapSortBy = (frontendSort: string) => {
                switch (frontendSort) {
                  case 'newest': return 'publishedAt';
                  case 'oldest': return 'publishedAt';
                  case 'rating': return 'averageRating';
                  case 'title': return 'title';
                  default: return 'publishedAt';
                }
              };
              
              const mapSortOrder = (frontendSort: string) => {
                switch (frontendSort) {
                  case 'newest': return 'desc';
                  case 'oldest': return 'asc';
                  case 'rating': return 'desc';
                  case 'title': return 'asc';
                  default: return 'desc';
                }
              };
              
              setSortBy(mapSortBy(searchFilters.sortBy || 'newest'));
              setSortOrder(mapSortOrder(searchFilters.sortBy || 'newest'));
            }}
            onClear={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedAuthor('');
              setSelectedTag('');
              setMinRating(0);
              setSortBy('publishedAt');
              setSortOrder('desc');
            }}
            initialFilters={{
              search: searchQuery,
              categoryId: selectedCategory,
              authorId: selectedAuthor,
              tagId: selectedTag,
              minRating,
              sortBy,
              sortOrder,
              language: storyLanguage
            }}
          />

        </div>

        {/* Stories List */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">
              Failed to load stories. Please try again later.
            </p>
          </div>
        ) : (
          <StoryList
            key={`${selectedAuthor}-${selectedCategory}-${searchQuery}`}
            stories={stories}
            language={storyLanguage}
            loading={loading}
            searchTerm={searchQuery}
            emptyMessage={
              searchQuery 
                ? 'No stories found matching your search.'
                : 'No stories available.'
            }
          />
        )}
      </section>
    </div>
  );
}