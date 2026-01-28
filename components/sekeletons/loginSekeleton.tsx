"use client";

export function LoginLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-500 font-mono">Loading...</p>
            </div>
        </div>
    );
}