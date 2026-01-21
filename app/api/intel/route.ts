import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/intel - List all intel reports
export async function GET() {
    try {
        const intel = await prisma.intel.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                source: {
                    select: { codename: true },
                },
            },
        });
        return NextResponse.json({
            success: true,
            data: intel,
            count: intel.length,
        });
    } catch (error) {
        console.error('Error fetching intel:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch intel' },
            { status: 500 }
        );
    }
}

// POST /api/intel - Submit new intel
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, content, priority = 'low', sourceId } = body;

        if (!title || !sourceId) {
            return NextResponse.json(
                { success: false, error: 'Title and sourceId are required' },
                { status: 400 }
            );
        }

        const newIntel = await prisma.intel.create({
            data: {
                title,
                content,
                priority,
                sourceId,
            },
        });

        return NextResponse.json(
            { success: true, data: newIntel },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating intel:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create intel' },
            { status: 500 }
        );
    }
}
