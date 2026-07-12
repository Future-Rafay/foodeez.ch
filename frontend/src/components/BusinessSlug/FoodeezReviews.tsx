"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { business_detail_view_all, visitor_business_review_view } from "@/lib/prisma";
import Link from "next/link";
import { useSession } from "next-auth/react";
import FoodeezReviewCard from "@/components/core/review/FoodeezReviewCard";
import ReviewForm from "@/components/core/review/ReviewForm";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";
import EditReviewModal from "@/components/core/review/EditReviewModal";
import { getBusinessReviewsForUser } from "@/services/BusinessProfilePageService";

interface FoodeezReviewsProps {
  genSlug: string;
  business: business_detail_view_all;
}

export default function FoodeezReviews({
  genSlug,
  business,
}: FoodeezReviewsProps) {
  const { data: session } = useSession();

  const [reviews, setReviews] = useState<visitor_business_review_view[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [likeCounts, setLikeCounts] = useState<{ [id: number]: number }>({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingReview, setEditingReview] = useState<visitor_business_review_view | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filteredReviews, setFilteredReviews] = useState<visitor_business_review_view[]>([]);
  const [displayedReviews, setDisplayedReviews] = useState<visitor_business_review_view[]>([]);

   // helper function 
  const fetchReviews = useCallback(async () => {
    let userId: number | undefined = undefined;
    if (session?.user?.id) {
      userId = Number(session.user.id);
    }
    const businessReviews = await getBusinessReviewsForUser(
      business.BUSINESS_ID,
      userId
    );
    setReviews(businessReviews);
  }, [business.BUSINESS_ID, session]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);


  useEffect(() => {

    const sorted = reviews.sort((a, b) => {
      const dateA = a.CREATION_DATETIME
        ? new Date(a.CREATION_DATETIME).getTime()
        : 0;
      const dateB = b.CREATION_DATETIME
        ? new Date(b.CREATION_DATETIME).getTime()
        : 0;
      return dateB - dateA;
    });

    setFilteredReviews(sorted);
    setDisplayedReviews(sorted.slice(0, 5));
  }, [reviews]);

  useEffect(() => {
    const initialLikes: { [id: number]: number } = {};
    displayedReviews.forEach((r) => {
      initialLikes[r.VISITOR_BUSINESS_REVIEW_ID] = r.LIKE_COUNT ?? 0;
    });
    setLikeCounts(initialLikes);
    checkScrollPosition();
  }, [displayedReviews]);

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
      setTimeout(checkScrollPosition, 300);
    }
  };

  const handleEditReview = (review: visitor_business_review_view) => {
    setEditingReview(review);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingReview(null);
    fetchReviews()
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingReview(null);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchReviews(); 
  };


  return (
    <div className="relative w-full py-8 px-2 sm:px-4 lg:px-0">
      {/* Heading & Write Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="sub-heading">Foodeez Reviews</h2>
        <button
          className="inline-flex items-center px-5 py-2 text-sm font-medium text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors"
          onClick={() => {
            if (!session) {
              setShowAuthModal(true);
            } else {
              setShowReviewForm((prev) => !prev);
            }
          }}
        >
          {showReviewForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            key="review-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <ReviewForm
              businessId={business?.BUSINESS_ID ?? 0}
              onSuccess={handleReviewSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel */}
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
          {displayedReviews.length === 0 ? (
            <p className="w-full h-40 flex lg:text-2xl items-center justify-center text-text-main text-base">
              Be the first to write Review.
            </p>
          ) : (
            displayedReviews.map((review) => (
              <motion.div
                key={review.VISITOR_BUSINESS_REVIEW_ID}
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 min-w-[250px] w-full sm:w-[350px]"
              >
                <FoodeezReviewCard
                  review={review}
                  likeCount={likeCounts[review.VISITOR_BUSINESS_REVIEW_ID]}
                  onEdit={() => handleEditReview(review)}
                  onDelete={(reviewId) => setReviews(reviews => reviews.filter(r => r.VISITOR_BUSINESS_REVIEW_ID !== reviewId))}
                />
              </motion.div>
            ))
          )}
        </div>

        {showRightButton && displayedReviews.length > 0 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Scroll Right"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        )}
      </div>

      {/* Conditionally show view more button */}
      {filteredReviews.length > 5 && (
        <Link
          href={`/business/${genSlug}/reviews`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="btn-primary my-8">View all Reviews</button>
        </Link>
      )}

      <LoginRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Please log in to leave a review."
      />

      <EditReviewModal
        isOpen={showEditModal}
        onClose={handleEditClose}
        onUpdate={handleEditSuccess}
        review={editingReview}
      />
    </div>
  );
}
