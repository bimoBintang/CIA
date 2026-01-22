import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserRaw, removeAuthCookie, clearUserSession } from '@/lib/auth';

// POST - Logout
export async function POST() {
    try {
        const currentUser = await getCurrentUserRaw();

        if (currentUser) {
            // Clear session token from database
            await clearUserSession(currentUser.userId);

            // Set agent status to offline if linked
            if (currentUser.agentId) {
                await prisma.agent.update({
                    where: { id: currentUser.agentId },
                    data: { status: 'offline' },
                });
            }
        }

        // Remove auth cookie
        await removeAuthCookie();

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Error during logout:', error);
        return NextResponse.json(
            { success: false, error: 'Logout failed' },
            { status: 500 }
        );
    }
}
