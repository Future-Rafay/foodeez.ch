import { CreateFoodeezReviewData, UpdateFoodeezReviewData } from '@/types/foodeez-review.types';
import type { foodeez_review_view } from '@/lib/prisma';

const API_BASE = '/api/foodeez-reviews';

export class FoodeezReviewService {
  static async getReviews(params?: {
    approved?: number;
    limit?: number;
    offset?: number;
  }): Promise<foodeez_review_view[]> {
    const searchParams = new URLSearchParams();
    if (params?.approved !== undefined) searchParams.append('approved', params.approved.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    return response.json();
  }

  static async getReview(id: string): Promise<foodeez_review_view> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch review');
    }
    return response.json();
  }

  static async createReview(data: CreateFoodeezReviewData): Promise<foodeez_review_view> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review');
    }

    return response.json();
  }

  static async updateReview(id: string, data: UpdateFoodeezReviewData): Promise<foodeez_review_view> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update review');
    }

    return response.json();
  }

  static async deleteReview(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete review');
    }
  }

} 