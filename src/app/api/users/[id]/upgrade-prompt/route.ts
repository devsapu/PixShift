/**
 * Upgrade Prompt API Endpoint
 * GET /api/users/[id]/upgrade-prompt
 * 
 * Gets upgrade prompt information for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFreeTierStatus } from '@/services/billing';
import { getPricingTiersConfig } from '@/lib/config';
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

    // Get free tier status
    const freeTierStatus = await getFreeTierStatus(id);

    // Get pricing tiers
    const pricingConfig = getPricingTiersConfig();
    const availableTiers = Object.entries(pricingConfig.tiers)
      .filter(([key]) => key !== 'free')
      .map(([key, tier]) => ({
        id: key,
        name: tier.name,
        description: tier.description,
        pricing: tier.pricing,
        features: tier.features,
      }));

    return NextResponse.json(
      {
        success: true,
        upgradePrompt: {
          show: freeTierStatus.exhausted,
          freeTier: freeTierStatus,
          availableTiers,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

