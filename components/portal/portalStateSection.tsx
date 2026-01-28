"use client";

export function PortalStateSection({ agent }: { agent: { missions: number; faculty: string; level: string } }) {
    return (
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                <p className="text-3xl font-bold text-green-400">{agent?.missions}</p>
                <p className="text-sm text-zinc-500">Missions</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                <p className="text-3xl font-bold text-blue-400">{agent?.faculty}</p>
                <p className="text-sm text-zinc-500">Faculty</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                <p className="text-3xl font-bold text-purple-400 capitalize">{agent?.level}</p>
                <p className="text-sm text-zinc-500">Level</p>
            </div>
        </div>
    );
}
