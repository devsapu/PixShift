'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'Authentication configuration error. Please contact support.',
    AccessDenied: 'Access denied. You do not have permission to access this resource.',
    Verification: 'Verification error. Please try again.',
    Default: 'An error occurred during authentication. Please try again.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-md w-full space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Authentication Error</h1>
          <p className="text-red-700 mb-6">{errorMessage}</p>
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full text-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

