import { generatePageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Food Journeys',
  description: 'Explore unique food journeys on Foodeez. Discover curated collections of restaurants and dishes based on themes, cuisines, and locations.',
  keywords: ['food journey', 'food guide', 'restaurant collection', 'themed dining', 'cuisine tour'],
  url: 'https://foodeez.ch/food-journey',
});
