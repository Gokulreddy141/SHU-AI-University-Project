"use client";
import { useEffect, useCallback, useRef } from "react";

/**
 * Registers the LLM-blocking Service Worker and listens for violation
 * messages sent back when the SW intercepts a request to an AI API domain.
 *
 * The SW itself (public/sw.js) does the blocking. This hook:
 *  1. Registers /sw.js on mount
 *  2. Listens for { type: "LLM_API_DETECTED" } messages from the SW
 *  3. POSTs a violation to /api/violation
 */
export function useLLMTrafficDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const lastViolationTime = useRef<number>(0);
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

    const logViolation = useCallback(
        async (domain: string, url: string) => {
            const now = Date.now();
            if (now - lastViolationTime.current < 30000) return;
            lastViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "LLM_API_DETECTED",
                        direction: `DOMAIN:${domain} URL:${url}`,
                        timestamp: new Date().toISOString(),
                        confidence: 0.98,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

        let mounted = true;

        const handleMessage = (event: MessageEvent) => {
            if (!mounted) return;
            if (event.data?.type === "LLM_API_DETECTED") {
                logViolation(event.data.domain, event.data.url);
            }
        };

        navigator.serviceWorker.addEventListener("message", handleMessage);

        // Register SW (no-op if already registered)
        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .then((reg) => {
                registrationRef.current = reg;
            })
            .catch((err) => {
                console.warn("[LLMTrafficDetection] SW registration failed:", err);
            });

        return () => {
            mounted = false;
            navigator.serviceWorker.removeEventListener("message", handleMessage);
        };
    }, [enabled, logViolation]);
}
