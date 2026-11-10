# Foodeez Testimonials Section

A comprehensive testimonials system for the Foodeez platform that allows users to share their experiences and administrators to manage reviews.

## Features

### For Users
- **Submit Reviews**: Authenticated users can submit reviews with ratings, text, and images
- **Edit Reviews**: Users can edit their own reviews
- **Delete Reviews**: Users can delete their own reviews
- **Real-time Updates**: Reviews appear instantly for the owner without approval
- **Image Upload**: Support for up to 3 images per review (5MB each)

### For Administrators
- **Review Management**: Complete CRUD operations on all reviews
- **Approval System**: Approve or reject pending reviews
- **Filtering & Sorting**: Filter by approval status and sort by various criteria
- **Statistics Dashboard**: View review statistics and metrics

## Components

### Core Components
- `TestimonialsSection.tsx` - Main testimonials section component
- `ReviewCard.tsx` - Individual review display card
- `ReviewForm.tsx` - Form for creating/editing reviews
- `ReviewsGrid.tsx` - Responsive grid layout for reviews
- `EditReviewModal.tsx` - Modal for editing reviews
- `DeleteConfirmModal.tsx` - Confirmation modal for deleting reviews

### API Routes
- `/api/foodeez-reviews` - GET (fetch reviews), POST (create review)
- `/api/foodeez-reviews/[id]` - GET, PUT, DELETE (individual review operations)

### Services
- `FoodeezReviewService.ts` - Service layer for API interactions
- `HomePageService.ts` - Updated to include review fetching

### Types
- `foodeez-review.types.ts` - TypeScript interfaces for review data

## Usage

### Basic Implementation
```tsx
import TestimonialsSection from '@/components/home/FoodeezTestimonials';

function HomePage() {
  return (
    <div>
      <TestimonialsSection />
    </div>
  );
}
```

### Individual Components
```tsx
import { 
  ReviewCard, 
  ReviewForm, 
  ReviewsGrid
} from '@/components/home/FoodeezTestimonials';
```

## Database Schema

The system uses the existing `foodeez_review` table with the following key fields:
- `FOODEEZ_REVIEW_ID` - Primary key
- `REVIEWER_NAME` - Name of the reviewer
- `REVIEWER_EMAIL` - Email for authentication
- `RATING` - 1-5 star rating
- `REVIEW` - Review text content
- `PIC_1`, `PIC_2`, `PIC_3` - Optional image URLs
- `APPROVED` - Approval status (0 = pending, 1 = approved)
- `CREATION_DATETIME` - Timestamp

## Authentication

- Uses NextAuth.js for user authentication
- Reviews are tied to authenticated user emails
- Users can only edit/delete their own reviews
- Admin panel available for authenticated users

## Styling

- Built with Tailwind CSS
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Consistent with Foodeez design system

## File Structure
```
FoodeezTestimonials/
├── TestimonialsSection.tsx    # Main component
├── ReviewCard.tsx             # Individual review card
├── ReviewForm.tsx             # Review creation/editing form
├── ReviewsGrid.tsx            # Reviews grid layout
├── EditReviewModal.tsx        # Edit review modal
├── DeleteConfirmModal.tsx     # Delete confirmation modal
├── index.tsx                  # Component exports
└── README.md                  # This documentation
```

## Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `next-auth` - Authentication
- `@prisma/client` - Database operations

## Future Enhancements

- [ ] Email notifications for review approvals
- [ ] Review analytics and insights
- [ ] Bulk review operations
- [ ] Review moderation queue
- [ ] Review helpfulness voting
- [ ] Review response system
- [ ] Review export functionality 