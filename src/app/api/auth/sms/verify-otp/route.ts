/**
 * SMS OTP Verification API Endpoint
 * POST /api/auth/sms/verify-otp
 * 
 * Verifies OTP code and creates/updates user session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/services/sms';
import { prisma } from '@/lib/db';
import { AuthProvider, UserRole } from '@prisma/client';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validatePhone } from '@/lib/validation';
import { signIn } from 'next-auth/react';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode } = body;

    // Validate inputs
    if (!phoneNumber || !otpCode) {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        'Phone number and OTP code are required',
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

    // Verify OTP
    const isValid = await verifyOTP(phoneNumber, otpCode);

    if (!isValid) {
      throw new ApplicationError(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid or expired OTP code',
        ErrorCategory.AUTHENTICATION,
        401
      );
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { phone: phoneNumber },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone: phoneNumber,
          authProvider: AuthProvider.MOBILE,
          role: UserRole.GUEST,
          freeTierUsed: 0,
        },
      });
    } else {
      // Update auth provider if needed
      if (user.authProvider !== AuthProvider.MOBILE) {
        await prisma.user.update({
          where: { id: user.id },
          data: { authProvider: AuthProvider.MOBILE },
        });
      }
    }

    // Create session using NextAuth
    // Note: This is a simplified implementation
    // In production, you'd use NextAuth's signIn function properly
    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          phone: user.phone,
          authProvider: user.authProvider,
          role: user.role,
        },
        // In production, you'd return a session token or redirect
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

