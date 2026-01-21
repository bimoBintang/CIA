"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithCache, invalidateCache } from "@/lib/cache";
import { ROLE_PERMISSIONS, ROLE_COLORS, ROLE_LABELS, type Role } from "@/lib/roles";

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

interface Operation {
    id: string;
    name: string;
    status: string;
    progress: number;
    deadline: string;
    teamSize: number;
}

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
    toAgent?: { codename: string };
}

interface Stats {
    agents: { total: number; online: number; away: number; offline: number };
    operations: { total: number; active: number; planning: number; completed: number };
    intel: { total: number; high: number; medium: number; low: number };
    messages: { total: number; unread: number };
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
        { id: "messages", label: "Messages", icon: "💬", permission: "canViewMessages" as const },
        { id: "monitoring", label: "Monitoring", icon: "👁️", permission: "canManageUsers" as const },
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
            { icon: "💬", label: "Messages", value: stats.messages.total, change: `${stats.messages.unread} unread`, changeType: "neutral" as const },
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
    const [formData, setFormData] = useState({ name: "", deadline: "", teamSize: 1 });
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
                setFormData({ name: "", deadline: "", teamSize: 1 });
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

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Operations</h1>
                    <p className="text-zinc-500">Track and manage ongoing operations ({operations.length} total)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">+ New Operation</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operations.map((op) => (
                    <div key={op.id} className="card glass-hover">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-lg">{op.name}</h3>
                                <p className="text-zinc-500 text-sm">{op.teamSize} agents assigned</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${op.status === "active" ? "bg-green-500/20 text-green-400" : op.status === "planning" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                                {op.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Progress</span>
                                <span className="text-green-400">{op.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${op.progress}%` }} />
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500">
                            Deadline: {new Date(op.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                    </div>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Operation">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Operation Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Operation Phoenix" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Deadline</label>
                        <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Team Size</label>
                        <input type="number" min={1} value={formData.teamSize} onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Membuat..." : "Create Operation"}
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

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Intel Feed</h1>
                    <p className="text-zinc-500">Latest intelligence reports from the field ({intel.length} reports)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">+ Submit Intel</button>
            </div>

            <div className="space-y-3">
                {intel.map((item) => (
                    <div key={item.id} className="card glass-hover flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.priority === "high" ? "bg-red-500 animate-pulse" : item.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"}`} />
                        <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-zinc-500">{item.source?.codename || "Unknown"} • {getRelativeTime(item.createdAt)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${item.priority === "high" ? "bg-red-500/20 text-red-400" : item.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                            {item.priority.toUpperCase()}
                        </span>
                    </div>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Intel Report">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Title</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Judul intel..." required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Content</label>
                        <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-24 resize-none" placeholder="Detail intel..." />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Priority</label>
                        <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
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
                        {submitting ? "Mengirim..." : "Submit Intel"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}

// Messages Section
function MessagesSection({ showToast, agents, user }: { showToast: (msg: string, type: "success" | "error") => void; agents: Agent[]; user: User | null }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ content: "", toId: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchMessages = useCallback(async (force = false) => {
        try {
            const res = await fetch("/api/messages");
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
                setUnreadCount(data.unread);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Use current user's agent ID
            const fromAgentId = user?.agent?.id;
            if (!fromAgentId) {
                showToast("Anda bukan agent, tidak bisa mengirim pesan", "error");
                setSubmitting(false);
                return;
            }
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, fromId: fromAgentId }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Message berhasil dikirim!", "success");
                setShowModal(false);
                setFormData({ content: "", toId: "" });
                invalidateCache("/api/messages");
                invalidateCache("/api/stats");
                fetchMessages(true);
            } else {
                showToast(data.error || "Gagal mengirim message", "error");
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
                    <h1 className="text-2xl font-bold mb-2">Secure Messages</h1>
                    <p className="text-zinc-500">Encrypted communications ({unreadCount} unread)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">+ New Message</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`card cursor-pointer transition-all ${!msg.read ? "border-green-500/30 bg-green-500/5" : ""} hover:border-green-500/50`}>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                                    <span className="text-black font-bold text-sm">{msg.fromAgent?.codename?.split(" ")[1]?.[0] || "?"}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{msg.fromAgent?.codename || "Unknown"}</span>
                                        <span className="text-xs text-zinc-500">{getRelativeTime(msg.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-zinc-400 truncate">{msg.content}</p>
                                </div>
                                {!msg.read && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-2 card flex items-center justify-center min-h-[400px]">
                    <div className="text-center text-zinc-500">
                        <p className="text-4xl mb-4">💬</p>
                        <p>Select a conversation to view messages</p>
                    </div>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Message">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">To Agent</label>
                        <select value={formData.toId} onChange={(e) => setFormData({ ...formData, toId: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required>
                            <option value="">Pilih agent...</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.codename}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Message</label>
                        <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-32 resize-none" placeholder="Tulis pesan..." required />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Mengirim..." : "Send Message"}
                    </button>
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
            case "messages":
                return <MessagesSection showToast={showToast} agents={agents} user={user} />;
            case "monitoring":
                return <MonitoringSection />;
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
