import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all albums (public or user's own)
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        const { searchParams } = new URL(request.url);
        const onlyPublic = searchParams.get('public') === 'true';

        const where = currentUser && !onlyPublic
            ? {
                OR: [
                    { isPublic: true },
                    { createdBy: currentUser.userId },
                ],
            }
            : { isPublic: true };

        const albums = await prisma.album.findMany({
            where,
            include: {
                _count: { select: { photos: true } },
                photos: { take: 1, orderBy: { createdAt: 'asc' } }, // For cover
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: albums.map((album: typeof albums[number]) => ({
                ...album,
                photoCount: album._count.photos,
                coverUrl: album.coverUrl || album.photos[0]?.url || null,
            })),
        });
    } catch (error) {
        console.error('Error fetching albums:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch albums' },
            { status: 500 }
        );
    }
}

// POST - Create new album
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only ADMIN and SENIOR_AGENT can create albums
        if (!['ADMIN', 'SENIOR_AGENT'].includes(currentUser.role)) {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, description, isPublic } = body;

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            );
        }

        const album = await prisma.album.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                isPublic: Boolean(isPublic),
                createdBy: currentUser.userId,
            },
        });

        return NextResponse.json(
            { success: true, data: album },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating album:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create album' },
            { status: 500 }
        );
    }
}
