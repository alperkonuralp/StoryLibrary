'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Tag {
  id: string;
  name: {
    en: string;
    tr: string;
  };
  slug: string;
  color?: string;
  createdAt: string;
}

interface EditTagDialogProps {
  tag: Tag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tagData: any) => void;
}

export function EditTagDialog({ tag, open, onOpenChange, onSave }: EditTagDialogProps) {
  const [formData, setFormData] = useState({
    name: {
      en: '',
      tr: ''
    },
    slug: '',
    color: '#3b82f6' // Default blue color
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: {
          en: tag.name?.en || '',
          tr: tag.name?.tr || ''
        },
        slug: tag.slug || '',
        color: tag.color || '#3b82f6'
      });
    } else {
      // Reset form for new tag
      setFormData({
        name: {
          en: '',
          tr: ''
        },
        slug: '',
        color: '#3b82f6'
      });
    }
  }, [tag, open]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (lang: 'en' | 'tr', value: string) => {
    const newFormData = {
      ...formData,
      name: { ...formData.name, [lang]: value }
    };
    
    // Auto-generate slug from English name
    if (lang === 'en' && value) {
      newFormData.slug = generateSlug(value);
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.en.trim() || !formData.name.tr.trim()) {
      alert('Please provide names in both languages');
      return;
    }

    onSave(formData);
  };

  const predefinedColors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tag ? 'Edit Tag' : 'Create New Tag'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* English Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-en" className="text-right text-sm font-medium">
                Name (EN)
              </Label>
              <div className="col-span-3">
                <Input
                  id="name-en"
                  value={formData.name.en}
                  onChange={(e) => handleNameChange('en', e.target.value)}
                  placeholder="Tag name in English"
                  required
                />
              </div>
            </div>

            {/* Turkish Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-tr" className="text-right text-sm font-medium">
                Name (TR)
              </Label>
              <div className="col-span-3">
                <Input
                  id="name-tr"
                  value={formData.name.tr}
                  onChange={(e) => handleNameChange('tr', e.target.value)}
                  placeholder="Tag name in Turkish"
                  required
                />
              </div>
            </div>

            {/* Slug */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right text-sm font-medium">
                Slug
              </Label>
              <div className="col-span-3">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="tag-url-slug"
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm font-medium">
                Color
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-9 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm font-medium">
                Preview
              </Label>
              <div className="col-span-3">
                <div className="flex gap-2">
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.name.en || 'English Name'}
                  </span>
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.name.tr || 'Turkish Name'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {tag ? 'Update Tag' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}