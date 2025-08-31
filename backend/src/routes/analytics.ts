import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/user - Get user reading analytics
router.get('/user', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days
    
    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user progress data
    const progressData = await prisma.userReadingProgress.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
        },
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            statistics: true,
          },
        },
      },
    });

    // Get bookmarks count
    const bookmarksCount = await prisma.userBookmark.count({
      where: { userId },
    });

    // Get ratings count
    const ratingsCount = await prisma.userStoryRating.count({
      where: { userId },
    });

    // Calculate analytics
    const totalStoriesStarted = progressData.length;
    const totalStoriesCompleted = progressData.filter(p => p.status === 'COMPLETED').length;
    const totalReadingTime = progressData.reduce((sum, p) => sum + (p.readingTimeSeconds || 0), 0);
    const totalWordsRead = progressData.reduce((sum, p) => sum + (p.wordsRead || 0), 0);
    
    // Calculate completion rate
    const completionRate = totalStoriesStarted > 0 ? 
      (totalStoriesCompleted / totalStoriesStarted) * 100 : 0;

    // Calculate average reading time per story
    const avgReadingTimePerStory = totalStoriesCompleted > 0 ? 
      totalReadingTime / totalStoriesCompleted : 0;

    // Language preference analysis
    const languageStats = progressData.reduce((stats, p) => {
      if (p.language) {
        stats[p.language] = (stats[p.language] || 0) + 1;
      }
      return stats;
    }, {} as Record<string, number>);

    // Recent activity (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    
    const recentActivity = await prisma.userReadingProgress.findMany({
      where: {
        userId,
        lastReadAt: {
          gte: recentDate,
        },
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        lastReadAt: 'desc',
      },
      take: 10,
    });

    // Reading streak calculation
    const allProgress = await prisma.userReadingProgress.findMany({
      where: { userId },
      orderBy: { lastReadAt: 'desc' },
      select: { lastReadAt: true },
    });

    let currentStreak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const progress of allProgress) {
      if (!progress.lastReadAt) continue;
      
      const readDate = new Date(progress.lastReadAt);
      readDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - readDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        period: days,
        summary: {
          totalStoriesStarted,
          totalStoriesCompleted,
          completionRate: Math.round(completionRate * 100) / 100,
          totalReadingTimeMinutes: Math.round(totalReadingTime / 60),
          totalWordsRead,
          averageReadingTimeMinutes: Math.round(avgReadingTimePerStory / 60),
          bookmarksCount,
          ratingsCount,
          currentStreak,
        },
        languagePreferences: languageStats,
        recentActivity,
        progressByDay: await calculateDailyProgress(userId, days),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch analytics data',
      },
    });
  }
});

// Helper function to calculate daily progress
async function calculateDailyProgress(userId: string, days: number) {
  const result = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayProgress = await prisma.userReadingProgress.findMany({
      where: {
        userId,
        lastReadAt: {
          gte: date,
          lt: nextDate,
        },
      },
      select: {
        readingTimeSeconds: true,
        wordsRead: true,
        status: true,
      },
    });
    
    const totalReadingTime = dayProgress.reduce((sum, p) => sum + (p.readingTimeSeconds || 0), 0);
    const totalWords = dayProgress.reduce((sum, p) => sum + (p.wordsRead || 0), 0);
    const storiesCompleted = dayProgress.filter(p => p.status === 'COMPLETED').length;
    
    result.push({
      date: date.toISOString().split('T')[0],
      readingTimeMinutes: Math.round(totalReadingTime / 60),
      wordsRead: totalWords,
      storiesCompleted,
      storiesRead: dayProgress.length,
    });
  }
  
  return result;
}

// GET /api/analytics/dashboard - Get user dashboard data
router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;

    // Get recent progress
    const recentProgress = await prisma.userReadingProgress.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            averageRating: true,
            categories: {
              include: {
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
      take: 5,
    });

    // Get reading goals progress (mock for now)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyProgress = await prisma.userReadingProgress.findMany({
      where: {
        userId,
        lastReadAt: {
          gte: thisMonth,
        },
      },
      select: {
        status: true,
        readingTimeSeconds: true,
      },
    });

    const monthlyStats = {
      storiesCompleted: monthlyProgress.filter(p => p.status === 'COMPLETED').length,
      totalReadingMinutes: Math.round(
        monthlyProgress.reduce((sum, p) => sum + (p.readingTimeSeconds || 0), 0) / 60
      ),
    };

    // Get favorite categories
    const categoryStats = await prisma.userReadingProgress.findMany({
      where: { userId },
      include: {
        story: {
          include: {
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const categoryCounts = categoryStats.reduce((counts, progress) => {
      progress.story.categories.forEach(storyCategory => {
        const categoryName = (storyCategory.category.name as any)?.en || 'Unknown';
        counts[categoryName] = (counts[categoryName] || 0) + 1;
      });
      return counts;
    }, {} as Record<string, number>);

    const favoriteCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      data: {
        recentProgress,
        monthlyStats,
        favoriteCategories,
        recommendations: [], // TODO: Implement recommendation system
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard data',
      },
    });
  }
});

export default router;