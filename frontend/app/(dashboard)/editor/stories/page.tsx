'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Story {
  id: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  slug: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  averageRating?: number;
  ratingCount?: number;
  publishedAt?: string;
  updatedAt: string;
  statistics?: {
    wordCount: Record<string, number>;
    estimatedReadingTime: Record<string, number>;
  };
}

export default function EditorStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'REVIEW' | 'PUBLISHED'>('ALL');

  useEffect(() => {
    // TODO: Fetch stories from API
    // Mock data for now
    setTimeout(() => {
      const mockStories: Story[] = [
        {
          id: '1',
          title: { en: 'The Magic Forest', tr: 'Sihirli Orman' },
          shortDescription: { en: 'A story about a magical forest', tr: 'Sihirli bir orman hakkında hikaye' },
          slug: 'the-magic-forest',
          status: 'PUBLISHED',
          averageRating: 4.5,
          ratingCount: 23,
          publishedAt: '2024-01-15',
          updatedAt: '2024-01-20',
          statistics: {
            wordCount: { en: 1200, tr: 1150 },
            estimatedReadingTime: { en: 5, tr: 5 }
          }
        },
        {
          id: '2',
          title: { en: 'Learning JavaScript', tr: 'JavaScript Öğrenmek' },
          shortDescription: { en: 'A beginner guide to JavaScript', tr: 'JavaScript için başlangıç rehberi' },
          slug: 'learning-javascript',
          status: 'DRAFT',
          updatedAt: '2024-01-22',
          statistics: {
            wordCount: { en: 800, tr: 750 },
            estimatedReadingTime: { en: 3, tr: 3 }
          }
        },
        {
          id: '3',
          title: { en: 'The Future of AI', tr: 'AI\'nın Geleceği' },
          shortDescription: { en: 'Exploring artificial intelligence', tr: 'Yapay zeka keşfi' },
          slug: 'the-future-of-ai',
          status: 'REVIEW',
          updatedAt: '2024-01-18',
          statistics: {
            wordCount: { en: 1500, tr: 1400 },
            estimatedReadingTime: { en: 6, tr: 6 }
          }
        }
      ];
      setStories(mockStories);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'REVIEW':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'DRAFT':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.title.tr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || story.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Stories</h1>
          <p className="text-gray-600 mt-2">
            Manage your story collection
          </p>
        </div>
        
        <Link href="/editor/stories/new">
          <Button size="lg">
            <PlusCircle className="h-5 w-5 mr-2" />
            New Story
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {['ALL', 'PUBLISHED', 'REVIEW', 'DRAFT'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status === 'ALL' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No stories found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first story to get started'}
              </p>
              <Link href="/editor/stories/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Story
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredStories.map((story) => (
            <Card key={story.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {story.title.en}
                      </h3>
                      <Badge className={getStatusColor(story.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(story.status)}
                          {story.status}
                        </div>
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      {story.shortDescription.en}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {story.statistics && (
                        <>
                          <span>{story.statistics.wordCount.en || 0} words</span>
                          <span>{story.statistics.estimatedReadingTime.en || 0} min read</span>
                        </>
                      )}
                      
                      {story.status === 'PUBLISHED' && story.averageRating && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {story.averageRating.toFixed(1)} ({story.ratingCount})
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(story.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/stories/${story.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      
                      {story.status === 'PUBLISHED' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/stories/${story.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Live
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}