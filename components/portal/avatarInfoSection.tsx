"use client";

import { getLevelColor, getStatusColor } from "@/lib/utils";

export function AvatarInfoSection({agent}: {agent: {codename: string, level: string, status: string}}) {
    return (
       <div className="flex items-end gap-6 mb-6">
            <div className={`w-32 h-32 rounded-2xl bg-linear-to-br ${getLevelColor(agent?.level || '')} flex items-center justify-center border-4 border-zinc-900`}>
                <span className="text-5xl font-bold text-black">{agent?.codename[0]}</span>
            </div>
            <div className="pb-2">
                <h1 className="text-3xl font-bold">{agent?.codename}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`text-sm ${getStatusColor(agent?.status || '')}`}>
                        ● {agent?.status.charAt(0).toUpperCase() || '' + agent?.status.slice(1) || ''}
                    </span>
                    <span className="text-sm text-zinc-500">•</span>
                    <span className="text-sm text-zinc-400 capitalize">{agent?.level} Agent</span>
                </div>
            </div>
        </div>
    );
}