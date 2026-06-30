import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UpdateFoodeezReviewData } from '@/types/foodeez-review.types';

// Helper function to serialize BigInt values
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.foodeez_review.findUnique({
      where: {
        FOODEEZ_REVIEW_ID: BigInt(params.id),
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Serialize BigInt values before sending response
    const serializedReview = serializeBigInt(review);

    return NextResponse.json(serializedReview);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateFoodeezReviewData = await request.json();

    // Check if review exists and user owns it or is admin
    const existingReview = await prisma.foodeez_review.findUnique({
      where: {
        FOODEEZ_REVIEW_ID: BigInt(params.id),
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

    const updatedReview = await prisma.foodeez_review.update({
      where: {
        FOODEEZ_REVIEW_ID: BigInt(params.id),
      },
      data: body,
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
  { params }: { params: { id: string } }
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
        FOODEEZ_REVIEW_ID: BigInt(params.id),
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
        FOODEEZ_REVIEW_ID: BigInt(params.id),
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
