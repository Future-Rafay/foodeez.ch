import { Metadata } from 'next';
import { BusinessGoogleData } from '@/types/google-business';
import type { business_detail_view_all } from '@/lib/prisma';

// --- NEW --- //
interface PageSEOProps {
  title: string;
  description: string;
  keywords?: string | string[];
  image?: string;
  url: string; // Page's canonical URL
  noindex?: boolean;
  nofollow?: boolean;
  breadcrumbs?: { name: string; url: string }[];
  structuredData?: Record<string, any> | Record<string, any>[];
}

/**
 * Generates a Next.js Metadata object for a page.
 * This is the modern replacement for the old SEO component.
 */
export function generatePageMetadata({
  title,
  description,
  keywords = ["food", "restaurants", "discovery", "reviews", "dining", "cuisine"],
  image = "/images/og-default.jpg",
  url,
  noindex = false,
  nofollow = false,
  breadcrumbs,
  structuredData,
}: PageSEOProps): Metadata {
  const fullImageUrl = image.startsWith('http') ? image : `https://foodeez.ch${image}`;

  // Combine all structured data into a single array
  const allStructuredData = [];
  if (breadcrumbs && breadcrumbs.length > 0) {
    allStructuredData.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((bc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: bc.name,
        item: bc.url,
      })),
    });
  }

  if (structuredData) {
    if (Array.isArray(structuredData)) {
      allStructuredData.push(...structuredData);
    } else {
      allStructuredData.push(structuredData);
    }
  }

  const metadata: Metadata = {
    title, // This will be combined with the template in the root layout
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
    },
    openGraph: {
      title,
      description,
      url,
      images: [fullImageUrl],
    },
    // Inject structured data using a script in the 'other' property
    ...(allStructuredData.length > 0 && {
      other: {
        'script[type="application/ld+json"]': JSON.stringify(allStructuredData),
      },
    }),
  };

  return metadata;
}
// --- END NEW --- //


// Build LocalBusiness/Restaurant structured data from DB + Google data
export function buildLocalBusinessSchema(
  business: Partial<business_detail_view_all>,
  google: Partial<BusinessGoogleData> | undefined,
  pageUrl: string
) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.BUSINESS_NAME || google?.name || 'Business',
    url: pageUrl,
  };

  if (business.IMAGE_URL || (google?.photos && google.photos[0]?.photoUrl)) {
    schema.image = business.IMAGE_URL || google?.photos?.[0]?.photoUrl;
  }

  if (google?.rating && google.totalReviews !== undefined) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: google.rating,
      reviewCount: google.totalReviews,
    };
  }

  if (google?.openingHours && google.openingHours.length > 0) {
    // Provide human-readable opening hours as string list (simple & valid)
    schema.openingHours = google.openingHours.map((h) => `${h.day} ${h.hours}`);
  }

  // Basic address if present in business view (best-effort)
  const address: any = {
    '@type': 'PostalAddress',
  };
  if ((business as any).STREET_ADDRESS) address.streetAddress = (business as any).STREET_ADDRESS;
  if ((business as any).CITY_NAME) address.addressLocality = (business as any).CITY_NAME;
  if ((business as any).POSTAL_CODE) address.postalCode = (business as any).POSTAL_CODE;
  if ((business as any).COUNTRY_NAME) address.addressCountry = (business as any).COUNTRY_NAME;
  if (Object.keys(address).length > 1) {
    schema.address = address;
  }

  // Geo from Google geometry if available
  const lat = (google as any)?.geometry?.location?.lat;
  const lng = (google as any)?.geometry?.location?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    };
  }

  return schema;
}

export function buildBusinessBreadcrumbs(
  siteUrl: string,
  parts: { name: string; slug?: string; url?: string }[]
) {
  // Return an array [{ name, url }]
  const items = [{ name: 'Home', url: siteUrl }];
  for (const p of parts) {
    items.push({ name: p.name, url: p.url || (p.slug ? `${siteUrl}/${p.slug}` : siteUrl) });
  }
  return items;
}
