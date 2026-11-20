import { getFoodJourneyById } from '@/services/FoodJourneyService';
import { generatePageMetadata } from '@/lib/seo';
import { parseSlug } from '@/lib/utils/genSlug';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { id } = parseSlug(slug);

  if (!id) {
    return generatePageMetadata({
      title: 'Food Journey Not Found',
      description: 'The food journey you are looking for could not be found.',
      url: `https://foodeez.ch/food-journey/${slug}`,
    });
  }

  const story = await getFoodJourneyById(Number(id));

  if (!story) {
    return generatePageMetadata({
      title: 'Food Journey Not Found',
      description: 'The food journey you are looking for could not be found.',
      url: `https://foodeez.ch/food-journey/${slug}`,
    });
  }

  const description = story.DESCRIPTION
    ? `${story.DESCRIPTION.substring(0, 155)}${story.DESCRIPTION.length > 155 ? '...' : ''}`
    : 'Explore this food journey on Foodeez.';

  return generatePageMetadata({
    title: story.TITLE || 'A Food Journey',
    description,
    keywords: story.TITLE?.split(' ') || ['food', 'journey', 'story'],
    image: story.PIC_1 || undefined,
    url: `https://foodeez.ch/food-journey/${slug}`,
  });
}

// Next.js reads metadata only from page and layout files; this layout exists to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
