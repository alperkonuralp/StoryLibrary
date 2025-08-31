export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: unknown;
  retryable?: boolean;
}

export class APIError extends Error implements ApiError {
  code?: string;
  status?: number;
  details?: unknown;
  retryable?: boolean;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: unknown,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }

  static fromResponse(response: Response, data?: any): APIError {
    const message = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    const code = data?.error?.code || 'UNKNOWN_ERROR';
    const retryable = response.status >= 500 || response.status === 429;
    
    return new APIError(message, response.status, code, data, retryable);
  }

  static isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message === 'Failed to fetch';
  }

  static isRetryable(error: any): boolean {
    if (APIError.isNetworkError(error)) return true;
    if (error instanceof APIError) return error.retryable || false;
    return false;
  }
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any, attempt: number) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = APIError.isRetryable
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxRetries || !retryCondition(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay * (0.5 + Math.random() * 0.5);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError;
}

export function createApiClient(baseUrl: string) {
  return {
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      return withRetry(async () => {
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw APIError.fromResponse(response, data);
        }

        return data;
      });
    },

    get<T>(endpoint: string, options?: RequestInit): Promise<T> {
      return this.request<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
      return this.request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
      return this.request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
      return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    },
  };
}

// Error message mapping for user-friendly messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'You need to log in to access this feature.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  DEFAULT: 'An unexpected error occurred. Please try again.',
} as const;

export function getErrorMessage(error: any): string {
  // Network errors
  if (APIError.isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // API errors with codes
  if (error instanceof APIError && error.code) {
    return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;
  }

  // HTTP status codes
  if (error instanceof APIError && error.status) {
    switch (error.status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.INTERNAL_ERROR;
      default:
        return error.message || ERROR_MESSAGES.DEFAULT;
    }
  }

  return error?.message || ERROR_MESSAGES.DEFAULT;
}

// Hook for handling async operations with error states
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}