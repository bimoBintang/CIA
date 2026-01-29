"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Radio,
  Landmark,
  Search,
  Moon,
  Laptop,
  type LucideIcon,
} from "lucide-react";

interface Event {
  date: string;
  title: string;
  description: string;
  status: "CLASSIFIED" | "OPEN" | "INVITE ONLY";
  Icon: LucideIcon;
}

const events: Event[] = [
  {
    date: "XX JAN",
    title: "Operation: Midnight Briefing",
    description: "Briefing rahasia untuk semua agents. Lokasi akan dikirim via secure channel.",
    status: "CLASSIFIED",
    Icon: Target,
  },
  {
    date: "XX FEB",
    title: "Intel Gathering Workshop",
    description: "Workshop teknik pengumpulan informasi dan analisis data kampus.",
    status: "OPEN",
    Icon: Radio,
  },
  {
    date: "XX MAR",
    title: "Annual Summit: Shadow Convention",
    description: "Pertemuan tahunan seluruh agents dari berbagai fakultas.",
    status: "INVITE ONLY",
    Icon: Landmark,
  },
  {
    date: "XX APR",
    title: "Recruitment Drive",
    description: "Pencarian talenta baru untuk bergabung dengan Circle.",
    status: "OPEN",
    Icon: Search,
  },
  {
    date: "XX MAY",
    title: "Covert Networking Night",
    description: "Malam networking eksklusif dengan alumni dan profesional.",
    status: "INVITE ONLY",
    Icon: Moon,
  },
  {
    date: "XX JUN",
    title: "Tech Infiltration Training",
    description: "Pelatihan keamanan siber dan teknologi modern.",
    status: "CLASSIFIED",
    Icon: Laptop,
  },
];

function HoverCard({ event, index }: { event: Event; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { Icon } = event;

  const statusColors = {
    CLASSIFIED: "bg-red-500/20 text-red-400 border-red-500/30",
    OPEN: "bg-green-500/20 text-green-400 border-green-500/30",
    "INVITE ONLY": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Glow Effect on Hover */}
      <motion.div
        className="absolute -inset-1 bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{ scale: isHovered ? 1.02 : 1 }}
      />

      {/* Card */}
      <motion.div
        className="relative h-full p-4 sm:p-6 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden cursor-pointer"
        animate={{
          borderColor: isHovered ? "rgb(34, 197, 94)" : "rgb(39, 39, 42)",
          y: isHovered ? -4 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Pattern */}
        <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
          <Icon className="w-20 h-20 sm:w-24 sm:h-24" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <motion.span
            className="text-green-400 font-mono text-xs sm:text-sm font-bold"
            animate={{ scale: isHovered ? 1.05 : 1 }}
          >
            {event.date}
          </motion.span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full border ${statusColors[event.status]}`}>
            {event.status}
          </span>
        </div>

        {/* Icon Container */}
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3 sm:mb-4"
          animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
        </motion.div>

        {/* Title */}
        <motion.h3
          className="text-base sm:text-lg font-bold mb-2 text-white group-hover:text-green-400 transition-colors line-clamp-2"
          animate={{ x: isHovered ? 4 : 0 }}
        >
          {event.title}
        </motion.h3>

        {/* Description */}
        <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed">
          {event.description}
        </p>

        {/* Hover Indicator */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-green-500 to-emerald-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}

export function EventsSection() {
  return (
    <section id="events" className="py-16 sm:py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-green-900/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">
            Upcoming <span className="text-gradient">Operations</span>
          </h2>
          <p className="section-subtitle text-sm sm:text-base mt-2 sm:mt-4 max-w-2xl mx-auto">
            Jadwal operasi dan kegiatan Circle. Beberapa bersifat terbuka, sisanya... well, you know.
          </p>
        </div>

        {/* Grid: 2 columns mobile, 3 columns tablet/desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {events.map((event, i) => (
            <HoverCard key={i} event={event} index={i} />
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <a href="#" className="btn-secondary text-sm sm:text-base">
            Lihat Semua Operations →
          </a>
        </div>
      </div>
    </section>
  );
}