import React from 'react';
import ReviewForm from './ReviewForm';
import { X } from 'lucide-react';
import ModalPortal from '../ModalPortal';

interface ReviewEditModalProps {
  review: any;
  onClose: () => void;
}

const ReviewEditModal = ({ review, onClose }: ReviewEditModalProps) => {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl relative">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-primary"
            onClick={onClose}
            aria-label="Close edit dialog"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold mb-4 text-primary">Edit Review</h3>
          <ReviewForm
            businessId={review.BUSINESS_ID}
            onSuccess={onClose}
            initialRemarks={review.REMARKS}
            initialRating={review.RATING}
            initialImages={[
              review.PIC_1 || '',
              review.PIC_2 || '',
              review.PIC_3 || '',
            ]}
            initialVideo={review.VIDEO_1}
            reviewId={review.VISITOR_BUSINESS_REVIEW_ID}
            isEdit
          />
        </div>
      </div>
    </ModalPortal>
  );
};

export default ReviewEditModal;
