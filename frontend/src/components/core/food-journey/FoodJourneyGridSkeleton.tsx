import React from "react";

const SkeletonCard = () => (
  <div className="rounded-2xl border border-accent bg-white shadow-lg p-5 flex flex-col h-full animate-pulse">
    {/* Avatar and name */}
    <div className="flex items-center gap-3 mb-4">
      <div className="h-12 w-12 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
    </div>
    {/* Title */}
    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
    {/* Description */}
    <div className="h-3 w-full bg-gray-100 rounded mb-1" />
    <div className="h-3 w-5/6 bg-gray-100 rounded mb-1" />
    <div className="h-3 w-2/3 bg-gray-100 rounded mb-4" />
    {/* Food Images */}
    <div className="flex flex-wrap gap-2 mt-auto">
      <div className="w-16 h-16 rounded bg-gray-200" />
      <div className="w-16 h-16 rounded bg-gray-100" />
      <div className="w-16 h-16 rounded bg-gray-100" />
    </div>
  </div>
);

const FoodJourneyGridSkeleton = () => {
  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    </div>
  );
};

export default FoodJourneyGridSkeleton; 