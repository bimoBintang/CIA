import { NextRequest, NextResponse } from 'next/server';
import { checkThrottle, getRateLimitHeaders, ThrottleResult } from './throttle';
import { getClientIP } from './ip';

export interface ThrottleCheckResult {
    passed: boolean;
    response?: NextResponse;
    result: ThrottleResult;
}


export async function applyThrottle(
    request: NextRequest,
    configKey: string = 'default'
): Promise<ThrottleCheckResult> {
    const ip = getClientIP(request);
    const endpoint = request.nextUrl.pathname;

    const result = await checkThrottle(ip, endpoint, configKey);
    const headers = getRateLimitHeaders(result);

    if (!result.success) {
        // Log violation
        console.warn(`[THROTTLE] Rate limited: ${ip} -> ${endpoint} (${configKey})`);

        const response = NextResponse.json(
            {
                success: false,
                error: 'Too Many Requests',
                message: result.message || 'Rate limit exceeded. Please try again later.',
                retryAfter: result.retryAfter,
                penaltyCount: result.penaltyCount,
            },
            {
                status: 429,
                headers,
            }
        );

        return { passed: false, response, result };
    }

    return { passed: true, result };
}

/**
 * Add rate limit headers to an existing response
 */
export function addRateLimitHeaders(
    response: NextResponse,
    result: ThrottleResult
): NextResponse {
    const headers = getRateLimitHeaders(result);

    for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
    }

    return response;
}
