import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import crypto from 'crypto';

// GET - Get single news
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const news = await prisma.news.findUnique({
            where: { id },
            include: {
                author: { select: { codename: true } },
            },
        });

        if (!news) {
            return NextResponse.json(
                { success: false, error: 'News not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: news,
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}

// PATCH - Update news
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser || !['ADMIN', 'SENIOR_AGENT'].includes(currentUser.role)) {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const title = formData.get('title') as string | null;
            const content = formData.get('content') as string | null;
            const excerpt = formData.get('excerpt') as string | null;
            const category = formData.get('category') as string | null;
            const published = formData.get('published');
            const coverImage = formData.get('coverImage') as File | null;

            let coverImageUrl: string | undefined;

            if (coverImage && coverImage.size > 0) {
                // Delete old cover if exists
                const oldNews = await prisma.news.findUnique({ where: { id } });
                if (oldNews?.coverImage) {
                    try { await del(oldNews.coverImage); } catch (e) { console.error(e); }
                }

                const ext = coverImage.name.split('.').pop() || 'jpg';
                const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
                const blobPath = `news/${filename}`;

                const blob = await put(blobPath, coverImage, {
                    access: 'public',
                    addRandomSuffix: false,
                });
                coverImageUrl = blob.url;
            }

            const updated = await prisma.news.update({
                where: { id },
                data: {
                    ...(title && { title }),
                    ...(content && { content }),
                    ...(excerpt && { excerpt }),
                    ...(category && { category }),
                    ...(published !== null && { published: published === 'true' }),
                    ...(coverImageUrl && { coverImage: coverImageUrl }),
                },
                include: {
                    author: { select: { codename: true } },
                },
            });

            return NextResponse.json({ success: true, data: updated });
        } else {
            const body = await request.json();
            const { title, content, excerpt, category, published } = body;

            const updated = await prisma.news.update({
                where: { id },
                data: {
                    ...(title && { title }),
                    ...(content && { content }),
                    ...(excerpt && { excerpt }),
                    ...(category && { category }),
                    ...(published !== undefined && { published }),
                },
                include: {
                    author: { select: { codename: true } },
                },
            });

            return NextResponse.json({ success: true, data: updated });
        }
    } catch (error) {
        console.error('Error updating news:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update news' },
            { status: 500 }
        );
    }
}

// DELETE - Delete news
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser || !['ADMIN', 'SENIOR_AGENT'].includes(currentUser.role)) {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        // Get news to delete cover image
        const news = await prisma.news.findUnique({ where: { id } });
        if (news?.coverImage) {
            try { await del(news.coverImage); } catch (e) { console.error(e); }
        }

        await prisma.news.delete({ where: { id } });

        return NextResponse.json({
            success: true,
            message: 'News deleted',
        });
    } catch (error) {
        console.error('Error deleting news:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete news' },
            { status: 500 }
        );
    }
}
