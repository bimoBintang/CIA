"use client";

import { useEffect } from "react";

// Toast type
export type ShowToast = (msg: string, type: "success" | "error") => void;

export function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in-up ${type === "success" ? "bg-green-500/90" : "bg-red-500/90"
                }`}
        >
            <p className="text-white font-medium">{message}</p>
        </div>
    );
}