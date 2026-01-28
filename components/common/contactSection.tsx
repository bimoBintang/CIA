"use client";

export function ContactSection() {
  return (
    <section id="contact" className="py-32 relative">
      <div className="absolute inset-0 bg-linear-gradient-to-t from-green-900/10 to-transparent" />
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