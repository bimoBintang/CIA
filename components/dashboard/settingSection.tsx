"use client";

import { User } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface SettingsSectionProps {
    user?: User | null;
}

export function SettingsSection({ user: initialUser }: SettingsSectionProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<User | null>(initialUser || null);
    const [loading, setLoading] = useState(!initialUser);
    const [uploading, setUploading] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!initialUser) {
            async function fetchUser() {
                try {
                    const res = await fetch("/api/auth/me");
                    const data = await res.json();
                    if (data.success) setUser(data.data);
                } catch (error) {
                    console.error("Error fetching user:", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchUser();
        }
    }, [initialUser]);

    const showMessage = (text: string, type: "success" | "error") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            showMessage("File harus berupa gambar", "error");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage("Ukuran file maksimal 5MB", "error");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch("/api/users/profile-image", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                setUser((prev) => prev ? { ...prev, profileImage: data.data.profileImage } : null);
                showMessage("Foto profil berhasil diupdate!", "success");
            } else {
                showMessage(data.error || "Gagal upload foto", "error");
            }
        } catch {
            showMessage("Terjadi kesalahan", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!confirm("Hapus foto profil?")) return;

        setUploading(true);
        try {
            const res = await fetch("/api/users/profile-image", { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                setUser((prev) => prev ? { ...prev, profileImage: null } : null);
                showMessage("Foto profil dihapus", "success");
            } else {
                showMessage(data.error || "Gagal menghapus foto", "error");
            }
        } catch {
            showMessage("Terjadi kesalahan", "error");
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend validation
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showMessage("Password baru tidak sama dengan konfirmasi", "error");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            showMessage("Password minimal 8 karakter", "error");
            return;
        }

        setChangingPassword(true);
        try {
            const res = await fetch("/api/users/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(passwordForm),
            });
            const data = await res.json();

            if (data.success) {
                showMessage(data.message || "Password berhasil diubah! Silakan login kembali.", "success");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                // Redirect to login after 2 seconds
                setTimeout(() => router.push("/login"), 2000);
            } else {
                showMessage(data.error || "Gagal mengubah password", "error");
            }
        } catch {
            showMessage("Terjadi kesalahan", "error");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-zinc-500">Manage your account and preferences</p>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Image Card */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">📸 Profile Image</h3>
                    <div className="flex items-center gap-6">
                        {/* Avatar Preview */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-black font-bold text-3xl">
                                        {user?.name?.[0]?.toUpperCase() || "?"}
                                    </span>
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                                </div>
                            )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-3">
                            <p className="text-sm text-zinc-400">
                                Recommended: 200x200px, max 5MB
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="btn-primary text-sm disabled:opacity-50"
                                >
                                    {uploading ? "Uploading..." : "Upload Foto"}
                                </button>
                                {user?.profileImage && (
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={uploading}
                                        className="btn-secondary text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Info Card */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">👤 Profile Info</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Codename</label>
                            <input
                                type="text"
                                value={user?.agent?.codename || user?.name || ""}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 cursor-not-allowed opacity-60"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 cursor-not-allowed opacity-60"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Role</label>
                            <input
                                type="text"
                                value={user?.role || "AGENT"}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 cursor-not-allowed opacity-60"
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="card lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">🔐 Ubah Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Password Saat Ini</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Password Baru</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                                    placeholder="Min 8 karakter"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                                    placeholder="Ulangi password baru"
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Password harus minimal 8 karakter, mengandung huruf besar dan angka.
                        </p>
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="btn-primary disabled:opacity-50"
                        >
                            {changingPassword ? "Mengubah..." : "Ubah Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}