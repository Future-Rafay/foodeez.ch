import type { Metadata } from "next";
import FeaturedBusiness from "@/components/home/FeaturedBusiness";

export const metadata: Metadata = {
  title: "Discover Restaurants",
  description: "Find restaurants across Switzerland by food preference, category, city, or postcode.",
  alternates: { canonical: "/business" },
};

export default function BusinessesPage() {
  return (
    <main className="min-h-screen py-10 sm:py-14 lg:py-20">
      <div className="">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="main-heading">Discover Restaurants</h1>
          <p className="main-heading-description">
            Discover amazing food businesses that can satisfy your cravings and
            culinary curiosity.
          </p>
        </div>

        <FeaturedBusiness />
      </div>
    </main>
  );
}
