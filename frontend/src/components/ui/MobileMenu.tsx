"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  User,
  Settings,
  CircleUser,
} from "lucide-react"; // Added Plus icon for "Register Business"
import Image from "next/image";

// --- Helper Components for better readability and reusability ---

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pathname?: string; // Optional prop to check active link
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  children,
  className = "",
  onClick,
  pathname,
}) => {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        block px-2 py-2 rounded-lg transition-colors duration-200
        text-base font-medium
        ${isActive ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100"}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

interface DropdownItemProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pathname?: string; // Optional prop to check active link
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  href,
  children,
  className = "",
  onClick,
  pathname, // Added for active link styling
}) => {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        flex items-center px-2 py-2 text-sm rounded-lg transition-colors duration-200
        ${isActive ? "bg-primary/5 text-primary" : "text-gray-900 hover:bg-gray-100"}
        ${className}
      `}
      target="_blank"
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

interface ProfileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  isDanger?: boolean;
  pathname?: string; // Optional prop to check active link
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  icon,
  label,
  href,
  onClick,
  isDanger = false,
  pathname, // Added for active link styling
}) => {
  const content = (
    <>
      <div className="w-5 h-5 flex-shrink-0 mr-3">{icon}</div>{" "}
      {/* Fixed icon size */}
      <span className="flex-grow">{label}</span>
    </>
  );

  const baseClasses = `
    flex items-center px-4 py-2 rounded-lg text-sm transition-colors duration-200
    ${isDanger ? "text-red-600 hover:bg-red-100" : "text-gray-700 hover:bg-gray-100"}
  `;

  if (href) {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`${baseClasses} ${isActive && !isDanger ? "bg-primary/5 text-primary" : ""}`}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  } else {
    return (
      <button onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }
};

// --- Main MobileMenu Component ---

interface MobileMenuProps {
  isMenuOpen: boolean; // Keep this prop to control visibility from parent
  isAuthenticated?: boolean;
  userName?: string | null;
  userImage?: string | null;
  onSignOut?: () => void;
  onNavLinkClick?: () => void; // Added for closing menu after navigation
  pathname?: string; // Added for active link styling
}

export default function MobileMenu({
  isMenuOpen, // Use this prop directly for AnimatePresence
  isAuthenticated,
  userName,
  userImage,
  onSignOut,
  onNavLinkClick,
  pathname,
  // Prop to close menu after clicking a link
}: MobileMenuProps) {
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);

  const togglePartnerMenu = () => setIsPartnerOpen((prev) => !prev);

  // Animation variants for the dropdown content
  const dropdownVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.2 } },
  };

  const handleNavLinkClick = () => {
    if (onNavLinkClick) {
      onNavLinkClick(); // Call parent handler to close menu
    }
  };

  return (
    <AnimatePresence>
      {isMenuOpen && ( // Conditionally render based on isMenuOpen
        <motion.div
          initial={{ opacity: 0, y: -20 }} // Start slightly above
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }} // Exit animation
          transition={{ duration: 0.2 }}
          className="lg:hidden bg-white border-y border-gray-200 shadow-md absolute w-full z-40 top-full" // Added shadow, fixed positioning
        >
          <div className="px-2 py-4 space-y-4">
            {" "}
            {/* Increased general spacing */}
            {/* Be Foodeez Partner Dropdown */}
            <div>
              <button
                onClick={togglePartnerMenu}
                className="w-full flex justify-between items-center px-2 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                aria-expanded={isPartnerOpen} // Accessibility
              >
                Be Foodeez Partner
                {isPartnerOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              <AnimatePresence>
                {isPartnerOpen && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={dropdownVariants}
                    className="pl-6 pt-2 space-y-2 overflow-hidden" // Added overflow-hidden for smooth height transition
                  >
                    <DropdownItem
                      href="/business/register"
                      onClick={handleNavLinkClick}
                      pathname={pathname} // Pass pathname for active link styling
                    >
                      Register Your Business
                    </DropdownItem>
                    <DropdownItem
                      href="/pricing"
                      onClick={handleNavLinkClick}
                      pathname={pathname} // Pass pathname for active link styling
                    >
                      Pricing Plans
                    </DropdownItem>
                    <DropdownItem
                      href="/contact"
                      onClick={handleNavLinkClick}
                      pathname={pathname} // Pass pathname for active link styling
                    >
                      Contact
                    </DropdownItem>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Share Experience */}
            <NavLink
              href="/food-journey"
           
              onClick={handleNavLinkClick}
              pathname={pathname} // Pass pathname for active link styling
            >
              Share Your Food Journey
            </NavLink>
            {/* Profile Section */}
            {isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {" "}
                {/* Refined border and spacing */}
                <div className="flex items-center gap-3 px-4">
                  {" "}
                  {/* Adjusted padding */}
                  {userImage ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/40 flex-shrink-0">
                      {" "}
                      {/* Larger image, better border */}
                      <Image
                        src={userImage}
                        alt={userName || "User"}
                        width={48} // Adjusted width/height for larger display
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {" "}
                      {/* Larger fallback icon */}
                      <CircleUser className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-lg font-semibold text-gray-800 truncate">
                    {userName || "User"}
                  </p>{" "}
                  {/* Truncate long names */}
                </div>
                <div className="space-y-1">
                  {" "}
                  {/* Tighter spacing for profile links */}
                  <ProfileMenuItem
                    href="/dashboard"
                    icon={<User />}
                    label="My Dashboard"
                    onClick={handleNavLinkClick}
                    pathname={pathname} // Pass pathname for active link styling
                  />
                  <ProfileMenuItem
                    href="/dashboard/profile"
                    icon={<Settings />}
                    label="Update Profile"
                    onClick={handleNavLinkClick}
                    pathname={pathname} // Pass pathname for active link styling
                  />
                  <ProfileMenuItem
                    icon={<LogOut />}
                    label="Sign Out"
                    onClick={onSignOut}
                    isDanger
                    pathname={pathname} // Pass pathname for active link styling
                  />
                </div>
              </div>
            )}
            {/* Guest Auth */}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {" "}
                {/* Refined border and spacing */}
                <NavLink
                  href="/auth/signin"
                  className="w-full text-center"
                  onClick={handleNavLinkClick}
                  pathname={pathname}
                >
                  Sign In
                </NavLink>
                <NavLink
                  href="/auth/signup"
                  className="w-full text-center bg-primary text-white hover:bg-primary/90"
                  onClick={handleNavLinkClick}
                  pathname={pathname}
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
