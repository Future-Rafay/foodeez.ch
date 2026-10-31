import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreateFoodeezReviewData } from '@/types/foodeez-review.types';
import { isValidRating, MAX_FOODEEZ_REVIEWS, serializeBigInt, withoutForeignEmail } from '@/lib/foodeez-review';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || MAX_FOODEEZ_REVIEWS;
    const offset = Number(searchParams.get('offset')) || 0;
    const session = await getServerSession(authOptions);
    const viewerEmail = session?.user?.email || null;

    // Public sees approved reviews only; a signed-in reviewer also sees their own pending ones.
    const reviews = await prisma.foodeez_review_view.findMany({
      where: viewerEmail
        ? { OR: [{ APPROVED: 1 }, { REVIEWER_EMAIL: viewerEmail }] }
        : { APPROVED: 1 },
      orderBy: {
        CREATION_DATETIME: 'desc',
      },
      take: Math.min(Math.max(1, limit), MAX_FOODEEZ_REVIEWS),
      skip: Math.max(0, offset),
    });

    // Serialize BigInt values before sending response; other reviewers' emails never leave the server.
    const serializedReviews = serializeBigInt(
      reviews.map((review) => withoutForeignEmail(review, viewerEmail))
    );

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
    const body: CreateFoodeezReviewData = await request.json();

    let reviewerName = body.REVIEWER_NAME;
    // Ownership is the session email only; a request cannot claim someone else's address.
    let reviewerEmail: string | null | undefined;
    let avatar = body.AVATAR;

    if (session?.user?.email) {
      // If logged in, get user details from DB
      const user = await prisma.visitors_account.findUnique({
        where: { EMAIL_ADDRESS: session.user.email }
      });
      if (user) {
        reviewerName = reviewerName || `${user.FIRST_NAME} ${user.LAST_NAME}`;
        reviewerEmail = session.user.email;
        avatar = user.PIC || "";
      } else {
        reviewerEmail = session.user.email;
      }
    }

    // Ensure reviewerEmail and avatar are never null and are string | undefined
    const safeReviewerEmail: string | undefined = reviewerEmail ?? undefined;
    const safeAvatar: string | undefined = avatar ?? undefined;

    if (!reviewerName || reviewerName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Reviewer name is required.' },
        { status: 400 }
      );
    }
    if (!isValidRating(body.RATING) || typeof body.REVIEW !== 'string' || !body.REVIEW.trim()) {
      return NextResponse.json({ error: 'Rating and review are required.' }, { status: 400 });
    }

    const reviewData = {
      REVIEWER_NAME: reviewerName.trim(),
      REVIEWER_EMAIL: safeReviewerEmail,
      AVATAR: safeAvatar,
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