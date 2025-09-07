'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { StoryList } from '@/components/story/StoryList';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useStories } from '@/hooks/useStories';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import type { StoryFilters } from '@/types';

export default function StoriesPage() {
  const searchParams = useSearchParams();
  const [storyLanguage, setStoryLanguage] = useState<'en' | 'tr'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'title'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Create filters object for API calls
  const filters = useMemo((): StoryFilters => {
    // Map sortBy values from AdvancedSearch to API values
    const apiSortBy = sortBy === 'newest' ? 'publishedAt' : 
                      sortBy === 'oldest' ? 'publishedAt' :
                      sortBy === 'rating' ? 'averageRating' : 'title';
    const apiSortOrder = sortBy === 'oldest' ? 'asc' : sortOrder;
    
    const filterObj: StoryFilters = {
      sortBy: apiSortBy,
      sortOrder: apiSortOrder,
      language: storyLanguage,
      status: 'PUBLISHED' as const,
      page: 1,
      limit: 20
    };
    
    // Only add optional properties if they have values
    if (searchQuery) filterObj.search = searchQuery;
    if (selectedCategory) filterObj.categoryId = selectedCategory;
    if (selectedAuthor) filterObj.authorId = selectedAuthor;
    if (selectedTag) filterObj.tagId = selectedTag;
    if (minRating > 0) filterObj.minRating = minRating;
    
    return filterObj;
  }, [searchQuery, selectedCategory, selectedAuthor, selectedTag, minRating, sortBy, sortOrder, storyLanguage]);

  // Fetch stories from API
  const { stories, loading, error } = useStories({ filters });
  
  // Read URL parameters and update state
  useEffect(() => {
    const categoryId = searchParams.get('categoryId') || '';
    const authorId = searchParams.get('authorId') || '';
    
    
    setSelectedCategory(categoryId);
    setSelectedAuthor(authorId);
    setSearchQuery(''); // Clear search when coming from URL
  }, [searchParams]);
  
  


  // Toggle story content language (not page interface)
  const handleStoryLanguageToggle = () => {
    setStoryLanguage(storyLanguage === 'en' ? 'tr' : 'en');
  };




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
              
              setSortBy(searchFilters.sortBy || 'newest');
              setSortOrder(searchFilters.sortBy === 'oldest' ? 'asc' : 'desc');
            }}
            onClear={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedAuthor('');
              setSelectedTag('');
              setMinRating(0);
              setSortBy('newest');
              setSortOrder('desc');
            }}
            initialFilters={{
              search: searchQuery,
              categoryId: selectedCategory,
              authorId: selectedAuthor,
              tagId: selectedTag,
              minRating,
              sortBy,
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
            stories={stories as any}
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