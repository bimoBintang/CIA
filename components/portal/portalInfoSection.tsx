"use client";

export function PortalInfoSection({agent}: {agent: {id: string; createdAt: string}}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                <span className="text-zinc-400">Member Since</span>
                <span className="font-medium">{new Date(agent?.createdAt || '').toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                <span className="text-zinc-400">Agent ID</span>
                <span className="font-mono text-sm text-zinc-500">{agent?.id}</span>
            </div>
        </div>
    );
}
