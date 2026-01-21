"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Intel {
    id: string;
    title: string;
    content: string | null;
    priority: string;
    createdAt: string;
    source?: { codename: string };
}

interface Message {
    id: string;
    content: string;
    read: boolean;
    createdAt: string;
    fromAgent?: { codename: string };
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function ViewerPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [intel, setIntel] = useState<Intel[]>([]);
    const [activeTab, setActiveTab] = useState("intel");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch user info
                const userRes = await fetch("/api/auth/me");
                const userData = await userRes.json();
                if (userData.success) {
                    setUser(userData.data);
                    // Redirect if not VIEWER
                    if (userData.data.role !== "VIEWER") {
                        router.push("/dashboard");
                        return;
                    }
                }

                // Fetch intel
                const intelRes = await fetch("/api/intel");
                const intelData = await intelRes.json();
                if (intelData.success) setIntel(intelData.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-500 font-mono">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="glass border-b border-zinc-800/50 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <span className="text-black font-bold text-lg">C</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Circle CIA</h1>
                            <p className="text-xs text-zinc-500">Viewer Access</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">👁️ {user?.name}</span>
                        <span className="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-300">VIEWER</span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex gap-2 mb-6">
                    {[
                        { id: "intel", label: "📡 Intel Feed", icon: "📡" },
                        { id: "about", label: "ℹ️ About", icon: "ℹ️" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "text-zinc-400 hover:bg-zinc-800/50"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === "intel" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Intel Feed</h2>
                            <p className="text-sm text-zinc-500">{intel.length} reports</p>
                        </div>

                        {intel.length === 0 ? (
                            <div className="card text-center py-12">
                                <p className="text-zinc-500">No intel available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {intel.map((item) => (
                                    <div key={item.id} className="card hover:border-green-500/30 transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${item.priority === "high"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : item.priority === "medium"
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : "bg-green-500/20 text-green-400"
                                                    }`}
                                            >
                                                {item.priority.toUpperCase()}
                                            </span>
                                        </div>
                                        {item.content && (
                                            <p className="text-sm text-zinc-400 mb-2">{item.content}</p>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-zinc-500">
                                            <span>By: {item.source?.codename || "Anonymous"}</span>
                                            <span>{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "about" && (
                    <div className="card max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">About Viewer Access</h2>
                        <div className="space-y-4 text-zinc-400">
                            <p>
                                Sebagai <strong className="text-zinc-200">Viewer</strong>, Anda memiliki akses
                                read-only untuk melihat intel feed dari Circle CIA.
                            </p>
                            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                <h3 className="font-semibold text-zinc-200 mb-2">Viewer Permissions:</h3>
                                <ul className="space-y-1 text-sm">
                                    <li>✅ View public intel</li>
                                    <li>❌ Submit intel</li>
                                    <li>❌ Send messages</li>
                                    <li>❌ Access dashboard</li>
                                </ul>
                            </div>
                            <p className="text-sm">
                                Ingin bergabung sebagai Agent?{" "}
                                <Link href="/" className="text-green-400 hover:text-green-300">
                                    Ajukan keanggotaan
                                </Link>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-xs text-zinc-600 font-mono glass border-t border-zinc-800/50">
                🔒 READ-ONLY ACCESS • Circle CIA © 2026
            </footer>
        </div>
    );
}
