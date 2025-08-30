import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Track story view
   */
  static async trackStoryView(storyId: string, userId?: string, sessionId?: string) {
    try {
      // In a full implementation, you might store this in a separate analytics table
      // For now, we'll just log it and could extend to update view counts
      logger.info('Story view tracked', {
        storyId,
        userId: userId || 'anonymous',
        sessionId: sessionId || 'unknown',
        timestamp: new Date().toISOString()
      });

      // Could extend to increment view count in story table
      // await prisma.story.update({
      //   where: { id: storyId },
      //   data: { viewCount: { increment: 1 } }
      // });

    } catch (error) {
      logger.error('Failed to track story view:', error);
    }
  }

  /**
   * Track reading progress
   */
  static async trackReadingProgress(
    storyId: string,
    userId: string,
    progress: number,
    lastParagraph?: number
  ) {
    try {
      await prisma.userReadingProgress.upsert({
        where: {
          userId_storyId: {
            userId,
            storyId
          }
        },
        create: {
          userId,
          storyId,
          status: progress >= 100 ? 'COMPLETED' : 'STARTED',
          lastParagraph,
          startedAt: new Date(),
          completedAt: progress >= 100 ? new Date() : null
        },
        update: {
          status: progress >= 100 ? 'COMPLETED' : 'STARTED',
          lastParagraph,
          completedAt: progress >= 100 ? new Date() : null
        }
      });

      logger.info('Reading progress tracked', {
        storyId,
        userId,
        progress,
        lastParagraph
      });

    } catch (error) {
      logger.error('Failed to track reading progress:', error);
    }
  }

  /**
   * Track story rating
   */
  static async trackRating(
    storyId: string,
    userId: string,
    rating: number
  ) {
    try {
      // Create or update user rating
      await prisma.userStoryRating.upsert({
        where: {
          userId_storyId: {
            userId,
            storyId
          }
        },
        create: {
          userId,
          storyId,
          rating
        },
        update: {
          rating
        }
      });

      // Recalculate story average rating
      const ratings = await prisma.userStoryRating.findMany({
        where: { storyId },
        select: { rating: true }
      });

      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
        : 0;

      await prisma.story.update({
        where: { id: storyId },
        data: {
          averageRating,
          ratingCount: ratings.length
        }
      });

      logger.info('Story rating tracked', {
        storyId,
        userId,
        rating,
        newAverage: averageRating,
        totalRatings: ratings.length
      });

      return { averageRating, ratingCount: ratings.length };

    } catch (error) {
      logger.error('Failed to track rating:', error);
      throw error;
    }
  }

  /**
   * Get story metrics
   */
  static async getStoryMetrics(storyId: string) {
    try {
      const [story, ratings, progress] = await Promise.all([
        prisma.story.findUnique({
          where: { id: storyId },
          select: {
            id: true,
            title: true,
            averageRating: true,
            ratingCount: true,
            publishedAt: true
          }
        }),
        prisma.userStoryRating.findMany({
          where: { storyId },
          select: { rating: true, createdAt: true }
        }),
        prisma.userReadingProgress.findMany({
          where: { storyId },
          select: { status: true, completedAt: true, startedAt: true }
        })
      ]);

      if (!story) {
        throw new Error('Story not found');
      }

      const totalReaders = progress.length;
      const completedReaders = progress.filter(p => p.status === 'COMPLETED').length;
      const completionRate = totalReaders > 0 ? (completedReaders / totalReaders) * 100 : 0;

      // Rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].reduce((acc, rating) => {
        acc[rating] = ratings.filter(r => Math.floor(Number(r.rating)) === rating).length;
        return acc;
      }, {} as Record<number, number>);

      return {
        story: {
          id: story.id,
          title: story.title,
          publishedAt: story.publishedAt
        },
        ratings: {
          average: Number(story.averageRating),
          total: story.ratingCount,
          distribution: ratingDistribution
        },
        reading: {
          totalReaders,
          completedReaders,
          completionRate: Math.round(completionRate * 100) / 100
        },
        trends: {
          // Could add daily/weekly/monthly trends here
          recentActivity: progress
            .filter(p => p.startedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .length
        }
      };

    } catch (error) {
      logger.error('Failed to get story metrics:', error);
      throw error;
    }
  }

  /**
   * Get user metrics
   */
  static async getUserMetrics(userId: string) {
    try {
      const [user, progress, ratings] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true
          }
        }),
        prisma.userReadingProgress.findMany({
          where: { userId },
          include: {
            story: {
              select: {
                id: true,
                title: true,
                publishedAt: true
              }
            }
          }
        }),
        prisma.userStoryRating.findMany({
          where: { userId },
          include: {
            story: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      const totalStories = progress.length;
      const completedStories = progress.filter(p => p.status === 'COMPLETED').length;
      const inProgressStories = totalStories - completedStories;
      
      const averageUserRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
        : 0;

      // Reading streak (consecutive days with reading activity)
      const recentProgress = progress
        .filter(p => p.startedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          memberSince: user.createdAt
        },
        reading: {
          totalStories,
          completedStories,
          inProgressStories,
          completionRate: totalStories > 0 ? (completedStories / totalStories) * 100 : 0
        },
        ratings: {
          totalRatings: ratings.length,
          averageRating: Math.round(averageUserRating * 100) / 100
        },
        activity: {
          recentStories: recentProgress.length,
          lastActivity: recentProgress[0]?.startedAt || null
        }
      };

    } catch (error) {
      logger.error('Failed to get user metrics:', error);
      throw error;
    }
  }

  /**
   * Get platform overview metrics
   */
  static async getPlatformMetrics() {
    try {
      const [
        totalStories,
        publishedStories,
        totalUsers,
        totalRatings,
        totalProgress,
        recentActivity
      ] = await Promise.all([
        prisma.story.count(),
        prisma.story.count({ where: { status: 'PUBLISHED' } }),
        prisma.user.count(),
        prisma.userStoryRating.count(),
        prisma.userReadingProgress.count(),
        prisma.userReadingProgress.count({
          where: {
            startedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      const avgRating = await prisma.userStoryRating.aggregate({
        _avg: { rating: true }
      });

      return {
        content: {
          totalStories,
          publishedStories,
          draftStories: totalStories - publishedStories
        },
        users: {
          totalUsers,
          activeUsers: recentActivity // Users active in last 7 days
        },
        engagement: {
          totalRatings,
          averageRating: Number(avgRating._avg.rating) || 0,
          totalReadingSessions: totalProgress
        },
        activity: {
          recentActivity // Reading sessions in last 7 days
        }
      };

    } catch (error) {
      logger.error('Failed to get platform metrics:', error);
      throw error;
    }
  }

  /**
   * Get popular content
   */
  static async getPopularContent(limit: number = 10) {
    try {
      const [topRated, mostRead] = await Promise.all([
        // Top rated stories
        prisma.story.findMany({
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            averageRating: true,
            ratingCount: true
          },
          orderBy: [
            { averageRating: 'desc' },
            { ratingCount: 'desc' }
          ],
          take: limit
        }),
        // Most read stories (by progress count)
        prisma.story.findMany({
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                progress: true
              }
            }
          },
          orderBy: {
            progress: {
              _count: 'desc'
            }
          },
          take: limit
        })
      ]);

      return {
        topRated,
        mostRead
      };

    } catch (error) {
      logger.error('Failed to get popular content:', error);
      throw error;
    }
  }
}