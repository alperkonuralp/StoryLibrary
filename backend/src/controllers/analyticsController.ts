import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { HTTP_STATUS } from '../utils/constants';

const prisma = new PrismaClient();

export const analyticsController = {
  // Get dashboard analytics for admin
  async getDashboardStats(req: Request, res: Response) {
    try {
      // Run all analytics queries in parallel for performance
      const [
        totalStories,
        publishedStories,
        draftStories,
        totalUsers,
        totalAuthors,
        totalCategories,
        totalSeries,
        totalTags,
        averageRating,
        totalRatings,
        recentStories,
        topRatedStories
      ] = await Promise.all([
        // Story statistics
        prisma.story.count(),
        prisma.story.count({ where: { status: 'PUBLISHED' } }),
        prisma.story.count({ where: { status: 'DRAFT' } }),
        
        // User statistics
        prisma.user.count(),
        
        // Content statistics
        prisma.author.count(),
        prisma.category.count(),
        prisma.series.count(),
        prisma.tag.count(),
        
        // Rating statistics
        prisma.userStoryRating.aggregate({
          _avg: { rating: true }
        }),
        prisma.userStoryRating.count(),
        
        // Recent activity
        prisma.story.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            creator: {
              select: {
                username: true
              }
            }
          }
        }),
        
        // Top rated stories
        prisma.story.findMany({
          take: 5,
          where: {
            status: 'PUBLISHED',
            averageRating: { not: null }
          },
          orderBy: { averageRating: 'desc' },
          select: {
            id: true,
            title: true,
            averageRating: true,
            ratingCount: true
          }
        })
      ]);

      // Calculate additional metrics
      const userRoleDistribution = await prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      });

      const storiesPerCategory = await prisma.storyCategory.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5
      });

      const categoryNames = await prisma.category.findMany({
        where: {
          id: { in: storiesPerCategory.map(c => c.categoryId) }
        },
        select: { id: true, name: true }
      });

      // Format category statistics
      const categoryStats = storiesPerCategory.map(stat => {
        const category = categoryNames.find(c => c.id === stat.categoryId);
        const categoryName = category?.name as any;
        return {
          name: categoryName?.en || categoryName?.tr || 'Unknown',
          count: stat._count.categoryId
        };
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          overview: {
            totalStories,
            publishedStories,
            draftStories,
            totalUsers,
            totalAuthors,
            totalCategories,
            totalSeries,
            totalTags,
            averageRating: averageRating._avg.rating ? Number(averageRating._avg.rating).toFixed(1) : '0.0',
            totalRatings
          },
          userDistribution: userRoleDistribution.map(role => ({
            role: role.role,
            count: role._count.role
          })),
          categoryStats,
          recentActivity: recentStories.map(story => ({
            id: story.id,
            title: story.title,
            status: story.status,
            createdAt: story.createdAt,
            creator: story.creator?.username
          })),
          topRated: topRatedStories.map(story => ({
            id: story.id,
            title: story.title,
            rating: Number(story.averageRating).toFixed(1),
            ratingCount: story.ratingCount
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to fetch analytics data'
        }
      });
    }
  },

  // Get story statistics
  async getStoryStats(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: {
          ratings: {
            select: {
              rating: true,
              createdAt: true,
              user: {
                select: { username: true }
              }
            }
          }
        }
      });

      if (!story) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: 'STORY_NOT_FOUND',
            message: 'Story not found'
          }
        });
      }

      // Get reading progress separately
      const progressStats = await prisma.userReadingProgress.aggregate({
        where: { storyId },
        _count: { id: true }
      });

      const completedCount = await prisma.userReadingProgress.count({
        where: { 
          storyId,
          status: 'COMPLETED'
        }
      });

      const completionRate = progressStats._count.id > 0 
        ? (completedCount / progressStats._count.id) * 100
        : 0;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          storyId: story.id,
          title: story.title,
          ratingCount: story.ratingCount || 0,
          averageRating: story.averageRating ? Number(story.averageRating).toFixed(1) : null,
          completionRate: Number(completionRate.toFixed(1)),
          recentRatings: story.ratings.slice(-5).map(rating => ({
            rating: Number(rating.rating),
            createdAt: rating.createdAt,
            username: rating.user.username
          })),
          readingProgress: {
            started: progressStats._count.id,
            completed: completedCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching story stats:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to fetch story statistics'
        }
      });
    }
  }
};