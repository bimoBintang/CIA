"use client";

import { Suspense, useState } from "react";
import { User, Agent } from "@/types";
import { type Role } from "@/lib/roles";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";
import { Toast } from "../toast";
import { MobileHeader } from "./MobileHeader";
import { MobileNavbar } from "./MobileNavbar";
import { MobileDrawer } from "./MobileDrawer";

// Section imports
import { OverviewSection } from "./overviewSection";
import { AgentsSection } from "./agentSection";
import OperationsSection from "./OperationsSection";
import IntelSection from "./IntelSection";
import NewsSection from "./NewsSection";
import AlbumsSection from "./AlbumsSection";
import { SettingsSection } from "./settingSection";

interface MobileDashboardProps {
    user: User | null;
    agents: Agent[];
    onLogout: () => void;
    onAgentCreated: () => void;
}

export function MobileDashboard({ user, agents, onLogout, onAgentCreated }: MobileDashboardProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const role = (user?.role || 'VIEWER') as Role;

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
    };

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewSection onNavigate={setActiveTab} />;
            case "agents":
                return <AgentsSection showToast={showToast} onAgentCreated={onAgentCreated} user={user} />;
            case "operations":
                return <OperationsSection showToast={showToast} />;
            case "intel":
                return <IntelSection showToast={showToast} agents={agents} />;
            case "news":
                return <NewsSection showToast={showToast} />;
            case "gallery":
                return <AlbumsSection showToast={showToast} />;
            case "settings":
                return <SettingsSection />;
            default:
                return <OverviewSection onNavigate={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <MobileHeader
                user={user}
                onMenuClick={() => setDrawerOpen(true)}
                title="Dashboard"
            />

            {/* Main Content with padding for header and navbar */}
            <main className="pt-14 pb-20 px-4 min-h-screen">
                <Suspense fallback={<LoadingSkeleton />}>
                    {renderContent()}
                </Suspense>
            </main>

            {/* Bottom Navigation */}
            <MobileNavbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                role={role}
                onMoreClick={() => setDrawerOpen(true)}
            />

            {/* Side Drawer */}
            <MobileDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onLogout={onLogout}
            />

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
