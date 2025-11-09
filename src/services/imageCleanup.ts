/**
 * Image Cleanup Service
 * Handles deletion of images based on various triggers
 */

import { getImageStorageService } from './imageStorage';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CleanupOptions {
  deleteImmediately?: boolean;
  maxAgeMinutes?: number;
  logDeletions?: boolean;
}

export class ImageCleanupService {
  private storageService = getImageStorageService();

  /**
   * Delete an image immediately
   */
  async deleteImageImmediately(
    imageUrl: string,
    transformationId?: string,
    options: CleanupOptions = {}
  ): Promise<boolean> {
    const { logDeletions = true } = options;

    try {
      const key = this.storageService.extractKeyFromUrl(imageUrl);
      if (!key) {
        if (logDeletions) {
          console.warn(`[ImageCleanup] Could not extract key from URL: ${imageUrl}`);
        }
        return false;
      }

      const deleted = await this.storageService.deleteImage(key);

      if (deleted && logDeletions) {
        logger.logImageDeletion(imageUrl, transformationId, 'immediate');
      }

      // Update database if transformation ID is provided
      if (transformationId && deleted) {
        await this.updateTransformationAfterDeletion(transformationId);
      }

      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete image', {
        imageUrl,
        transformationId,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Delete images older than specified minutes
   */
  async deleteOldImages(maxAgeMinutes: number = 5): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let deletedCount = 0;

    try {
      // Find transformations with images that are older than cutoff time
      // and have been downloaded (or are older than 5 minutes regardless)
      const oldTransformations = await prisma.transformation.findMany({
        where: {
          transformedImageUrl: {
            not: null,
          },
          OR: [
            {
              // Images that were downloaded more than maxAgeMinutes ago
              downloadedAt: {
                lte: cutoffTime,
              },
            },
            {
              // Images that were created more than maxAgeMinutes ago and don't have download timestamp
              AND: [
                {
                  createdAt: {
                    lte: cutoffTime,
                  },
                },
                {
                  downloadedAt: null,
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          transformedImageUrl: true,
          originalImageUrl: true,
        },
      });

      for (const transformation of oldTransformations) {
        // Delete transformed image
        if (transformation.transformedImageUrl) {
          const deleted = await this.deleteImageImmediately(
            transformation.transformedImageUrl,
            transformation.id,
            { logDeletions: true }
          );
          if (deleted) deletedCount++;
        }

        // Delete original image if it's also old
        if (transformation.originalImageUrl) {
          const originalKey = this.storageService.extractKeyFromUrl(transformation.originalImageUrl);
          if (originalKey) {
            const fileStats = await this.getFileAge(transformation.originalImageUrl);
            if (fileStats && fileStats.ageMinutes >= maxAgeMinutes) {
              const deleted = await this.deleteImageImmediately(transformation.originalImageUrl, transformation.id);
              if (deleted) deletedCount++;
            }
          }
        }
      }

      logger.info('Cleanup job completed', { deletedCount });
      return deletedCount;
    } catch (error: any) {
      logger.error('Error in cleanup job', {
        error: error.message,
        stack: error.stack,
      });
      return deletedCount;
    }
  }

  /**
   * Delete images for a user when session expires
   */
  async deleteUserImagesOnSessionExpiration(userId: string): Promise<number> {
    let deletedCount = 0;

    try {
      const userTransformations = await prisma.transformation.findMany({
        where: {
          userId,
          transformedImageUrl: {
            not: null,
          },
        },
        select: {
          id: true,
          transformedImageUrl: true,
          originalImageUrl: true,
        },
      });

      for (const transformation of userTransformations) {
        if (transformation.transformedImageUrl) {
          const deleted = await this.deleteImageImmediately(
            transformation.transformedImageUrl,
            transformation.id,
            { logDeletions: true }
          );
          if (deleted) deletedCount++;
        }

        if (transformation.originalImageUrl) {
          const deleted = await this.deleteImageImmediately(transformation.originalImageUrl, transformation.id);
          if (deleted) deletedCount++;
        }
      }

      logger.info('Deleted user images on session expiration', {
        userId,
        deletedCount,
      });
      return deletedCount;
    } catch (error: any) {
      logger.error('Error deleting images for user on session expiration', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      return deletedCount;
    }
  }

  /**
   * Delete image after download (immediate deletion)
   */
  async deleteAfterDownload(transformationId: string): Promise<boolean> {
    try {
      const transformation = await prisma.transformation.findUnique({
        where: { id: transformationId },
        select: {
          id: true,
          transformedImageUrl: true,
          originalImageUrl: true,
        },
      });

      if (!transformation || !transformation.transformedImageUrl) {
        return false;
      }

      // Mark as downloaded
      await prisma.transformation.update({
        where: { id: transformationId },
        data: {
          downloadedAt: new Date(),
        },
      });

      // Delete transformed image immediately
      const deleted = await this.deleteImageImmediately(
        transformation.transformedImageUrl,
        transformationId,
        { logDeletions: true }
      );

      // Optionally delete original image as well
      if (transformation.originalImageUrl) {
        await this.deleteImageImmediately(transformation.originalImageUrl, transformationId);
      }

      return deleted;
    } catch (error: any) {
      logger.error('Error deleting image after download', {
        transformationId,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Update transformation record after deletion
   */
  private async updateTransformationAfterDeletion(transformationId: string): Promise<void> {
    try {
      await prisma.transformation.update({
        where: { id: transformationId },
        data: {
          transformedImageUrl: null,
          deletedAt: new Date(),
        },
      });
    } catch (error: any) {
      logger.error('Error updating transformation after deletion', {
        transformationId,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Get file age in minutes
   */
  private async getFileAge(imageUrl: string): Promise<{ ageMinutes: number; createdAt: Date } | null> {
    try {
      // Try to get from database first
      const transformation = await prisma.transformation.findFirst({
        where: {
          OR: [
            { transformedImageUrl: imageUrl },
            { originalImageUrl: imageUrl },
          ],
        },
        select: {
          createdAt: true,
        },
      });

      if (transformation) {
        const ageMinutes = (Date.now() - transformation.createdAt.getTime()) / (1000 * 60);
        return {
          ageMinutes,
          createdAt: transformation.createdAt,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Error getting file age', {
        imageUrl,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Cleanup all images for a specific transformation
   */
  async cleanupTransformationImages(transformationId: string): Promise<boolean> {
    try {
      const transformation = await prisma.transformation.findUnique({
        where: { id: transformationId },
        select: {
          id: true,
          transformedImageUrl: true,
          originalImageUrl: true,
        },
      });

      if (!transformation) {
        return false;
      }

      let allDeleted = true;

      if (transformation.transformedImageUrl) {
        const deleted = await this.deleteImageImmediately(
          transformation.transformedImageUrl,
          transformationId
        );
        allDeleted = allDeleted && deleted;
      }

      if (transformation.originalImageUrl) {
        const deleted = await this.deleteImageImmediately(
          transformation.originalImageUrl,
          transformationId
        );
        allDeleted = allDeleted && deleted;
      }

      return allDeleted;
    } catch (error: any) {
      logger.error('Error cleaning up transformation images', {
        transformationId,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }
}

// Singleton instance
let imageCleanupService: ImageCleanupService | null = null;

export function getImageCleanupService(): ImageCleanupService {
  if (!imageCleanupService) {
    imageCleanupService = new ImageCleanupService();
  }
  return imageCleanupService;
}

