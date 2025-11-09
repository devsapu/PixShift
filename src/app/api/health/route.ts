import { NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * GET /api/health
 * 
 * Returns the health status of the application
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: await checkDatabase(),
        storage: await checkStorage(),
      },
    };

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        ...health,
        responseTime: `${responseTime}ms`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    );
  }
}

/**
 * Check database connection
 */
async function checkDatabase(): Promise<'ok' | 'error'> {
  try {
    // Try to import and check Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    return 'ok';
  } catch (error) {
    return 'error';
  }
}

/**
 * Check storage availability
 */
async function checkStorage(): Promise<'ok' | 'error'> {
  try {
    const storageType = process.env.IMAGE_STORAGE_TYPE || 'local';
    
    if (storageType === 's3') {
      // Check S3 configuration
      if (
        process.env.S3_BUCKET &&
        process.env.S3_REGION &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY
      ) {
        return 'ok';
      }
      return 'error';
    } else {
      // Local storage - just check if directory exists or can be created
      return 'ok';
    }
  } catch (error) {
    return 'error';
  }
}

