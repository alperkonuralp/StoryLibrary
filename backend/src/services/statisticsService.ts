/**
 * Statistics Service
 * Handles calculation of story statistics as specified in CLAUDE.md
 */

export interface StoryStatistics {
  wordCount: Record<string, number>;
  charCount: Record<string, number>;
  estimatedReadingTime: Record<string, number>;
  sentenceCount: Record<string, number>;
}

export interface StoryContent {
  [language: string]: string[];
}

export class StatisticsService {
  // Words per minute reading speed (configurable)
  private static readonly WORDS_PER_MINUTE = 200;

  /**
   * Calculate comprehensive statistics for story content
   * As specified in CLAUDE.md: wordCount, charCount, estimatedReadingTime
   */
  static calculateStoryStatistics(content: StoryContent): StoryStatistics {
    const statistics: StoryStatistics = {
      wordCount: {},
      charCount: {},
      estimatedReadingTime: {},
      sentenceCount: {}
    };

    for (const [language, paragraphs] of Object.entries(content)) {
      // Join all paragraphs into a single text
      const fullText = paragraphs.join(' ');
      
      // Calculate word count (split by whitespace, filter empty strings)
      const words = fullText.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      // Calculate character count (including spaces)
      const charCount = fullText.length;
      
      // Calculate sentence count (number of paragraphs as proxy)
      const sentenceCount = paragraphs.length;
      
      // Calculate estimated reading time in minutes
      // Formula: wordCount / wordsPerMinute, minimum 1 minute
      const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / this.WORDS_PER_MINUTE));

      statistics.wordCount[language] = wordCount;
      statistics.charCount[language] = charCount;
      statistics.estimatedReadingTime[language] = estimatedReadingTime;
      statistics.sentenceCount[language] = sentenceCount;
    }

    return statistics;
  }

  /**
   * Calculate reading progress statistics
   */
  static calculateProgressStatistics(
    currentParagraph: number,
    totalParagraphs: number,
    wordsRead: number = 0
  ): {
    completionPercentage: number;
    remainingParagraphs: number;
    progressRatio: number;
  } {
    const completionPercentage = totalParagraphs > 0 
      ? Math.round((currentParagraph / totalParagraphs) * 100)
      : 0;

    const remainingParagraphs = Math.max(0, totalParagraphs - currentParagraph);
    const progressRatio = totalParagraphs > 0 ? currentParagraph / totalParagraphs : 0;

    return {
      completionPercentage: Math.min(100, Math.max(0, completionPercentage)),
      remainingParagraphs,
      progressRatio: Math.min(1, Math.max(0, progressRatio))
    };
  }

  /**
   * Calculate average rating with proper rounding
   */
  static calculateAverageRating(ratings: number[]): {
    averageRating: number;
    ratingCount: number;
  } {
    if (ratings.length === 0) {
      return { averageRating: 0, ratingCount: 0 };
    }

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / ratings.length;

    return {
      averageRating: Math.round(average * 100) / 100, // Round to 2 decimal places
      ratingCount: ratings.length
    };
  }

  /**
   * Update average rating when a new rating is added
   * Formula: newAverage = ((oldAverage * oldRatingCount) + newRating) / (oldRatingCount + 1)
   */
  static updateAverageRating(
    currentAverage: number,
    currentCount: number,
    newRating: number
  ): {
    averageRating: number;
    ratingCount: number;
  } {
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + newRating) / newCount;

    return {
      averageRating: Math.round(newAverage * 100) / 100, // Round to 2 decimal places
      ratingCount: newCount
    };
  }

  /**
   * Calculate comprehensive story analytics
   */
  static calculateStoryAnalytics(story: {
    content: StoryContent;
    ratings: number[];
    views: number;
    uniqueReaders: number;
    completions: number;
  }): {
    statistics: StoryStatistics;
    rating: { averageRating: number; ratingCount: number };
    analytics: {
      viewsCount: number;
      uniqueReadersCount: number;
      completionRate: number;
    };
  } {
    const statistics = this.calculateStoryStatistics(story.content);
    const rating = this.calculateAverageRating(story.ratings);
    
    const completionRate = story.uniqueReaders > 0 
      ? Math.round((story.completions / story.uniqueReaders) * 100)
      : 0;

    return {
      statistics,
      rating,
      analytics: {
        viewsCount: story.views,
        uniqueReadersCount: story.uniqueReaders,
        completionRate: Math.min(100, Math.max(0, completionRate))
      }
    };
  }

  /**
   * Validate story content structure
   */
  static validateStoryContent(content: any): content is StoryContent {
    if (!content || typeof content !== 'object') {
      return false;
    }

    // Check if all values are arrays of strings
    for (const [language, paragraphs] of Object.entries(content)) {
      if (!Array.isArray(paragraphs)) {
        return false;
      }
      
      if (!paragraphs.every(p => typeof p === 'string')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get estimated reading time for multiple languages
   */
  static getMaxEstimatedReadingTime(statistics: StoryStatistics): number {
    const readingTimes = Object.values(statistics.estimatedReadingTime);
    return readingTimes.length > 0 ? Math.max(...readingTimes) : 0;
  }

  /**
   * Get word count for the primary language (English first, then others)
   */
  static getPrimaryLanguageWordCount(statistics: StoryStatistics): number {
    // Prefer English, then Turkish, then any available language
    const languages = ['en', 'tr', ...Object.keys(statistics.wordCount)];
    
    for (const lang of languages) {
      if (statistics.wordCount[lang] !== undefined) {
        return statistics.wordCount[lang];
      }
    }
    
    return 0;
  }
}