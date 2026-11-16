import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pickReviewUpdate, serializeBigInt } from '@/lib/foodeez-review';
import { areUploadedMediaUrls } from '@/lib/s3-storage';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Check if review exists and user owns it or is admin
    const existingReview = await prisma.foodeez_review.findUnique({
      where: {
        FOODEEZ_REVIEW_ID: BigInt((await params).id),
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // For now, allow updates if user is the reviewer (you can add admin check later)
    if (existingReview.REVIEWER_EMAIL !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to update this review' },
        { status: 403 }
      );
    }

    const data = pickReviewUpdate(body);
    if (!areUploadedMediaUrls(
      [data.PIC_1, data.PIC_2, data.PIC_3],
      [existingReview.PIC_1, existingReview.PIC_2, existingReview.PIC_3]
    )) {
      return NextResponse.json({ error: 'Photos and videos must be uploaded through Foodeez.' }, { status: 400 });
    }

    const updatedReview = await prisma.foodeez_review.update({
      where: {
        FOODEEZ_REVIEW_ID: BigInt((await params).id),
      },
      data,
    });

    // Serialize BigInt values before sending response
    const serializedReview = serializeBigInt(updatedReview);

    return NextResponse.json(serializedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if review exists and user owns it
    const existingReview = await prisma.foodeez_review.findUnique({
      where: {
        FOODEEZ_REVIEW_ID: BigInt((await params).id),
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.REVIEWER_EMAIL !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this review' },
        { status: 403 }
      );
    }

    await prisma.foodeez_review.delete({
      where: {
        FOODEEZ_REVIEW_ID: BigInt((await params).id),
      },
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
} 
