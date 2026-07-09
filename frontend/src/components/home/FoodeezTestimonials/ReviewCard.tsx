"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Edit, Star, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { foodeez_review_view } from "@/lib/prisma";

interface ReviewCardProps {
  review: foodeez_review_view;
  isOwner?: boolean;
  onEdit?: (review: foodeez_review_view) => void;
  onDelete?: (id: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  const formatDate = (date: Date | null | string) => {
    if (!date) return "Recently";

    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Recently";
      }
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Recently";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase();
  };

  // const renderImages = () => {
  //   const images = [review.PIC_1, review.PIC_2, review.PIC_3].filter(Boolean);
  //   if (images.length === 0) return null;

  //   return (
  //     <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
  //       {images.map((image, index) => (
  //         <div key={index} className="flex-shrink-0">
  //           <Image
  //             src={image!}
  //             alt={`Review image ${index + 1}`}
  //             width={80}
  //             height={80}
  //             className="rounded-lg object-cover h-20 w-20"
  //           />
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-[272px] h-[340px]"
    >
      <Card className="h-full rounded-2xl border-2 border-gray-100 bg-background-card p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 ">
            {review.AVATAR ? (
              <Image
                src={review.AVATAR}
                alt={review.REVIEWER_NAME || "Reviewer"}
                width={56}
                height={56}
                className="rounded-full object-cover h-14 w-14 border-2 border-gray-200"
                sizes="56px"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-2 border-gray-200">
                <span className="text-white font-semibold text-lg">
                  {getInitials(review.REVIEWER_NAME)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-lg line-clamp-2">
                {review.REVIEWER_NAME || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(review.CREATION_DATETIME)}
              </p>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex">
              <button
                onClick={() => onEdit?.(review)}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                title="Edit review"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(review.FOODEEZ_REVIEW_ID.toString())}
                className="p-2 text-secondary hover:bg-secondary/10 rounded-full transition-colors"
                title="Delete review"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < (review.RATING || 0)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div className="flex-grow">
          <p
            className="text-text-main leading-relaxed text-base overflow-y-auto h-32"
            id="no-scrollbar"
          >
            {review.REVIEW || "No review text provided."}
          </p>
        </div>

        {/* Images */}
        {/* {renderImages()} */}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-400">
          <div className="flex items-center justify-between text-sm text-primary">
            <span>Foodeez Platform</span>
            {/* {review.APPROVED === 1 && (
              <span className="text-green-600 font-medium">✓ Approved</span>
            )}
            {review.APPROVED === 0 && (
              <span className="text-xs bg-highlight-light text-text-main px-2 py-1 rounded-full">
                Pending Approval
              </span>
            )} */}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ReviewCard;
