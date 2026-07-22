"use client";

import Link from "next/link";
import { useState } from "react";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { SocialLinks } from "../core/SocialLinks";
import Image from "next/image";
import { toast } from 'react-hot-toast';
import LoginRequiredModal from "../core/LoginRequiredModal";

export default function Footer() {
  const socialLinks = {
    facebook: "https://facebook.com/foodeez.ch",
    instagram: "https://www.instagram.com/foodeez.ch",
    whatsapp: "https://wa.me/+41764089430",
    twitter: "https://twitter.com/foodeez.ch",
    tiktok: "https://www.tiktok.com/@foodeez.ch",
  };

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMessage = data?.message || 'Subscription failed. Please try again.';
        toast.error(errorMessage);
        return;
      }

      toast.success(data.message || 'Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <footer className="bg-primary pb-8 pt-12 text-white sm:pt-16">
        <div className="container-custom">
          {/* Top Section - Help banner */}
          <div className="mb-10 flex flex-col justify-between gap-5 rounded-xl border-2 border-white p-5 text-white sm:p-8 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Help millions to find the right Place & Food to enjoy
              </h3>
              <p className="">Join our community and share your experiences</p>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}

              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 py-3 font-medium text-primary transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Share your experience
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand and About */}
            <div className="lg:col-span-2">
              <div className="">
                <Image
                  src="/Logo/LogoFoodeezWhite.svg"
                  alt="Foodeez Logo"
                  height={144}
                  width={144}
                  className="w-36 h-36"
                />
              </div>
              <p className="mb-6 max-w-md">
                First tourist-focused food discovery platform for Switzerland,
                especially with support for specific food preferences.
              </p>

              <div className="space-y-3 mb-6">


                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 mt-0.5" />

                  <p>8154 Oberglatt, Switzerland</p>
                </div>


                <div>
                  <a href="tel:+41764089430" target="_blank">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 mr-3" />
                      <p>+41 76 408 94 30</p>
                    </div>
                  </a>
                </div>
                <div>
                  <a href="mailto:info@foodeez.ch" target="_blank">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3" />
                      <p>info@foodeez.ch</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="flex space-x-3">
                <SocialLinks {...socialLinks} size="xl" variant="default" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-5">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/faq" target="_blank" className=" hover:underline">FAQs</Link>
                </li>
                <li>
                  <Link href="/contact" target="_blank" className=" hover:underline">Contact Us</Link>
                </li>
                <li>
                  <Link href="/food-journey" target="_blank" className=" hover:underline">Share your food journey</Link>
                </li>
                <li>
                  <Link href="/#featured-business" className=" hover:underline">Be a Foodeez Explorer</Link>
                </li>
              </ul>
            </div>

            {/* For Businesses */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-5">
                Are you on foodeez? No!
              </h3>

              <ul className="space-y-3">
                <li>
                  <Link href="/auth/signup" target="_blank" className=" hover:underline">
                    Register Now
                  </Link>
                </li>
                <li>
                  <Link href="/contact" target="_blank" className=" hover:underline">Contact Us</Link>
                </li>
              </ul>
              {/* Newsletter */}
              <div className="mt-10">
                <h3 className="text-lg lg:text-xl font-semibold mb-5 text-text">Newsletter</h3>
                <p className="mb-4 text-text">
                  Be the part of foodeez, to get the updates, blogs, new restaurants
                  & foods and offers.
                </p>
                <form onSubmit={handleSubscribe} className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full rounded-lg border border-gray-400 px-4 py-3 text-base text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Subscribe"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Horizontal divider */}
          <div className="h-px bg-white my-8" />

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm md:text-base lg:text-lg mb-4 md:mb-0">
              © {new Date().getFullYear()} Foodeez. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link target="_blank" href="/terms-and-services">Terms and Services</Link>
              <Link target="_blank" href="/privacy-policy">Privacy Policy</Link>
              <Link target="_blank" href="/usage-and-disclaimer">Usage and Disclaimer</Link>
              <Link target="_blank" href="/impressum">Impressum</Link>
            </div>
          </div>
        </div >
      </footer >
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Please login to get premium"
      />
    </>
  );
}
