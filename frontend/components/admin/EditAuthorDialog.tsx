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
import { Badge } from '@/components/ui/badge';

interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: {
    en?: string;
    tr?: string;
  };
  imageUrl?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EditAuthorDialogProps {
  author: Author | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (authorData: Partial<Author>) => void;
}

export function EditAuthorDialog({ author, open, onOpenChange, onSave }: EditAuthorDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    bioEn: '',
    bioTr: '',
    imageUrl: '',
    website: '',
    twitter: '',
    linkedin: '',
  });

  useEffect(() => {
    if (author) {
      setFormData({
        name: author.name || '',
        bioEn: author.bio?.en || '',
        bioTr: author.bio?.tr || '',
        imageUrl: author.imageUrl || '',
        website: author.socialLinks?.website || '',
        twitter: author.socialLinks?.twitter || '',
        linkedin: author.socialLinks?.linkedin || '',
      });
    } else {
      // Reset form for new author
      setFormData({
        name: '',
        bioEn: '',
        bioTr: '',
        imageUrl: '',
        website: '',
        twitter: '',
        linkedin: '',
      });
    }
  }, [author, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const authorData = {
      name: formData.name,
      bio: {
        en: formData.bioEn,
        tr: formData.bioTr,
      },
      imageUrl: formData.imageUrl || undefined,
      socialLinks: {
        website: formData.website || undefined,
        twitter: formData.twitter || undefined,
        linkedin: formData.linkedin || undefined,
      },
    };

    onSave(authorData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{author ? 'Edit Author' : 'Create New Author'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name *
              </label>
              <div className="col-span-3">
                <input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="imageUrl" className="text-right text-sm font-medium">
                Profile Image URL
              </label>
              <div className="col-span-3">
                <input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="bioEn" className="text-right text-sm font-medium mt-2">
                Bio (English)
              </label>
              <div className="col-span-3">
                <textarea
                  id="bioEn"
                  value={formData.bioEn}
                  onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Author's biography in English..."
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="bioTr" className="text-right text-sm font-medium mt-2">
                Bio (Turkish)
              </label>
              <div className="col-span-3">
                <textarea
                  id="bioTr"
                  value={formData.bioTr}
                  onChange={(e) => setFormData({ ...formData, bioTr: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Author's biography in Turkish..."
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Social Links</h4>
              
              <div className="grid grid-cols-4 items-center gap-4 mb-3">
                <label htmlFor="website" className="text-right text-sm font-medium">
                  Website
                </label>
                <div className="col-span-3">
                  <input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://authorwebsite.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4 mb-3">
                <label htmlFor="twitter" className="text-right text-sm font-medium">
                  Twitter
                </label>
                <div className="col-span-3">
                  <input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://twitter.com/authorname"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="linkedin" className="text-right text-sm font-medium">
                  LinkedIn
                </label>
                <div className="col-span-3">
                  <input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://linkedin.com/in/authorname"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{author ? 'Save Changes' : 'Create Author'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}