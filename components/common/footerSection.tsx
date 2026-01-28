"use client";

export function Footer() {
  return (
    <footer className="py-12 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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