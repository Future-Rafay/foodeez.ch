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
    // These fields reach the address typed above, so they must not be able to carry a message or a link.
    if (typeof name !== 'string' || name.trim().length > 60 || /https?:|www\.|[/@<>]/i.test(name)) {
      return NextResponse.json({ error: 'Enter your name (up to 60 characters).' }, { status: 400 });
    }
    if (typeof phone !== 'string' || !/^[+0-9 ()-]{6,20}$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    }
    if (typeof time !== 'string' || !/^\d{1,2}:\d{2}( [AP]M)?$/.test(time)) {
      return NextResponse.json({ error: 'Choose a valid time.' }, { status: 400 });
    }
    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) {
      return NextResponse.json({ error: 'Choose the number of guests.' }, { status: 400 });
    }
    const reservationDate = new Date(date);
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(reservationDate.getTime())) {
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
        RESERVATION_AS_NAME: name.trim(),
        EMAIL_ADDRESS: email,
        PHONE_NUMBER: phone.trim(),
        RESERVATION_DATE: reservationDate,
        EXPECTED_TIME: time,
        RESERVATION_FOR: occasion || '',
        RESERVATION_NUMBER: guestCount,
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
          guests: String(guestCount),
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
