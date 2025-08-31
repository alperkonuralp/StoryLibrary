import { useState, useEffect, useCallback } from 'react';

// Types
interface UserSettings {
  language: 'en' | 'tr';
  defaultReadingLanguage: 'en' | 'tr' | 'bilingual';
  autoPlayAudio: boolean;
  showTranslations: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  progressReminders: boolean;
  newStoryNotifications: boolean;
  dailyGoal: number; // minutes per day
  autoBookmark: boolean;
  showReadingStats: boolean;
}

const defaultSettings: UserSettings = {
  language: 'en',
  defaultReadingLanguage: 'en',
  autoPlayAudio: false,
  showTranslations: true,
  fontSize: 'medium',
  theme: 'light',
  emailNotifications: true,
  progressReminders: true,
  newStoryNotifications: false,
  dailyGoal: 30,
  autoBookmark: false,
  showReadingStats: true,
};

// Settings hook
export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setSettings(defaultSettings);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      // Update state
      setSettings(updatedSettings);
      
      // Apply theme changes immediately
      if (newSettings.theme) {
        applyTheme(newSettings.theme);
      }
      
      // Apply font size changes
      if (newSettings.fontSize) {
        applyFontSize(newSettings.fontSize);
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      console.error('Error saving settings:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Reset settings to default
  const resetSettings = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      localStorage.removeItem('userSettings');
      setSettings(defaultSettings);
      applyTheme(defaultSettings.theme);
      applyFontSize(defaultSettings.fontSize);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to reset settings');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update single setting
  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ): Promise<boolean> => {
    return await saveSettings({ [key]: value });
  }, [saveSettings]);

  // Apply theme to document
  const applyTheme = useCallback((theme: UserSettings['theme']) => {
    if (theme === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, []);

  // Apply font size to document
  const applyFontSize = useCallback((fontSize: UserSettings['fontSize']) => {
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (fontSize) {
      case 'small':
        document.documentElement.classList.add('text-sm');
        break;
      case 'large':
        document.documentElement.classList.add('text-lg');
        break;
      default:
        document.documentElement.classList.add('text-base');
    }
  }, []);

  // Apply settings on mount
  useEffect(() => {
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
  }, [settings.theme, settings.fontSize, applyTheme, applyFontSize]);

  // Export settings as JSON
  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'story-library-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [settings]);

  // Import settings from JSON
  const importSettings = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate imported settings
      const validSettings = { ...defaultSettings };
      for (const key in importedSettings) {
        if (key in defaultSettings) {
          validSettings[key as keyof UserSettings] = importedSettings[key];
        }
      }
      
      return await saveSettings(validSettings);
    } catch (err: any) {
      setError('Invalid settings file');
      return false;
    }
  }, [saveSettings]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
    defaultSettings,
  };
};