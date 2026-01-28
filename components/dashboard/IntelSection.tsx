"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchWithCache, invalidateCache } from "@/lib/cache";
import { ShowToast } from "../toast";
import { getRelativeTime } from "@/lib/utils";
import { Intel } from "@/types";
import { Agent } from "@/types";
import { Modal } from "../modalSection";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";


interface Props {
    showToast: ShowToast;
    agents: Agent[];
}

export default function IntelSection({ showToast, agents }: Props) {
    const [intel, setIntel] = useState<Intel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedIntel, setSelectedIntel] = useState<Intel | null>(null);
    const [formData, setFormData] = useState({ title: "", content: "", priority: "medium", sourceId: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchIntel = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<Intel[]>("/api/intel", { force });
            if (result.data) setIntel(result.data);
        } catch (error) {
            console.error("Error fetching intel:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIntel();
    }, [fetchIntel]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/intel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Intel report berhasil dikirim!", "success");
                setShowModal(false);
                setFormData({ title: "", content: "", priority: "medium", sourceId: "" });
                invalidateCache("/api/intel");
                invalidateCache("/api/stats");
                fetchIntel(true);
            } else {
                showToast(data.error || "Gagal mengirim intel", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "high":
                return { dot: "bg-red-500 animate-pulse", badge: "bg-red-500/20 text-red-400", icon: "🔴" };
            case "medium":
                return { dot: "bg-yellow-500", badge: "bg-yellow-500/20 text-yellow-400", icon: "🟡" };
            default:
                return { dot: "bg-blue-500", badge: "bg-blue-500/20 text-blue-400", icon: "🔵" };
        }
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">📡 Intel Feed</h1>
                    <p className="text-zinc-500">Latest intelligence reports from the field ({intel.length} reports)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">+ Submit Intel</button>
            </div>

            {intel.length === 0 ? (
                <div className="card text-center py-16">
                    <p className="text-5xl mb-4">📡</p>
                    <p className="text-zinc-400">Belum ada intel report</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Submit Intel Pertama</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {intel.map((item) => {
                        const styles = getPriorityStyles(item.priority);
                        const isExpanded = selectedIntel?.id === item.id;

                        return (
                            <div
                                key={item.id}
                                className={`card glass-hover cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-1 ring-green-500/50' : ''}`}
                                onClick={() => setSelectedIntel(isExpanded ? null : item)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{item.title}</h3>
                                        <p className="text-sm text-zinc-500">
                                            {styles.icon} {item.source?.codename || "Unknown"} • {getRelativeTime(item.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${styles.badge}`}>
                                        {item.priority.toUpperCase()}
                                    </span>
                                    <span className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                                        <div>
                                            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">📝 Detail Report</h4>
                                            <div className="bg-zinc-900/50 rounded-lg p-4 text-zinc-300">
                                                {item.content ? (
                                                    <p className="whitespace-pre-wrap">{item.content}</p>
                                                ) : (
                                                    <p className="text-zinc-500 italic">Tidak ada detail tambahan</p>
                                                )}
                                            </div>
                                        </div>

                                        {item.attachments && item.attachments.length > 0 && (
                                            <div>
                                                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">📎 Attachments</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.attachments.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1 bg-zinc-800 rounded-lg text-sm text-green-400 hover:bg-zinc-700 transition-colors"
                                                        >
                                                            File {idx + 1} ↗
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 text-xs text-zinc-500">
                                            <div>
                                                <span className="text-zinc-600">Source:</span> <span className="text-zinc-300">{item.source?.codename || "Unknown"}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">Date:</span> <span className="text-zinc-300">{new Date(item.createdAt).toLocaleString("id-ID")}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">ID:</span> <span className="text-zinc-400 font-mono">{item.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Intel Report">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Title</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Judul intel..." required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Content</label>
                        <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-32 resize-none" placeholder="Detail intel report..." />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Priority</label>
                        <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                            <option value="low">🔵 Low - Informasi umum</option>
                            <option value="medium">🟡 Medium - Perlu perhatian</option>
                            <option value="high">🔴 High - Urgent / Kritis</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Source Agent</label>
                        <select value={formData.sourceId} onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required>
                            <option value="">Pilih agent...</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.codename}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Mengirim..." : "📡 Submit Intel"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
