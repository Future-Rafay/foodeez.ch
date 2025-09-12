"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Settings,
  CircleUser,
  UserPlus,
  Users,
  Heart,
  Star,
  Bookmark,
  LinkIcon,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { data: session } = useSession();

  // Orders have been moved to /dashboard/orders

  // Quick actions
  const quickActions = [
    {
      title: "Update Profile",
      description: "Keep your information current",
      icon: Settings,
      href: "/dashboard/profile",
    },
    {
      title: "My Orders",
      description: "View your order history",
      icon: Package,
      href: "/dashboard/orders",
      isComingSoon: true,
    },
    {
      title: "Favorites",
      description: "Your favorite restaurants",
      icon: Heart,
      href: "/dashboard/favorites",
      isComingSoon: true,
    },
    {
      title: "Following",
      description: "Restaurants & users you follow",
      icon: UserPlus,
      href: "/dashboard/following",
      isComingSoon: true,
    },
  ];

  // Placeholder stats - now showing '0' as they are coming soon
  const stats = [
    { label: "Followers", value: 0, icon: Users },
    { label: "Following", value: 0, icon: UserPlus },
    { label: "Favorites", value: 0, icon: Heart },
  ];

  return (
    <div className="mx-auto px-4 py-8 space-y-10">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-primary p-8 rounded-3xl shadow-xl text-white flex flex-col md:flex-row items-center gap-8"
      >
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-4">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "Profile"}
              fill
              className="object-cover"
              unoptimized={session.user.image.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <CircleUser className="text-gray-400 w-16 h-16" />
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            {session?.user?.name || "Guest"}
          </h1>
          <p className="text-lg text-primary-100/90 mb-2">
            {session?.user?.email || "No email"}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white text-sm font-semibold shadow"
              >
                <stat.icon className="w-5 h-5 text-white/80" />
                <span>{stat.value}</span>{" "}
                {/* Value will be 0 as it's coming soon */}
                <span className="ml-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-lg p-8"
      >
        <h2 className="sub-heading">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link href={action.isComingSoon ? "#" : action.href}>
                <div
                  className={`group bg-primary/5 hover:bg-primary/10 transition-colors p-6 rounded-2xl border border-primary/10 shadow-sm cursor-pointer h-full flex flex-col items-center text-center relative
                  ${action.isComingSoon ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                >
                  {action.isComingSoon && (
                    <span className="absolute top-3 right-3 bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                  <action.icon
                    className={`h-10 w-10 text-primary mb-4 ${
                      !action.isComingSoon
                        ? "group-hover:text-accent"
                        : "text-gray-400"
                    } transition-colors`}
                  />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {action.description}
                  </p>
                
                <LinkIcon
                  className={`w-5 h-5 ${
                    !action.isComingSoon
                      ? "text-primary/60 group-hover:text-primary"
                      : "text-gray-400"
                  } mt-auto`}
                  />
                 
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Future Widgets Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Review Widget Placeholder - Still active */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
          <Star className="w-10 h-10 text-primary mb-2" />
          <h3 className="text-xl font-bold mb-1">Your Reviews</h3>
          <p className="text-gray-500">Coming soon: See your past reviews!</p>
        </div>
        {/* Saved Collections Widget Placeholder - Still active */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
          <Bookmark className="w-10 h-10 text-primary mb-2" />
          <h3 className="text-xl font-bold mb-1">Saved Collections</h3>
          <p className="text-gray-500">Coming soon: Organize your favorite places!</p>
        </div>
      </motion.div>
    </div>
  );
}