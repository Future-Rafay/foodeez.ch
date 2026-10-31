export const MAX_FOODEEZ_REVIEWS = 100;

export const isValidRating = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;

/** Keeps the reviewer email only when the viewer wrote the review, so the UI can still show owner actions. */
export function withoutForeignEmail<T extends { REVIEWER_EMAIL: string | null }>(
  review: T,
  viewerEmail: string | null
): T {
  return {
    ...review,
    REVIEWER_EMAIL: viewerEmail && review.REVIEWER_EMAIL === viewerEmail ? review.REVIEWER_EMAIL : null,
  };
}

/** The only fields a reviewer may change; every edit goes back to moderation. */
export function pickReviewUpdate(body: Record<string, unknown>) {
  const data: {
    REVIEWER_NAME?: string;
    RATING?: number;
    REVIEW?: string;
    PIC_1?: string | null;
    PIC_2?: string | null;
    PIC_3?: string | null;
    APPROVED: number;
  } = { APPROVED: 0 };
  if (typeof body.REVIEWER_NAME === "string" && body.REVIEWER_NAME.trim().length >= 2) {
    data.REVIEWER_NAME = body.REVIEWER_NAME.trim();
  }
  if (isValidRating(body.RATING)) data.RATING = Number(body.RATING);
  if (typeof body.REVIEW === "string" && body.REVIEW.trim()) data.REVIEW = body.REVIEW.trim();
  for (const key of ["PIC_1", "PIC_2", "PIC_3"] as const) {
    if (typeof body[key] === "string" || body[key] === null) data[key] = body[key] as string | null;
  }
  return data;
}
