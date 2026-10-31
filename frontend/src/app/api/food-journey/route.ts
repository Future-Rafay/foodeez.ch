import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user details from database
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    const journeyData = {
      VISITORS_ACCOUNT_ID: Number(user.VISITORS_ACCOUNT_ID),
      // Author identity always comes from the account, never from the request.
      VISITOR_NAME: `${user.FIRST_NAME} ${user.LAST_NAME}`,
      VISITOR_EMAIL_ADDRESS: session.user.email,
      VISITOR_PIC: user.PIC,
      TITLE: body.TITLE,
      DESCRIPTION: body.DESCRIPTION,
      RESTAURANT_NAME: body.RESTAURANT_NAME,
      ADDRESS_GOOGLE_URL: body.ADDRESS_GOOGLE_URL,
      PIC_1: body.PIC_1,
      PIC_2: body.PIC_2,
      PIC_3: body.PIC_3,
      CREATION_DATETIME: new Date(),
    };

    const newJourney = await prisma.visitor_food_journey.create({
      data: journeyData,
    });

    return NextResponse.json(newJourney, { status: 201 });
  } catch (error) {
    console.error('Error creating food journey:', error);
    return NextResponse.json({ error: 'Failed to create food journey' }, { status: 500 });
  }
} 