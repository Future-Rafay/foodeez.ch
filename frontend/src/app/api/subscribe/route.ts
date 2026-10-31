import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/services/EmailService';
import { publicFormRateLimitResponse } from '@/lib/checkout-rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json(
        { success: false, code: 'EMAIL_REQUIRED', message: 'Email is required.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, code: 'EMAIL_INVALID', message: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    const limited = await publicFormRateLimitResponse(request.headers, 'subscribe', email);
    if (limited) return limited;

    // Check if the email already exists
    const existingSubscription = await prisma.foodeez_subscription.findFirst({
      where: { EMAIL_ADDRESS: email },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          code: 'EMAIL_EXISTS',
          message: 'This email is already subscribed to our newsletter.',
        },
        { status: 400 }
      );
    }

    // Create new subscription
    await prisma.foodeez_subscription.create({
      data: {
        // The shared table has no auto-increment; random low digits stop same-millisecond sign-ups colliding.
        FOODEEZ_SUBSCRIPTION_ID: BigInt(Date.now()) * BigInt(1000) + BigInt(randomInt(1000)),
        EMAIL_ADDRESS: email,
        CREATION_DATETIME: new Date(),
      },
    });

    // The subscription is already saved; email delivery must not turn it into a false failure.
    try {
      await sendEmail(email, 'newsletter', { email });
    } catch (error) {
      console.error('Newsletter welcome email failed:', error);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to Foodeez updates!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    );
  }
}
