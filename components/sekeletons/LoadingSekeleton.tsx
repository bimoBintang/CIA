"use client";


export function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 border-2 border-green-500/30 rounded-full"></div>
                    <div className="absolute inset-3 border border-green-500/50 rounded-full"></div>
                    <div className="absolute inset-6 border border-green-500/70 rounded-full"></div>
                    <div className="absolute inset-[42%] bg-green-500 rounded-full animate-pulse"></div>
                    <div
                        className="absolute inset-0 origin-center"
                        style={{ animation: 'spin 2s linear infinite' }}
                    >
                        <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-linear-gradient-to-t from-green-500 to-transparent"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse"></div>
                </div>
                <div className="text-center">
                    <p className="text-green-400 font-mono text-lg tracking-widest animate-pulse">
                        ⌛ ACCESSING CLASSIFIED DATA
                    </p>
                    <p className="text-zinc-500 text-sm font-mono mt-2">
                        <span className="inline-block animate-pulse">█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.1s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.3s' }}>█</span>
                        <span className="text-green-400"> DECRYPTING </span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.5s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.6s' }}>█</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.7s' }}>█</span>
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['AGENTS', 'OPS', 'INTEL', 'COMMS'].map((label, i) => (
                    <div
                        key={i}
                        className="card border border-green-500/20 relative overflow-hidden"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    >
                        <div
                            className="absolute inset-0 bg-linear-gradient-to-t from-green-500/5 via-green-500/10 to-transparent"
                            style={{
                                animation: 'pulse 2s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`
                            }}
                        ></div>
                        <div className="relative z-10">
                            <p className="text-green-500/50 text-xs font-mono mb-1">[{label}]</p>
                            <div className="h-8 bg-zinc-800 rounded w-1/3 animate-pulse"></div>
                            <p className="text-zinc-600 text-xs font-mono mt-2">LOADING...</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

