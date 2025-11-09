/**
 * Image Storage Service
 * Handles storage and retrieval of images with support for S3 and local filesystem
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';

export interface ImageStorageConfig {
  storageType: 's3' | 'local';
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  localConfig?: {
    basePath: string;
  };
}

export interface StoredImage {
  url: string;
  key: string;
  storageType: 's3' | 'local';
}

export class ImageStorageService {
  private config: ImageStorageConfig;
  private s3Client?: S3Client;

  constructor(config: ImageStorageConfig) {
    this.config = config;

    if (config.storageType === 's3' && config.s3Config) {
      this.s3Client = new S3Client({
        region: config.s3Config.region,
        credentials: {
          accessKeyId: config.s3Config.accessKeyId,
          secretAccessKey: config.s3Config.secretAccessKey,
        },
      });
    }

    // Ensure local storage directory exists
    if (config.storageType === 'local' && config.localConfig) {
      this.ensureLocalDirectory(config.localConfig.basePath);
    }
  }

  private async ensureLocalDirectory(basePath: string): Promise<void> {
    try {
      await fs.mkdir(basePath, { recursive: true });
      await fs.mkdir(path.join(basePath, 'uploads'), { recursive: true });
      await fs.mkdir(path.join(basePath, 'transformations'), { recursive: true });
    } catch (error) {
      console.error('Failed to create local storage directories:', error);
    }
  }

  /**
   * Store an image
   */
  async storeImage(
    imageBuffer: Buffer,
    userId: string,
    imageType: 'upload' | 'transformation',
    imageId: string,
    contentType: string = 'image/jpeg'
  ): Promise<StoredImage> {
    const key = this.generateKey(userId, imageType, imageId);

    if (this.config.storageType === 's3' && this.s3Client && this.config.s3Config) {
      return await this.storeInS3(imageBuffer, key, contentType);
    } else if (this.config.storageType === 'local' && this.config.localConfig) {
      return await this.storeLocally(imageBuffer, key);
    } else {
      throw new Error('Invalid storage configuration');
    }
  }

  private async storeInS3(
    imageBuffer: Buffer,
    key: string,
    contentType: string
  ): Promise<StoredImage> {
    if (!this.s3Client || !this.config.s3Config) {
      throw new Error('S3 client not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.s3Config.bucket,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    return {
      url: `s3://${this.config.s3Config.bucket}/${key}`,
      key,
      storageType: 's3',
    };
  }

  private async storeLocally(imageBuffer: Buffer, key: string): Promise<StoredImage> {
    if (!this.config.localConfig) {
      throw new Error('Local storage not configured');
    }

    const filePath = path.join(this.config.localConfig.basePath, key);
    const dirPath = path.dirname(filePath);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, imageBuffer);

    return {
      url: filePath,
      key,
      storageType: 'local',
    };
  }

  /**
   * Get a signed URL for downloading an image
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.storageType === 's3' && this.s3Client && this.config.s3Config) {
      const command = new GetObjectCommand({
        Bucket: this.config.s3Config.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } else if (this.config.storageType === 'local' && this.config.localConfig) {
      // For local storage, return a path that can be served via API route
      return `/api/images/${encodeURIComponent(key)}`;
    } else {
      throw new Error('Invalid storage configuration');
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(key: string): Promise<boolean> {
    try {
      if (this.config.storageType === 's3' && this.s3Client && this.config.s3Config) {
        return await this.deleteFromS3(key);
      } else if (this.config.storageType === 'local' && this.config.localConfig) {
        return await this.deleteLocally(key);
      } else {
        throw new Error('Invalid storage configuration');
      }
    } catch (error) {
      console.error(`Failed to delete image ${key}:`, error);
      return false;
    }
  }

  private async deleteFromS3(key: string): Promise<boolean> {
    if (!this.s3Client || !this.config.s3Config) {
      throw new Error('S3 client not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.s3Config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`Failed to delete from S3: ${key}`, error);
      return false;
    }
  }

  private async deleteLocally(key: string): Promise<boolean> {
    if (!this.config.localConfig) {
      throw new Error('Local storage not configured');
    }

    try {
      const filePath = path.join(this.config.localConfig.basePath, key);
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      // Ignore file not found errors
      if (error.code === 'ENOENT') {
        return true; // Already deleted
      }
      throw error;
    }
  }

  /**
   * Check if an image exists
   */
  async imageExists(key: string): Promise<boolean> {
    try {
      if (this.config.storageType === 's3' && this.s3Client && this.config.s3Config) {
        const command = new HeadObjectCommand({
          Bucket: this.config.s3Config.bucket,
          Key: key,
        });

        await this.s3Client.send(command);
        return true;
      } else if (this.config.storageType === 'local' && this.config.localConfig) {
        const filePath = path.join(this.config.localConfig.basePath, key);
        try {
          await fs.access(filePath);
          return true;
        } catch {
          return false;
        }
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Extract key from URL
   */
  extractKeyFromUrl(url: string): string | null {
    if (this.config.storageType === 's3' && this.config.s3Config) {
      // Extract key from s3://bucket/key or https://bucket.s3.region.amazonaws.com/key
      const s3Prefix = `s3://${this.config.s3Config.bucket}/`;
      if (url.startsWith(s3Prefix)) {
        return url.substring(s3Prefix.length);
      }
      const httpsPrefix = `https://${this.config.s3Config.bucket}.s3.`;
      if (url.startsWith(httpsPrefix)) {
        const parts = url.split('/');
        return parts.slice(3).join('/');
      }
    } else if (this.config.storageType === 'local' && this.config.localConfig) {
      // Extract key from local file path
      if (url.startsWith(this.config.localConfig.basePath)) {
        return url.substring(this.config.localConfig.basePath.length + 1);
      }
    }
    return null;
  }

  /**
   * Generate storage key
   */
  private generateKey(userId: string, imageType: 'upload' | 'transformation', imageId: string): string {
    const folder = imageType === 'upload' ? 'uploads' : 'transformations';
    const extension = 'jpg';
    return `${folder}/${userId}/${imageId}.${extension}`;
  }

  /**
   * List all images for a user (for cleanup)
   */
  async listUserImages(userId: string, imageType?: 'upload' | 'transformation'): Promise<string[]> {
    const keys: string[] = [];

    if (this.config.storageType === 's3' && this.s3Client && this.config.s3Config) {
      // S3 listing would require ListObjectsV2Command
      // For now, we'll rely on database records
      return keys;
    } else if (this.config.storageType === 'local' && this.config.localConfig) {
      const folders = imageType
        ? [imageType === 'upload' ? 'uploads' : 'transformations']
        : ['uploads', 'transformations'];

      for (const folder of folders) {
        const userDir = path.join(this.config.localConfig.basePath, folder, userId);
        try {
          const files = await fs.readdir(userDir);
          keys.push(...files.map((file) => `${folder}/${userId}/${file}`));
        } catch {
          // Directory doesn't exist, skip
        }
      }
    }

    return keys;
  }
}

// Singleton instance
let imageStorageService: ImageStorageService | null = null;

export function getImageStorageService(): ImageStorageService {
  if (!imageStorageService) {
    const storageType = (process.env.IMAGE_STORAGE_TYPE || 'local') as 's3' | 'local';

    const config: ImageStorageConfig = {
      storageType,
      s3Config:
        storageType === 's3'
          ? {
              bucket: process.env.S3_BUCKET || 'pixshift-temp',
              region: process.env.S3_REGION || 'us-east-1',
              accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            }
          : undefined,
      localConfig:
        storageType === 'local'
          ? {
              basePath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'storage', 'images'),
            }
          : undefined,
    };

    imageStorageService = new ImageStorageService(config);
  }

  return imageStorageService;
}

