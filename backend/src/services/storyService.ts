import { PrismaClient } from '@prisma/client';
import type { StoryFilters, PaginationInfo, Language } from '../types';

const prisma = new PrismaClient();

export class StoryService {
  /**
   * Get stories with filtering and pagination
   */
  static async getStories(filters: StoryFilters) {
    const { page, limit, search, categoryId, tagId, authorId, seriesId, language, status } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status || 'PUBLISHED'
    };

    if (search) {
      where.OR = [
        {
          title: {
            path: [language || 'en'],
            string_contains: search
          }
        },
        {
          shortDescription: {
            path: [language || 'en'],
            string_contains: search
          }
        }
      ];
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId
        }
      };
    }

    if (tagId) {
      where.tags = {
        some: {
          tagId
        }
      };
    }

    if (authorId) {
      where.authors = {
        some: {
          authorId
        }
      };
    }

    if (seriesId) {
      where.series = {
        some: {
          seriesId
        }
      };
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          authors: {
            include: {
              author: true
            }
          },
          series: {
            include: {
              series: true
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          publishedAt: 'desc'
        }
      }),
      prisma.story.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }

  /**
   * Get story by ID with full relations
   */
  static async getStoryById(id: string) {
    return prisma.story.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        authors: {
          include: {
            author: true
          }
        },
        series: {
          include: {
            series: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        ratings: true,
        progress: true
      }
    });
  }

  /**
   * Get story by slug
   */
  static async getStoryBySlug(slug: string) {
    return prisma.story.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        authors: {
          include: {
            author: true
          }
        },
        series: {
          include: {
            series: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Calculate story statistics
   */
  static calculateStatistics(content: Record<string, string[]>) {
    const statistics: any = {
      wordCount: {},
      charCount: {},
      estimatedReadingTime: {},
      sentenceCount: {}
    };

    Object.entries(content).forEach(([lang, paragraphs]) => {
      const text = paragraphs.join(' ');
      
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      const charCount = text.length;
      const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute
      const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;

      statistics.wordCount[lang] = wordCount;
      statistics.charCount[lang] = charCount;
      statistics.estimatedReadingTime[lang] = estimatedReadingTime;
      statistics.sentenceCount[lang] = sentenceCount;
    });

    return statistics;
  }

  /**
   * Generate story slug from title
   */
  static generateSlug(title: Record<string, string>): string {
    const titleText = title.en || title.tr || Object.values(title)[0];
    return titleText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get top-rated stories
   */
  static async getTopRatedStories(limit: number = 10, language?: Language) {
    return prisma.story.findMany({
      where: {
        status: 'PUBLISHED',
        averageRating: {
          gte: 4.0
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        authors: {
          include: {
            author: true
          }
        }
      },
      orderBy: [
        { averageRating: 'desc' },
        { ratingCount: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Get recent stories
   */
  static async getRecentStories(days: number = 7, limit: number = 10) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    return prisma.story.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: daysAgo
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        authors: {
          include: {
            author: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    });
  }
}