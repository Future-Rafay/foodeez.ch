import { Metadata } from 'next';
import { extractBusinessId } from '@/lib/utils/genSlug';
import { getBusinessById } from '@/services/BusinessProfilePageService';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const businessId = extractBusinessId(slug);

  if (!businessId) {
    return generatePageMetadata({
      title: 'Reviews Not Found',
      description: 'The business reviews you are looking for could not be found.',
      url: `https://foodeez.ch/business/${slug}/reviews`,
    });
  }

  const business = await getBusinessById(businessId);

  if (!business) {
    return generatePageMetadata({
      title: 'Business Not Found',
      description: 'The business you are looking for could not be found.',
      url: `https://foodeez.ch/business/${slug}/reviews`,
    });
  }

  const businessName = business.BUSINESS_NAME || 'this restaurant';

  return generatePageMetadata({
    title: `Reviews for ${businessName}`,
    description: `Read customer reviews and ratings for ${businessName} on Foodeez. See what others are saying before you visit.`,
    keywords: [businessName, 'reviews', 'ratings', 'customer feedback', 'restaurant reviews'],
    url: `https://foodeez.ch/business/${slug}/reviews`,
  });
}

// Next.js reads metadata only from page and layout files; this layout exists to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
