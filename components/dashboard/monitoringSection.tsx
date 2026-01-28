"use client";

import { VisitorLog, VisitorStats } from "@/types";
import { useEffect, useState } from "react";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";

export function MonitoringSection() {
    const [logs, setLogs] = useState<VisitorLog[]>([]);
    const [stats, setStats] = useState<VisitorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/visitors?limit=50");
                const data = await res.json();
                if (data.success) {
                    setLogs(data.data);
                    setStats(data.stats);
                } else {
                    setError(data.error || "Failed to load data");
                }
            } catch {
                setError("Unable to fetch visitor data. Admin access required.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Visitor Monitoring</h1>
                <div className="card border border-red-500/30">
                    <p className="text-red-400">⚠️ {error}</p>
                    <p className="text-zinc-500 text-sm mt-2">Only ADMIN users can access visitor logs.</p>
                </div>
            </div>
        );
    }

    const deviceIcons: Record<string, string> = { mobile: "📱", tablet: "📲", desktop: "🖥️" };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Visitor Monitoring</h1>
                <p className="text-zinc-500">Track website visitors and their devices</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <p className="text-zinc-500 text-sm">Total Visits</p>
                    <p className="text-3xl font-bold text-green-400">{stats?.total || 0}</p>
                </div>
                <div className="card">
                    <p className="text-zinc-500 text-sm">Unique Visitors</p>
                    <p className="text-3xl font-bold text-blue-400">{stats?.uniqueVisitors || 0}</p>
                </div>
                <div className="card">
                    <p className="text-zinc-500 text-sm">Desktop</p>
                    <p className="text-3xl font-bold">🖥️ {stats?.devices?.desktop || 0}</p>
                </div>
                <div className="card">
                    <p className="text-zinc-500 text-sm">Mobile</p>
                    <p className="text-3xl font-bold">📱 {stats?.devices?.mobile || 0}</p>
                </div>
            </div>

            {/* Browser Stats */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Top Browsers</h3>
                <div className="flex gap-4 flex-wrap">
                    {stats?.topBrowsers?.map((b, i) => (
                        <div key={i} className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <span className="text-white">{b.browser}</span>
                            <span className="ml-2 text-green-400 font-bold">{b.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visitor Logs Table */}
            <div className="card overflow-hidden">
                <h3 className="text-lg font-semibold mb-4">Recent Visitors ({logs.length})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left py-3 px-4 text-zinc-400">Time</th>
                                <th className="text-left py-3 px-4 text-zinc-400">IP</th>
                                <th className="text-left py-3 px-4 text-zinc-400">Device</th>
                                <th className="text-left py-3 px-4 text-zinc-400">Browser</th>
                                <th className="text-left py-3 px-4 text-zinc-400">OS</th>
                                <th className="text-left py-3 px-4 text-zinc-400">Page</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="py-3 px-4 text-zinc-500 font-mono text-xs">
                                        {new Date(log.createdAt).toLocaleString("id-ID")}
                                    </td>
                                    <td className="py-3 px-4 font-mono">{log.ip}</td>
                                    <td className="py-3 px-4">
                                        <span className="text-lg">{deviceIcons[log.device] || "💻"}</span>
                                        <span className="ml-2 text-zinc-400 capitalize">{log.device}</span>
                                    </td>
                                    <td className="py-3 px-4">{log.browser}</td>
                                    <td className="py-3 px-4">{log.os}</td>
                                    <td className="py-3 px-4 text-green-400 font-mono">{log.page}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}