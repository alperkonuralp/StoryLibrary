'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StoryList } from '@/components/story/StoryList';
import { LanguageToggle } from '@/components/story/StoryReader';
import Navigation from '@/components/Navigation';
import { BookOpen, Search, Filter } from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import { useCategories } from '@/hooks/useCategories';
import type { DisplayMode, StoryFilters } from '@/types';

export default function StoriesPage() {
  const [language, setLanguage] = useState<'en' | 'tr'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Create filters object for API calls
  const filters = useMemo((): StoryFilters => ({
    search: searchQuery || undefined,
    categoryId: selectedCategory || undefined,
    language,
    status: 'PUBLISHED',
    page: 1,
    limit: 20
  }), [searchQuery, selectedCategory, language]);

  // Fetch stories from API
  const { stories, loading, error, pagination } = useStories({ filters });
  
  // Fetch categories from API
  const { categories: categoriesData, loading: categoriesLoading } = useCategories();

  // Update display mode based on language selection
  const handleLanguageChange = (mode: DisplayMode) => {
    if (mode === 'turkish') setLanguage('tr');
    else if (mode === 'english') setLanguage('en');
    // For bilingual, we'll default to English for the interface
    else setLanguage('en');
  };

  // Search handler - now just updates state, API call is handled by useStories hook
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Category filter handler - now just updates state, API call is handled by useStories hook  
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Prepare categories for dropdown
  const categories = useMemo(() => [
    { id: '', name: language === 'en' ? 'All Categories' : 'Tüm Kategoriler' },
    ...(categoriesData?.map(cat => ({
      id: cat.id,
      name: cat.name[language] || cat.name.en || 'Unknown Category'
    })) || [])
  ], [categoriesData, language]);

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Page Header */}
      <section className="container space-y-6 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">
                {language === 'en' ? 'Stories' : 'Hikayeler'}
              </h1>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Discover engaging bilingual stories for language learning'
                  : 'Dil öğrenimi için ilgi çekici iki dilli hikayeleri keşfedin'
                }
              </p>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center space-x-2">
              <LanguageToggle 
                mode={language === 'en' ? 'english' : 'turkish'}
                onChange={handleLanguageChange}
              />
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search stories...' : 'Hikayelerde ara...'}
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
        </div>

        {/* Stories List */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">
              {language === 'en' 
                ? 'Failed to load stories. Please try again later.'
                : 'Hikayeler yüklenemedi. Lütfen daha sonra tekrar deneyin.'
              }
            </p>
          </div>
        ) : (
          <StoryList
            stories={stories}
            language={language}
            loading={loading}
            emptyMessage={
              searchQuery 
                ? (language === 'en' ? 'No stories found matching your search.' : 'Aramanızla eşleşen hikaye bulunamadı.')
                : (language === 'en' ? 'No stories available.' : 'Mevcut hikaye yok.')
            }
          />
        )}
      </section>
    </div>
  );
}