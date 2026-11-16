import { generatePageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Pricing Plans',
  description: 'Explore Foodeez pricing plans for businesses. Find the perfect plan to showcase your restaurant and connect with customers.',
  keywords: ['pricing', 'plans', 'subscription', 'business', 'restaurant marketing'],
  url: 'https://foodeez.ch/pricing',
});

// Next.js reads metadata only from page and layout files; this layout exists to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
