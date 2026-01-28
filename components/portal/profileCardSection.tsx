"use client";

import { Agent } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";
import Link from "next/link";
import { PortalStateSection } from "./portalStateSection";
import { PortalInfoSection } from "./portalInfoSection";
import { getLevelColor } from "@/lib/utils";
import { AvatarInfoSection } from "./avatarInfoSection";


export function ProfileCardSection() {
    const params = useParams();
    const agentId = params.id;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await fetch(`/api/agents/${agentId}`);
                const data = await response.json();
                setAgent(data);
            } catch (error) {
                setError('Failed to fetch agent data');
            } finally {
                setLoading(false);
            }
        };
        if(agentId) fetchAgent();
    }, [agentId]);
    
   

    if(loading) return <LoadingSkeleton />;

    if(error || !agent) {
        <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🕵️</div>
                    <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
                    <p className="text-zinc-500 mb-6">{error}</p>
                    <Link href="/" className="btn-primary px-6 py-3">
                        ← Back to Home
                    </Link>
                </div>
            </div>
    }

    return (
        <main className="max-w-4xl mx-auto px-6 py-12">
            <div className="card border border-zinc-700">
                {/* Cover gradient */}
                <div className={`h-32 rounded-t-xl bg-linear-to-r ${getLevelColor(agent?.level || '')} opacity-50`}></div>

                {/* Avatar and Info */}
                <div className="px-8 pb-8 -mt-16 relative">
                    <AvatarInfoSection agent={agent!} />

                    {/* Stats */}
                    <PortalStateSection agent={agent!} />

                    {/* Info */}
                    <PortalInfoSection agent={agent!} />
                </div>
            </div>
        </main>
    );
}