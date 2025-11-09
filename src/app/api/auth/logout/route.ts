/**
 * Logout API Endpoint
 * POST /api/auth/logout
 * 
 * Logs out the current user and invalidates session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { handleError } from '@/lib/errorHandler';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (session) {
      // Invalidate session in database
      const { prisma } = await import('@/lib/db');
      await prisma.session.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      logger.info('User logged out', {
        userId: session.user.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

