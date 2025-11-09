/**
 * Admin Action Logs API Endpoint
 * GET /api/admin/action-logs
 * 
 * Gets admin action logs with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const adminUserId = searchParams.get('adminUserId');
    const actionType = searchParams.get('actionType');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (adminUserId) {
      where.adminUserId = adminUserId;
    }

    if (actionType) {
      where.actionType = actionType;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Get action logs
    const [logs, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.adminAction.count({ where }),
    ]);

    // Filter by search term if provided
    let filteredLogs = logs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = logs.filter(
        (log) =>
          log.actionType.toLowerCase().includes(searchLower) ||
          log.entityType.toLowerCase().includes(searchLower) ||
          log.adminUser.email?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(
      {
        success: true,
        logs: filteredLogs,
        total: search ? filteredLogs.length : total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

