import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Get current authenticated user
export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get fresh user data from database
        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            include: {
                agent: {
                    select: {
                        id: true,
                        codename: true,
                        status: true,
                        level: true,
                        missions: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                profileImage: user.profileImage,
                agent: user.agent,
            },
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get user' },
            { status: 500 }
        );
    }
}
