import React from "react";
import { motion } from "framer-motion";
import ReviewForm from "./ReviewForm";

interface ReviewFormModalProps {
    show: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({ show, onSubmit, onCancel }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6">
                    <ReviewForm onSubmit={onSubmit} onCancel={onCancel} />
                </div>
            </motion.div>
        </div>
    );
};

export default ReviewFormModal; 