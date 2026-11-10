import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { enforceRateLimit, LOGIN_LIMITS, RateLimitError } from './checkout-rate-limit';

export const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_SESSION_RECHECK_MS = 10 * 60 * 1000;

/** Short hash of the stored password hash. It changes whenever the password is reset, changed or cleared. */
export const passwordFingerprint = (hash: string | null | undefined) =>
  hash ? createHash('sha256').update(hash).digest('hex').slice(0, 16) : null;

/**
 * Password sessions remember the password they were issued for. At most every 10 minutes this
 * compares it with the account, so a session from before a reset or a Google sign-in (which clears
 * a password someone else registered) stops working. Returns false when the session must end;
 * otherwise records the check on the token.
 */
export async function checkPasswordSession(
  token: { email?: string | null; pwf?: string; pwCheckedAt?: number },
  readPassword: (email: string) => Promise<string | null | undefined>,
  now = Date.now()
) {
  if (!token.pwf || now - (token.pwCheckedAt ?? 0) < PASSWORD_SESSION_RECHECK_MS) return true;
  let password;
  try {
    password = await readPassword(token.email ?? '');
  } catch (error) {
    // A database blip must not sign everyone out; the next request checks again.
    console.error('[Session] Password check failed:', error);
    return true;
  }
  if (passwordFingerprint(password) !== token.pwf) return false;
  token.pwCheckedAt = now;
  return true;
}

/**
 * Reset links carry crypto.randomBytes(32).toString('hex'). Anything else is rejected before it
 * reaches Prisma, which would read an object such as {"not": ""} as a filter matching any account.
 */
export const isResetToken = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

/**
 * Registration does not verify email ownership, but Google does. Clearing the password on Google
 * sign-in removes any password someone else set by registering this address first. A password set
 * through a completed email reset is the owner's, so it stays.
 * shortcut: an expiry with no token marks a completed reset, and a newer unfinished reset request
 * hides it; replace with a verified-email column when a schema change is approved.
 */
export function googleAccountUpdate(
  existing: {
    PIC: string | null;
    PASSWORD: string | null;
    RESET_TOKEN: string | null;
    RESET_TOKEN_EXPIRY: Date | null;
  },
  image: string | null | undefined
) {
  const clearPassword = Boolean(existing.PASSWORD) && (Boolean(existing.RESET_TOKEN) || !existing.RESET_TOKEN_EXPIRY);
  if (existing.PIC === image && !clearPassword) return null;
  return { PIC: image || '', ...(clearPassword ? { PASSWORD: null } : {}) };
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          await enforceRateLimit(new Headers(req.headers as Record<string, string>), 'login', credentials.email, LOGIN_LIMITS);
        } catch (error) {
          if (error instanceof RateLimitError) throw new Error('Too many sign-in attempts. Please wait and try again.');
          throw error;
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
          pwf: passwordFingerprint(user.PASSWORD) ?? undefined,
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
          } else {
            const update = googleAccountUpdate(existingUser, user.image);
            if (update) {
              await prisma.visitors_account.update({
                where: { EMAIL_ADDRESS: user.email! },
                data: update
              });
            }
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
        // Only password sign-ins carry a fingerprint; Google sessions are not rechecked.
        token.pwf = user.pwf;
        token.pwCheckedAt = user.pwf ? Date.now() : undefined;
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

      const stillValid = await checkPasswordSession(token, async (email) =>
        (await prisma.visitors_account.findUnique({
          where: { EMAIL_ADDRESS: email },
          select: { PASSWORD: true },
        }))?.PASSWORD
      );
      // NextAuth clears the session cookie when this callback throws.
      if (!stillValid) throw new Error('Session ended because the account password changed.');

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
