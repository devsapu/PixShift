/**
 * Validation Utilities
 * Image and input validation functions
 */

import sharp from 'sharp';
import { ErrorCode, ApplicationError, ErrorCategory } from './errors';

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  width?: number;
  height?: number;
  size?: number;
  format?: string;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_IMAGE_DIMENSIONS = { width: 100, height: 100 };
export const MAX_IMAGE_DIMENSIONS = { width: 5000, height: 5000 };

/**
 * Validate image file type
 */
export function validateImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Validate image file size
 */
export function validateImageSize(file: File): boolean {
  return file.size <= MAX_IMAGE_SIZE;
}

/**
 * Validate image dimensions using Sharp
 */
export async function validateImageDimensions(
  imageBuffer: Buffer
): Promise<{ valid: boolean; width?: number; height?: number; errors: string[] }> {
  const errors: string[] = [];

  try {
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      errors.push('Unable to read image dimensions');
      return { valid: false, errors };
    }

    const { width, height } = metadata;

    if (width < MIN_IMAGE_DIMENSIONS.width || height < MIN_IMAGE_DIMENSIONS.height) {
      errors.push(
        `Image dimensions too small. Minimum: ${MIN_IMAGE_DIMENSIONS.width}x${MIN_IMAGE_DIMENSIONS.height} pixels`
      );
    }

    if (width > MAX_IMAGE_DIMENSIONS.width || height > MAX_IMAGE_DIMENSIONS.height) {
      errors.push(
        `Image dimensions too large. Maximum: ${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height} pixels`
      );
    }

    return {
      valid: errors.length === 0,
      width,
      height,
      errors,
    };
  } catch (error: any) {
    errors.push(`Failed to validate image dimensions: ${error.message}`);
    return { valid: false, errors };
  }
}

/**
 * Validate image file signature (magic bytes)
 */
export function validateImageSignature(buffer: Buffer): { valid: boolean; format?: string; errors: string[] } {
  const errors: string[] = [];

  // Check file signature (magic bytes)
  const jpegSignature = buffer.slice(0, 2).toString('hex');
  const pngSignature = buffer.slice(0, 8).toString('hex');
  const webpSignature = buffer.slice(0, 4).toString('ascii');

  if (jpegSignature === 'ffd8') {
    return { valid: true, format: 'jpeg' };
  } else if (pngSignature === '89504e470d0a1a0a') {
    return { valid: true, format: 'png' };
  } else if (webpSignature === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
    return { valid: true, format: 'webp' };
  } else {
    errors.push('Invalid image file signature. Only JPG, PNG, and WebP are supported.');
    return { valid: false, errors };
  }
}

/**
 * Comprehensive image validation
 */
export async function validateImage(
  file: File | Buffer,
  buffer?: Buffer
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  let imageBuffer: Buffer;

  // Get buffer
  if (file instanceof File) {
    imageBuffer = buffer || Buffer.from(await file.arrayBuffer());
  } else {
    imageBuffer = file;
  }

  // Validate file size
  if (file instanceof File && file.size > MAX_IMAGE_SIZE) {
    errors.push(`File size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

  if (imageBuffer.length > MAX_IMAGE_SIZE) {
    errors.push(`File size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

  // Validate file type
  if (file instanceof File && !validateImageType(file)) {
    errors.push(`Invalid file type. Only ${ALLOWED_IMAGE_TYPES.join(', ')} are supported.`);
  }

  // Validate file signature
  const signatureResult = validateImageSignature(imageBuffer);
  if (!signatureResult.valid) {
    errors.push(...signatureResult.errors);
  }

  // Validate dimensions
  const dimensionResult = await validateImageDimensions(imageBuffer);
  if (!dimensionResult.valid) {
    errors.push(...dimensionResult.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    width: dimensionResult.width,
    height: dimensionResult.height,
    size: file instanceof File ? file.size : imageBuffer.length,
    format: signatureResult.format,
  };
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`Field '${field}' is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

