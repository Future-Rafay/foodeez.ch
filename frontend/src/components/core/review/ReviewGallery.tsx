"use client";

import Image from 'next/image';
import { PlayCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import ModalPortal from '../ModalPortal';

interface ReviewGalleryProps {
  images: string[];
  hasVideo: boolean;
  galleryIndex: number;
  setGalleryIndex: (idx: number) => void;
  showGallery: boolean;
  setShowGallery: (show: boolean) => void;
  videoUrl?: string;
}

export default function ReviewGallery({ images, hasVideo, galleryIndex, setGalleryIndex, showGallery, setShowGallery, videoUrl }: ReviewGalleryProps) {
  useEffect(() => {
    if (!showGallery) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowGallery(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setShowGallery, showGallery]);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <button
            key={img}
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => {
              setGalleryIndex(idx);
              setShowGallery(true);
            }}
            aria-label="View image"
            type="button"
          >
            <Image
              src={img}
              alt={`Review image ${idx + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
        {hasVideo && videoUrl && (
          <button
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-primary/20 flex items-center justify-center bg-black/60"
            onClick={() => {
              setGalleryIndex(images.length); // video index
              setShowGallery(true);
            }}
            aria-label="View video"
            type="button"
          >
            <PlayCircle className="w-10 h-10 text-white/90 absolute z-10" />
            <video
              src={videoUrl}
              className="object-cover w-full h-full"
              muted
              loop
              playsInline
              preload="metadata"
              poster={images[0]}
            />
          </button>
        )}
      </div>
      {showGallery && (
        <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.currentTarget === event.target && setShowGallery(false)}>
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col items-center overflow-y-auto rounded-xl border-2 border-primary/30 bg-white p-5 shadow-lg sm:max-h-[calc(100dvh-3rem)]" role="dialog" aria-modal="true" aria-label="Review media gallery">
            <button
              className="absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-main hover:bg-gray-100 hover:text-primary"
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
                src={videoUrl}
                controls
                autoPlay
                className="object-contain max-h-[60vh] rounded-lg"
                poster={images[0]}
              />
            )}
            <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img}
                  className={`w-10 h-10 rounded border-2 ${galleryIndex === idx ? 'border-primary' : 'border-gray-200'}`}
                  onClick={() => setGalleryIndex(idx)}
                  aria-label={`Show image ${idx + 1}`}
                  type="button"
                >
                  <Image
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    width={40}
                    height={40}
                    className="object-cover rounded"
                  />
                </button>
              ))}
              {hasVideo && videoUrl && (
                <button
                  className={`w-10 h-10 rounded border-2 flex items-center justify-center ${galleryIndex === images.length ? 'border-primary' : 'border-gray-200'}`}
                  onClick={() => setGalleryIndex(images.length)}
                  aria-label="Show video"
                  type="button"
                >
                  <PlayCircle className="w-6 h-6 text-primary" />
                </button>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
} 