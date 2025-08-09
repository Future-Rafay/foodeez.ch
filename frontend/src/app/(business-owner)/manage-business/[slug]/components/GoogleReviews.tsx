"use client";
import { Card } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GoogleReview } from "@/types/google-business";

interface GoogleReviewsProps {
  reviews: GoogleReview[];
}

export default function GoogleReviews({ reviews }: GoogleReviewsProps) {
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

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-4  mb-6">
        <p className="text-gray-600">No reviews available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full mb-8">
      <div className="relative group">
        {/* Left button */}
        {showLeftButton && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
        )}

        {/* Review Cards Carousel */}
        <div
        id="no-scrollbar"
          ref={scrollRef}
          className="flex overflow-x-auto scroll-smooth px-6 space-x-4 py-2 scrollbar-hide"
          onScroll={checkScrollPosition}
        >
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="flex-shrink-0"
            >
              <Card className="w-[350px] h-[340px] rounded-2xl border border-gray-200 bg-white p-5 shadow-md hover:shadow-lg transition-all flex flex-col">
                {/* Top: Avatar + Name */}
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

                {/* Stars */}
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

                {/* Text (scrollable vertically if too long) */}
                <div id="no-scrollbar" className="flex-grow overflow-y-auto pr-1 hide-scrollbar">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {review.text}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Right button */}
        {showRightButton && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Scroll Right"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}
