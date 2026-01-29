"use client"
export function HeroSection() {
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
          <a href="/login" className="px-8 py-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-white font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2">
            Login Dashboard
          </a>
        </div>
      </div>
    </section>
  );
}