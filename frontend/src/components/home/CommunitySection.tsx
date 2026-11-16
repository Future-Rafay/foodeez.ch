"use client";

// import { Button } from "@/components/core/Button";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

export default function CommunitySection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <motion.section
      className="w-full flex flex-col items-center py-10 px-4 lg:px-0"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {/* CTA Buttons */}
      <motion.div
        className="max-w-5xl w-full flex flex-col md:flex-row gap-6 mb-14"
        variants={itemVariants}
      >
        <Link href="/food-journey" target="_blank" className="text-center flex-1 bg-primary hover:bg-primary-dark text-white text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-md transform transition-all hover:-translate-y-1 hover:scale-105">
          Know a hidden gem? Recommend it!
        </Link>
        <Link href="/contact" target="_blank" className="text-center flex-1 bg-secondary hover:bg-secondary-dark text-white text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-md transform transition-all hover:-translate-y-1 hover:scale-105">
          Help us serve better! Tell us what's missing.
        </Link>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="w-full border-t-4 border-dotted border-highlight mb-14 opacity-80"
        variants={itemVariants}
      />

      {/* Heading + Description */}
      <motion.div
        className="text-center max-w-4xl mb-10"
        variants={itemVariants}
      >
        <h2 className="sub-heading">Foodeez Community</h2>
        <p className="text-lg sm:text-xl text-text-muted my-6">
          Food centric Newsletters{" "}
          <span className="text-primary font-bold mx-2">|</span> Free Recipe
          cards <span className="text-primary font-bold mx-2">|</span> Access to
          authenticated supplier list
        </p>
        <p className="text-xl sm:text-2xl font-bold text-primary-dark leading-relaxed ">
          Are you a Food Blogger, traveler, influencer?{" "}
          <span className="text-accent">Join now to share & help others!</span>
        </p>
      </motion.div>

      {/* Community Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 w-full">
        {/* Left Card */}
        <motion.div
          className="bg-background-card p-6 rounded-lg shadow-md border border-gray-200 space-y-10 text-left text-lg sm:text-xl text-text-main"
          variants={itemVariants}
        >
          <p className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-primary mt-1" />
            <span>
              <strong>Q:</strong> Where do you buy real Parmigiano-Reggiano?
            </span>
          </p>
          <p className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-primary mt-1" />
            <span>
              <strong>Q:</strong> What certifications do you trust for organic
              ingredients?
            </span>
          </p>
          <p className="flex items-start gap-3">
            <ImageIcon className="w-6 h-6 text-primary mt-1" />
            <span>
              <strong>Q:</strong> Found an amazing farmers' market? Drop the pin
              📍
            </span>
          </p>
          
        </motion.div>

        {/* Right Card */}
        <motion.div
          className="bg-background-card p-6 rounded-lg shadow-md border border-gray-200 space-y-10 text-left text-lg sm:text-xl text-text-main"
          variants={itemVariants}
        >
          <p className="flex items-start gap-3">
            <MessageCircle className="w-6 h-6 text-primary mt-1" />
            <span>
              <strong>Tip:</strong> Best tips for sourcing spices? Let’s build
              the ultimate pantry.
            </span>
          </p>
          <p className="flex items-start gap-3">
            <MessageCircle className="w-6 h-6 text-primary mt-1" />
            <span>
              <strong>Share:</strong> I fermented this kimchi for 7 days — AMA!
            </span>
          </p>
          <p className="flex items-start gap-3">
            <ImageIcon className="w-6 h-6 text-primary mt-1" />
            <span>
              <strong>Show:</strong> Show us your plate 🍽️ — What did you cook
              today?
            </span>
          </p>
        </motion.div>
      </div>

      {/* Feedback Prompt */}
      <motion.div
        className="flex flex-col sm:flex-row justify-center items-center gap-6 text-xl sm:text-2xl font-medium text-text-main bg-background p-6 rounded-lg border border-gray-400 shadow-sm mb-12 max-w-5xl"
        variants={itemVariants}
      >
        <span className="text-center sm:text-left">
          What do <span className="italic font-bold text-primary">you</span>{" "}
          want to see in this forum?
        </span>
        <span className="text-center sm:text-left">
          Help us test new features –{" "}
          <Link href="/contact" target="_blank" className="hover:underline font-bold text-secondary">Feedback wanted!</Link>
        </span>
      </motion.div>

      {/* Final CTA */}
      {/* <motion.div className="mt-6" variants={itemVariants}>
        <Button className="bg-primary hover:bg-primary-dark text-white text-xl px-10 py-4 rounded-full shadow-xl border border-primary-dark transform transition-all hover:scale-105"
        disabled
        >
          Join Foodeez Community Now!
        </Button>
      </motion.div> */}
    </motion.section>
  );
}
