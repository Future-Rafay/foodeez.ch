"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import CartIcon from "../cart/CartIcon";
import CustomerNotifications from "./CustomerNotifications";

const DropdownMenu = dynamic(() => import("../core/DropDownMenu"), { ssr: false });
const ProfileDropdown = dynamic(() => import("./ProfileDropdown"), { ssr: false });
const MobileMenu = dynamic(() => import("../ui/MobileMenu"), { ssr: false });

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Loading skeleton for auth section
  const AuthSkeleton = () => (
    <div className="flex items-center space-x-4">
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Nav links
  const navLinks = [
    { label: "Share your Food Journey", href: "/food-journey" },
  ];

  return (
    <nav
      className={`z-50 sticky top-0 transition-all duration-300 bg-white/80 backdrop-blur-lg border-b border-gray-100 ${isScrolled ? "shadow-lg" : ""}`}
      aria-label="Main navigation"

      // className={`z-50 h-auto sticky top-0 transition-all duration-300 bg-background
      //   ${isScrolled ? "shadow-md" : ""}`}
    >
      <div className="flex items-center justify-between px-2 sm:px-4">
        {/* Logo */}
        <Link href="/" aria-label="Foodeez home" className="shrink-0">
          <Image
            src="/Logo/LogoFoodeezMain.svg"
            alt="Foodeez Logo"
            height={144}
            width={144}
            className="h-28 w-28 md:p-0 lg:h-36 lg:w-36"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-2">
          <DropdownMenu
            label="Be Foodeez Partner"
            items={[
              { label: "Register Your Business", href: "/business/register" },
              { label: "Pricing Plans", href: "/pricing" },
              { label: "Contact", href: "/contact" },
            ]}
          />
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-lg font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
                pathname === link.href
                  ? "text-primary bg-primary/10 shadow"
                  : "text-gray-700 hover:text-primary hover:bg-primary/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <CustomerNotifications userEmail={session?.user?.email} />
          <CartIcon />
          <div className="ml-6">
            {status === "loading" ? (
              <AuthSkeleton />
            ) : status === "authenticated" ? (
              <ProfileDropdown session={session} />
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-base font-semibold text-primary hover:text-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-3 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-base font-semibold bg-primary text-white px-5 py-2 rounded-full shadow hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center">
          <CustomerNotifications userEmail={session?.user?.email} />
          <CartIcon />
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-text-muted hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide Menu */}
      {isMenuOpen && (
        <MobileMenu
          isMenuOpen={isMenuOpen}
          isAuthenticated={status === "authenticated"}
          userName={session?.user?.name}
          userImage={session?.user?.image || ""}
          onSignOut={handleSignOut}
          pathname={pathname}
        />
      )}
    </nav>
  );
};

export default Navbar;
