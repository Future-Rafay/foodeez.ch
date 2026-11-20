'use client';

import { X, Copy, Phone } from 'lucide-react';
import { FaFacebook, FaXTwitter } from 'react-icons/fa6';
import React from 'react';
import Image from 'next/image';

interface ReviewShareModalProps {
  showShare: boolean;
  setShowShare: (show: boolean) => void;
  shareUrl: string;
  handleCopy: () => void;
  copied: boolean;
}

const ReviewShareModal: React.FC<ReviewShareModalProps> = ({
  showShare,
  setShowShare,
  shareUrl,
  handleCopy,
  copied,
}) => {
  if (!showShare) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-primary/20 shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-primary transition-colors"
          onClick={() => setShowShare(false)}
          aria-label="Close share dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Tagline */}
        <div className="text-center mb-6">
          <Image
            src="/Logo/LogoFoodeezMain.svg"
            alt="Foodeez"
            width={120}
            height={40}
            className="mx-auto mb-4"
          />
          <p className="text-sm font-medium text-secondary">
            Discover Amazing Restaurants
          </p>
        </div>

        {/* Heading */}
        <h3 className="text-center text-primary font-semibold text-xl sm:text-2xl mb-4">
          Share This Review
        </h3>

        {/* Share URL */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={shareUrl}
            readOnly
            onFocus={(e) => e.target.select()}
            className="flex-1 text-sm px-3 py-2 border border-primary/30 rounded-full bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleCopy}
            className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            aria-label="Copy link"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Copy Confirmation */}
        {copied && (
          <p className="text-xs text-green-600 text-center mb-2 animate-fadeIn">
            Link copied!
          </p>
        )}

        {/* Divider */}
        <div className="my-4 border-t border-gray-100" />

        {/* Social Icons */}
        <div className="flex justify-center gap-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 transition"
            aria-label="Share on WhatsApp"
          >
            <Phone className="text-green-600 w-5 h-5" />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition"
            aria-label="Share on Facebook"
          >
            <FaFacebook className="text-blue-600 w-5 h-5" aria-hidden="true" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-sky-500/10 hover:bg-sky-500/20 transition"
            aria-label="Share on Twitter"
          >
            <FaXTwitter className="text-sky-500 w-5 h-5" aria-hidden="true" />
          </a>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          Help others discover great food experiences!
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReviewShareModal;
