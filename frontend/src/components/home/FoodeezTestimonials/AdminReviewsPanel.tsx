'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/core/Button';
import { Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { FoodeezReviewService } from '@/services/FoodeezReviewService';
import ReviewsFilter from './ReviewsFilter';
import { SortOption, FilterOption } from './ReviewsFilter';
import type { foodeez_review_view } from '@/lib/prisma';

interface AdminReviewsPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const AdminReviewsPanel: React.FC<AdminReviewsPanelProps> = ({
  isVisible,
  onToggle,
}) => {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<foodeez_review_view[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<foodeez_review_view[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterOption] = useState<FilterOption>('all');

  const loadAllReviews = async () => {
    try {
      setIsLoading(true);
      const allReviews = await FoodeezReviewService.getReviews();
      setReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortReviews = useCallback(() => {
    let filtered = [...reviews];

    // Apply filter
    switch (filterBy) {
      case 'approved':
        filtered = filtered.filter(review => review.APPROVED === 1);
        break;
      case 'pending':
        filtered = filtered.filter(review => review.APPROVED === 0);
        break;
      default:
        // Show all reviews
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => 
          new Date(b.CREATION_DATETIME || 0).getTime() - 
          new Date(a.CREATION_DATETIME || 0).getTime()
        );
        break;
      case 'oldest':
        filtered.sort((a, b) => 
          new Date(a.CREATION_DATETIME || 0).getTime() - 
          new Date(b.CREATION_DATETIME || 0).getTime()
        );
        break;
      case 'rating-high':
        filtered.sort((a, b) => (b.RATING || 0) - (a.RATING || 0));
        break;
      case 'rating-low':
        filtered.sort((a, b) => (a.RATING || 0) - (b.RATING || 0));
        break;
    }

    setFilteredReviews(filtered);
  }, [reviews, sortBy, filterBy]);

  useEffect(() => {
    if (isVisible) {
      loadAllReviews();
    }
  }, [isVisible]);

  useEffect(() => {
    filterAndSortReviews();
  }, [filterAndSortReviews]);

  const handleApproveReview = async (reviewId: string) => {
    try {
      await FoodeezReviewService.updateReview(reviewId, { APPROVED: 1 });
      await loadAllReviews();
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await FoodeezReviewService.updateReview(reviewId, { APPROVED: 0 });
      await loadAllReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await FoodeezReviewService.deleteReview(reviewId);
      await loadAllReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const getStats = () => {
    const total = reviews.length;
    const approved = reviews.filter(r => r.APPROVED === 1).length;
    const pending = reviews.filter(r => r.APPROVED === 0).length;

    return { total, approved, pending };
  };

  const stats = getStats();

  // Only show for authenticated users (you can add admin role check here)
  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        height: isVisible ? 'auto' : 0 
      }}
      transition={{ duration: 0.3 }}
      className="bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Review Management
              </h2>
              <p className="text-gray-600">
                Manage and moderate user reviews
              </p>
            </div>
          </div>
          <Button
            onClick={onToggle}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isVisible ? 'Hide Panel' : 'Show Panel'}
          </Button>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">Total Reviews</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-green-600">Approved</div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <ReviewsFilter
          sortBy={sortBy}
          filterBy={filterBy}
          onSortChange={setSortBy}
          onFilterChange={setFilterOption}
          totalReviews={stats.total}
          approvedReviews={stats.approved}
          pendingReviews={stats.pending}
        />

        {/* Reviews Grid with Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <motion.div
              key={review.FOODEEZ_REVIEW_ID.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Review Content */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {review.REVIEWER_NAME?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {review.REVIEWER_NAME || 'Anonymous'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {review.REVIEWER_EMAIL}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 ${
                        i < (review.RATING || 0)
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </div>
                  ))}
                  <span className="text-sm text-gray-600">
                    {review.RATING?.toFixed(1)}/5.0
                  </span>
                </div>

                <p className="text-gray-700 text-sm line-clamp-3">
                  {review.REVIEW || 'No review text provided.'}
                </p>

                <div className="mt-3 text-xs text-gray-500">
                  {new Date(review.CREATION_DATETIME || '').toLocaleDateString()}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    review.APPROVED === 1 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.APPROVED === 1 ? 'Approved' : 'Pending'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {review.APPROVED === 0 && (
                    <Button
                      onClick={() => handleApproveReview(review.FOODEEZ_REVIEW_ID.toString())}
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                  )}
                  {review.APPROVED === 1 && (
                    <Button
                      onClick={() => handleRejectReview(review.FOODEEZ_REVIEW_ID.toString())}
                      size="sm"
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteReview(review.FOODEEZ_REVIEW_ID.toString())}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredReviews.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Reviews Found
            </h3>
            <p className="text-gray-600">
              No reviews match the current filter criteria.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminReviewsPanel; 