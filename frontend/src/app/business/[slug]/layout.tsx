import { Metadata } from "next";
import { parseSlug } from "@/lib/utils/genSlug";
import { getBusinessById } from "@/services/BusinessProfilePageService";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessById(Number(parseSlug(slug).id));

  if (!business) {
    return generatePageMetadata({
      title: 'Business Not Found',
      description: 'The business you are looking for could not be found.',
      url: `https://foodeez.ch/business/${slug}`,
      noindex: true,
    });
  }

  return generatePageMetadata({
    title: business.BUSINESS_NAME || "Business",
    description: `Discover ${business.BUSINESS_NAME || "this restaurant"} on Foodeez. View photos, hours, reviews and more.`,
    url: `https://foodeez.ch/business/${slug}`,
  });
}

// Next.js reads metadata only from page and layout files; this layout exists to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
