"use client";

import { Card } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GoogleReview } from "@/types/google-business";

interface GoogleReviewsProps {
  reviews: GoogleReview[];
  GOOGLE_PROFILE: string;
}

export default function GoogleReviews({
  reviews,
  GOOGLE_PROFILE,
}: GoogleReviewsProps) {
  // Move hooks above early return
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
  }, [reviews]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.9;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollPosition, 300);
    }
  };

    // 🔒 If no reviews, hide entire component
    if (!reviews || reviews.length === 0) return null;

  return (
    <div className="relative w-full py-8 px-2 sm:px-4 lg:px-0">
      <h2 className="sub-heading mb-4">Google Reviews</h2>
      <div className="relative group">
        {showLeftButton && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
        )}

        <div
          id="no-scrollbar"
          ref={scrollRef}
          className="flex overflow-x-auto scroll-smooth space-x-4 py-2 scrollbar-hide"
          onScroll={checkScrollPosition}
        >
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="flex-shrink-0 min-w-[250px] w-full sm:w-[350px]"
            >
              <Card className="h-[340px] rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md hover:shadow-lg transition-all flex flex-col">
                <div className="flex items-center gap-4 mb-3">
                  {review.profile_photo_url ? (
                    <Image
                      src={review.profile_photo_url}
                      alt={review.author_name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover h-12 w-12"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-lg">
                        {review.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {review.author_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {review.relative_time_description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <div
                  id="no-scrollbar"
                  className="flex-grow overflow-y-auto pr-1 hide-scrollbar"
                >
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {review.text}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {showRightButton && reviews.length > 0 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Scroll Right"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        )}
      </div>
      {reviews.length > 0 && (
        <a
          href={GOOGLE_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className=""
        >
          <button className="btn-primary my-8">View more Google reviews</button>
        </a>
      )}
    </div>
  );
}
