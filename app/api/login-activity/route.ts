import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List login activities (admin only)
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        // Only admins can view login activities
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');
        const ip = searchParams.get('ip');
        const userId = searchParams.get('userId');

        // Build where clause
        const where: {
            status?: string;
            ip?: { contains: string };
            userId?: string;
        } = {};

        if (status && status !== 'all') {
            where.status = status;
        }
        if (ip) {
            where.ip = { contains: ip };
        }
        if (userId) {
            where.userId = userId;
        }

        const activities = await prisma.loginActivity.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // Get stats
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [totalToday, successToday, failedToday, uniqueIPs] = await Promise.all([
            prisma.loginActivity.count({
                where: { createdAt: { gte: last24h } },
            }),
            prisma.loginActivity.count({
                where: { createdAt: { gte: last24h }, status: 'success' },
            }),
            prisma.loginActivity.count({
                where: { createdAt: { gte: last24h }, status: 'failed' },
            }),
            prisma.loginActivity.groupBy({
                by: ['ip'],
                where: { createdAt: { gte: last24h } },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: activities,
            stats: {
                totalToday,
                successToday,
                failedToday,
                uniqueIPs: uniqueIPs.length,
            },
        });
    } catch (error) {
        console.error('Error fetching login activities:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch login activities' },
            { status: 500 }
        );
    }
}
