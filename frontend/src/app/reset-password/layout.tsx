import { generatePageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Reset Your Password',
  description: 'Reset your Foodeez account password to regain access. Enter your email to receive a password reset link.',
  url: 'https://foodeez.ch/reset-password',
  noindex: true, // It's best practice to not index password reset pages
});

// Next.js reads metadata only from page and layout files; this layout exists to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
