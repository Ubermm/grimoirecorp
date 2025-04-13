//@ts-nocheck
/**
 * Error handling and retry utilities
 */

import { runpodLogger } from './monitoring';

// Base class for all application errors
export class AppError extends Error {
  public code: string;
  public statusCode?: number;
  public isRetryable: boolean;
  
  constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500, isRetryable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    
    // Maintain stack trace
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, code, 400, false);
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, code, 404, false);
  }
}

// Unauthorized errors
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401, false);
  }
}

// Forbidden errors
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403, false);
  }
}

// Rate limit errors
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429, true);
  }
}

// Service unavailable errors
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503, true);
  }
}

// Timeout errors
export class TimeoutError extends AppError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT', 504, true);
  }
}

// External service errors (like RunPod)
export class ExternalServiceError extends AppError {
  constructor(message: string, service: string, code = 'EXTERNAL_SERVICE_ERROR') {
    super(`${service}: ${message}`, code, 502, true);
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    name?: string;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    name = 'operation',
    shouldRetry = (error) => error?.isRetryable === true
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt >= retries || !shouldRetry(error)) {
        runpodLogger.error(
          `${name} failed after ${attempt + 1} attempts`,
          error
        );
        throw error;
      }
      
      // Calculate delay
      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt),
        maxDelay
      );
      
      runpodLogger.warn(
        `${name} failed, retrying in ${delay}ms (${attempt + 1}/${retries})`,
        { error: error.message }
      );
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the throw above, but TypeScript doesn't know that
  throw lastError;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code
      },
      status: error.statusCode || 500
    };
  } else {
    return {
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      },
      status: 500
    };
  }
}