'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  isOpen: boolean;
  title: string;
  message: string;
}

const DeleteConfirmModal = ({
  onConfirm,
  onCancel,
  loading = false,
  isOpen,
  title,
  message,
}: DeleteConfirmModalProps) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md  relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}  
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              aria-describedby="delete-description"
            >
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
                onClick={onCancel}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <h3
                id="delete-title"
                className="sub-heading"
              >
                {title}
              </h3>
              <p
                id="delete-description"
                className="sub-heading-description text-gray-600 mt-2 mb-4"
              >
                {message}
              </p>

              <div className="flex gap-4">
                <button
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-100 transition-colors"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-primary text-white rounded-lg py-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
