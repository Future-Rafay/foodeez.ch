import React, { useState, FormEvent } from 'react';
import { Star, Loader2, Info, CheckCircle } from 'lucide-react';
import ImageUploadField from '@/components/ui/ImageUploadField';
import VideoUploadField from '@/components/ui/VideoUploadField';

const MAX_IMAGES = 3;
const MAX_REMARKS = 1000;

interface ReviewFormProps {
  businessId: number;
  onSuccess: () => void;
  initialRemarks?: string;
  initialRating?: number;
  initialImages?: (File | string)[];
  initialVideo?: File | string;
  reviewId?: number;
  isEdit?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  businessId,
  onSuccess,
  initialRemarks = '',
  initialRating = 5,
  initialImages = [],
  initialVideo = null,
  reviewId,
  isEdit = false,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [remarks, setRemarks] = useState(initialRemarks);
  const [images, setImages] = useState<(File | null)[]>(() =>
    Array.from({ length: MAX_IMAGES }, (_, idx) =>
      initialImages[idx] instanceof File ? initialImages[idx] as File : null
    )
  );
  const [imageValues, setImageValues] = useState<string[]>(() =>
    Array.from({ length: MAX_IMAGES }, (_, idx) =>
      typeof initialImages[idx] === 'string' ? initialImages[idx] as string : ''
    )
  );
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>(
    () => Array(MAX_IMAGES).fill(null)
  );
  const [video, setVideo] = useState<File | null>(
    initialVideo instanceof File ? initialVideo : null
  );
  const [videoValue, setVideoValue] = useState(
    typeof initialVideo === 'string' ? initialVideo : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleImageFileChange = (index: number, file: File | null) => {
    setImages(prev => prev.map((item, idx) => idx === index ? file : item));
  };

  const handleImageValueChange = (index: number, value: string) => {
    setImageValues(prev => prev.map((item, idx) => idx === index ? value : item));
  };

  const handleImagePreviewChange = (index: number, preview: string | null) => {
    setImagePreviews(prev => prev.map((item, idx) => idx === index ? preview : item));
  };

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


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Upload images to S3
      const uploadedImageUrls = [...imageValues];
      for (let idx = 0; idx < images.length; idx += 1) {
        const image = images[idx];
        if (!image) continue;
        const result = await uploadFile(image);
        if (!result) {
          throw new Error(`Failed to upload photo ${idx + 1}`);
        }
        uploadedImageUrls[idx] = result.url;
      }
      // 2. Upload video to S3 (if any)
      let uploadedVideoUrl: string | null = videoValue || null;
      if (video) {
        const result = await uploadFile(video);
        if (!result) {
          throw new Error('Failed to upload video');
        }
        uploadedVideoUrl = result.url;
      }
      // 3. Prepare payload for your API
      const payload = {
        businessId,
        rating,
        remarks,
        picUrls: uploadedImageUrls,
        videoUrl: uploadedVideoUrl,
        ...(isEdit && reviewId ? { reviewId } : {}),
      };
      // 4. Submit to your local API as JSON
      const response = await fetch('/api/reviews', {
        method: isEdit && reviewId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Submission failed');
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to submit review. Please try again. ERROR :' + err);
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <form className="mx-auto my-8 max-w-4xl space-y-6 rounded-lg border border-primary bg-primary/10 p-4 sm:p-6 lg:p-10" onSubmit={handleSubmit}>
      {/* Rating Section */}
      <div className="text-center">
        <label className="block text-text-main text-lg font-semibold mb-4">
          How would you rate your experience?
        </label>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className="p-1 transition-transform duration-150 ease-in-out hover:scale-110 focus:outline-none"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${star} stars`}
            >
              <Star
                size={40}
                className={
                  star <= displayRating
                    ? 'text-highlight fill-highlight drop-shadow'
                    : 'text-gray-300'
                }
              />
            </button>
          ))}
        </div>
        <div className="mt-2 text-lg font-medium text-primary">
          {displayRating} Star{displayRating !== 1 ? 's' : ''}
        </div>
      </div>
      {/* Remarks Section */}
      <div>
        <label htmlFor="remarks" className="block text-text-main font-semibold mb-2">
          Share details of your experience
        </label>
        <textarea
          id="remarks"
          className="w-full border border-primary/30 rounded-xl p-4 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition duration-200 min-h-[140px] resize-none bg-background"
          placeholder="What did you like or dislike? What stood out?"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          required
          maxLength={MAX_REMARKS}
        />
        <div className="flex justify-end  mt-1">
          <span className={`text-xs ${remarks.length > MAX_REMARKS - 50 ? 'text-warning' : 'text-text-light'}`}>
            {remarks.length}/{MAX_REMARKS}
          </span>
        </div>
      </div>
      {/* Media Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Images */}
        <div>
          <p className="mb-2 font-semibold text-text-main">Photos (up to {MAX_IMAGES})</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: MAX_IMAGES }, (_, idx) => (
              <ImageUploadField
                key={idx}
                label={`Photo ${idx + 1}`}
                value={imageValues[idx]}
                onChange={(value) => handleImageValueChange(idx, value)}
                onFileSelect={(file) => handleImageFileChange(idx, file)}
                imageFile={images[idx]}
                previewUrl={imagePreviews[idx]}
                onPreviewChange={(preview) => handleImagePreviewChange(idx, preview)}
                disabled={loading}
                uploading={loading}
              />
            ))}
          </div>
        </div>
        {/* Video */}
        <VideoUploadField
          label="Video (optional)"
          value={videoValue}
          onChange={setVideoValue}
          onFileSelect={setVideo}
          videoFile={video}
          disabled={loading}
          uploading={loading}
        />
      </div>
      {/* Status Messages */}
      <div className="min-h-[40px]">
        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <Info size={20} />
            <span>{error}</span>
          </div>
        )}
        {showConfirmation && (
          <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle size={20} className="text-success" />
            <span>Review submitted successfully!</span>
          </div>
        )}
      </div>
      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary hover:shadow-xl'
          } disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={24} />
            Submitting...
          </span>
        ) : (
          'Submit Review'
        )}
      </button>
    </form>
  );
};

export default ReviewForm;
