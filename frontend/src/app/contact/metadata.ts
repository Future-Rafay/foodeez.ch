import { generatePageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with the Foodeez team. We are here to help with any questions, feedback, or support requests.',
  url: 'https://foodeez.ch/contact',
});
