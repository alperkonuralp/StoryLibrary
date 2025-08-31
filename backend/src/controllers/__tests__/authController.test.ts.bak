import { Request, Response } from 'express';
import { AuthController, setPrismaClient } from '../authController';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Setup auth controller to use our mock
setPrismaClient(mockPrisma);

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe('register', () => {
    beforeEach(() => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
    });

    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
      });
      mockJwt.sign.mockReturnValue('access-token' as any);

      await AuthController.register(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedPassword',
          role: 'USER',
          profile: {
            create: {
              firstName: 'Test',
              lastName: 'User',
            },
          },
        },
        include: {
          profile: true,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should reject registration if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await AuthController.register(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User with this email already exists',
          code: 'EMAIL_EXISTS',
          statusCode: 400,
        },
      });
    });

    it('should validate required fields', async () => {
      mockRequest.body = { email: 'test@example.com' }; // Missing required fields

      await AuthController.register(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };
    });

    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedPassword',
        role: 'USER',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as any);
      mockJwt.sign.mockReturnValue('access-token' as any);

      await AuthController.login(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { profile: true },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should reject login with invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await AuthController.login(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401,
        },
      });
    });

    it('should reject login with invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as any);

      await AuthController.login(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      mockRequest.body = { refreshToken: 'valid-refresh-token' };
      
      mockJwt.verify.mockReturnValue({ userId: 'user-1' } as any);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      mockJwt.sign.mockReturnValue('new-access-token' as any);

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        process.env.JWT_REFRESH_SECRET
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid refresh token', async () => {
      mockRequest.body = { refreshToken: 'invalid-token' };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      await AuthController.logout(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info for authenticated request', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      mockRequest.user = mockUser;

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
        },
      });
    });

    it('should handle unauthenticated request', async () => {
      mockRequest.user = undefined;

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await AuthController.register(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    });
  });
});