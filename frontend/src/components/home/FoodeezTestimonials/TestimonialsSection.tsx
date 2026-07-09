"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/core/Button";
import { Plus, Award } from "lucide-react";
import { FoodeezReviewService } from "@/services/FoodeezReviewService";
import type { foodeez_review_view } from "@/lib/prisma";
import ReviewsGrid from "./ReviewsGrid";
import EditReviewModal from "./EditReviewModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReviewFormModal from "./ReviewFormModal";

const TestimonialsSection: React.FC = () => {
  const { data: session } = useSession();

  const [reviews, setReviews] = useState<foodeez_review_view[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<foodeez_review_view[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<foodeez_review_view | null>(
    null
  );
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  // const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Load reviews on component mount
  useEffect(() => {
    loadReviews();
  }, []);

  // Filter and sort reviews when filters change
  const filterApprovedReviews = useCallback(() => {
    let filtered = [...reviews];
    // Filter reviews based on approval status and ownership
    filtered = filtered.filter((review) => {
      // If review is approved, show it to everyone
      if (review.APPROVED === 1) {
        return true;
      }
      // If user is logged in and is the review owner, show their unapproved reviews
      if (session?.user?.email && review.REVIEWER_EMAIL === session.user.email) {
        return true;
      }
      // Otherwise, don't show unapproved reviews
      return false;
    });
    setFilteredReviews(filtered);
  }, [reviews, session]);

  useEffect(() => {
    filterApprovedReviews();
  }, [filterApprovedReviews]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const allReviews = await FoodeezReviewService.getReviews();
      setReviews(allReviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    await loadReviews();
    setShowForm(false);
  };

  const handleReviewEdit = (review: foodeez_review_view) => {
    setEditingReview(review);
  };

  const handleReviewDelete = (reviewId: string) => {
    setDeletingReviewId(reviewId);
  };

  const handleReviewUpdate = async () => {
    await loadReviews();
    setEditingReview(null);
  };

  const handleReviewDeleteConfirm = async () => {
    await loadReviews();
    setDeletingReviewId(null);
  };

  return (
    <section className="py-10">
      <div className="px-4 lg:px-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4 sub-heading">
            <Award className="hidden lg:block w-8 h-8 lg:w-12 lg:h-12 text-secondary" />
            <h2 className="">Discover what food lovers think about foodeez</h2>
          </div>
          <p className="sub-heading-description">
            Real experiance from real Peoples Who loves the great food
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <ReviewsGrid
          reviews={filteredReviews}
          isLoading={isLoading}
          onEdit={handleReviewEdit}
          onDelete={handleReviewDelete}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button
            onClick={() => {
              setShowForm((prev) => !prev);
            }}
            className=""
          >
            <Plus className="w-5 h-5 mr-2" />
            Share Your Experience With Foodeez
          </Button>
        </div>

        {/* Review Form Modal */}
        <ReviewFormModal
          show={showForm}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowForm(false)}
        />

        {/* Edit Review Modal */}
        <EditReviewModal
          review={editingReview}
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          onUpdate={handleReviewUpdate}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          reviewId={deletingReviewId}
          isOpen={!!deletingReviewId}
          onClose={() => setDeletingReviewId(null)}
          onDelete={handleReviewDeleteConfirm}
        />
      </div>
    </section>
  );
};

export default TestimonialsSection;
