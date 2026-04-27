"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface WindowFocusState {
    isFocused: boolean;
    blurCount: number;
}

// Raised from 3s → 8s: OS notifications (battery, antivirus, calendar alerts)
// steal focus for 3-5s routinely. Only flag deliberate tab switching.
const MIN_BLUR_DURATION_MS = 8000;
// Only report one violation per window per cooldown period
const VIOLATION_COOLDOWN_MS = 45000;
// Grace period after exam start — page may not be focused immediately on load
const STARTUP_GRACE_MS = 15000;

export function useWindowFocusDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<WindowFocusState>({
        isFocused: true,
        blurCount: 0,
    });
    const blurStartTime = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);
    const mountTime = useRef<number>(0);

    const logViolation = useCallback(async (duration: number) => {
        const now = Date.now();
        if (now - lastViolationTime.current < VIOLATION_COOLDOWN_MS) return;
        lastViolationTime.current = now;

        try {
            await fetch("/api/violation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    candidateId,
                    type: "WINDOW_BLUR",
                    timestamp: new Date().toISOString(),
                    duration: Math.round(duration / 1000),
                    confidence: 1.0,
                }),
            });
            setState((prev) => ({
                ...prev,
                blurCount: prev.blurCount + 1,
            }));
        } catch {
            // Silently fail, would normally use useViolationBuffer
        }
    }, [sessionId, candidateId]);

    useEffect(() => {
        if (!enabled) return;

        mountTime.current = Date.now();

        const handleBlur = () => {
            setState((prev) => ({ ...prev, isFocused: false }));
            // Don't start the blur timer during the startup grace period —
            // the browser may not have focused the tab yet on initial load.
            if (!blurStartTime.current && Date.now() - mountTime.current >= STARTUP_GRACE_MS) {
                blurStartTime.current = Date.now();
            }
        };

        const handleFocus = () => {
            setState((prev) => ({ ...prev, isFocused: true }));
            if (blurStartTime.current) {
                const durationMs = Date.now() - blurStartTime.current;
                blurStartTime.current = null;
                if (durationMs >= MIN_BLUR_DURATION_MS) {
                    logViolation(durationMs);
                }
            }
        };

        // Do NOT check document.hasFocus() on mount — the tab may simply not be
        // focused yet because the browser is still rendering. Any real blur will
        // fire the event naturally after the grace period.

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, [enabled, logViolation]);

    return state;
}
