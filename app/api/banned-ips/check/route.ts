import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Check if an IP is banned (for edge runtime)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ip = searchParams.get('ip');

        if (!ip) {
            return NextResponse.json({ banned: false });
        }

        const now = new Date();
        const ban = await prisma.bannedIP.findFirst({
            where: {
                ip,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
        });

        if (!ban) {
            return NextResponse.json({ banned: false });
        }

        return NextResponse.json({
            banned: true,
            reason: ban.reason,
            expiresAt: ban.expiresAt,
        });
    } catch (error) {
        console.error('Error checking banned IP:', error);
        return NextResponse.json({ banned: false });
    }
}
