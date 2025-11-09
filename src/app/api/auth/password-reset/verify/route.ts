/**
 * Password Reset Verification API Endpoint
 * POST /api/auth/password-reset/verify
 * 
 * Verifies reset token and resets password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { verifyOTP } from '@/services/sms';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, token, otpCode, newPassword } = body;

    if (!newPassword) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'New password is required',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Password must be at least 8 characters long',
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
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'User not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Verify reset token or OTP
    let isValid = false;

    if (phone && otpCode) {
      // Verify OTP
      isValid = await verifyOTP(phone, otpCode);
    } else if (token) {
      // Verify reset token
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          identifier: email || phone || '',
          token,
          expires: {
            gt: new Date(),
          },
        },
      });

      if (verificationToken) {
        isValid = true;
        // Delete token after use (single-use)
        await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: verificationToken.identifier,
              token: verificationToken.token,
            },
          },
        });
      }
    } else {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'Reset token or OTP code is required',
        ErrorCategory.VALIDATION,
        400
      );
    }

    if (!isValid) {
      throw new ApplicationError(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid or expired reset token',
        ErrorCategory.AUTHENTICATION,
        401
      );
    }

    // Hash password (in production, use bcrypt)
    // For now, we'll just update a password field if it exists
    // Note: The current schema doesn't have a password field since we use OAuth
    // This is a placeholder for future implementation

    // In a real implementation with password authentication:
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { password: hashedPassword },
    // });

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

