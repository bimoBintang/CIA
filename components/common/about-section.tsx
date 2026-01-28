"use client"

export function AboutSection() {
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

        <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-16">
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