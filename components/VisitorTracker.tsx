"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Check if device is mobile
function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

// Lazy load FingerprintJS - only import when needed
let fpPromise: Promise<typeof import("@fingerprintjs/fingerprintjs")> | null = null;

function loadFingerprintJS() {
    if (!fpPromise) {
        fpPromise = import("@fingerprintjs/fingerprintjs");
    }
    return fpPromise;
}

export function VisitorTracker() {
    const pathname = usePathname();
    const fingerprintRef = useRef<string | null>(null);
    const isMobileRef = useRef<boolean>(false);
    const [isReady, setIsReady] = useState(false);

    // Detect mobile and defer fingerprint loading for desktop only
    useEffect(() => {
        isMobileRef.current = isMobileDevice();

        // Skip FingerprintJS on mobile - not accurate and hurts performance
        if (isMobileRef.current) {
            setIsReady(true);
            return;
        }

        // Desktop only: load FingerprintJS after page is idle
        const loadAfterIdle = () => {
            if ("requestIdleCallback" in window) {
                (window as typeof window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
                    .requestIdleCallback(
                        async () => {
                            try {
                                const FingerprintJS = await loadFingerprintJS();
                                const fp = await FingerprintJS.default.load();
                                const result = await fp.get();
                                fingerprintRef.current = result.visitorId;
                            } catch (error) {
                                console.debug("Fingerprint init:", error);
                            } finally {
                                setIsReady(true);
                            }
                        },
                        { timeout: 5000 }
                    );
            } else {
                // Fallback: wait 3 seconds
                setTimeout(async () => {
                    try {
                        const FingerprintJS = await loadFingerprintJS();
                        const fp = await FingerprintJS.default.load();
                        const result = await fp.get();
                        fingerprintRef.current = result.visitorId;
                    } catch (error) {
                        console.debug("Fingerprint init:", error);
                    } finally {
                        setIsReady(true);
                    }
                }, 3000);
            }
        };

        const timer = setTimeout(loadAfterIdle, 100);
        return () => clearTimeout(timer);
    }, []);

    // Log visit on page change
    useEffect(() => {
        async function logVisit() {
            try {
                await fetch("/api/visitors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        page: pathname,
                        referer: document.referrer || null,
                        fingerprint: fingerprintRef.current, // null on mobile
                    }),
                });
            } catch (error) {
                console.debug("Visitor tracking:", error);
            }
        }

        // Log immediately
        const timer = setTimeout(logVisit, 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    // Desktop: re-log with fingerprint once ready
    useEffect(() => {
        if (isReady && fingerprintRef.current && !isMobileRef.current) {
            fetch("/api/visitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    page: pathname,
                    referer: document.referrer || null,
                    fingerprint: fingerprintRef.current,
                    update: true,
                }),
            }).catch(() => { });
        }
    }, [isReady, pathname]);

    return null;
}
