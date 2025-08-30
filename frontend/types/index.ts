// Language types
export type Language = 'en' | 'tr';
export type MultilingualContent = Record<Language, string>;
export type MultilingualContentArray = Record<Language, string[]>;

// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Story types
export interface Story {
  id: string;
  title: MultilingualContent;
  shortDescription: MultilingualContent;
  slug: string;
  content: MultilingualContentArray;
  status: 'DRAFT' | 'PUBLISHED';
  sourceInfo?: {
    siteName?: string;
    originalUrl?: string;
    scrapedAt?: string;
    translator?: string;
  };
  statistics?: {
    wordCount: Record<Language, number>;
    charCount: Record<Language, number>;
    estimatedReadingTime: Record<Language, number>;
  };
  editorRating?: number;
  averageRating?: number;
  ratingCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy: string;
  creator: User;
  authors: StoryAuthor[];
  categories: StoryCategory[];
  tags: StoryTag[];
  series: StorySeries[];
  ratings: UserStoryRating[];
  progress: UserReadingProgress[];
}

// Author types
export interface Author {
  id: string;
  name: string;
  bio?: MultilingualContent;
  slug: string;
  createdAt: string;
  stories: StoryAuthor[];
}

// Category types
export interface Category {
  id: string;
  name: MultilingualContent;
  description?: MultilingualContent;
  slug: string;
  createdAt: string;
  stories: StoryCategory[];
}

// Tag types
export interface Tag {
  id: string;
  name: MultilingualContent;
  slug: string;
  color?: string;
  createdAt: string;
  stories: StoryTag[];
}

// Series types
export interface Series {
  id: string;
  name: MultilingualContent;
  description?: MultilingualContent;
  slug: string;
  createdAt: string;
  stories: StorySeries[];
}

// Relation types
export interface StoryAuthor {
  storyId: string;
  authorId: string;
  role: 'author' | 'co-author' | 'translator';
  story: Story;
  author: Author;
}

export interface StoryCategory {
  storyId: string;
  categoryId: string;
  story: Story;
  category: Category;
}

export interface StoryTag {
  storyId: string;
  tagId: string;
  story: Story;
  tag: Tag;
}

export interface StorySeries {
  storyId: string;
  seriesId: string;
  orderInSeries: number;
  story: Story;
  series: Series;
}

// Rating types
export interface UserStoryRating {
  id: string;
  userId: string;
  storyId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  story: Story;
}

// Progress types
export interface UserReadingProgress {
  id: string;
  userId: string;
  storyId: string;
  status: 'STARTED' | 'COMPLETED';
  lastParagraph?: number;
  startedAt: string;
  completedAt?: string;
  user: User;
  story: Story;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filter types
export interface StoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  seriesId?: string;
  language?: Language;
  status?: 'DRAFT' | 'PUBLISHED';
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

export interface StoryForm {
  title: MultilingualContent;
  shortDescription: MultilingualContent;
  content: MultilingualContentArray;
  categoryIds?: string[];
  tagIds?: string[];
  authorIds?: Array<{
    id: string;
    role: 'author' | 'co-author' | 'translator';
  }>;
  seriesId?: string;
  orderInSeries?: number;
}

export interface CategoryForm {
  name: MultilingualContent;
  description?: MultilingualContent;
}

export interface TagForm {
  name: MultilingualContent;
  color?: string;
}

export interface AuthorForm {
  name: string;
  bio?: MultilingualContent;
}

export interface SeriesForm {
  name: MultilingualContent;
  description?: MultilingualContent;
}

// UI Component types
export type DisplayMode = 'english' | 'turkish' | 'bilingual';

export interface StoryReaderProps {
  story: Story;
  initialMode?: DisplayMode;
  onProgressUpdate?: (paragraph: number) => void;
  onComplete?: () => void;
}

export interface LanguageToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export interface StoryCardProps {
  story: Story;
  showActions?: boolean;
  compact?: boolean;
}

export interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ProgressBarProps {
  value: number;
  max: number;
  showText?: boolean;
  className?: string;
}

// Search types
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions?: string[];
}

export interface SearchOptions {
  query: string;
  type?: 'stories' | 'authors' | 'categories' | 'tags';
  languages?: Language[];
  limit?: number;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Storage types
export interface LocalStorageData {
  theme: Theme;
  language: Language;
  readingMode: DisplayMode;
  readingProgress: Record<string, number>;
  completedStories: string[];
}

// Error types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SidebarNavItem extends NavItem {
  items?: SidebarNavItem[];
}

// Dashboard types
export interface DashboardStats {
  totalStories: number;
  publishedStories: number;
  draftStories: number;
  totalUsers: number;
  totalViews: number;
  averageRating: number;
}

export interface StoryStats {
  views: number;
  ratings: number;
  averageRating: number;
  completions: number;
  bookmarks: number;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}