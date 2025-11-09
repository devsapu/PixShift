/**
 * Transformation Status API Endpoint
 * GET /api/transformations/[id]/status
 * 
 * Gets the status of a transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';

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

    // Calculate progress (simplified)
    let progress = 0;
    if (transformation.status === 'PENDING') {
      progress = 0;
    } else if (transformation.status === 'PROCESSING') {
      progress = 50; // Estimate
    } else if (transformation.status === 'COMPLETED') {
      progress = 100;
    } else if (transformation.status === 'FAILED') {
      progress = 0;
    }

    return NextResponse.json(
      {
        success: true,
        transformation: {
          id: transformation.id,
          status: transformation.status,
          progress,
          errorMessage: transformation.errorMessage,
          createdAt: transformation.createdAt,
          updatedAt: transformation.updatedAt,
          transformationType: transformation.transformationType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

