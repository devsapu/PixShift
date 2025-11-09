/**
 * Billing Service
 * Handles free tier tracking, billing records, and usage tracking
 */

import { prisma } from '@/lib/db';
import { logger } from '@/utils/logger';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { BillingStatus, TransformationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export const FREE_TIER_LIMIT = 5;

export interface FreeTierStatus {
  used: number;
  remaining: number;
  limit: number;
  exhausted: boolean;
}

export interface BillingRecordData {
  id: string;
  userId: string;
  transformationId?: string | null;
  amount: number;
  currency: string;
  status: BillingStatus;
  paymentGatewayTransactionId?: string | null;
  createdAt: Date;
}

/**
 * Get free tier status for a user
 */
export async function getFreeTierStatus(userId: string): Promise<FreeTierStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { freeTierUsed: true },
  });

  if (!user) {
    throw new ApplicationError(
      ErrorCode.RECORD_NOT_FOUND,
      'User not found',
      ErrorCategory.VALIDATION,
      404
    );
  }

  const used = user.freeTierUsed;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  const exhausted = used >= FREE_TIER_LIMIT;

  return {
    used,
    remaining,
    limit: FREE_TIER_LIMIT,
    exhausted,
  };
}

/**
 * Check if user can use free tier
 */
export async function canUseFreeTier(userId: string): Promise<boolean> {
  const status = await getFreeTierStatus(userId);
  return !status.exhausted;
}

/**
 * Increment free tier usage atomically
 * Returns true if successful, false if limit reached
 */
export async function incrementFreeTierUsage(userId: string): Promise<boolean> {
  try {
    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Lock the user row for update
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { freeTierUsed: true },
      });

      if (!user) {
        throw new ApplicationError(
          ErrorCode.RECORD_NOT_FOUND,
          'User not found',
          ErrorCategory.VALIDATION,
          404
        );
      }

      // Check if limit reached
      if (user.freeTierUsed >= FREE_TIER_LIMIT) {
        return false;
      }

      // Increment atomically
      await tx.user.update({
        where: { id: userId },
        data: {
          freeTierUsed: {
            increment: 1,
          },
        },
      });

      return true;
    });

    if (result) {
      logger.info('Free tier usage incremented', { userId });
    } else {
      logger.warn('Free tier limit reached', { userId });
    }

    return result;
  } catch (error: any) {
    logger.error('Failed to increment free tier usage', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Create billing record
 */
export async function createBillingRecord(
  userId: string,
  transformationId: string,
  amount: number,
  currency: string = 'USD',
  paymentGatewayTransactionId?: string,
  status: BillingStatus = BillingStatus.PENDING
): Promise<BillingRecordData> {
  try {
    const billingRecord = await prisma.billingRecord.create({
      data: {
        id: uuidv4(),
        userId,
        transformationId,
        amount,
        currency,
        status,
        paymentGatewayTransactionId,
      },
    });

    logger.info('Billing record created', {
      billingRecordId: billingRecord.id,
      userId,
      transformationId,
      amount,
    });

    return billingRecord as BillingRecordData;
  } catch (error: any) {
    logger.error('Failed to create billing record', {
      userId,
      transformationId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Update billing record status
 */
export async function updateBillingRecordStatus(
  billingRecordId: string,
  status: BillingStatus,
  paymentGatewayTransactionId?: string
): Promise<BillingRecordData> {
  try {
    const billingRecord = await prisma.billingRecord.update({
      where: { id: billingRecordId },
      data: {
        status,
        paymentGatewayTransactionId,
      },
    });

    logger.info('Billing record status updated', {
      billingRecordId,
      status,
    });

    return billingRecord as BillingRecordData;
  } catch (error: any) {
    logger.error('Failed to update billing record status', {
      billingRecordId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get billing history for a user
 */
export async function getBillingHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ records: BillingRecordData[]; total: number }> {
  try {
    const [records, total] = await Promise.all([
      prisma.billingRecord.findMany({
        where: { userId },
        include: {
          transformation: {
            select: {
              id: true,
              transformationType: {
                select: {
                  name: true,
                },
              },
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.billingRecord.count({
        where: { userId },
      }),
    ]);

    return {
      records: records as BillingRecordData[],
      total,
    };
  } catch (error: any) {
    logger.error('Failed to get billing history', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStatistics(userId: string): Promise<{
  totalTransformations: number;
  paidTransformations: number;
  freeTransformations: number;
  totalSpent: number;
  currency: string;
}> {
  try {
    const [transformations, billingRecords] = await Promise.all([
      prisma.transformation.count({
        where: {
          userId,
          status: TransformationStatus.COMPLETED,
        },
      }),
      prisma.billingRecord.findMany({
        where: {
          userId,
          status: BillingStatus.COMPLETED,
        },
        select: {
          amount: true,
          currency: true,
        },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { freeTierUsed: true },
    });

    const freeTransformations = user?.freeTierUsed || 0;
    const paidTransformations = transformations - freeTransformations;
    const totalSpent = billingRecords.reduce((sum, record) => sum + Number(record.amount), 0);
    const currency = billingRecords[0]?.currency || 'USD';

    return {
      totalTransformations: transformations,
      paidTransformations,
      freeTransformations,
      totalSpent,
      currency,
    };
  } catch (error: any) {
    logger.error('Failed to get usage statistics', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

