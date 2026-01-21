"use client";

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

// Hero Section
function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-fade-in-up">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-zinc-400">Status: CLASSIFIED</span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Circle agents{" "}
          <span className="text-gradient">CIA</span>
        </h1>

        <p
          className="text-xl md:text-2xl text-zinc-400 mb-8 animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          Circle gerakan bawah tanah, sunyi tapi tahu berita terbaru
        </p>

        <div
          className="glass inline-block px-6 py-3 rounded-lg mb-12 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <p className="text-green-400 font-mono text-sm md:text-base">
            ⚠️ Tidak semua orang boleh bergabung dengan CIA
          </p>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
          style={{ animationDelay: "0.8s" }}
        >
          <a href="#contact" className="btn-primary">
            Ajukan Akses
          </a>
          <a href="#about" className="btn-secondary">
            Pelajari Lebih
          </a>
        </div>
      </div>
    </section>
  );
}

// About Section
function AboutSection() {
  const stats = [
    { value: "???", label: "Agents Aktif" },
    { value: "24/7", label: "Operasi Berjalan" },
    { value: "∞", label: "Intel Terkumpul" },
  ];

  const features = [
    {
      icon: "🕵️",
      title: "Intel Network",
      description: "Jaringan informasi terluas di kampus. Tahu sebelum yang lain tahu.",
    },
    {
      icon: "🔐",
      title: "Secure Comms",
      description: "Komunikasi terenkripsi. Yang dibicarakan di Circle, stays di Circle.",
    },
    {
      icon: "🎯",
      title: "Precision Ops",
      description: "Setiap aksi terencana. Setiap langkah terukur. Zero mistakes.",
    },
  ];

  return (
    <section id="about" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="section-title">
            Tentang <span className="text-gradient">Circle CIA</span>
          </h2>
          <p className="section-subtitle">
            Kami bukan komunitas biasa. Kami adalah jaringan mahasiswa terpilih yang beroperasi dalam
            kesunyian, namun selalu terdepan dalam informasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, i) => (
            <div key={i} className="card text-center glass-hover">
              <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
              <div className="text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="card glass-hover"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Events Section
function EventsSection() {
  const events = [
    {
      date: "XX JAN",
      title: "Operation: Midnight Briefing",
      description: "Briefing rahasia untuk semua agents. Lokasi akan dikirim via secure channel.",
      status: "CLASSIFIED",
    },
    {
      date: "XX FEB",
      title: "Intel Gathering Workshop",
      description: "Workshop teknik pengumpulan informasi dan analisis data kampus.",
      status: "OPEN",
    },
    {
      date: "XX MAR",
      title: "Annual Summit: Shadow Convention",
      description: "Pertemuan tahunan seluruh agents dari berbagai fakultas.",
      status: "INVITE ONLY",
    },
  ];

  return (
    <section id="events" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title">
            Upcoming <span className="text-gradient">Operations</span>
          </h2>
          <p className="section-subtitle">
            Jadwal operasi dan kegiatan Circle. Beberapa bersifat terbuka, sisanya... well, you know.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div key={i} className="card glass-hover group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-green-400 font-mono text-sm">{event.date}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${event.status === "CLASSIFIED"
                      ? "bg-red-500/20 text-red-400"
                      : event.status === "INVITE ONLY"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                >
                  {event.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-green-400 transition-colors">
                {event.title}
              </h3>
              <p className="text-zinc-400 text-sm">{event.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="#" className="btn-secondary">
            Lihat Semua Operations →
          </a>
        </div>
      </div>
    </section>
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
