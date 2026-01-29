"use client";

import { Agent, User } from "@/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";
import { AgentsSection } from "./agentSection";
import AlbumsSection from "./AlbumsSection";
import DeviceTrackingSection from "./DeviceTrackingSection";
import IntelSection from "./IntelSection";
import NewsSection from "./NewsSection";
import OperationsSection from "./OperationsSection";
import { OverviewSection } from "./overviewSection";
import SecuritySection from "./SecuritySection";
import { SettingsSection } from "./settingSection";
import { Sidebar } from "./sidebarSection";
import { Toast } from "../toast";
import { MobileDashboard } from "./MobileDashboard";
import { useIsMobile } from "@/hooks/useMediaQuery";

export function DashboardSection() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    // Derive activeTab from URL search params (?tab=...)
    const activeTab = searchParams.get("tab") || "overview";
    const selectedId = searchParams.get("id") || "";

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const setActiveTab = useCallback((tab: string, id?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const currentTab = params.get("tab") || "overview";
        const currentId = params.get("id") || "";

        // Guard: Only push if something actually changed
        if (tab === currentTab && (id === undefined || id === currentId)) {
            return;
        }

        params.set("tab", tab);

        if (id) {
            params.set("id", id);
        } else {
            params.delete("id");
            params.delete("create");
        }

        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

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
            const host = window.location.hostname;
            const isProduction = host.endsWith("ciaa.web.id");
            const baseDomain = isProduction ? "ciaa.web.id" : "localhost:3000";
            const protocol = isProduction ? "https" : "http";
            window.location.href = `${protocol}://auth.${baseDomain}/login`;
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    // Mobile Layout
    if (isMobile) {
        return (
            <MobileDashboard
                user={user}
                agents={agents}
                onLogout={handleLogout}
                onAgentCreated={fetchAgents}
            />
        );
    }

    // Desktop Layout
    return (
        <div className="min-h-screen bg-background">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
            <main className="ml-64 p-8">
                <Suspense fallback={<LoadingSkeleton />}>
                    <DashboardContent
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        showToast={showToast}
                        fetchAgents={fetchAgents}
                        user={user}
                        agents={agents}
                    />
                </Suspense>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

function DashboardContent({ activeTab, setActiveTab, showToast, fetchAgents, user, agents }: any) {
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
            return <AlbumsSection showToast={showToast} />;
        case "settings":
            return <SettingsSection user={user} />;
        default:
            return <OverviewSection onNavigate={setActiveTab} />;
    }
}