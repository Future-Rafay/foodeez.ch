'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { visitor_business_review_view } from '@prisma/client';
import ReviewForm from './ReviewForm';
import { X } from 'lucide-react';

interface EditReviewModalProps {
  review: visitor_business_review_view | null;
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
          className=" fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-primary">Edit Review</h3>
              <button
                className="text-gray-400 hover:text-primary transition-colors"
                onClick={onClose}
                aria-label="Close edit dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <ReviewForm
                businessId={Number(review.BUSINESS_ID)}
                onSuccess={handleSubmit}
                initialRemarks={review.REMARKS || ''}
                initialRating={Number(review.RATING) || 5}
                initialImages={[
                  review.PIC_1 || '',
                  review.PIC_2 || '',
                  review.PIC_3 || '',
                ]}
                initialVideo={review.VIDEO_1 || undefined}
                reviewId={Number(review.VISITOR_BUSINESS_REVIEW_ID)}
                isEdit
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditReviewModal;
