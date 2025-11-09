/**
 * Admin Transformation Type API Endpoint
 * PUT /api/admin/transformation-types/[id] - Update transformation type
 * DELETE /api/admin/transformation-types/[id] - Delete transformation type
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * PUT - Update transformation type (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { id } = params;
    const body = await request.json();

    // Check if transformation type exists
    const existing = await prisma.transformationType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'Transformation type not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Check if name is being changed and if it conflicts
    if (body.name && body.name !== existing.name) {
      const nameConflict = await prisma.transformationType.findUnique({
        where: { name: body.name },
      });

      if (nameConflict) {
        throw new ApplicationError(
          ErrorCode.INVALID_INPUT_DATA,
          'Transformation type with this name already exists',
          ErrorCategory.VALIDATION,
          400
        );
      }
    }

    // Update transformation type
    const transformationType = await prisma.transformationType.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        promptTemplate: body.promptTemplate,
        enabled: body.enabled,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'UPDATE',
        entityType: 'TRANSFORMATION_TYPE',
        entityId: transformationType.id,
        details: {
          name: transformationType.name,
          description: transformationType.description,
          enabled: transformationType.enabled,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        transformationType,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE - Delete transformation type (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { id } = params;

    // Check if transformation type exists
    const existing = await prisma.transformationType.findUnique({
      where: { id },
      include: {
        transformations: {
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'Transformation type not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Check if transformation type is in use
    if (existing.transformations.length > 0) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Cannot delete transformation type that is in use',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Check if this is the last transformation type
    const totalCount = await prisma.transformationType.count();
    if (totalCount <= 1) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Cannot delete the last transformation type',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Delete transformation type
    await prisma.transformationType.delete({
      where: { id },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'DELETE',
        entityType: 'TRANSFORMATION_TYPE',
        entityId: id,
        details: {
          name: existing.name,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Transformation type deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

