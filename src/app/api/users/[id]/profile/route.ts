/**
 * User Profile API Endpoint
 * GET /api/users/[id]/profile - Get user profile
 * PUT /api/users/[id]/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errorHandler';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { validateEmail, validatePhone } from '@/lib/validation';
import { AuthProvider } from '@prisma/client';

/**
 * GET - Get user profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = params;

    // Check if user is accessing their own profile or is admin
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        'Access denied',
        ErrorCategory.AUTHENTICATION,
        403
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        image: true,
        authProvider: true,
        role: true,
        freeTierUsed: true,
        pricingTier: true,
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json(
      {
        success: true,
        profile: user,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT - Update user profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = params;

    // Check if user is updating their own profile or is admin
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        'Access denied',
        ErrorCategory.AUTHENTICATION,
        403
      );
    }

    const body = await request.json();
    const { email, phone, name } = body;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApplicationError(
        ErrorCode.RECORD_NOT_FOUND,
        'User not found',
        ErrorCategory.VALIDATION,
        404
      );
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Invalid email format',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT_DATA,
        'Invalid phone number format',
        ErrorCategory.VALIDATION,
        400
      );
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ApplicationError(
          ErrorCode.INVALID_INPUT_DATA,
          'Email already in use',
          ErrorCategory.VALIDATION,
          400
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: email || user.email,
        phone: phone !== undefined ? phone : user.phone,
        name: name !== undefined ? name : user.name,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        image: true,
        authProvider: true,
        role: true,
        freeTierUsed: true,
        pricingTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        profile: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

