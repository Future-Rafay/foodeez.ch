'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Internal Modal Component
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-2 sm:px-0 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative transition-all duration-300 scale-100 sm:scale-100 animate-modalPop">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="px-6 sm:px-10 pb-8 pt-2 sm:pt-0 text-center">
          <div className="text-lg sm:text-xl text-gray-700 font-medium leading-relaxed mb-4">
            {children}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes modalPop {
          0% { transform: scale(0.95) translateY(40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-modalPop {
          animation: modalPop 0.25s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
  callbackUrl?: string;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  title = 'Login Required',
  message = 'You need to be logged in to access this feature.',
  callbackUrl,
}) => {
  const router = useRouter();

  const handleSignIn = () => {
    onClose();
    router.push(`/auth/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
  };

  const handleSignUp = () => {
    onClose();
    router.push(`/auth/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center p-4 lg:p-6">
        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/Logo/LogoFoodeezMain.svg"
            alt="Foodeez"
            width={120}
            height={40}
            className="mx-auto mb-8"
          />
          <p className="subheading text-secondary font-medium">
            Discover Amazing Restaurants
          </p>
        </div>

        {/* Icon and Message */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-4">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleSignIn}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Log in
          </button>
          <button
            onClick={handleSignUp}
            className="flex-1 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            Sign Up
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Join thousands of food lovers sharing their experiences
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default LoginRequiredModal;
