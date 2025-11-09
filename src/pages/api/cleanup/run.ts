/**
 * API Route: Manual Cleanup Job Trigger
 * POST /api/cleanup/run
 * 
 * Manually trigger the cleanup job (for testing or admin use)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCleanupJob } from '../../../services/cleanupJob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In production, add authentication/authorization check here
  // For now, allow manual trigger (can be restricted later)

  try {
    const job = getCleanupJob();
    const deletedCount = await job.runCleanup();

    return res.status(200).json({
      success: true,
      deletedCount,
      message: `Cleanup completed. Deleted ${deletedCount} images.`,
    });
  } catch (error: any) {
    console.error('[CleanupAPI] Error running cleanup:', error);
    return res.status(500).json({
      error: 'Failed to run cleanup',
      message: error.message,
    });
  }
}

