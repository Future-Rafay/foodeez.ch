import { sendEmail } from '@/services/EmailService';
import { NextResponse } from 'next/server';
import { Prisma, prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  console.log('Reservation API called - Starting process');
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const {
      name,
      email,
      phone,
      date,
      time,
      guests,
      occasion,
      specialRequests,
      businessName,
      // businessEmail,
      businessId // Make sure this is passed from the frontend
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !guests || !businessName) {
      console.log('Validation failed - Missing required fields:', { name, email, phone, date, time, guests, businessName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Starting database operation');
    // Save to database
    try {
      const reservation = await prisma.reserve_table.create({
        data: {
          CREATION_DATETIME: new Date(),
          BUSINESS_ID: businessId,
          RESERVATION_SOURCE: 1,
          VISITOR_ID: 0,
          RESERVATION_AS_NAME: name,
          EMAIL_ADDRESS: email,
          PHONE_NUMBER: phone,
          RESERVATION_DATE: new Date(date),
          EXPECTED_TIME: time,
          RESERVATION_FOR: occasion || '',
          RESERVATION_NUMBER: Number(guests) || 0,
          REMARKS: specialRequests || '',
          STATUS: 1,
          ADMIN_REMARKS: '',
        }
      });
      console.log('Database operation successful:', reservation);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaError = error as Error & { code: string };
        console.error('Database operation failed:', prismaError.message, prismaError.code);
        throw new Error(`Database operation failed: ${prismaError.message} (Code: ${prismaError.code})`);
      }
      console.error('Database operation failed with unknown error:', error);
      throw new Error('Database operation failed with unknown error');
    }

    // Send confirmation email to customer
    console.log('Attempting to send customer confirmation email');
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
          guests,
          occasion,
          specialRequests,
          businessName
        }
      );
      console.log('Customer confirmation email sent successfully');
    } catch (error) {
      console.error('Failed to send customer email:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw error here, continue with admin notification
    }

    // Send notification email to admin
    console.log('Attempting to send admin notification email');
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
      console.log('Admin notification email sent successfully');
    } catch (error) {
      console.error('Failed to send admin email:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw error here as the reservation is already saved
    }

    return NextResponse.json(
      { message: 'Reservation request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reservation submission error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined
    });
    return NextResponse.json(
      {
        error: 'Failed to submit reservation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
