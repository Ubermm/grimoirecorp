//@ts-nocheck
import type { NextAuthConfig } from 'next-auth';

const productionDomain = 'grimoire.tools';

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [], // Providers are defined in auth.ts
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? productionDomain : 'localhost'
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? productionDomain : 'localhost'
      }
    }
  },
  callbacks: {
    authorized({ auth, request }) {
      //that auth bug
      const { nextUrl } = request;
      const isMiddlewareSubrequest = request.headers.has('x-middleware-subrequest');

      if (isMiddlewareSubrequest) {
        return false;
      }

      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/org') || nextUrl.pathname.startsWith('/runs') || nextUrl.pathname.startsWith('/pod') || nextUrl.pathname.startsWith('/models');
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/org', nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;