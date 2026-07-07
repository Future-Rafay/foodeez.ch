"use client";

import { getAdsLinkData } from "@/services/HomePageService";
import { adsLinkData } from "@/types/addlink.types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ScrollingBusinessBarProps {
  speed?: number;
}

const ScrollingBusinessBar: React.FC<ScrollingBusinessBarProps> = ({
  speed = 20,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [adsLinkData, setAdsLinkData] = useState<adsLinkData[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--speed", `${speed}s`);
    }
  }, [speed]);

  useEffect(() => {
    const fetchAdsLinkData = async () => {
      const adsLinkData = await getAdsLinkData();
      setAdsLinkData(adsLinkData);
    };
    fetchAdsLinkData();
  }, []);

  return (
    <div
      className="scroll-strip w-full overflow-hidden py-6 px-2 sm:px-4 bg-gradient-to-r from-gray-50 via-white to-gray-50"
      ref={containerRef}
      aria-label="Scrolling list of featured businesses"
    >
      <div className="scroll-content inline-block whitespace-nowrap animate-scroll">
        {[...adsLinkData, ...adsLinkData].map((biz, index) => (
          <a
            key={index}
            href={biz.WEB_ADDRESS || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={biz.BUSINESS_NAME || ""}
            className="inline-flex flex-col items-center justify-start mx-6 sm:mx-8 hover:scale-105 transition-transform duration-300 min-w-[120px]"
          >
            <div className="relative w-[clamp(60px,10vw,100px)] h-[clamp(60px,10vw,100px)] bg-white rounded-lg p-2 shadow-md hover:shadow-lg transition-shadow">
              <Image
                src={biz.LOGO_FILE || "/placeholder.png"}
                alt={biz.BUSINESS_NAME || ""}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 70px, 100px"
              />
            </div>
            <span className="text-xs sm:text-sm text-center mt-2 text-text-main max-w-[120px] truncate sm:line-clamp-2">
              {biz.BUSINESS_NAME}
            </span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .scroll-content {
          padding-left: 100%;
          animation: scroll-left var(--speed) linear infinite;
        }

        .scroll-strip:hover .scroll-content {
          animation-play-state: paused;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollingBusinessBar;
