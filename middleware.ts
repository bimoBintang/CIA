import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'circle-cia-secret-key-2026'
);

// Protected routes
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login'];

// In-memory banned IP cache for edge runtime
const bannedIPCache = new Map<string, { banned: boolean; expiresAt: number }>();
const CACHE_TTL = 60000; // 1 minute

// Get client IP with Cloudflare support (inline for Edge Runtime)
function getClientIP(request: NextRequest): string {
    // Cloudflare header (most reliable)
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP.trim();

    // Real IP (Nginx/proxies)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP.trim();

    // X-Forwarded-For (first IP)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();

    return 'unknown';
}

async function checkBannedIP(ip: string, baseUrl: string): Promise<{ banned: boolean; reason?: string }> {
    // Check cache first
    const cached = bannedIPCache.get(ip);
    if (cached && Date.now() < cached.expiresAt) {
        return { banned: cached.banned };
    }

    try {
        // Call internal API to check ban status
        const res = await fetch(`${baseUrl}/api/banned-ips/check?ip=${encodeURIComponent(ip)}`, {
            cache: 'no-store',
        });
        const data = await res.json();

        // Cache result
        bannedIPCache.set(ip, {
            banned: data.banned,
            expiresAt: Date.now() + CACHE_TTL,
        });

        return data;
    } catch (error) {
        console.error('Error checking banned IP:', error);
        return { banned: false };
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';
    const isProduction = host.endsWith('ciaa.web.id');
    const baseDomain = isProduction ? 'ciaa.web.id' : 'localhost:3000';

    // Authentication Check (Do this early for all routing decisions)
    const token = request.cookies.get('auth-token')?.value;
    let isAuthenticated = false;
    let userRole: string | null = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            isAuthenticated = true;
            userRole = (payload.role as string) || null;
        } catch {
            isAuthenticated = false;
        }
    }

    // 2. Subdomain Enforcement (Redirect from main domain to subdomains)
    if (host === baseDomain || host === `www.${baseDomain}`) {
        const searchParams = request.nextUrl.search;
        if (pathname === '/login') {
            const protocol = isProduction ? 'https' : 'http';
            return NextResponse.redirect(new URL(`${protocol}://auth.${baseDomain}${searchParams}`));
        }
        if (pathname.startsWith('/dashboard')) {
            const protocol = isProduction ? 'https' : 'http';
            return NextResponse.redirect(new URL(`${protocol}://dashboard.${baseDomain}${pathname}${searchParams}`));
        }
    }

    // 3. Strict Auth Subdomain Routing
    if (host.startsWith('auth.')) {
        // Authenticated users should NEVER be on the auth subdomain
        if (isAuthenticated) {
            const sub = userRole === 'VIEWER' ? 'viewer' : 'dashboard';
            const protocol = isProduction ? 'https' : 'http';
            return NextResponse.redirect(new URL(`${protocol}://${sub}.${baseDomain}/${sub}`));
        }

        // Only allow root, /login, and static/api assets
        if (pathname === '/' || pathname === '/login') {
            return NextResponse.rewrite(new URL('/login', request.url));
        }

        // Redirect any other unauthorized path on auth subdomain to dashboard subdomain
        const protocol = isProduction ? 'https' : 'http';
        return NextResponse.redirect(new URL(`${protocol}://dashboard.${baseDomain}${pathname}${request.nextUrl.search}`));
    }

    // 4. Dashboard Subdomain Routing
    if (host.startsWith('dashboard.')) {
        if (pathname === '/' || pathname === '/dashboard') {
            return NextResponse.rewrite(new URL('/dashboard', request.url));
        }
    }

    // 5. Global /login Redirection (Safety net for all subdomains)
    if (!host.startsWith('auth.') && pathname === '/login') {
        const protocol = isProduction ? 'https' : 'http';
        return NextResponse.redirect(new URL(`${protocol}://auth.${baseDomain}/login${request.nextUrl.search}`));
    }

    // 6. IP Ban Check
    const ip = getClientIP(request);
    if (!pathname.startsWith('/api/banned-ips')) {
        const banCheck = await checkBannedIP(ip, request.nextUrl.origin);
        if (banCheck.banned) {
            return new NextResponse(
                `<!DOCTYPE html>
                <html>
                <head>
                    <title>Access Denied | Circle CIA</title>
                    <style>
                        body { background: #0a0a0a; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                        .container { text-align: center; padding: 40px; border: 1px solid #ef4444; border-radius: 16px; background: rgba(239,68,68,0.1); max-width: 500px; }
                        h1 { color: #ef4444; font-size: 48px; margin: 0 0 20px; }
                        p { color: #a1a1aa; line-height: 1.6; }
                        .ip { color: #fbbf24; margin-top: 20px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚫 ACCESS DENIED</h1>
                        <p>Your IP address has been banned from accessing this website.</p>
                        <p>If you believe this is a mistake, please contact the administrator.</p>
                        <p class="ip">IP: ${ip}</p>
                    </div>
                </body>
                </html>`,
                { status: 403, headers: { 'Content-Type': 'text/html' } }
            );
        }
    }

    // 6. Access Control & Protection
    // Redirect authenticated users away from auth pages (already handled by subdomain sync above but good to keep as fallback)
    if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
        const sub = userRole === 'VIEWER' ? 'viewer' : 'dashboard';
        const protocol = isProduction ? 'https' : 'http';
        return NextResponse.redirect(new URL(`${protocol}://${sub}.${baseDomain}/${sub}`));
    }

    // Protect Dashboard
    if (pathname.startsWith('/dashboard') && !isAuthenticated) {
        const protocol = isProduction ? 'https' : 'http';
        const loginUrl = new URL(`${protocol}://auth.${baseDomain}/login`);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // VIEWER Access Control
    if (pathname.startsWith('/dashboard') && userRole === 'VIEWER') {
        const protocol = isProduction ? 'https' : 'http';
        return NextResponse.redirect(new URL(`${protocol}://viewer.${baseDomain}/viewer`));
    }

    if (pathname.startsWith('/viewer') && !isAuthenticated) {
        const protocol = isProduction ? 'https' : 'http';
        const loginUrl = new URL(`${protocol}://auth.${baseDomain}/login`);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/banned-ips/check).*)'],
};

