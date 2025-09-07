'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Save, 
  Camera,
  Shield,
  Settings as SettingsIcon,
  Bell,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditorProfile {
  username: string;
  email: string;
  bio: { en: string; tr: string };
  avatar?: string;
  preferences: {
    notifications: {
      newComments: boolean;
      newRatings: boolean;
      publishReminders: boolean;
    };
    privacy: {
      showProfile: boolean;
      showStats: boolean;
    };
    editor: {
      defaultLanguage: 'en' | 'tr';
      autoSave: boolean;
    };
  };
}

export default function EditorSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<EditorProfile>({
    username: user?.username || '',
    email: user?.email || '',
    bio: { en: '', tr: '' },
    preferences: {
      notifications: {
        newComments: true,
        newRatings: true,
        publishReminders: false,
      },
      privacy: {
        showProfile: true,
        showStats: true,
      },
      editor: {
        defaultLanguage: 'en',
        autoSave: true,
      },
    },
  });

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // TODO: Implement API call to save settings
      console.log('Saving settings:', { section, profile });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editor Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile and editor preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Avatar
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG up to 2MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                    <Badge variant="secondary" className="absolute right-2 top-2">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bio in both languages */}
              <div className="space-y-4">
                <Label>Biography</Label>
                
                <div>
                  <Label htmlFor="bio-en" className="text-sm text-gray-600">
                    Biography (English)
                  </Label>
                  <Textarea
                    id="bio-en"
                    value={profile.bio.en}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      bio: { ...prev.bio, en: e.target.value }
                    }))}
                    placeholder="Write your biography in English"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio-tr" className="text-sm text-gray-600">
                    Biography (Turkish)
                  </Label>
                  <Textarea
                    id="bio-tr"
                    value={profile.bio.tr}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      bio: { ...prev.bio, tr: e.target.value }
                    }))}
                    placeholder="Write your biography in Turkish"
                    rows={3}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('profile')} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editor Preferences Tab */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Editor Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-language">Default Language</Label>
                  <select
                    id="default-language"
                    value={profile.preferences.editor.defaultLanguage}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        editor: {
                          ...prev.preferences.editor,
                          defaultLanguage: e.target.value as 'en' | 'tr'
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="en">English</option>
                    <option value="tr">Turkish</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Language that opens by default when creating/editing stories
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-save"
                    checked={profile.preferences.editor.autoSave}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        editor: {
                          ...prev.preferences.editor,
                          autoSave: e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="auto-save">Enable auto-save</Label>
                </div>
              </div>

              <Button onClick={() => handleSave('editor')} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="new-comments"
                    checked={profile.preferences.notifications.newComments}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: {
                          ...prev.preferences.notifications,
                          newComments: e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="new-comments">Email me about new comments on my stories</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="new-ratings"
                    checked={profile.preferences.notifications.newRatings}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: {
                          ...prev.preferences.notifications,
                          newRatings: e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="new-ratings">Email me about new ratings on my stories</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="publish-reminders"
                    checked={profile.preferences.notifications.publishReminders}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: {
                          ...prev.preferences.notifications,
                          publishReminders: e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="publish-reminders">Remind me about unpublished drafts</Label>
                </div>
              </div>

              <Button onClick={() => handleSave('notifications')} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notifications'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-profile"
                    checked={profile.preferences.privacy.showProfile}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        privacy: {
                          ...prev.preferences.privacy,
                          showProfile: e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="show-profile">Show my profile publicly</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-stats"
                    checked={profile.preferences.privacy.showStats}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        privacy: {
                          ...prev.preferences.privacy,
                          showStats: e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="show-stats">Show story statistics publicly</Label>
                </div>
              </div>

              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Privacy settings affect how your author profile appears to readers on the public site.
                </AlertDescription>
              </Alert>

              <Button onClick={() => handleSave('privacy')} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}