/**
 * Payment Intent API Endpoint
 * POST /api/payments/create-intent
 * 
 * Creates a payment intent for a transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPaymentService } from '@/services/payment';
import { getPricingTiersConfig } from '@/lib/config';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validateRequiredFields } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { transformationId } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['transformationId']);
    if (!validation.valid) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        validation.errors.join(', '),
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Get transformation
    const transformation = await prisma.transformation.findUnique({
      where: { id: transformationId },
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

    // Get pricing tier
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { pricingTier: true },
    });

    if (!userRecord?.pricingTier || userRecord.pricingTier === 'free') {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'No pricing tier selected',
        ErrorCategory.BILLING,
        400
      );
    }

    // Get pricing configuration
    const pricingConfig = getPricingTiersConfig();
    const tier = pricingConfig.tiers[userRecord.pricingTier as keyof typeof pricingConfig.tiers];

    if (!tier) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Invalid pricing tier',
        ErrorCategory.BILLING,
        400
      );
    }

    // Create payment intent
    const paymentService = getPaymentService();
    const paymentResponse = await paymentService.createPaymentIntent({
      userId: user.id,
      transformationId,
      amount: Number(tier.pricing.amount),
      currency: tier.pricing.currency,
      description: `Transformation: ${transformationId}`,
    });

    return NextResponse.json(
      {
        success: true,
        payment: paymentResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

