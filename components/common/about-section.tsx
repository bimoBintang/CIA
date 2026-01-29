"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Users,
  Clock,
  Database,
  Search,
  Lock,
  Target,
  Globe,
  Radio,
  Shield,
  type LucideIcon,
} from "lucide-react";

interface Stat {
  value: string;
  label: string;
  Icon: LucideIcon;
}

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
}

const stats: Stat[] = [
  { value: "???", label: "Agents Aktif", Icon: Users },
  { value: "24/7", label: "Operasi Berjalan", Icon: Clock },
  { value: "∞", label: "Intel Terkumpul", Icon: Database },
];

const features: Feature[] = [
  {
    Icon: Search,
    title: "Intel Network",
    description: "Jaringan informasi terluas di kampus. Tahu sebelum yang lain tahu.",
  },
  {
    Icon: Lock,
    title: "Secure Comms",
    description: "Komunikasi terenkripsi. Yang dibicarakan di Circle, stays di Circle.",
  },
  {
    Icon: Target,
    title: "Precision Ops",
    description: "Setiap aksi terencana. Setiap langkah terukur. Zero mistakes.",
  },
  {
    Icon: Globe,
    title: "Global Network",
    description: "Koneksi lintas fakultas dan universitas. Jangkauan tak terbatas.",
  },
  {
    Icon: Radio,
    title: "Intel Analytics",
    description: "Analisis data real-time untuk keputusan yang tepat dan cepat.",
  },
  {
    Icon: Shield,
    title: "Full Protection",
    description: "Identitas anggota terjaga. Privacy adalah prioritas utama.",
  },
];

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const { Icon } = stat;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative group"
    >
      {/* Glow */}
      <motion.div
        className="absolute -inset-1 bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      <div className="relative p-4 sm:p-6 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm text-center hover:border-green-500/50 transition-colors">
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-2"
          whileHover={{ scale: 1.2 }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
        </motion.div>
        <motion.div
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1 sm:mb-2"
          whileHover={{ scale: 1.1 }}
        >
          {stat.value}
        </motion.div>
        <div className="text-xs sm:text-sm text-zinc-400">{stat.label}</div>
      </div>
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { Icon } = feature;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute -inset-1 bg-linear-to-r from-green-500/15 to-emerald-500/15 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      <motion.div
        className="relative h-full p-4 sm:p-5 md:p-6 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
        animate={{
          borderColor: isHovered ? "rgb(34, 197, 94)" : "rgb(39, 39, 42)",
          y: isHovered ? -6 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Icon */}
        <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
          <Icon className="w-20 h-20 sm:w-24 sm:h-24" />
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
          className="text-base sm:text-lg md:text-xl font-bold mb-2 text-white group-hover:text-green-400 transition-colors"
          animate={{ x: isHovered ? 4 : 0 }}
        >
          {feature.title}
        </motion.h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          {feature.description}
        </p>

        {/* Bottom Indicator */}
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

export function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-green-900/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">
            Tentang <span className="text-gradient">Circle CIA</span>
          </h2>
          <p className="section-subtitle text-sm sm:text-base mt-2 sm:mt-4 max-w-2xl mx-auto">
            Kami bukan komunitas biasa. Kami adalah jaringan mahasiswa terpilih yang beroperasi dalam
            kesunyian, namun selalu terdepan dalam informasi.
          </p>
        </motion.div>

        {/* Stats - 3 columns always */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>

        {/* Features - 2 columns mobile, 3 columns desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}