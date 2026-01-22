import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Get album details with photos
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: albumId } = await params;
        const currentUser = await getCurrentUser();

        const album = await prisma.album.findUnique({
            where: { id: albumId },
            include: {
                photos: { orderBy: { createdAt: 'desc' } },
                _count: { select: { photos: true } },
            },
        });

        if (!album) {
            return NextResponse.json(
                { success: false, error: 'Album not found' },
                { status: 404 }
            );
        }

        // Check access
        if (!album.isPublic && (!currentUser || album.createdBy !== currentUser.userId)) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...album,
                photoCount: album._count.photos,
            },
        });
    } catch (error) {
        console.error('Error fetching album:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch album' },
            { status: 500 }
        );
    }
}

// PATCH - Update album
export async function PATCH(
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

        // Only creator or admin can update
        if (album.createdBy !== currentUser.userId && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, description, isPublic, coverUrl } = body;

        const updated = await prisma.album.update({
            where: { id: albumId },
            data: {
                ...(title && { title: title.trim() }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
                ...(coverUrl !== undefined && { coverUrl }),
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating album:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update album' },
            { status: 500 }
        );
    }
}

// DELETE - Delete album
export async function DELETE(
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

        // Only creator or admin can delete
        if (album.createdBy !== currentUser.userId && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        await prisma.album.delete({ where: { id: albumId } });

        return NextResponse.json({
            success: true,
            message: 'Album deleted',
        });
    } catch (error) {
        console.error('Error deleting album:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete album' },
            { status: 500 }
        );
    }
}
