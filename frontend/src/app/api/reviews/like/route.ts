import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publicFormRateLimitResponse } from '@/lib/checkout-rate-limit';

const DAY_MS = 24 * 60 * 60 * 1000;
// shortcut: one like per account per review per day via the rate-limit table (rows expire after 24h);
// replace with the visitor_review_like table in docs/sql/create_visitor_review_likes.sql for one like ever.
const LIKE_LIMITS = {
  ip: { limit: 50, windowMs: DAY_MS },
  email: { limit: 1, windowMs: DAY_MS },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { reviewId } = await request.json();
    const id = Number(reviewId);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }
    const review = await prisma.visitor_business_review.findUnique({
      where: { VISITOR_BUSINESS_REVIEW_ID: id },
      select: { APPROVED: true },
    });
    if (review?.APPROVED !== 1) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const limited = await publicFormRateLimitResponse(request.headers, `review-like:${id}`, session.user.email, LIKE_LIMITS);
    if (limited) return limited;

    // Increment LIKE_COUNT atomically
    const updated = await prisma.visitor_business_review.update({
      where: { VISITOR_BUSINESS_REVIEW_ID: id },
      data: { LIKE_COUNT: { increment: 1 } },
    });
    return NextResponse.json({ success: true, likeCount: updated.LIKE_COUNT });
  } catch (error) {
    console.error('Like review error:', error);
    return NextResponse.json({ error: 'Failed to like review' }, { status: 500 });
  }
}
