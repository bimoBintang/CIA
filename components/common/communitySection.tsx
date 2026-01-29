"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Bergabung dengan CIA mengubah perspektif saya tentang networking. Kita bukan sekadar komunitas, kita keluarga.",
    author: "Agent Alpha",
    role: "Fakultas Teknik",
  },
  {
    quote: "Intel yang dibagikan di sini tidak bisa ditemukan di tempat lain. Literally insider information.",
    author: "Agent Omega",
    role: "Fakultas Ekonomi",
  },
  {
    quote: "The brotherhood is real. Once you're in, you're protected.",
    author: "Agent Delta",
    role: "Fakultas Hukum",
  },
  {
    quote: "Koneksi yang didapat di sini membuka pintu yang tidak pernah saya bayangkan sebelumnya.",
    author: "Agent Sigma",
    role: "Fakultas Kedokteran",
  },
  {
    quote: "Bukan hanya tentang apa yang kamu tahu, tapi siapa yang kamu kenal. CIA mengajarkan ini.",
    author: "Agent Zeta",
    role: "Fakultas Psikologi",
  },
];

export function CommunitySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextTestimonial]);

  const currentTestimonial = testimonials[activeIndex];

  return (
    <section id="community" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">
            The <span className="text-gradient">Brotherhood</span>
          </h2>
          <p className="section-subtitle text-sm sm:text-base mt-2 sm:mt-4">
            Kata mereka yang sudah menjadi bagian dari Circle. Identitas asli tentu saja... classified.
          </p>
        </div>

        {/* Animated Testimonials Container */}
        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
        >
          {/* Main Content */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Avatar Side */}
            <div className="relative shrink-0">
              {/* Decorative rings */}
              <div className="absolute inset-0 -m-4 rounded-full border-2 border-green-500/20 animate-pulse" />
              <div className="absolute inset-0 -m-8 rounded-full border border-green-500/10" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                >
                  <span className="text-black font-bold text-3xl sm:text-4xl md:text-5xl">
                    {currentTestimonial.author.split(" ")[1]?.[0] || "?"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Quote Side */}
            <div className="flex-1 text-center md:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Quote Icon */}
                  <div className="text-5xl sm:text-6xl text-green-500/30 mb-2 md:mb-4 leading-none">&ldquo;</div>

                  {/* Quote Text */}
                  <p className="text-lg sm:text-xl md:text-2xl text-zinc-200 italic leading-relaxed mb-4 md:mb-6">
                    {currentTestimonial.quote}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <div className="w-1 h-8 bg-green-500 rounded-full hidden md:block" />
                    <div>
                      <div className="font-bold text-lg text-white">{currentTestimonial.author}</div>
                      <div className="text-sm text-zinc-400">{currentTestimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8 md:mt-12">
            {/* Prev Button */}
            <button
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full border border-zinc-700 hover:border-green-500 flex items-center justify-center text-zinc-400 hover:text-green-400 transition-all hover:scale-110"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`transition-all duration-300 rounded-full ${index === activeIndex
                      ? "w-8 h-2 bg-green-500"
                      : "w-2 h-2 bg-zinc-600 hover:bg-zinc-500"
                    }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full border border-zinc-700 hover:border-green-500 flex items-center justify-center text-zinc-400 hover:text-green-400 transition-all hover:scale-110"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                key={activeIndex}
                className="h-full bg-green-500"
                initial={{ width: "0%" }}
                animate={{ width: isPaused ? undefined : "100%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
