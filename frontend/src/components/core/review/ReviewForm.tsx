import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';
import { Star, Trash2, Loader2, Info, CheckCircle, ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';

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
  const [images, setImages] = useState<File[]>(
    initialImages.filter((img): img is File => img instanceof File)
  );
  const [video, setVideo] = useState<File | null>(
    initialVideo instanceof File ? initialVideo : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const allowedFiles = newFiles.slice(0, MAX_IMAGES - images.length);
    setImages(prev => [...prev, ...allowedFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVideo(e.target.files[0]);
  };

  const handleRemoveVideo = () => setVideo(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (images.length >= MAX_IMAGES) return;
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const allowedFiles = files.slice(0, MAX_IMAGES - images.length);
      setImages(prev => [...prev, ...allowedFiles]);
    }
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (video) return;
    const file = Array.from(e.dataTransfer.files).find(file => file.type.startsWith('video/'));
    if (file) setVideo(file);
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
      const uploadedImageUrls: string[] = [];
      for (const image of images) {
        const result = await uploadFile(image);
        if (result) {
          uploadedImageUrls.push(result.url);
        }
      }
      // 2. Upload video to S3 (if any)
      let uploadedVideoUrl: string | null = null;
      if (video) {
        const result = await uploadFile(video);
        if (result) {
          uploadedVideoUrl = result.url;
        }
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
    <form className="my-8 space-y-6 max-w-2xl mx-auto bg-primary/10 p-10 rounded-lg border-primary border" onSubmit={handleSubmit}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div>
          <label className="block text-text-main font-semibold mb-2">
            Photos ({images.length}/{MAX_IMAGES})
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${images.length >= MAX_IMAGES
                ? 'border-gray-200 bg-gray-50 text-gray-400'
                : 'border-primary/40 hover:border-primary hover:bg-primary/5 text-primary'
              }`}
            onClick={() => images.length < MAX_IMAGES && imageInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleImageDrop}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={images.length >= MAX_IMAGES}
            />
            <ImageIcon size={32} className="mx-auto mb-3 text-primary" />
            <p className="font-medium">
              {images.length >= MAX_IMAGES
                ? 'Maximum reached'
                : 'Click or drag to upload'}
            </p>
            <p className="text-sm mt-1 text-text-light">JPEG, PNG up to 5MB each</p>
          </div>
          {/* Image Previews */}
          <div className="flex flex-wrap gap-3 mt-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-primary/20 bg-background">
                  <Image
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                    fill
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Video */}
        <div>
          <label className="block text-text-main font-semibold mb-2">
            Video (optional)
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${video
                ? 'border-gray-200 bg-gray-50 text-gray-400'
                : 'border-primary/40 hover:border-primary hover:bg-primary/5 text-primary'
              }`}
            onClick={() => !video && videoInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleVideoDrop}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
              disabled={!!video}
            />
            <Video size={32} className="mx-auto mb-3 text-primary" />
            <p className="font-medium">
              {video ? 'Video uploaded' : 'Click or drag to upload'}
            </p>
            <p className="text-sm mt-1 text-text-light">MP4, MOV up to 50MB</p>
          </div>
          {video && (
            <div className="mt-4 relative group">
              <div className="bg-gray-100 border border-primary/20 rounded-lg w-full h-24 flex items-center justify-center">
                <span className="text-gray-700 font-medium truncate px-2">
                  {video.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
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