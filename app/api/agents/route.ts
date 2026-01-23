import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyThrottle } from '@/lib/throttle-helper';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
    // Throttle check - read config
    const throttle = await applyThrottle(request, 'read');
    if (!throttle.passed) return throttle.response!;

    try {
        const agents = await prisma.agent.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({
            success: true,
            data: agents,
            count: agents.length,
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch agents' },
            { status: 500 }
        );
    }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
    // Throttle check - write config
    const throttle = await applyThrottle(request, 'write');
    if (!throttle.passed) return throttle.response!;

    try {
        const body = await request.json();
        const { codename, email, faculty, level = 'Junior' } = body;

        if (!codename || !email || !faculty) {
            return NextResponse.json(
                { success: false, error: 'Codename, email, and faculty are required' },
                { status: 400 }
            );
        }

        const newAgent = await prisma.agent.create({
            data: {
                codename,
                email,
                faculty,
                level,
                status: 'offline',
                missions: 0,
            },
        });

        return NextResponse.json(
            { success: true, data: newAgent },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error creating agent:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Agent with this codename or email already exists' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create agent' },
            { status: 500 }
        );
    }
}
