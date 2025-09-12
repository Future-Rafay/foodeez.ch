import Banner from "@/components/core/Banner";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import FoodJourneyCard from "../../core/food-journey/FoodJourneyCard";
import { visitor_food_journey_view } from "@prisma/client";
import { getFoodJourney } from "@/services/FoodJourneyService";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";

const FoodJourney = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [journeys, setJourneys] = useState<visitor_food_journey_view[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchStories = useCallback(async () => {
    let userId: number | undefined = undefined;
    if (session?.user?.id) {
      userId = Number(session.user.id);
    }
    const data = await getFoodJourney(userId);
    setHasMore(data.length > 6);
    setJourneys(data); // Fetch only the first 6 journeys
  }, [session]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleEdit = (story: visitor_food_journey_view) => {
    router.push(`/food-journey?edit=${story.VISITOR_FOOD_JOURNEY_ID}`);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        document.getElementById('shareFoodJourneyStory')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/food-journey/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete food journey');
      fetchStories()
    } catch (err) {
      console.log(`Error deleting food journey : ${err}`)
      alert('Failed to delete food journey');
    }
  };

  return (
    <section className="w-full">
      <h2 className="sub-heading my-10 text-center">
        Be a food Explorer - Earn <b>POINTS & BADGES</b>
      </h2>

      <Banner
        desktopSrc="/images/banners/foodjourney.png"
        mobileSrc="/images/bannerForMobile/foodjourney.png"
        alt="Share Your Experience"
      />

      {/* Top Food Journey Stories */}
      <div className="px-4 lg:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 my-6">
        {journeys.slice(0, 6).map((j) => (
          <FoodJourneyCard key={j.VISITOR_FOOD_JOURNEY_ID} journey={j} currentUserId={session?.user?.id} onDelete={handleDelete} onEdit={() => handleEdit(j)} />
        ))}
      </div>
      {/* CTA Button Below Banner */}
      <div className="px-4 lg:px-0 text-center">
        <div className="my-12 inline-flex items-center justify-center gap-4" >
          {hasMore && (
            <Link href="/food-journey" passHref target="_blank">
              <button className="btn-primary">
                See More Food Journey Stories
              </button>
            </Link>
          )}

          <button
            className="btn-secondary"
            onClick={() => {
              if (session) {
                window.open('/food-journey#shareFoodJourneyStory', '_blank');
              } else {
                setShowLoginModal(true);
              }
            }}
          >
            Share Your Food Journey Experience
          </button>
        </div>
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    </section>
  );
};

export default FoodJourney;
