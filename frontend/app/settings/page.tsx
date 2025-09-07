'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { 
  Settings, 
  Globe, 
  Book, 
  Palette, 
  Bell, 
  Target,
  Download,
  Upload,
  RefreshCw,
  Volume2,
  Eye,
  Type,
  Moon,
  Sun,
  Monitor,
  Mail,
  Timer
} from 'lucide-react';

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const {
    settings,
    error,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings
  } = useSettings();

  const [activeTab, setActiveTab] = useState('general');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const success = await importSettings(file);
      if (success) {
        // Reset file input
        event.target.value = '';
      }
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      await resetSettings();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container py-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Settings className="h-8 w-8" />
                Settings
              </h1>
              <p className="text-gray-600">Customize your reading experience and preferences</p>
            </div>
          </div>

          {/* Settings Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {[
                      { id: 'general', label: 'General', icon: Settings },
                      { id: 'reading', label: 'Reading', icon: Book },
                      { id: 'appearance', label: 'Appearance', icon: Palette },
                      { id: 'notifications', label: 'Notifications', icon: Bell },
                      { id: 'goals', label: 'Goals & Progress', icon: Target }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                          activeTab === tab.id 
                            ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Language & Region
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Interface Language</Label>
                          <Select
                            value={settings.language}
                            onValueChange={(value: 'en' | 'tr') => updateSetting('language', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">🇺🇸 English</SelectItem>
                              <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Default Reading Language</Label>
                          <Select
                            value={settings.defaultReadingLanguage}
                            onValueChange={(value: 'en' | 'tr' | 'bilingual') => updateSetting('defaultReadingLanguage', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English Only</SelectItem>
                              <SelectItem value="tr">Turkish Only</SelectItem>
                              <SelectItem value="bilingual">Bilingual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Settings Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          onClick={exportSettings}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Settings
                        </Button>
                        
                        <div className="relative">
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('settings-file-input')?.click()}
                            className="flex items-center gap-2 w-full"
                          >
                            <Upload className="h-4 w-4" />
                            Import Settings
                          </Button>
                          <input
                            id="settings-file-input"
                            type="file"
                            accept=".json"
                            onChange={handleFileImport}
                            className="hidden"
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reset to Default
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Reading Settings */}
              {activeTab === 'reading' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        Reading Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Auto-play Audio
                          </Label>
                          <p className="text-sm text-gray-600">Automatically play pronunciation audio</p>
                        </div>
                        <Switch
                          checked={settings.autoPlayAudio}
                          onCheckedChange={(checked) => updateSetting('autoPlayAudio', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Show Translations
                          </Label>
                          <p className="text-sm text-gray-600">Show paragraph translations while reading</p>
                        </div>
                        <Switch
                          checked={settings.showTranslations}
                          onCheckedChange={(checked) => updateSetting('showTranslations', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Auto-bookmark Progress</Label>
                          <p className="text-sm text-gray-600">Automatically bookmark stories you start reading</p>
                        </div>
                        <Switch
                          checked={settings.autoBookmark}
                          onCheckedChange={(checked) => updateSetting('autoBookmark', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Visual Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select
                          value={settings.theme}
                          onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4" />
                                Light
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4" />
                                Dark
                              </div>
                            </SelectItem>
                            <SelectItem value="system">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                System
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Font Size
                        </Label>
                        <Select
                          value={settings.fontSize}
                          onValueChange={(value: 'small' | 'medium' | 'large') => updateSetting('fontSize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Notifications
                          </Label>
                          <p className="text-sm text-gray-600">Receive email updates and newsletters</p>
                        </div>
                        <Switch
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            Progress Reminders
                          </Label>
                          <p className="text-sm text-gray-600">Get reminders to continue reading</p>
                        </div>
                        <Switch
                          checked={settings.progressReminders}
                          onCheckedChange={(checked) => updateSetting('progressReminders', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>New Story Notifications</Label>
                          <p className="text-sm text-gray-600">Be notified when new stories are published</p>
                        </div>
                        <Switch
                          checked={settings.newStoryNotifications}
                          onCheckedChange={(checked) => updateSetting('newStoryNotifications', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Goals Settings */}
              {activeTab === 'goals' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Reading Goals & Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Daily Reading Goal (minutes)</Label>
                          <div className="px-4">
                            <Slider
                              value={[settings.dailyGoal]}
                              onValueChange={([value]) => value !== undefined && updateSetting('dailyGoal', value)}
                              max={120}
                              min={5}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>5 min</span>
                              <span className="font-medium text-blue-600">{settings.dailyGoal} minutes</span>
                              <span>120 min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Show Reading Statistics</Label>
                          <p className="text-sm text-gray-600">Display reading stats and progress charts</p>
                        </div>
                        <Switch
                          checked={settings.showReadingStats}
                          onCheckedChange={(checked) => updateSetting('showReadingStats', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}