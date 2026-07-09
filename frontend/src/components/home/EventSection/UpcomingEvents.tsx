"use client";

import { useState, useEffect } from "react";
import { getUpcomingEvents } from "@/services/HomePageService";
import type { top_events_view } from "@/lib/prisma";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import EventCard from "./EventCard";

export default function UpcomingEvents() {
  const [events, setEvents] = useState<top_events_view[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const upcomingEvents = await getUpcomingEvents();

        const placeholders = Array(Math.max(0, 4 - upcomingEvents.length))
          .fill(null)
          .map((_, index) => ({
            TOP_EVENTS_ID: -1 - index,
            TITLE: "Coming Soon",
            ADDRESS: "Foodeez.ch, 8154 Oberglatt, Switzerland",
            DATE_1: new Date(
              new Date().setMonth(new Date().getMonth() + 1 + index)
            ),
            TIME_1_FROM: "00:00",
            TIME_1_TO: null,
            DATE_2: null,
            TIME_2_FROM: null,
            TIME_2_TO: null,
            DATE_3: null,
            TIME_3_FROM: null,
            TIME_3_TO: null,
            DATE_4: null,
            TIME_4_FROM: null,
            TIME_4_TO: null,
            DATE_5: null,
            TIME_5_FROM: null,
            TIME_5_TO: null,
            HREF: "#",
          }));

        setEvents([...upcomingEvents, ...placeholders]);
      } catch (error) {
        console.error("Failed to fetch events", error);
        const placeholders = Array(4)
          .fill(null)
          .map((_, index) => ({
            TOP_EVENTS_ID: -1 - index,
            TITLE: "Coming Soon",
            ADDRESS: "Foodeez.ch, 8154 Oberglatt, Switzerland",
            DATE_1: new Date(
              new Date().setMonth(new Date().getMonth() + 1 + index)
            ),
            TIME_1_FROM: "00:00",
            TIME_1_TO: null,
            DATE_2: null,
            TIME_2_FROM: null,
            TIME_2_TO: null,
            DATE_3: null,
            TIME_3_FROM: null,
            TIME_3_TO: null,
            DATE_4: null,
            TIME_4_FROM: null,
            TIME_4_TO: null,
            DATE_5: null,
            TIME_5_FROM: null,
            TIME_5_TO: null,
            HREF: "#",
          }));
        setEvents(placeholders);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <section
        className="py-16 px-4 lg:px-0"
        aria-label="Upcoming Events Loading"
      >
        <h2 className="main-heading text-center mb-10 flex items-center justify-center gap-2">
          <Sparkles className="text-secondary animate-bounce" size={28} />
          Amazing Events Await
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-6 bg-gray-200 p-6 rounded-xl animate-pulse"
                aria-label="Event loading placeholder"
              >
                <div className="h-24 w-24 bg-gray-400 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-300 rounded w-3/4" />
                  <div className="h-4 bg-gray-300 rounded w-full" />
                  <div className="h-4 bg-gray-300 rounded w-5/6" />
                </div>
              </div>
            ))}
        </div>
      </section>
    );
  }

  if (!events.length) return null;

  return (
    <section
      className="py-16 bg-background text-primary px-4 lg:px-0"
      aria-label="Upcoming Events"
    >
      <div className="container mx-auto">
        <h2 className="main-heading text-center flex items-center justify-center gap-2 mb-10">
          {/* <Sparkles className="text-secondary animate-bounce" size={28} /> */}
          Events
        </h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {events.map((event) => (
            <motion.div
              key={event.TOP_EVENTS_ID}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
