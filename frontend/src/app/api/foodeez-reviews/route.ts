import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreateFoodeezReviewData } from '@/types/foodeez-review.types';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const approved = searchParams.get('approved');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const whereClause: any = {};
    if (approved !== null) {
      whereClause.APPROVED = parseInt(approved);
    }

    const reviews = await prisma.foodeez_review_view.findMany({
      where: whereClause,
      orderBy: {
        CREATION_DATETIME: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    // Serialize BigInt values before sending response
    const serializedReviews = serializeBigInt(reviews);

    return NextResponse.json(serializedReviews);
  } catch (error) {
    console.error('Error fetching Foodeez reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateFoodeezReviewData = await request.json();
    
    // Get user details from database
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const reviewData = {
      REVIEWER_NAME: body.REVIEWER_NAME || `${user.FIRST_NAME} ${user.LAST_NAME}`,
      REVIEWER_EMAIL: body.REVIEWER_EMAIL || session.user.email,
      AVATAR: body.AVATAR || user.PIC,
      RATING: body.RATING,
      REVIEW: body.REVIEW,
      PIC_1: body.PIC_1,
      PIC_2: body.PIC_2,
      PIC_3: body.PIC_3,
      CREATION_DATETIME: new Date(),
      APPROVED: 0, // Default to pending approval
    };

    const newReview = await prisma.foodeez_review.create({
      data: reviewData,
    });

    // Serialize BigInt values before sending response
    const serializedReview = serializeBigInt(newReview);

    return NextResponse.json(serializedReview, { status: 201 });
  } catch (error) {
    console.error('Error creating Foodeez review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 