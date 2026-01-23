import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { applyThrottle, addRateLimitHeaders } from '@/lib/throttle-helper';
import { isValidEmail } from '@/lib/validation';
import { trackFailedLogin, securityCheck } from '@/lib/security';
import { sendOTPEmail, generateOTP, getOTPExpiry } from '@/lib/email';
import { getClientIP } from '@/lib/ip';

// Helper to parse user agent
function parseUserAgent(userAgent: string) {
    const ua = userAgent.toLowerCase();

    // Device
    let device = 'desktop';
    if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
        device = /ipad|tablet/.test(ua) ? 'tablet' : 'mobile';
    }

    // Browser
    let browser = 'Unknown';
    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('opera')) browser = 'Opera';

    // OS
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { device, browser, os };
}

// Log login activity
async function logLoginActivity(data: {
    userId?: string;
    email: string;
    ip: string;
    userAgent: string;
    status: 'success' | 'failed' | 'blocked';
    reason?: string;
}) {
    try {
        const { device, browser, os } = parseUserAgent(data.userAgent);
        await prisma.loginActivity.create({
            data: {
                userId: data.userId,
                email: data.email,
                ip: data.ip,
                userAgent: data.userAgent,
                device,
                browser,
                os,
                status: data.status,
                reason: data.reason,
            },
        });
    } catch (error) {
        console.error('Failed to log login activity:', error);
    }
}

// POST - Login
export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting (supports Cloudflare)
        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || 'unknown';

        const body = await request.json();
        const { email, password } = body;

        // Validate email format
        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        // Throttle check with progressive penalty for login
        const throttle = await applyThrottle(request, 'login');
        if (!throttle.passed) {
            await logLoginActivity({
                email,
                ip,
                userAgent,
                status: 'blocked',
                reason: `Rate limited (attempt #${throttle.result.penaltyCount || 1})`,
            });
            return throttle.response!;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
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

        if (!user) {
            // Track failed login for auto-ban
            const banned = await trackFailedLogin(ip);
            await logLoginActivity({
                email,
                ip,
                userAgent,
                status: banned ? 'blocked' : 'failed',
                reason: 'User not found',
            });
            if (banned) {
                return NextResponse.json(
                    { success: false, error: 'Your IP has been temporarily banned due to too many failed attempts' },
                    { status: 403 }
                );
            }
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            // Track failed login for auto-ban
            const banned = await trackFailedLogin(ip);
            await logLoginActivity({
                userId: user.id,
                email,
                ip,
                userAgent,
                status: banned ? 'blocked' : 'failed',
                reason: 'Wrong password',
            });
            if (banned) {
                return NextResponse.json(
                    { success: false, error: 'Your IP has been temporarily banned due to too many failed attempts' },
                    { status: 403 }
                );
            }
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Password verified - success will be tracked by throttle system

        // Generate OTP for email verification
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Store OTP in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: otp,
                otpExpiry,
                otpAttempts: 0, // Reset attempts
            },
        });

        // Send OTP via email
        const emailSent = await sendOTPEmail({
            email: user.email,
            name: user.name,
            otp,
        });

        if (!emailSent) {
            console.error('[LOGIN] Failed to send OTP email to', user.email);
            // Continue anyway - OTP is logged in console for development
        }

        // Log OTP request activity
        await logLoginActivity({
            userId: user.id,
            email,
            ip,
            userAgent,
            status: 'success',
            reason: 'OTP sent',
        });

        const response = NextResponse.json({
            success: true,
            requiresOTP: true, // Indicates OTP verification needed
            message: 'Verification code has been sent to your email',
            data: {
                email: user.email,
                maskedEmail: maskEmail(user.email),
            },
        });

        // Add rate limit headers to response
        return addRateLimitHeaders(response, throttle.result);
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}

// Helper to mask email for display
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${local[1]}${'*'.repeat(Math.min(local.length - 2, 5))}@${domain}`;
}


