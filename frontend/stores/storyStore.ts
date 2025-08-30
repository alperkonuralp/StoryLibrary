import { create } from 'zustand';

export type Language = 'en' | 'tr';
export type DisplayMode = 'english' | 'turkish' | 'bilingual';

export interface Story {
  id: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  slug: string;
  content: Record<string, string[]>;
  status: 'DRAFT' | 'PUBLISHED';
  statistics?: Record<string, any>;
  editorRating?: number;
  averageRating?: number;
  ratingCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  categories?: any[];
  tags?: any[];
  authors?: any[];
  series?: any[];
  creator?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface StoryFilters {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  seriesId?: string;
  language?: Language;
  status?: 'DRAFT' | 'PUBLISHED';
}

interface StoryState {
  // Current story being read
  currentStory: Story | null;
  isLoadingStory: boolean;
  
  // Story list and filters
  stories: Story[];
  isLoadingStories: boolean;
  totalStories: number;
  currentPage: number;
  totalPages: number;
  filters: StoryFilters;
  
  // Reading preferences
  displayMode: DisplayMode;
  preferredLanguage: Language;
  fontSize: 'small' | 'medium' | 'large';
  
  // Reading progress
  currentParagraph: number;
  readingProgress: number; // percentage
  
  // Actions
  setCurrentStory: (story: Story | null) => void;
  setStoryLoading: (loading: boolean) => void;
  
  setStories: (stories: Story[], totalStories: number, currentPage: number, totalPages: number) => void;
  setStoriesLoading: (loading: boolean) => void;
  updateFilters: (filters: Partial<StoryFilters>) => void;
  resetFilters: () => void;
  
  // Reading actions
  setDisplayMode: (mode: DisplayMode) => void;
  setPreferredLanguage: (language: Language) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  setCurrentParagraph: (paragraph: number) => void;
  setReadingProgress: (progress: number) => void;
  
  // Utilities
  getStoryTitle: (story: Story | null, language?: Language) => string;
  getStoryContent: (story: Story | null, language?: Language) => string[];
}

const defaultFilters: StoryFilters = {
  page: 1,
  limit: 20,
  status: 'PUBLISHED'
};

export const useStoryStore = create<StoryState>()((set, get) => ({
  // Current story
  currentStory: null,
  isLoadingStory: false,
  
  // Story list
  stories: [],
  isLoadingStories: false,
  totalStories: 0,
  currentPage: 1,
  totalPages: 1,
  filters: defaultFilters,
  
  // Reading preferences (persisted in localStorage separately)
  displayMode: 'bilingual',
  preferredLanguage: 'en',
  fontSize: 'medium',
  
  // Reading progress
  currentParagraph: 0,
  readingProgress: 0,
  
  // Story actions
  setCurrentStory: (story) => set({ currentStory: story }),
  setStoryLoading: (isLoadingStory) => set({ isLoadingStory }),
  
  setStories: (stories, totalStories, currentPage, totalPages) => 
    set({ stories, totalStories, currentPage, totalPages }),
  
  setStoriesLoading: (isLoadingStories) => set({ isLoadingStories }),
  
  updateFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters }
    })),
  
  resetFilters: () => set({ filters: defaultFilters }),
  
  // Reading preference actions
  setDisplayMode: (displayMode) => {
    set({ displayMode });
    if (typeof window !== 'undefined') {
      localStorage.setItem('story-display-mode', displayMode);
    }
  },
  
  setPreferredLanguage: (preferredLanguage) => {
    set({ preferredLanguage });
    if (typeof window !== 'undefined') {
      localStorage.setItem('story-preferred-language', preferredLanguage);
    }
  },
  
  setFontSize: (fontSize) => {
    set({ fontSize });
    if (typeof window !== 'undefined') {
      localStorage.setItem('story-font-size', fontSize);
    }
  },
  
  // Reading progress actions
  setCurrentParagraph: (currentParagraph) => set({ currentParagraph }),
  setReadingProgress: (readingProgress) => set({ readingProgress }),
  
  // Utility functions
  getStoryTitle: (story, language) => {
    if (!story) return '';
    const lang = language || get().preferredLanguage;
    return story.title[lang] || story.title['en'] || story.title['tr'] || Object.values(story.title)[0] || '';
  },
  
  getStoryContent: (story, language) => {
    if (!story) return [];
    const lang = language || get().preferredLanguage;
    return story.content[lang] || story.content['en'] || story.content['tr'] || Object.values(story.content)[0] || [];
  }
}));

// Initialize reading preferences from localStorage
if (typeof window !== 'undefined') {
  const savedDisplayMode = localStorage.getItem('story-display-mode') as DisplayMode;
  const savedLanguage = localStorage.getItem('story-preferred-language') as Language;
  const savedFontSize = localStorage.getItem('story-font-size') as 'small' | 'medium' | 'large';
  
  if (savedDisplayMode) {
    useStoryStore.setState({ displayMode: savedDisplayMode });
  }
  
  if (savedLanguage) {
    useStoryStore.setState({ preferredLanguage: savedLanguage });
  }
  
  if (savedFontSize) {
    useStoryStore.setState({ fontSize: savedFontSize });
  }
}