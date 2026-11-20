import { NextResponse } from 'next/server';
import { emailVerificationToken } from '@/lib/email-verification';
import { getPublicAppOrigin } from '@/lib/public-app-url';
import { sendEmail } from '@/services/EmailService';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth';
import { publicFormRateLimitResponse } from '@/lib/checkout-rate-limit';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
    }

    const limited = await publicFormRateLimitResponse(req.headers, 'register', email);
    if (limited) return limited;

    // Check if user already exists
    const existingUser = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.visitors_account.create({
      data: {
        FIRST_NAME: firstName,
        LAST_NAME: lastName,
        EMAIL_ADDRESS: email,
        PASSWORD: hashedPassword,
        CREATION_DATETIME: new Date(),
        LANGUAGE: 'en', // Default language
      },
    });

    // The account cannot sign in with its password until this link is opened; a failed email can be resent from sign-in.
    const verifyUrl = `${getPublicAppOrigin()}/api/auth/verify-email?token=${encodeURIComponent(emailVerificationToken(user.VISITORS_ACCOUNT_ID, user.EMAIL_ADDRESS ?? email))}`;
    const emailed = await sendEmail(email, 'verifyEmail', { verifyUrl }).then(() => true, (error) => {
      console.error('Verification email failed:', error instanceof Error ? error.message : error);
      return false;
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        verificationEmailSent: emailed,
        user: {
          id: user.VISITORS_ACCOUNT_ID.toString(),
          email: user.EMAIL_ADDRESS,
          name: `${user.FIRST_NAME} ${user.LAST_NAME}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    );
  }
} 