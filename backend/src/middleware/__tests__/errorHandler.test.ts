import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle AppError instances correctly', () => {
      const appError = new AppError('Test error', 'TEST_ERROR', 400);

      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
          statusCode: 400,
        },
      });
    });

    it('should handle generic Error instances', () => {
      const genericError = new Error('Generic error message');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Generic error message',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    });

    it('should handle Prisma validation errors', () => {
      const prismaError = {
        name: 'PrismaClientValidationError',
        message: 'Invalid input provided',
      };

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid input provided',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        },
      });
    });

    it('should handle Prisma unique constraint errors', () => {
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource already exists',
          code: 'DUPLICATE_ERROR',
          statusCode: 409,
        },
      });
    });

    it('should handle Prisma not found errors', () => {
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
        message: 'Record not found',
      };

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
    });

    it('should handle Zod validation errors', () => {
      const zodError = {
        name: 'ZodError',
        errors: [
          {
            path: ['email'],
            message: 'Invalid email format',
          },
          {
            path: ['password'],
            message: 'Password must be at least 8 characters',
          },
        ],
      };

      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: [
            {
              field: 'email',
              message: 'Invalid email format',
            },
            {
              field: 'password',
              message: 'Password must be at least 8 characters',
            },
          ],
        },
      });
    });

    it('should handle JWT errors', () => {
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'Invalid token',
      };

      errorHandler(jwtError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          statusCode: 401,
        },
      });
    });

    it('should handle JWT expired errors', () => {
      const jwtError = {
        name: 'TokenExpiredError',
        message: 'Token expired',
      };

      errorHandler(jwtError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
          statusCode: 401,
        },
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = 'String error';

      errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

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

    it('should log errors in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');

      errorHandler(testError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('Error:', testError);
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log errors in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');

      errorHandler(testError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should sanitize error messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const sensitiveError = new Error('Database connection failed with password abc123');

      errorHandler(sensitiveError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('AppError class', () => {
    it('should create AppError with all parameters', () => {
      const error = new AppError('Test message', 'TEST_CODE', 400);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with default status code', () => {
      const error = new AppError('Test message', 'TEST_CODE');

      expect(error.statusCode).toBe(500);
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test message', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });
});