'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  FolderOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useAuthors } from '@/hooks/useAuthors';
import { apiClient } from '@/lib/api';
import Navigation from '@/components/Navigation';

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
    en: string[];
    tr: string[];
  };
  status: 'DRAFT' | 'PUBLISHED';
  categoryIds: string[];
  authorIds: string[];
  tagIds: string[];
}

const initialFormData: StoryFormData = {
  title: { en: '', tr: '' },
  shortDescription: { en: '', tr: '' },
  slug: '',
  content: { en: [''], tr: [''] },
  status: 'DRAFT',
  categoryIds: [],
  authorIds: [],
  tagIds: []
};

export default function NewStoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<StoryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'tr'>('en');
  const [previewMode, setPreviewMode] = useState(false);
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags, loading: tagsLoading } = useTags();
  const { authors, loading: authorsLoading } = useAuthors();
  

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
                  You need administrator privileges to create stories.
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
    setFormData({
      ...formData,
      shortDescription: { ...formData.shortDescription, [lang]: value }
    });
  };

  const handleContentChange = (lang: 'en' | 'tr', index: number, value: string) => {
    const newContent = { ...formData.content };
    newContent[lang][index] = value;
    setFormData({ ...formData, content: newContent });
  };

  const addParagraph = (lang: 'en' | 'tr') => {
    const newContent = { ...formData.content };
    newContent[lang].push('');
    setFormData({ ...formData, content: newContent });
  };

  const removeParagraph = (lang: 'en' | 'tr', index: number) => {
    if (formData.content[lang].length > 1) {
      const newContent = { ...formData.content };
      newContent[lang].splice(index, 1);
      setFormData({ ...formData, content: newContent });
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newCategoryIds = formData.categoryIds.includes(categoryId)
      ? formData.categoryIds.filter(id => id !== categoryId)
      : [...formData.categoryIds, categoryId];
    setFormData({ ...formData, categoryIds: newCategoryIds });
  };

  const toggleTag = (tagId: string) => {
    const newTagIds = formData.tagIds.includes(tagId)
      ? formData.tagIds.filter(id => id !== tagId)
      : [...formData.tagIds, tagId];
    setFormData({ ...formData, tagIds: newTagIds });
  };

  const toggleAuthor = (authorId: string) => {
    const newAuthorIds = formData.authorIds.includes(authorId)
      ? formData.authorIds.filter(id => id !== authorId)
      : [...formData.authorIds, authorId];
    setFormData({ ...formData, authorIds: newAuthorIds });
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
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

      if (formData.content.en.some(p => !p.trim()) || formData.content.tr.some(p => !p.trim())) {
        alert('Please ensure all paragraphs have content');
        return;
      }

      const storyData = {
        ...formData,
        status,
        createdBy: user.id,
        statistics: {
          wordCount: {
            en: formData.content.en.reduce((sum, p) => sum + p.split(' ').length, 0),
            tr: formData.content.tr.reduce((sum, p) => sum + p.split(' ').length, 0)
          },
          charCount: {
            en: formData.content.en.reduce((sum, p) => sum + p.length, 0),
            tr: formData.content.tr.reduce((sum, p) => sum + p.length, 0)
          },
          estimatedReadingTime: {
            en: Math.ceil(formData.content.en.reduce((sum, p) => sum + p.split(' ').length, 0) / 200),
            tr: Math.ceil(formData.content.tr.reduce((sum, p) => sum + p.split(' ').length, 0) / 200)
          }
        }
      };

      const response = await apiClient.createStory(storyData);
      
      if (response.success) {
        alert(status === 'PUBLISHED' ? 'Story published successfully!' : 'Story saved as draft!');
        router.push('/admin');
      } else {
        throw new Error(response.error?.message || 'Failed to save story');
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Failed to save story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
                <h1 className="text-2xl font-bold">Create New Story</h1>
                <p className="text-gray-600">Write a bilingual story for language learners</p>
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
                  {formData.content[activeLanguage].map((paragraph, index) => (
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
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">English Paragraphs</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addParagraph('en')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Paragraph
                        </Button>
                      </div>
                      {formData.content.en.map((paragraph, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`en-${index}`} className="text-sm text-gray-600">
                              Paragraph {index + 1}
                            </Label>
                            <Textarea
                              id={`en-${index}`}
                              value={paragraph}
                              onChange={(e) => handleContentChange('en', index, e.target.value)}
                              placeholder={`Enter paragraph ${index + 1} in English`}
                              rows={4}
                            />
                          </div>
                          {formData.content.en.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParagraph('en', index)}
                              className="mt-6"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="tr" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Turkish Paragraphs</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addParagraph('tr')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Paragraph
                        </Button>
                      </div>
                      {formData.content.tr.map((paragraph, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`tr-${index}`} className="text-sm text-gray-600">
                              Paragraph {index + 1}
                            </Label>
                            <Textarea
                              id={`tr-${index}`}
                              value={paragraph}
                              onChange={(e) => handleContentChange('tr', index, e.target.value)}
                              placeholder={`Enter paragraph ${index + 1} in Turkish`}
                              rows={4}
                            />
                          </div>
                          {formData.content.tr.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParagraph('tr', index)}
                              className="mt-6"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
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