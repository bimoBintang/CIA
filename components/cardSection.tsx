"use client";


export function StatCard({
    icon,
    label,
    value,
    change,
    changeType,
}: {
    icon: string;
    label: string;
    value: string | number;
    change: string;
    changeType: "up" | "down" | "neutral";
}) {
    return (
        <div className="card glass-hover p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-zinc-500 text-xs md:text-sm mb-1 truncate">{label}</p>
                    <p className="text-xl md:text-3xl font-bold">{value}</p>
                </div>
                <div className="text-xl md:text-3xl shrink-0">{icon}</div>
            </div>
            <div className={`mt-2 md:mt-4 text-xs md:text-sm truncate ${changeType === "up" ? "text-green-400" : changeType === "down" ? "text-red-400" : "text-zinc-500"}`}>
                {changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→"} {change}
            </div>
        </div>
    );
}