"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface WindowFocusState {
    isFocused: boolean;
    blurCount: number;
}

// Ignore accidental/transient blurs (e.g. dev tools popping open) shorter than this
const MIN_BLUR_DURATION_MS = 2000;
// Only report one violation per window per cooldown period
const VIOLATION_COOLDOWN_MS = 30000;

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

        const handleBlur = () => {
            setState((prev) => ({ ...prev, isFocused: false }));
            if (!blurStartTime.current) {
                blurStartTime.current = Date.now();
            }
        };

        const handleFocus = () => {
            setState((prev) => ({ ...prev, isFocused: true }));
            if (blurStartTime.current) {
                const durationMs = Date.now() - blurStartTime.current;
                blurStartTime.current = null;
                // Only log if the candidate was actually away for a meaningful duration
                if (durationMs >= MIN_BLUR_DURATION_MS) {
                    logViolation(durationMs);
                }
            }
        };

        // Initial check
        if (!document.hasFocus()) {
            handleBlur();
        }

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, [enabled, logViolation]);

    return state;
}
