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
};

const emptyImageSlots = () => [null, null, null] as (File | null)[];
const emptyPreviewSlots = () => [null, null, null] as (string | null)[];
const emptyImageValues = () => ["", "", ""];

async function uploadFile(file: File): Promise<{ url: string; key: string } | null> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return await res.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
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
  const [images, setImages] = useState<(File | null)[]>(emptyImageSlots);
  const [imageValues, setImageValues] = useState<string[]>(emptyImageValues);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>(emptyPreviewSlots);
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
          const existingImages = [data.PIC_1 || "", data.PIC_2 || "", data.PIC_3 || ""];
          setEditStory(data);
          setForm({
            TITLE: data.TITLE || '',
            DESCRIPTION: data.DESCRIPTION || '',
            RESTAURANT_NAME: data.RESTAURANT_NAME || '',
            ADDRESS_GOOGLE_URL: data.ADDRESS_GOOGLE_URL || '',
          });
          setImages(emptyImageSlots());
          setImageValues(existingImages);
          setImagePreviews(emptyPreviewSlots());
          setError('');
          setSuccess('');
          setTimeout(() => {
            document.getElementById('shareFoodJourneyStory')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      })();
    }
  }, [searchParams]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (idx: number, file: File | null) => {
    setImages((prev) => prev.map((item, i) => (i === idx ? file : item)));
  };

  const handleImageValueChange = (idx: number, value: string) => {
    setImageValues((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };

  const handleImagePreviewChange = (idx: number, preview: string | null) => {
    setImagePreviews((prev) => prev.map((item, i) => (i === idx ? preview : item)));
  };

  // Edit handler
  const handleEdit = (story: visitor_food_journey_view) => {
    const existingImages = [story.PIC_1 || "", story.PIC_2 || "", story.PIC_3 || ""];
    setEditStory(story);
    setForm({
      TITLE: story.TITLE || '',
      DESCRIPTION: story.DESCRIPTION || '',
      RESTAURANT_NAME: story.RESTAURANT_NAME || '',
      ADDRESS_GOOGLE_URL: story.ADDRESS_GOOGLE_URL || '',
    });
    setImages(emptyImageSlots());
    setImageValues(existingImages);
    setImagePreviews(emptyPreviewSlots());
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
      // Upload images to S3 first
      const imageUrls = [...imageValues];
      for (let idx = 0; idx < images.length; idx += 1) {
        const image = images[idx];
        if (image) {
          const result = await uploadFile(image);
          if (!result) throw new Error(`Failed to upload photo ${idx + 1}`);
          imageUrls[idx] = result.url;
        }
      }
      const formToSend = {
        ...form,
        PIC_1: imageUrls[0] || null,
        PIC_2: imageUrls[1] || null,
        PIC_3: imageUrls[2] || null,
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
      setImages(emptyImageSlots());
      setImageValues(emptyImageValues());
      setImagePreviews(emptyPreviewSlots());
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
        imageFiles={images}
        imageValues={imageValues}
        imagePreviews={imagePreviews}
        onImageFileChange={handleImageFileChange}
        onImageValueChange={handleImageValueChange}
        onImagePreviewChange={handleImagePreviewChange}
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

