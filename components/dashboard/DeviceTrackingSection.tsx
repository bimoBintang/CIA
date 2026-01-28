"use client";

import { Pagination, Stats, VisitorLog } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DeviceChart } from "../charts/deviceChart";
import { CountryChart } from "../charts/countryChart";


const DEVICE_COLORS = {
    desktop: "#10b981",
    mobile: "#3b82f6",
    tablet: "#f59e0b",
};

export default function DeviceTrackingSection() {
    const [logs, setLogs] = useState<VisitorLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showIPFull, setShowIPFull] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`/api/visitors?page=${page}&limit=20`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
                setStats(data.stats);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching visitors:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const deviceData = stats
        ? Object.entries(stats.devices).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: DEVICE_COLORS[name as keyof typeof DEVICE_COLORS] || "#6b7280",
        }))
        : [];

    const countryData = stats?.topCountries?.slice(0, 8) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">📍 Device Tracking</h1>
                    <p className="text-zinc-500">
                        Real-time visitor monitoring • {stats?.total || 0} total visits • {stats?.uniqueVisitors || 0} unique IPs
                    </p>
                </div>
                <button onClick={fetchData} className="btn-secondary text-sm">
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="text-3xl font-bold text-green-400">{stats?.total || 0}</div>
                    <div className="text-sm text-zinc-500">Total Visits</div>
                </div>
                <div className="card">
                    <div className="text-3xl font-bold text-blue-400">{stats?.uniqueVisitors || 0}</div>
                    <div className="text-sm text-zinc-500">Unique IPs</div>
                </div>
                <div className="card">
                    <div className="text-3xl font-bold text-amber-400">{stats?.devices?.desktop || 0}</div>
                    <div className="text-sm text-zinc-500">Desktop</div>
                </div>
                <div className="card">
                    <div className="text-3xl font-bold text-purple-400">{stats?.devices?.mobile || 0}</div>
                    <div className="text-sm text-zinc-500">Mobile</div>
                </div>
            </div>

            {/* Charts Row - Lazy loaded */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-semibold mb-4">📱 Device Breakdown</h3>
                    <div className="h-48">
                        <DeviceChart deviceData={deviceData} />
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-semibold mb-4">🌍 Top Countries</h3>
                    <div className="h-48">
                        <CountryChart countryData={countryData} />
                    </div>
                </div>
            </div>

            {/* Visitor Logs Table */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">🔍 Recent Visitors</h3>
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showIPFull}
                            onChange={(e) => setShowIPFull(e.target.checked)}
                            className="rounded bg-zinc-800 border-zinc-700"
                        />
                        Show Full IP
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-zinc-500 border-b border-zinc-800">
                            <tr>
                                <th className="text-left py-3 px-2">IP</th>
                                <th className="text-left py-3 px-2">Location</th>
                                <th className="text-left py-3 px-2">Device</th>
                                <th className="text-left py-3 px-2">Browser</th>
                                <th className="text-left py-3 px-2">Page</th>
                                <th className="text-left py-3 px-2">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-zinc-800/30">
                                    <td className="py-3 px-2 font-mono text-xs">
                                        {showIPFull && log.ipFull ? log.ipFull : log.ip}
                                        {log.fingerprint && (
                                            <span className="ml-2 text-xs text-zinc-500" title={log.fingerprint}>
                                                🔑
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-zinc-300">{log.country || "?"}</span>
                                        {log.city && <span className="text-zinc-500 ml-1">• {log.city}</span>}
                                        {log.isp && <div className="text-xs text-zinc-600">{log.isp}</div>}
                                    </td>
                                    <td className="py-3 px-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${log.device === "mobile"
                                                ? "bg-blue-500/20 text-blue-400"
                                                : log.device === "tablet"
                                                    ? "bg-amber-500/20 text-amber-400"
                                                    : "bg-green-500/20 text-green-400"
                                                }`}
                                        >
                                            {log.device}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-zinc-400">
                                        {log.browser}
                                        <div className="text-xs text-zinc-600">{log.os}</div>
                                    </td>
                                    <td className="py-3 px-2 text-zinc-400 max-w-[150px] truncate">{log.page}</td>
                                    <td className="py-3 px-2 text-zinc-500 text-xs whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString("id-ID")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                        <span className="text-sm text-zinc-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded bg-zinc-800 disabled:opacity-50 hover:bg-zinc-700"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1 rounded bg-zinc-800 disabled:opacity-50 hover:bg-zinc-700"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
