//auth.ts
import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

// Extend the default User type to include id and password
interface DatabaseUser extends User {
  id: string;
  password: string;
}

interface ExtendedSession extends Session {
  user: User & {
    id: string;
  };
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials || typeof credentials !== 'object') {
            console.log('No credentials provided');
            return null;
          }
          
          const { email, password } = credentials as { email: string; password: string };
          
          if (!email || !password) {
            console.log('Missing email or password');
            return null;
          }
      
          const users = await getUser(email);
          
          if (!users || users.length === 0) {
            console.log('No user found with email:', email);
            return null;
          }
          
          const user = users[0] as DatabaseUser;
      
          const passwordsMatch = await compare(password, user.password);
          
          if (!passwordsMatch) {
            console.log('Password does not match');
            return null;
          }
      
          // Return user object with required fields
          return {
            id: user.id,
            email: user.email,
            name: user.email // if you don't have a name field, use email
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});