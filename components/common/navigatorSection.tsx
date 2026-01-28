"use client";

import { useEffect, useState } from "react";


export function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-linear-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse-glow">
            <span className="text-black font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-gradient">Circle CIA</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-zinc-400 hover:text-green-400 transition-colors">
            Tentang
          </a>
          <a href="#events" className="text-zinc-400 hover:text-green-400 transition-colors">
            Events
          </a>
          <a href="#news" className="text-zinc-400 hover:text-green-400 transition-colors">
            Berita
          </a>
          <a href="#community" className="text-zinc-400 hover:text-green-400 transition-colors">
            Komunitas
          </a>
          <a href="#contact" className="btn-primary text-sm">
            Akses Terbatas
          </a>
        </div>
      </div>
    </nav>
  );
}