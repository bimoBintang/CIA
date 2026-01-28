"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchWithCache, invalidateCache } from "@/lib/cache";
import { ShowToast } from "../toast";
import { type Operation } from "@/types";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";
import { Modal } from "../modalSection";

interface Props {
    showToast: ShowToast;
}

export default function OperationsSection({ showToast }: Props) {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOp, setSelectedOp] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", deadline: "", teamSize: 1, priority: "medium" });
    const [submitting, setSubmitting] = useState(false);

    const fetchOperations = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<Operation[]>("/api/operations", { force });
            if (result.data) setOperations(result.data);
        } catch (error) {
            console.error("Error fetching operations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOperations();
    }, [fetchOperations]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/operations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Operation berhasil dibuat!", "success");
                setShowModal(false);
                setFormData({ name: "", description: "", deadline: "", teamSize: 1, priority: "medium" });
                invalidateCache("/api/operations");
                invalidateCache("/api/stats");
                fetchOperations(true);
            } else {
                showToast(data.error || "Gagal membuat operation", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "active": return { bg: "bg-green-500/20", text: "text-green-400", icon: "🟢" };
            case "planning": return { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "🟡" };
            case "completed": return { bg: "bg-blue-500/20", text: "text-blue-400", icon: "✅" };
            default: return { bg: "bg-zinc-500/20", text: "text-zinc-400", icon: "⚪" };
        }
    };

    const getPriorityStyles = (priority: string = "medium") => {
        switch (priority) {
            case "high": return { bg: "bg-red-500/20", text: "text-red-400", label: "🔴 High" };
            case "medium": return { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "🟡 Medium" };
            default: return { bg: "bg-blue-500/20", text: "text-blue-400", label: "🔵 Low" };
        }
    };

    const getDaysRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return { text: `${Math.abs(days)} hari lewat`, color: "text-red-400" };
        if (days === 0) return { text: "Hari ini!", color: "text-yellow-400" };
        if (days <= 3) return { text: `${days} hari lagi`, color: "text-yellow-400" };
        return { text: `${days} hari lagi`, color: "text-zinc-400" };
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg md:text-2xl font-bold mb-1">🎯 Operations</h1>
                    <p className="text-zinc-500 text-sm">Track and manage ongoing operations ({operations.length} total)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ New Operation</button>
            </div>

            {operations.length === 0 ? (
                <div className="card text-center py-12 md:py-16">
                    <p className="text-4xl md:text-5xl mb-4">🎯</p>
                    <p className="text-zinc-400 text-sm">Belum ada operation aktif</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">Buat Operation Pertama</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {operations.map((op) => {
                        const statusStyles = getStatusStyles(op.status);
                        const priorityStyles = getPriorityStyles(op.priority);
                        const daysInfo = getDaysRemaining(op.deadline);
                        const isExpanded = selectedOp === op.id;

                        return (
                            <div
                                key={op.id}
                                className={`card glass-hover cursor-pointer transition-all duration-300 p-3 md:p-4 ${isExpanded ? 'ring-1 ring-green-500/50 col-span-1 sm:col-span-2' : ''}`}
                                onClick={() => setSelectedOp(isExpanded ? null : op.id)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm md:text-lg truncate">{op.name}</h3>
                                        <p className="text-zinc-500 text-xs md:text-sm">{op.teamSize} agents</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${priorityStyles.bg} ${priorityStyles.text}`}>
                                            {op.priority?.toUpperCase() || "MED"}
                                        </span>
                                        <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${statusStyles.bg} ${statusStyles.text}`}>
                                            {statusStyles.icon}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-zinc-400">Progress</span>
                                        <span className="text-green-400">{op.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-linear-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${op.progress}%` }} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">
                                        📅 {new Date(op.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className={daysInfo.color}>{daysInfo.text}</span>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                                        <div>
                                            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">📝 Description</h4>
                                            <div className="bg-zinc-900/50 rounded-lg p-4 text-zinc-300">
                                                {op.description ? (
                                                    <p className="whitespace-pre-wrap">{op.description}</p>
                                                ) : (
                                                    <p className="text-zinc-500 italic">Tidak ada deskripsi</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-green-400">{op.progress}%</p>
                                                <p className="text-xs text-zinc-500">Progress</p>
                                            </div>
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-blue-400">{op.teamSize}</p>
                                                <p className="text-xs text-zinc-500">Team Size</p>
                                            </div>
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className={`text-2xl font-bold ${statusStyles.text}`}>{statusStyles.icon}</p>
                                                <p className="text-xs text-zinc-500">{op.status}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                                <p className={`text-2xl font-bold ${priorityStyles.text}`}>{op.priority?.[0]?.toUpperCase() || "M"}</p>
                                                <p className="text-xs text-zinc-500">Priority</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-xs text-zinc-500">
                                            <div>
                                                <span className="text-zinc-600">Created:</span>{" "}
                                                <span className="text-zinc-300">{op.createdAt ? new Date(op.createdAt).toLocaleString("id-ID") : "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">ID:</span>{" "}
                                                <span className="text-zinc-400 font-mono">{op.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Operation">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Operation Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Operation Phoenix" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-24 resize-none" placeholder="Deskripsi operation..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                                <option value="low">🔵 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Team Size</label>
                            <input type="number" min={1} value={formData.teamSize} onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Deadline</label>
                        <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" required />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Membuat..." : "🎯 Create Operation"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
