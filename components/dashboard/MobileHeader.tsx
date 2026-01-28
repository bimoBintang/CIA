"use client";

import { User } from "@/types";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/roles";
import Link from "next/link";

interface MobileHeaderProps {
    user: User | null;
    onMenuClick: () => void;
    title?: string;
}

export function MobileHeader({ user, onMenuClick, title = "Dashboard" }: MobileHeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 glass border-b border-zinc-800/50 z-50 px-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-black font-bold text-sm">C</span>
                </div>
                <span className="font-semibold text-sm">{title}</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                {/* User Avatar */}
                <button
                    onClick={onMenuClick}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-black font-bold text-xs">
                            {user?.name?.[0]?.toUpperCase() || "?"}
                        </span>
                    </div>
                    <div className="hidden xs:block text-left">
                        <p className="text-xs font-medium truncate max-w-[80px]">
                            {user?.agent?.codename || user?.name || "Guest"}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${user?.role ? ROLE_COLORS[user.role] : "bg-zinc-700 text-zinc-400"}`}>
                            {user?.role ? ROLE_LABELS[user.role] : "Unknown"}
                        </span>
                    </div>
                </button>
            </div>
        </header>
    );
}
