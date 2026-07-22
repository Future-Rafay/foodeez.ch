import React from "react";
import FoodJourneyCard from "./FoodJourneyCard";

interface FoodJourneyGridProps {
  stories: any[];
  currentUserId?: string;
  onDelete?: (id: number) => Promise<void>;
  onEdit?: (story: any) => void;
}

const FoodJourneyGrid: React.FC<FoodJourneyGridProps> = ({ stories, currentUserId, onDelete, onEdit }) => {
  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((j) => (
          <FoodJourneyCard key={j.VISITOR_FOOD_JOURNEY_ID} journey={j} currentUserId={currentUserId} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
};

export default FoodJourneyGrid;
