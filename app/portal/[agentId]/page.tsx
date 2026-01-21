"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Agent {
    id: string;
    codename: string;
    faculty: string;
    level: string;
    status: string;
    missions: number;
    createdAt: string;
}

export default function AgentPortalPage() {
    const params = useParams();
    const agentId = params.agentId as string;
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAgent() {
            try {
                const res = await fetch(`/api/agents/${agentId}`);
                const data = await res.json();
                if (data.success) {
                    setAgent(data.data);
                } else {
                    setError(data.error || "Agent not found");
                }
            } catch {
                setError("Failed to load agent");
            } finally {
                setLoading(false);
            }
        }
        if (agentId) fetchAgent();
    }, [agentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-500 font-mono">Loading agent profile...</p>
                </div>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🕵️</div>
                    <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
                    <p className="text-zinc-500 mb-6">{error}</p>
                    <Link href="/" className="btn-primary px-6 py-3">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case "elite": return "from-yellow-500 to-orange-500";
            case "senior": return "from-purple-500 to-pink-500";
            case "field": return "from-blue-500 to-cyan-500";
            default: return "from-green-500 to-emerald-500";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "online": return "text-green-400";
            case "away": return "text-yellow-400";
            default: return "text-zinc-500";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
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

            {/* Profile Card */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="card border border-zinc-700">
                    {/* Cover gradient */}
                    <div className={`h-32 rounded-t-xl bg-linear-to-r ${getLevelColor(agent.level)} opacity-50`}></div>

                    {/* Avatar and Info */}
                    <div className="px-8 pb-8 -mt-16 relative">
                        <div className="flex items-end gap-6 mb-6">
                            <div className={`w-32 h-32 rounded-2xl bg-linear-to-br ${getLevelColor(agent.level)} flex items-center justify-center border-4 border-zinc-900`}>
                                <span className="text-5xl font-bold text-black">{agent.codename[0]}</span>
                            </div>
                            <div className="pb-2">
                                <h1 className="text-3xl font-bold">{agent.codename}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-sm ${getStatusColor(agent.status)}`}>
                                        ● {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                                    </span>
                                    <span className="text-sm text-zinc-500">•</span>
                                    <span className="text-sm text-zinc-400 capitalize">{agent.level} Agent</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                                <p className="text-3xl font-bold text-green-400">{agent.missions}</p>
                                <p className="text-sm text-zinc-500">Missions</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                                <p className="text-3xl font-bold text-blue-400">{agent.faculty}</p>
                                <p className="text-sm text-zinc-500">Faculty</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                                <p className="text-3xl font-bold text-purple-400 capitalize">{agent.level}</p>
                                <p className="text-sm text-zinc-500">Level</p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                                <span className="text-zinc-400">Member Since</span>
                                <span className="font-medium">{new Date(agent.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                                <span className="text-zinc-400">Agent ID</span>
                                <span className="font-mono text-sm text-zinc-500">{agent.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classification Notice */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-600 font-mono">
                        🔐 CLASSIFIED PROFILE • UNAUTHORIZED ACCESS PROHIBITED
                    </p>
                </div>
            </main>
        </div>
    );
}
