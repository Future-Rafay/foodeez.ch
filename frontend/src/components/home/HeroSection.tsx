'use client';

import Image from 'next/image';
import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const desktopBanners = [
  {
    id: 1,
    src: '/images/banners/banner1.jpeg',
    alt: 'Foodeez Desktop Banner 1',
  },
  {
    id: 2,
    src: '/images/banners/banner2.jpeg',
    alt: 'Foodeez Desktop Banner 2',
  },
  {
    id: 3,
    src: '/images/banners/banner3.jpeg',
    alt: 'Foodeez Desktop Banner 3',
  },
];

const mobileBanners = [
  {
    id: 1,
    src: '/images/bannerForMobile/banner1.jpeg',
    alt: 'Foodeez Mobile Banner 1',
  },
  {
    id: 2,
    src: '/images/bannerForMobile/banner2.jpeg',
    alt: 'Foodeez Mobile Banner 2',
  },
  {
    id: 3,
    src: '/images/bannerForMobile/banner3.jpeg',
    alt: 'Foodeez Mobile Banner 3',
  },
];

const HeroSection = () => {
  const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [mobileRef, mobileApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  const scrollPrev = useCallback((api: any) => api?.scrollPrev(), []);
  const scrollNext = useCallback((api: any) => api?.scrollNext(), []);
  const scrollTo = useCallback((api: any, index: number) => api?.scrollTo(index), []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Desktop Carousel */}
      <div className="hidden md:block">
        <div className="embla" ref={desktopRef}>
          <div className="embla__container flex">
            {desktopBanners.map((banner) => (
              <div key={banner.id} className="embla__slide flex-[0_0_100%] min-w-0">
                <div className="relative w-full h-[560px]">
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 100vw, 0px"
                    priority={banner.id === 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="absolute inset-0 hidden md:flex items-center justify-between px-4">
          <button
            className="bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-lg"
            onClick={() => scrollPrev(desktopApi)}
            aria-label="Previous desktop banner slide"
          >
            <ChevronLeft />
          </button>
          <button
            className="bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-lg"
            onClick={() => scrollNext(desktopApi)}
            aria-label="Next desktop banner slide"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex gap-2">
          {desktopBanners.map((_, index) => (
            <button
              key={index}
              className="flex h-6 w-6 items-center justify-center rounded-full"
              onClick={() => scrollTo(desktopApi, index)}
              aria-label={`Go to desktop banner slide ${index + 1}`}
            >
              <span className="h-2 w-2 rounded-full bg-white/80 hover:bg-white transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden">
        <div className="embla" ref={mobileRef}>
          <div className="embla__container flex">
            {mobileBanners.map((banner) => (
              <div key={banner.id} className="embla__slide flex-[0_0_100%] min-w-0">
                <div className="relative w-full h-[560px]">
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    width={720}
                    height={400}
                    className="w-full h-[560px] object-contain"
                    sizes="(max-width: 768px) 294px, 0px"
                    priority={banner.id === 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="absolute inset-0 flex md:hidden items-center justify-between px-4">
          <button
            className="bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-lg"
            onClick={() => scrollPrev(mobileApi)}
            aria-label="Previous mobile banner slide"
          >
            <ChevronLeft />
          </button>
          <button
            className="bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-lg"
            onClick={() => scrollNext(mobileApi)}
            aria-label="Next mobile banner slide"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex md:hidden gap-2">
          {mobileBanners.map((_, index) => (
            <button
              key={index}
              className="flex h-6 w-6 items-center justify-center rounded-full"
              onClick={() => scrollTo(mobileApi, index)}
              aria-label={`Go to mobile banner slide ${index + 1}`}
            >
              <span className="h-2 w-2 rounded-full bg-white/80 hover:bg-white transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
