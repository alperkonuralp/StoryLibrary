'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3,
  Eye,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Archive,
  FileText,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Draft {
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
  wordCount?: {
    en: number;
    tr: number;
  };
}

interface DraftsListProps {
  limit?: number;
  showActions?: boolean;
  showCreateButton?: boolean;
  className?: string;
}

export function DraftsList({
  limit,
  showActions = true,
  showCreateButton = false,
  className = '',
}: DraftsListProps) {
  const { user, token } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchDrafts();
    }
  }, [user, token]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(
        `${API_BASE_URL}/stories?status=draft&author=${user?.id}${limit ? `&limit=${limit}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setDrafts(data.data.stories || []);
      } else {
        throw new Error(data.message || 'Failed to fetch drafts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/stories/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      } else {
        throw new Error('Failed to delete draft');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete draft. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading drafts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDrafts}
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts yet</h3>
            <p className="text-gray-600 mb-4">
              Start writing your first story to see drafts here
            </p>
            {showCreateButton && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/editor?action=new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Story
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {drafts.map((draft) => (
        <Card key={draft.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {draft.title.en || draft.title.tr || 'Untitled Draft'}
                  </h3>
                  <Badge className={getStatusColor(draft.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(draft.status)}
                      <span>{draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}</span>
                    </div>
                  </Badge>
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">
                  {draft.shortDescription.en || draft.shortDescription.tr || 'No description'}
                </p>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(draft.updatedAt)}</span>
                  </div>

                  {draft.authors.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span>by</span>
                      <span className="font-medium">
                        {draft.authors.map(a => a.author.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {draft.wordCount && (
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {(draft.wordCount.en || 0) + (draft.wordCount.tr || 0)} words
                      </span>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {draft.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {draft.categories.slice(0, 3).map(({ category }) => (
                      <Badge key={category.id} variant="outline" className="text-xs">
                        {category.name.en || category.name.tr}
                      </Badge>
                    ))}
                    {draft.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{draft.categories.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {showActions && (
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/editor?action=preview&id=${draft.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/editor?action=edit&id=${draft.id}`}>
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(draft.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Show more link */}
      {limit && drafts.length >= limit && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/editor">
              View All Drafts
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}