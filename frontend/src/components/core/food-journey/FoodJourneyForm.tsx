import Image from "next/image";
import React from "react";

interface FoodJourneyFormProps {
  form: {
    TITLE: string;
    DESCRIPTION: string;
    RESTAURANT_NAME: string;
    ADDRESS_GOOGLE_URL: string;
    images: File[];
  };
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (idx: number) => void;
  imagePreviews: string[];
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  success: string;
}

const FoodJourneyForm: React.FC<FoodJourneyFormProps> = ({
  form,
  onInputChange,
  onImageChange,
  onRemoveImage,
  imagePreviews,
  onSubmit,
  submitting,
  error,
  success,
}) => {
  return (
    <div className=" px-4 lg:px-0">
      <form
        onSubmit={onSubmit}
        className="bg-primary/10 rounded-2xl shadow-lg p-8 sm:p-10 space-y-6"
      >
        <div className="space-y-10">
          {/* Title */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Title</label>
            <input
              type="text"
              name="TITLE"
              value={form.TITLE}
              onChange={onInputChange}
              className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Restaurant Name */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Restaurant Name</label>
            <input
              type="text"
              name="RESTAURANT_NAME"
              value={form.RESTAURANT_NAME}
              onChange={onInputChange}
              className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Google Maps URL */}
          <div className="flex flex-col md:col-span-2">
            <label className="font-semibold mb-1">
              Google Maps URL <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="url"
              name="ADDRESS_GOOGLE_URL"
              value={form.ADDRESS_GOOGLE_URL}
              onChange={onInputChange}
              className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col md:col-span-2">
            <label className="font-semibold mb-1">Description</label>
            <textarea
              name="DESCRIPTION"
              value={form.DESCRIPTION}
              onChange={onInputChange}
              rows={5}
              className="border rounded-md px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Image Upload */}
          <div className="flex flex-col md:col-span-2">
            <label className="font-semibold mb-1">
              Upload Images (up to 3)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImageChange}
              className="border rounded-md px-4 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              disabled={imagePreviews.length >= 3}
            />
            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <Image
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 sm:h-28 object-cover rounded-lg"
                      width={200}
                      height={200}
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && <div className="text-red-600 font-medium">{error}</div>}
        {success && <div className="text-green-600 font-medium">{success}</div>}

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-lg transition duration-300 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Share My Journey"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodJourneyForm;
