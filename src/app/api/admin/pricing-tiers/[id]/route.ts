/**
 * Admin Pricing Tier API Endpoint
 * PUT /api/admin/pricing-tiers/[id] - Update pricing tier
 * DELETE /api/admin/pricing-tiers/[id] - Delete pricing tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPricingTiersConfig } from '@/lib/config';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';

/**
 * PUT - Update pricing tier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { id } = params;
    const body = await request.json();
    const { name, description, features, pricing } = body;

    // Validate pricing
    if (pricing && pricing.amount <= 0) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Pricing amount must be greater than 0',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Load current configuration
    const configPath = path.join(process.cwd(), 'config', 'pricing-tiers.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent) as any;

    // Check if tier exists
    if (!config.tiers[id]) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'Pricing tier not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Update tier
    if (name) config.tiers[id].name = name;
    if (description !== undefined) config.tiers[id].description = description;
    if (features) config.tiers[id].features = features;
    if (pricing) config.tiers[id].pricing = pricing;

    // Write back to file
    fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'UPDATE',
        entityType: 'PRICING_TIER',
        entityId: id,
        details: {
          name,
          description,
          pricing,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        tier: config.tiers[id],
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE - Delete pricing tier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { id } = params;

    // Prevent deleting free tier
    if (id === 'free') {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Cannot delete free tier',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Load current configuration
    const configPath = path.join(process.cwd(), 'config', 'pricing-tiers.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent) as any;

    // Check if tier exists
    if (!config.tiers[id]) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'Pricing tier not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Check if any users are using this tier
    const usersWithTier = await prisma.user.count({
      where: {
        pricingTier: id,
      },
    });

    if (usersWithTier > 0) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        `Cannot delete pricing tier. ${usersWithTier} user(s) are using this tier.`,
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Delete tier
    delete config.tiers[id];

    // Write back to file
    fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'DELETE',
        entityType: 'PRICING_TIER',
        entityId: id,
        details: {
          name: config.tiers[id]?.name,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pricing tier deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

