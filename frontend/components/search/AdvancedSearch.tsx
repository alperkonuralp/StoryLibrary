'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Star,
  Calendar,
  BookOpen,
  User,
  Tag,
  Folder
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useAuthors } from '@/hooks/useAuthors';
import { useTags } from '@/hooks/useTags';

interface SearchFilters {
  search: string;
  categoryId: string;
  authorId: string;
  tagId: string;
  minRating: number;
  language: 'en' | 'tr';
  sortBy: 'newest' | 'oldest' | 'rating' | 'title';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  initialFilters?: Partial<SearchFilters>;
  className?: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  search: '',
  categoryId: '',
  authorId: '',
  tagId: '',
  minRating: 0,
  language: 'en',
  sortBy: 'newest'
};

export function AdvancedSearch({ 
  onSearch, 
  onClear, 
  initialFilters = {}, 
  className = '' 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const { categories, loading: categoriesLoading } = useCategories();
  const { authors, loading: authorsLoading } = useAuthors();
  const { tags, loading: tagsLoading } = useTags();

  // Search suggestions based on input
  useEffect(() => {
    if (filters.search.length > 2) {
      const suggestions = [
        // Sample suggestions - in a real app, these would come from API
        'adventure',
        'technology',
        'business',
        'love story',
        'mystery',
        'science fiction'
      ].filter(s => s.toLowerCase().includes(filters.search.toLowerCase()))
       .slice(0, 5);
      
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [filters.search]);

  const handleFilterChange = <K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Auto-search for basic filters
    if (key === 'search' || key === 'categoryId' || key === 'authorId') {
      onSearch(newFilters);
    }
  };

  const handleAdvancedSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setShowAdvanced(false);
    onClear();
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const filterKey = key as keyof SearchFilters;
    return filters[filterKey] !== DEFAULT_FILTERS[filterKey];
  });

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const filterKey = key as keyof SearchFilters;
    return filters[filterKey] !== DEFAULT_FILTERS[filterKey];
  }).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input with Suggestions */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search stories, authors, categories..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 pr-4"
          />
          
          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-10 mt-1">
              <CardContent className="p-2">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleFilterChange('search', suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <select
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
          >
            <option value="">All Categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.en || category.name.tr}
              </option>
            ))}
          </select>

          <select
            value={filters.authorId}
            onChange={(e) => handleFilterChange('authorId', e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
          >
            <option value="">All Authors</option>
            {authors?.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 hover:bg-gray-300 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.categoryId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {categories?.find(c => c.id === filters.categoryId)?.name.en}
              <button
                onClick={() => handleFilterChange('categoryId', '')}
                className="ml-1 hover:bg-gray-300 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.authorId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {authors?.find(a => a.id === filters.authorId)?.name}
              <button
                onClick={() => handleFilterChange('authorId', '')}
                className="ml-1 hover:bg-gray-300 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Tags
                </label>
                <select
                  value={filters.tagId}
                  onChange={(e) => handleFilterChange('tagId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All Tags</option>
                  {tags?.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name.en || tag.name.tr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Star className="inline h-4 w-4 mr-1" />
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Any Rating</option>
                  <option value={1}>1+ Stars</option>
                  <option value={2}>2+ Stars</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={5}>5 Stars Only</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={handleClear}>
                Clear All Filters
              </Button>
              <Button onClick={handleAdvancedSearch}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdvancedSearch;