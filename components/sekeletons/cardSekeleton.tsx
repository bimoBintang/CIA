"use client";


export function ChartSkeleton() {
    return (
        <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse bg-zinc-800 rounded-lg w-full h-full" />
        </div>
    );
}