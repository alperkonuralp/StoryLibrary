'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Eye, 
  Trash2, 
  Plus, 
  GripVertical, 
  Languages, 
  Settings,
  AlertCircle,
  CheckCircle2,
  Globe,
  BookOpen,
  Users,
  Tag,
  Folder
} from 'lucide-react';
import { useStoryEditor } from '@/hooks/useStoryEditor';
import { useCategories } from '@/hooks/useCategories';
import { useAuthors } from '@/hooks/useAuthors';
import { useTags } from '@/hooks/useTags';

interface StoryEditorFormProps {
  storyId?: string;
  onSave?: () => void;
  onPublish?: () => void;
  onCancel?: () => void;
  className?: string;
}


export function StoryEditorForm({
  storyId,
  onSave,
  onPublish,
  onCancel,
  className = '',
}: StoryEditorFormProps) {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'tr'>('en');
  const [showPreview, setShowPreview] = useState(false);

  const {
    story,
    loading,
    saving,
    error,
    isDirty,
    validationErrors,
    loadStory,
    createNewStory,
    updateField,
    updateBilingualField,
    updateContent,
    addParagraph,
    removeParagraph,
    moveParagraph,
    saveStory,
    publishStory,
    deleteStory,
    validateStory,
    resetChanges,
    duplicateStory,
  } = useStoryEditor();

  const { categories, loading: categoriesLoading } = useCategories();
  const { authors, loading: authorsLoading } = useAuthors();
  const { tags, loading: tagsLoading } = useTags();

  // Load story on mount if editing
  React.useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    } else {
      createNewStory();
    }
  }, [storyId, loadStory, createNewStory]);

  const handleSave = async () => {
    const success = await saveStory();
    if (success) {
      onSave?.();
    }
  };

  const handlePublish = async () => {
    const success = await publishStory();
    if (success) {
      onPublish?.();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      const success = await deleteStory();
      if (success) {
        onCancel?.();
      }
    }
  };

  const handleParagraphChange = (index: number, value: string) => {
    if (!story) return;
    
    const newParagraphs = [...story.content[activeLanguage]];
    newParagraphs[index] = value;
    updateContent(activeLanguage, newParagraphs);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveParagraph(activeLanguage, dragIndex, dropIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading story...</span>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load story</p>
        <Button onClick={onCancel} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {storyId ? 'Edit Story' : 'Create New Story'}
          </h1>
          <Badge className={getStatusBadgeColor(story.status)}>
            {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
          </Badge>
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unsaved Changes
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>

          <Button
            variant="outline"
            onClick={duplicateStory}
            disabled={!storyId}
            size="sm"
          >
            Duplicate
          </Button>

          {isDirty && (
            <Button
              variant="outline"
              onClick={resetChanges}
              size="sm"
            >
              Reset
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={handlePublish}
            disabled={saving || !validateStory()}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Please fix the following errors:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              {Object.entries(validationErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="categorization" className="flex items-center">
            <Folder className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="authors" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Authors
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Title *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">English</label>
                    <Input
                      value={story.title.en}
                      onChange={(e) => updateBilingualField('title', 'en', e.target.value)}
                      placeholder="Enter English title"
                      className={validationErrors.title ? 'border-red-300' : ''}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Turkish</label>
                    <Input
                      value={story.title.tr}
                      onChange={(e) => updateBilingualField('title', 'tr', e.target.value)}
                      placeholder="Türkçe başlık girin"
                      className={validationErrors.title ? 'border-red-300' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Short Description *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">English</label>
                    <textarea
                      value={story.shortDescription.en}
                      onChange={(e) => updateBilingualField('shortDescription', 'en', e.target.value)}
                      placeholder="Enter English description"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        validationErrors.shortDescription ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Turkish</label>
                    <textarea
                      value={story.shortDescription.tr}
                      onChange={(e) => updateBilingualField('shortDescription', 'tr', e.target.value)}
                      placeholder="Türkçe açıklama girin"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        validationErrors.shortDescription ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Story Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Languages className="h-5 w-5 mr-2" />
                  Story Content *
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={activeLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('en')}
                  >
                    🇺🇸 English ({story.content.en.length} paragraphs)
                  </Button>
                  <Button
                    variant={activeLanguage === 'tr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('tr')}
                  >
                    🇹🇷 Turkish ({story.content.tr.length} paragraphs)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {story.content[activeLanguage].map((paragraph, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="flex items-center space-x-2 mt-2">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      <span className="text-xs text-gray-500 min-w-[20px]">{index + 1}</span>
                    </div>
                    
                    <textarea
                      value={paragraph}
                      onChange={(e) => handleParagraphChange(index, e.target.value)}
                      placeholder={`Enter paragraph ${index + 1} in ${activeLanguage === 'en' ? 'English' : 'Turkish'}...`}
                      rows={3}
                      className="flex-1 px-3 py-2 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    
                    <div className="flex flex-col space-y-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addParagraph(activeLanguage, index + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {story.content[activeLanguage].length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeParagraph(activeLanguage, index)}
                          className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => addParagraph(activeLanguage)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Paragraph
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Story Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Difficulty Level</label>
                <Select 
                  value={story.metadata?.difficulty || 'beginner'} 
                  onValueChange={(value) => updateField('metadata', { 
                    ...story.metadata, 
                    difficulty: value as 'beginner' | 'intermediate' | 'advanced' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Age Group</label>
                <Input
                  value={story.metadata?.ageGroup || 'all'}
                  onChange={(e) => updateField('metadata', { 
                    ...story.metadata, 
                    ageGroup: e.target.value 
                  })}
                  placeholder="e.g., 13+, All ages"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-700">Themes</label>
                <Input
                  value={story.metadata?.themes?.join(', ') || ''}
                  onChange={(e) => updateField('metadata', { 
                    ...story.metadata, 
                    themes: e.target.value.split(',').map(theme => theme.trim()).filter(Boolean)
                  })}
                  placeholder="adventure, friendship, mystery (comma-separated)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorization Tab */}
        <TabsContent value="categorization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categories & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Folder className="h-4 w-4 mr-1" />
                  Categories *
                </label>
                {categoriesLoading ? (
                  <div className="text-sm text-gray-500">Loading categories...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {categories?.map((category) => (
                      <label key={category.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={story.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateField('categoryIds', [...story.categoryIds, category.id]);
                            } else {
                              updateField('categoryIds', story.categoryIds.filter(id => id !== category.id));
                            }
                          }}
                        />
                        <span className="text-sm">{category.name.en || category.name.tr}</span>
                      </label>
                    ))}
                  </div>
                )}
                {validationErrors.categoryIds && (
                  <p className="text-sm text-red-600">{validationErrors.categoryIds}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Tags
                </label>
                {tagsLoading ? (
                  <div className="text-sm text-gray-500">Loading tags...</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {tags?.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={story.tagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateField('tagIds', [...story.tagIds, tag.id]);
                            } else {
                              updateField('tagIds', story.tagIds.filter(id => id !== tag.id));
                            }
                          }}
                        />
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name.en || tag.name.tr}
                        </Badge>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authors Tab */}
        <TabsContent value="authors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Story Authors *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {authorsLoading ? (
                <div className="text-sm text-gray-500">Loading authors...</div>
              ) : (
                <div className="space-y-4">
                  {/* Current Authors */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Selected Authors</label>
                    <div className="space-y-2">
                      {story.authorIds.map((authorRef, index) => {
                        const author = authors?.find(a => a.id === authorRef.id);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{author?.name || 'Unknown Author'}</span>
                              <Badge variant="outline">{authorRef.role}</Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newAuthorIds = story.authorIds.filter((_, i) => i !== index);
                                updateField('authorIds', newAuthorIds);
                              }}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Author */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Add Author</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select onValueChange={(authorId) => {
                        if (authorId && !story.authorIds.some(a => a.id === authorId)) {
                          updateField('authorIds', [
                            ...story.authorIds, 
                            { id: authorId, role: 'author' }
                          ]);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select author" />
                        </SelectTrigger>
                        <SelectContent>
                          {authors
                            ?.filter(author => !story.authorIds.some(a => a.id === author.id))
                            .map((author) => (
                            <SelectItem key={author.id} value={author.id}>
                              {author.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {validationErrors.authorIds && (
                <p className="text-sm text-red-600">{validationErrors.authorIds}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center space-x-2">
          {storyId && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Story
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          <Button
            onClick={handlePublish}
            disabled={saving || !validateStory()}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Publish Story
          </Button>
        </div>
      </div>
    </div>
  );
}