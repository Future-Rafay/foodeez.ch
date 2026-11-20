"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Share2,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import Button from "@/components/core/Button";
import Input from "@/components/core/Input";

interface FormData {
  businessName: string;
  shortName: string;
  description: string;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  addressTown: string;
  addressCountry: string;
  phoneNumber: string;
  emailAddress: string;
  phoneNumberShort: string;
  whatsappNumber: string;
  webAddress: string;
  facebookLink: string;
  instaLink: string;
  tiktokLink: string;
  googleProfile: string;
  imageUrl: string;
}

const initialFormData: FormData = {
  businessName: "",
  shortName: "",
  description: "",
  addressStreet: "",
  addressZip: "",
  addressCity: "",
  addressTown: "",
  addressCountry: "",
  phoneNumber: "",
  emailAddress: "",
  phoneNumberShort: "",
  whatsappNumber: "",
  webAddress: "",
  facebookLink: "",
  instaLink: "",
  tiktokLink: "",
  googleProfile: "",
  imageUrl: "",
};

// Which fields each step shows, so Next only checks the current step and submit errors open the right one.
const STEP_FIELDS: (keyof FormData)[][] = [
  ["businessName", "shortName", "description", "imageUrl"],
  ["addressStreet", "addressZip", "addressTown", "addressCountry"],
  ["phoneNumber", "emailAddress", "phoneNumberShort", "whatsappNumber", "webAddress"],
  ["facebookLink", "instaLink", "tiktokLink", "googleProfile"],
];

export default function BusinessRegistrationForm() {
  const { status } = useSession();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const findErrors = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (!formData.addressStreet.trim()) {
      newErrors.addressStreet = "Street address is required";
    }

    if (!formData.addressZip.trim()) {
      newErrors.addressZip = "ZIP code is required";
    }

    if (!formData.addressTown.trim()) {
      newErrors.addressTown = "Town/City is required";
    }

    if (!formData.addressCountry.trim()) {
      newErrors.addressCountry = "Country is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
      newErrors.emailAddress = "A valid business email is required";
    }

    return newErrors;
  };

  const validateForm = (): boolean => {
    const newErrors = findErrors();
    setErrors(newErrors);
    const firstStep = STEP_FIELDS.findIndex((fields) => fields.some((field) => newErrors[field]));
    if (firstStep >= 0) setCurrentStep(firstStep + 1);
    return firstStep < 0;
  };

  const nextStep = () => {
    const stepErrors = Object.fromEntries(
      Object.entries(findErrors()).filter(([field]) => STEP_FIELDS[currentStep - 1].includes(field as keyof FormData))
    );
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const apiData = {
        BUSINESS_NAME: formData.businessName,
        SHORT_NAME: formData.shortName,
        DESCRIPTION: formData.description,
        ADDRESS_STREET: formData.addressStreet,
        ADDRESS_ZIP: formData.addressZip.trim(),
        ADDRESS_CITY_ID: formData.addressCity
          ? parseInt(formData.addressCity)
          : null,
        ADDRESS_TOWN: formData.addressTown,
        ADDRESS_COUNTRY: formData.addressCountry,
        PHONE_NUMBER: formData.phoneNumber,
        EMAIL_ADDRESS: formData.emailAddress.trim(),
        PHONE_NUMBER_SHORT: formData.phoneNumberShort,
        WHATSAPP_NUMBER: formData.whatsappNumber,
        WEB_ADDRESS: formData.webAddress,
        FACEBOOK_LINK: formData.facebookLink,
        INSTA_LINK: formData.instaLink,
        TIKTOK_LINK: formData.tiktokLink,
        GOOGLE_PROFILE: formData.googleProfile,
        IMAGE_URL: formData.imageUrl,
      };

      const response = await fetch("/api/business/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register business");
      }

      setSubmitSuccess(true);
    } catch (error) {
      console.error("Error registering business:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check />
          </div>
          <h2 className="text-2xl font-bold text-success mb-4">
            Registration Successful!
          </h2>
          <p className="text-text-muted mb-8">
            Your restaurant has been submitted. The Foodeez team will review it
            and email you once it is live and you can manage it.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/business")}
            className="w-full"
          >
            Go to Businesses
          </Button>
          {/* <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            Go to Dashboard
          </Button> */}
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-text-main mb-4">Sign in to register</h2>
          <p className="text-text-muted mb-8">
            Your restaurant is linked to your Foodeez account, so you can manage
            it once it is approved. Signing up is free.
          </p>
          {status === "loading" ? null : (
            <Link
              href="/auth/signin?callbackUrl=%2Fbusiness%2Fregister"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-md hover:bg-primary-dark"
            >
              Sign in or create an account
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4">
        {/* Progress Steps */}
        <div className="relative px-4 sm:px-8 mb-12">
          {/* Base Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-300 z-0" />

          {/* Progress Line */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary z-10 transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / 3) * 100}%`, // 3 steps between 4 dots
            }}
          />

          {/* Steps */}
          <div className="flex justify-between relative z-20">
            {[1, 2, 3, 4].map((step) => {
              const isActive = step <= currentStep;

              return (
                <div
                  key={step}
                  className="flex flex-col items-center text-center"
                >
                  {/* Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all duration-300 ${isActive
                      ? "bg-primary text-white border-primary shadow-lg"
                      : "bg-white text-gray-500 border-gray-300"
                      }`}
                  >
                    {step}
                  </div>

                  {/* Label */}
                  <div
                    className={`text-xs sm:text-sm mt-2 transition-colors duration-300 ${isActive ? "text-primary font-medium" : "text-gray-400"
                      }`}
                  >
                    {step === 1
                      ? "Basic Info"
                      : step === 2
                        ? "Location"
                        : step === 3
                          ? "Contact"
                          : "Social Media"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-primary/10 rounded-2xl border-accent border p-4 md:p-6 lg:p-10"
        >
          {submitError && (
            <div className="bg-danger/10 p-4 rounded-lg text-danger border border-danger/20">
              {submitError}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-text-main">
                  Basic Information
                </h3>
              </div>

              <div className="space-y-6">
                <Input
                  label="Business Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  error={errors.businessName}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Short Name (for display)"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  maxLength={20}
                  helperText="Max 20 characters"
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-danger">
                      {errors.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-muted">
                    {1000 - formData.description.length} characters remaining
                  </p>
                </div>

                <div className="relative">
                  <Input
                    label="Image URL"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/your-image.jpg"
                    className="bg-background pl-10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <ImageIcon className="absolute left-3 top-9 w-5 h-5 text-text-muted" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-text-main">
                  Location Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Street Address"
                  name="addressStreet"
                  value={formData.addressStreet}
                  onChange={handleChange}
                  required
                  error={errors.addressStreet}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="ZIP Code"
                  name="addressZip"
                  value={formData.addressZip}
                  onChange={handleChange}
                  required
                  error={errors.addressZip}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Town/City"
                  name="addressTown"
                  value={formData.addressTown}
                  onChange={handleChange}
                  required
                  error={errors.addressTown}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Country"
                  name="addressCountry"
                  value={formData.addressCountry}
                  onChange={handleChange}
                  required
                  error={errors.addressCountry}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Phone className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-text-main">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  error={errors.phoneNumber}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Business Email"
                  name="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  required
                  error={errors.emailAddress}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Short Phone Number (optional)"
                  name="phoneNumberShort"
                  value={formData.phoneNumberShort}
                  onChange={handleChange}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="WhatsApp Number (optional)"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <div className="relative">
                  <Input
                    label="Website URL (optional)"
                    name="webAddress"
                    value={formData.webAddress}
                    onChange={handleChange}
                    placeholder="https://yourbusiness.com"
                    className="bg-background pl-10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <Globe className="absolute left-3 top-9 w-5 h-5 text-text-muted" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Social Media */}
          {currentStep === 4 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Share2 className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-text-main">
                  Social Media Links
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Facebook URL (optional)"
                  name="facebookLink"
                  value={formData.facebookLink}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourbusiness"
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Instagram URL (optional)"
                  name="instaLink"
                  value={formData.instaLink}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourbusiness"
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary "
                />

                <Input
                  label="TikTok URL (optional)"
                  name="tiktokLink"
                  value={formData.tiktokLink}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@yourbusiness"
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />

                <Input
                  label="Google Business Profile (optional)"
                  name="googleProfile"
                  value={formData.googleProfile}
                  onChange={handleChange}
                  placeholder="https://g.page/yourbusiness"
                  className="bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              onClick={prevStep}
              type="button"
              disabled={currentStep === 1}
              className="px-8"
            >
              Previous
            </Button>

            {/* Separate keys: reusing one element lets the Next click on step 3 submit the form once it becomes type="submit". */}
            {currentStep < 4 ? (
              <Button
                key="next-step"
                variant="primary"
                onClick={nextStep}
                type="button"
                className="px-8"
              >
                Next
              </Button>
            ) : (
              <Button
                key="submit-registration"
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="px-8"
              >
                Register Business
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
