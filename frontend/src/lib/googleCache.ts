export const GOOGLE_DATA_TTL_MS = Number(
  process.env.NEXT_PUBLIC_GOOGLE_CACHE_TTL_MS ?? 90 * 24 * 60 * 60 * 1000
);

export type GoogleCacheSection = {
  hasData: boolean;
  fetchedAt: Date | string | null | undefined;
};

export type GoogleCacheStatus = {
  hasAnyData: boolean;
  hasAllData: boolean;
  isFresh: boolean;
  lastFetchedAt: Date | null;
};

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isGoogleDataFresh(
  fetchedAt: Date | string | null | undefined,
  ttlMs: number = GOOGLE_DATA_TTL_MS
): boolean {
  const date = normalizeDate(fetchedAt);
  if (!date) {
    return false;
  }

  return Date.now() - date.getTime() < ttlMs;
}

export function evaluateGoogleCache(
  sections: GoogleCacheSection[],
  ttlMs: number = GOOGLE_DATA_TTL_MS
): GoogleCacheStatus {
  const normalizedSections = sections.map(section => ({
    hasData: section.hasData,
    fetchedAt: normalizeDate(section.fetchedAt),
  }));

  const hasAnyData = normalizedSections.some(section => section.hasData);
  const hasAllData = normalizedSections.every(section => section.hasData && section.fetchedAt !== null);

  if (!hasAnyData) {
    return {
      hasAnyData: false,
      hasAllData: false,
      isFresh: false,
      lastFetchedAt: null,
    };
  }

  const availableDates = normalizedSections
    .map(section => section.fetchedAt)
    .filter((date): date is Date => Boolean(date));

  if (!hasAllData || availableDates.length === 0) {
    return {
      hasAnyData,
      hasAllData,
      isFresh: false,
      lastFetchedAt: availableDates.length > 0 ? new Date(Math.min(...availableDates.map(date => date.getTime()))) : null,
    };
  }

  const lastFetchedAt = new Date(Math.min(...availableDates.map(date => date.getTime())));

  return {
    hasAnyData,
    hasAllData,
    isFresh: Date.now() - lastFetchedAt.getTime() < ttlMs,
    lastFetchedAt,
  };
}
