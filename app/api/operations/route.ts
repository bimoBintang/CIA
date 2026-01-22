import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/operations - List all operations
export async function GET() {
    try {
        const operations = await prisma.operation.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({
            success: true,
            data: operations,
            count: operations.length,
        });
    } catch (error) {
        console.error('Error fetching operations:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch operations' },
            { status: 500 }
        );
    }
}

// POST /api/operations - Create new operation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, deadline, teamSize = 1, status = 'planning', priority = 'medium' } = body;

        if (!name || !deadline) {
            return NextResponse.json(
                { success: false, error: 'Name and deadline are required' },
                { status: 400 }
            );
        }

        const newOperation = await prisma.operation.create({
            data: {
                name,
                description,
                status,
                priority,
                progress: 0,
                deadline: new Date(deadline),
                teamSize,
            },
        });

        return NextResponse.json(
            { success: true, data: newOperation },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating operation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create operation' },
            { status: 500 }
        );
    }
}

// PATCH /api/operations - Update operation progress
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, progress, status } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Operation ID is required' },
                { status: 400 }
            );
        }

        const updatedOperation = await prisma.operation.update({
            where: { id },
            data: {
                ...(progress !== undefined && { progress }),
                ...(status !== undefined && { status }),
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedOperation,
        });
    } catch (error) {
        console.error('Error updating operation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update operation' },
            { status: 500 }
        );
    }
}
