/**
 * Next.js Middleware
 * Handles authentication and authorization for protected routes
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if route requires authentication
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicRoutes = ['/api/health', '/api/auth', '/auth'];
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }

        // Protected routes require authentication
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/transformations')) {
          return !!token;
        }

        // Admin routes require admin role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN';
        }

        return true;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/transformations/:path*',
    '/api/billing/:path*',
  ],
};

