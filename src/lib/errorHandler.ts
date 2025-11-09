/**
 * Error Handler Middleware
 * Handles errors and returns standardized error responses
 */

import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import {
  ApplicationError,
  categorizeError,
  getUserFriendlyMessage,
  getStatusCode,
  generateRequestId,
  ErrorCode,
  ErrorCategory,
} from './errors';

/**
 * Handle error and return standardized response
 */
export function handleError(error: unknown, requestId?: string): NextResponse {
  const reqId = requestId || generateRequestId();

  // Log error
  logger.error('Error occurred', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    requestId: reqId,
  });

  // Create ApplicationError if not already
  let appError: ApplicationError;

  if (error instanceof ApplicationError) {
    appError = error;
    appError.requestId = reqId;
  } else if (error instanceof Error) {
    const category = categorizeError(error);
    appError = new ApplicationError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      getUserFriendlyMessage({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: error.message,
        category,
      }),
      category,
      500,
      { originalError: error.message },
      reqId
    );
  } else {
    appError = new ApplicationError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      ErrorCategory.UNKNOWN,
      500,
      { originalError: String(error) },
      reqId
    );
  }

  // Get status code
  const statusCode = getStatusCode(appError);

  // Return standardized error response
  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: getUserFriendlyMessage(appError.toJSON()),
        category: appError.category,
        details: process.env.NODE_ENV === 'development' ? appError.details : undefined,
        requestId: appError.requestId,
      },
    },
    { status: statusCode }
  );
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, context?: any) => Promise<NextResponse>
) {
  return (req: Request, context?: any) => {
    return Promise.resolve(fn(req, context)).catch((error) => handleError(error));
  };
}

