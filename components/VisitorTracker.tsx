"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
    const pathname = usePathname();

    useEffect(() => {
        async function logVisit() {
            try {
                await fetch("/api/visitors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        page: pathname,
                        referer: document.referrer || null,
                    }),
                });
            } catch (error) {
                // Silently fail - don't block user experience
                console.debug("Visitor tracking:", error);
            }
        }

        // Log visit after a short delay to not block initial render
        const timer = setTimeout(logVisit, 1000);
        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
