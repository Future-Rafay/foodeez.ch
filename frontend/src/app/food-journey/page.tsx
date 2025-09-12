"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";
import { getFoodJourney, getFoodJourneyById } from "@/services/FoodJourneyService";
import FoodJourneyForm from "@/components/core/food-journey/FoodJourneyForm";
import FoodJourneyGrid from "@/components/core/food-journey/FoodJourneyGrid";
import FoodJourneyPagination from "@/components/core/food-journey/FoodJourneyPagination";
import FoodJourneyGridSkeleton from "@/components/core/food-journey/FoodJourneyGridSkeleton";
import { visitor_food_journey_view } from "@prisma/client";
import Separator from "@/components/ui/separator";

const initialForm = {
  TITLE: "",
  DESCRIPTION: "",
  RESTAURANT_NAME: "",
  ADDRESS_GOOGLE_URL: "",
  images: [] as File[],
};

// Add Strapi upload helper
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || '';
const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

async function uploadImagesToStrapi(images: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];
  for (const image of images) {
    const formData = new FormData();
    formData.append('files', image);
    formData.append('folder', '14');
    const res = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload to Strapi');
    const data = await res.json();
    if (data && data[0] && data[0].url) {
      uploadedUrls.push(data[0].url.startsWith('http') ? data[0].url : `${STRAPI_URL}${data[0].url}`);
    }
  }
  return uploadedUrls;
}

export default function FoodJourneyPage({ searchParams }: { searchParams: { [key: string]: string } })  {

  const { data: session } = useSession();
 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allStories, setAllStories] = useState<visitor_food_journey_view[]>([]);
  const [page, setPage] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editStory, setEditStory] = useState<visitor_food_journey_view | null>(null);
  const limit = 9;

  const fetchStories = useCallback(async () => {
    let userId: number | undefined = undefined;
    if (session?.user?.id) {
      userId = Number(session.user.id);
    }
    const data = await getFoodJourney(userId);
    setAllStories(data);
  }, [session]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    // Check for ?edit=<id> in URL
    const editId = searchParams['edit'];
    if (editId) {
      (async () => {
        const data = await getFoodJourneyById(Number(editId));
        if (data) {
          const previews = [data.PIC_1, data.PIC_2, data.PIC_3].filter((x): x is string => Boolean(x));
          console.log('Edit from detail page, image URLs:', [data.PIC_1, data.PIC_2, data.PIC_3]);
          console.log('Setting imagePreviews:', previews);
          setEditStory(data);
          setForm({
            TITLE: data.TITLE || '',
            DESCRIPTION: data.DESCRIPTION || '',
            RESTAURANT_NAME: data.RESTAURANT_NAME || '',
            ADDRESS_GOOGLE_URL: data.ADDRESS_GOOGLE_URL || '',
            images: [],
          });
          setImages([]);
          setImagePreviews(previews);
          setError('');
          setSuccess('');
          setTimeout(() => {
            document.getElementById('shareFoodJourneyStory')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      })();
    }
  }, [searchParams]);

  // Generate image previews when images change
  useEffect(() => {
    if (images.length === 0) {
      setImagePreviews([]);
      return;
    }
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    // Cleanup
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Only allow up to 3 images
    const newImages = [...images, ...files].slice(0, 3);
    setImages(newImages);
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Edit handler
  const handleEdit = (story: visitor_food_journey_view) => {
    const previews = [story.PIC_1, story.PIC_2, story.PIC_3].filter((x): x is string => Boolean(x));
    console.log('Edit from card, image URLs:', [story.PIC_1, story.PIC_2, story.PIC_3]);
    console.log('Setting imagePreviews:', previews);
    setEditStory(story);
    setForm({
      TITLE: story.TITLE || '',
      DESCRIPTION: story.DESCRIPTION || '',
      RESTAURANT_NAME: story.RESTAURANT_NAME || '',
      ADDRESS_GOOGLE_URL: story.ADDRESS_GOOGLE_URL || '',
      images: [], // Images will be handled separately
    });
    setImages([]);
    setImagePreviews(previews);
    setError('');
    setSuccess('');
    // Scroll to form
    setTimeout(() => {
      document.getElementById('shareFoodJourneyStory')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!session) {
      setShowLoginModal(true);
      return;
    }
    setSubmitting(true);

    try {
      // Upload images to Strapi first
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImagesToStrapi(images);
      }
      // Prepare form data with image URLs, omitting 'images' field
      const { ...formRest } = form;
      const formToSend = {
        ...formRest,
        PIC_1: imageUrls[0] || (editStory?.PIC_1 ?? undefined),
        PIC_2: imageUrls[1] || (editStory?.PIC_2 ?? undefined),
        PIC_3: imageUrls[2] || (editStory?.PIC_3 ?? undefined),
      };

      if (editStory) {
        // Edit mode: update existing story
        const res = await fetch(`/api/food-journey/${editStory.VISITOR_FOOD_JOURNEY_ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToSend),
        });
        if (!res.ok) throw new Error("Failed to update food journey");
        setSuccess("Your food journey has been updated!");
        setEditStory(null);
      } else {
        // Create mode
        const res = await fetch("/api/food-journey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToSend),
        });
        if (!res.ok) throw new Error("Failed to submit food journey");
        setSuccess("Your food journey has been submitted for review!");
      }
      setForm(initialForm);
      setImages([]);
      fetchStories();
    } catch (err: any) {
      setError(err.message || "Failed to submit food journey");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/food-journey/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete food journey');
      fetchStories();
    } catch (err) {
      console.log(`Error deleting food journey : ${err}`)
      alert('Failed to delete food journey');
    }
  };

  const total = allStories.length;
  const paginatedStories = allStories.slice((page - 1) * limit, page * limit);

  return (
    <div className="px-4 py-12">
      <h1 className="sub-heading text-center mb-10" id="stories">
        Food Journey Stories
      </h1>
      {allStories.length === 0 && !submitting ? (
        <FoodJourneyGridSkeleton />
      ) : (
        <>
          <FoodJourneyGrid stories={paginatedStories} currentUserId={session?.user?.id} onDelete={handleDelete} onEdit={handleEdit} />
          {total > limit && (
            <FoodJourneyPagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      <Separator />
      <h2 className="sub-heading text-center my-20" id="shareFoodJourneyStory">
        Share Your Food Journey
      </h2>
      <FoodJourneyForm
        form={form}
        onInputChange={handleInputChange}
        onImageChange={handleImageChange}
        onRemoveImage={handleRemoveImage}
        imagePreviews={imagePreviews}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        success={success}
        isEdit={!!editStory}
      />
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

