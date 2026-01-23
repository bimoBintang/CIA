import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { applyThrottle } from '@/lib/throttle-helper';
import { put } from '@vercel/blob';
import crypto from 'crypto';

// GET - List news (public: published only, admin: all)
export async function GET(request: NextRequest) {
    try {
        // Throttle check - read config (more lenient)
        const throttle = await applyThrottle(request, 'read');
        if (!throttle.passed) return throttle.response!;

        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '50');

        let currentUser = null;
        try {
            currentUser = await getCurrentUser();
        } catch {
            // Not logged in, that's fine
        }

        const isAdmin = currentUser && ['ADMIN', 'SENIOR_AGENT'].includes(currentUser.role);

        const news = await prisma.news.findMany({
            where: {
                ...((!isAdmin || !all) && { published: true }),
                ...(category && { category }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                author: {
                    select: { codename: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: news,
            count: news.length,
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}

// POST - Create news article
export async function POST(request: NextRequest) {
    try {
        // Throttle check - write config (stricter)
        const throttle = await applyThrottle(request, 'write');
        if (!throttle.passed) return throttle.response!;

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
            const title = formData.get('title') as string;
            const content = formData.get('content') as string;
            const excerpt = formData.get('excerpt') as string | null;
            const category = formData.get('category') as string || 'general';
            const published = formData.get('published') === 'true';
            const coverImage = formData.get('coverImage') as File | null;

            if (!title || !content) {
                return NextResponse.json(
                    { success: false, error: 'Title and content are required' },
                    { status: 400 }
                );
            }

            let coverImageUrl: string | null = null;

            if (coverImage && coverImage.size > 0) {
                const ext = coverImage.name.split('.').pop() || 'jpg';
                const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
                const blobPath = `news/${filename}`;

                const blob = await put(blobPath, coverImage, {
                    access: 'public',
                    addRandomSuffix: false,
                });
                coverImageUrl = blob.url;
            }

            // Get agent for author
            const agent = await prisma.agent.findFirst({
                where: { email: currentUser.email },
            });

            const news = await prisma.news.create({
                data: {
                    title,
                    content,
                    excerpt: excerpt || content.substring(0, 150) + '...',
                    category,
                    published,
                    coverImage: coverImageUrl,
                    authorId: agent?.id,
                },
                include: {
                    author: { select: { codename: true } },
                },
            });

            return NextResponse.json({
                success: true,
                data: news,
            }, { status: 201 });
        } else {
            const body = await request.json();
            const { title, content, excerpt, category = 'general', published = false } = body;

            if (!title || !content) {
                return NextResponse.json(
                    { success: false, error: 'Title and content are required' },
                    { status: 400 }
                );
            }

            const agent = await prisma.agent.findFirst({
                where: { email: currentUser.email },
            });

            const news = await prisma.news.create({
                data: {
                    title,
                    content,
                    excerpt: excerpt || content.substring(0, 150) + '...',
                    category,
                    published,
                    authorId: agent?.id,
                },
                include: {
                    author: { select: { codename: true } },
                },
            });

            return NextResponse.json({
                success: true,
                data: news,
            }, { status: 201 });
        }
    } catch (error) {
        console.error('Error creating news:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create news' },
            { status: 500 }
        );
    }
}
