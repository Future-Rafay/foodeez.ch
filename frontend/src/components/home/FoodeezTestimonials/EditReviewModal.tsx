'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewForm from './ReviewForm';
import type { foodeez_review_view } from '@/lib/prisma';

interface EditReviewModalProps {
  review: foodeez_review_view | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({
  review,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const handleSubmit = async () => {
    try {
      // The form will handle the update
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  if (!review) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >


            {/* Content */}
            <div className="p-6">
              <ReviewForm
                initialData={{
                  name : review.REVIEWER_NAME || '',
                  rating: review.RATING || 5,
                  review: review.REVIEW || '',
                  images: [],
                }}
                isEditing={true}
                reviewId={review.FOODEEZ_REVIEW_ID?.toString()}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditReviewModal; 