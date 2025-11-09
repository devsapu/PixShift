/**
 * Image Upload API Endpoint
 * POST /api/upload
 * 
 * Handles image upload with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { validateImage } from '@/lib/validation';
import { getImageStorageService } from '@/services/imageStorage';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        ErrorCategory.AUTHENTICATION,
        401
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'File is required',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image
    const validationResult = await validateImage(file, buffer);

    if (!validationResult.valid) {
      throw new ApplicationError(
        ErrorCode.INVALID_FILE_FORMAT,
        validationResult.errors.join(', '),
        ErrorCategory.VALIDATION,
        400,
        { errors: validationResult.errors }
      );
    }

    // Store image
    const storageService = getImageStorageService();
    const imageId = uuidv4();
    const storedImage = await storageService.storeImage(
      buffer,
      user.id,
      'upload',
      imageId,
      file.type
    );

    // Return image URL
    return NextResponse.json(
      {
        success: true,
        imageId,
        imageUrl: storedImage.url,
        key: storedImage.key,
        width: validationResult.width,
        height: validationResult.height,
        size: validationResult.size,
        format: validationResult.format,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

