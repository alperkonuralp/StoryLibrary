import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import { AuthenticationError, ConflictError, NotFoundError } from '../middleware/errorHandler';
import { generateRandomString } from '../utils/helpers';
import logger from '../utils/logger';
import type { JWTPayload, LoginCredentials, RegisterData } from '../types';

const prisma = new PrismaClient();

// In-memory storage for refresh tokens (in production, use Redis)
const refreshTokenStore = new Map<string, { userId: string; expiresAt: Date }>();

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData) {
    const { email, password, username } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(username ? [{ username }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials) {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    // Verify refresh token
    let decoded: JWTPayload;
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if refresh token is in store
    const storedToken = refreshTokenStore.get(refreshToken);
    if (!storedToken || storedToken.userId !== decoded.userId) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if refresh token is expired
    if (storedToken.expiresAt < new Date()) {
      refreshTokenStore.delete(refreshToken);
      throw new AuthenticationError('Refresh token expired');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove old refresh token
    refreshTokenStore.delete(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    logger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(refreshToken: string) {
    if (refreshToken && refreshTokenStore.has(refreshToken)) {
      refreshTokenStore.delete(refreshToken);
      logger.info('User logged out successfully');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      throw new AuthenticationError('Invalid token');
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private static generateTokens(user: Partial<User>) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT secrets are not configured');
    }

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id!,
      email: user.email!,
      role: user.role!,
    };

    // Generate access token (short-lived)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    } as any);

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    } as any);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    refreshTokenStore.set(refreshToken, {
      userId: user.id!,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    };
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all refresh tokens for this user
    for (const [token, data] of refreshTokenStore.entries()) {
      if (data.userId === userId) {
        refreshTokenStore.delete(token);
      }
    }

    logger.info('Password changed successfully', { userId });
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updateData: { username?: string; profile?: any }) {
    // Check if username is already taken
    if (updateData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictError('Username already taken');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated successfully', { userId });

    return user;
  }

  /**
   * Delete user account
   */
  static async deleteAccount(userId: string) {
    // Delete user (this will cascade to related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Invalidate all refresh tokens for this user
    for (const [token, data] of refreshTokenStore.entries()) {
      if (data.userId === userId) {
        refreshTokenStore.delete(token);
      }
    }

    logger.info('User account deleted successfully', { userId });
  }

  /**
   * Get user's reading statistics
   */
  static async getUserStats(userId: string) {
    const [totalStories, completedStories, ratingsGiven, averageRating] = await Promise.all([
      // Total stories read (started or completed)
      prisma.userReadingProgress.count({
        where: { userId },
      }),
      // Completed stories
      prisma.userReadingProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      // Total ratings given
      prisma.userStoryRating.count({
        where: { userId },
      }),
      // Average rating given by user
      prisma.userStoryRating.aggregate({
        where: { userId },
        _avg: { rating: true },
      }),
    ]);

    return {
      totalStories,
      completedStories,
      ratingsGiven,
      averageRating: averageRating._avg.rating || 0,
      completionRate: totalStories > 0 ? (completedStories / totalStories) * 100 : 0,
    };
  }

  /**
   * Clean up expired refresh tokens (should be called periodically)
   */
  static cleanupExpiredTokens() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, data] of refreshTokenStore.entries()) {
      if (data.expiresAt < now) {
        refreshTokenStore.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired refresh tokens`);
    }
  }
}

// Cleanup expired tokens every hour
setInterval(() => {
  AuthService.cleanupExpiredTokens();
}, 60 * 60 * 1000);

export default AuthService;