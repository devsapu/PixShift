/**
 * Error Handling Utilities
 * Centralized error handling and categorization
 */

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  BILLING = 'BILLING',
  API = 'API',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  OAUTH_FAILED = 'OAUTH_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Billing errors
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  BILLING_RECORD_ERROR = 'BILLING_RECORD_ERROR',

  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_TIMEOUT = 'API_TIMEOUT',
  INVALID_API_RESPONSE = 'INVALID_API_RESPONSE',

  // Network errors
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED',

  // Validation errors
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_INPUT_DATA = 'INVALID_INPUT_DATA',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',

  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',

  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Unknown errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  category: ErrorCategory;
  details?: Record<string, any>;
  requestId?: string;
  statusCode?: number;
}

export class ApplicationError extends Error {
  public code: ErrorCode;
  public category: ErrorCategory;
  public details?: Record<string, any>;
  public requestId?: string;
  public statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    category: ErrorCategory,
    statusCode: number = 500,
    details?: Record<string, any>,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.category = category;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      details: this.details,
      requestId: this.requestId,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Categorize error based on error type
 */
export function categorizeError(error: any): ErrorCategory {
  if (error instanceof ApplicationError) {
    return error.category;
  }

  // Categorize based on error message or type
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorName = error?.name?.toLowerCase() || '';

  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('session') ||
    errorName.includes('auth')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (
    errorMessage.includes('payment') ||
    errorMessage.includes('billing') ||
    errorMessage.includes('stripe') ||
    errorMessage.includes('paypal')
  ) {
    return ErrorCategory.BILLING;
  }

  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorName.includes('network')
  ) {
    return ErrorCategory.NETWORK;
  }

  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }

  if (
    errorMessage.includes('database') ||
    errorMessage.includes('prisma') ||
    errorMessage.includes('query')
  ) {
    return ErrorCategory.DATABASE;
  }

  if (
    errorMessage.includes('storage') ||
    errorMessage.includes('s3') ||
    errorMessage.includes('file')
  ) {
    return ErrorCategory.STORAGE;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorCode, string> = {
    // Authentication
    [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
    [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
    [ErrorCode.OAUTH_FAILED]: 'Authentication failed. Please try again',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials. Please check your information',

    // Billing
    [ErrorCode.PAYMENT_DECLINED]: 'Your payment was declined. Please check your payment method',
    [ErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds. Please update your payment method',
    [ErrorCode.PAYMENT_GATEWAY_ERROR]: 'Payment processing error. Please try again later',
    [ErrorCode.BILLING_RECORD_ERROR]: 'Billing error. Please contact support',

    // API
    [ErrorCode.API_ERROR]: 'Service temporarily unavailable. Please try again later',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again',
    [ErrorCode.API_TIMEOUT]: 'Request timed out. Please try again',
    [ErrorCode.INVALID_API_RESPONSE]: 'Service error. Please try again later',

    // Network
    [ErrorCode.CONNECTION_TIMEOUT]: 'Connection timed out. Please check your internet connection',
    [ErrorCode.NETWORK_UNAVAILABLE]: 'Network unavailable. Please check your connection',
    [ErrorCode.DNS_RESOLUTION_FAILED]: 'Network error. Please try again later',

    // Validation
    [ErrorCode.INVALID_FILE_FORMAT]: 'Invalid file format. Please use JPG, PNG, or WebP',
    [ErrorCode.FILE_SIZE_EXCEEDED]: 'File too large. Maximum size is 10MB',
    [ErrorCode.INVALID_INPUT_DATA]: 'Invalid input. Please check your data',
    [ErrorCode.MISSING_REQUIRED_FIELDS]: 'Missing required information. Please fill all fields',

    // Database
    [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Database error. Please try again later',
    [ErrorCode.DATABASE_QUERY_ERROR]: 'Database error. Please try again later',
    [ErrorCode.RECORD_NOT_FOUND]: 'Record not found',

    // Storage
    [ErrorCode.STORAGE_ERROR]: 'Storage error. Please try again later',
    [ErrorCode.FILE_NOT_FOUND]: 'File not found',
    [ErrorCode.UPLOAD_FAILED]: 'Upload failed. Please try again',

    // Unknown
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again later',
  };

  return messages[error.code] || error.message;
}

/**
 * Get HTTP status code for error
 */
export function getStatusCode(error: AppError | ApplicationError): number {
  if (error instanceof ApplicationError) {
    return error.statusCode;
  }

  const statusCodes: Record<ErrorCode, number> = {
    // Authentication
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.SESSION_EXPIRED]: 401,
    [ErrorCode.OAUTH_FAILED]: 401,
    [ErrorCode.INVALID_CREDENTIALS]: 401,

    // Billing
    [ErrorCode.PAYMENT_DECLINED]: 402,
    [ErrorCode.INSUFFICIENT_FUNDS]: 402,
    [ErrorCode.PAYMENT_GATEWAY_ERROR]: 502,
    [ErrorCode.BILLING_RECORD_ERROR]: 500,

    // API
    [ErrorCode.API_ERROR]: 502,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.API_TIMEOUT]: 504,
    [ErrorCode.INVALID_API_RESPONSE]: 502,

    // Network
    [ErrorCode.CONNECTION_TIMEOUT]: 504,
    [ErrorCode.NETWORK_UNAVAILABLE]: 503,
    [ErrorCode.DNS_RESOLUTION_FAILED]: 503,

    // Validation
    [ErrorCode.INVALID_FILE_FORMAT]: 400,
    [ErrorCode.FILE_SIZE_EXCEEDED]: 400,
    [ErrorCode.INVALID_INPUT_DATA]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELDS]: 400,

    // Database
    [ErrorCode.DATABASE_CONNECTION_ERROR]: 503,
    [ErrorCode.DATABASE_QUERY_ERROR]: 500,
    [ErrorCode.RECORD_NOT_FOUND]: 404,

    // Storage
    [ErrorCode.STORAGE_ERROR]: 500,
    [ErrorCode.FILE_NOT_FOUND]: 404,
    [ErrorCode.UPLOAD_FAILED]: 500,

    // Unknown
    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  };

  return statusCodes[error.code] || 500;
}

/**
 * Generate request ID for error tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

