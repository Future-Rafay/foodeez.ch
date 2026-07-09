import { SocialLinks } from "@/components/core/SocialLinks";
import { MapPin, Phone, Globe } from "lucide-react";
import type { business_detail_view_all } from "@/lib/prisma";

const BusinessInfoSection: React.FC<{ business: business_detail_view_all }> = ({
  business,
}) => {
  return (
    <div className="space-y-6 my-10">
      {/* Description Section */}
      <div className="space-y-2">
        <h2 className="sub-heading">Description</h2>
        <p className="sub-heading-description !text-start !max-w-none !text-text-main">
          {business.DESCRIPTION}
        </p>
      </div>

      {/* Address & Contact */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <MapPin className="text-primary mt-1 h-5 w-5" />
          <div className="space-y-1">
            <p className="font-medium text-gray-900">
              {business.ADDRESS_STREET}
            </p>
            <p className="text-gray-600">
              {/* {business.ADDRESS_TOWN && `${business.ADDRESS_TOWN}, `} */}
              {business.CITY_NAME && `${business.CITY_NAME}, `}
              {business.ADDRESS_ZIP && `${business.ADDRESS_ZIP}, `}
              {business.ADDRESS_COUNTRY}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Phone className="text-primary mt-1 h-5 w-5" />
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{business.PHONE_NUMBER}</p>
            {business.WEB_ADDRESS && (
              <a
                href={business.WEB_ADDRESS}
                className="text-primary flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {new URL(business.WEB_ADDRESS).hostname}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Social & Reserve */}
      <div className="flex items-center justify-between border-t pt-8">
        <SocialLinks
          facebook={business.FACEBOOK_LINK}
          instagram={business.INSTA_LINK}
          whatsapp={business.WHATSAPP_NUMBER}
          size="xl"
          className="gap-2 [&>a]:text-primary"
        />
      </div>
    </div>
  );
};

export default BusinessInfoSection;
