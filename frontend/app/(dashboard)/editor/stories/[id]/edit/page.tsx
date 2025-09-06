'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  CheckCircle2,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { mergeParagraphs, parseParagraphs, isValidContent, countWords, countParagraphs } from '@/lib/paragraph-utils';

interface StoryFormData {
  id: string;
  title: { en: string; tr: string };
  shortDescription: { en: string; tr: string };
  content: { en: string; tr: string }; // Changed to string instead of string[]
  slug: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  categoryIds: string[];
  tagIds: string[];
  authorIds: string[];
}

export default function EditStory() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'tr'>('en');
  const [formData, setFormData] = useState<StoryFormData | null>(null);

  useEffect(() => {
    // TODO: Fetch story data from API
    // Mock data for now
    setTimeout(() => {
      const mockStory: StoryFormData = {
        id: storyId,
        title: { en: 'The Magic Forest', tr: 'Sihirli Orman' },
        shortDescription: { 
          en: 'A story about a magical forest where dreams come true', 
          tr: 'Hayallerin gerçekleştiği sihirli bir orman hakkında hikaye' 
        },
        content: { 
          en: 'Once upon a time, there was a magical forest hidden deep in the mountains.\n\nThis forest was special because it had the power to make dreams come true.\n\nMany travelers had heard of this place, but few had ever found it.', 
          tr: 'Bir zamanlar, dağların derinliklerinde gizlenmiş sihirli bir orman vardı.\n\nBu orman özeldi çünkü hayalleri gerçekleştirme gücüne sahipti.\n\nBirçok yolcu bu yerden duymuştu, ancak çok azı onu bulabilmişti.' 
        },
        slug: 'the-magic-forest',
        status: 'DRAFT',
        categoryIds: [],
        tagIds: [],
        authorIds: []
      };
      setFormData(mockStory);
      setLoading(false);
    }, 1000);
  }, [storyId]);

  const handleTitleChange = (lang: 'en' | 'tr', value: string) => {
    if (!formData) return;
    
    setFormData(prev => prev ? ({
      ...prev,
      title: { ...prev.title, [lang]: value },
      // Auto-generate slug from English title
      slug: lang === 'en' ? value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim() : prev.slug
    }) : prev);
  };

  const handleDescriptionChange = (lang: 'en' | 'tr', value: string) => {
    if (!formData) return;
    
    setFormData(prev => prev ? ({
      ...prev,
      shortDescription: { ...prev.shortDescription, [lang]: value }
    }) : prev);
  };

  const handleContentChange = (lang: 'en' | 'tr', value: string) => {
    if (!formData) return;
    
    setFormData(prev => prev ? ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: value
      }
    }) : prev);
  };

  const handleSave = async (newStatus?: 'DRAFT' | 'REVIEW' | 'PUBLISHED') => {
    if (!formData) return;
    
    setSaving(true);
    
    try {
      const statusToSave = newStatus || formData.status;
      
      // Convert content strings to paragraph arrays before sending to API
      const storyData = {
        ...formData,
        content: {
          en: parseParagraphs(formData.content.en),
          tr: parseParagraphs(formData.content.tr)
        },
        status: statusToSave
      };
      
      console.log('Updating story:', storyData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local status if changed
      if (newStatus) {
        setFormData(prev => prev ? { ...prev, status: newStatus } : prev);
      }
      
      // Show success message or redirect
      if (newStatus === 'PUBLISHED') {
        router.push('/editor/stories');
      }
    } catch (error) {
      console.error('Failed to update story:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Story not found</p>
        <Link href="/editor/stories">
          <Button className="mt-4">Back to Stories</Button>
        </Link>
      </div>
    );
  }

  const isValid = formData.title.en.trim() && formData.title.tr.trim() && 
                  formData.shortDescription.en.trim() && formData.shortDescription.tr.trim() &&
                  isValidContent(formData.content.en) && isValidContent(formData.content.tr);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/editor/stories">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Story
              </h1>
              <Badge className={getStatusColor(formData.status)}>
                {formData.status}
              </Badge>
            </div>
            <p className="text-gray-600 mt-2">
              {formData.title.en || 'Untitled Story'}
            </p>
          </div>
        </div>
      </div>

      {/* Form - Same structure as new story */}
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
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, slug: e.target.value }) : prev)}
                  placeholder="url-friendly-title"
                />
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
                  <div>
                    <Label htmlFor="content-en">English Content</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Write your story content. Separate paragraphs with double line breaks (press Enter twice).
                    </p>
                    <Textarea
                      id="content-en"
                      value={formData.content.en}
                      onChange={(e) => handleContentChange('en', e.target.value)}
                      placeholder="Write your story in English here...

Separate each paragraph with double line breaks like this.

This makes it easy to write longer stories without managing individual text boxes."
                      rows={12}
                      className="min-h-[300px] resize-y"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="tr" className="space-y-4">
                  <div>
                    <Label htmlFor="content-tr">Turkish Content</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Hikayenizi Türkçe olarak yazın. Paragrafları çift satır arası ile ayırın (iki kez Enter'a basın).
                    </p>
                    <Textarea
                      id="content-tr"
                      value={formData.content.tr}
                      onChange={(e) => handleContentChange('tr', e.target.value)}
                      placeholder="Hikayenizi buraya Türkçe olarak yazın...

Her paragrafı böyle çift satır arası ile ayırın.

Bu uzun hikayeler yazmayı kolaylaştırır ve bireysel metin kutularını yönetmek zorunda kalmazsınız."
                      rows={12}
                      className="min-h-[300px] resize-y"
                    />
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
                    Please fill in all required fields
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-sm text-gray-600">
                Current status: <Badge className={getStatusColor(formData.status)}>
                  {formData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleSave()}
                disabled={!isValid || saving}
                variant="outline"
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              
              {formData.status !== 'REVIEW' && (
                <Button
                  onClick={() => handleSave('REVIEW')}
                  disabled={!isValid || saving}
                  variant="outline"
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              )}
              
              {formData.status !== 'PUBLISHED' && (
                <Button
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={!isValid || saving}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>
              )}
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
                <span>{countWords(formData.content.en)}</span>
              </div>
              <div className="flex justify-between">
                <span>Turkish words:</span>
                <span>{countWords(formData.content.tr)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paragraphs:</span>
                <span>EN: {countParagraphs(formData.content.en)} / TR: {countParagraphs(formData.content.tr)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}