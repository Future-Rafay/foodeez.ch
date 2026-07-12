import FoodTypeBadges from '@/components/core/FoodTypeBadges';
import React from 'react'

interface ResturantProfilePageHeaderProps {
    BUSINESS_NAME: string;
    CITY_NAME?: string;
    HALAL?: number;
    VEGAN?: number;
    VEGETARIAN?: number;
    }

const ResturantProfilePageHeader = ({BUSINESS_NAME , CITY_NAME , HALAL,VEGAN, VEGETARIAN} : ResturantProfilePageHeaderProps) => {
  return (
    <div className="py-8 px-4 lg:pb-0 lg:px-0 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="main-heading">
            {BUSINESS_NAME}
            {CITY_NAME && (
              <>
                {" "}
                • <span className="text-secondary-dark">{CITY_NAME}</span>
              </>
            )}
          </h1>
      <FoodTypeBadges 
        HALAL={HALAL || 0}
        VEGAN={VEGAN || 0}
        VEGETARIAN={VEGETARIAN || 0}
      />
   </div>

  )
}

export default ResturantProfilePageHeader
