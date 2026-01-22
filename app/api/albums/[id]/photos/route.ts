import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function generateSecureFilename(mimeType: string): string {
    const extensions: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
    };
    const ext = extensions[mimeType] || '.jpg';
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomBytes}${ext}`;
}

// GET - Get photos in album
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: albumId } = await params;
        const currentUser = await getCurrentUser();

        const album = await prisma.album.findUnique({
            where: { id: albumId },
        });

        if (!album) {
            return NextResponse.json(
                { success: false, error: 'Album not found' },
                { status: 404 }
            );
        }

        if (!album.isPublic && (!currentUser || album.createdBy !== currentUser.userId)) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        const photos = await prisma.photo.findMany({
            where: { albumId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: photos,
            count: photos.length,
        });
    } catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch photos' },
            { status: 500 }
        );
    }
}

// POST - Upload photos to album
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: albumId } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const album = await prisma.album.findUnique({
            where: { id: albumId },
        });

        if (!album) {
            return NextResponse.json(
                { success: false, error: 'Album not found' },
                { status: 404 }
            );
        }

        // Only creator or admin can add photos
        if (album.createdBy !== currentUser.userId && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const files = formData.getAll('photos') as File[];
        const caption = formData.get('caption') as string | null;

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No photos provided' },
                { status: 400 }
            );
        }

        // Create albums upload directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'albums', albumId);
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const uploadedPhotos = [];

        for (const file of files) {
            // Validate
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                continue; // Skip invalid files
            }
            if (file.size > MAX_FILE_SIZE) {
                continue; // Skip too large files
            }

            const filename = generateSecureFilename(file.type);
            const filePath = path.join(uploadsDir, filename);

            // Write file
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            const url = `/uploads/albums/${albumId}/${filename}`;

            // Create photo record
            const photo = await prisma.photo.create({
                data: {
                    albumId,
                    url,
                    filename,
                    caption: caption || null,
                    size: file.size,
                },
            });

            uploadedPhotos.push(photo);
        }

        // Update album cover if first photo
        if (uploadedPhotos.length > 0 && !album.coverUrl) {
            await prisma.album.update({
                where: { id: albumId },
                data: { coverUrl: uploadedPhotos[0].url },
            });
        }

        return NextResponse.json({
            success: true,
            data: uploadedPhotos,
            count: uploadedPhotos.length,
        }, { status: 201 });
    } catch (error) {
        console.error('Error uploading photos:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload photos' },
            { status: 500 }
        );
    }
}

// DELETE - Delete photo from album
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: albumId } = await params;
        const currentUser = await getCurrentUser();
        const { searchParams } = new URL(request.url);
        const photoId = searchParams.get('photoId');

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!photoId) {
            return NextResponse.json(
                { success: false, error: 'Photo ID required' },
                { status: 400 }
            );
        }

        const album = await prisma.album.findUnique({
            where: { id: albumId },
        });

        if (!album) {
            return NextResponse.json(
                { success: false, error: 'Album not found' },
                { status: 404 }
            );
        }

        if (album.createdBy !== currentUser.userId && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        await prisma.photo.delete({
            where: { id: photoId, albumId },
        });

        return NextResponse.json({
            success: true,
            message: 'Photo deleted',
        });
    } catch (error) {
        console.error('Error deleting photo:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete photo' },
            { status: 500 }
        );
    }
}
