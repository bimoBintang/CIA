"use client";

import { News } from '@/types';
import React, { useState, useEffect, useCallback } from 'react';



interface NewsSectionProps {
    showToast: (msg: string, type: "success" | "error") => void;
}

const CATEGORIES = [
    { id: 'general', label: 'General', icon: '📰' },
    { id: 'event', label: 'Event', icon: '🎉' },
    { id: 'announcement', label: 'Announcement', icon: '📢' },
    { id: 'update', label: 'Update', icon: '🔄' },
];

export default function NewsSection({ showToast }: NewsSectionProps) {
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: 'general',
        published: false,
    });
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const fetchNews = useCallback(async () => {
        try {
            const res = await fetch('/api/news?all=true');
            const data = await res.json();
            if (data.success) setNews(data.data);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('content', formData.content);
            formDataToSend.append('excerpt', formData.excerpt);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('published', formData.published.toString());
            if (coverImage) {
                formDataToSend.append('coverImage', coverImage);
            }

            const res = await fetch('/api/news', {
                method: 'POST',
                body: formDataToSend,
            });
            const data = await res.json();

            if (data.success) {
                showToast('Berita berhasil dibuat!', 'success');
                setShowModal(false);
                setFormData({ title: '', content: '', excerpt: '', category: 'general', published: false });
                setCoverImage(null);
                fetchNews();
            } else {
                showToast(data.error || 'Gagal membuat berita', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleTogglePublish(newsItem: News) {
        try {
            const res = await fetch(`/api/news/${newsItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: !newsItem.published }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(newsItem.published ? 'Berita di-unpublish' : 'Berita dipublish!', 'success');
                fetchNews();
            }
        } catch {
            showToast('Gagal mengubah status', 'error');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Hapus berita ini?')) return;

        try {
            const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Berita dihapus', 'success');
                setSelectedNews(null);
                fetchNews();
            }
        } catch {
            showToast('Gagal menghapus berita', 'error');
        }
    }

    const getCategoryInfo = (category: string) => {
        return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
    };

    const filteredNews = filter === 'all'
        ? news
        : news.filter(n => n.category === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg md:text-2xl font-bold mb-1">📰 Berita</h1>
                    <p className="text-zinc-500 text-sm">Kelola berita dan pengumuman ({news.length} artikel)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
                    + Buat Berita
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === 'all' ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    Semua
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === cat.id ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            {/* News Grid */}
            {filteredNews.length === 0 ? (
                <div className="card text-center py-16">
                    <p className="text-5xl mb-4">📰</p>
                    <p className="text-zinc-400">Belum ada berita</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
                        Buat Berita Pertama
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {filteredNews.map(item => {
                        const catInfo = getCategoryInfo(item.category);
                        return (
                            <div
                                key={item.id}
                                className="card glass-hover cursor-pointer group p-2 md:p-4"
                                onClick={() => setSelectedNews(item)}
                            >
                                {/* Cover Image */}
                                {item.coverImage ? (
                                    <div className="aspect-video rounded-lg overflow-hidden mb-2 md:mb-4 -mx-2 -mt-2 md:-mx-5 md:-mt-5">
                                        <img
                                            src={item.coverImage}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-lg bg-linear-gradient-to-br from-zinc-800 to-zinc-900 mb-2 md:mb-4 -mx-2 -mt-2 md:-mx-5 md:-mt-5 flex items-center justify-center">
                                        <span className="text-2xl md:text-4xl">{catInfo.icon}</span>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex items-center gap-1 mb-1 md:mb-2 flex-wrap">
                                    <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${item.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {item.published ? '✓' : '⏳'}
                                    </span>
                                    <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-zinc-800 text-zinc-400">
                                        {catInfo.icon}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-xs md:text-lg mb-1 md:mb-2 line-clamp-2">{item.title}</h3>
                                <p className="text-[10px] md:text-sm text-zinc-500 line-clamp-2 mb-2 md:mb-3 hidden sm:block">
                                    {item.excerpt || item.content.substring(0, 100)}
                                </p>

                                <div className="flex items-center justify-between text-[10px] md:text-xs text-zinc-500">
                                    <span className="truncate">{item.author?.codename || 'Unknown'}</span>
                                    <span className="hidden sm:inline">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* News Detail Modal */}
            {selectedNews && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedNews(null)}>
                    <div
                        className="bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {selectedNews.coverImage && (
                            <img src={selectedNews.coverImage} alt={selectedNews.title} className="w-full aspect-video object-cover rounded-t-2xl" />
                        )}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-xs px-2 py-1 rounded ${selectedNews.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {selectedNews.published ? '✓ Published' : '⏳ Draft'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                                    {getCategoryInfo(selectedNews.category).icon} {getCategoryInfo(selectedNews.category).label}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2>

                            <div className="prose prose-invert max-w-none mb-6">
                                <p className="whitespace-pre-wrap text-zinc-300">{selectedNews.content}</p>
                            </div>

                            <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-800 pt-4">
                                <div>
                                    <span>By {selectedNews.author?.codename || 'Unknown'}</span>
                                    <span className="mx-2">•</span>
                                    <span>{new Date(selectedNews.createdAt).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleTogglePublish(selectedNews)}
                                        className={`px-4 py-2 rounded-lg text-sm ${selectedNews.published
                                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            }`}
                                    >
                                        {selectedNews.published ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedNews.id)}
                                        className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create News Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div
                        className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">📰 Buat Berita Baru</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Judul</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none"
                                    placeholder="Judul berita..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Cover Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setCoverImage(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Ringkasan (Excerpt)</label>
                                <input
                                    type="text"
                                    value={formData.excerpt}
                                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none"
                                    placeholder="Ringkasan singkat... (opsional)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Konten</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none h-40 resize-none"
                                    placeholder="Isi berita..."
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="published"
                                    checked={formData.published}
                                    onChange={e => setFormData({ ...formData, published: e.target.checked })}
                                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
                                />
                                <label htmlFor="published" className="text-sm text-zinc-400">
                                    Langsung publish (tampil di halaman utama)
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? 'Menyimpan...' : '📰 Buat Berita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
