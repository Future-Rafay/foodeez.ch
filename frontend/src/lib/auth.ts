import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.visitors_account.findUnique({
          where: { EMAIL_ADDRESS: credentials.email }
        });

        if (!user || !user.PASSWORD) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.PASSWORD
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.VISITORS_ACCOUNT_ID.toString(),
          name: `${user.FIRST_NAME} ${user.LAST_NAME}`,
          email: user.EMAIL_ADDRESS,
          image: user.PIC,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.visitors_account.findUnique({
            where: { EMAIL_ADDRESS: user.email! }
          });

          if (!existingUser) {
            await prisma.visitors_account.create({
              data: {
                EMAIL_ADDRESS: user.email!,
                FIRST_NAME: user.name?.split(' ')[0] || '',
                LAST_NAME: user.name?.split(' ').slice(1).join(' ') || '',
                CREATION_DATETIME: new Date(),
                PIC: user.image || '',
                LANGUAGE: 'en',
              }
            });
          } else if (existingUser.PIC !== user.image) {
            // Update Google profile picture if it has changed
            await prisma.visitors_account.update({
              where: { EMAIL_ADDRESS: user.email! },
              data: { PIC: user.image || '' }
            });
          }
          return true;
        } catch (error) {
          console.error('[Google SignIn] Error:', error);
          return false;
        }
      }
      return true;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || token.sub || "");
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.picture = session.user.image;
      }

      if (account?.provider === 'google') {
        // Fetch user data for Google sign-in
        const dbUser = await prisma.visitors_account.findUnique({
          where: { EMAIL_ADDRESS: token.email! }
        });

        if (dbUser) {
          token.id = String(dbUser.VISITORS_ACCOUNT_ID);
          token.name = `${dbUser.FIRST_NAME} ${dbUser.LAST_NAME}`;
          token.picture = dbUser.PIC;
        }
      }

      return token;
    }
  },
  events: {
    async signOut() {
      // Clean up any session-related data if needed
      // console.log('User signed out:', token.email);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
