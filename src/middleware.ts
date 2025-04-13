// middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/models/:path*',
    '/org/:path*',
    '/pod/:path*',
    '/runs/:path*',
    '/api/:path*',
    '/login',
    '/register',
  ],
};