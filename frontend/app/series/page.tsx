'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Clock } from 'lucide-react';

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
  _count?: {
    stories: number;
  };
}

interface SeriesResponse {
  success: boolean;
  data: Series[];
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/series`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      
      const data: SeriesResponse = await response.json();
      
      if (data.success) {
        setSeries(data.data);
      } else {
        throw new Error('Failed to load series');
      }
    } catch (err) {
      console.error('Error fetching series:', err);
      setError(err instanceof Error ? err.message : 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const filteredSeries = series.filter(s =>
    s.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description?.en?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.description?.tr?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Series</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchSeries}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Story Series</h1>
        <p className="text-gray-600 mb-6">
          Discover complete series of related stories for immersive reading experiences.
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Series Grid */}
      {filteredSeries.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No series found' : 'No series available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No series match your search "${searchTerm}"`
              : 'Check back later for new story series'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeries.map((seriesItem) => (
            <Card key={seriesItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  <Link 
                    href={`/series/${seriesItem.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {seriesItem.name.en}
                  </Link>
                </CardTitle>
                {seriesItem.description && (
                  <CardDescription className="line-clamp-3">
                    {seriesItem.description.en}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {seriesItem._count?.stories || 0} {(seriesItem._count?.stories || 0) === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(seriesItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Turkish title if different */}
                {seriesItem.name.tr !== seriesItem.name.en && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">
                      TR: {seriesItem.name.tr}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredSeries.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-600">
          Showing {filteredSeries.length} of {series.length} series
        </div>
      )}
    </div>
  );
}