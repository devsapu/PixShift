/**
 * API Route: Download Transformation
 * GET /api/transformations/[id]/download
 * 
 * Downloads a transformed image and triggers immediate deletion
 * 
 * Note: This is a Pages Router endpoint. Consider migrating to App Router.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getImageStorageService } from '../../../../services/imageStorage';
import { getImageCleanupService } from '../../../../services/imageCleanup';
import { getCurrentUser } from '@/lib/auth';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Transformation ID is required' });
  }

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get transformation from database
    const transformation = await prisma.transformation.findUnique({
      where: { id },
    });

    if (!transformation) {
      return res.status(404).json({ error: 'Transformation not found' });
    }

    // Check ownership
    if (transformation.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if transformation is completed
    if (transformation.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Transformation not completed',
        status: transformation.status,
      });
    }

    // Check if image exists
    if (!transformation.transformedImageUrl) {
      return res.status(404).json({ error: 'Transformed image not found' });
    }

    const storageService = getImageStorageService();
    const key = storageService.extractKeyFromUrl(transformation.transformedImageUrl);

    if (!key) {
      return res.status(500).json({ error: 'Invalid image URL' });
    }

    // Check if image still exists
    const exists = await storageService.imageExists(key);
    if (!exists) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Get signed URL for download (or serve file directly for local storage)
    let downloadUrl: string;
    const storageType = process.env.IMAGE_STORAGE_TYPE || 'local';

    if (storageType === 's3') {
      // For S3, get signed URL
      downloadUrl = await storageService.getSignedUrl(key, 300); // 5 minute expiration
    } else {
      // For local storage, we'll serve the file directly
      // In a real implementation, you'd stream the file
      downloadUrl = await storageService.getSignedUrl(key);
    }

    // Mark as downloaded in database
    await prisma.transformation.update({
      where: { id },
      data: {
        downloadedAt: new Date(),
      },
    });

    // Delete image immediately after download (NFR6)
    // We'll schedule deletion after a short delay to ensure download completes
    const cleanupService = getImageCleanupService();
    
    // Delete immediately (or schedule for immediate deletion)
    setTimeout(async () => {
      await cleanupService.deleteAfterDownload(id);
    }, 1000); // 1 second delay to ensure download starts

    // Return download URL or redirect
    if (storageType === 's3') {
      // Redirect to signed URL
      return res.redirect(downloadUrl);
    } else {
      // For local storage, serve the file
      // In production, you'd use a proper file serving mechanism
      return res.status(200).json({
        downloadUrl,
        message: 'Image ready for download',
      });
    }
  } catch (error: any) {
    console.error(`[DownloadAPI] Error downloading transformation ${id}:`, error);
    return res.status(500).json({
      error: 'Failed to download image',
      message: error.message,
    });
  }
}

