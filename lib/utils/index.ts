import { lazy } from "react";


// Helper function for relative time
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes}m lalu`;
    if (hours < 24) return `${hours}h lalu`;
    return `${days}d lalu`;
}


export const getLevelColor = (level: string) => {
    switch (level) {
        case "elite": return "from-yellow-500 to-orange-500";
        case "senior": return "from-purple-500 to-pink-500";
        case "field": return "from-blue-500 to-cyan-500";
        default: return "from-green-500 to-emerald-500";
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "online": return "text-green-400";
        case "away": return "text-yellow-400";
        default: return "text-zinc-500";
    }
};