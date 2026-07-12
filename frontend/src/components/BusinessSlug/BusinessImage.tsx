import React from "react";
import Image from "next/image";
import clsx from "clsx";

interface BusinessImageProps {
  imageUrl?: string;
  businessName: string;
  className?: string;
}

const BusinessImage: React.FC<BusinessImageProps> = ({
  imageUrl,
  businessName,
  className = "",
}) => {
  return (
    <div
      className={clsx("relative w-full overflow-hidden shadow-lg", className)}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={businessName || "Business"}
          width={100}
          height={100}
          className="object-cover w-full h-[600px] aspect-video "
          sizes="(max-width: 768px) 100vw, 50vw"
          quality={70}
          priority
          fetchPriority="high"
        />
      ) : (
        <div className=" w-full h-[600px] aspect-video  flex items-center justify-center bg-gray-200">
          <span className="text-4xl md:text-6xl text-wrap font-bold text-gray-600 uppercase">
            {businessName}
          </span>
        </div>
      )}
    </div>
  );
};

export default BusinessImage;
