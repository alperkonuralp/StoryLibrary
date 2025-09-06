'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Languages,
  BookOpen,
  User,
  Tag as TagIcon,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useAuthors } from '@/hooks/useAuthors';
import { apiClient } from '@/lib/api';
import Navigation from '@/components/Navigation';
import type { Story } from '@/types';
import { mergeParagraphs, parseParagraphs, isValidContent, countWords, countParagraphs } from '@/lib/paragraph-utils';

interface StoryFormData {
  title: {
    en: string;
    tr: string;
  };
  shortDescription: {
    en: string;
    tr: string;
  };
  slug: string;
  content: {
    en: string;
    tr: string;
  };
  status: 'DRAFT' | 'PUBLISHED';
  categoryIds: string[];
  authorIds: string[];
  tagIds: string[];
}

export default function EditStoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  
  const [story, setStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'tr'>('en');
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags, loading: tagsLoading } = useTags();
  const { authors, loading: authorsLoading } = useAuthors();

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getStory(storyId);
        
        if (response.success && response.data) {
          const storyData = response.data;
          setStory(storyData);
          
          // Convert story data to form data format
          setFormData({
            title: storyData.title,
            shortDescription: storyData.shortDescription,
            slug: storyData.slug,
            content: {
              en: mergeParagraphs(storyData.content.en),
              tr: mergeParagraphs(storyData.content.tr)
            },
            status: storyData.status,
            categoryIds: storyData.categories?.map(c => c.categoryId) || [],
            authorIds: storyData.authors?.map(a => a.authorId) || [],
            tagIds: storyData.tags?.map(t => t.tagId) || []
          });
        } else {
          setError(response.error?.message || 'Failed to load story');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      loadStory();
    }
  }, [storyId]);

  // Check admin access
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Navigation />
        <div className="container py-16">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Access Denied
                </h3>
                <p className="text-gray-600">
                  You need administrator privileges to edit stories.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (lang: 'en' | 'tr', value: string) => {
    if (!formData) return;
    
    const newFormData = {
      ...formData,
      title: { ...formData.title, [lang]: value }
    };
    
    // Auto-generate slug from English title
    if (lang === 'en' && value) {
      newFormData.slug = generateSlug(value);
    }
    
    setFormData(newFormData);
  };

  const handleDescriptionChange = (lang: 'en' | 'tr', value: string) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      shortDescription: { ...formData.shortDescription, [lang]: value }
    });
  };

  const handleContentChange = (lang: 'en' | 'tr', value: string) => {
    if (!formData) return;
    
    setFormData({ 
      ...formData, 
      content: { 
        ...formData.content, 
        [lang]: value 
      } 
    });
  };

  const toggleCategory = (categoryId: string) => {
    if (!formData) return;
    
    const newCategoryIds = formData.categoryIds.includes(categoryId)
      ? formData.categoryIds.filter(id => id !== categoryId)
      : [...formData.categoryIds, categoryId];
    setFormData({ ...formData, categoryIds: newCategoryIds });
  };

  const toggleTag = (tagId: string) => {
    if (!formData) return;
    
    const newTagIds = formData.tagIds.includes(tagId)
      ? formData.tagIds.filter(id => id !== tagId)
      : [...formData.tagIds, tagId];
    setFormData({ ...formData, tagIds: newTagIds });
  };

  const toggleAuthor = (authorId: string) => {
    if (!formData) return;
    
    const newAuthorIds = formData.authorIds.includes(authorId)
      ? formData.authorIds.filter(id => id !== authorId)
      : [...formData.authorIds, authorId];
    setFormData({ ...formData, authorIds: newAuthorIds });
  };

  const handleSave = async (status?: 'DRAFT' | 'PUBLISHED') => {
    if (!formData || !story) return;
    
    setSaving(true);
    
    try {
      // Validate required fields
      if (!formData.title.en || !formData.title.tr) {
        alert('Please provide titles in both languages');
        return;
      }

      if (!formData.shortDescription.en || !formData.shortDescription.tr) {
        alert('Please provide descriptions in both languages');
        return;
      }

      if (!isValidContent(formData.content.en) || !isValidContent(formData.content.tr)) {
        alert('Please ensure both languages have valid content');
        return;
      }

      const updateData = {
        ...formData,
        content: {
          en: parseParagraphs(formData.content.en),
          tr: parseParagraphs(formData.content.tr)
        },
        status: status || formData.status,
        statistics: {
          wordCount: {
            en: countWords(formData.content.en),
            tr: countWords(formData.content.tr)
          },
          charCount: {
            en: formData.content.en.length,
            tr: formData.content.tr.length
          },
          estimatedReadingTime: {
            en: Math.ceil(countWords(formData.content.en) / 200),
            tr: Math.ceil(countWords(formData.content.tr) / 200)
          }
        }
      };

      const response = await apiClient.updateStory(storyId, updateData);
      
      if (response.success) {
        alert(status === 'PUBLISHED' ? 'Story published successfully!' : 
              status === 'DRAFT' ? 'Story saved as draft!' : 
              'Story updated successfully!');
        router.push('/admin');
      } else {
        throw new Error(response.error?.message || 'Failed to update story');
      }
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Failed to update story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Navigation />
        <div className="container py-16">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading story...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !story || !formData) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Navigation />
        <div className="container py-16">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading Story
                </h3>
                <p className="text-gray-600 mb-4">
                  {error || 'Story not found'}
                </p>
                <Button asChild>
                  <Link href="/admin">Return to Admin</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Story</h1>
                <p className="text-gray-600">Update "{story.title.en}"</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPreviewMode(!previewMode)}
                disabled={saving}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSave('DRAFT')}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSave('PUBLISHED')}
                disabled={saving}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {previewMode ? (
            // Preview Mode
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">
                  {formData.title[activeLanguage] || 'Untitled Story'}
                </CardTitle>
                <p className="text-lg text-gray-600">
                  {formData.shortDescription[activeLanguage]}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={activeLanguage === 'tr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('tr')}
                  >
                    Türkçe
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {parseParagraphs(formData.content[activeLanguage]).map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Story Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Title</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title-en" className="text-sm text-gray-600">English</Label>
                        <Input
                          id="title-en"
                          value={formData.title.en}
                          onChange={(e) => handleTitleChange('en', e.target.value)}
                          placeholder="Story title in English"
                        />
                      </div>
                      <div>
                        <Label htmlFor="title-tr" className="text-sm text-gray-600">Turkish</Label>
                        <Input
                          id="title-tr"
                          value={formData.title.tr}
                          onChange={(e) => handleTitleChange('tr', e.target.value)}
                          placeholder="Story title in Turkish"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slug */}
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="story-url-slug"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Short Description</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="desc-en" className="text-sm text-gray-600">English</Label>
                        <Textarea
                          id="desc-en"
                          value={formData.shortDescription.en}
                          onChange={(e) => handleDescriptionChange('en', e.target.value)}
                          placeholder="Brief description in English"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="desc-tr" className="text-sm text-gray-600">Turkish</Label>
                        <Textarea
                          id="desc-tr"
                          value={formData.shortDescription.tr}
                          onChange={(e) => handleDescriptionChange('tr', e.target.value)}
                          placeholder="Brief description in Turkish"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Story Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as 'en' | 'tr')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="en">English Content</TabsTrigger>
                      <TabsTrigger value="tr">Turkish Content</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="en" className="space-y-4 mt-6">
                      <div>
                        <Label htmlFor="content-en" className="text-base font-medium">English Content</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Write your story content. Separate paragraphs with double line breaks (press Enter twice).
                        </p>
                        <Textarea
                          id="content-en"
                          value={formData.content.en}
                          onChange={(e) => handleContentChange('en', e.target.value)}
                          placeholder="Write your story in English here...

Separate each paragraph with double line breaks like this.

This makes it easy to write longer stories without managing individual text boxes."
                          rows={15}
                          className="min-h-[400px] resize-y"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          Words: {countWords(formData.content.en)} | Paragraphs: {countParagraphs(formData.content.en)}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tr" className="space-y-4 mt-6">
                      <div>
                        <Label htmlFor="content-tr" className="text-base font-medium">Turkish Content</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Hikayenizi Türkçe olarak yazın. Paragrafları çift satır arası ile ayırın (iki kez Enter'a basın).
                        </p>
                        <Textarea
                          id="content-tr"
                          value={formData.content.tr}
                          onChange={(e) => handleContentChange('tr', e.target.value)}
                          placeholder="Hikayenizi buraya Türkçe olarak yazın...

Her paragrafı böyle çift satır arası ile ayırın.

Bu uzun hikayeler yazmayı kolaylaştırır ve bireysel metin kutularını yönetmek zorunda kalmazsınız."
                          rows={15}
                          className="min-h-[400px] resize-y"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          Kelimeler: {countWords(formData.content.tr)} | Paragraflar: {countParagraphs(formData.content.tr)}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata & Classification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Categories */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Categories
                    </Label>
                    {categoriesLoading ? (
                      <div className="text-sm text-gray-500">Loading categories...</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                          <Badge
                            key={category.id}
                            variant={formData.categoryIds.includes(category.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleCategory(category.id)}
                          >
                            {category.name.en}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      Tags
                    </Label>
                    {tagsLoading ? (
                      <div className="text-sm text-gray-500">Loading tags...</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTag(tag.id)}
                            style={tag.color ? { backgroundColor: formData.tagIds.includes(tag.id) ? tag.color : undefined } : undefined}
                          >
                            {tag.name.en}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Authors */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Authors
                    </Label>
                    {authorsLoading ? (
                      <div className="text-sm text-gray-500">Loading authors...</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {authors.map(author => (
                          <Badge
                            key={author.id}
                            variant={formData.authorIds.includes(author.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleAuthor(author.id)}
                          >
                            {author.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}