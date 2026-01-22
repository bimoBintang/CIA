"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function VisitorTracker() {
    const pathname = usePathname();
    const fingerprintRef = useRef<string | null>(null);

    // Initialize fingerprint once on mount
    useEffect(() => {
        async function initFingerprint() {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                fingerprintRef.current = result.visitorId;
            } catch (error) {
                console.debug("Fingerprint init:", error);
            }
        }
        initFingerprint();
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
                        fingerprint: fingerprintRef.current,
                    }),
                });
            } catch (error) {
                // Silently fail - don't block user experience
                console.debug("Visitor tracking:", error);
            }
        }

        // Log visit after a short delay to allow fingerprint to load
        const timer = setTimeout(logVisit, 1500);
        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
