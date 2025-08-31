'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus,
  Search,
  Edit3,
  Eye,
  Trash2,
  BookOpen,
  Calendar,
  Filter,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Archive
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { StoryEditorForm } from '@/components/editor/StoryEditorForm';
import { StoryPreview } from '@/components/editor/StoryPreview';
import { useCategories } from '@/hooks/useCategories';
import { useAuthors } from '@/hooks/useAuthors';
import { useTags } from '@/hooks/useTags';

interface Story {
  id: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  authors: Array<{
    author: {
      id: string;
      name: string;
    };
    role: string;
  }>;
  categories: Array<{
    category: {
      id: string;
      name: Record<string, string>;
    };
  }>;
  _count?: {
    UserStoryRating: number;
  };
  averageRating?: number;
}

type ViewMode = 'list' | 'edit' | 'preview';

export default function EditorPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingStoryId, setEditingStoryId] = useState<string | undefined>();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load data for editor form
  const { categories } = useCategories();
  const { authors } = useAuthors();
  const { tags } = useTags();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has editor/admin role
    if (user && !['editor', 'admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Load stories
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    fetchStories();
  }, [isAuthenticated, user]);

  // Handle URL parameters
  useEffect(() => {
    const action = searchParams.get('action');
    const storyId = searchParams.get('id');

    if (action === 'new') {
      setViewMode('edit');
      setEditingStoryId(undefined);
    } else if (action === 'edit' && storyId) {
      setViewMode('edit');
      setEditingStoryId(storyId);
    } else if (action === 'preview' && storyId) {
      setViewMode('preview');
      setEditingStoryId(storyId);
    } else {
      setViewMode('list');
      setEditingStoryId(undefined);
    }
  }, [searchParams]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/stories?author=mine', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/editor?action=new');
  };

  const handleEdit = (storyId: string) => {
    router.push(`/editor?action=edit&id=${storyId}`);
  };

  const handlePreview = (storyId: string) => {
    router.push(`/editor?action=preview&id=${storyId}`);
  };

  const handleBackToList = () => {
    router.push('/editor');
    fetchStories(); // Refresh the list
  };

  const handleDelete = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        setStories(prev => prev.filter(story => story.id !== storyId));
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = 
      story.title.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.title.tr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.shortDescription.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.shortDescription.tr?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!['editor', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You need editor or admin privileges to access this page.
            </p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
          </div>

          <StoryEditorForm
            storyId={editingStoryId}
            onSave={handleBackToList}
            onPublish={handleBackToList}
            onCancel={handleBackToList}
          />
        </div>
      </div>
    );
  }

  if (viewMode === 'preview' && editingStoryId) {
    const story = stories.find(s => s.id === editingStoryId);
    
    if (!story) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
            <Button onClick={handleBackToList}>Back to Stories</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
          </div>

          <StoryPreview
            story={story}
            categories={categories}
            tags={tags}
            authors={authors}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Story Editor</h1>
              <p className="text-gray-600 mt-2">Create and manage your stories</p>
            </div>
            
            <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Story
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stories List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading stories...</span>
          </div>
        ) : filteredStories.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No stories found' : 'No stories yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first story'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Story
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStories.map((story) => (
              <Card key={story.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {story.title.en || story.title.tr || 'Untitled Story'}
                        </h3>
                        <Badge className={getStatusColor(story.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(story.status)}
                            <span>{story.status.charAt(0).toUpperCase() + story.status.slice(1)}</span>
                          </div>
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {story.shortDescription.en || story.shortDescription.tr || 'No description'}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Updated {new Date(story.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {story.authors.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>by</span>
                            <span className="font-medium">
                              {story.authors.map(a => a.author.name).join(', ')}
                            </span>
                          </div>
                        )}

                        {story._count?.UserStoryRating && story._count.UserStoryRating > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>{story._count.UserStoryRating} rating{story._count.UserStoryRating !== 1 ? 's' : ''}</span>
                            {story.averageRating && (
                              <span>({story.averageRating.toFixed(1)}★)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Categories */}
                      {story.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {story.categories.map(({ category }) => (
                            <Badge key={category.id} variant="outline" className="text-xs">
                              {category.name.en || category.name.tr}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(story.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(story.id)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(story.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {filteredStories.length > 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stories.filter(s => s.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-600">Drafts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stories.filter(s => s.status === 'published').length}
                  </div>
                  <div className="text-sm text-gray-600">Published</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {stories.filter(s => s.status === 'archived').length}
                  </div>
                  <div className="text-sm text-gray-600">Archived</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stories.reduce((sum, s) => sum + (s._count?.UserStoryRating || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Ratings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}