/**
 * Transformations API Endpoint
 * POST /api/transformations
 * 
 * Creates a new transformation request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getImageStorageService } from '@/services/imageStorage';
import { getGeminiService } from '@/services/gemini';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { TransformationStatus } from '@prisma/client';
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

    // Parse request body
    const body = await request.json();
    const { imageUrl, transformationTypeId, prompt } = body;

    // Validate required fields
    if (!imageUrl || !transformationTypeId) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'Image URL and transformation type ID are required',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Get transformation type
    const transformationType = await prisma.transformationType.findUnique({
      where: { id: transformationTypeId },
    });

    if (!transformationType) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'Transformation type not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    if (!transformationType.enabled) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Transformation type is disabled',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Create transformation record
    const transformation = await prisma.transformation.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        transformationTypeId: transformationType.id,
        originalImageUrl: imageUrl,
        status: TransformationStatus.PENDING,
      },
    });

    // Check free tier before processing
    const { canUseFreeTier, incrementFreeTierUsage } = await import('@/services/billing');
    const canUseFree = await canUseFreeTier(user.id);

    if (!canUseFree && !user.pricingTier) {
      // Free tier exhausted and no pricing tier selected
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Free tier limit reached. Please upgrade to continue.',
        ErrorCategory.BILLING,
        402
      );
    }

    // If using free tier, increment usage atomically
    if (canUseFree) {
      const incremented = await incrementFreeTierUsage(user.id);
      if (!incremented) {
        throw new ApplicationError(
          ErrorCode.INVALID_INPUT_DATA,
          'Free tier limit reached. Please upgrade to continue.',
          ErrorCategory.BILLING,
          402
        );
      }
    }

    // Process transformation asynchronously
    processTransformation(transformation.id, user.id, user.pricingTier).catch((error) => {
      console.error(`Failed to process transformation ${transformation.id}:`, error);
    });

    return NextResponse.json(
      {
        success: true,
        transformation: {
          id: transformation.id,
          status: transformation.status,
          createdAt: transformation.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Process transformation asynchronously
 */
async function processTransformation(
  transformationId: string,
  userId: string,
  pricingTier?: string | null
): Promise<void> {
  try {
    // Update status to PROCESSING
    await prisma.transformation.update({
      where: { id: transformationId },
      data: { status: TransformationStatus.PROCESSING },
    });

    // Get transformation
    const transformation = await prisma.transformation.findUnique({
      where: { id: transformationId },
      include: {
        transformationType: true,
      },
    });

    if (!transformation) {
      throw new Error('Transformation not found');
    }

    // Get original image
    const storageService = getImageStorageService();
    const key = storageService.extractKeyFromUrl(transformation.originalImageUrl);

    if (!key) {
      throw new Error('Invalid image URL');
    }

    // Download image (in a real implementation, you'd fetch from storage)
    // For now, we'll use the image URL directly

    // Get prompt template
    const prompt = transformation.transformationType.promptTemplate;

    // Transform image using Gemini API
    const geminiService = getGeminiService();
    // Note: This is a simplified implementation
    // In a real implementation, you would:
    // 1. Download the image from storage
    // 2. Convert to buffer
    // 3. Call Gemini API
    // 4. Save transformed image
    // 5. Update transformation record

    // For now, we'll simulate the transformation
    // In production, implement actual Gemini API call

    // Update status to COMPLETED
    await prisma.transformation.update({
      where: { id: transformationId },
      data: {
        status: TransformationStatus.COMPLETED,
        transformedImageUrl: transformation.originalImageUrl, // Placeholder
      },
    });

    // If paid transformation, create billing record
    if (pricingTier && pricingTier !== 'free') {
      const { getPricingTiersConfig } = await import('@/lib/config');
      const pricingConfig = getPricingTiersConfig();
      const tier = pricingConfig.tiers[pricingTier as keyof typeof pricingConfig.tiers];

      if (tier && tier.pricing.model === 'pay-per-use' && tier.pricing.amount > 0) {
        const { createBillingRecord } = await import('@/services/billing');
        await createBillingRecord(
          userId,
          transformationId,
          Number(tier.pricing.amount),
          tier.pricing.currency,
          undefined, // Payment gateway transaction ID (set after payment)
          'PENDING' // Status (update after payment)
        );
      }
    }
  } catch (error: any) {
    // Update status to FAILED
    await prisma.transformation.update({
      where: { id: transformationId },
      data: {
        status: TransformationStatus.FAILED,
        errorMessage: error.message,
      },
    });
  }
}

