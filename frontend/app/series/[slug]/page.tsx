'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BookOpen, Star, Clock, User, Calendar } from 'lucide-react';

interface Story {
  id: string;
  title: {
    en: string;
    tr: string;
  };
  shortDescription: {
    en: string;
    tr: string;
  };
  slug: string;
  averageRating?: number;
  ratingCount: number;
  publishedAt?: string;
  statistics?: {
    wordCount?: { en?: number; tr?: number };
    estimatedReadingTime?: { en?: number; tr?: number };
  };
  authors: Array<{
    author: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  }>;
  categories: Array<{
    category: {
      id: string;
      name: { en: string; tr: string };
      slug: string;
    };
  }>;
  series: Array<{
    orderInSeries: number;
    series: {
      id: string;
      name: { en: string; tr: string };
      slug: string;
    };
  }>;
}

interface Series {
  id: string;
  name: {
    en: string;
    tr: string;
  };
  description?: {
    en: string;
    tr: string;
  };
  slug: string;
  createdAt: string;
}

interface SeriesResponse {
  success: boolean;
  data: {
    series: Series;
    stories: Story[];
  };
}

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [series, setSeries] = useState<Series | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSeriesData();
    }
  }, [slug]);

  const fetchSeriesData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/series/${slug}/stories`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Series not found');
        }
        throw new Error('Failed to fetch series data');
      }
      
      const data: SeriesResponse = await response.json();
      
      if (data.success) {
        setSeries(data.data.series);
        // Sort stories by order in series
        const sortedStories = data.data.stories.sort((a, b) => {
          const orderA = a.series[0]?.orderInSeries || 0;
          const orderB = b.series[0]?.orderInSeries || 0;
          return orderA - orderB;
        });
        setStories(sortedStories);
      } else {
        throw new Error('Failed to load series data');
      }
    } catch (err) {
      console.error('Error fetching series data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Series</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchSeriesData}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push('/series')}>
              Back to Series
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Series Not Found</h1>
          <p className="text-gray-600 mb-4">The series you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/series')}>Back to Series</Button>
        </div>
      </div>
    );
  }

  const totalStories = stories.length;
  const totalWordCount = stories.reduce((sum, story) => {
    const enWords = story.statistics?.wordCount?.en || 0;
    const trWords = story.statistics?.wordCount?.tr || 0;
    return sum + Math.max(enWords, trWords);
  }, 0);
  const avgReadingTime = Math.ceil(totalWordCount / 200); // 200 words per minute

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Series header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{series.name.en}</h1>
        {series.name.tr !== series.name.en && (
          <h2 className="text-xl text-gray-600 mb-4">{series.name.tr}</h2>
        )}
        
        {series.description && (
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{series.description.en}</p>
            {series.description.tr !== series.description.en && (
              <p className="text-gray-600 mt-2 italic">{series.description.tr}</p>
            )}
          </div>
        )}

        {/* Series stats */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{totalStories} {totalStories === 1 ? 'story' : 'stories'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>~{avgReadingTime} min read (total)</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(series.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Stories list */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Stories in this Series ({totalStories})
        </h3>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stories Yet</h3>
          <p className="text-gray-600">This series doesn't have any published stories yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story, index) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Part {story.series[0]?.orderInSeries || index + 1}
                      </Badge>
                      {story.averageRating && (
                        <div className="flex items-center space-x-1 text-sm text-amber-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{Number(story.averageRating).toFixed(1)}</span>
                          <span className="text-gray-500">({story.ratingCount})</span>
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="line-clamp-2">
                      <Link 
                        href={`/stories/${story.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {story.title.en}
                      </Link>
                    </CardTitle>
                    
                    {story.title.tr !== story.title.en && (
                      <p className="text-sm text-gray-600 mt-1">{story.title.tr}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="line-clamp-3 mb-4">
                  {story.shortDescription.en}
                </CardDescription>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  {story.authors.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>
                        {story.authors.map(a => a.author.name).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {story.statistics?.estimatedReadingTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {Math.max(
                          story.statistics.estimatedReadingTime.en || 0,
                          story.statistics.estimatedReadingTime.tr || 0
                        )} min read
                      </span>
                    </div>
                  )}

                  {story.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {story.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {story.categories.map(cat => (
                      <Badge key={cat.category.id} variant="outline" className="text-xs">
                        <Link 
                          href={`/categories/${cat.category.slug}` as any}
                          className="hover:text-blue-600"
                        >
                          {cat.category.name.en}
                        </Link>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}