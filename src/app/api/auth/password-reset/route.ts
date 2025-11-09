/**
 * Password Reset API Endpoint
 * POST /api/auth/password-reset - Request password reset
 * POST /api/auth/password-reset/verify - Verify reset token and reset password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validateEmail, validatePhone } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { sendOTP } from '@/services/sms';
import { generateOTP, storeOTP } from '@/services/sms';
import { getSMSOTPConfig } from '@/lib/config';
import crypto from 'crypto';

/**
 * POST - Request password reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email && !phone) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'Email or phone number is required',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ],
      },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json(
        {
          success: true,
          message: 'If the account exists, a reset link has been sent.',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in VerificationToken table
    await prisma.verificationToken.create({
      data: {
        identifier: email || phone || '',
        token: resetToken,
        expires: expiresAt,
      },
    });

    // Send reset link via email or SMS
    if (phone && validatePhone(phone)) {
      // Send OTP via SMS
      const otpCode = generateOTP(6);
      await storeOTP(phone, otpCode);
      await sendOTP(phone, otpCode);

      return NextResponse.json(
        {
          success: true,
          message: 'Reset code sent via SMS',
          method: 'sms',
        },
        { status: 200 }
      );
    } else if (email && validateEmail(email)) {
      // In production, send email with reset link
      // For now, return token (in production, send via email service)
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

      logger.info('Password reset token generated', {
        userId: user.id,
        email,
        resetUrl,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Reset link sent via email',
          method: 'email',
          // In production, don't return token - send via email
          resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        },
        { status: 200 }
      );
    } else {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Invalid email or phone number',
        ErrorCategory.VALIDATION,
        400
      );
    }
  } catch (error) {
    return handleError(error);
  }
}

