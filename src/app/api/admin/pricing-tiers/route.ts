/**
 * Admin Pricing Tiers API Endpoint
 * GET /api/admin/pricing-tiers - List all pricing tiers
 * POST /api/admin/pricing-tiers - Create new pricing tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPricingTiersConfig } from '@/lib/config';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validateRequiredFields } from '@/lib/validation';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * GET - List all pricing tiers
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const pricingConfig = getPricingTiersConfig();
    const tiers = Object.entries(pricingConfig.tiers).map(([key, tier]) => ({
      id: key,
      ...tier,
    }));

    return NextResponse.json(
      {
        success: true,
        tiers,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST - Create new pricing tier
 * Note: This updates the configuration file
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, name, description, features, pricing } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['id', 'name', 'pricing']);
    if (!validation.valid) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        validation.errors.join(', '),
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Validate pricing
    if (pricing.amount <= 0) {
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

    // Check if tier already exists
    if (config.tiers[id]) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Pricing tier with this ID already exists',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Add new tier
    config.tiers[id] = {
      name,
      description: description || '',
      features: features || {},
      pricing,
    };

    // Write back to file
    fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

    // Log admin action
    const { prisma } = await import('@/lib/db');
    const { v4: uuidv4 } = await import('uuid');
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'CREATE',
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
        tier: {
          id,
          name,
          description,
          features,
          pricing,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

