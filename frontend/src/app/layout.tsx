import { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import AnnouncementBar1 from "@/components/layout/AnnouncementBar1";
import AnnouncementBar2 from "@/components/layout/AnnouncmentBar2";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: 'swap',
  preload: true,
});

const defaultMetadata: Metadata = {
  title: {
    default: "Foodeez - Food Discovery, Visit & Review Portal",
    template: "%s | Foodeez",
  },
  description: "Discover, visit, and review your favorite restaurants and food with Foodeez - the ultimate food discovery platform.",
  keywords: ["food", "restaurants", "discovery", "reviews", "dining", "cuisine", "foodie", "restaurant finder"],
  metadataBase: new URL('https://foodeez.ch'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Foodeez - Food Discovery, Visit & Review Portal",
    description: "Discover, visit, and review your favorite restaurants and food with Foodeez - the ultimate food discovery platform.",
    url: 'https://foodeez.ch',
    siteName: 'Foodeez',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Foodeez - Food Discovery, Visit & Review Portal",
    description: "Discover, visit, and review your favorite restaurants and food with Foodeez - the ultimate food discovery platform.",
    creator: '@foodeez.ch',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/Logo/LogoFoodeezMain.svg',
    apple: '/images/Logo/LogoFoodeezMain.svg',
    shortcut: '/images/Logo/LogoFoodeezMain.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="flex flex-col font-sans bg-background max-w-[1440px] mx-auto min-h-screen">
        <AuthProvider>
          <AnnouncementBar1 />
          <AnnouncementBar2 />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}

export const metadata = defaultMetadata;
