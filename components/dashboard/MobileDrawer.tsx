"use client";

import { User } from "@/types";
import { ROLE_PERMISSIONS, ROLE_COLORS, ROLE_LABELS, type Role } from "@/lib/roles";
import Link from "next/link";
import { useEffect } from "react";

interface MenuItem {
    id: string;
    label: string;
    icon: string;
    permission: keyof typeof ROLE_PERMISSIONS.ADMIN | null;
}

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: User | null;
    onLogout: () => void;
}

export function MobileDrawer({ isOpen, onClose, activeTab, setActiveTab, user, onLogout }: MobileDrawerProps) {
    const role = (user?.role || 'VIEWER') as Role;
    const permissions = ROLE_PERMISSIONS[role];

    // All menu items with permissions
    const allMenuItems: MenuItem[] = [
        { id: "overview", label: "Overview", icon: "📊", permission: null },
        { id: "agents", label: "Agents", icon: "🕵️", permission: "canViewAgents" },
        { id: "operations", label: "Operations", icon: "🎯", permission: "canViewOperations" },
        { id: "intel", label: "Intel Feed", icon: "📡", permission: "canViewIntel" },
        { id: "news", label: "Berita", icon: "📰", permission: "canViewMessages" },
        { id: "gallery", label: "Gallery", icon: "📸", permission: "canViewOperations" },
        { id: "settings", label: "Settings", icon: "⚙️", permission: "canAccessSettings" },
    ];

    const menuItems = allMenuItems.filter(item =>
        !item.permission || permissions[item.permission]
    );

    // Close drawer on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-72 glass border-l border-zinc-800/50 z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800/50">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <span className="text-black font-bold text-sm">C</span>
                            </div>
                            <span className="font-semibold text-gradient">Circle CIA</span>
                        </Link>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-zinc-800/50 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* User Profile Card */}
                <div className="p-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-black font-bold">
                                    {user?.name?.[0]?.toUpperCase() || "?"}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                                {user?.agent?.codename || user?.name || "Guest"}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                            <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${user?.role ? ROLE_COLORS[user.role] : "bg-zinc-700 text-zinc-400"}`}>
                                {user?.role ? ROLE_LABELS[user.role] : "Unknown"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="p-2 flex-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
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

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800/50 safe-area-bottom">
                    <button
                        onClick={onLogout}
                        className="w-full py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>
        </>
    );
}
