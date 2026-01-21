import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST - Add member to channel
export async function POST(
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
                { success: false, error: 'Only channel admins can add members' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { agentId, role = 'member' } = body;

        if (!agentId) {
            return NextResponse.json(
                { success: false, error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        // Check if agent exists
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            return NextResponse.json(
                { success: false, error: 'Agent not found' },
                { status: 404 }
            );
        }

        // Add member
        const newMember = await prisma.channelMember.create({
            data: {
                channelId,
                agentId,
                role,
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        codename: true,
                        status: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: newMember,
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error adding member:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Agent is already a member' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to add member' },
            { status: 500 }
        );
    }
}

// DELETE - Remove member from channel
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

        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        if (!agentId) {
            return NextResponse.json(
                { success: false, error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        // Check if user is channel admin or removing themselves
        const membership = await prisma.channelMember.findUnique({
            where: {
                channelId_agentId: {
                    channelId,
                    agentId: currentUser.agentId,
                },
            },
        });

        const isAdmin = membership?.role === 'admin';
        const isSelf = agentId === currentUser.agentId;

        if (!isAdmin && !isSelf) {
            return NextResponse.json(
                { success: false, error: 'Only channel admins can remove other members' },
                { status: 403 }
            );
        }

        await prisma.channelMember.delete({
            where: {
                channelId_agentId: {
                    channelId,
                    agentId,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Member removed',
        });
    } catch (error) {
        console.error('Error removing member:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove member' },
            { status: 500 }
        );
    }
}
