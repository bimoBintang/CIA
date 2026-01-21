import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all banned IPs
export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        // Only admins can view banned IPs
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const bannedIPs = await prisma.bannedIP.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: bannedIPs,
        });
    } catch (error) {
        console.error('Error fetching banned IPs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch banned IPs' },
            { status: 500 }
        );
    }
}

// POST - Ban an IP
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        // Only admins can ban IPs
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { ip, reason, duration } = body;

        if (!ip || !reason) {
            return NextResponse.json(
                { success: false, error: 'IP and reason are required' },
                { status: 400 }
            );
        }

        // Validate IP format (simple check)
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[0-9a-fA-F:]+$/;
        if (!ipRegex.test(ip) && ip !== 'unknown') {
            return NextResponse.json(
                { success: false, error: 'Invalid IP address format' },
                { status: 400 }
            );
        }

        // Calculate expiration date
        let expiresAt: Date | null = null;
        if (duration && duration !== 'permanent') {
            const now = new Date();
            switch (duration) {
                case '1h':
                    expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
                    break;
                case '24h':
                    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    expiresAt = null; // permanent
            }
        }

        const bannedIP = await prisma.bannedIP.create({
            data: {
                ip,
                reason,
                bannedBy: currentUser.userId,
                expiresAt,
            },
        });

        return NextResponse.json({
            success: true,
            data: bannedIP,
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error banning IP:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'IP is already banned' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to ban IP' },
            { status: 500 }
        );
    }
}

// DELETE - Unban an IP
export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        // Only admins can unban IPs
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const ip = searchParams.get('ip');

        if (!id && !ip) {
            return NextResponse.json(
                { success: false, error: 'ID or IP is required' },
                { status: 400 }
            );
        }

        if (id) {
            await prisma.bannedIP.delete({ where: { id } });
        } else if (ip) {
            await prisma.bannedIP.delete({ where: { ip } });
        }

        return NextResponse.json({
            success: true,
            message: 'IP unbanned successfully',
        });
    } catch (error) {
        console.error('Error unbanning IP:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to unban IP' },
            { status: 500 }
        );
    }
}
