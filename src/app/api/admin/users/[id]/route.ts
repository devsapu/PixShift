/**
 * Admin User Details API Endpoint
 * GET /api/admin/users/[id] - Get user details
 * PUT /api/admin/users/[id]/role - Update user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET - Get user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transformations: true,
            billingRecords: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'User not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Get additional statistics
    const [totalSpent, completedTransformations, recentTransformations] = await Promise.all([
      prisma.billingRecord.aggregate({
        where: {
          userId: user.id,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transformation.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
        },
      }),
      prisma.transformation.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          transformationType: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        user: {
          ...user,
          statistics: {
            totalTransformations: user._count.transformations,
            completedTransformations,
            totalBillingRecords: user._count.billingRecords,
            totalSpent: Number(totalSpent._sum.amount || 0),
          },
          recentTransformations,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT - Update user role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { id } = params;
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Invalid role. Valid roles: ADMIN, GUEST',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'User not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Prevent admin from removing their own admin role
    if (user.id === admin.id && role !== UserRole.ADMIN) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Cannot remove your own admin role',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: uuidv4(),
        adminUserId: admin.id,
        actionType: 'UPDATE',
        entityType: 'USER',
        entityId: user.id,
        details: {
          field: 'role',
          oldValue: user.role,
          newValue: role,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

