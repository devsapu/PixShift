/**
 * Admin Statistics API Endpoint
 * GET /api/admin/statistics
 * 
 * Gets system statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { TransformationStatus, BillingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const dayAgo = new Date(now);
    dayAgo.setHours(dayAgo.getHours() - 24);

    // Get all statistics in parallel
    const [
      totalUsers,
      totalTransformations,
      totalRevenue,
      activeUsers,
      transformationsToday,
      transformationsWeek,
      transformationsMonth,
      revenueToday,
      revenueWeek,
      revenueMonth,
      completedTransformations,
      failedTransformations,
      pendingTransformations,
      processingTransformations,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total transformations
      prisma.transformation.count(),

      // Total revenue (completed billing records)
      prisma.billingRecord.aggregate({
        where: {
          status: BillingStatus.COMPLETED,
        },
        _sum: {
          amount: true,
        },
      }),

      // Active users (last 24 hours)
      prisma.transformation.findMany({
        where: {
          createdAt: {
            gte: dayAgo,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      }),

      // Transformations today
      prisma.transformation.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      // Transformations this week
      prisma.transformation.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      }),

      // Transformations this month
      prisma.transformation.count({
        where: {
          createdAt: {
            gte: monthAgo,
          },
        },
      }),

      // Revenue today
      prisma.billingRecord.aggregate({
        where: {
          status: BillingStatus.COMPLETED,
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Revenue this week
      prisma.billingRecord.aggregate({
        where: {
          status: BillingStatus.COMPLETED,
          createdAt: {
            gte: weekAgo,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Revenue this month
      prisma.billingRecord.aggregate({
        where: {
          status: BillingStatus.COMPLETED,
          createdAt: {
            gte: monthAgo,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Completed transformations
      prisma.transformation.count({
        where: {
          status: TransformationStatus.COMPLETED,
        },
      }),

      // Failed transformations
      prisma.transformation.count({
        where: {
          status: TransformationStatus.FAILED,
        },
      }),

      // Pending transformations
      prisma.transformation.count({
        where: {
          status: TransformationStatus.PENDING,
        },
      }),

      // Processing transformations
      prisma.transformation.count({
        where: {
          status: TransformationStatus.PROCESSING,
        },
      }),
    ]);

    const statistics = {
      users: {
        total: totalUsers,
        active: activeUsers.length,
      },
      transformations: {
        total: totalTransformations,
        today: transformationsToday,
        week: transformationsWeek,
        month: transformationsMonth,
        byStatus: {
          completed: completedTransformations,
          failed: failedTransformations,
          pending: pendingTransformations,
          processing: processingTransformations,
        },
      },
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
        today: Number(revenueToday._sum.amount || 0),
        week: Number(revenueWeek._sum.amount || 0),
        month: Number(revenueMonth._sum.amount || 0),
      },
    };

    return NextResponse.json(
      {
        success: true,
        statistics,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

