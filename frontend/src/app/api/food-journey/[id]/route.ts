import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const journey = await prisma.visitor_food_journey.findUnique({
      where: { VISITOR_FOOD_JOURNEY_ID: Number(params.id) }
    });
    if (!journey) {
      return NextResponse.json({ error: 'Food journey not found' }, { status: 404 });
    }
    if (String(journey.VISITORS_ACCOUNT_ID) !== String(user.VISITORS_ACCOUNT_ID)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    await prisma.visitor_food_journey.delete({
      where: { VISITOR_FOOD_JOURNEY_ID: Number(params.id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting food journey:', error);
    return NextResponse.json({ error: 'Failed to delete food journey' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const journey = await prisma.visitor_food_journey.findUnique({
      where: { VISITOR_FOOD_JOURNEY_ID: Number(params.id) }
    });
    if (!journey) {
      return NextResponse.json({ error: 'Food journey not found' }, { status: 404 });
    }
    if (String(journey.VISITORS_ACCOUNT_ID) !== String(user.VISITORS_ACCOUNT_ID)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const body = await request.json();
    const updatedJourney = await prisma.visitor_food_journey.update({
      where: { VISITOR_FOOD_JOURNEY_ID: Number(params.id) },
      data: {
        TITLE: body.TITLE,
        DESCRIPTION: body.DESCRIPTION,
        RESTAURANT_NAME: body.RESTAURANT_NAME,
        ADDRESS_GOOGLE_URL: body.ADDRESS_GOOGLE_URL,
        PIC_1: body.PIC_1,
        PIC_2: body.PIC_2,
        PIC_3: body.PIC_3,
        // An edited story must be moderated again.
        APPROVED: 0,
      },
    });
    return NextResponse.json(updatedJourney);
  } catch (error) {
    console.error('Error updating food journey:', error);
    return NextResponse.json({ error: 'Failed to update food journey' }, { status: 500 });
  }
} 