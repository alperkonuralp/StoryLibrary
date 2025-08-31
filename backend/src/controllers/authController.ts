import { Request, Response, NextFunction } from 'express';
import { AuthService, setPrismaClient } from '../services/authService';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import logger from '../utils/logger';
import type { AuthenticatedRequest, ApiResponse } from '../types';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, username } = req.body;

      const result = await AuthService.register({
        email,
        password,
        username,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: SUCCESS_MESSAGES.USER_CREATED,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      };

      logger.info('User registration successful', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      };

      logger.info('User login successful', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await AuthService.refreshToken(refreshToken);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      };

      logger.info('Token refresh successful', {
        userId: result.user.id,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await AuthService.logout(refreshToken);

      const response: ApiResponse = {
        success: true,
        data: {
          message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
        },
      };

      logger.info('User logout successful', {
        ip: req.ip,
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new Error('User not found in request'));
      }

      // Get fresh user data with statistics
      const [user, userStats] = await Promise.all([
        AuthService.getUserById(req.user.id),
        AuthService.getUserStats(req.user.id),
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            ...user,
            stats: userStats,
          },
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new Error('User not found in request'));
      }

      const { username, profile } = req.body;

      const updatedUser = await AuthService.updateProfile(req.user.id, {
        username,
        profile,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: SUCCESS_MESSAGES.USER_UPDATED,
          user: updatedUser,
        },
      };

      logger.info('User profile updated', {
        userId: req.user.id,
        updatedFields: Object.keys(req.body),
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new Error('User not found in request'));
      }

      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(req.user.id, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Password changed successfully. Please log in again.',
        },
      };

      logger.info('User password changed', {
        userId: req.user.id,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new Error('User not found in request'));
      }

      const { password } = req.body;

      // Verify password before deletion
      await AuthService.login({
        email: req.user.email,
        password,
      });

      await AuthService.deleteAccount(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: {
          message: SUCCESS_MESSAGES.USER_DELETED,
        },
      };

      logger.info('User account deleted', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new Error('User not found in request'));
      }

      const stats = await AuthService.getUserStats(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: { stats },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token (for external services)
   */
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.userId);

      const response: ApiResponse = {
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: true,
        data: {
          valid: false,
          error: 'Invalid or expired token',
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    }
  }

  /**
   * Health check for auth service
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    const response: ApiResponse = {
      success: true,
      data: {
        service: 'auth',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  }

  /**
   * Development only: Create admin user
   */
  static async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'This endpoint is not available in production',
          },
        });
        return;
      }

      const { email, password, username } = req.body;

      // Create admin user directly in database
      const { PrismaClient } = require('@prisma/client');
      const bcrypt = require('bcryptjs');
      
      const prisma = new PrismaClient();
      const passwordHash = await bcrypt.hash(password, 12);

      const admin = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          passwordHash,
          role: 'ADMIN',
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Admin user created successfully',
          user: admin,
        },
      };

      logger.info('Admin user created', {
        adminId: admin.id,
        email: admin.email,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Re-export setPrismaClient for testing
export { setPrismaClient };