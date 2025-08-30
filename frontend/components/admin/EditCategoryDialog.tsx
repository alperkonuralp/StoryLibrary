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
import { Textarea } from '@/components/ui/textarea';

interface Category {
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

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoryData: any) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange, onSave }: EditCategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: {
      en: '',
      tr: ''
    },
    description: {
      en: '',
      tr: ''
    },
    slug: ''
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: {
          en: category.name?.en || '',
          tr: category.name?.tr || ''
        },
        description: {
          en: category.description?.en || '',
          tr: category.description?.tr || ''
        },
        slug: category.slug || ''
      });
    } else {
      // Reset form for new category
      setFormData({
        name: {
          en: '',
          tr: ''
        },
        description: {
          en: '',
          tr: ''
        },
        slug: ''
      });
    }
  }, [category, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
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
                  placeholder="Category name in English"
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
                  placeholder="Category name in Turkish"
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
                  placeholder="category-url-slug"
                />
              </div>
            </div>

            {/* English Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc-en" className="text-right text-sm font-medium">
                Description (EN)
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="desc-en"
                  value={formData.description.en}
                  onChange={(e) => setFormData({
                    ...formData,
                    description: { ...formData.description, en: e.target.value }
                  })}
                  placeholder="Category description in English"
                  rows={3}
                />
              </div>
            </div>

            {/* Turkish Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc-tr" className="text-right text-sm font-medium">
                Description (TR)
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="desc-tr"
                  value={formData.description.tr}
                  onChange={(e) => setFormData({
                    ...formData,
                    description: { ...formData.description, tr: e.target.value }
                  })}
                  placeholder="Category description in Turkish"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}