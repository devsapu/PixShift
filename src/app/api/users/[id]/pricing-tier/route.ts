/**
 * Pricing Tier API Endpoint
 * PUT /api/users/[id]/pricing-tier
 * 
 * Updates user's pricing tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPricingTiersConfig } from '@/lib/config';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validateRequiredFields } from '@/lib/validation';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = params;

    // Check if user is updating their own data or is admin
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        'Access denied',
        ErrorCategory.AUTHENTICATION,
        403
      );
    }

    const body = await request.json();
    const { pricingTier } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['pricingTier']);
    if (!validation.valid) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        validation.errors.join(', '),
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Validate pricing tier exists in configuration
    const pricingConfig = getPricingTiersConfig();
    const validTiers = Object.keys(pricingConfig.tiers);
    if (!validTiers.includes(pricingTier)) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        `Invalid pricing tier. Valid tiers: ${validTiers.join(', ')}`,
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Update user pricing tier
    const user = await prisma.user.update({
      where: { id },
      data: { pricingTier },
      select: {
        id: true,
        email: true,
        pricingTier: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

