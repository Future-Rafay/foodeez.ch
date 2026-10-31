import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/services/EmailService';
import { publicFormRateLimitResponse } from '@/lib/checkout-rate-limit';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const limited = await publicFormRateLimitResponse(request.headers, 'forgot-password', String(email));
    if (limited) return limited;

    // Check if user exists
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: email },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json(
        { message: 'If an account exists, you will receive a password reset email' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.visitors_account.update({
      where: { EMAIL_ADDRESS: email },
      data: {
        RESET_TOKEN: resetToken,
        RESET_TOKEN_EXPIRY: resetTokenExpiry,
      },
    });

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send reset password email
    await sendEmail(
      email,
      'passwordReset',
      { resetUrl }
    );

    return NextResponse.json(
      { message: 'If an account exists, you will receive a password reset email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 