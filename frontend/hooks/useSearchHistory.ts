import { useState, useEffect, useCallback } from 'react';

// Types
interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filters?: {
    categoryId?: string;
    authorId?: string;
    tagId?: string;
    minRating?: number;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    categoryId?: string;
    authorId?: string;
    tagId?: string;
    minRating?: number;
  };
  createdAt: number;
}

// Search history hook
export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }

      const savedSearchesData = localStorage.getItem('savedSearches');
      if (savedSearchesData) {
        setSavedSearches(JSON.parse(savedSearchesData));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Add search to history
  const addToHistory = useCallback((query: string, filters?: SearchHistoryItem['filters']) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      filters
    };

    setSearchHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== newItem.query.toLowerCase()
      );
      
      // Add to beginning and limit to 20 items
      const updated = [newItem, ...filtered].slice(0, 20);
      
      // Save to localStorage
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  // Remove specific item from history
  const removeFromHistory = useCallback((timestamp: number) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.timestamp !== timestamp);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Save current search
  const saveSearch = useCallback((name: string, query: string, filters: SavedSearch['filters']) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      query: query.trim(),
      filters,
      createdAt: Date.now()
    };

    setSavedSearches(prev => {
      const updated = [newSearch, ...prev].slice(0, 10); // Limit to 10 saved searches
      localStorage.setItem('savedSearches', JSON.stringify(updated));
      return updated;
    });

    return newSearch;
  }, []);

  // Delete saved search
  const deleteSavedSearch = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(search => search.id !== id);
      localStorage.setItem('savedSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get search suggestions based on history
  const getSearchSuggestions = useCallback((currentQuery: string, limit = 5): string[] => {
    if (!currentQuery.trim() || currentQuery.length < 2) {
      return [];
    }

    const query = currentQuery.toLowerCase();
    
    return searchHistory
      .filter(item => 
        item.query.toLowerCase().includes(query) &&
        item.query.toLowerCase() !== query
      )
      .map(item => item.query)
      .slice(0, limit);
  }, [searchHistory]);

  // Get recent searches (without filters)
  const getRecentSearches = useCallback((limit = 5): string[] => {
    return searchHistory
      .slice(0, limit)
      .map(item => item.query);
  }, [searchHistory]);

  return {
    searchHistory,
    savedSearches,
    addToHistory,
    clearHistory,
    removeFromHistory,
    saveSearch,
    deleteSavedSearch,
    getSearchSuggestions,
    getRecentSearches,
  };
};