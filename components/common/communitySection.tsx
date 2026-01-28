"use client";


export function CommunitySection() {
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
                <div className="w-10 h-10 rounded-full bg-linear-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
};
