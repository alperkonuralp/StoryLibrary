import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { formatError, isDevelopment } from '../utils/helpers';
import logger from '../utils/logger';
import type { ApiResponse } from '../types';

/**
 * Global error handler middleware
 * Handles all errors that occur in the application
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  (logger as any).logError(`Error in ${req.method} ${req.path}`, err, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorResponse: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    },
  };

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        details: err.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
        })),
      },
    };
  }
  
  // Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        statusCode = HTTP_STATUS.CONFLICT;
        const field = err.meta?.target as string[] || ['field'];
        errorResponse = {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `${field[0]} already exists`,
            details: {
              field: field[0],
              constraint: 'unique',
            },
          },
        };
        break;
      
      case 'P2025':
        // Record not found
        statusCode = HTTP_STATUS.NOT_FOUND;
        errorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: ERROR_MESSAGES.NOT_FOUND,
          },
        };
        break;
      
      case 'P2003':
        // Foreign key constraint violation
        statusCode = HTTP_STATUS.BAD_REQUEST;
        errorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reference to related record',
            details: {
              field: err.meta?.field_name,
              constraint: 'foreign_key',
            },
          },
        };
        break;
      
      case 'P2014':
        // Required relation violation
        statusCode = HTTP_STATUS.BAD_REQUEST;
        errorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Required relation is missing',
            details: {
              relation: err.meta?.relation_name,
            },
          },
        };
        break;
      
      default:
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        errorResponse = {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
            details: isDevelopment() ? {
              code: err.code,
              meta: err.meta,
            } : undefined,
          },
        };
    }
  }
  
  // Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
        details: isDevelopment() ? err.message : undefined,
      },
    };
  }
  
  // JWT errors
  else if (err instanceof JsonWebTokenError) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorResponse = {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
      },
    };
  }
  
  else if (err instanceof TokenExpiredError) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorResponse = {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Token expired',
      },
    };
  }
  
  // Multer file upload errors
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: ERROR_MESSAGES.FILE_TOO_LARGE,
      },
    };
  }
  
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: ERROR_MESSAGES.INVALID_FILE_TYPE,
      },
    };
  }
  
  // Custom application errors
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || ERROR_MESSAGES.VALIDATION_FAILED,
        details: err.details,
      },
    };
  }
  
  else if (err.name === 'AuthenticationError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorResponse = {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: err.message || ERROR_MESSAGES.UNAUTHORIZED,
      },
    };
  }
  
  else if (err.name === 'AuthorizationError') {
    statusCode = HTTP_STATUS.FORBIDDEN;
    errorResponse = {
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: err.message || ERROR_MESSAGES.FORBIDDEN,
      },
    };
  }
  
  else if (err.name === 'NotFoundError') {
    statusCode = HTTP_STATUS.NOT_FOUND;
    errorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message || ERROR_MESSAGES.NOT_FOUND,
      },
    };
  }
  
  else if (err.name === 'ConflictError') {
    statusCode = HTTP_STATUS.CONFLICT;
    errorResponse = {
      success: false,
      error: {
        code: 'CONFLICT',
        message: err.message,
      },
    };
  }
  
  // Rate limiting errors
  else if (err.type === 'entity.too.large') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload too large',
      },
    };
  }
  
  // Syntax errors (malformed JSON, etc.)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON format',
      },
    };
  }
  
  // Generic Error instances
  else if (err instanceof Error) {
    // Check if it's a known error type by message
    if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      errorResponse = {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'External service unavailable',
        },
      };
    } else {
      statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: isDevelopment() ? err.message : ERROR_MESSAGES.INTERNAL_ERROR,
          details: isDevelopment() ? {
            stack: err.stack,
          } : undefined,
        },
      };
    }
  }
  
  // Log error details for debugging
  if (statusCode >= 500) {
    logger.error('Internal server error:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  };

  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
};

/**
 * Custom error classes for application-specific errors
 */
export class ValidationError extends Error {
  public details?: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}