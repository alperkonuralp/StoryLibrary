'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  PlusCircle, 
  Eye, 
  Star, 
  TrendingUp,
  Clock,
  Users,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalStories: number;
  publishedStories: number;
  draftStories: number;
  totalViews: number;
  averageRating: number;
  totalRatings: number;
}

export default function EditorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    publishedStories: 0,
    draftStories: 0,
    totalViews: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual stats from API
    // For now, using mock data
    setTimeout(() => {
      setStats({
        totalStories: 12,
        publishedStories: 8,
        draftStories: 4,
        totalViews: 1547,
        averageRating: 4.3,
        totalRatings: 89
      });
      setLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    {
      title: 'Total Stories',
      value: stats.totalStories,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Published',
      value: stats.publishedStories,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Drafts',
      value: stats.draftStories,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Total Ratings',
      value: stats.totalRatings,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your content performance
          </p>
        </div>
        
        <Link href="/editor/stories/new">
          <Button size="lg" className="shadow-sm">
            <PlusCircle className="h-5 w-5 mr-2" />
            New Story
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '-' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/editor/stories/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Story
              </Button>
            </Link>
            
            <Link href="/editor/stories" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Stories
              </Button>
            </Link>
            
            <Link href="/editor/stories?status=draft" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Continue Drafts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Story "The Coffee Shop" received 5 new ratings</p>
                  <p>• Draft "Learning AI" was updated 2 hours ago</p>
                  <p>• "Startup Journey" reached 100 views</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}