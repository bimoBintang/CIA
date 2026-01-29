"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

function NewsCard({ item, index, onClick }: { item: News; index: number; onClick: () => void }) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group cursor-pointer"
            onClick={onClick}
        >
            <div className="relative h-full rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden hover:border-green-500/50 transition-colors duration-300">
                {/* Glow Effect */}
                <motion.div
                    className="absolute -inset-1 bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                />

                {/* Cover Image */}
                {item.coverImage ? (
                    <div className="aspect-4/3 sm:aspect-video overflow-hidden">
                        <motion.img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                ) : (
                    <div className="aspect-4/3 sm:aspect-video bg-linear-to-br from-green-900/50 to-zinc-900 flex items-center justify-center">
                        <motion.span
                            className="text-4xl sm:text-5xl opacity-50"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                        >
                            {CATEGORY_ICONS[item.category] || "📰"}
                        </motion.span>
                    </div>
                )}

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-5">
                    {/* Category Badge */}
                    <motion.div
                        className="flex items-center gap-2 mb-2 sm:mb-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                    >
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            {CATEGORY_ICONS[item.category]} {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </span>
                    </motion.div>

                    {/* Title */}
                    <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                        {item.title}
                    </h3>

                    {/* Excerpt - hidden on very small mobile */}
                    <p className="hidden sm:block text-xs sm:text-sm text-zinc-500 line-clamp-2 mb-3">
                        {item.excerpt || item.content.substring(0, 80)}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-600">
                        <span className="truncate max-w-[80px] sm:max-w-none">{item.author?.codename || "Circle CIA"}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                    </div>
                </div>

                {/* Bottom Hover Indicator */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-green-500 to-emerald-500"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </motion.article>
    );
}

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
            <section id="news" className="py-16 sm:py-24 md:py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                        <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">
                            Latest <span className="text-gradient">News</span>
                        </h2>
                        <p className="section-subtitle text-sm sm:text-base mt-2 sm:mt-4">Berita dan informasi terbaru dari Circle CIA</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden animate-pulse">
                                <div className="aspect-4/3 sm:aspect-video bg-zinc-800" />
                                <div className="p-3 sm:p-4">
                                    <div className="h-3 bg-zinc-800 rounded w-16 mb-2" />
                                    <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
                                    <div className="h-3 bg-zinc-800 rounded w-2/3" />
                                </div>
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
        <section id="news" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-green-900/5 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <motion.div
                    className="text-center mb-8 sm:mb-12 md:mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">
                        Latest <span className="text-gradient">News</span>
                    </h2>
                    <p className="section-subtitle text-sm sm:text-base mt-2 sm:mt-4">
                        Berita dan informasi terbaru dari Circle CIA
                    </p>
                </motion.div>

                {/* Grid: 2 columns mobile, 3 columns tablet/desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {news.map((item, index) => (
                        <NewsCard
                            key={item.id}
                            item={item}
                            index={index}
                            onClick={() => setSelectedNews(item)}
                        />
                    ))}
                </div>
            </div>

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedNews(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-zinc-800"
                            onClick={e => e.stopPropagation()}
                        >
                            {selectedNews.coverImage && (
                                <motion.img
                                    src={selectedNews.coverImage}
                                    alt={selectedNews.title}
                                    className="w-full aspect-video object-cover rounded-t-2xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                />
                            )}
                            <div className="p-4 sm:p-6 md:p-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="flex flex-wrap items-center gap-2 mb-4"
                                >
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
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
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl sm:text-2xl md:text-3xl font-bold mb-4"
                                >
                                    {selectedNews.title}
                                </motion.h2>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="prose prose-invert max-w-none mb-6"
                                >
                                    <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-sm sm:text-base">
                                        {selectedNews.content}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center justify-between pt-4 border-t border-zinc-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                            <span className="text-black font-bold text-xs sm:text-sm">
                                                {(selectedNews.author?.codename || "C")[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm sm:text-base">{selectedNews.author?.codename || "Circle CIA"}</div>
                                            <div className="text-xs text-zinc-500">Author</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNews(null)}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
                                    >
                                        Tutup
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
