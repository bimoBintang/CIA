"use client"

export function EventsSection() {
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