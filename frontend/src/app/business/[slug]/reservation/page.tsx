"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { extractBusinessId, parseSlug } from "@/lib/utils/genSlug";
import ReservationHero from "./components/ReservationHero";
import ContactInfoCard from "./components/ContactInfoCard";
import ReservationImage from "./components/ReservationImage";
import ReservationForm from "./components/ReservationForm";
import ReservationSummary from "./components/ReservationSummary";
import ReservationSuccess from "./components/ReservationSuccess";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Banner from "@/components/core/Banner";
import { getBusinessById } from "@/services/BusinessProfilePageService";


export default function ReservationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const parsedId = parseSlug(slug);
  const businessId = extractBusinessId(slug);

  const [business, setBusiness] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: "2",
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
    occasion: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch business data
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        // Use the imported function
        const data = await getBusinessById(parsedId.id);
        setBusiness(data);
      } catch (error) {
        console.error("Error fetching business:", error);
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusiness();
    }
  }, [businessId, slug, parsedId.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          businessId: business.BUSINESS_ID,
          businessName: business.BUSINESS_NAME,
          businessEmail: business.EMAIL_ADDRESS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reservation');
      }

      setIsSuccess(true);
      window.scrollTo(0, 0); // Scroll to top on success
    } catch (error) {
      console.error("Error submitting reservation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!business) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {loadFailed ? "Restaurant could not be loaded" : "Business Not Found"}
        </h2>
        <p className="text-gray-600 mb-6">
          {loadFailed
            ? "Something went wrong on our side. Please refresh the page to try again."
            : "Sorry, we couldn't find the business you're looking for."}
        </p>
        <Link
          href="/business"
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ChevronLeft size={16} className="mr-1" />
          Return to business list
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="px-4 lg:px-0 py-12">
        <ReservationSuccess
          business={business}
          email={formData.email}
          date={formData.date}
          time={formData.time}
          guests={formData.guests}
          onBack={() => (window.location.href = `/business/${slug}`)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="">
        <Banner
          desktopSrc="/images/banners/banner1.jpeg"
          mobileSrc="/images/bannerForMobile/banner1.jpeg"
          alt={`Banner`}
        />
        <div className="">
          <ReservationHero business={business} />
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 mb-10">
            {/* Left: Image - center vertically */}
            <div className="flex flex-col justify-center h-full">
              <div className="mb-2">
                <Link
                  href={`/business/${slug}`}
                  className="inline-flex items-center text-primary hover:text-primary-dark"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back to {business.BUSINESS_NAME}
                </Link>
              </div>
              <ReservationImage business={business} />
            </div>

            {/* Right: Contact Info & Form */}
            <div className="flex flex-col">
              <ContactInfoCard business={business} />

              <div className="bg-primary/10 rounded-xl shadow-lg overflow-hidden mt-6">
                <div className="p-6 md:p-8">
                  <ReservationForm
                    businessName={business.BUSINESS_NAME}
                    formData={formData}
                    setFormData={setFormData}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isSubmitting={isSubmitting}
                    handleSubmit={handleSubmit}
                  >
                    {currentStep === 2 && (
                      <ReservationSummary
                        business={business}
                        date={formData.date}
                        time={formData.time}
                        guests={formData.guests}
                        occasion={formData.occasion}
                      />
                    )}
                  </ReservationForm>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
