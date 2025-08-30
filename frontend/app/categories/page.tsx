'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import type { Language } from '@/types';

export default function CategoriesPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories, loading, error } = useCategories();

  // Filter categories based on search
  const filteredCategories = categories?.filter(category =>
    category.name[language]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.[language]?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleLanguageToggle = () => {
    setLanguage(lang => lang === 'en' ? 'tr' : 'en');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold">Story Library</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/stories">Stories</Link>
              <Link href="/authors">Authors</Link>
              <Link href="/categories" className="text-foreground">Categories</Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section className="container space-y-6 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">
                {language === 'en' ? 'Categories' : 'Kategoriler'}
              </h1>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Browse stories by category to find content that interests you'
                  : 'İlginizi çeken içerikleri bulmak için hikayeleri kategoriye göre göz atın'
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
                  placeholder={language === 'en' ? 'Search categories...' : 'Kategorilerde ara...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container pb-8">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              {language === 'en' ? 'Error loading categories' : 'Kategoriler yüklenirken hata oluştu'}
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'en' ? 'No Categories Found' : 'Kategori Bulunamadı'}
              </h3>
              <p className="text-gray-500 max-w-sm">
                {searchQuery 
                  ? (language === 'en' ? 'No categories match your search.' : 'Aramanızla eşleşen kategori yok.')
                  : (language === 'en' ? 'No categories available.' : 'Mevcut kategori yok.')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/stories?categoryId=${category.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name[language] || category.name.en || 'Unknown Category'}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">
                      {category.description?.[language] || category.description?.en || 'No description available'}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>
                        {language === 'en' ? 'Browse stories in this category' : 'Bu kategorideki hikayeleri görüntüle'}
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