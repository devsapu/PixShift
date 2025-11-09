/**
 * Scheduled Cleanup Job
 * Runs every 5 minutes to delete old images
 */

import { getImageCleanupService } from './imageCleanup';
import { logger } from '../utils/logger';

export class CleanupJob {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMinutes = 5;

  /**
   * Start the cleanup job
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Job already running');
      return;
    }

    logger.info(`Starting cleanup job (runs every ${this.intervalMinutes} minutes)`);

    // Run immediately on start
    this.runCleanup();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Cleanup job stopped');
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<number> {
    if (this.isRunning) {
      logger.warn('Cleanup already in progress, skipping...');
      return 0;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting cleanup cycle...');
      const cleanupService = getImageCleanupService();
      const deletedCount = await cleanupService.deleteOldImages(this.intervalMinutes);

      const duration = Date.now() - startTime;
      logger.info('Cleanup cycle completed', {
        duration: `${duration}ms`,
        deletedCount,
      });

      return deletedCount;
    } catch (error: any) {
      logger.error('Error during cleanup cycle', {
        error: error.message,
        stack: error.stack,
      });
      return 0;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if job is running
   */
  isJobRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let cleanupJob: CleanupJob | null = null;

export function getCleanupJob(): CleanupJob {
  if (!cleanupJob) {
    cleanupJob = new CleanupJob();
  }
  return cleanupJob;
}

// Auto-start in server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Only start in production or when explicitly enabled
  if (process.env.ENABLE_CLEANUP_JOB === 'true' || process.env.NODE_ENV === 'production') {
    const job = getCleanupJob();
    job.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, stopping cleanup job...');
      job.stop();
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, stopping cleanup job...');
      job.stop();
    });
  }
}

