import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single agent by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const agent = await prisma.agent.findUnique({
            where: { id },
            select: {
                id: true,
                codename: true,
                faculty: true,
                level: true,
                status: true,
                missions: true,
                createdAt: true,
                // Don't expose email for privacy
            },
        });

        if (!agent) {
            return NextResponse.json(
                { success: false, error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: agent,
        });
    } catch (error) {
        console.error('Error fetching agent:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch agent' },
            { status: 500 }
        );
    }
}
