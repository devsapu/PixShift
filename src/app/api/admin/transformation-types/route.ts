/**
 * Admin Transformation Types API Endpoint
 * GET /api/admin/transformation-types - List all transformation types
 * POST /api/admin/transformation-types - Create new transformation type
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validateRequiredFields } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET - List all transformation types (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const transformationTypes = await prisma.transformationType.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        transformationTypes,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST - Create new transformation type (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const { name, description, promptTemplate, enabled = true } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'promptTemplate']);
    if (!validation.valid) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        validation.errors.join(', '),
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Check if name already exists
    const existing = await prisma.transformationType.findUnique({
      where: { name },
    });

    if (existing) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Transformation type with this name already exists',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Create transformation type
    const transformationType = await prisma.transformationType.create({
      data: {
        id: uuidv4(),
        name,
        description: description || null,
        promptTemplate,
        enabled,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'CREATE',
        entityType: 'TRANSFORMATION_TYPE',
        entityId: transformationType.id,
        details: {
          name: transformationType.name,
          description: transformationType.description,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        transformationType,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

