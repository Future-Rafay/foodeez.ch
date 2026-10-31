import { sendEmail } from '@/services/EmailService';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicFormRateLimitResponse } from '@/lib/checkout-rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      date,
      time,
      guests,
      occasion,
      specialRequests,
      businessId,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !guests || !Number.isInteger(Number(businessId))) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    const reservationDate = new Date(date);
    if (Number.isNaN(reservationDate.getTime())) {
      return NextResponse.json({ error: 'Enter a valid date.' }, { status: 400 });
    }

    // The restaurant name comes from the database, never from the request.
    const business = await prisma.business.findUnique({
      where: { BUSINESS_ID: Number(businessId) },
      select: { BUSINESS_NAME: true },
    });
    if (!business) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    const businessName = business.BUSINESS_NAME || 'Restaurant';

    const limited = await publicFormRateLimitResponse(request.headers, 'reservation', email);
    if (limited) return limited;

    await prisma.reserve_table.create({
      data: {
        CREATION_DATETIME: new Date(),
        BUSINESS_ID: Number(businessId),
        RESERVATION_SOURCE: 1,
        VISITOR_ID: 0,
        RESERVATION_AS_NAME: name,
        EMAIL_ADDRESS: email,
        PHONE_NUMBER: phone,
        RESERVATION_DATE: reservationDate,
        EXPECTED_TIME: time,
        RESERVATION_FOR: occasion || '',
        RESERVATION_NUMBER: Number(guests) || 0,
        REMARKS: specialRequests || '',
        STATUS: 1,
        ADMIN_REMARKS: '',
      }
    });

    // The customer copy leaves out free-text fields so the form cannot be used to send arbitrary text.
    try {
      await sendEmail(
        email,
        'reservation',
        {
          name,
          email,
          phone,
          date,
          time,
          guests: String(Number(guests) || 0),
          businessName
        }
      );
    } catch (error) {
      console.error('Failed to send customer reservation email:', error instanceof Error ? error.message : 'Unknown error');
      // The reservation is already saved; continue with the admin notification.
    }

    try {
      await sendEmail(
        process.env.ADMIN_EMAIL || "admin@foodeez.ch",
        'reservation',
        {
          name,
          email,
          phone,
          date,
          time,
          guests,
          occasion,
          specialRequests,
          businessName
        }
      );
    } catch (error) {
      console.error('Failed to send admin reservation email:', error instanceof Error ? error.message : 'Unknown error');
    }

    return NextResponse.json(
      { message: 'Reservation request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reservation submission error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to submit reservation request' },
      { status: 500 }
    );
  }
}
