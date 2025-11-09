/**
 * Authentication Utilities
 * Helper functions for authentication and authorization
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
  freeTierUsed: number;
  pricingTier?: string | null;
}

/**
 * Get current session
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return (session?.user as SessionUser) || null;
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  return user;
}

/**
 * Require admin role
 * Throws error if user is not admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.ADMIN;
}

