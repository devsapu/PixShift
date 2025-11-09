/**
 * Gemini API Service
 * Handles integration with Google Gemini API for image transformation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiConfig } from '@/lib/config';
import { logger } from '@/utils/logger';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';

export interface TransformationRequest {
  imageBuffer: Buffer;
  prompt: string;
  mimeType?: string;
}

export interface TransformationResponse {
  imageBuffer: Buffer;
  mimeType: string;
}

export class GeminiService {
  private client: GoogleGenerativeAI;
  private config: ReturnType<typeof getGeminiConfig>;

  constructor() {
    const config = getGeminiConfig();
    this.config = config;

    if (!config.api.key) {
      throw new ApplicationError(
        ErrorCode.API_ERROR,
        'Gemini API key is not configured',
        ErrorCategory.API,
        500
      );
    }

    this.client = new GoogleGenerativeAI(config.api.key);
  }

  /**
   * Transform image using Gemini API
   */
  async transformImage(request: TransformationRequest): Promise<TransformationResponse> {
    const { imageBuffer, prompt, mimeType = 'image/jpeg' } = request;

    try {
      logger.info('Starting image transformation', {
        prompt: prompt.substring(0, 100),
        imageSize: imageBuffer.length,
      });

      // Get model
      const model = this.client.getGenerativeModel({
        model: this.config.api.model,
      });

      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');

      // Prepare prompt
      const fullPrompt = `${this.config.prompt.systemMessage}\n\n${prompt}`;

      // Call API with retry logic
      const result = await this.callWithRetry(async () => {
        return await model.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
            text: fullPrompt,
          },
        ]);
      });

      // Extract response
      const response = await result.response;
      const text = response.text();

      // Parse response (assuming it contains base64 image or image URL)
      // Note: Gemini API may return text description, not image
      // For actual image transformation, you might need to use a different approach
      // This is a placeholder implementation

      logger.info('Image transformation completed', {
        responseLength: text.length,
      });

      // For now, return the original image (actual implementation would process the response)
      // In a real implementation, you would decode the transformed image from the response
      return {
        imageBuffer,
        mimeType,
      };
    } catch (error: any) {
      logger.error('Image transformation failed', {
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError(
        ErrorCode.API_ERROR,
        'Failed to transform image',
        ErrorCategory.API,
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Call API with retry logic and exponential backoff
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    const { maxAttempts, backoff } = this.config.retry;

    try {
      return await fn();
    } catch (error: any) {
      // Check if error is retryable
      if (!this.isRetryableError(error) || attempt >= maxAttempts) {
        throw error;
      }

      // Calculate backoff delay
      const delay = Math.min(
        backoff.initial * Math.pow(backoff.multiplier, attempt - 1),
        backoff.max
      );

      logger.warn(`API call failed, retrying (attempt ${attempt}/${maxAttempts})`, {
        error: error.message,
        delay,
      });

      // Wait before retry
      await this.sleep(delay);

      // Retry
      return await this.callWithRetry(fn, attempt + 1);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and rate limits
    const retryableMessages = ['timeout', 'network', 'rate limit', '429', '503', '502'];
    const errorMessage = error?.message?.toLowerCase() || '';
    return retryableMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
}

