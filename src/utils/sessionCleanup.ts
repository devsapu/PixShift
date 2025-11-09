/**
 * Session Cleanup Utility
 * Handles image deletion when sessions expire
 */

import { getImageCleanupService } from '../services/imageCleanup';
import { logger } from './logger';

/**
 * Cleanup images for a user when their session expires
 */
export async function cleanupUserImagesOnSessionExpiration(userId: string): Promise<void> {
  try {
    const cleanupService = getImageCleanupService();
    await cleanupService.deleteUserImagesOnSessionExpiration(userId);
    logger.info('Cleaned up images for user on session expiration', { userId });
  } catch (error: any) {
    logger.error('Error cleaning up images for user on session expiration', {
      userId,
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Hook to be called when a session expires
 * This should be integrated with your session management system
 */
export function onSessionExpiration(userId: string): void {
  // Trigger cleanup asynchronously
  cleanupUserImagesOnSessionExpiration(userId).catch((error: any) => {
    logger.error('Failed to cleanup images for user on session expiration', {
      userId,
      error: error.message,
      stack: error.stack,
    });
  });
}

