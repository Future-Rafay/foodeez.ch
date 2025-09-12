"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/core/Button";
import { motion } from "framer-motion"; // Import motion
import SEO from "@/components/seo/SEO";
import { useSession } from "next-auth/react";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";
import { useState } from "react";
import { checkBusinessOwnerExist } from "@/services/PricingPageService";

export default function PricingPage() {
  const session = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isBusinessOwnerFunctionLoading, setIsBusinessOwnerFunctionLoading] = useState(false);


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleGetPremium = async () => {

    if (session.status === "unauthenticated") {
      setShowLoginModal(true);
    } else {
      const user = session.data?.user;
      if (user) {
        setIsBusinessOwnerFunctionLoading(true);
        const ifBusinessOwnerExist = await checkBusinessOwnerExist(Number(user.id))
        setIsBusinessOwnerFunctionLoading(false);
        if (ifBusinessOwnerExist) {
          window.open('/contact', '_blank');
        } else {
          window.open('/business/register', '_blank');
        }
      }
    }

  };

  return (
    <>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Please login to get premium"
      />

      <SEO
        title="Pricing"
        description="Foodeez pricing plans: start free, upgrade to Premium for priority visibility, ads access, and more."
        url={typeof window !== 'undefined' ? window.location.href : 'https://foodeez.ch/pricing'}
        canonical={typeof window !== 'undefined' ? window.location.href : undefined}
        type="website"
        breadcrumbs={[{ name: 'Home', url: 'https://foodeez.ch' }, { name: 'Pricing', url: 'https://foodeez.ch/pricing' }]}
      />
      <motion.div
        className="py-12 px-4  flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="max-w-2xl text-center mb-10"
          variants={itemVariants}
        >
          <h1 className="sub-heading">
            Subscribe to foodeez – grow your audience
          </h1>
          <p className="sub-heading-description">
            Start free, upgrade later with bonus services
          </p>
        </motion.div>

        {/* Plans Section */}
        <motion.div
          className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-10"
          variants={containerVariants}
        >
          {/* Basic Plan */}
          <motion.div
            className="rounded-3xl border border-secondary-light bg-secondary-light/5 shadow-md p-8 flex flex-col "
            variants={itemVariants}
            whileHover={{ translateY: -5, boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-xl lg:text-2xl font-semibold text-primary mb-1">
              Basic{" "}
              <span className="font-normal text-secondary">
                - Visibility to Food Lovers
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-center font-bold text-primary-dark my-6">
              <motion.span
                className="highlight-text" // Highlight class
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Free forever
              </motion.span>
            </p>

            <ul className="space-y-3 mb-4 text-base lg:text-lg">
              {[
                "Free Business listing on Foodeez",
                "Appear in organic searches",
                "Integration with Google Business profile",
                "Link to Social media",
                "Reviews & Feedback",
                "Possibility to get contacted via email & phone",
              ].map((feature) => (
                <motion.li
                  key={feature}
                  className="flex items-start gap-2 text-text-main"
                  variants={itemVariants}
                >
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
            <span className="text-xs lg:text-base text-text-main mt-auto">
              Contact via <a href="mailto:info@foodeez.ch" className="text-primary hover:underline">info@foodeez.ch</a> or Phone (+4176 408 94 30)
            </span>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            className="rounded-3xl border-2 border-primary bg-primary/10 shadow-lg p-8 flex flex-col"
            variants={itemVariants}
            whileHover={{ translateY: -5, boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-xl lg:text-2xl font-semibold text-primary-dark mb-1">
              Premium{" "}
              <span className="font-normal text-secondary">
                - Foodeez visibility
              </span>
            </h2>
            <p className=" text-lg lg:text-xl font-bold text-primary-dark mt-6 text-center">
              <motion.span
                className="highlight-text" // Highlight class
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                First 3 Months free – Then CHF 9/month
              </motion.span>
            </p>
            <ul className="space-y-3 mb-4 mt-6 text-base lg:text-lg">
              {[
                "Everything in Basic",
                "Priority listing and featured placement",
                "Access to Foodeez ad slots",
                "Organic links in Foodeez Blogs and Forums",
                "Menu card management & visibility",
                "Refer another restaurant & get extra Premium month",
              ].map((feature) => (
                <motion.li
                  key={feature}
                  className="flex items-start gap-2 text-text-main"
                  variants={itemVariants}
                >
                  <Check className="w-5 h-5 text-primary-600 mt-1" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
            <Button className="mt-4" variant="primary" size="lg"
              onClick={() => handleGetPremium()}

            >
              {isBusinessOwnerFunctionLoading ? "Loading..." : "Get Premium"}
            </Button>
          </motion.div>
        </motion.div>

        {/* Setup Service Section */}
        <motion.div
          className="w-full rounded-2xl border border-secondary bg-secondary/5  p-6 mb-8 flex flex-col items-start"
          variants={itemVariants}
        >
          <p className="font-medium text-lg lg:text-xl text-text-main mb-2">
            Not yet visible on Google Map & Social Media?{" "}
            <span className="font-normal">
              No worries - We can do that – One time setup cost,{" "}
              <span className="font-bold text-primary">CHF 49.-</span>
            </span>
          </p>
          <ul className="space-y-2 text-base lg:text-lg ml-4 list-disc text-text-main">
            <motion.li variants={itemVariants}>Setup Google Business Profile</motion.li>
            <motion.li variants={itemVariants}>Setup Facebook & Instagram Page</motion.li>
            <motion.li variants={itemVariants}>Integrate with foodeez Business profile</motion.li>
          </ul>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          className="w-full max-w-5xl text-center mt-4"
          variants={itemVariants}
        >
          <p className="text-lg lg:text-3xl text-secondary-dark italic ">
            Foodeez Food Ordering –{" "}
            <span className="font-semibold text-primary">Coming soon ...</span>
          </p>
        </motion.div>
      </motion.div>
    </>
  );
}