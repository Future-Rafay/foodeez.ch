"use client";

import Link from "next/link";

interface AnnouncementBarProps {
  bgColor?: string;
  textColor?: string;
}

export default function AnnouncementBar2({
  bgColor = "bg-primary",
  textColor = "text-white",
}: AnnouncementBarProps) {
  return (
    <div
      className={`w-full ${bgColor} ${textColor} py-2.5 px-4 relative flex items-center justify-center text-center shadow-sm`}
    >
      <div className="max-w-5xl w-full text-sm sm:text-base flex flex-wrap justify-center gap-2">
        <span>Limited Time Offer: Get 30% off on Premium Plan!</span>
        <Link
          href="/auth/signup"
          className="font-bold hover:text-white/90 hover:underline transition-colors"
        >
          Sign up now →
        </Link>
      </div>
    </div>
  );
}
