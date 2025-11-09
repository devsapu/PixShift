/**
 * Transformation Share API Endpoint
 * GET /api/transformations/[id]/share
 * 
 * Generates shareable link for transformation
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

    // Check if transformation is completed
    if (transformation.status !== 'COMPLETED') {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Transformation not completed',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Generate shareable URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/transformations/${id}`;

    // Get image URL for sharing
    let imageUrl: string | null = null;
    if (transformation.transformedImageUrl) {
      const storageService = getImageStorageService();
      const key = storageService.extractKeyFromUrl(transformation.transformedImageUrl);
      if (key) {
        imageUrl = await storageService.getSignedUrl(key, 3600 * 24); // 24 hour expiration
      }
    }

    return NextResponse.json(
      {
        success: true,
        share: {
          url: shareUrl,
          title: `Check out my ${transformation.transformationType.name} transformation!`,
          description: transformation.transformationType.description || '',
          imageUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

