/**
 * Free Tier API Endpoint
 * GET /api/users/[id]/free-tier
 * 
 * Gets free tier status for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { getFreeTierStatus } from '@/services/billing';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = params;

    // Check if user is accessing their own data or is admin
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        'Access denied',
        ErrorCategory.AUTHENTICATION,
        403
      );
    }

    const status = await getFreeTierStatus(id);

    return NextResponse.json(
      {
        success: true,
        freeTier: status,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

