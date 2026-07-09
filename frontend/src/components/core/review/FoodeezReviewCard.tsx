import { Card } from "@/components/ui/card";
import { Share2, PlayCircle, X, Heart } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { visitor_business_review_view } from "@/lib/prisma";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import ReviewEditModal from "./ReviewEditModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import UserAvatarAndName from "./UserAvatarAndName";
import ReviewStars from "./ReviewStars";
import ReviewGallery from "./ReviewGallery";
import ReviewShareModal from "./ReviewShareModal";

interface FoodeezReviewCardProps {
  review: visitor_business_review_view;
  likeCount?: number;
  onEdit?: () => void;
  onDelete?: (reviewId: number) => void;
}

const getReviewImages = (review: visitor_business_review_view) => {
  return [
    review.PIC_1,
    review.PIC_2,
    review.PIC_3,
    review.PIC_4,
    review.PIC_5,
    review.PIC_6,
    review.PIC_7,
    review.PIC_8,
    review.PIC_9,
    review.PIC_10,
  ].filter(Boolean) as string[];
};

export default function FoodeezReviewCard({
  review,
  likeCount,
  onEdit,
  onDelete,
}: FoodeezReviewCardProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const images = getReviewImages(review);
  const hasVideo = !!review.VIDEO_1;
  const [mounted, setMounted] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(
    likeCount ?? review.LIKE_COUNT ?? 0
  );
  const [liked, setLiked] = useState(false);
  const { data: session } = useSession();
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // User info
  const userPic = review.PIC || undefined;
  const userName =
    [review.FIRST_NAME, review.LAST_NAME].filter(Boolean).join(" ") ||
    `User${review.VISITORS_ACCOUNT_ID}`;

  // Star rating fix: Only fill up to Math.round(Number(review.RATING))
  const ratingValue = Math.round(Number(review.RATING));

  // Share link (could be improved to be the actual review link)
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleLikeClick = async () => {
    if (likeLoading || liked) return;
    setLikeLoading(true);
    try {
      const res = await fetch("/api/reviews/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.VISITOR_BUSINESS_REVIEW_ID }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalLikeCount(data.likeCount);
        setLiked(true);
      }
    } catch (e) {
      console.error("Error liking review:", e);
      // Optionally show error
    } finally {
      setLikeLoading(false);
    }
  };

  // Check if current user is the owner
  const isOwner = Boolean(
    session?.user?.id &&
    Number(session.user.id) === Number(review.VISITORS_ACCOUNT_ID)
  );

  // Delete handler
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.VISITOR_BUSINESS_REVIEW_ID }),
      });
      const data = await res.json();
      if (data.success) {
        if (onDelete) onDelete(review.VISITOR_BUSINESS_REVIEW_ID);
        setShowDeleteModal(false);
      }
    } catch (e) {
      console.log("Error deleting review:", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Edit handler (show modal)
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setShowEditModal(true);
    }
  };

  return (
    <Card className="w-full rounded-2xl border-2 border-gray-200 bg-white p-5 lg:p-6 shadow-md hover:shadow-lg transition-all flex flex-col h-full">
      {/* User Info */}
      <UserAvatarAndName
        userPic={userPic}
        userName={userName}
        isOwner={isOwner}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteModal(true)}
      />

      {/* Rating */}
      <ReviewStars rating={ratingValue} size={20} />
      {/* Review Text */}
      <div
        className="flex-grow overflow-y-auto pr-1 my-4 h-32 lg:h-40"
        id="no-scrollbar"
      >
        <p className="text-text-main leading-relaxed text-base  font-normal">
          {review.REMARKS}
        </p>
      </div>
      {/* Images & Video */}
      {(images.length > 0 || hasVideo) && (
        <ReviewGallery
          images={images}
          hasVideo={hasVideo}
          galleryIndex={galleryIndex}
          setGalleryIndex={setGalleryIndex}
          showGallery={showGallery}
          setShowGallery={setShowGallery}
        />
      )}
      {/* Gallery Modal */}
      {showGallery &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-white  shadow-lg max-w-lg w-full p-5 flex flex-col items-center rounded-xl border-2 border-primary/30">
              <button
                className="absolute top-0 right-0 text-text-main hover:text-primary"
                onClick={() => setShowGallery(false)}
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </button>
              {galleryIndex < images.length ? (
                <Image
                  src={images[galleryIndex]}
                  alt={`Gallery image ${galleryIndex + 1}`}
                  width={400}
                  height={300}
                  className="object-contain max-h-[60vh] rounded-lg"
                />
              ) : (
                <video
                  src={review.VIDEO_1!}
                  controls
                  autoPlay
                  className="object-contain max-h-[60vh] rounded-lg"
                  poster={images[0]}
                />
              )}
              <div className="flex gap-2 mt-4">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    className={`w-10 h-10 rounded border-2 ${galleryIndex === idx ? "border-primary" : "border-gray-200"}`}
                    onClick={() => setGalleryIndex(idx)}
                    aria-label={`Show image ${idx + 1}`}
                    type="button"
                  >
                    <Image
                      src={img}
                      alt={`Like ${idx + 1}`}
                      width={40}
                      height={40}
                      className="object-cover rounded"
                    />
                  </button>
                ))}
                {hasVideo && (
                  <button
                    className={`w-10 h-10 rounded border-2 flex items-center justify-center ${galleryIndex === images.length ? "border-primary" : "border-gray-200"}`}
                    onClick={() => setGalleryIndex(images.length)}
                    aria-label="Show video"
                    type="button"
                  >
                    <PlayCircle className="w-6 h-6 text-primary" />
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {showShare &&
        mounted &&
        createPortal(
          <ReviewShareModal
            showShare={showShare}
            setShowShare={setShowShare}
            shareUrl={shareUrl}
            handleCopy={handleCopy}
            copied={copied}
          />,
          document.body
        )}
      {/* Actions */}
      <div className="flex items-center gap-2 mt-8">
        <button
          className={`flex items-center gap-1 text-primary hover:text-accent font-semibold transition ${liked ? "pointer-events-none" : ""}`}
          onClick={handleLikeClick}
          disabled={likeLoading || liked}
          aria-label="Like review"
        >
          <Heart
            className={`h-5 w-5 ${liked ? "fill-primary" : ""} ${likeLoading ? "animate-pulse" : ""}`}
          />
          <span>{localLikeCount}</span>
        </button>
        <button
          className="flex items-center gap-1 text-accent hover:text-blue-800 transition font-semibold"
          onClick={() => setShowShare(true)}
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
      {/* Edit Modal */}
      {showEditModal && (
        <ReviewEditModal
          review={review}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
          isOpen={showDeleteModal}
        />
      )}
    </Card>
  );
}
