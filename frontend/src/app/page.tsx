"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
const BusinessCTA = dynamic(() => import('@/components/home/CTAs/BusinessCTA'));
const FaqSection = dynamic(() => import('@/components/home/FaqSection'));
const HeroSection = dynamic(() => import('@/components/home/HeroSection'));
const FeaturedBusiness = dynamic(() => import('@/components/home/FeaturedBusiness'));
const TopRatedNearYou = dynamic(() => import('@/components/home/TopRatedNearYou'));
const MapSection = dynamic(() => import('@/components/home/MapSection'));
const GoogleMapsProvider = dynamic(() => import('@/components/providers/GoogleMapsProvider'));
const AdsBar1 = dynamic(() => import('@/components/home/AdsBar1'));
// const AdsBar2 = dynamic(() => import('@/components/home/AdsBar2'));
const TestimonialsSection = dynamic(() => import('@/components/home/FoodeezTestimonials/TestimonialsSection'));
const Separator = dynamic(() => import('@/components/ui/separator'));
const CommunitySection = dynamic(() => import('@/components/home/CommunitySection'));
const UpcomingEvents = dynamic(() => import('@/components/home/EventSection/UpcomingEvents'));
const FoodJourney = dynamic(() => import('@/components/home/CTAs/FoodJourney'));
const RecentBlogs = dynamic(() => import('@/components/home/RecentBlogs'));

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

export default function Home() {
  return (
    <div className="">
      <Suspense fallback={<LoadingSpinner />}>

        {/* Hero Section */}
        <AdsBar1 />
        <HeroSection />
        <AdsBar1 />
        {/* <AdsBar2 /> */}
        <Separator />

        {/* Top Rated Restaurants Near You */}
        <TopRatedNearYou />

        {/* Featured Business */}
        <FeaturedBusiness />
        <Separator />

        {/* Business CTA */}
        <BusinessCTA />
        <Separator />

        {/* Food Journey CTA */}
        <FoodJourney />
        <Separator />

        {/* Latest Blogs */}
        <RecentBlogs />
        <Separator />

        {/* Testimonials */}
        <TestimonialsSection />
        <Separator />

        {/* Upcoming Events */}
        <UpcomingEvents />
        <Separator />

        {/* Community Section */}
        <CommunitySection />
        <Separator />

        {/* FAQ Section */}
        <FaqSection />
        <Separator className="mb-0" />

        {/* Map Section */}
        <GoogleMapsProvider>
          <MapSection />
        </GoogleMapsProvider>

      </Suspense>
    </div>
  );
}

/*

Proper Started 5 April

From 5 - 28 April No record

28 April 3 hours

29 April 1.5 hour

30 April 3.5 hour

1 May 3 hours

2 May 1 hour

3 May 2.5 hour

4 May 2 hour

5 May No work

6 May 4 hours

9 - 25 May No Work

26 May 5.5 Hours 

27 May 6.5 + hours

28 May 3.5 hours

29 May No Work

30 May 3.5 hours

31 May 3+ hours

1 June 1.5 + hour

2 june 4 +  Hours

3 june 2.5 + hours

4 june 1.5 hours

5 june 2 hours

6 june 1 hour 

7 , 8 ,9 Eid ul adha 

10 june 2 hours 40 mins

11 june 2 hours 30 mins

12 june 3 hours 50 mins

13 june 2 hours 30 mins

14 june till 12 july record in google sheets

Form now all record will be saved in google sheets

*/
