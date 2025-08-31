import { Request, Response } from 'express';
import { userController, setPrismaClient } from '../userController';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userReadingProgress: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  userStoryRating: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
} as any;

// Setup user controller to use our mock
setPrismaClient(mockPrisma);

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getAllUsers', () => {
    beforeEach(() => {
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should return all users with admin privileges', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'testuser1',
          email: 'test1@example.com',
          role: 'USER',
          createdAt: new Date(),
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
        {
          id: 'user-2',
          username: 'editor1',
          email: 'editor@example.com',
          role: 'EDITOR',
          createdAt: new Date(),
          profile: {
            firstName: 'Editor',
            lastName: 'User',
          },
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      await userController.getAllUsers(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stories: true,
              ratings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
      });
    });

    it('should reject access for non-admin users', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };

      await userController.getAllUsers(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Access denied. Admin role required.',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await userController.getAllUsers(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch users',
        },
      });
    });
  });

  describe('getUserById', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should return user by ID for admin', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          bio: 'Test bio',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('should allow users to access their own profile', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should deny access to other users profiles for non-admin', async () => {
      mockRequest.user = { id: 'user-2', role: 'USER' };
      mockRequest.params = { id: 'user-1' };

      await userController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          statusCode: 404,
        },
      });
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = {
        profile: {
          firstName: 'Updated',
          lastName: 'User',
          bio: 'Updated bio',
        },
      };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should update user with admin privileges', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        profile: mockRequest.body.profile,
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          profile: mockRequest.body.profile,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          profile: true,
          updatedAt: true,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should allow users to update their own profile', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };
      const mockUpdatedUser = {
        id: 'user-1',
        profile: mockRequest.body.profile,
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should update user role for admin only', async () => {
      mockRequest.body = { role: 'EDITOR' };
      const mockUpdatedUser = {
        id: 'user-1',
        role: 'EDITOR',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'EDITOR' },
        select: expect.any(Object),
      });
    });

    it('should prevent non-admin from changing roles', async () => {
      mockRequest.user = { id: 'user-1', role: 'USER' };
      mockRequest.body = { role: 'ADMIN' };

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should delete user with admin privileges', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.delete.mockResolvedValue({ id: 'user-1' });

      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
      });
    });

    it('should reject deletion for non-admin users', async () => {
      mockRequest.user = { id: 'user-2', role: 'USER' };

      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should prevent self-deletion', async () => {
      mockRequest.user = { id: 'user-1', role: 'ADMIN' };

      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Cannot delete your own account',
          code: 'SELF_DELETE_ERROR',
          statusCode: 400,
        },
      });
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserProgress', () => {
    beforeEach(() => {
      mockRequest.user = { id: 'user-1', role: 'USER' };
    });

    it('should return user reading progress', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          storyId: 'story-1',
          userId: 'user-1',
          currentPosition: 5,
          isCompleted: false,
          story: {
            id: 'story-1',
            title: { en: 'Test Story', tr: 'Test Hikaye' },
            slug: 'test-story',
          },
        },
      ];

      mockPrisma.userReadingProgress.findMany.mockResolvedValue(mockProgress);

      await userController.getUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.userReadingProgress.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProgress,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.userReadingProgress.findMany.mockRejectedValue(new Error('Database error'));

      await userController.getUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUserProgress', () => {
    beforeEach(() => {
      mockRequest.body = {
        storyId: 'story-1',
        currentPosition: 10,
        isCompleted: false,
      };
      mockRequest.user = { id: 'user-1', role: 'USER' };
    });

    it('should update user reading progress', async () => {
      const mockUpdatedProgress = {
        id: 'progress-1',
        storyId: 'story-1',
        userId: 'user-1',
        currentPosition: 10,
        isCompleted: false,
        updatedAt: new Date(),
      };

      mockPrisma.userReadingProgress.upsert.mockResolvedValue(mockUpdatedProgress);

      await userController.updateUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.userReadingProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId: 'user-1',
            storyId: 'story-1',
          },
        },
        create: {
          userId: 'user-1',
          storyId: 'story-1',
          currentPosition: 10,
          isCompleted: false,
        },
        update: {
          currentPosition: 10,
          isCompleted: false,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should validate required fields', async () => {
      mockRequest.body = { storyId: 'story-1' }; // Missing currentPosition

      await userController.updateUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getUserRatings', () => {
    beforeEach(() => {
      mockRequest.user = { id: 'user-1', role: 'USER' };
    });

    it('should return user story ratings', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          storyId: 'story-1',
          userId: 'user-1',
          rating: 5,
          review: 'Great story!',
          story: {
            id: 'story-1',
            title: { en: 'Test Story', tr: 'Test Hikaye' },
            slug: 'test-story',
          },
        },
      ];

      mockPrisma.userStoryRating.findMany.mockResolvedValue(mockRatings);

      await userController.getUserRatings(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.userStoryRating.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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
          createdAt: 'desc',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('submitRating', () => {
    beforeEach(() => {
      mockRequest.body = {
        storyId: 'story-1',
        rating: 4,
        review: 'Good story',
      };
      mockRequest.user = { id: 'user-1', role: 'USER' };
    });

    it('should submit new rating', async () => {
      const mockRating = {
        id: 'rating-1',
        storyId: 'story-1',
        userId: 'user-1',
        rating: 4,
        review: 'Good story',
        createdAt: new Date(),
      };

      mockPrisma.userStoryRating.upsert.mockResolvedValue(mockRating);

      await userController.submitRating(mockRequest as any, mockResponse as Response);

      expect(mockPrisma.userStoryRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_storyId: {
            userId: 'user-1',
            storyId: 'story-1',
          },
        },
        create: {
          userId: 'user-1',
          storyId: 'story-1',
          rating: 4,
          review: 'Good story',
        },
        update: {
          rating: 4,
          review: 'Good story',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should validate rating range', async () => {
      mockRequest.body = {
        storyId: 'story-1',
        rating: 6, // Invalid rating > 5
      };

      await userController.submitRating(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate required fields', async () => {
      mockRequest.body = { rating: 4 }; // Missing storyId

      await userController.submitRating(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});