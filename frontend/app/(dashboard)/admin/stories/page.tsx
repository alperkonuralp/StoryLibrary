'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Calendar,
  User,
  Star,
  BookOpen
} from 'lucide-react';

interface Story {
  id: string;
  title: { en: string; tr: string };
  shortDescription: { en: string; tr: string };
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  averageRating?: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deletedAt?: string;
  creator: {
    id: string;
    username: string;
    email: string;
  };
  authors: Array<{
    author: { name: string };
  }>;
  categories: Array<{
    category: { name: { en: string; tr: string } };
  }>;
}

interface StoriesResponse {
  success: boolean;
  data: {
    stories: Story[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function AdminStoriesPage() {
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [deletedStories, setDeletedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Suppress unused variable warning - error handling will be implemented later
  void error;
  const [currentTab, setCurrentTab] = useState('active');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const [activeResponse, deletedResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories?limit=100`, {
          credentials: 'include'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stories/deleted`, {
          credentials: 'include'
        })
      ]);

      if (activeResponse.ok) {
        const activeData: StoriesResponse = await activeResponse.json();
        if (activeData.success) {
          setActiveStories(activeData.data.stories);
        }
      }

      if (deletedResponse.ok) {
        const deletedData: StoriesResponse = await deletedResponse.json();
        if (deletedData.success) {
          setDeletedStories(deletedData.data.stories);
        }
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? It will be moved to the deleted stories list.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories/${storyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchStories(); // Refresh the lists
      } else {
        throw new Error('Failed to delete story');
      }
    } catch (err) {
      console.error('Error deleting story:', err);
      alert('Failed to delete story');
    }
  };

  const handleRestoreStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to restore this story?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stories/${storyId}/restore`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchStories(); // Refresh the lists
      } else {
        throw new Error('Failed to restore story');
      }
    } catch (err) {
      console.error('Error restoring story:', err);
      alert('Failed to restore story');
    }
  };

  const handlePermanentDelete = async (storyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stories/${storyId}/permanent`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchStories(); // Refresh the lists
      } else {
        throw new Error('Failed to permanently delete story');
      }
    } catch (err) {
      console.error('Error permanently deleting story:', err);
      alert('Failed to permanently delete story');
    }
  };

  const handleTogglePublish = async (story: Story) => {
    const endpoint = story.status === 'PUBLISHED' ? 'unpublish' : 'publish';
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories/${story.id}/${endpoint}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchStories(); // Refresh the lists
      } else {
        throw new Error(`Failed to ${endpoint} story`);
      }
    } catch (err) {
      console.error(`Error ${endpoint}ing story:`, err);
      alert(`Failed to ${endpoint} story`);
    }
  };

  const filteredActiveStories = activeStories.filter(story =>
    story.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.title.tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.authors.some(a => a.author.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDeletedStories = deletedStories.filter(story =>
    story.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.title.tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.authors.some(a => a.author.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const StoryCard = ({ story, isDeleted = false }: { story: Story; isDeleted?: boolean }) => (
    <Card key={story.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{story.title.en}</CardTitle>
            {story.title.tr !== story.title.en && (
              <p className="text-sm text-gray-600 mt-1">{story.title.tr}</p>
            )}
            <CardDescription className="line-clamp-2 mt-2">
              {story.shortDescription.en}
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-1">
            <Badge variant={story.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {story.status}
            </Badge>
            {story.averageRating && (
              <div className="flex items-center space-x-1 text-sm text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                <span>{Number(story.averageRating).toFixed(1)} ({story.ratingCount})</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{story.creator.username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
          {story.publishedAt && (
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3" />
              <span>Published {new Date(story.publishedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Categories and Authors */}
        <div className="flex flex-wrap gap-2 mb-4">
          {story.authors.map((author, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {author.author.name}
            </Badge>
          ))}
          {story.categories.map((cat, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {cat.category.name.en}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!isDeleted ? (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/stories/${story.slug}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/stories/${story.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTogglePublish(story)}
              >
                {story.status === 'PUBLISHED' ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Publish
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteStory(story.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestoreStory(story.id)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handlePermanentDelete(story.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Permanent Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Story Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all stories, including published, draft, and deleted stories.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/stories/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Story
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active Stories ({filteredActiveStories.length})
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted Stories ({filteredDeletedStories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {filteredActiveStories.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No stories found' : 'No stories yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No stories match your search "${searchTerm}"`
                  : 'Start by creating your first story'
                }
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/admin/stories/new">Create Story</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredActiveStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deleted">
          {filteredDeletedStories.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No deleted stories
              </h3>
              <p className="text-gray-600">
                Deleted stories will appear here and can be restored or permanently deleted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDeletedStories.map(story => (
                <StoryCard key={story.id} story={story} isDeleted />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}