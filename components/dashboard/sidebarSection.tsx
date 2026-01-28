"use client";

import { User } from "@/types";
import { ROLE_PERMISSIONS, ROLE_COLORS, ROLE_LABELS, type Role } from "@/lib/roles";
import Link from "next/link";

export function Sidebar({ activeTab, setActiveTab, user, onLogout }: {
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
                    <div className="w-10 h-10 rounded-lg bg-linear-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse-glow">
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