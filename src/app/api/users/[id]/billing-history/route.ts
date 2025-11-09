/**
 * Billing History API Endpoint
 * GET /api/users/[id]/billing-history
 * 
 * Gets billing history for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBillingHistory } from '@/services/billing';
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

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const history = await getBillingHistory(id, limit, offset);

    return NextResponse.json(
      {
        success: true,
        billingHistory: history.records,
        total: history.total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

