import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getViolationStats, resetViolations } from '@/lib/throttle';


// GET - Get throttle stats (admin only)
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const stats = getViolationStats();

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error getting throttle stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get throttle stats' },
            { status: 500 }
        );
    }
}

// POST - Log a throttle violation (internal use)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ip, endpoint, configKey } = body;

        // This could log to database for persistent tracking
        // For now, just return success as in-memory tracking handles it

        console.log(`[THROTTLE] Violation logged: ${ip} -> ${endpoint} (${configKey})`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging throttle violation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to log violation' },
            { status: 500 }
        );
    }
}

// DELETE - Reset violations for an IP (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const ip = searchParams.get('ip');

        if (!ip) {
            return NextResponse.json(
                { success: false, error: 'IP is required' },
                { status: 400 }
            );
        }

        resetViolations(ip);

        return NextResponse.json({
            success: true,
            message: `Violations reset for IP: ${ip}`,
        });
    } catch (error) {
        console.error('Error resetting violations:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reset violations' },
            { status: 500 }
        );
    }
}
