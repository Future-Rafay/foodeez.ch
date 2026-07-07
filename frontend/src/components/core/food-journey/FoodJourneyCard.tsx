import { generateSlug } from "@/lib/utils/genSlug";
import { visitor_food_journey_view } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { Edit, Trash } from "lucide-react";

interface FoodJourneyCardProps {
  journey: visitor_food_journey_view;
  currentUserId?: string;
  onDelete?: (id: number) => Promise<void>;
  onEdit?: (story: visitor_food_journey_view) => void;
}

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const FoodJourneyCard: React.FC<FoodJourneyCardProps> = ({ journey, currentUserId, onDelete, onEdit }) => {
  const slug = generateSlug(
    journey.TITLE || "food-journey",
    journey.VISITOR_FOOD_JOURNEY_ID
  );

  const foodImages = [journey.PIC_1, journey.PIC_2, journey.PIC_3].filter(
    Boolean
  );

  // Check if this journey belongs to the current user
  const isOwner = currentUserId && journey.VISITORS_ACCOUNT_ID && String(journey.VISITORS_ACCOUNT_ID) === String(currentUserId);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (onDelete) await onDelete(journey.VISITOR_FOOD_JOURNEY_ID);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      className="rounded-2xl border border-accent bg-white shadow-lg p-5 flex flex-col h-full transition hover:shadow-xl focus-within:ring-2 focus-within:ring-primary"

      aria-label={`Food journey by ${journey.VISITOR_NAME || "Anonymous"}`}
    >
      {/* Visitor Info */}
      <div className="flex items-center gap-3 mb-4">
        {journey.VISITOR_PIC ? (
          <Image
            width={48}
            height={48}
            src={journey.VISITOR_PIC}
            alt={`Visitor ${journey.VISITOR_NAME}`}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            sizes="48px"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-2 border-gray-200">
            <span className="text-white font-semibold text-lg">
              {getInitials(journey.VISITOR_NAME)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-primary text-base line-clamp-1">
            {journey.VISITOR_NAME || "Anonymous"}
          </p>

          <p className="text-xs text-gray-500 line-clamp-1">
            {journey.RESTAURANT_NAME || "Unknown Restaurant"}
          </p>
        </div>
        {/* Owner Actions */}
        {isOwner ? (
          <div className="flex">
            <button
              onClick={() => onEdit && onEdit(journey)}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Edit review"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-secondary hover:bg-secondary/10 rounded-full transition-colors"
              title="Delete review"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
      {/* Journey Title */}
      <Link
        href={`/food-journey/${slug}`}
        target="_blank"
      >
        <h3 className="text-xl font-bold text-secondary mb-2 hover:underline focus:underline line-clamp-2"
          aria-label={`View food journey: ${journey.TITLE}`}
        >
          {journey.TITLE || "Untitled Food Journey"}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 line-clamp-4">
          {journey.DESCRIPTION || "No description available."}
        </p>
      </Link>
      {/* Food Images */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {foodImages.length > 0 ? (
          foodImages.map((pic, idx) => (
            <Image
              key={idx}
              src={pic as string}
              alt={`Food Journey Image ${idx + 1}`}
              title={`Image ${idx + 1}`}
              className="w-16 h-16 rounded object-cover border"
              loading="lazy"
              width={64}
              height={64}
              sizes="64px"
            />
          ))
        ) : (
          <div className="w-full text-center text-xs text-gray-400 italic">
            No food pictures shared.
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </article>
  );
};

export default FoodJourneyCard;

