"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReviewCard from "./ReviewCard";
import { useSession } from "next-auth/react";
import { foodeez_review_view } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewsGridProps {
  reviews: foodeez_review_view[];
  isLoading?: boolean;
  onEdit?: (review: foodeez_review_view) => void;
  onDelete?: (id: string) => void;
  showUserReviews?: boolean;
}

const ReviewsGrid: React.FC<ReviewsGridProps> = ({
  reviews,
  isLoading = false,
  onEdit,
  onDelete,
  showUserReviews = false,
}) => {
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const isOwner = (review: foodeez_review_view) => {
    return session?.user?.email === review.REVIEWER_EMAIL;
  };

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.9;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
  
      // check immediately for instant button visibility update
      requestAnimationFrame(checkScrollPosition);
    }
  };
  
  useEffect(() => {
    checkScrollPosition();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScrollPosition);
    }
    return () => {
      if (ref) ref.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4" id="no-scrollbar">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="h-[340px] w-[272px] bg-gray-200 rounded-2xl animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {showUserReviews ? "No Reviews Yet" : "No Reviews Available"}
          </h3>
          <p className="text-gray-600">
            {showUserReviews
              ? "You haven't submitted any reviews yet. Share your experience with Foodeez!"
              : "Be the first to share your experience with Foodeez!"}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Left Button */}
      <AnimatePresence>
        {showLeftButton && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary shadow-lg rounded-full p-3 "
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide scroll-smooth"
        id="no-scrollbar"
      >
        <AnimatePresence>
          {reviews.map((review, index) => (
            <motion.div
              key={review.FOODEEZ_REVIEW_ID.toString()}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              className="w-[272px] flex-shrink-0"
            >
              <ReviewCard
                review={review}
                isOwner={isOwner(review)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Right Button */}
      <AnimatePresence>
        {showRightButton && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary shadow-lg rounded-full p-3 "
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewsGrid;
