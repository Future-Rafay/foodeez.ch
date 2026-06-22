import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessId, rating, remarks, picUrls, videoUrl } = body;

    // Validate required fields
    if (!businessId || !rating || !remarks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save review to DB
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Map picUrls to PIC_1...PIC_10
    const picFields: { [key: string]: string | null } = {};
    for (let i = 0; i < 10; i++) {
      picFields[`PIC_${i + 1}`] = picUrls?.[i] || null;
    }

    const review = await prisma.visitor_business_review.create({
      data: {
        BUSINESS_ID: Number(businessId),
        VISITORS_ACCOUNT_ID: Number(user.VISITORS_ACCOUNT_ID),
        RATING: String(rating),
        REMARKS: String(remarks),
        ...picFields,
        VIDEO_1: videoUrl || null,
        CREATION_DATETIME: new Date(),
        LIKE_COUNT: 0,
        APPROVED: 0,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { reviewId } = await request.json();
    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }
    // Find review and check ownership
    const review = await prisma.visitor_business_review.findUnique({
      where: { VISITOR_BUSINESS_REVIEW_ID: Number(reviewId) },
    });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    // Get user
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
    });
    if (!user || Number(review.VISITORS_ACCOUNT_ID) !== Number(user.VISITORS_ACCOUNT_ID)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.visitor_business_review.delete({
      where: { VISITOR_BUSINESS_REVIEW_ID: Number(reviewId) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { reviewId, remarks, rating, picUrls, videoUrl } = body;
    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }
    // Find review and check ownership
    const review = await prisma.visitor_business_review.findUnique({
      where: { VISITOR_BUSINESS_REVIEW_ID: Number(reviewId) },
    });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    // Get user
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
    });
    if (!user || Number(review.VISITORS_ACCOUNT_ID) !== Number(user.VISITORS_ACCOUNT_ID)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Map picUrls to PIC_1...PIC_10
    const picFields: { [key: string]: string | null } = {};
    for (let i = 0; i < 10; i++) {
      picFields[`PIC_${i + 1}`] = picUrls?.[i] || null;
    }
    const updated = await prisma.visitor_business_review.update({
      where: { VISITOR_BUSINESS_REVIEW_ID: Number(reviewId) },
      data: {
        REMARKS: remarks ? String(remarks) : undefined,
        RATING: rating ? String(rating) : undefined,
        ...picFields,
        VIDEO_1: videoUrl || null,
      },
    });
    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
