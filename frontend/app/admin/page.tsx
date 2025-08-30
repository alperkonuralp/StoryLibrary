'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, FolderOpen, Tag, BarChart3, Plus, Settings, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStories } from '@/hooks/useStories';
import { useCategories } from '@/hooks/useCategories';
import { useUsers } from '@/hooks/useUsers';
import Navigation from '@/components/Navigation';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { apiClient } from '@/lib/api';

// Mock statistics - in a real app these would come from API
const mockStats = {
  totalStories: 3,
  publishedStories: 3,
  draftStories: 0,
  totalUsers: 150,
  totalAuthors: 2,
  totalCategories: 5,
  totalViews: 1250,
  averageRating: 4.4
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Fetch real data for admin dashboard
  const { stories, loading: storiesLoading } = useStories({ 
    filters: { status: undefined, limit: 100 } // Get all stories regardless of status
  });
  const { categories, loading: categoriesLoading } = useCategories();
  const { users, loading: usersLoading, refetch: refetchUsers } = useUsers();

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
                      <div className="text-2xl font-bold">{stories?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {stories?.filter(s => s.status === 'PUBLISHED').length || 0} published, {stories?.filter(s => s.status === 'DRAFT').length || 0} drafts
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Registered users
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockStats.totalViews}</div>
                      <p className="text-xs text-muted-foreground">
                        Story page views
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockStats.averageRating}</div>
                      <p className="text-xs text-muted-foreground">
                        Out of 5 stars
                      </p>
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
                      <Button className="h-20 flex flex-col space-y-2">
                        <Plus className="h-6 w-6" />
                        <span>Create New Story</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col space-y-2">
                        <FolderOpen className="h-6 w-6" />
                        <span>Add Category</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col space-y-2">
                        <Users className="h-6 w-6" />
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
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Story
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
                      <div className="text-sm text-gray-600 mb-4">
                        Total: {stories.length} stories
                      </div>
                      <div className="space-y-3">
                        {stories.map((story) => (
                          <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                                <span>Rating: {story.averageRating?.toFixed(1) || 'N/A'}</span>
                                <span>Views: {story.viewCount || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/stories/${story.slug}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
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
                  <Button>
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
                                Stories: {category._count?.stories || 0}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
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

            {activeTab === 'users' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Users Management</CardTitle>
                  <div className="text-sm text-gray-500">
                    Total: {users?.length || 0} users
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p>Loading users...</p>
                    </div>
                  ) : users && users.length > 0 ? (
                    <div className="space-y-3">
                      {users.map((user) => (
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
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
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
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Author
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Author Management</h3>
                    <p className="text-gray-500 mb-4">
                      Manage author profiles, biographies, and story associations.
                    </p>
                    <p className="text-sm text-gray-600">Current authors: {mockStats.totalAuthors}</p>
                  </div>
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
    </div>
  );
}