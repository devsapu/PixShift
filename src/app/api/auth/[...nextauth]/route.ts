/**
 * NextAuth.js API Route
 * Handles authentication including Gmail OAuth
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { AuthProvider, UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          const authProvider =
            account.provider === 'google' ? AuthProvider.GMAIL : AuthProvider.FACEBOOK;

          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email || '' },
          });

          if (!existingUser) {
            // Create new user
            await prisma.user.create({
              data: {
                email: user.email || '',
                name: user.name || null,
                image: user.image || null,
                authProvider,
                role: UserRole.GUEST,
                freeTierUsed: 0,
              },
            });
          } else {
            // Update auth provider if needed
            if (existingUser.authProvider !== authProvider) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { authProvider },
              });
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        // Get user from database to include role and other fields
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email || '' },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.freeTierUsed = dbUser.freeTierUsed;
          session.user.pricingTier = dbUser.pricingTier;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

