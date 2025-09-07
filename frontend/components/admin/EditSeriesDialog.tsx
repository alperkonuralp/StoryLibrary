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

interface Series {
  id: string;
  name: {
    en: string;
    tr: string;
  };
  description: {
    en: string;
    tr: string;
  };
  slug: string;
  stories?: any[];
  _count?: {
    stories: number;
  };
  createdAt: string;
}

interface EditSeriesDialogProps {
  series: Series | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (seriesData: Partial<Series>) => void;
}

export function EditSeriesDialog({ series, open, onOpenChange, onSave }: EditSeriesDialogProps) {
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    descriptionEn: '',
    descriptionTr: '',
  });

  useEffect(() => {
    if (series) {
      setFormData({
        nameEn: series.name?.en || '',
        nameTr: series.name?.tr || '',
        descriptionEn: series.description?.en || '',
        descriptionTr: series.description?.tr || '',
      });
    } else {
      // Reset form for new series
      setFormData({
        nameEn: '',
        nameTr: '',
        descriptionEn: '',
        descriptionTr: '',
      });
    }
  }, [series, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const seriesData = {
      name: {
        en: formData.nameEn,
        tr: formData.nameTr,
      },
      description: {
        en: formData.descriptionEn,
        tr: formData.descriptionTr,
      },
    };

    onSave(seriesData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{series ? 'Edit Series' : 'Create New Series'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="nameEn" className="text-right text-sm font-medium">
                Name (English) *
              </label>
              <div className="col-span-3">
                <input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  placeholder="Series name in English"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="nameTr" className="text-right text-sm font-medium">
                Name (Turkish) *
              </label>
              <div className="col-span-3">
                <input
                  id="nameTr"
                  value={formData.nameTr}
                  onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  placeholder="Series name in Turkish"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="descriptionEn" className="text-right text-sm font-medium mt-2">
                Description (English) *
              </label>
              <div className="col-span-3">
                <textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  placeholder="Describe the series in English..."
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="descriptionTr" className="text-right text-sm font-medium mt-2">
                Description (Turkish) *
              </label>
              <div className="col-span-3">
                <textarea
                  id="descriptionTr"
                  value={formData.descriptionTr}
                  onChange={(e) => setFormData({ ...formData, descriptionTr: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  placeholder="Describe the series in Turkish..."
                />
              </div>
            </div>

            {series && series.stories && series.stories.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Stories in this Series ({series.stories.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {series.stories.map((storySeries) => (
                    <div key={storySeries.storyId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{storySeries.orderInSeries}</Badge>
                        <span className="text-sm">
                          {storySeries.story?.title?.en || storySeries.story?.title?.tr || 'Untitled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{series ? 'Save Changes' : 'Create Series'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}