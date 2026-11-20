import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SocialLinksProps {
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "circle" | "filled";
  className?: string;
}

const ICON_SIZE = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  "2xl": 48,
};

export function SocialLinks({
  facebook,
  instagram,
  whatsapp,
  size = "md",
  variant = "default",
  className = "",
}: SocialLinksProps) {
  const sizePx = ICON_SIZE[size];

  const platforms = [
    {
      name: "facebook",
      url: facebook,
    },
    {
      name: "instagram",
      url: instagram,
    },
    {
      name: "whatsapp",
      url: whatsapp
        ? whatsapp.startsWith("http")
          ? whatsapp
          : `https://wa.me/${whatsapp.replace(/\D/g, "")}`
        : null,
    },
  ];

  const baseWrapperStyle = {
    default: "",
    circle: "rounded-full border p-1",
    filled: "rounded-full bg-white shadow p-1",
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {platforms.map(({ name, url }) => {
        const icon = (
          <Image
            src={`/svgs/${name}.svg`}
            alt={`${name} icon`}
            width={sizePx}
            height={sizePx}
            className={cn(
              "object-contain transition-all duration-200",
              !url && "grayscale opacity-50"
            )}
          />
        );

        return url ? (
          <Link
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("group", baseWrapperStyle[variant])}
            aria-label={name}
          >
            {icon}
          </Link>
        ) : (
          <span
            key={name}
            aria-label={`${name} (not available)`}
            className={cn(baseWrapperStyle[variant])}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
