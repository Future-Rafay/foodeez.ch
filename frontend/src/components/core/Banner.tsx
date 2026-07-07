'use client';

import Image from 'next/image';

interface BannerProps {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
}

const Banner: React.FC<BannerProps> = ({ desktopSrc, mobileSrc, alt }) => {
  return (
    <div className="w-full relative">
      {/* Mobile Banner */}
      <div className="block md:hidden">
        <Image
          src={mobileSrc}
          alt={alt}
          width={720}
          height={400}
          className="w-full h-auto object-contain"
          sizes="(max-width: 768px) 100vw, 0px"
        />
      </div>

      {/* Desktop Banner */}
      <div className="hidden md:block">
        <Image
          src={desktopSrc}
          alt={alt}
          width={1440}
          height={560}
          className="w-full h-auto object-contain"
          sizes="(min-width: 768px) 100vw, 0px"
        />
      </div>
    </div>
  );
};

export default Banner;
