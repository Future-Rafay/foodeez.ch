import React from "react";
import Input from "../Input";
import ImageUploadField from "@/components/ui/ImageUploadField";

interface FoodJourneyFormProps {
  form: {
    TITLE: string;
    DESCRIPTION: string;
    RESTAURANT_NAME: string;
    ADDRESS_GOOGLE_URL: string;
  };
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  imageFiles: (File | null)[];
  imageValues: string[];
  imagePreviews: (string | null)[];
  onImageFileChange: (idx: number, file: File | null) => void;
  onImageValueChange: (idx: number, value: string) => void;
  onImagePreviewChange: (idx: number, preview: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  success: string;
  isEdit?: boolean;
}

const FoodJourneyForm: React.FC<FoodJourneyFormProps> = ({
  form,
  onInputChange,
  imageFiles,
  imageValues,
  imagePreviews,
  onImageFileChange,
  onImageValueChange,
  onImagePreviewChange,
  onSubmit,
  submitting,
  error,
  success,
  isEdit = false,
}) => {
  return (
    <div className="border border-primary  rounded-2xl p-4 lg:p-8 bg-primary/10">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-lg p-4 sm:p-10 space-y-6"
      >
        <div className="space-y-10">
          {/* Title */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">{isEdit ? 'Edit Title' : 'Title'}</label>
            <Input
              type="text"
              name="TITLE"
              value={form.TITLE}
              onChange={onInputChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="E.g : Shawarma in Switzerland? This One Changed the Game"
              required
            />
          </div>

          {/* Restaurant Name */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Restaurant Name</label>
            <Input
              type="text"
              name="RESTAURANT_NAME"
              value={form.RESTAURANT_NAME}
              onChange={onInputChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Google Maps URL */}
          <div className="flex flex-col md:col-span-2">
            <label className="font-semibold mb-1">
              Google Maps URL <span className="text-gray-500">(optional)</span>
            </label>
            <Input
              type="url"
              name="ADDRESS_GOOGLE_URL"
              value={form.ADDRESS_GOOGLE_URL}
              onChange={onInputChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="border border-gray-300 rounded-md px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <p className="font-semibold">Upload Images (up to 3)</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((idx) => (
                <ImageUploadField
                  key={idx}
                  label={`Photo ${idx + 1}`}
                  value={imageValues[idx] ?? ""}
                  onChange={(value) => onImageValueChange(idx, value)}
                  onFileSelect={(file) => onImageFileChange(idx, file)}
                  imageFile={imageFiles[idx] ?? null}
                  previewUrl={imagePreviews[idx] ?? null}
                  onPreviewChange={(preview) =>
                    onImagePreviewChange(idx, preview)
                  }
                  disabled={submitting}
                  uploading={submitting}
                />
              ))}
            </div>
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
            {submitting ? (isEdit ? "Updating..." : "Submitting...") : (isEdit ? "Update My Journey" : "Share My Journey")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodJourneyForm;
