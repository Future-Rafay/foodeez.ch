"use client";
import { useEffect, useState } from "react";
import {
  business_detail_view_all,
  visitor_business_review_view,
} from "@prisma/client";
import {
  getBusinessById,
  getBusinessReviews,
} from "@/services/BusinessProfilePageService";
import { Skeleton } from "@/components/ui/skeleton";
import Banner from "@/components/core/Banner";
import { useParams } from "next/navigation";
import { extractBusinessId } from "@/lib/utils/genSlug";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import FoodeezReviewCard from "@/components/core/review/FoodeezReviewCard";
import ReviewForm from "@/components/core/review/ReviewForm";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";
import EditReviewModal from "@/components/core/review/EditReviewModal";

export default function AllFoodeezReviewsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const slug = params.slug as string;
  const businessId = extractBusinessId(slug);

  const [business, setBusiness] = useState<business_detail_view_all | null>();
  const [reviews, setReviews] = useState<visitor_business_review_view[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingReview, setEditingReview] = useState<visitor_business_review_view | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchBusiness() {
      const data = await getBusinessById(Number(businessId));

      const mapped = data
        ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [
              k,
              v === null ? undefined : v,
            ])
          )
        : null;

      if (mapped && mapped.BUSINESS_ID) {
        setBusiness(mapped as unknown as any);

        // Fetch business reviews
        const businessReviews = await getBusinessReviews(
          Number(mapped.BUSINESS_ID)
        );
        setReviews(businessReviews);
      } else {
        setBusiness(null);
        setReviews([]);
      }

      setLoading(false);
    }

    fetchBusiness();
  }, [businessId]);

  // Helper for address
  const getFullAddress = (b: business_detail_view_all | null | undefined) => {
    if (!b) return "";
    const parts = [
      b.ADDRESS_STREET,
      b.ADDRESS_TOWN,
      b.CITY_NAME,
      b.ADDRESS_ZIP ? b.ADDRESS_ZIP.toString() : undefined,
      b.ADDRESS_COUNTRY,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handleEditReview = (review: visitor_business_review_view) => {
    setEditingReview(review);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingReview(null);
    // Refresh the reviews data to show the updated review
    window.location.reload();
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingReview(null);
  };

  const handleReviewSuccess = (newReviewData?: any) => {
    setShowReviewForm(false);
    
    if (newReviewData && session?.user) {
      // Create a review object that matches the visitor_business_review_view structure
      const newReview: visitor_business_review_view = {
        VISITOR_BUSINESS_REVIEW_ID: newReviewData.VISITOR_BUSINESS_REVIEW_ID,
        CREATION_DATETIME: new Date(newReviewData.CREATION_DATETIME),
        VISITORS_ACCOUNT_ID: newReviewData.VISITORS_ACCOUNT_ID,
        FIRST_NAME: session.user.name?.split(' ')[0] || null,
        LAST_NAME: session.user.name?.split(' ').slice(1).join(' ') || null,
        PIC: session.user.image || null,
        BUSINESS_ID: newReviewData.BUSINESS_ID,
        RATING: newReviewData.RATING,
        REMARKS: newReviewData.REMARKS,
        PIC_1: newReviewData.PIC_1,
        PIC_2: newReviewData.PIC_2,
        PIC_3: newReviewData.PIC_3,
        PIC_4: newReviewData.PIC_4,
        PIC_5: newReviewData.PIC_5,
        PIC_6: newReviewData.PIC_6,
        PIC_7: newReviewData.PIC_7,
        PIC_8: newReviewData.PIC_8,
        PIC_9: newReviewData.PIC_9,
        PIC_10: newReviewData.PIC_10,
        VIDEO_1: newReviewData.VIDEO_1,
        LIKE_COUNT: newReviewData.LIKE_COUNT,
        APPROVED: newReviewData.APPROVED,
      };
      
      // Add the new review to the beginning of the list
      setReviews(prev => [newReview, ...prev]);
    }
  };

  return (
    <div className="">
      <Banner
        src="/images/banners/CTAs/shareExperiance.png"
        alt="Share Your Experience with Foodeez"
      />
      <div className="px-2 sm:px-4 lg:px-0">
        <h1 className="py-12 main-heading text-center">{`${business?.BUSINESS_NAME || "Business"}`}</h1>
        {/* Business Info Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border rounded-xl p-6 bg-white/80 shadow-sm">
          <div className="flex-1 space-y-2">
            <div className="text-lg font-semibold text-primary">
              {business?.BUSINESS_NAME}
            </div>
            {business && (
              <>
                <div className="text-gray-700 text-sm">
                  <span className="font-medium">Address:</span>{" "}
                  {getFullAddress(business)}
                </div>
                {business.PHONE_NUMBER && (
                  <div className="text-gray-700 text-sm">
                    <span className="font-medium">Phone:</span>{" "}
                    <a
                      href={`tel:${business.PHONE_NUMBER}`}
                      className="hover:text-accent underline"
                    >
                      {business.PHONE_NUMBER}
                    </a>
                  </div>
                )}
                {business.EMAIL_ADDRESS && (
                  <div className="text-gray-700 text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    <a
                      href={`mailto:${business.EMAIL_ADDRESS}`}
                      className="hover:text-accent underline"
                    >
                      {business.EMAIL_ADDRESS}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex flex-col gap-3 min-w-[180px]">
            <Link href={`/business/${slug}/reservation`}>
              <button className="btn-primary w-full">Reserve Table</button>
            </Link>
            <Link href={`/business/${slug}/menu`}>
              <button className="btn-secondary w-full">See Menu</button>
            </Link>
          </div>
        </div>
        {/* Reviews Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[380px] w-full max-w-md mx-auto" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-gray-500 text-lg py-20">
            No reviews found.
          </div>
        ) : (
          <div className="w-full pb-12">
            <div className="flex items-center justify-between my-8 px-4 lg:px-0">
              <h2 className="sub-heading">
                Reviews
              </h2>
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

            {/* Animated Inline Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  key="review-form"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                
                >
                  <ReviewForm
                    businessId={business?.BUSINESS_ID ?? 0}
                    onSuccess={handleReviewSuccess}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews Grid */}
            {reviews.length === 0 ? (
              <div className="text-center text-gray-500 text-lg py-20">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <FoodeezReviewCard
                    key={review.VISITOR_BUSINESS_REVIEW_ID}
                    review={review}
                    onEdit={() => handleEditReview(review)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <LoginRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Please log in to write a review."
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
