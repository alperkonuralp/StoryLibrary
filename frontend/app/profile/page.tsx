'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  User, 
  BookOpen, 
 
  Star, 
  Lock,
  Trash2,
  Save,
  Edit3,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';

export default function ProfilePage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const { 
    profile, 
    stats, 
    loading, 
    error, 
    fetchProfile, 
    fetchStats, 
    updateProfile,
    changePassword,
    deleteAccount
  } = useUserProfile();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load profile and stats on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchStats();
    }
  }, [isAuthenticated, fetchProfile, fetchStats]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      username: profileForm.username
    });
    if (success) {
      setIsEditing(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return; // Handle error
    }
    const success = await changePassword(passwordForm);
    if (success) {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const success = await deleteAccount();
      if (success) {
        logout();
        router.push('/');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                <User className="h-8 w-8" />
                My Profile
              </h1>
              <p className="text-gray-600">Manage your account and reading statistics</p>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Profile Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{profile?.username || 'User'}</h3>
                    <p className="text-gray-500 text-sm">{profile?.email}</p>
                    <div className="flex justify-center mt-2">
                      <Badge variant={profile?.role === 'ADMIN' ? 'default' : 'secondary'} className="capitalize">
                        {profile?.role?.toLowerCase() || 'user'}
                        {profile?.role === 'ADMIN' && <Shield className="ml-1 h-3 w-3" />}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Member since</span>
                      <span>{profile ? formatDate(profile.createdAt) : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Last updated</span>
                      <span>{profile ? formatDate(profile.updatedAt) : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stories Started</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalStarted || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Total stories you've begun reading
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stories Completed</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCompleted || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Stories you've finished
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stories Rated</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalRatings || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Stories you've rated
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats?.averageRating ? Number(stats.averageRating).toFixed(1) : '0.0'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your average story rating
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Reading Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats?.recentProgress && stats.recentProgress.length > 0 ? (
                        <div className="space-y-4">
                          {stats.recentProgress.map((progress) => (
                            <div key={progress.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <Link 
                                  href={`/stories/${progress.story.slug}`}
                                  className="font-medium hover:underline"
                                >
                                  {progress.story.title?.en || progress.story.title?.tr || 'Untitled'}
                                </Link>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <Badge variant={progress.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                    {progress.status === 'COMPLETED' ? 'Completed' : 'Reading'}
                                  </Badge>
                                  <span>{Math.round(progress.completionPercentage)}% complete</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(progress.lastReadAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No reading activity yet</h3>
                          <p className="text-gray-500 mb-4">
                            Start reading stories to see your activity here.
                          </p>
                          <Link href="/stories">
                            <Button>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Browse Stories
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Profile Settings
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            type="text"
                            value={profileForm.username}
                            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            disabled
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500">Email cannot be changed</p>
                        </div>
                        {isEditing && (
                          <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  {/* Change Password */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={loading}>
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Delete Account</h4>
                          <p className="text-gray-600 text-sm mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteAccount}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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