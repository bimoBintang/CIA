"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchWithCache, invalidateCache } from "@/lib/cache";
import { ROLE_PERMISSIONS, ROLE_COLORS, ROLE_LABELS, type Role } from "@/lib/roles";

// Lazy load AlbumsSection with loading fallback
const AlbumsSection = dynamic(() => import("@/components/dashboard/AlbumsSection"), {
    loading: () => <div className="flex items-center justify-center py-20"><span className="text-zinc-500">Memuat gallery...</span></div>,
    ssr: false,
});

// Lazy load NewsSection
const NewsSection = dynamic(() => import("@/components/dashboard/NewsSection"), {
    loading: () => <div className="flex items-center justify-center py-20"><span className="text-zinc-500">Memuat berita...</span></div>,
    ssr: false,
});

// Lazy load DeviceTrackingSection
const DeviceTrackingSection = dynamic(() => import("@/components/dashboard/DeviceTrackingSection"), {
    loading: () => <div className="flex items-center justify-center py-20"><span className="text-zinc-500">Memuat device tracking...</span></div>,
    ssr: false,
});

// Types
interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    agent?: {
        id: string;
        codename: string;
        status: string;
    } | null;
}

interface Agent {
    id: string;
    codename: string;
    email: string;
    faculty: string;
    level: string;
    status: string;
    missions: number;
    createdAt: string;
}

interface OperationPlan {
    id: string;
    operationId: string;
    title: string;
    content?: string;
    status: string;
    attachments?: string[];
    createdAt: string;
}

interface Operation {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority?: string;
    progress: number;
    deadline: string;
    teamSize: number;
    attachments?: string[];
    plans?: OperationPlan[];
    createdAt?: string;
}

interface Intel {
    id: string;
    title: string;
    content: string | null;
    priority: string;
    attachments?: string[];
    createdAt: string;
    source?: { codename: string };
}

interface Message {
    id: string;
    content: string;
    read: boolean;
    createdAt: string;
    fromId: string;
    toId: string;
    attachments?: string[];
    fromAgent: Agent;
    toAgent: Agent;
}

interface Stats {
    agents: { total: number; online: number; away: number; offline: number };
    operations: { total: number; active: number; planning: number; completed: number };
    intel: { total: number; high: number; medium: number; low: number };
    news: { total: number; published: number };
}

// Helper function for relative time
function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes}m lalu`;
    if (hours < 24) return `${hours}h lalu`;
    return `${days}d lalu`;
}

// Modal Component
function Modal({
    isOpen,
    onClose,
    title,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in-up ${type === "success" ? "bg-green-500/90" : "bg-red-500/90"
                }`}
        >
            <p className="text-white font-medium">{message}</p>
        </div>
    );
}

// Sidebar Component
function Sidebar({ activeTab, setActiveTab, user, onLogout }: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: User | null;
    onLogout: () => void;
}) {
    const role = user?.role || 'VIEWER';
    const permissions = ROLE_PERMISSIONS[role];

    const allMenuItems = [
        { id: "overview", label: "Overview", icon: "📊", permission: null },
        { id: "agents", label: "Agents", icon: "🕵️", permission: "canViewAgents" as const },
        { id: "operations", label: "Operations", icon: "🎯", permission: "canViewOperations" as const },
        { id: "intel", label: "Intel Feed", icon: "📡", permission: "canViewIntel" as const },
        { id: "news", label: "Berita", icon: "📰", permission: "canViewMessages" as const },
        { id: "monitoring", label: "Monitoring", icon: "👁️", permission: "canManageUsers" as const },
        { id: "gallery", label: "Gallery", icon: "📸", permission: "canViewOperations" as const },
        { id: "security", label: "Security", icon: "🛡️", permission: "canManageUsers" as const },
        { id: "settings", label: "Settings", icon: "⚙️", permission: "canAccessSettings" as const },
    ];

    const menuItems = allMenuItems.filter(item => !item.permission || permissions[item.permission]);

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-zinc-800/50 z-40">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse-glow">
                        <span className="text-black font-bold text-lg">C</span>
                    </div>
                    <div>
                        <span className="text-lg font-bold text-gradient">Circle CIA</span>
                        <p className="text-xs text-zinc-500">Command Center</p>
                    </div>
                </Link>
            </div>

            <nav className="px-4 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${activeTab === item.id
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="glass rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <span className="text-black font-bold">{user?.name?.[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.agent?.codename || user?.name || "Guest"}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${user?.role ? ROLE_COLORS[user.role] : "bg-zinc-700 text-zinc-400"}`}>
                                {user?.role ? ROLE_LABELS[user.role] : "Unknown"}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    change,
    changeType,
}: {
    icon: string;
    label: string;
    value: string | number;
    change: string;
    changeType: "up" | "down" | "neutral";
}) {
    return (
        <div className="card glass-hover">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-500 text-sm mb-1">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className="text-3xl">{icon}</div>
            </div>
            <div className={`mt-4 text-sm ${changeType === "up" ? "text-green-400" : changeType === "down" ? "text-red-400" : "text-zinc-500"}`}>
                {changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→"} {change}
            </div>
        </div>
    );
}

// Loading Skeleton - CIA Themed
function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            {/* CIA Loading Header */}
            <div className="flex flex-col items-center justify-center py-8">
                {/* Radar Animation */}
                <div className="relative w-24 h-24 mb-4">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-2 border-green-500/30 rounded-full"></div>
                    {/* Middle ring */}
                    <div className="absolute inset-3 border border-green-500/50 rounded-full"></div>
                    {/* Inner ring */}
                    <div className="absolute inset-6 border border-green-500/70 rounded-full"></div>
                    {/* Center dot */}
                    <div className="absolute inset-[42%] bg-green-500 rounded-full animate-pulse"></div>
                    {/* Scanning line */}
                    <div
                        className="absolute inset-0 origin-center"
                        style={{ animation: 'spin 2s linear infinite' }}
                    >
                        <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-t from-green-500 to-transparent"></div>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse"></div>
                </div>

                {/* CIA Text */}
                <div className="text-center">
                    <p className="text-green-400 font-mono text-lg tracking-widest animate-pulse">
                        ⌛ ACCESSING CLASSIFIED DATA
                    </p>
                    <p className="text-zinc-500 text-sm font-mono mt-2">
                        <span className="inline-block animate-pulse">█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.1s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.3s' }}>█</span>
                        <span className="text-green-400"> DECRYPTING </span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.5s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.6s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.7s' }}>█</span>
                    </p>
                </div>
            </div>

            {/* Classified Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['AGENTS', 'OPS', 'INTEL', 'COMMS'].map((label, i) => (
                    <div
                        key={i}
                        className="card border border-green-500/20 relative overflow-hidden"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    >
                        {/* Scan line effect */}
                        <div
                            className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-green-500/10 to-transparent"
                            style={{
                                animation: 'pulse 2s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`
                            }}
                        ></div>
                        <div className="relative z-10">
                            <p className="text-green-500/50 text-xs font-mono mb-1">[{label}]</p>
                            <div className="h-8 bg-zinc-800 rounded w-1/3 animate-pulse"></div>
                            <p className="text-zinc-600 text-xs font-mono mt-2">LOADING...</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Classified Documents Loading */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card border border-green-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-red-500 text-xs font-mono animate-pulse">● LIVE</span>
                        <span className="text-zinc-500 text-xs font-mono">INTEL FEED</span>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            >
                                <div className="w-2 h-2 bg-green-500/50 rounded-full animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse mb-1"></div>
                                    <div className="h-3 bg-zinc-800/50 rounded w-1/2 animate-pulse"></div>
                                </div>
                                <span className="text-zinc-700 text-xs font-mono">[CLASSIFIED]</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card border border-green-500/20">
                    <p className="text-zinc-500 text-xs font-mono mb-4">QUICK ACTIONS</p>
                    <div className="space-y-2">
                        {['SUBMIT INTEL', 'BROADCAST', 'NEW OP', 'RECRUIT'].map((action, i) => (
                            <div
                                key={i}
                                className="h-10 bg-zinc-800/50 rounded border border-zinc-700/50 flex items-center px-3 animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <span className="text-zinc-600 text-xs font-mono">{action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Overview Section
function OverviewSection({ onNavigate }: { onNavigate: (tab: string) => void }) {
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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back, Agent Alpha</h1>
                <p className="text-zinc-500">Here&apos;s your command center overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-semibold mb-4">Recent Intel</h3>
                    <div className="space-y-4">
                        {intel.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-2 ${item.priority === "high" ? "bg-red-500" : item.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"}`} />
                                <div className="flex-1">
                                    <p className="text-sm">{item.title}</p>
                                    <p className="text-xs text-zinc-500">{item.source?.codename} • {getRelativeTime(item.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <button onClick={() => onNavigate("intel")} className="w-full btn-primary text-sm py-3">📝 Submit Intel Report</button>
                        <button onClick={() => onNavigate("messages")} className="w-full btn-secondary text-sm py-3">📡 Broadcast Message</button>
                        <button onClick={() => onNavigate("operations")} className="w-full btn-secondary text-sm py-3">🎯 Create Operation</button>
                        <button onClick={() => onNavigate("agents")} className="w-full btn-secondary text-sm py-3">👤 Invite Agent</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Agents Section
function AgentsSection({ showToast, onAgentCreated, user }: { showToast: (msg: string, type: "success" | "error") => void; onAgentCreated?: () => void; user: User | null }) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ codename: "", email: "", password: "", faculty: "", level: "Junior", role: "AGENT" });
    const [submitting, setSubmitting] = useState(false);
    const isAdmin = user?.role === "ADMIN";

    const fetchAgents = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<Agent[]>("/api/agents", { force });
            if (result.data) setAgents(result.data);
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Create agent first
            const agentRes = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    codename: formData.codename,
                    email: formData.email,
                    faculty: formData.faculty,
                    level: formData.level
                }),
            });
            const agentData = await agentRes.json();

            if (!agentData.success) {
                showToast(agentData.error || "Gagal membuat agent", "error");
                setSubmitting(false);
                return;
            }

            // 2. Create user account linked to agent
            const userRes = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.codename,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    agentId: agentData.data.id,
                }),
            });
            const userData = await userRes.json();

            if (userData.success) {
                showToast("Agent & akun berhasil dibuat!", "success");
                setShowModal(false);
                setFormData({ codename: "", email: "", password: "", faculty: "", level: "Junior", role: "AGENT" });
                invalidateCache("/api/agents");
                invalidateCache("/api/stats");
                fetchAgents(true);
                onAgentCreated?.();
            } else {
                showToast(userData.error || "Agent dibuat tapi akun gagal", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Agents Directory</h1>
                    <p className="text-zinc-500">Manage and monitor all registered agents ({agents.length} total)</p>
                </div>
                {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Agent</button>}
            </div>

            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Agent</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Faculty</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Status</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Level</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Missions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map((agent) => (
                            <tr key={agent.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                            <span className="text-black font-bold text-sm">{agent.codename.split(" ")[1]?.[0] || "A"}</span>
                                        </div>
                                        <span className="font-medium">{agent.codename}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-zinc-400">{agent.faculty}</td>
                                <td className="py-4 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${agent.status === "online" ? "bg-green-500/20 text-green-400" : agent.status === "away" ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "online" ? "bg-green-400" : agent.status === "away" ? "bg-yellow-400" : "bg-zinc-400"}`} />
                                        {agent.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`text-xs px-2 py-1 rounded ${agent.level === "Senior" ? "bg-purple-500/20 text-purple-400" : agent.level === "Intermediate" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                                        {agent.level}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-zinc-400">{agent.missions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Agent & Account">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Codename</label>
                        <input type="text" value={formData.codename} onChange={(e) => setFormData({ ...formData, codename: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Agent Nova" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="nova@circle-cia.id" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Password</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Min 8 char, 1 uppercase, 1 number" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Faculty</label>
                            <input type="text" value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Fakultas Teknik" required />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Level</label>
                            <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                                <option value="Junior">Junior</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Senior">Senior</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                            <option value="AGENT">Agent</option>
                            <option value="SENIOR_AGENT">Senior Agent</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Membuat akun..." : "Create Agent & Account"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}

// Operations Section
function OperationsSection({ showToast }: { showToast: (msg: string, type: "success" | "error") => void }) {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOp, setSelectedOp] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", deadline: "", teamSize: 1, priority: "medium" });
    const [submitting, setSubmitting] = useState(false);

    const fetchOperations = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<Operation[]>("/api/operations", { force });
            if (result.data) setOperations(result.data);
        } catch (error) {
            console.error("Error fetching operations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOperations();
    }, [fetchOperations]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/operations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Operation berhasil dibuat!", "success");
                setShowModal(false);
                setFormData({ name: "", description: "", deadline: "", teamSize: 1, priority: "medium" });
                invalidateCache("/api/operations");
                invalidateCache("/api/stats");
                fetchOperations(true);
            } else {
                showToast(data.error || "Gagal membuat operation", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "active": return { bg: "bg-green-500/20", text: "text-green-400", icon: "🟢" };
            case "planning": return { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "🟡" };
            case "completed": return { bg: "bg-blue-500/20", text: "text-blue-400", icon: "✅" };
            default: return { bg: "bg-zinc-500/20", text: "text-zinc-400", icon: "⚪" };
        }
    };

    const getPriorityStyles = (priority: string = "medium") => {
        switch (priority) {
            case "high": return { bg: "bg-red-500/20", text: "text-red-400", label: "🔴 High" };
            case "medium": return { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "🟡 Medium" };
            default: return { bg: "bg-blue-500/20", text: "text-blue-400", label: "🔵 Low" };
        }
    };

    const getDaysRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return { text: `${Math.abs(days)} hari lewat`, color: "text-red-400" };
        if (days === 0) return { text: "Hari ini!", color: "text-yellow-400" };
        if (days <= 3) return { text: `${days} hari lagi`, color: "text-yellow-400" };
        return { text: `${days} hari lagi`, color: "text-zinc-400" };
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">🎯 Operations</h1>
                    <p className="text-zinc-500">Track and manage ongoing operations ({operations.length} total)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">+ New Operation</button>
            </div>

            {operations.length === 0 ? (
                <div className="card text-center py-16">
                    <p className="text-5xl mb-4">🎯</p>
                    <p className="text-zinc-400">Belum ada operation aktif</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Buat Operation Pertama</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {operations.map((op) => {
                        const statusStyles = getStatusStyles(op.status);
                        const priorityStyles = getPriorityStyles(op.priority);
                        const daysInfo = getDaysRemaining(op.deadline);
                        const isExpanded = selectedOp === op.id;

                        return (
                            <div
                                key={op.id}
                                className={`card glass-hover cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-1 ring-green-500/50 md:col-span-2' : ''}`}
                                onClick={() => setSelectedOp(isExpanded ? null : op.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">{op.name}</h3>
                                        <p className="text-zinc-500 text-sm">{op.teamSize} agents assigned</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs px-2 py-1 rounded ${priorityStyles.bg} ${priorityStyles.text}`}>
                                            {op.priority?.toUpperCase() || "MEDIUM"}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${statusStyles.bg} ${statusStyles.text}`}>
                                            {statusStyles.icon} {op.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-zinc-400">Progress</span>
                                        <span className="text-green-400">{op.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${op.progress}%` }} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">
                                        📅 {new Date(op.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className={daysInfo.color}>{daysInfo.text}</span>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                                        {/* Description */}
                                        <div>
                                            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">📝 Description</h4>
                                            <div className="bg-zinc-900/50 rounded-lg p-4 text-zinc-300">
                                                {op.description ? (
                                                    <p className="whitespace-pre-wrap">{op.description}</p>
                                                ) : (
                                                    <p className="text-zinc-500 italic">Tidak ada deskripsi</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-green-400">{op.progress}%</p>
                                                <p className="text-xs text-zinc-500">Progress</p>
                                            </div>
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-blue-400">{op.teamSize}</p>
                                                <p className="text-xs text-zinc-500">Team Size</p>
                                            </div>
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className={`text-2xl font-bold ${statusStyles.text}`}>{statusStyles.icon}</p>
                                                <p className="text-xs text-zinc-500">{op.status}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className={`text-2xl font-bold ${priorityStyles.text}`}>{op.priority?.[0]?.toUpperCase() || "M"}</p>
                                                <p className="text-xs text-zinc-500">Priority</p>
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-6 text-xs text-zinc-500">
                                            <div>
                                                <span className="text-zinc-600">Created:</span>{" "}
                                                <span className="text-zinc-300">{op.createdAt ? new Date(op.createdAt).toLocaleString("id-ID") : "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">ID:</span>{" "}
                                                <span className="text-zinc-400 font-mono">{op.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Operation">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Operation Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Operation Phoenix" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-24 resize-none" placeholder="Deskripsi operation..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                                <option value="low">🔵 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Team Size</label>
                            <input type="number" min={1} value={formData.teamSize} onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Deadline</label>
                        <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Membuat..." : "🎯 Create Operation"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}

// Intel Section
function IntelSection({ showToast, agents }: { showToast: (msg: string, type: "success" | "error") => void; agents: Agent[] }) {
    const [intel, setIntel] = useState<Intel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedIntel, setSelectedIntel] = useState<Intel | null>(null);
    const [formData, setFormData] = useState({ title: "", content: "", priority: "medium", sourceId: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchIntel = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<Intel[]>("/api/intel", { force });
            if (result.data) setIntel(result.data);
        } catch (error) {
            console.error("Error fetching intel:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIntel();
    }, [fetchIntel]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/intel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Intel report berhasil dikirim!", "success");
                setShowModal(false);
                setFormData({ title: "", content: "", priority: "medium", sourceId: "" });
                invalidateCache("/api/intel");
                invalidateCache("/api/stats");
                fetchIntel(true);
            } else {
                showToast(data.error || "Gagal mengirim intel", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "high":
                return { dot: "bg-red-500 animate-pulse", badge: "bg-red-500/20 text-red-400", icon: "🔴" };
            case "medium":
                return { dot: "bg-yellow-500", badge: "bg-yellow-500/20 text-yellow-400", icon: "🟡" };
            default:
                return { dot: "bg-blue-500", badge: "bg-blue-500/20 text-blue-400", icon: "🔵" };
        }
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">📡 Intel Feed</h1>
                    <p className="text-zinc-500">Latest intelligence reports from the field ({intel.length} reports)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">+ Submit Intel</button>
            </div>

            {intel.length === 0 ? (
                <div className="card text-center py-16">
                    <p className="text-5xl mb-4">📡</p>
                    <p className="text-zinc-400">Belum ada intel report</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Submit Intel Pertama</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {intel.map((item) => {
                        const styles = getPriorityStyles(item.priority);
                        const isExpanded = selectedIntel?.id === item.id;

                        return (
                            <div
                                key={item.id}
                                className={`card glass-hover cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-1 ring-green-500/50' : ''}`}
                                onClick={() => setSelectedIntel(isExpanded ? null : item)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{item.title}</h3>
                                        <p className="text-sm text-zinc-500">
                                            {styles.icon} {item.source?.codename || "Unknown"} • {getRelativeTime(item.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${styles.badge}`}>
                                        {item.priority.toUpperCase()}
                                    </span>
                                    <span className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                                        {/* Content */}
                                        <div>
                                            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">📝 Detail Report</h4>
                                            <div className="bg-zinc-900/50 rounded-lg p-4 text-zinc-300">
                                                {item.content ? (
                                                    <p className="whitespace-pre-wrap">{item.content}</p>
                                                ) : (
                                                    <p className="text-zinc-500 italic">Tidak ada detail tambahan</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Attachments */}
                                        {item.attachments && item.attachments.length > 0 && (
                                            <div>
                                                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">📎 Attachments</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.attachments.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1 bg-zinc-800 rounded-lg text-sm text-green-400 hover:bg-zinc-700 transition-colors"
                                                        >
                                                            File {idx + 1} ↗
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="flex items-center gap-6 text-xs text-zinc-500">
                                            <div>
                                                <span className="text-zinc-600">Source:</span> <span className="text-zinc-300">{item.source?.codename || "Unknown"}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">Date:</span> <span className="text-zinc-300">{new Date(item.createdAt).toLocaleString("id-ID")}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">ID:</span> <span className="text-zinc-400 font-mono">{item.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Intel Report">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Title</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Judul intel..." required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Content</label>
                        <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-32 resize-none" placeholder="Detail intel report..." />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Priority</label>
                        <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                            <option value="low">🔵 Low - Informasi umum</option>
                            <option value="medium">🟡 Medium - Perlu perhatian</option>
                            <option value="high">🔴 High - Urgent / Kritis</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Source Agent</label>
                        <select value={formData.sourceId} onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required>
                            <option value="">Pilih agent...</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.codename}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Mengirim..." : "📡 Submit Intel"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}

// Channel interface
interface Channel {
    id: string;
    name: string;
    description: string | null;
    type: string;
    members: { agent: { id: string; codename: string; status: string } }[];
    messages: { content: string; sender: { codename: string } }[];
    _count: { messages: number };
}

interface ChannelMessage {
    id: string;
    content: string;
    attachments: string[];
    createdAt: string;
    sender: { id: string; codename: string; status: string };
}

// Messages Section - Chat Layout
function MessagesSection({ showToast, agents, user }: { showToast: (msg: string, type: "success" | "error") => void; agents: Agent[]; user: User | null }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<"dm" | "channel">("dm");
    const [selectedDM, setSelectedDM] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [showNewChannelModal, setShowNewChannelModal] = useState(false);
    const [showNewDMModal, setShowNewDMModal] = useState(false);
    const [channelForm, setChannelForm] = useState({ name: "", description: "", memberIds: [] as string[] });
    const [dmForm, setDmForm] = useState({ toId: "", content: "" });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch DMs
    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch("/api/messages");
            const data = await res.json();
            if (data.success) setMessages(data.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, []);

    // Fetch Channels
    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch("/api/channels");
            const data = await res.json();
            if (data.success) setChannels(data.data);
        } catch (error) {
            console.error("Error fetching channels:", error);
        }
    }, []);

    // Fetch channel messages
    const fetchChannelMessages = useCallback(async (channelId: string) => {
        try {
            const res = await fetch(`/api/channels/${channelId}/messages`);
            const data = await res.json();
            if (data.success) setChannelMessages(data.data);
        } catch (error) {
            console.error("Error fetching channel messages:", error);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchMessages(), fetchChannels()]).finally(() => setLoading(false));
    }, [fetchMessages, fetchChannels]);

    useEffect(() => {
        if (selectedChannel) {
            fetchChannelMessages(selectedChannel);
            const interval = setInterval(() => fetchChannelMessages(selectedChannel), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedChannel, fetchChannelMessages]);

    // Group DMs by conversation partner
    const conversations = useMemo(() => {
        const convMap = new Map<string, { agent: Agent; lastMessage: Message; unread: number }>();
        const myAgentId = user?.agent?.id;

        messages.forEach(msg => {
            const partnerId = msg.fromId === myAgentId ? msg.toId : msg.fromId;
            const partner = msg.fromId === myAgentId ? msg.toAgent : msg.fromAgent;
            if (!partner) return;

            const existing = convMap.get(partnerId);
            if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
                convMap.set(partnerId, {
                    agent: partner,
                    lastMessage: msg,
                    unread: (existing?.unread || 0) + (!msg.read && msg.toId === myAgentId ? 1 : 0),
                });
            } else if (!msg.read && msg.toId === myAgentId) {
                existing.unread++;
            }
        });

        return Array.from(convMap.values()).sort((a, b) =>
            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        );
    }, [messages, user]);

    // Get DM thread
    const dmThread = useMemo(() => {
        if (!selectedDM || !user?.agent?.id) return [];
        return messages
            .filter(m => (m.fromId === selectedDM && m.toId === user.agent!.id) || (m.toId === selectedDM && m.fromId === user.agent!.id))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [messages, selectedDM, user]);

    // File upload handler
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                setAttachments(prev => [...prev, data.data.url]);
                showToast("File uploaded!", "success");
            } else {
                showToast(data.error || "Upload failed", "error");
            }
        } catch {
            showToast("Upload error", "error");
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    // Send DM
    async function sendDM(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() && attachments.length === 0) return;
        if (!selectedDM || !user?.agent?.id) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    toId: selectedDM,
                    fromId: user.agent.id,
                    attachments,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage("");
                setAttachments([]);
                fetchMessages();
            } else {
                showToast(data.error || "Failed to send", "error");
            }
        } catch {
            showToast("Error sending message", "error");
        } finally {
            setSubmitting(false);
        }
    }

    // Send channel message
    async function sendChannelMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() && attachments.length === 0) return;
        if (!selectedChannel) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/channels/${selectedChannel}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage.trim(), attachments }),
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage("");
                setAttachments([]);
                fetchChannelMessages(selectedChannel);
            } else {
                showToast(data.error || "Failed to send", "error");
            }
        } catch {
            showToast("Error sending message", "error");
        } finally {
            setSubmitting(false);
        }
    }

    // Create channel
    async function createChannel(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(channelForm),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Channel created!", "success");
                setShowNewChannelModal(false);
                setChannelForm({ name: "", description: "", memberIds: [] });
                fetchChannels();
            } else {
                showToast(data.error || "Failed", "error");
            }
        } catch {
            showToast("Error", "error");
        } finally {
            setSubmitting(false);
        }
    }

    // Send new DM
    async function sendNewDM(e: React.FormEvent) {
        e.preventDefault();
        if (!user?.agent?.id) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...dmForm, fromId: user.agent.id }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Message sent!", "success");
                setShowNewDMModal(false);
                setDmForm({ toId: "", content: "" });
                setSelectedDM(dmForm.toId);
                fetchMessages();
            } else {
                showToast(data.error || "Failed", "error");
            }
        } catch {
            showToast("Error", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const selectedConv = conversations.find(c => c.agent.id === selectedDM);
    const selectedChan = channels.find(c => c.id === selectedChannel);

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="flex h-[calc(100vh-120px)] -m-6 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                    <button
                        onClick={() => { setActiveView("dm"); setSelectedChannel(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-all ${activeView === "dm" ? "text-green-400 border-b-2 border-green-500" : "text-zinc-400"}`}
                    >
                        💬 Direct ({conversations.length})
                    </button>
                    <button
                        onClick={() => { setActiveView("channel"); setSelectedDM(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-all ${activeView === "channel" ? "text-green-400 border-b-2 border-green-500" : "text-zinc-400"}`}
                    >
                        📢 Channels ({channels.length})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {activeView === "dm" ? (
                        <div className="p-2 space-y-1">
                            {conversations.map(conv => (
                                <button key={conv.agent.id} onClick={() => setSelectedDM(conv.agent.id)} className={`w-full p-3 rounded-lg text-left transition-all ${selectedDM === conv.agent.id ? "bg-green-500/20 border border-green-500/30" : "hover:bg-zinc-800/50"}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                                <span className="text-black font-bold text-sm">{conv.agent.codename?.split(" ")[1]?.[0] || "?"}</span>
                                            </div>
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${conv.agent.status === "online" ? "bg-green-500" : "bg-zinc-500"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{conv.agent.codename}</span>
                                                {conv.unread > 0 && <span className="bg-green-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{conv.unread}</span>}
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate">{conv.lastMessage.content}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {conversations.length === 0 && <p className="text-center text-zinc-500 py-8">No conversations yet</p>}
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {channels.map(chan => (
                                <button key={chan.id} onClick={() => setSelectedChannel(chan.id)} className={`w-full p-3 rounded-lg text-left transition-all ${selectedChannel === chan.id ? "bg-green-500/20 border border-green-500/30" : "hover:bg-zinc-800/50"}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-bold">#</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{chan.name}</p>
                                            <p className="text-xs text-zinc-500">{chan.members.length} members</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {channels.length === 0 && <p className="text-center text-zinc-500 py-8">No channels yet</p>}
                        </div>
                    )}
                </div>

                {/* New Button */}
                <div className="p-3 border-t border-zinc-800">
                    <button
                        onClick={() => activeView === "dm" ? setShowNewDMModal(true) : setShowNewChannelModal(true)}
                        className="w-full btn-primary text-sm"
                    >
                        {activeView === "dm" ? "+ New Message" : "+ New Channel"}
                    </button>
                </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col bg-zinc-950">
                {(selectedDM || selectedChannel) ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-4">
                            {activeView === "dm" && selectedConv && (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <span className="text-black font-bold">{selectedConv.agent.codename?.split(" ")[1]?.[0]}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedConv.agent.codename}</p>
                                        <p className="text-xs text-zinc-500">{selectedConv.agent.status}</p>
                                    </div>
                                </>
                            )}
                            {activeView === "channel" && selectedChan && (
                                <>
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white font-bold">#</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedChan.name}</p>
                                        <p className="text-xs text-zinc-500">{selectedChan.members.length} members</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {activeView === "dm" ? (
                                dmThread.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.fromId === user?.agent?.id ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.fromId === user?.agent?.id ? "bg-green-500/20 rounded-br-sm" : "bg-zinc-800 rounded-bl-sm"}`}>
                                            <p>{msg.content}</p>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {msg.attachments.map((att, i) => (
                                                        <a key={i} href={att} target="_blank" className="block text-xs text-green-400 hover:underline">📎 Attachment {i + 1}</a>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-zinc-500 mt-1">{getRelativeTime(msg.createdAt)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                channelMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender.id === user?.agent?.id ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] ${msg.sender.id === user?.agent?.id ? "" : "flex gap-3"}`}>
                                            {msg.sender.id !== user?.agent?.id && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                                                    <span className="text-black text-xs font-bold">{msg.sender.codename?.split(" ")[1]?.[0]}</span>
                                                </div>
                                            )}
                                            <div className={`rounded-2xl px-4 py-2 ${msg.sender.id === user?.agent?.id ? "bg-green-500/20 rounded-br-sm" : "bg-zinc-800 rounded-bl-sm"}`}>
                                                {msg.sender.id !== user?.agent?.id && <p className="text-xs text-green-400 mb-1">{msg.sender.codename}</p>}
                                                <p>{msg.content}</p>
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {msg.attachments.map((att, i) => (
                                                            <a key={i} href={att} target="_blank" className="block text-xs text-green-400 hover:underline">📎 Attachment {i + 1}</a>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-zinc-500 mt-1">{getRelativeTime(msg.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={activeView === "dm" ? sendDM : sendChannelMessage} className="p-4 border-t border-zinc-800">
                            {attachments.length > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {attachments.map((att, i) => (
                                        <span key={i} className="bg-zinc-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                            📎 {att.split("/").pop()}
                                            <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-all disabled:opacity-50">
                                    {uploadingFile ? "⏳" : "📎"}
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:border-green-500 focus:outline-none"
                                />
                                <button type="submit" disabled={submitting || (!newMessage.trim() && !attachments.length)} className="px-4 py-2 bg-green-500 text-black rounded-lg font-medium hover:bg-green-400 transition-all disabled:opacity-50">
                                    {submitting ? "..." : "Send"}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-zinc-500">
                            <p className="text-6xl mb-4">💬</p>
                            <p className="text-xl">Select a conversation or channel</p>
                            <p className="text-sm mt-2">Start messaging with your team</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Channel Modal */}
            <Modal isOpen={showNewChannelModal} onClose={() => setShowNewChannelModal(false)} title="Create Channel">
                <form onSubmit={createChannel} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Channel Name</label>
                        <input type="text" value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="general" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Description</label>
                        <input type="text" value={channelForm.description} onChange={e => setChannelForm({ ...channelForm, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Optional description..." />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Add Members</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {agents.filter(a => a.id !== user?.agent?.id).map(agent => (
                                <label key={agent.id} className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800/50 cursor-pointer">
                                    <input type="checkbox" checked={channelForm.memberIds.includes(agent.id)} onChange={e => setChannelForm({ ...channelForm, memberIds: e.target.checked ? [...channelForm.memberIds, agent.id] : channelForm.memberIds.filter(id => id !== agent.id) })} className="rounded" />
                                    <span>{agent.codename}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">{submitting ? "Creating..." : "Create Channel"}</button>
                </form>
            </Modal>

            {/* New DM Modal */}
            <Modal isOpen={showNewDMModal} onClose={() => setShowNewDMModal(false)} title="New Message">
                <form onSubmit={sendNewDM} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">To Agent</label>
                        <select value={dmForm.toId} onChange={e => setDmForm({ ...dmForm, toId: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required>
                            <option value="">Select agent...</option>
                            {agents.filter(a => a.id !== user?.agent?.id).map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.codename}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Message</label>
                        <textarea value={dmForm.content} onChange={e => setDmForm({ ...dmForm, content: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-24 resize-none" placeholder="Type your message..." required />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">{submitting ? "Sending..." : "Send Message"}</button>
                </form>
            </Modal>
        </div>
    );
}


// Monitoring Section
interface VisitorLog {
    id: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
    page: string;
    referer: string | null;
    userId: string | null;
    createdAt: string;
}

interface VisitorStats {
    total: number;
    uniqueVisitors: number;
    devices: Record<string, number>;
    topBrowsers: { browser: string; count: number }[];
}

function MonitoringSection() {
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

// Banned IP interface
interface BannedIP {
    id: string;
    ip: string;
    reason: string;
    bannedBy: string;
    expiresAt: string | null;
    createdAt: string;
}

// Login Activity interface
interface LoginActivityItem {
    id: string;
    userId: string | null;
    email: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
    status: string;
    reason: string | null;
    createdAt: string;
    user?: { name: string; email: string; role: string } | null;
}

interface LoginActivityStats {
    totalToday: number;
    successToday: number;
    failedToday: number;
    uniqueIPs: number;
}

// Security Section
function SecuritySection({ showToast }: { showToast: (msg: string, type: "success" | "error") => void }) {
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

// Settings Section
function SettingsSection() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-zinc-500">Manage your account and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Agent Codename</label>
                            <input type="text" defaultValue="Agent Alpha" className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none cursor-not-allowed opacity-60" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Email</label>
                            <input type="email" defaultValue="alpha@circle-cia.id" className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Faculty</label>
                            <input type="text" defaultValue="Fakultas Teknik" className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" />
                        </div>
                        <button className="btn-primary w-full">Save Changes</button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Security</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-zinc-500">Extra layer of security</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
                            <div>
                                <p className="font-medium">Encrypted Messages</p>
                                <p className="text-sm text-zinc-500">End-to-end encryption</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
                            <div>
                                <p className="font-medium">Activity Alerts</p>
                                <p className="text-sm text-zinc-500">Get notified of suspicious activity</p>
                            </div>
                            <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Dashboard Page
export default function Dashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

    const fetchAgents = useCallback(async () => {
        try {
            const res = await fetch("/api/agents");
            const data = await res.json();
            if (data.success) setAgents(data.data);
        } catch (error) {
            console.error("Error fetching agents:", error);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewSection onNavigate={setActiveTab} />;
            case "agents":
                return <AgentsSection showToast={showToast} onAgentCreated={fetchAgents} user={user} />;
            case "operations":
                return <OperationsSection showToast={showToast} />;
            case "intel":
                return <IntelSection showToast={showToast} agents={agents} />;
            case "news":
                return <NewsSection showToast={showToast} />;
            case "monitoring":
                return <DeviceTrackingSection />;
            case "security":
                return <SecuritySection showToast={showToast} />;
            case "gallery":
                return <AlbumsSection showToast={showToast} />
            case "settings":
                return <SettingsSection />;
            default:
                return <OverviewSection onNavigate={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
            <main className="ml-64 p-8">{renderContent()}</main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
