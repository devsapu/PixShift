/**
 * User Statistics API Endpoint
 * GET /api/users/[id]/statistics
 * 
 * Gets user statistics and usage information
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUsageStatistics, getFreeTierStatus } from '@/services/billing';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = params;

    // Check if user is accessing their own statistics or is admin
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        'Access denied',
        ErrorCategory.AUTHENTICATION,
        403
      );
    }

    // Get usage statistics
    const usageStats = await getUsageStatistics(id);

    // Get free tier status
    const freeTierStatus = await getFreeTierStatus(id);

    // Get user pricing tier
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        pricingTier: true,
      },
    });

    // Get pricing tier details if set
    let pricingTierDetails = null;
    if (user?.pricingTier) {
      const { getPricingTiersConfig } = await import('@/lib/config');
      const pricingConfig = getPricingTiersConfig();
      const tier = pricingConfig.tiers[user.pricingTier as keyof typeof pricingConfig.tiers];
      if (tier) {
        pricingTierDetails = {
          id: user.pricingTier,
          name: tier.name,
          description: tier.description,
          pricing: tier.pricing,
          features: tier.features,
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        statistics: {
          ...usageStats,
          freeTier: freeTierStatus,
          pricingTier: pricingTierDetails,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

