import { sendEmail } from '@/services/EmailService';
import { NextResponse } from 'next/server';
import { publicFormRateLimitResponse } from '@/lib/checkout-rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const limited = await publicFormRateLimitResponse(request.headers, 'contact', email);
    if (limited) return limited;

    // Only the admin receives the message; echoing it to the typed address would let anyone send mail as Foodeez.
    await sendEmail(
      process.env.ADMIN_EMAIL || 'admin@foodeez.ch',
      'contact',
      { name, email, subject, message }
    );

    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
