"use client";

import { useState, useEffect, useCallback } from "react";

interface Album {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    isPublic: boolean;
    photoCount: number;
    createdAt: string;
}

interface Photo {
    id: string;
    url: string;
    filename: string;
    caption: string | null;
    size: number;
    createdAt: string;
}

// Loading Skeleton
function AlbumsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
                <div className="h-10 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card overflow-hidden">
                        <div className="h-48 bg-zinc-800 animate-pulse" />
                        <div className="p-4 space-y-2">
                            <div className="h-5 w-3/4 bg-zinc-800 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="glass rounded-2xl p-6 w-full max-w-lg border border-zinc-700 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// Photo Viewer Modal
function PhotoViewer({ photo, onClose, onNext, onPrev }: {
    photo: Photo;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
            <button
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl p-4"
            >
                ‹
            </button>
            <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <img
                    src={photo.url}
                    alt={photo.caption || photo.filename}
                    className="max-h-[80vh] max-w-full object-contain rounded-lg"
                />
                {photo.caption && (
                    <p className="text-white/80 mt-4 text-center">{photo.caption}</p>
                )}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl p-4"
            >
                ›
            </button>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl">
                &times;
            </button>
        </div>
    );
}

export default function AlbumsSection({ showToast }: { showToast: (msg: string, type: "success" | "error") => void }) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewingPhoto, setViewingPhoto] = useState<number | null>(null);
    const [formData, setFormData] = useState({ title: "", description: "", isPublic: false });
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchAlbums = useCallback(async () => {
        try {
            const res = await fetch("/api/albums");
            const data = await res.json();
            if (data.success) {
                setAlbums(data.data);
            }
        } catch (error) {
            console.error("Error fetching albums:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPhotos = useCallback(async (albumId: string) => {
        try {
            const res = await fetch(`/api/albums/${albumId}/photos`);
            const data = await res.json();
            if (data.success) {
                setPhotos(data.data);
            }
        } catch (error) {
            console.error("Error fetching photos:", error);
        }
    }, []);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    useEffect(() => {
        if (selectedAlbum) {
            fetchPhotos(selectedAlbum.id);
        }
    }, [selectedAlbum, fetchPhotos]);

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/albums", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Album berhasil dibuat!", "success");
                setShowCreateModal(false);
                setFormData({ title: "", description: "", isPublic: false });
                fetchAlbums();
            } else {
                showToast(data.error || "Gagal membuat album", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadPhotos = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlbum) return;

        const form = e.target as HTMLFormElement;
        const fileInput = form.elements.namedItem("photos") as HTMLInputElement;
        const captionInput = form.elements.namedItem("caption") as HTMLInputElement;

        if (!fileInput.files || fileInput.files.length === 0) {
            showToast("Pilih file terlebih dahulu", "error");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append("photos", fileInput.files[i]);
            }
            if (captionInput.value) {
                formData.append("caption", captionInput.value);
            }

            const res = await fetch(`/api/albums/${selectedAlbum.id}/photos`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                showToast(`${data.count} foto berhasil diupload!`, "success");
                setShowUploadModal(false);
                fetchPhotos(selectedAlbum.id);
                fetchAlbums(); // Refresh cover
            } else {
                showToast(data.error || "Gagal upload foto", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAlbum = async (albumId: string) => {
        if (!confirm("Yakin ingin menghapus album ini? Semua foto akan ikut terhapus.")) return;
        try {
            const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("Album berhasil dihapus", "success");
                setSelectedAlbum(null);
                fetchAlbums();
            } else {
                showToast(data.error || "Gagal menghapus album", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!selectedAlbum) return;
        try {
            const res = await fetch(`/api/albums/${selectedAlbum.id}/photos?photoId=${photoId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                showToast("Foto berhasil dihapus", "success");
                fetchPhotos(selectedAlbum.id);
            } else {
                showToast(data.error || "Gagal menghapus foto", "error");
            }
        } catch {
            showToast("Terjadi kesalahan", "error");
        }
    };

    if (loading) return <AlbumsSkeleton />;

    // Album detail view
    if (selectedAlbum) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedAlbum(null)}
                            className="text-zinc-400 hover:text-white text-2xl"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">{selectedAlbum.title}</h1>
                            <p className="text-zinc-500">
                                {photos.length} foto • {selectedAlbum.isPublic ? "🌐 Publik" : "🔒 Privat"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="btn-primary"
                        >
                            📷 Upload Foto
                        </button>
                        <button
                            onClick={() => handleDeleteAlbum(selectedAlbum.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        >
                            🗑️ Hapus Album
                        </button>
                    </div>
                </div>

                {photos.length === 0 ? (
                    <div className="card text-center py-20">
                        <p className="text-6xl mb-4">📷</p>
                        <p className="text-zinc-400">Belum ada foto di album ini</p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="btn-primary mt-4"
                        >
                            Upload Foto Pertama
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo, idx) => (
                            <div
                                key={photo.id}
                                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                                onClick={() => setViewingPhoto(idx)}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.caption || photo.filename}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <p className="text-white text-sm truncate">{photo.caption || photo.filename}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePhoto(photo.id);
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Photo Viewer */}
                {viewingPhoto !== null && photos[viewingPhoto] && (
                    <PhotoViewer
                        photo={photos[viewingPhoto]}
                        onClose={() => setViewingPhoto(null)}
                        onNext={() => setViewingPhoto((viewingPhoto + 1) % photos.length)}
                        onPrev={() => setViewingPhoto((viewingPhoto - 1 + photos.length) % photos.length)}
                    />
                )}

                {/* Upload Modal */}
                <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Foto">
                    <form onSubmit={handleUploadPhotos} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Pilih Foto</label>
                            <input
                                type="file"
                                name="photos"
                                accept="image/*"
                                multiple
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/20 file:text-green-400"
                                required
                            />
                            <p className="text-xs text-zinc-500 mt-1">Max 10MB per file. Format: JPG, PNG, GIF, WebP</p>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Caption (opsional)</label>
                            <input
                                type="text"
                                name="caption"
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                                placeholder="Deskripsi foto..."
                            />
                        </div>
                        <button type="submit" disabled={uploading} className="w-full btn-primary disabled:opacity-50">
                            {uploading ? "Mengupload..." : "Upload Foto"}
                        </button>
                    </form>
                </Modal>
            </div>
        );
    }

    // Albums list view
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">📸 Gallery</h1>
                    <p className="text-zinc-500">Kelola album foto ({albums.length} album)</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                    + Buat Album
                </button>
            </div>

            {albums.length === 0 ? (
                <div className="card text-center py-20">
                    <p className="text-6xl mb-4">📷</p>
                    <p className="text-zinc-400 mb-4">Belum ada album</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        Buat Album Pertama
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map((album) => (
                        <div
                            key={album.id}
                            onClick={() => setSelectedAlbum(album)}
                            className="card overflow-hidden cursor-pointer hover:border-green-500/50 transition-all group"
                        >
                            <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                                {album.coverUrl ? (
                                    <img
                                        src={album.coverUrl}
                                        alt={album.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
                                        📷
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className={`text-xs px-2 py-1 rounded ${album.isPublic ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                                        {album.isPublic ? "🌐 Publik" : "🔒 Privat"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-1">{album.title}</h3>
                                <p className="text-sm text-zinc-500">
                                    {album.photoCount} foto • {new Date(album.createdAt).toLocaleDateString("id-ID")}
                                </p>
                                {album.description && (
                                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{album.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Album Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat Album Baru">
                <form onSubmit={handleCreateAlbum} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Judul Album</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none"
                            placeholder="Contoh: Dokumentasi Event 2026"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Deskripsi (opsional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-green-500 focus:outline-none h-24 resize-none"
                            placeholder="Deskripsi album..."
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-green-500 focus:ring-green-500"
                            />
                            <span className="text-zinc-300">Album publik (bisa dilihat semua orang)</span>
                        </label>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                        {submitting ? "Membuat..." : "Buat Album"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
