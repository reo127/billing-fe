'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * SIGNUP PAGE - DISABLED
 * 
 * This page is intentionally disabled for security reasons.
 * New users can only be created via API calls (e.g., using Postman).
 * 
 * To create a new user, make a POST request to:
 * POST http://localhost:5000/api/auth/signup
 * 
 * Request body:
 * {
 *   "name": "User Name",
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * The backend API endpoint remains fully functional.
 */

export default function Signup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8">
          <svg
            className="w-16 h-16 text-yellow-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Disabled
          </h1>
          <p className="text-gray-600 mb-4">
            User registration through the web interface is disabled.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            New users can only be created by administrators via API.
          </p>
          <p className="text-xs text-gray-400">
            Redirecting to login page...
          </p>
        </div>
      </div>
    </div>
  );
}
