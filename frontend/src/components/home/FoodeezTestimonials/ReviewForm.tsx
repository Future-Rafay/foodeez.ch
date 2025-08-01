"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/core/Button";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { FoodeezReviewService } from "@/services/FoodeezReviewService";
import { ReviewFormData } from "@/types/foodeez-review.types";
import ModalPortal from "@/components/core/ModalPortal";

interface ReviewFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  initialData?: ReviewFormData;
  isEditing?: boolean;
  reviewId?: string; // Added for editing
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  reviewId, // Added for editing
}) => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: initialData?.rating || 5,
    review: initialData?.review || "",
    images: initialData?.images || [],
    name: initialData?.name || session?.user?.name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGuestSubmittedModal, setShowGuestSubmittedModal] = useState(false);
  const [pendingOnSubmit, setPendingOnSubmit] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: "" }));
    }
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, review: value }));
    if (errors.review) {
      setErrors((prev) => ({ ...prev, review: "" }));
    }
  };

  // const handleImageUpload = async (files: FileList | null) => {
  //   if (!files) return;

  //   const newImages: File[] = [];
  //   const newUploadedImages: string[] = [];

  //   for (let i = 0; i < files.length; i++) {
  //     const file = files[i];
  //     if (file.size > 5 * 1024 * 1024) {
  //       // 5MB limit
  //       setErrors((prev) => ({
  //         ...prev,
  //         images: "Each image must be less than 5MB",
  //       }));
  //       continue;
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       setErrors((prev) => ({
  //         ...prev,
  //         images: "Please select only image files",
  //       }));
  //       continue;
  //     }

  //     newImages.push(file);

  //     // Create preview URL
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       if (e.target?.result) {
  //         newUploadedImages.push(e.target.result as string);
  //         setUploadedImages((prev) => [...prev, e.target!.result as string]);
  //       }
  //     };
  //     reader.readAsDataURL(file);
  //   }

  //   setFormData((prev) => ({
  //     ...prev,
  //     images: [...prev.images, ...newImages].slice(0, 3),
  //   }));
  // };

  // const removeImage = (index: number) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     images: prev.images.filter((_, i) => i !== index),
  //   }));
  //   setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  // };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = "Please select a rating";
    }

    if (!formData.review.trim()) {
      newErrors.review = "Please write your review";
    } else if (formData.review.length < 10) {
      newErrors.review = "Review must be at least 10 characters long";
    } else if (formData.review.length > 1000) {
      newErrors.review = "Review must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Upload images first
      // const imageUrls: string[] = [];
      // for (const image of formData.images) {
      //   try {
      //     const imageUrl = await FoodeezReviewService.uploadImage(image);
      //     imageUrls.push(imageUrl);
      //   } catch (error) {
      //     console.error("Failed to upload image:", error);
      //   }
      // }

      // Create review data
      const reviewData = {
        REVIEWER_NAME: formData.name.trim(),
        RATING: formData.rating,
        REVIEW: formData.review.trim(),
        // PIC_1: imageUrls[0] || undefined,
        // PIC_2: imageUrls[1] || undefined,
        // PIC_3: imageUrls[2] || undefined,
      };

      if (isEditing && reviewId) {
        // Call update API
        await FoodeezReviewService.updateReview(reviewId, reviewData);
      } else {
        // Call create API
        await FoodeezReviewService.createReview(reviewData);
      }

      // Reset form
      setFormData({
        rating: 5,
        review: "",
        images: [],
        name: session?.user?.name || "",
      });
      // setUploadedImages([]);

      if (!session?.user?.email) {
        setShowGuestSubmittedModal(true);
        setPendingOnSubmit(true);
      } else {
        onSubmit?.();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrors({ submit: "Failed to submit review. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className=""
      >
        {/* Card */}
        <Card className="p-4 sm:p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {isEditing ? "Edit Your Review" : "Share Your Experience"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Help others discover great restaurants by sharing your experience
              with Foodeez
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                maxLength={50}
                required
              />
              {errors.name && (
                <span className="text-red-500 text-sm">{errors.name}</span>
              )}
            </div>
            {/* Rating Section */}
            <div>
              <label className="block text-sm lg:text-lg font-medium text-gray-700 mb-2 sm:mb-3">
                How would you rate your experience?
              </label>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 transition-all duration-200 hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${
                        star <= formData.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 sm:ml-3 text-sm sm:text-base md:text-lg font-medium text-gray-700">
                  {formData.rating}/5
                </span>
              </div>
              {errors.rating && (
                <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
              )}
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Tell us about your experience
              </label>
              <textarea
                value={formData.review}
                onChange={handleReviewChange}
                placeholder="Share your thoughts about the Foodeez platform, the restaurants you discovered, or any suggestions for improvement..."
                className="w-full h-28 sm:h-32 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm sm:text-base"
                maxLength={1000}
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1">
                <span className="text-sm text-gray-500">
                  {formData.review.length}/1000 characters
                </span>
                {errors.review && (
                  <span className="text-red-500 text-sm">{errors.review}</span>
                )}
              </div>
            </div>

            {/* Image Upload */}
            {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Add photos (optional)
            </label>
            <div className="space-y-4">
              {formData.images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload images (max 3)
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG up to 5MB each
                    </p>
                  </div>
                </button>
              )}

              <AnimatePresence>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {uploadedImages.map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <Image
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 sm:h-28 object-cover rounded-lg"
                          width={200}
                          height={200}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {errors.images && (
                <p className="text-red-500 text-sm">{errors.images}</p>
              )}
            </div>
          </div> */}

            {/* Error Messages */}
            {errors.auth && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.auth}</p>
              </div>
            )}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Submitting..."
                  : isEditing
                    ? "Update Review"
                    : "Submit Review"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  className="w-full sm:flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Hidden input */}
          {/* <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        /> */}
        </Card>
      </motion.div>
      {/* Guest Submitted Modal */}
      {showGuestSubmittedModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
              <h4 className="text-lg font-bold mb-2">Review Submitted!</h4>
              <p className="mb-4 text-gray-700">
                Your review has been submitted and is pending approval before it appears on the website.
              </p>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
                onClick={() => {
                  setShowGuestSubmittedModal(false);
                  if (pendingOnSubmit) {
                    setPendingOnSubmit(false);
                    onSubmit?.();
                  }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default ReviewForm;
