"use client";
import { top_events_view } from "@prisma/client";
import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface EventCardProps {
  event: top_events_view;
}

const formatDate = (date: Date | null) => {
  if (!date) return null;
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function EventCard({ event }: EventCardProps) {
  const title = event.TITLE || "Untitled Event";
  const location = event.ADDRESS || "Wallisellen (Zürich)";
  const href = event.HREF || "#";
  const isPlaceholder = event.TOP_EVENTS_ID < 0;

  const dateTimePairs = [
    { date: event.DATE_1, from: event.TIME_1_FROM, to: event.TIME_1_TO },
    { date: event.DATE_2, from: event.TIME_2_FROM, to: event.TIME_2_TO },
    { date: event.DATE_3, from: event.TIME_3_FROM, to: event.TIME_3_TO },
    { date: event.DATE_4, from: event.TIME_4_FROM, to: event.TIME_4_TO },
    { date: event.DATE_5, from: event.TIME_5_FROM, to: event.TIME_5_TO },
  ];

  const validDates = dateTimePairs.filter((d) => d.date !== null);

  // Google Calendar link generator
  const getGoogleCalendarUrl = () => {
    if (!validDates[0] || !validDates[0].date) return "#";
    const start = validDates[0].date;
    const end = validDates[0].date;
    const startTime = validDates[0].from || "00:00";
    const endTime = validDates[0].to || "23:59";
    const formatDate = (date: Date, time: string) => {
      const d = new Date(date);
      const [h, m] = time.split(":");
      d.setHours(Number(h), Number(m));
      return (
        d
          .toISOString()
          .replace(/[-:]|\.\d{3}/g, "")
          .slice(0, 15) + "Z"
      );
    };
    const details = encodeURIComponent(title);
    const locationStr = encodeURIComponent(location);
    const dates = `${formatDate(start, startTime)}/${formatDate(end, endTime)}`;
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${details}&dates=${dates}&location=${locationStr}`;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
      transition={{ duration: 0.5, type: "spring" }}
      viewport={{ once: true }}
      className="flex flex-col md:flex-row items-start p-4 md:p-6 rounded-lg border border-accent border-dashed bg-white shadow-sm group focus-within:ring-2 focus-within:ring-primary relative h-full"
      tabIndex={0}
      aria-label={`Event: ${title}`}
    >
      {/* Date Box */}
      <div className="hidden md:flex flex-shrink-0 text-center mr-6 mb-4 md:mb-0 relative">
        <div className="bg-gray-100 border-2 rounded-lg w-20 h-20 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {!isPlaceholder && validDates[0]
              ? validDates[0].date?.getDate().toString().padStart(2, "0")
              : "00"}
          </span>
          <span className="text-sm text-primary">
            {!isPlaceholder && validDates[0]
              ? validDates[0].date?.toLocaleString("default", {
                  month: "short",
                })
              : "N/A"}
          </span>
        </div>
        {isPlaceholder && (
          <span className="absolute  top-0 left-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded shadow">
            Coming Soon
          </span>
        )}
      </div>

      {/* Event Info */}
      <div className="flex-1">
        {/* Title */}
        <h3 className="text-2xl font-bold text-secondary mb-2">
          {href !== "#" && !isPlaceholder ? (
            <Link
              href={href}
              aria-label={`View details for ${title}`}
              className="hover:underline focus:underline"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>

        {/* Location */}
        <div className="flex items-center text-text-main font-semibold text-sm mb-2">
          <MapPin size={16} className="mr-2" />
          <span>{location}</span>
        </div>

        {/* All Valid Date-Time Entries */}
        <div className="text-sm space-y-1 text-text-main mb-4">
          {validDates.map((d, index) => (
            <div key={index} className="flex items-center gap-2">
              <Calendar size={14} />
              <span>{formatDate(d.date)}</span>

              {/* Only show time if either from or to is available */}
              {(d.from || d.to) && (
                <>
                  <Clock size={14} className="ml-2" />
                  <span>
                    {d.from}
                    {d.from && d.to ? ` - ${d.to}` : d.to ? d.to : ""}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-1 md:gap-6">
          {!isPlaceholder && href !== "#" && (
            <Link
              href={href}
              target="_blank"
              className="bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`View details for ${title}`}
            >
              View Details
            </Link>
          )}
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-secondary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
            aria-label={`Add ${title} to Google Calendar`}
          >
            Add to calendar
            <Calendar size={16} className="ml-2" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
