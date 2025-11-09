/**
 * SMS Service
 * Handles SMS OTP generation and sending via Twilio
 */

import { getSMSOTPConfig } from '@/lib/config';
import { logger } from '@/utils/logger';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

// Twilio client (will be imported when needed)
let twilioClient: any = null;

export interface OTPData {
  code: string;
  phoneNumber: string;
  expiresAt: Date;
  attempts: number;
}

export interface OTPResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Initialize Twilio client
 */
async function getTwilioClient() {
  if (!twilioClient) {
    try {
      const twilio = await import('twilio');
      const config = getSMSOTPConfig();

      if (!config.twilio.accountSid || !config.twilio.authToken) {
        throw new ApplicationError(
          ErrorCode.API_ERROR,
          'Twilio credentials not configured',
          ErrorCategory.API,
          500
        );
      }

      twilioClient = twilio.default(config.twilio.accountSid, config.twilio.authToken);
    } catch (error: any) {
      logger.error('Failed to initialize Twilio client', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  return twilioClient;
}

/**
 * Generate OTP code
 */
export function generateOTP(length: number = 6): string {
  const config = getSMSOTPConfig();
  const allowedChars = config.otp.allowedChars;
  let code = '';

  for (let i = 0; i < length; i++) {
    code += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
  }

  return code;
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(phoneNumber: string, code: string): Promise<OTPResult> {
  try {
    const config = getSMSOTPConfig();
    const client = await getTwilioClient();

    // Format message
    const message = config.message.template.replace('{code}', code);

    // Send SMS
    const messageResponse = await client.messages.create({
      body: message,
      from: config.message.from,
      to: phoneNumber,
    });

    logger.info('OTP sent successfully', {
      phoneNumber,
      messageId: messageResponse.sid,
    });

    return {
      success: true,
      messageId: messageResponse.sid,
    };
  } catch (error: any) {
    logger.error('Failed to send OTP', {
      phoneNumber,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Store OTP in database (using VerificationToken model)
 */
export async function storeOTP(phoneNumber: string, code: string): Promise<void> {
  try {
    const config = getSMSOTPConfig();
    const { prisma } = await import('@/lib/db');

    const expiresAt = new Date(Date.now() + config.otp.expiration * 1000);

    // Store OTP in VerificationToken table
    await prisma.verificationToken.create({
      data: {
        identifier: phoneNumber,
        token: code,
        expires: expiresAt,
      },
    });

    logger.info('OTP stored', {
      phoneNumber,
      expiresAt,
    });
  } catch (error: any) {
    logger.error('Failed to store OTP', {
      phoneNumber,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const config = getSMSOTPConfig();
    const { prisma } = await import('@/lib/db');

    // Find OTP
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: phoneNumber,
        token: code,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      logger.warn('OTP verification failed', {
        phoneNumber,
        reason: 'Invalid or expired OTP',
      });
      return false;
    }

    // Delete OTP after verification (single-use)
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: phoneNumber,
          token: code,
        },
      },
    });

    logger.info('OTP verified successfully', {
      phoneNumber,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to verify OTP', {
      phoneNumber,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Check if OTP exists and is valid
 */
export async function checkOTP(phoneNumber: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/db');

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: phoneNumber,
        expires: {
          gt: new Date(),
        },
      },
    });

    return !!verificationToken;
  } catch (error: any) {
    logger.error('Failed to check OTP', {
      phoneNumber,
      error: error.message,
    });
    return false;
  }
}

