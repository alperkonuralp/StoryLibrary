'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Search, 
  TrendingUp,
  Heart,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { FollowButton } from '@/components/social/FollowButton';
import { FollowingFeed } from '@/components/social/FollowingFeed';

interface Author {
  id: string;
  name: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
  storiesCount: number;
  followersCount: number;
  averageRating: number;
  latestStory?: {
    id: string;
    title: Record<string, string>;
    publishedAt: string;
  };
}

export default function SocialFollowingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedAuthors, setSuggestedAuthors] = useState<Author[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const {
    followers,
    following,
    loadFollowers,
    loadFollowing,
    loading: followLoading,
  } = useAuthorFollow();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      loadFollowers();
      loadFollowing();
      loadSuggestedAuthors();
    }
  }, [isAuthenticated, user, router]);

  const loadSuggestedAuthors = async () => {
    if (!user) return;

    try {
      setLoadingSuggestions(true);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/authors/suggested?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedAuthors(data.data?.authors || []);
      }
    } catch (error) {
      console.error('Failed to load suggested authors:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getAuthorDisplayName = (author: Author | typeof followers[0] | typeof following[0]) => {
    if ('profile' in author && author.profile?.firstName && author.profile?.lastName) {
      return `${author.profile.firstName} ${author.profile.lastName}`;
    }
    return author.name;
  };

  const filteredFollowing = following.filter(author =>
    getAuthorDisplayName(author).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFollowers = followers.filter(follower =>
    getAuthorDisplayName(follower).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestions = suggestedAuthors.filter(author =>
    getAuthorDisplayName(author).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <div className="flex items-center space-x-4 mb-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Social</h1>
              <p className="text-gray-600 mt-2">
                Connect with authors and discover new stories
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{following.length}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{followers.length}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feed">
              <TrendingUp className="h-4 w-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="discover">
              <UserPlus className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed">
            <FollowingFeed limit={20} showHeader={false} />
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search people you follow..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Following List */}
            {followLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredFollowing.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No results found' : 'Not following anyone yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Discover and follow authors to see their updates'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setActiveTab('discover')}>
                      Discover Authors
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFollowing.map((author) => (
                  <Card key={author.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              <Link 
                                href={`/authors/${author.id}` as any}
                                className="hover:text-blue-600"
                              >
                                {getAuthorDisplayName(author)}
                              </Link>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {author.storiesCount} stor{author.storiesCount === 1 ? 'y' : 'ies'}
                            </p>
                            {author.latestStory && (
                              <p className="text-xs text-gray-500 mt-1">
                                Latest: {author.latestStory.title.en || author.latestStory.title.tr}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Following since {new Date(author.followedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <FollowButton
                          authorId={author.id}
                          authorName={getAuthorDisplayName(author)}
                          size="sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search your followers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Followers List */}
            {followLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredFollowers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No results found' : 'No followers yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Write great stories and people will start following you!'
                    }
                  </p>
                  {!searchTerm && (
                    <Button asChild>
                      <Link href="/editor?action=new">Write a Story</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFollowers.map((follower) => (
                  <Card key={follower.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            <Link 
                              href={`/authors/${follower.id}` as any}
                              className="hover:text-blue-600"
                            >
                              {getAuthorDisplayName(follower)}
                            </Link>
                          </h3>
                          <p className="text-xs text-gray-400">
                            Following since {new Date(follower.followedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search authors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Authors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Discover Authors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading suggestions...</span>
                  </div>
                ) : filteredSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No authors found' : 'No suggestions available'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm 
                        ? 'Try different search terms'
                        : 'Check back later for author suggestions'
                      }
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/authors">Browse All Authors</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSuggestions.map((author) => (
                      <Card key={author.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  <Link 
                                    href={`/authors/${author.id}` as any}
                                    className="hover:text-blue-600"
                                  >
                                    {getAuthorDisplayName(author)}
                                  </Link>
                                </h3>
                                {author.profile?.bio && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                    {author.profile.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                            <FollowButton
                              authorId={author.id}
                              authorName={getAuthorDisplayName(author)}
                              size="sm"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div>
                              <div className="font-semibold text-blue-600">{author.storiesCount}</div>
                              <div className="text-gray-600">Stories</div>
                            </div>
                            <div>
                              <div className="font-semibold text-purple-600">{author.followersCount}</div>
                              <div className="text-gray-600">Followers</div>
                            </div>
                            <div>
                              <div className="font-semibold text-yellow-600">
                                {author.averageRating > 0 ? author.averageRating.toFixed(1) : '—'}
                              </div>
                              <div className="text-gray-600">Rating</div>
                            </div>
                          </div>

                          {author.latestStory && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-gray-500 mb-1">Latest story:</p>
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                {author.latestStory.title.en || author.latestStory.title.tr}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(author.latestStory.publishedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}