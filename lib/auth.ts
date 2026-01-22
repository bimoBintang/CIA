import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'circle-cia-secret-key-2026'
);

const SALT_ROUNDS = 10;

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// JWT Token management
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    agentId?: string;
    codename?: string;
    sessionToken?: string;  // For single-device session verification
}

export async function createToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

// Verify session is still valid (single-device check)
export async function verifySession(payload: JWTPayload): Promise<{
    valid: boolean;
    reason?: string;
}> {
    if (!payload.sessionToken) {
        // Old token without session token - still valid but consider upgrading
        return { valid: true };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { sessionToken: true, sessionDevice: true },
        });

        if (!user) {
            return { valid: false, reason: 'User not found' };
        }

        if (user.sessionToken !== payload.sessionToken) {
            return {
                valid: false,
                reason: `Session expired. You are logged in on another device: ${user.sessionDevice || 'Unknown device'}`,
            };
        }

        return { valid: true };
    } catch (error) {
        console.error('Session verification error:', error);
        return { valid: true }; // Fallback to valid on error to prevent lockout
    }
}

// Cookie management
export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });
}

export async function getAuthCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get('auth-token')?.value;
}

export async function removeAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}

// Get current user from request (with session verification)
export async function getCurrentUser(): Promise<JWTPayload | null> {
    const token = await getAuthCookie();
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Verify session is still valid
    const sessionCheck = await verifySession(payload);
    if (!sessionCheck.valid) {
        console.log(`[AUTH] Session invalid for ${payload.email}: ${sessionCheck.reason}`);
        return null;
    }

    return payload;
}

// Get current user WITHOUT session check (for logout, etc)
export async function getCurrentUserRaw(): Promise<JWTPayload | null> {
    const token = await getAuthCookie();
    if (!token) return null;
    return verifyToken(token);
}

// Clear session on logout
export async function clearUserSession(userId: string): Promise<void> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                sessionToken: null,
                sessionCreatedAt: null,
                sessionDevice: null,
            },
        });
    } catch (error) {
        console.error('Error clearing session:', error);
    }
}
