"use client";

import Link from "next/link";


export function PortalHeader() {
    return (
        <header className="glass border-b border-zinc-800/50">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-black font-bold text-lg">C</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Circle CIA</h1>
                        <p className="text-xs text-zinc-500">Agent Profile</p>
                    </div>
                </Link>
                <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    ← Back
                </Link>
            </div>
        </header>
    );
}