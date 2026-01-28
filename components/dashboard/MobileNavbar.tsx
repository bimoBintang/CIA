"use client";

import { ROLE_PERMISSIONS, type Role } from "@/lib/roles";

interface NavItem {
    id: string;
    label: string;
    icon: string;
}

interface MobileNavbarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    role: Role;
    onMoreClick: () => void;
}

export function MobileNavbar({ activeTab, setActiveTab, role, onMoreClick }: MobileNavbarProps) {
    const permissions = ROLE_PERMISSIONS[role];

    // Essential menu items for mobile (max 4 + More button)
    const essentialItems: NavItem[] = [
        { id: "overview", label: "Overview", icon: "📊" },
    ];

    if (permissions.canViewOperations) {
        essentialItems.push({ id: "operations", label: "Ops", icon: "🎯" });
    }
    if (permissions.canViewIntel) {
        essentialItems.push({ id: "intel", label: "Intel", icon: "📡" });
    }
    if (permissions.canViewMessages) {
        essentialItems.push({ id: "news", label: "News", icon: "📰" });
    }

    // Limit to 4 items to leave room for More button
    const displayItems = essentialItems.slice(0, 4);

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 glass border-t border-zinc-800/50 z-50 px-2 safe-area-bottom">
            <div className="flex items-center justify-around h-full max-w-md mx-auto">
                {displayItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-all ${activeTab === item.id
                                ? "text-green-400"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        <span className={`text-xl mb-0.5 ${activeTab === item.id ? "scale-110" : ""} transition-transform`}>
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {activeTab === item.id && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-400" />
                        )}
                    </button>
                ))}

                {/* More Button */}
                <button
                    onClick={onMoreClick}
                    className="flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-all text-zinc-400 hover:text-zinc-200"
                >
                    <span className="text-xl mb-0.5">☰</span>
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </div>
        </nav>
    );
}
