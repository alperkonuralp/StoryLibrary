import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../authMiddleware';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@prisma/client');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
} as any;

// Setup middleware to use our mock
const { setPrismaClient } = require('../../controllers/authController');
setPrismaClient(mockPrisma);

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid JWT token in header', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-1' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          profile: true,
        },
      });
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate user with valid JWT token in cookie', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      };

      mockRequest.cookies = {
        accessToken: 'valid-cookie-token',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-1' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-cookie-token', process.env.JWT_SECRET);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', async () => {
      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authorization token required',
          code: 'TOKEN_REQUIRED',
          statusCode: 401,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          statusCode: 401,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ userId: 'non-existent-user' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          statusCode: 401,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-1' } as any);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'user-1',
        role: 'USER',
      };
    });

    it('should allow access for users with required role', () => {
      mockRequest.user.role = 'ADMIN';
      const middleware = requireRole(['ADMIN']);

      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access for users with any of the required roles', () => {
      mockRequest.user.role = 'EDITOR';
      const middleware = requireRole(['ADMIN', 'EDITOR']);

      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for users without required role', () => {
      mockRequest.user.role = 'USER';
      const middleware = requireRole(['ADMIN']);

      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          statusCode: 403,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access if user is not authenticated', () => {
      mockRequest.user = undefined;
      const middleware = requireRole(['USER']);

      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive role checking', () => {
      mockRequest.user.role = 'admin'; // lowercase
      const middleware = requireRole(['ADMIN']); // uppercase

      middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should proceed without authentication if no token provided', async () => {
      const { optionalAuth } = require('../authMiddleware');
      
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should authenticate if valid token is provided', async () => {
      const { optionalAuth } = require('../authMiddleware');
      const mockUser = { id: 'user-1', role: 'USER' };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-1' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should proceed without authentication if invalid token is provided', async () => {
      const { optionalAuth } = require('../authMiddleware');

      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });
});