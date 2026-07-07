"use client";

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import AdsBar1 from '@/components/home/AdsBar1';
import HeroSection from '@/components/home/HeroSection';
import Separator from '@/components/ui/separator';

const BusinessCTA = dynamic(() => import('@/components/home/CTAs/BusinessCTA'), { ssr: false, loading: () => null });
const FaqSection = dynamic(() => import('@/components/home/FaqSection'), { ssr: false, loading: () => null });
const FeaturedBusiness = dynamic(() => import('@/components/home/FeaturedBusiness'), { ssr: false, loading: () => null });
const TopRatedNearYou = dynamic(() => import('@/components/home/TopRatedNearYou'), { ssr: false, loading: () => null });
const MapSection = dynamic(() => import('@/components/home/MapSection'), { ssr: false, loading: () => null });
const GoogleMapsProvider = dynamic(() => import('@/components/providers/GoogleMapsProvider'), { ssr: false, loading: () => null });
const TestimonialsSection = dynamic(() => import('@/components/home/FoodeezTestimonials/TestimonialsSection'), { ssr: false, loading: () => null });
const CommunitySection = dynamic(() => import('@/components/home/CommunitySection'), { ssr: false, loading: () => null });
const UpcomingEvents = dynamic(() => import('@/components/home/EventSection/UpcomingEvents'), { ssr: false, loading: () => null });
const FoodJourney = dynamic(() => import('@/components/home/CTAs/FoodJourney'), { ssr: false, loading: () => null });
const RecentBlogs = dynamic(() => import('@/components/home/RecentBlogs'), { ssr: false, loading: () => null });

function LazyMapSection() {
  return (
    <LazyRender minHeight={600} rootMargin="300px">
      <GoogleMapsProvider>
        <MapSection />
      </GoogleMapsProvider>
    </LazyRender>
  );
}

function LazyRender({
  children,
  minHeight,
  rootMargin = '0px',
}: {
  children: React.ReactNode;
  minHeight: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin, shouldLoad]);

  return (
    <div ref={ref} style={{ minHeight: shouldLoad ? undefined : minHeight }}>
      {shouldLoad ? children : null}
    </div>
  );
}

export default function Home() {
  return (
    <div className="">
      {/* Hero Section */}
      <AdsBar1 />
      <HeroSection />
      <AdsBar1 />
      {/* <AdsBar2 /> */}
      <Separator />

      {/* Top Rated Restaurants Near You */}
      <LazyRender minHeight={700}>
        <TopRatedNearYou />
      </LazyRender>

      {/* Featured Business */}
      <LazyRender minHeight={900}>
        <FeaturedBusiness />
      </LazyRender>
      <Separator />

      {/* Business CTA */}
      <LazyRender minHeight={400}>
        <BusinessCTA />
      </LazyRender>
      <Separator />

      {/* Food Journey CTA */}
      <LazyRender minHeight={800}>
        <FoodJourney />
      </LazyRender>
      <Separator />

      {/* Latest Blogs */}
      <LazyRender minHeight={500}>
        <RecentBlogs />
      </LazyRender>
      <Separator />

      {/* Testimonials */}
      <LazyRender minHeight={700}>
        <TestimonialsSection />
      </LazyRender>
      <Separator />

      {/* Upcoming Events */}
      <LazyRender minHeight={600}>
        <UpcomingEvents />
      </LazyRender>
      <Separator />

      {/* Community Section */}
      <LazyRender minHeight={500}>
        <CommunitySection />
      </LazyRender>
      <Separator />

      {/* FAQ Section */}
      <LazyRender minHeight={500}>
        <FaqSection />
      </LazyRender>
      <Separator className="mb-0" />

      {/* Map Section */}
      <LazyMapSection />
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
