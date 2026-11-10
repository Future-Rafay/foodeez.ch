"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import FoodJourneyCard from '@/components/core/food-journey/FoodJourneyCard';
import { getFoodJourneyById } from '@/services/FoodJourneyService';
import { parseSlug } from '@/lib/utils/genSlug';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from '@/components/core/DeleteConfirmModal';

const FoodJourneyDetailPage = () => {
  const params = useParams();
  const { id } = parseSlug(params.slug as string | string[] | undefined);

  const { data: session } = useSession();
  const router = useRouter();

  const [story, setStory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchStory = async () => {
      const data = await getFoodJourneyById(Number(id));
      setStory(data);
      // TODO: Replace with real related stories fetch
      setRelated([]);
      setLoading(false);
    };
    if (id) fetchStory();
  }, [id]);

  if (loading || !story) return <FoodJourneyDetailSkeleton />;

  const images = [story.PIC_1, story.PIC_2, story.PIC_4].filter(Boolean);
  const isOwner = session?.user?.id && story.VISITORS_ACCOUNT_ID && String(story.VISITORS_ACCOUNT_ID) === String(session.user.id);

  const handleEdit = () => {
    router.push(`/food-journey?edit=${story.VISITOR_FOOD_JOURNEY_ID}`);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        document.getElementById('shareFoodJourneyStory')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/food-journey/${story.VISITOR_FOOD_JOURNEY_ID}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete food journey');
      setShowDeleteModal(false);
      router.push('/food-journey');
    } catch (err) {
      console.log(`Error deleting food journey : ${err}`)
      alert('Failed to delete food journey');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-6 text-center break-words">
          {story.TITLE}
        </h1>
        {/* Owner Actions */}
        {isOwner ? (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleEdit}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Edit your food journey"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-secondary hover:bg-secondary/10 rounded-full transition-colors"
              title="Delete your food journey"
            >
              Delete
            </button>
          </div>
        ) : null}
        <DeleteConfirmModal
          title="Delete Story"
          message="Are you sure you want to delete this food journey story? This action cannot be undone."
          isOpen={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
        {/* Image Gallery */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {images.map((img: string, idx: number) => (
            <div key={idx} className="cursor-pointer">
              <Image
                src={img}
                alt={`Food Journey Image ${idx + 1}`}
                width={320}
                height={220}
                className="rounded-lg object-contain bg-gray-100 w-40 h-28 sm:w-60 sm:h-40 shadow-md hover:scale-105 transition"
                onClick={() => setPreviewImg(img)}
              />
            </div>
          ))}
        </div>
        {/* Image Preview Modal */}
        {previewImg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setPreviewImg(null)}>
            <div className="relative">
              <Image
                src={previewImg}
                alt="Preview"
                width={800}
                height={600}
                className="rounded-xl max-w-[90vw] max-h-[80vh] object-contain shadow-2xl"
              />
              <button
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
                onClick={() => setPreviewImg(null)}
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
          </div>
        )}
        {/* Description */}
        <div className="bg-white rounded-xl shadow p-6 mb-10 text-lg text-gray-700 break-words">
          {story.DESCRIPTION}
        </div>
        {/* You may also like */}
        {related.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-secondary mb-4">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((j) => (
                <FoodJourneyCard key={j.VISITOR_FOOD_JOURNEY_ID} journey={j} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Custom loading skeleton for the detail page
function FoodJourneyDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-10 md:h-16 w-3/4 mx-auto bg-gray-200 rounded mb-8" />
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-gray-200 w-40 h-28 sm:w-60 sm:h-40" />
        ))}
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6 mb-10 h-32 md:h-40" />
      <div className="h-8 w-1/2 bg-gray-200 rounded mb-4 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-accent bg-white shadow-lg p-5 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 rounded mb-1" />
            <div className="h-3 w-5/6 bg-gray-100 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 rounded mb-4" />
            <div className="flex flex-wrap gap-2 mt-auto">
              <div className="w-16 h-16 rounded bg-gray-200" />
              <div className="w-16 h-16 rounded bg-gray-100" />
              <div className="w-16 h-16 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FoodJourneyDetailPage;