import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Get channel details with members
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        const { id: channelId } = await params;

        if (!currentUser || !currentUser.agentId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: {
                    include: {
                        agent: {
                            select: {
                                id: true,
                                codename: true,
                                status: true,
                                level: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { messages: true },
                },
            },
        });

        if (!channel) {
            return NextResponse.json(
                { success: false, error: 'Channel not found' },
                { status: 404 }
            );
        }

        // Check if user is a member
        const isMember = channel.members.some((m: { agentId: string }) => m.agentId === currentUser.agentId);
        if (!isMember) {
            return NextResponse.json(
                { success: false, error: 'Not a member of this channel' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: channel,
        });
    } catch (error) {
        console.error('Error fetching channel:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch channel' },
            { status: 500 }
        );
    }
}

// DELETE - Delete channel (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        const { id: channelId } = await params;

        if (!currentUser || !currentUser.agentId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is channel admin
        const membership = await prisma.channelMember.findUnique({
            where: {
                channelId_agentId: {
                    channelId,
                    agentId: currentUser.agentId,
                },
            },
        });

        if (!membership || membership.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Only channel admins can delete channels' },
                { status: 403 }
            );
        }

        await prisma.channel.delete({
            where: { id: channelId },
        });

        return NextResponse.json({
            success: true,
            message: 'Channel deleted',
        });
    } catch (error) {
        console.error('Error deleting channel:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete channel' },
            { status: 500 }
        );
    }
}
