/**
 * Transformation Types API Endpoint
 * GET /api/transformation-types
 * 
 * Gets all enabled transformation types (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    // Get only enabled transformation types
    const transformationTypes = await prisma.transformationType.findMany({
      where: {
        enabled: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose promptTemplate to public
      },
      orderBy: { name: 'asc' },
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

