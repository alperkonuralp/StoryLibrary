import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface StoryContent {
  en: string[];
  tr: string[];
}

interface StoryData {
  id?: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  content: StoryContent;
  categoryIds: string[];
  tagIds: string[];
  authorIds: Array<{
    id: string;
    role: 'author' | 'co-author' | 'translator';
  }>;
  seriesId?: string;
  seriesOrder?: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  metadata?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    ageGroup?: string;
    themes?: string[];
  };
}

interface UseStoryEditorReturn {
  story: StoryData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDirty: boolean;
  validationErrors: Record<string, string>;
  loadStory: (id: string) => Promise<void>;
  createNewStory: () => void;
  updateField: <K extends keyof StoryData>(field: K, value: StoryData[K]) => void;
  updateBilingualField: (field: 'title' | 'shortDescription', language: 'en' | 'tr', value: string) => void;
  updateContent: (language: 'en' | 'tr', paragraphs: string[]) => void;
  addParagraph: (language: 'en' | 'tr', index?: number) => void;
  removeParagraph: (language: 'en' | 'tr', index: number) => void;
  moveParagraph: (language: 'en' | 'tr', fromIndex: number, toIndex: number) => void;
  saveStory: () => Promise<boolean>;
  publishStory: () => Promise<boolean>;
  deleteStory: () => Promise<boolean>;
  validateStory: () => boolean;
  resetChanges: () => void;
  duplicateStory: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const DEFAULT_STORY: StoryData = {
  title: { en: '', tr: '' },
  shortDescription: { en: '', tr: '' },
  content: { en: [''], tr: [''] },
  categoryIds: [],
  tagIds: [],
  authorIds: [],
  status: 'draft',
  metadata: {
    difficulty: 'beginner',
    ageGroup: 'all',
    themes: [],
  },
};

export const useStoryEditor = (): UseStoryEditorReturn => {
  const { token, user } = useAuth();
  const [story, setStory] = useState<StoryData | null>(null);
  const [originalStory, setOriginalStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate if story has unsaved changes
  const isDirty = story && originalStory ? 
    JSON.stringify(story) !== JSON.stringify(originalStory) : false;

  const loadStory = useCallback(async (id: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stories/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load story: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const storyData = data.data;
        setStory(storyData);
        setOriginalStory(JSON.parse(JSON.stringify(storyData)));
      } else {
        throw new Error(data.message || 'Failed to load story');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createNewStory = useCallback(() => {
    const newStory = {
      ...DEFAULT_STORY,
      authorIds: user ? [{ id: user.id, role: 'author' as const }] : [],
    };
    setStory(newStory);
    setOriginalStory(JSON.parse(JSON.stringify(newStory)));
    setError(null);
    setValidationErrors({});
  }, [user]);

  const updateField = useCallback(<K extends keyof StoryData>(field: K, value: StoryData[K]) => {
    if (!story) return;
    
    setStory(prev => prev ? { ...prev, [field]: value } : prev);
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  }, [story]);

  const updateBilingualField = useCallback((
    field: 'title' | 'shortDescription',
    language: 'en' | 'tr',
    value: string
  ) => {
    if (!story) return;

    setStory(prev => prev ? {
      ...prev,
      [field]: { ...prev[field], [language]: value }
    } : prev);
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  }, [story]);

  const updateContent = useCallback((language: 'en' | 'tr', paragraphs: string[]) => {
    if (!story) return;

    setStory(prev => prev ? {
      ...prev,
      content: { ...prev.content, [language]: paragraphs }
    } : prev);
    setValidationErrors(prev => ({ ...prev, content: '' }));
  }, [story]);

  const addParagraph = useCallback((language: 'en' | 'tr', index?: number) => {
    if (!story) return;

    const currentParagraphs = story.content[language];
    const insertIndex = index !== undefined ? index : currentParagraphs.length;
    const newParagraphs = [
      ...currentParagraphs.slice(0, insertIndex),
      '',
      ...currentParagraphs.slice(insertIndex),
    ];

    updateContent(language, newParagraphs);
  }, [story, updateContent]);

  const removeParagraph = useCallback((language: 'en' | 'tr', index: number) => {
    if (!story) return;

    const currentParagraphs = story.content[language];
    if (currentParagraphs.length <= 1) return; // Don't allow removing the last paragraph

    const newParagraphs = currentParagraphs.filter((_, i) => i !== index);
    updateContent(language, newParagraphs);
  }, [story, updateContent]);

  const moveParagraph = useCallback((
    language: 'en' | 'tr',
    fromIndex: number,
    toIndex: number
  ) => {
    if (!story) return;

    const currentParagraphs = [...story.content[language]];
    const [movedParagraph] = currentParagraphs.splice(fromIndex, 1);
    if (movedParagraph !== undefined) {
      currentParagraphs.splice(toIndex, 0, movedParagraph);
    }

    updateContent(language, currentParagraphs);
  }, [story, updateContent]);

  const validateStory = useCallback((): boolean => {
    if (!story) return false;

    const errors: Record<string, string> = {};

    // Title validation
    if (!story.title.en?.trim() && !story.title.tr?.trim()) {
      errors.title = 'Title is required in at least one language';
    }

    // Description validation
    if (!story.shortDescription.en?.trim() && !story.shortDescription.tr?.trim()) {
      errors.shortDescription = 'Description is required in at least one language';
    }

    // Content validation
    const hasEnContent = story.content.en.some(p => p.trim());
    const hasTrContent = story.content.tr.some(p => p.trim());
    if (!hasEnContent && !hasTrContent) {
      errors.content = 'Story content is required in at least one language';
    }

    // Category validation
    if (story.categoryIds.length === 0) {
      errors.categoryIds = 'At least one category is required';
    }

    // Author validation
    if (story.authorIds.length === 0) {
      errors.authorIds = 'At least one author is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [story]);

  const saveStory = useCallback(async (): Promise<boolean> => {
    if (!story || !token) return false;

    if (!validateStory()) return false;

    try {
      setSaving(true);
      setError(null);

      const method = story.id ? 'PUT' : 'POST';
      const url = story.id 
        ? `${API_BASE_URL}/stories/${story.id}`
        : `${API_BASE_URL}/stories`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(story),
      });

      if (!response.ok) {
        throw new Error(`Failed to save story: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const savedStory = data.data;
        setStory(savedStory);
        setOriginalStory(JSON.parse(JSON.stringify(savedStory)));
        return true;
      } else {
        throw new Error(data.message || 'Failed to save story');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story');
      return false;
    } finally {
      setSaving(false);
    }
  }, [story, token, validateStory]);

  const publishStory = useCallback(async (): Promise<boolean> => {
    if (!story || !token) return false;

    try {
      setSaving(true);
      setError(null);

      // First save the story if it has changes
      if (isDirty) {
        const saved = await saveStory();
        if (!saved) return false;
      }

      const response = await fetch(`${API_BASE_URL}/stories/${story.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to publish story: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const publishedStory = data.data;
        setStory(publishedStory);
        setOriginalStory(JSON.parse(JSON.stringify(publishedStory)));
        return true;
      } else {
        throw new Error(data.message || 'Failed to publish story');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish story');
      return false;
    } finally {
      setSaving(false);
    }
  }, [story, token, isDirty, saveStory]);

  const deleteStory = useCallback(async (): Promise<boolean> => {
    if (!story?.id || !token) return false;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stories/${story.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete story: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStory(null);
        setOriginalStory(null);
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete story');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story');
      return false;
    } finally {
      setSaving(false);
    }
  }, [story, token]);

  const resetChanges = useCallback(() => {
    if (originalStory) {
      setStory(JSON.parse(JSON.stringify(originalStory)));
      setError(null);
      setValidationErrors({});
    }
  }, [originalStory]);

  const duplicateStory = useCallback(() => {
    if (!story) return;

    const { id, publishedAt, ...storyWithoutId } = story;
    const duplicatedStory = {
      ...storyWithoutId,
      title: {
        en: `${story.title.en} (Copy)`,
        tr: `${story.title.tr} (Kopya)`,
      },
      status: 'draft' as const,
    };

    setStory(duplicatedStory);
    setOriginalStory(null); // Mark as new story
    setError(null);
    setValidationErrors({});
  }, [story]);

  // Auto-save functionality (optional)
  useEffect(() => {
    if (!isDirty || !story?.id) return;

    const autoSaveTimer = setTimeout(() => {
      if (validateStory()) {
        saveStory();
      }
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, story, validateStory, saveStory]);

  return {
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
  };
};