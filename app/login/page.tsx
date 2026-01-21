"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/dashboard";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.push(redirectUrl);
            } else {
                setError(data.error || "Login gagal");
            }
        } catch {
            setError("Terjadi kesalahan. Coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-green-900/20 via-background to-background"></div>
                {/* Grid lines */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, #22c55e 1px, transparent 1px),
              linear-gradient(to bottom, #22c55e 1px, transparent 1px)
            `,
                        backgroundSize: '50px 50px',
                    }}
                ></div>
                {/* Scanning line */}
                <div
                    className="absolute inset-x-0 h-px bg-linear-to-r from-transparent via-green-500 to-transparent opacity-50"
                    style={{ animation: 'scan 4s linear infinite' }}
                ></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 mb-4 animate-pulse-glow">
                        <span className="text-black font-bold text-3xl">C</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">Circle CIA</h1>
                    <p className="text-zinc-500 mt-2 font-mono text-sm">🔐 SECURE ACCESS PORTAL</p>
                </div>

                {/* Login Form */}
                <div className="glass border border-green-500/20 rounded-2xl p-8">
                    <div className="flex items-center gap-2 mb-6 text-green-400 font-mono text-sm">
                        <span className="animate-pulse">●</span>
                        <span>AUTHENTICATION REQUIRED</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2 font-mono">[EMAIL]</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/70 border border-zinc-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all font-mono"
                                placeholder="agent@circle-cia.id"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-zinc-400 text-sm mb-2 font-mono">[PASSWORD]</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/70 border border-zinc-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all font-mono"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
                                ⚠ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-lg bg-linear-to-r from-green-500 to-emerald-600 text-black font-bold text-lg hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    AUTHENTICATING...
                                </span>
                            ) : (
                                "🔓 ACCESS SYSTEM"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-zinc-500 text-sm">
                            Tidak punya akses?{" "}
                            <Link href="/" className="text-green-400 hover:text-green-300 transition-colors">
                                Ajukan keanggotaan
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security notice */}
                <div className="mt-6 text-center">
                    <p className="text-zinc-600 text-xs font-mono">
                        🔒 ENCRYPTED CONNECTION • ALL ACCESS LOGGED
                    </p>
                </div>
            </div>

            {/* CSS for scan animation */}
            <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
        </div>
    );
}

// Loading fallback
function LoginLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-500 font-mono">Loading...</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}
