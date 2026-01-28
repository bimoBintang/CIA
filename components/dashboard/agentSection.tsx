"use client";

import { fetchWithCache, invalidateCache } from "@/lib/cache";
import { Agent, User } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "../modalSection";
import { LoadingSkeleton } from "../sekeletons/LoadingSekeleton";


export function AgentsSection({ showToast, onAgentCreated, user }: { showToast: (msg: string, type: "success" | "error") => void; onAgentCreated?: () => void; user: User | null }) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ codename: "", email: "", password: "", faculty: "", level: "Junior", role: "AGENT" });
    const [submitting, setSubmitting] = useState(false);
    const isAdmin = user?.role === "ADMIN";

    const fetchAgents = useCallback(async (force = false) => {
        try {
            const result = await fetchWithCache<Agent[]>("/api/agents", { force });
            if (result.data) setAgents(result.data);
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Create agent first
            const agentRes = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    codename: formData.codename,
                    email: formData.email,
                    faculty: formData.faculty,
                    level: formData.level
                }),
            });
            const agentData = await agentRes.json();

            if (!agentData.success) {
                showToast(agentData.error || "Gagal membuat agent", "error");
                setSubmitting(false);
                return;
            }

            // 2. Create user account linked to agent
            const userRes = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.codename,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    agentId: agentData.data.id,
                }),
            });
            const userData = await userRes.json();

            if (userData.success) {
                showToast("Agent & akun berhasil dibuat!", "success");
                setShowModal(false);
                setFormData({ codename: "", email: "", password: "", faculty: "", level: "Junior", role: "AGENT" });
                invalidateCache("/api/agents");
                invalidateCache("/api/stats");
                fetchAgents(true);
                onAgentCreated?.();
            } else {
                showToast(userData.error || "Agent dibuat tapi akun gagal", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Agents Directory</h1>
                    <p className="text-zinc-500">Manage and monitor all registered agents ({agents.length} total)</p>
                </div>
                {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Agent</button>}
            </div>

            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Agent</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Faculty</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Status</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Level</th>
                            <th className="text-left py-4 px-4 text-zinc-400 font-medium">Missions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map((agent) => (
                            <tr key={agent.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                            <span className="text-black font-bold text-sm">{agent.codename.split(" ")[1]?.[0] || "A"}</span>
                                        </div>
                                        <span className="font-medium">{agent.codename}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-zinc-400">{agent.faculty}</td>
                                <td className="py-4 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${agent.status === "online" ? "bg-green-500/20 text-green-400" : agent.status === "away" ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "online" ? "bg-green-400" : agent.status === "away" ? "bg-yellow-400" : "bg-zinc-400"}`} />
                                        {agent.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`text-xs px-2 py-1 rounded ${agent.level === "Senior" ? "bg-purple-500/20 text-purple-400" : agent.level === "Intermediate" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                                        {agent.level}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-zinc-400">{agent.missions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Agent & Account">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Codename</label>
                        <input type="text" value={formData.codename} onChange={(e) => setFormData({ ...formData, codename: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Agent Nova" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="nova@circle-cia.id" required />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Password</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Min 8 char, 1 uppercase, 1 number" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Faculty</label>
                            <input type="text" value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none" placeholder="Fakultas Teknik" required />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Level</label>
                            <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                                <option value="Junior">Junior</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Senior">Senior</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none">
                            <option value="AGENT">Agent</option>
                            <option value="SENIOR_AGENT">Senior Agent</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Membuat akun..." : "Create Agent & Account"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}