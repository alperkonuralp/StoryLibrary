import { Request, Response, NextFunction } from 'express';
import { AuthController, setPrismaClient } from '../authController';
import { AuthService } from '../../services/authService';

// Mock AuthService
jest.mock('../../services/authService');
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      body: {},
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      });

      await AuthController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        }),
      });
    });

    it('should handle registration errors', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const error = new Error('Email already exists');
      mockAuthService.register.mockRejectedValue(error);

      await AuthController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      });

      await AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: mockUser,
          accessToken: 'access-token',
        }),
      });
    });

    it('should handle login errors', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info for authenticated request', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      const mockStats = {
        storiesRead: 5,
        totalReadingTime: 300,
        completionRate: 0.8,
      };

      (mockRequest as any).user = mockUser;

      mockAuthService.getUserById.mockResolvedValue(mockUser);
      mockAuthService.getUserStats.mockResolvedValue(mockStats);

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-1');
      expect(mockAuthService.getUserStats).toHaveBeenCalledWith('user-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            ...mockUser,
            stats: mockStats,
          },
        },
      });
    });

    it('should handle unauthenticated request', async () => {
      (mockRequest as any).user = undefined;

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});