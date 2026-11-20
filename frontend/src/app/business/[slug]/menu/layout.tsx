import { Metadata } from 'next';
import { extractBusinessId } from '@/lib/utils/genSlug';
import { getBusinessMenuOnly } from '@/services/MenuPageService';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const businessId = extractBusinessId(slug);

  if (!businessId) {
    return generatePageMetadata({
      title: 'Menu Not Found',
      description: 'The menu you are looking for does not seem to exist.',
      url: `https://foodeez.ch/business/${slug}/menu`,
    });
  }

  const menuCards = await getBusinessMenuOnly(businessId);
  const business = menuCards.length > 0 ? menuCards[0] : null;

  if (!business) {
    return generatePageMetadata({
      title: 'Menu Not Found',
      description: 'This business has not set up a menu yet.',
      url: `https://foodeez.ch/business/${slug}/menu`,
    });
  }

  const businessName = business.BUSINESS_NAME || 'this restaurant';

  return generatePageMetadata({
    title: `Menu for ${businessName}`,
    description: `Explore the delicious menu offerings from ${businessName} on Foodeez. Find your next favorite dish.`,
    keywords: [businessName, 'menu', 'food', 'dishes', 'restaurant menu'],
    url: `https://foodeez.ch/business/${slug}/menu`,
  });
}

// Next.js reads metadata only from page and layout files; this layout exists to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
