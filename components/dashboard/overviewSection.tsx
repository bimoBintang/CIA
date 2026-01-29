"use client";

import { fetchWithCache } from "@/lib/cache";
import { getRelativeTime } from "@/lib/utils";
import { Intel, Stats } from "@/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatCard } from "../cardSection";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";

function SessionDebug() {
    const searchParams = useSearchParams();
    const params = Array.from(searchParams.entries());

    if (params.length === 0) return null;

    return (
        <div className="card border-dashed border-green-500/30 bg-green-500/5">
            <h3 className="text-sm font-mono text-green-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                SESSION_PARAMS_DETECTED
            </h3>
            <div className="space-y-1">
                {params.map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-xs font-mono">
                        <span className="text-zinc-500">[{key}]</span>
                        <span className="text-zinc-300 break-all">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


export function OverviewSection({ onNavigate }: { onNavigate: (tab: string, id?: string) => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [intel, setIntel] = useState<Intel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsResult, intelResult] = await Promise.all([
                    fetchWithCache<Stats>("/api/stats"),
                    fetchWithCache<Intel[]>("/api/intel"),
                ]);

                if (statsResult.data) setStats(statsResult.data);
                if (intelResult.data) setIntel(intelResult.data.slice(0, 5));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton />;

    const statCards = stats
        ? [
            { icon: "🕵️", label: "Total Agents", value: stats.agents.total, change: `${stats.agents.online} online`, changeType: "up" as const },
            { icon: "🎯", label: "Active Ops", value: stats.operations.active, change: `${stats.operations.planning} planning`, changeType: "neutral" as const },
            { icon: "📡", label: "Intel Reports", value: stats.intel.total, change: `${stats.intel.high} high priority`, changeType: "up" as const },
            { icon: "📰", label: "Berita", value: stats.news?.total || 0, change: `${stats.news?.published || 0} published`, changeType: "neutral" as const },
        ]
        : [];

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">Welcome back, Agent Alpha</h1>
                <p className="text-zinc-500 text-sm md:text-base">Here&apos;s your command center overview</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {statCards.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-semibold mb-4">Recent Intel</h3>
                    <div className="space-y-4">
                        {intel.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                onClick={() => onNavigate("intel", item.id)}
                            >
                                <div className={`w-2 h-2 rounded-full mt-2 ${item.priority === "high" ? "bg-red-500" : item.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"}`} />
                                <div className="flex-1">
                                    <p className="text-sm">{item.title}</p>
                                    <p className="text-xs text-zinc-500">{item.source?.codename} • {getRelativeTime(item.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button onClick={() => onNavigate("intel")} className="w-full btn-primary text-sm py-3">📝 Submit Intel Report</button>
                            <button onClick={() => onNavigate("messages")} className="w-full btn-secondary text-sm py-3">📡 Broadcast Message</button>
                            <button onClick={() => onNavigate("operations")} className="w-full btn-secondary text-sm py-3">🎯 Create Operation</button>
                            <button onClick={() => onNavigate("agents")} className="w-full btn-secondary text-sm py-3">👤 Invite Agent</button>
                        </div>
                    </div>
                    <SessionDebug />
                </div>
            </div>
        </div>
    );
}