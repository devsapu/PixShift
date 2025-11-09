/**
 * Admin Users API Endpoint
 * GET /api/admin/users
 * 
 * Gets all users with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { UserRole, AuthProvider } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const role = searchParams.get('role') as UserRole | null;
    const authProvider = searchParams.get('authProvider') as AuthProvider | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (authProvider) {
      where.authProvider = authProvider;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with statistics
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          image: true,
          authProvider: true,
          role: true,
          freeTierUsed: true,
          pricingTier: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              transformations: true,
              billingRecords: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    // Get additional statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [totalSpent, completedTransformations] = await Promise.all([
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
        ]);

        return {
          ...user,
          statistics: {
            totalTransformations: user._count.transformations,
            completedTransformations,
            totalBillingRecords: user._count.billingRecords,
            totalSpent: Number(totalSpent._sum.amount || 0),
          },
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        users: usersWithStats,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

