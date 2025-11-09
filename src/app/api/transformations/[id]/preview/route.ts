/**
 * Transformation Preview API Endpoint
 * GET /api/transformations/[id]/preview
 * 
 * Gets transformation details for preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { getImageStorageService } from '@/services/imageStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Get transformation
    const transformation = await prisma.transformation.findUnique({
      where: { id },
      include: {
        transformationType: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    if (!transformation) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'Transformation not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Check ownership
    if (transformation.userId !== user.id && user.role !== 'ADMIN') {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        'Access denied',
        ErrorCategory.AUTHENTICATION,
        403
      );
    }

    // Get signed URLs for images
    const storageService = getImageStorageService();
    let originalImageUrl: string | null = null;
    let transformedImageUrl: string | null = null;

    if (transformation.originalImageUrl) {
      const originalKey = storageService.extractKeyFromUrl(transformation.originalImageUrl);
      if (originalKey) {
        originalImageUrl = await storageService.getSignedUrl(originalKey, 3600);
      }
    }

    if (transformation.transformedImageUrl) {
      const transformedKey = storageService.extractKeyFromUrl(transformation.transformedImageUrl);
      if (transformedKey) {
        transformedImageUrl = await storageService.getSignedUrl(transformedKey, 3600);
      }
    }

    return NextResponse.json(
      {
        success: true,
        transformation: {
          id: transformation.id,
          status: transformation.status,
          originalImageUrl,
          transformedImageUrl,
          transformationType: transformation.transformationType,
          createdAt: transformation.createdAt,
          updatedAt: transformation.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

