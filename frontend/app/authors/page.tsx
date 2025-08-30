'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search, User } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuthors } from '@/hooks/useAuthors';
import type { Language } from '@/types';

// Mock authors data - in a real app this would come from API
const mockAuthors = [
  {
    id: '1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    bio: {
      en: 'Jane Doe is a bestselling author known for her engaging storytelling and vivid characters.',
      tr: 'Jane Doe, ilgi çekici hikaye anlatımı ve canlı karakterleriyle tanınan çok satan bir yazardır.'
    },
    storyCount: 5,
    createdAt: '2023-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'John Smith',
    slug: 'john-smith',
    bio: {
      en: 'John Smith is a technology writer with over 10 years of experience in software development.',
      tr: 'John Smith, yazılım geliştirmede 10 yılı aşkın deneyime sahip bir teknoloji yazarıdır.'
    },
    storyCount: 3,
    createdAt: '2023-02-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Maria Garcia',
    slug: 'maria-garcia',
    bio: {
      en: 'Maria Garcia specializes in cultural stories and has lived in 8 different countries.',
      tr: 'Maria Garcia kültürel hikayelerde uzmanlaşmıştır ve 8 farklı ülkede yaşamıştır.'
    },
    storyCount: 7,
    createdAt: '2023-03-10T00:00:00Z'
  }
];

export default function AuthorsPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const { authors, loading, error } = useAuthors();
  
  // Filter authors based on search
  const filteredAuthors = authors.filter((author: any) =>
    author.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.bio?.[language]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageToggle = () => {
    setLanguage(lang => lang === 'en' ? 'tr' : 'en');
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Page Header */}
      <section className="container space-y-6 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">
                {language === 'en' ? 'Authors' : 'Yazarlar'}
              </h1>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Discover talented authors and explore their stories'
                  : 'Yetenekli yazarları keşfedin ve hikayelerini inceleyin'
                }
              </p>
            </div>
            
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLanguageToggle}
              className="w-fit"
            >
              {language === 'en' ? '🇹🇷 Türkçe' : '🇺🇸 English'}
            </Button>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search authors...' : 'Yazarlarda ara...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="container pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading authors...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load authors. Please try again later.</p>
          </div>
        ) : filteredAuthors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <User className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'en' ? 'No Authors Found' : 'Yazar Bulunamadı'}
              </h3>
              <p className="text-gray-500 max-w-sm">
                {searchQuery 
                  ? (language === 'en' ? 'No authors match your search.' : 'Aramanızla eşleşen yazar yok.')
                  : (language === 'en' ? 'No authors available.' : 'Mevcut yazar yok.')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuthors.map((author: any) => (
              <Card key={author.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/stories?authorId=${author.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{author.name}</span>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {author.bio?.[language] || author.bio?.en || 'No biography available'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>
                          {author._count?.stories || 0} {language === 'en' 
                            ? (author._count?.stories === 1 ? 'story' : 'stories')
                            : 'hikaye'
                          }
                        </span>
                      </div>
                      <span>
                        {language === 'en' ? 'View stories' : 'Hikayeleri gör'}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}