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
import type { DisplayMode, StoryFilters } from '@/types';

export default function StoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [storyLanguage, setStoryLanguage] = useState<'en' | 'tr'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');

  // Create filters object for API calls
  const filters = useMemo((): StoryFilters => {
    const filterObj = {
      search: searchQuery || undefined,
      categoryId: selectedCategory || undefined,
      authorId: selectedAuthor || undefined,
      language: storyLanguage,
      status: 'PUBLISHED' as const,
      page: 1,
      limit: 20
    };
    return filterObj;
  }, [searchQuery, selectedCategory, selectedAuthor, storyLanguage]);

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

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory || selectedAuthor || searchQuery) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                Active filters:
              </span>
              {selectedCategory && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {selectedCategoryName}
                  <button 
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedAuthor && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {selectedAuthorName}
                  <button 
                    onClick={() => setSelectedAuthor('')}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
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