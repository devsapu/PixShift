/**
 * SMS OTP Request API Endpoint
 * POST /api/auth/sms/request-otp
 * 
 * Requests OTP code via SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, sendOTP, storeOTP, checkOTP } from '@/services/sms';
import { getSMSOTPConfig } from '@/lib/config';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validatePhone } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // Validate phone number
    if (!phoneNumber) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'Phone number is required',
        ErrorCategory.VALIDATION,
        400
      );
    }

    if (!validatePhone(phoneNumber)) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Invalid phone number format',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Check if OTP already exists and is still valid
    const existingOTP = await checkOTP(phoneNumber);
    if (existingOTP) {
      const config = getSMSOTPConfig();
      const cooldownSeconds = config.otp.resendCooldown;
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        `Please wait ${cooldownSeconds} seconds before requesting a new OTP`,
        ErrorCategory.VALIDATION,
        429
      );
    }

    // Generate OTP
    const config = getSMSOTPConfig();
    const otpCode = generateOTP(config.otp.length);

    // Store OTP
    await storeOTP(phoneNumber, otpCode);

    // Send OTP via SMS
    const result = await sendOTP(phoneNumber, otpCode);

    if (!result.success) {
      throw new ApplicationError(
        ErrorCode.API_ERROR,
        'Failed to send OTP. Please try again later.',
        ErrorCategory.API,
        500,
        { originalError: result.error }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: config.otp.expiration,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

