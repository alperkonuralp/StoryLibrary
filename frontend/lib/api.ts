import type { Story, Category, Author, Tag, Series, ApiResponse, PaginationInfo, StoryFilters } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.headers,
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  clearAuthToken() {
    const { Authorization, ...headersWithoutAuth } = this.headers as any;
    this.headers = headersWithoutAuth;
  }

  // Story methods
  async getStories(filters?: StoryFilters): Promise<ApiResponse<{ stories: Story[]; pagination: PaginationInfo }>> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.tagId) params.append('tagId', filters.tagId);
    if (filters?.authorId) params.append('authorId', filters.authorId);
    if (filters?.language) params.append('language', filters.language);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const endpoint = `/stories${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ stories: Story[]; pagination: PaginationInfo }>(endpoint);
  }

  async getStory(id: string): Promise<ApiResponse<Story>> {
    return this.request<Story>(`/stories/${id}`);
  }

  async getStoryBySlug(slug: string): Promise<ApiResponse<Story>> {
    return this.request<Story>(`/stories/slug/${slug}`);
  }

  async createStory(storyData: Partial<Story>): Promise<ApiResponse<Story>> {
    return this.request<Story>('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  async updateStory(id: string, storyData: Partial<Story>): Promise<ApiResponse<Story>> {
    return this.request<Story>(`/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(storyData),
    });
  }

  async deleteStory(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/stories/${id}`, {
      method: 'DELETE',
    });
  }

  async publishStory(id: string): Promise<ApiResponse<Story>> {
    return this.request<Story>(`/stories/${id}/publish`, {
      method: 'PATCH',
    });
  }

  async unpublishStory(id: string): Promise<ApiResponse<Story>> {
    return this.request<Story>(`/stories/${id}/unpublish`, {
      method: 'PATCH',
    });
  }

  async rateStory(storyId: string, rating: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/stories/${storyId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  // Category methods
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/categories');
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/categories/${id}`);
  }

  async createCategory(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Author methods
  async getAuthors(): Promise<ApiResponse<Author[]>> {
    return this.request<Author[]>('/authors');
  }

  async getAuthor(id: string): Promise<ApiResponse<Author>> {
    return this.request<Author>(`/authors/${id}`);
  }

  async createAuthor(authorData: Partial<Author>): Promise<ApiResponse<Author>> {
    return this.request<Author>('/authors', {
      method: 'POST',
      body: JSON.stringify(authorData),
    });
  }

  async updateAuthor(id: string, authorData: Partial<Author>): Promise<ApiResponse<Author>> {
    return this.request<Author>(`/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(authorData),
    });
  }

  async deleteAuthor(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/authors/${id}`, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string; user: any }>> {
    return this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, username?: string): Promise<ApiResponse<{ accessToken: string; user: any }>> {
    return this.request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
  }

  async getMe(): Promise<ApiResponse<{ user: any }>> {
    return this.request<{ user: any }>('/auth/me');
  }

  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/users');
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Tag methods
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.request<Tag[]>('/tags');
  }

  async getTag(id: string): Promise<ApiResponse<Tag>> {
    return this.request<Tag>(`/tags/${id}`);
  }

  async createTag(tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return this.request<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  }

  async updateTag(id: string, tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return this.request<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tagData),
    });
  }

  async deleteTag(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Series methods
  async getSeries(): Promise<ApiResponse<Series[]>> {
    return this.request<Series[]>('/series');
  }

  async getSeriesById(id: string): Promise<ApiResponse<Series>> {
    return this.request<Series>(`/series/${id}`);
  }

  async createSeries(seriesData: Partial<Series>): Promise<ApiResponse<Series>> {
    return this.request<Series>('/series', {
      method: 'POST',
      body: JSON.stringify(seriesData),
    });
  }

  async updateSeries(id: string, seriesData: Partial<Series>): Promise<ApiResponse<Series>> {
    return this.request<Series>(`/series/${id}`, {
      method: 'PUT',
      body: JSON.stringify(seriesData),
    });
  }

  async deleteSeries(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/series/${id}`, {
      method: 'DELETE',
    });
  }

  // Reading Progress methods
  async getProgress(storyId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/progress/${storyId}`);
  }

  async updateProgress(data: {
    storyId: string;
    lastParagraph?: number;
    status?: 'STARTED' | 'COMPLETED';
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllProgress(status?: 'STARTED' | 'COMPLETED'): Promise<ApiResponse<any[]>> {
    const params = status ? `?status=${status}` : '';
    return this.request<any[]>(`/progress${params}`);
  }

  async deleteProgress(storyId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/progress/${storyId}`, {
      method: 'DELETE',
    });
  }

  // Bookmark methods
  async getBookmarks(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/bookmarks');
  }

  async addBookmark(storyId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/bookmarks/${storyId}`, {
      method: 'POST',
    });
  }

  async removeBookmark(storyId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/bookmarks/${storyId}`, {
      method: 'DELETE',
    });
  }

  async checkBookmark(storyId: string): Promise<ApiResponse<{ isBookmarked: boolean; bookmark: any | null }>> {
    return this.request<{ isBookmarked: boolean; bookmark: any | null }>(`/bookmarks/${storyId}`);
  }

  // Admin methods

  async deleteStoryAdmin(storyId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/admin/stories/${storyId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();