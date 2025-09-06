'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen,
  Calendar,
  Tags
} from 'lucide-react';

interface Category {
  id: string;
  name: { en: string; tr: string };
  description?: { en: string; tr: string };
  slug: string;
  createdAt: string;
  _count?: {
    stories: number;
  };
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    descriptionEn: '',
    descriptionTr: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data: CategoriesResponse = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: {
            en: formData.nameEn,
            tr: formData.nameTr
          },
          description: {
            en: formData.descriptionEn,
            tr: formData.descriptionTr
          }
        })
      });

      if (response.ok) {
        await fetchCategories();
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        throw new Error('Failed to create category');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: {
            en: formData.nameEn,
            tr: formData.nameTr
          },
          description: {
            en: formData.descriptionEn,
            tr: formData.descriptionTr
          }
        })
      });

      if (response.ok) {
        await fetchCategories();
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        resetForm();
      } else {
        throw new Error('Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nameEn: category.name.en,
      nameTr: category.name.tr,
      descriptionEn: category.description?.en || '',
      descriptionTr: category.description?.tr || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameTr: '',
      descriptionEn: '',
      descriptionTr: ''
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.name.tr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CategoryForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <form onSubmit={isEdit ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameEn">English Name</Label>
          <Input
            id="nameEn"
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            placeholder="Category name in English"
            required
          />
        </div>
        <div>
          <Label htmlFor="nameTr">Turkish Name</Label>
          <Input
            id="nameTr"
            value={formData.nameTr}
            onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
            placeholder="Category name in Turkish"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="descriptionEn">English Description</Label>
          <Textarea
            id="descriptionEn"
            value={formData.descriptionEn}
            onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
            placeholder="Category description in English"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="descriptionTr">Turkish Description</Label>
          <Textarea
            id="descriptionTr"
            value={formData.descriptionTr}
            onChange={(e) => setFormData({ ...formData, descriptionTr: e.target.value })}
            placeholder="Category description in Turkish"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingCategory(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">
            Manage story categories for better organization and discovery.
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Create a new category for organizing stories. Provide names in both English and Turkish.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tags className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No categories found' : 'No categories yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `No categories match your search "${searchTerm}"`
              : 'Start by creating your first category'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              Create Category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(category => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{category.name.en}</CardTitle>
                    {category.name.tr !== category.name.en && (
                      <p className="text-sm text-gray-600 mt-1">{category.name.tr}</p>
                    )}
                    {category.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {category.description.en}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {category._count?.stories || 0} stories
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(category.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-3 w-3" />
                    <span>ID: {category.slug}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCategory(category.id, category.name.en)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information. Changes will affect all stories using this category.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Results count */}
      {filteredCategories.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-600">
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      )}
    </div>
  );
}