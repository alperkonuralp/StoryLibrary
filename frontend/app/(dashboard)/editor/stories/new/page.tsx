'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Save, 
  Eye, 
  Send, 
  Plus, 
  Minus, 
  Languages,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StoryFormData {
  title: { en: string; tr: string };
  shortDescription: { en: string; tr: string };
  content: { en: string[]; tr: string[] };
  slug: string;
  categoryIds: string[];
  tagIds: string[];
  authorIds: string[];
}

export default function NewStory() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'tr'>('en');
  const [formData, setFormData] = useState<StoryFormData>({
    title: { en: '', tr: '' },
    shortDescription: { en: '', tr: '' },
    content: { en: [''], tr: [''] },
    slug: '',
    categoryIds: [],
    tagIds: [],
    authorIds: []
  });

  const handleTitleChange = (lang: 'en' | 'tr', value: string) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [lang]: value },
      // Auto-generate slug from English title
      slug: lang === 'en' ? value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim() : prev.slug
    }));
  };

  const handleDescriptionChange = (lang: 'en' | 'tr', value: string) => {
    setFormData(prev => ({
      ...prev,
      shortDescription: { ...prev.shortDescription, [lang]: value }
    }));
  };

  const handleContentChange = (lang: 'en' | 'tr', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: prev.content[lang].map((para, i) => i === index ? value : para)
      }
    }));
  };

  const addParagraph = (lang: 'en' | 'tr') => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: [...prev.content[lang], '']
      }
    }));
  };

  const removeParagraph = (lang: 'en' | 'tr', index: number) => {
    if (formData.content[lang].length > 1) {
      setFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [lang]: prev.content[lang].filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleSave = async (status: 'DRAFT' | 'REVIEW' | 'PUBLISHED') => {
    setSaving(true);
    
    try {
      // TODO: Implement API call to save story
      console.log('Saving story:', { ...formData, status });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to stories list
      router.push('/editor/stories');
    } catch (error) {
      console.error('Failed to save story:', error);
    } finally {
      setSaving(false);
    }
  };

  const isValid = formData.title.en.trim() && formData.title.tr.trim() && 
                  formData.shortDescription.en.trim() && formData.shortDescription.tr.trim() &&
                  formData.content.en.some(p => p.trim()) && formData.content.tr.some(p => p.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Story</h1>
          <p className="text-gray-600 mt-2">
            Write your bilingual story with English and Turkish versions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/editor/stories')}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Languages className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as 'en' | 'tr')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="tr">Turkish</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4">
                  <div>
                    <Label htmlFor="title-en">Title (English)</Label>
                    <Input
                      id="title-en"
                      value={formData.title.en}
                      onChange={(e) => handleTitleChange('en', e.target.value)}
                      placeholder="Enter story title in English"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="desc-en">Short Description (English)</Label>
                    <Textarea
                      id="desc-en"
                      value={formData.shortDescription.en}
                      onChange={(e) => handleDescriptionChange('en', e.target.value)}
                      placeholder="Brief description of your story"
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="tr" className="space-y-4">
                  <div>
                    <Label htmlFor="title-tr">Title (Turkish)</Label>
                    <Input
                      id="title-tr"
                      value={formData.title.tr}
                      onChange={(e) => handleTitleChange('tr', e.target.value)}
                      placeholder="Enter story title in Turkish"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="desc-tr">Short Description (Turkish)</Label>
                    <Textarea
                      id="desc-tr"
                      value={formData.shortDescription.tr}
                      onChange={(e) => handleDescriptionChange('tr', e.target.value)}
                      placeholder="Brief description of your story in Turkish"
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-title"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Auto-generated from English title
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Story Content */}
          <Card>
            <CardHeader>
              <CardTitle>Story Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as 'en' | 'tr')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="en">English Content</TabsTrigger>
                  <TabsTrigger value="tr">Turkish Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4">
                  <div className="space-y-3">
                    {formData.content.en.map((paragraph, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`para-en-${index}`} className="text-xs text-gray-500">
                            Paragraph {index + 1}
                          </Label>
                          <Textarea
                            id={`para-en-${index}`}
                            value={paragraph}
                            onChange={(e) => handleContentChange('en', index, e.target.value)}
                            placeholder={`Enter paragraph ${index + 1} in English`}
                            rows={3}
                          />
                        </div>
                        <div className="flex flex-col gap-1 pt-5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addParagraph('en')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {formData.content.en.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeParagraph('en', index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="tr" className="space-y-4">
                  <div className="space-y-3">
                    {formData.content.tr.map((paragraph, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`para-tr-${index}`} className="text-xs text-gray-500">
                            Paragraph {index + 1}
                          </Label>
                          <Textarea
                            id={`para-tr-${index}`}
                            value={paragraph}
                            onChange={(e) => handleContentChange('tr', index, e.target.value)}
                            placeholder={`Enter paragraph ${index + 1} in Turkish`}
                            rows={3}
                          />
                        </div>
                        <div className="flex flex-col gap-1 pt-5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addParagraph('tr')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {formData.content.tr.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeParagraph('tr', index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Validation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Story Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isValid ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Story is ready to save
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please fill in all required fields in both languages
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Publishing Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleSave('DRAFT')}
                disabled={!isValid || saving}
                variant="outline"
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save as Draft'}
              </Button>
              
              <Button
                onClick={() => handleSave('REVIEW')}
                disabled={!isValid || saving}
                variant="outline"
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
              
              <Button
                onClick={() => handleSave('PUBLISHED')}
                disabled={!isValid || saving}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Publish Now
              </Button>
            </CardContent>
          </Card>

          {/* Story Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>English words:</span>
                <span>{formData.content.en.join(' ').trim().split(/\s+/).filter(w => w).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Turkish words:</span>
                <span>{formData.content.tr.join(' ').trim().split(/\s+/).filter(w => w).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Paragraphs:</span>
                <span>EN: {formData.content.en.length} / TR: {formData.content.tr.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}