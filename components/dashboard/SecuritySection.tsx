"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchWithCache, invalidateCache } from "@/lib/cache";
import { ShowToast } from "../toast";
import { BannedIP, LoginActivityItem, LoginActivityStats } from "@/types";
import { getRelativeTime } from "@/lib/utils";
import { Modal } from "../modalSection";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";


interface Props {
    showToast: ShowToast;
}

export default function SecuritySection({ showToast }: Props) {
    const [activeSecurityTab, setActiveSecurityTab] = useState<"banned" | "activity">("banned");
    const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
    const [loginActivities, setLoginActivities] = useState<LoginActivityItem[]>([]);
    const [loginStats, setLoginStats] = useState<LoginActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ ip: "", reason: "", duration: "24h" });
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "expired" | "permanent">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed" | "blocked">("all");

    const fetchBannedIPs = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<BannedIP[]>("/api/banned-ips", { force });
            if (result.data) setBannedIPs(result.data);
        } catch (error) {
            console.error("Error fetching banned IPs:", error);
        }
    }, []);

    const fetchLoginActivities = useCallback(async () => {
        try {
            const res = await fetch(`/api/login-activity?limit=100&status=${statusFilter === "all" ? "" : statusFilter}`);
            const data = await res.json();
            if (data.success) {
                setLoginActivities(data.data);
                setLoginStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching login activities:", error);
        }
    }, [statusFilter]);

    useEffect(() => {
        Promise.all([fetchBannedIPs(), fetchLoginActivities()]).finally(() => setLoading(false));
    }, [fetchBannedIPs, fetchLoginActivities]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/banned-ips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                showToast("IP berhasil di-ban!", "success");
                setShowModal(false);
                setFormData({ ip: "", reason: "", duration: "24h" });
                invalidateCache("/api/banned-ips");
                fetchBannedIPs(true);
            } else {
                showToast(data.error || "Gagal ban IP", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleUnban(id: string) {
        if (!confirm("Yakin ingin unban IP ini?")) return;
        try {
            const res = await fetch(`/api/banned-ips?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("IP berhasil di-unban!", "success");
                invalidateCache("/api/banned-ips");
                fetchBannedIPs(true);
            } else {
                showToast(data.error || "Gagal unban IP", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        }
    }

    const now = new Date();
    const activeBans = bannedIPs.filter(ip => !ip.expiresAt || new Date(ip.expiresAt) > now);
    const permanentBans = bannedIPs.filter(ip => !ip.expiresAt);
    const recentBans = bannedIPs.filter(ip => {
        const created = new Date(ip.createdAt);
        return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
    });

    const filteredIPs = bannedIPs.filter(ip => {
        const matchSearch = ip.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ip.reason.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchSearch) return false;

        const isExpired = ip.expiresAt && new Date(ip.expiresAt) <= now;
        const isPermanent = !ip.expiresAt;

        switch (filter) {
            case "active": return !isExpired;
            case "expired": return isExpired;
            case "permanent": return isPermanent;
            default: return true;
        }
    });

    const filteredActivities = loginActivities.filter(activity =>
        activity.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.ip.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">🛡️ Security Center</h1>
                    <p className="text-zinc-500">Manage banned IPs and monitor login activity</p>
                </div>
                {activeSecurityTab === "banned" && (
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        🚫 Ban IP
                    </button>
                )}
            </div>

            {/* Security Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-2">
                <button
                    onClick={() => setActiveSecurityTab("banned")}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-all ${activeSecurityTab === "banned"
                        ? "bg-green-500/20 text-green-400 border-b-2 border-green-500"
                        : "text-zinc-400 hover:text-zinc-200"
                        }`}
                >
                    🚫 Banned IPs ({activeBans.length})
                </button>
                <button
                    onClick={() => setActiveSecurityTab("activity")}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-all ${activeSecurityTab === "activity"
                        ? "bg-green-500/20 text-green-400 border-b-2 border-green-500"
                        : "text-zinc-400 hover:text-zinc-200"
                        }`}
                >
                    📋 Login Activity ({loginStats?.totalToday || 0} today)
                </button>
            </div>

            {activeSecurityTab === "banned" ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Total Banned</p>
                                    <p className="text-3xl font-bold">{bannedIPs.length}</p>
                                </div>
                                <div className="text-3xl">🚫</div>
                            </div>
                            <div className="mt-4 text-sm text-zinc-500">All time bans</div>
                        </div>
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Active Bans</p>
                                    <p className="text-3xl font-bold text-red-400">{activeBans.length}</p>
                                </div>
                                <div className="text-3xl">🔒</div>
                            </div>
                            <div className="mt-4 text-sm text-red-400">Currently blocked</div>
                        </div>
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Permanent Bans</p>
                                    <p className="text-3xl font-bold text-orange-400">{permanentBans.length}</p>
                                </div>
                                <div className="text-3xl">⛔</div>
                            </div>
                            <div className="mt-4 text-sm text-orange-400">No expiration</div>
                        </div>
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Recent (24h)</p>
                                    <p className="text-3xl font-bold text-yellow-400">{recentBans.length}</p>
                                </div>
                                <div className="text-3xl">⚡</div>
                            </div>
                            <div className="mt-4 text-sm text-yellow-400">New bans today</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="🔍 Search IP or reason..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(["all", "active", "expired", "permanent"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Banned IPs Table */}
                    <div className="card overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">IP Address</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Reason</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Status</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Expires</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Banned</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIPs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                                            {searchTerm || filter !== "all" ? "No matching IPs found" : "No banned IPs yet"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIPs.map((ip) => {
                                        const isExpired = ip.expiresAt && new Date(ip.expiresAt) <= now;
                                        const isPermanent = !ip.expiresAt;

                                        return (
                                            <tr key={ip.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <code className="text-green-400 bg-zinc-800/50 px-2 py-1 rounded">
                                                        {ip.ip}
                                                    </code>
                                                </td>
                                                <td className="py-4 px-4 text-zinc-300 max-w-[200px] truncate">
                                                    {ip.reason}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${isExpired
                                                        ? "bg-zinc-500/20 text-zinc-400"
                                                        : isPermanent
                                                            ? "bg-red-500/20 text-red-400"
                                                            : "bg-yellow-500/20 text-yellow-400"
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isExpired
                                                            ? "bg-zinc-400"
                                                            : isPermanent
                                                                ? "bg-red-400"
                                                                : "bg-yellow-400"
                                                            }`} />
                                                        {isExpired ? "Expired" : isPermanent ? "Permanent" : "Active"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-zinc-400 text-sm">
                                                    {ip.expiresAt
                                                        ? new Date(ip.expiresAt).toLocaleString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })
                                                        : "Never"}
                                                </td>
                                                <td className="py-4 px-4 text-zinc-500 text-sm">
                                                    {getRelativeTime(ip.createdAt)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => handleUnban(ip.id)}
                                                        className="px-3 py-1.5 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                    >
                                                        Unban
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    {/* Login Activity Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Total (24h)</p>
                                    <p className="text-3xl font-bold">{loginStats?.totalToday || 0}</p>
                                </div>
                                <div className="text-3xl">📊</div>
                            </div>
                            <div className="mt-4 text-sm text-zinc-500">Login attempts</div>
                        </div>
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Successful</p>
                                    <p className="text-3xl font-bold text-green-400">{loginStats?.successToday || 0}</p>
                                </div>
                                <div className="text-3xl">✅</div>
                            </div>
                            <div className="mt-4 text-sm text-green-400">Verified logins</div>
                        </div>
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Failed</p>
                                    <p className="text-3xl font-bold text-red-400">{loginStats?.failedToday || 0}</p>
                                </div>
                                <div className="text-3xl">❌</div>
                            </div>
                            <div className="mt-4 text-sm text-red-400">Wrong credentials</div>
                        </div>
                        <div className="card glass-hover">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Unique IPs</p>
                                    <p className="text-3xl font-bold text-blue-400">{loginStats?.uniqueIPs || 0}</p>
                                </div>
                                <div className="text-3xl">🌐</div>
                            </div>
                            <div className="mt-4 text-sm text-blue-400">Different sources</div>
                        </div>
                    </div>

                    {/* Activity Filters */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="🔍 Search email or IP..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(["all", "success", "failed", "blocked"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Login Activity Table */}
                    <div className="card overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Email</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">IP</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Device</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Status</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Reason</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                                            No login activity recorded yet
                                        </td>
                                    </tr>
                                ) : (
                                    filteredActivities.map((activity) => (
                                        <tr key={activity.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium">{activity.user?.name || activity.email}</p>
                                                    <p className="text-xs text-zinc-500">{activity.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <code className="text-green-400 bg-zinc-800/50 px-2 py-1 rounded text-sm">
                                                    {activity.ip}
                                                </code>
                                            </td>
                                            <td className="py-4 px-4 text-zinc-400 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span>{activity.device === "mobile" ? "📱" : activity.device === "tablet" ? "📱" : "💻"}</span>
                                                    <div>
                                                        <p>{activity.browser}</p>
                                                        <p className="text-xs text-zinc-500">{activity.os}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${activity.status === "success"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : activity.status === "blocked"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : "bg-yellow-500/20 text-yellow-400"
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${activity.status === "success"
                                                        ? "bg-green-400"
                                                        : activity.status === "blocked"
                                                            ? "bg-red-400"
                                                            : "bg-yellow-400"
                                                        }`} />
                                                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-zinc-500 text-sm">
                                                {activity.reason || "-"}
                                            </td>
                                            <td className="py-4 px-4 text-zinc-500 text-sm">
                                                {getRelativeTime(activity.createdAt)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Ban IP Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🚫 Ban IP Address">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">IP Address</label>
                        <input
                            type="text"
                            value={formData.ip}
                            onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                            placeholder="192.168.1.1 or IPv6"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none resize-none"
                            rows={3}
                            placeholder="Reason for banning this IP..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Duration</label>
                        <select
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                        >
                            <option value="1h">1 Hour</option>
                            <option value="24h">24 Hours</option>
                            <option value="7d">7 Days</option>
                            <option value="30d">30 Days</option>
                            <option value="permanent">Permanent</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-primary disabled:opacity-50"
                    >
                        {submitting ? "Banning..." : "🚫 Ban IP"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
