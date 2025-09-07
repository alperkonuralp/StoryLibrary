'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Users, FolderOpen, Tag, BarChart3, Plus, Settings, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStories } from '@/hooks/useStories';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useUsers } from '@/hooks/useUsers';
import { useAuthors } from '@/hooks/useAuthors';
import { useSeries } from '@/hooks/useSeries';
import { useAnalytics } from '@/hooks/useAnalytics';
import Navigation from '@/components/Navigation';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { EditCategoryDialog } from '@/components/admin/EditCategoryDialog';
import { EditTagDialog } from '@/components/admin/EditTagDialog';
import { EditAuthorDialog } from '@/components/admin/EditAuthorDialog';
import { EditSeriesDialog } from '@/components/admin/EditSeriesDialog';
import { apiClient } from '@/lib/api';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'stories' | 'users' | 'categories' | 'authors' | 'series' | 'tags'>('overview');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingStory, setDeletingStory] = useState<string | null>(null);
  const [publishingStory, setPublishingStory] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);
  const [deletingAuthor, setDeletingAuthor] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [deletingSeries, setDeletingSeries] = useState<string | null>(null);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Fetch real data for admin dashboard
  const { stories, loading: storiesLoading, refetch: refetchStories } = useStories({ 
    filters: { limit: 100 } // Get all stories regardless of status
  });
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { tags, loading: tagsLoading, refetch: refetchTags } = useTags();
  const { users, loading: usersLoading, refetch: refetchUsers } = useUsers();
  const { authors, loading: authorsLoading, refetch: refetchAuthors } = useAuthors();
  const { series, loading: seriesLoading, refetch: refetchSeries } = useSeries();
  const { analytics, loading: analyticsLoading } = useAnalytics();

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (editingUser) {
        await apiClient.updateUser(editingUser.id, userData);
        refetchUsers(); // Refresh the users list
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingStory(storyId);
      const response = await apiClient.deleteStory(storyId);
      
      if (response.success) {
        alert('Story deleted successfully!');
        refetchStories();
      } else {
        throw new Error(response.error?.message || 'Failed to delete story');
      }
    } catch (error: any) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story: ' + error.message);
    } finally {
      setDeletingStory(null);
    }
  };

  const handleTogglePublish = async (storyId: string, currentStatus: 'DRAFT' | 'PUBLISHED') => {
    const action = currentStatus === 'PUBLISHED' ? 'unpublish' : 'publish';
    
    if (!confirm(`Are you sure you want to ${action} this story?`)) {
      return;
    }

    try {
      setPublishingStory(storyId);
      const response = currentStatus === 'PUBLISHED' 
        ? await apiClient.unpublishStory(storyId)
        : await apiClient.publishStory(storyId);
      
      if (response.success) {
        alert(`Story ${action}ed successfully!`);
        refetchStories();
      } else {
        throw new Error(response.error?.message || `Failed to ${action} story`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing story:`, error);
      alert(`Failed to ${action} story: ` + error.message);
    } finally {
      setPublishingStory(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingUser(userId);
      // Using the admin API endpoint for user deletion
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('User deleted successfully!');
        refetchUsers();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    } finally {
      setDeletingUser(null);
    }
  };

  // Filter users based on search
  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  // Category management functions
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (categoryData: any) => {
    try {
      if (editingCategory) {
        await apiClient.updateCategory(editingCategory.id, categoryData);
        alert('Category updated successfully!');
      } else {
        await apiClient.createCategory(categoryData);
        alert('Category created successfully!');
      }
      refetchCategories();
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert('Failed to save category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingCategory(categoryId);
      const response = await apiClient.deleteCategory(categoryId);
      
      if (response.success) {
        alert('Category deleted successfully!');
        refetchCategories();
      } else {
        throw new Error(response.error?.message || 'Failed to delete category');
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category: ' + error.message);
    } finally {
      setDeletingCategory(null);
    }
  };

  // Tag management functions
  const handleEditTag = (tag: any) => {
    setEditingTag(tag);
    setIsTagDialogOpen(true);
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    setIsTagDialogOpen(true);
  };

  const handleSaveTag = async (tagData: any) => {
    try {
      if (editingTag) {
        await apiClient.updateTag(editingTag.id, tagData);
        alert('Tag updated successfully!');
      } else {
        await apiClient.createTag(tagData);
        alert('Tag created successfully!');
      }
      refetchTags();
      setIsTagDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving tag:', error);
      alert('Failed to save tag: ' + error.message);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete tag "${tagName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingTag(tagId);
      const response = await apiClient.deleteTag(tagId);
      
      if (response.success) {
        alert('Tag deleted successfully!');
        refetchTags();
      } else {
        throw new Error(response.error?.message || 'Failed to delete tag');
      }
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag: ' + error.message);
    } finally {
      setDeletingTag(null);
    }
  };

  // Author management functions
  const handleEditAuthor = (author: any) => {
    setEditingAuthor(author);
    setIsAuthorDialogOpen(true);
  };

  const handleCreateAuthor = () => {
    setEditingAuthor(null);
    setIsAuthorDialogOpen(true);
  };

  const handleSaveAuthor = async (authorData: any) => {
    try {
      if (editingAuthor) {
        await apiClient.updateAuthor(editingAuthor.id, authorData);
        alert('Author updated successfully!');
      } else {
        await apiClient.createAuthor(authorData);
        alert('Author created successfully!');
      }
      refetchAuthors();
      setIsAuthorDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving author:', error);
      alert('Failed to save author: ' + error.message);
    }
  };

  const handleDeleteAuthor = async (authorId: string, authorName: string) => {
    if (!confirm(`Are you sure you want to delete author "${authorName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAuthor(authorId);
      const response = await apiClient.deleteAuthor(authorId);
      
      if (response.success) {
        alert('Author deleted successfully!');
        refetchAuthors();
      } else {
        throw new Error(response.error?.message || 'Failed to delete author');
      }
    } catch (error: any) {
      console.error('Error deleting author:', error);
      alert('Failed to delete author: ' + error.message);
    } finally {
      setDeletingAuthor(null);
    }
  };

  // Series management functions
  const handleEditSeries = (series: any) => {
    setEditingSeries(series);
    setIsSeriesDialogOpen(true);
  };

  const handleCreateSeries = () => {
    setEditingSeries(null);
    setIsSeriesDialogOpen(true);
  };

  const handleSaveSeries = async (seriesData: any) => {
    try {
      if (editingSeries) {
        await apiClient.updateSeries(editingSeries.id, seriesData);
        alert('Series updated successfully!');
      } else {
        await apiClient.createSeries(seriesData);
        alert('Series created successfully!');
      }
      refetchSeries();
      setIsSeriesDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving series:', error);
      alert('Failed to save series: ' + error.message);
    }
  };

  const handleDeleteSeries = async (seriesId: string, seriesName: string) => {
    if (!confirm(`Are you sure you want to delete series "${seriesName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingSeries(seriesId);
      const response = await apiClient.deleteSeries(seriesId);
      
      if (response.success) {
        alert('Series deleted successfully!');
        refetchSeries();
      } else {
        throw new Error(response.error?.message || 'Failed to delete series');
      }
    } catch (error: any) {
      console.error('Error deleting series:', error);
      alert('Failed to delete series: ' + error.message);
    } finally {
      setDeletingSeries(null);
    }
  };

  // Bulk story operations
  const handleSelectStory = (storyId: string) => {
    setSelectedStories(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleSelectAllStories = () => {
    if (selectedStories.length === stories?.length) {
      setSelectedStories([]);
    } else {
      setSelectedStories(stories?.map(story => story.id) || []);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedStories.length === 0) return;
    
    const action = 'publish';
    if (!confirm(`Are you sure you want to ${action} ${selectedStories.length} selected stories?`)) {
      return;
    }

    setBulkOperationInProgress(true);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      for (const storyId of selectedStories) {
        try {
          const response = await apiClient.publishStory(storyId);
          if (response.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Story ${storyId}: ${response.error?.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Story ${storyId}: ${error.message}`);
        }
      }

      let message = `Bulk operation completed!\n`;
      message += `✅ ${results.success} stories published successfully\n`;
      if (results.failed > 0) {
        message += `❌ ${results.failed} stories failed\n`;
        if (results.errors.length > 0) {
          message += `\nErrors:\n${results.errors.slice(0, 5).join('\n')}`;
          if (results.errors.length > 5) {
            message += `\n...and ${results.errors.length - 5} more errors`;
          }
        }
      }

      alert(message);
      
      if (results.success > 0) {
        refetchStories();
        setSelectedStories([]);
      }
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedStories.length === 0) return;
    
    const action = 'unpublish';
    if (!confirm(`Are you sure you want to ${action} ${selectedStories.length} selected stories?`)) {
      return;
    }

    setBulkOperationInProgress(true);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      for (const storyId of selectedStories) {
        try {
          const response = await apiClient.unpublishStory(storyId);
          if (response.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Story ${storyId}: ${response.error?.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Story ${storyId}: ${error.message}`);
        }
      }

      let message = `Bulk operation completed!\n`;
      message += `✅ ${results.success} stories unpublished successfully\n`;
      if (results.failed > 0) {
        message += `❌ ${results.failed} stories failed\n`;
        if (results.errors.length > 0) {
          message += `\nErrors:\n${results.errors.slice(0, 5).join('\n')}`;
          if (results.errors.length > 5) {
            message += `\n...and ${results.errors.length - 5} more errors`;
          }
        }
      }

      alert(message);
      
      if (results.success > 0) {
        refetchStories();
        setSelectedStories([]);
      }
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStories.length === 0) return;
    
    if (!confirm(`⚠️ WARNING: This will permanently delete ${selectedStories.length} selected stories. This action cannot be undone!\n\nAre you absolutely sure you want to continue?`)) {
      return;
    }

    setBulkOperationInProgress(true);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      for (const storyId of selectedStories) {
        try {
          const response = await apiClient.deleteStory(storyId);
          if (response.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Story ${storyId}: ${response.error?.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Story ${storyId}: ${error.message}`);
        }
      }

      let message = `Bulk deletion completed!\n`;
      message += `✅ ${results.success} stories deleted successfully\n`;
      if (results.failed > 0) {
        message += `❌ ${results.failed} stories failed to delete\n`;
        if (results.errors.length > 0) {
          message += `\nErrors:\n${results.errors.slice(0, 5).join('\n')}`;
          if (results.errors.length > 5) {
            message += `\n...and ${results.errors.length - 5} more errors`;
          }
        }
      }

      alert(message);
      
      if (results.success > 0) {
        refetchStories();
        setSelectedStories([]);
      }
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  // Redirect if not authenticated or not admin
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your Story Library content and users</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('overview')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'stories' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('stories')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Stories
                </Button>
                <Button
                  variant={activeTab === 'categories' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('categories')}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Categories
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
                <Button
                  variant={activeTab === 'authors' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('authors')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Authors
                </Button>
                <Button
                  variant={activeTab === 'series' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('series')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Series
                </Button>
                <Button
                  variant={activeTab === 'tags' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('tags')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.overview.totalStories || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.publishedStories || 0} published, {analytics?.overview.draftStories || 0} drafts
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.overview.totalUsers || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.totalAuthors || 0} authors, {analytics?.userDistribution?.find((u: any) => u.role === 'ADMIN')?.count || 0} admin
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Content Items</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(analytics?.overview.totalCategories || 0) + (analytics?.overview.totalSeries || 0) + (analytics?.overview.totalTags || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.totalCategories || 0} categories, {analytics?.overview.totalSeries || 0} series
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.overview.averageRating || '0.0'}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.totalRatings || 0} ratings total
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity & Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Loading...</p>
                        </div>
                      ) : analytics?.recentActivity ? (
                        <div className="space-y-3">
                          {analytics.recentActivity.slice(0, 5).map((activity: any) => (
                            <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {activity.title?.en || activity.title?.tr || 'Untitled'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  by {activity.creator} • {new Date(activity.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={activity.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                {activity.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No recent activity</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Rated Stories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Loading...</p>
                        </div>
                      ) : analytics?.topRated ? (
                        <div className="space-y-3">
                          {analytics.topRated.slice(0, 5).map((story: any) => (
                            <div key={story.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {story.title?.en || story.title?.tr || 'Untitled'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {story.ratingCount} ratings
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="font-medium text-sm">{story.rating}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No rated stories</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button asChild className="h-16 flex flex-col space-y-2">
                        <Link href="/admin/stories/new">
                          <Plus className="h-5 w-5" />
                          <span>Create New Story</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-16 flex flex-col space-y-2" onClick={handleCreateCategory}>
                        <FolderOpen className="h-5 w-5" />
                        <span>Add Category</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex flex-col space-y-2" onClick={handleCreateAuthor}>
                        <Users className="h-5 w-5" />
                        <span>Add Author</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'stories' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Stories Management</CardTitle>
                  <Button asChild>
                    <Link href="/admin/stories/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Story
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {storiesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading stories...</p>
                    </div>
                  ) : stories && stories.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Total: {stories.length} stories
                          </div>
                          {selectedStories.length > 0 && (
                            <div className="text-sm font-medium text-blue-600">
                              {selectedStories.length} selected
                            </div>
                          )}
                        </div>
                        {selectedStories.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBulkPublish}
                              disabled={bulkOperationInProgress}
                            >
                              📤 Publish Selected
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBulkUnpublish}
                              disabled={bulkOperationInProgress}
                            >
                              📝 Unpublish Selected
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleBulkDelete}
                              disabled={bulkOperationInProgress}
                            >
                              🗑️ Delete Selected
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedStories([])}
                              disabled={bulkOperationInProgress}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Checkbox
                          checked={stories.length > 0 && selectedStories.length === stories.length}
                          onClick={handleSelectAllStories}
                          disabled={bulkOperationInProgress}
                        />
                        <label className="text-sm font-medium">
                          Select All ({stories.length} stories)
                        </label>
                      </div>
                      <div className="space-y-3">
                        {stories.map((story) => (
                          <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={selectedStories.includes(story.id)}
                                onClick={() => handleSelectStory(story.id)}
                                disabled={bulkOperationInProgress}
                              />
                              <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium">
                                  {story.title?.en || story.title?.tr || 'Untitled'}
                                </h4>
                                <Badge variant={story.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                  {story.status}
                                </Badge>
                                {story.categories?.map(cat => (
                                  <Badge key={cat.category.id} variant="outline">
                                    {cat.category.name?.en || cat.category.name?.tr}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {story.shortDescription?.en || story.shortDescription?.tr || 'No description'}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>By: {story.authors?.[0]?.author.name || 'Unknown'}</span>
                                <span>Rating: {story.averageRating ? Number(story.averageRating).toFixed(1) : 'N/A'}</span>
                                <span>Views: {(story as any).viewCount || 0}</span>
                              </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/stories/${story.slug}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/stories/${story.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleTogglePublish(story.id, story.status)}
                                disabled={publishingStory === story.id}
                                title={story.status === 'PUBLISHED' ? 'Unpublish story' : 'Publish story'}
                              >
                                {story.status === 'PUBLISHED' ? '📝' : '📤'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteStory(story.id)}
                                disabled={deletingStory === story.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Stories Found</h3>
                      <p className="text-gray-500 mb-4">
                        Start by creating your first bilingual story for language learners.
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Story
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'categories' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Categories Management</CardTitle>
                  <Button onClick={handleCreateCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Category
                  </Button>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading categories...</p>
                    </div>
                  ) : categories && categories.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Total: {categories.length} categories
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {category.name?.en || category.name?.tr || 'Untitled Category'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {category.description?.en || category.description?.tr || 'No description'}
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                Stories: {(category as any)._count?.stories || 0}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id, category.name.en || category.name.tr)}
                                disabled={deletingCategory === category.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
                      <p className="text-gray-500 mb-4">
                        Create categories to organize your stories.
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Category
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'tags' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tags Management</CardTitle>
                  <Button onClick={handleCreateTag}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Tag
                  </Button>
                </CardHeader>
                <CardContent>
                  {tagsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading tags...</p>
                    </div>
                  ) : tags && tags.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Total: {tags.length} tags
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tags.map((tag) => (
                          <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                                >
                                  {tag.name?.en || tag.name?.tr || 'Untitled Tag'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {tag.name?.en && tag.name?.tr && tag.name.en !== tag.name.tr
                                  ? `EN: ${tag.name.en} / TR: ${tag.name.tr}`
                                  : tag.name?.en || tag.name?.tr || 'No translation'}
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                Slug: {tag.slug}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditTag(tag)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteTag(tag.id, tag.name.en || tag.name.tr)}
                                disabled={deletingTag === tag.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tags Found</h3>
                      <p className="text-gray-500 mb-4">
                        Create tags to categorize and organize your stories.
                      </p>
                      <Button onClick={handleCreateTag}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Tag
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Users Management</CardTitle>
                  <div className="text-sm text-gray-500">
                    Total: {users?.length || 0} users
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input
                      placeholder="Search users by email, username, or role..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading users...</p>
                    </div>
                  ) : filteredUsers && filteredUsers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">
                                {user.username || user.email.split('@')[0]}
                              </h4>
                              <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'EDITOR' ? 'secondary' : 'outline'}>
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            {user.profile?.bio && (
                              <p className="text-xs text-gray-500 mt-1">{user.profile.bio}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.role !== 'ADMIN' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                disabled={deletingUser === user.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userSearch && users && users.length > 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Match Search</h3>
                      <p className="text-gray-500 mb-4">
                        No users match "{userSearch}". Try a different search term.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-500 mb-4">
                        No registered users found.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'authors' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Authors Management</CardTitle>
                  <Button onClick={handleCreateAuthor}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Author
                  </Button>
                </CardHeader>
                <CardContent>
                  {authorsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading authors...</p>
                    </div>
                  ) : authors && authors.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Total: {authors.length} authors
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {authors.map((author) => (
                          <div key={author.id} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {author.imageUrl && (
                                  <img
                                    src={author.imageUrl}
                                    alt={author.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <h4 className="font-medium">{author.name}</h4>
                                  <p className="text-xs text-gray-500">@{author.slug}</p>
                                </div>
                              </div>
                              {(author.bio?.en || author.bio?.tr) && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {author.bio?.en || author.bio?.tr}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Stories: {author.stories?.length || 0}</span>
                                {author.socialLinks?.website && (
                                  <a 
                                    href={author.socialLinks.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Website
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditAuthor(author)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteAuthor(author.id, author.name)}
                                disabled={deletingAuthor === author.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Authors Found</h3>
                      <p className="text-gray-500 mb-4">
                        Create author profiles to associate with your stories.
                      </p>
                      <Button onClick={handleCreateAuthor}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Author
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'series' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Series Management</CardTitle>
                  <Button onClick={handleCreateSeries}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Series
                  </Button>
                </CardHeader>
                <CardContent>
                  {seriesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading series...</p>
                    </div>
                  ) : series && series.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Total: {series.length} series
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {series.map((seriesItem) => (
                          <div key={seriesItem.id} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div>
                                  <h4 className="font-medium">
                                    {seriesItem.name?.en || seriesItem.name?.tr || 'Untitled Series'}
                                  </h4>
                                  <p className="text-xs text-gray-500">@{seriesItem.slug}</p>
                                </div>
                                <Badge variant="outline">
                                  {seriesItem._count?.stories || 0} stories
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {seriesItem.description?.en || seriesItem.description?.tr || 'No description'}
                              </p>
                              {seriesItem.stories && seriesItem.stories.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Stories: {seriesItem.stories.map((s: any) => s.story?.title?.en || s.story?.title?.tr).join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditSeries(seriesItem)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteSeries(seriesItem.id, seriesItem.name.en || seriesItem.name.tr)}
                                disabled={deletingSeries === seriesItem.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Series Found</h3>
                      <p className="text-gray-500 mb-4">
                        Create series to group related stories together for better organization.
                      </p>
                      <Button onClick={handleCreateSeries}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Series
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'tags' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tags Management</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Tag
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tag Management</h3>
                    <p className="text-gray-500 mb-4">
                      Create and manage tags for difficulty levels, topics, and content types.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Beginner</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Intermediate</span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Advanced</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Short</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Long</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="fixed bottom-4 right-4">
        <Card className="bg-green-50 border-green-200 max-w-sm">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">
              <strong>Admin Dashboard:</strong> Content management system is now active. 
              Manage stories, categories, and users with full CRUD operations.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editingUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveUser}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        category={editingCategory}
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSave={handleSaveCategory}
      />

      {/* Edit Tag Dialog */}
      <EditTagDialog
        tag={editingTag}
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        onSave={handleSaveTag}
      />

      {/* Edit Author Dialog */}
      <EditAuthorDialog
        author={editingAuthor}
        open={isAuthorDialogOpen}
        onOpenChange={setIsAuthorDialogOpen}
        onSave={handleSaveAuthor}
      />

      {/* Edit Series Dialog */}
      <EditSeriesDialog
        series={editingSeries}
        open={isSeriesDialogOpen}
        onOpenChange={setIsSeriesDialogOpen}
        onSave={handleSaveSeries}
      />
    </div>
  );
}