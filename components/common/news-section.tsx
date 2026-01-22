"use client";

import { useState, useEffect } from "react";

interface News {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    category: string;
    author?: { codename: string };
    createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
    general: "📰",
    event: "🎉",
    announcement: "📢",
    update: "🔄",
};

export function NewsSection() {
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);

    useEffect(() => {
        async function fetchNews() {
            try {
                const res = await fetch("/api/news?limit=6");
                const data = await res.json();
                if (data.success) {
                    setNews(data.data);
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    if (loading) {
        return (
            <section id="news" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="section-title">
                            Latest <span className="text-gradient">News</span>
                        </h2>
                        <p className="section-subtitle">Berita dan informasi terbaru dari Circle CIA</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="aspect-video bg-zinc-800 rounded-lg mb-4" />
                                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (news.length === 0) {
        return null;
    }

    return (
        <section id="news" className="py-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="section-title">
                        Latest <span className="text-gradient">News</span>
                    </h2>
                    <p className="section-subtitle">
                        Berita dan informasi terbaru dari Circle CIA
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => (
                        <article
                            key={item.id}
                            className="card glass-hover cursor-pointer group overflow-hidden"
                            onClick={() => setSelectedNews(item)}
                        >
                            {/* Cover Image */}
                            {item.coverImage ? (
                                <div className="aspect-video rounded-lg overflow-hidden mb-4 -mx-5 -mt-5">
                                    <img
                                        src={item.coverImage}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video rounded-lg bg-gradient-to-br from-green-900/50 to-zinc-900 mb-4 -mx-5 -mt-5 flex items-center justify-center">
                                    <span className="text-5xl opacity-50">
                                        {CATEGORY_ICONS[item.category] || "📰"}
                                    </span>
                                </div>
                            )}

                            {/* Category Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                    {CATEGORY_ICONS[item.category]} {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                </span>
                            </div>

                            {/* Title & Excerpt */}
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                                {item.excerpt || item.content.substring(0, 100)}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center justify-between text-xs text-zinc-600">
                                <span>{item.author?.codename || "Circle CIA"}</span>
                                <span>{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {/* News Detail Modal */}
            {selectedNews && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedNews(null)}
                >
                    <div
                        className="bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-zinc-800"
                        onClick={e => e.stopPropagation()}
                    >
                        {selectedNews.coverImage && (
                            <img
                                src={selectedNews.coverImage}
                                alt={selectedNews.title}
                                className="w-full aspect-video object-cover rounded-t-2xl"
                            />
                        )}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                    {CATEGORY_ICONS[selectedNews.category]} {selectedNews.category.charAt(0).toUpperCase() + selectedNews.category.slice(1)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {new Date(selectedNews.createdAt).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })}
                                </span>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold mb-4">{selectedNews.title}</h2>

                            <div className="prose prose-invert max-w-none mb-6">
                                <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                                    {selectedNews.content}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <span className="text-black font-bold text-sm">
                                            {(selectedNews.author?.codename || "C")[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium">{selectedNews.author?.codename || "Circle CIA"}</div>
                                        <div className="text-xs text-zinc-500">Author</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
