import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, setAuthCookie } from '@/lib/auth';
import crypto from 'crypto';

// POST - Verify OTP and complete login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { agent: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid verification code' },
                { status: 401 }
            );
        }

        // Check if OTP is expired
        if (!user.otpCode || !user.otpExpiry || user.otpExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Verification code has expired. Please login again.' },
                { status: 401 }
            );
        }

        // Check OTP attempts (max 3)
        if (user.otpAttempts >= 3) {
            // Clear OTP and force re-login
            await prisma.user.update({
                where: { id: user.id },
                data: { otpCode: null, otpExpiry: null, otpAttempts: 0 },
            });
            return NextResponse.json(
                { success: false, error: 'Too many failed attempts. Please login again.' },
                { status: 401 }
            );
        }

        // Verify OTP
        if (user.otpCode !== otp) {
            // Increment attempts
            await prisma.user.update({
                where: { id: user.id },
                data: { otpAttempts: { increment: 1 } },
            });
            return NextResponse.json(
                { success: false, error: 'Invalid verification code' },
                { status: 401 }
            );
        }

        // OTP is valid - Generate session token
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Parse device info
        const ua = userAgent.toLowerCase();
        let device = 'Unknown';
        let browser = 'Unknown';
        if (ua.includes('mobile')) device = 'Mobile';
        else if (ua.includes('tablet')) device = 'Tablet';
        else device = 'Desktop';

        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari')) browser = 'Safari';
        else if (ua.includes('edge')) browser = 'Edge';

        const deviceInfo = `${device} - ${browser}`;

        // Update user: clear OTP, set session
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiry: null,
                otpAttempts: 0,
                sessionToken,
                sessionCreatedAt: new Date(),
                sessionDevice: deviceInfo,
            },
        });

        // Create JWT token
        const token = await createToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            agentId: user.agent?.id,
            codename: user.agent?.codename,
            sessionToken,
        });

        // Set auth cookie
        await setAuthCookie(token);

        // Update agent status to online
        if (user.agentId) {
            await prisma.agent.update({
                where: { id: user.agentId },
                data: { status: 'online' },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    agent: user.agent,
                },
            },
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json(
            { success: false, error: 'Verification failed' },
            { status: 500 }
        );
    }
}
