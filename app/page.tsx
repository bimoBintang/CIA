"use client";

import { AboutSection } from "@/components/common/about-section";
import { EventsSection } from "@/components/common/event-section";
import { HeroSection } from "@/components/common/hero-section";
import { useEffect, useState } from "react";

// Matrix Rain Component
function MatrixRain() {
  const [columns, setColumns] = useState<{ left: number; delay: number; duration: number; chars: string }[]>([]);

  useEffect(() => {
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノCIA";
    const cols = [];
    for (let i = 0; i < 30; i++) {
      const charStr = Array(20)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("\n");
      cols.push({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 10,
        chars: charStr,
      });
    }
    setColumns(cols);
  }, []);

  return (
    <div className="matrix-bg">
      {columns.map((col, i) => (
        <div
          key={i}
          className="matrix-column"
          style={{
            left: `${col.left}%`,
            animationDelay: `${col.delay}s`,
            animationDuration: `${col.duration}s`,
          }}
        >
          {col.chars}
        </div>
      ))}
      <div className="scan-line" />
    </div>
  );
}

// Navigation Component
function Navigation() {
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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse-glow">
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

// Community Section
function CommunitySection() {
  const testimonials = [
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
  ];

  return (
    <section id="community" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="section-title">
            The <span className="text-gradient">Brotherhood</span>
          </h2>
          <p className="section-subtitle">
            Kata mereka yang sudah menjadi bagian dari Circle. Identitas asli tentu saja... classified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div key={i} className="card glass-hover">
              <div className="text-5xl text-green-500/20 mb-4">&ldquo;</div>
              <p className="text-zinc-300 mb-6 italic">{item.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {item.author.split(" ")[1][0]}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{item.author}</div>
                  <div className="text-sm text-zinc-500">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact/CTA Section
function ContactSection() {
  return (
    <section id="contact" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent" />
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="card p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the <span className="text-gradient">Circle</span>?
          </h2>
          <p className="text-zinc-400 mb-8">
            Pengajuan keanggotaan melalui proses seleksi ketat. Tidak semua yang apply akan diterima.
            Isi form di bawah dan tunggu kontak dari kami.
          </p>

          <form className="space-y-4 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Nama Lengkap (akan dirahasiakan)"
              className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
            />
            <input
              type="email"
              placeholder="Email Kampus"
              className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
            />
            <input
              type="text"
              placeholder="Fakultas / Jurusan"
              className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
            />
            <textarea
              placeholder="Mengapa kamu ingin bergabung dengan CIA?"
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all resize-none"
            />
            <button type="submit" className="btn-primary w-full">
              Ajukan Permohonan
            </button>
          </form>

          <p className="text-xs text-zinc-600 mt-6">
            Dengan mengajukan permohonan, kamu menyetujui untuk menjaga kerahasiaan Circle.
          </p>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-12 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="font-bold">Circle CIA</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-green-400 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-green-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-green-400 transition-colors">
              Secure Contact
            </a>
          </div>

          <div className="text-sm text-zinc-600">
            © 2026 CIA. All rights reserved. 🔒
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-zinc-700 font-mono">
          [ THIS PAGE IS MONITORED ]
        </div>
      </div>
    </footer>
  );
}

// Main Page
export default function Home() {
  return (
    <>
      <MatrixRain />
      <Navigation />
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <EventsSection />
        <CommunitySection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
