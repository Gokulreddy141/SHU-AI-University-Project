"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface FullScreenState {
    isFullScreen: boolean;
    violationCount: number;
}

const FULLSCREEN_COOLDOWN_MS = 60000; // Raised from 30s — OS dialogs can trigger exit/re-enter rapidly
// Grace period: if fullscreen is restored within this window, don't flag.
// Covers accidental ESC press, OS notification steal, and permission dialogs.
const FULLSCREEN_RESTORE_GRACE_MS = 5000;

export function useFullScreenEnforcement(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<FullScreenState>({
        isFullScreen: false,
        violationCount: 0,
    });
    const lastViolationTime = useRef<number>(0);
    const exitTime = useRef<number | null>(null);

    const logViolation = useCallback(async () => {
        try {
            await fetch("/api/violation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    candidateId,
                    type: "FULLSCREEN_EXIT",
                    timestamp: new Date().toISOString(),
                    confidence: 1.0,
                }),
            });
            setState((prev) => ({
                ...prev,
                violationCount: prev.violationCount + 1,
            }));
        } catch {
            // Silently fail - useViolationBuffer handles this on the backend edge normally,
            // but we use direct fetch here for simplicity. 
        }
    }, [sessionId, candidateId]);

    const requestFullScreen = useCallback(async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error("Failed to enter full screen", err);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Track whether we've ever been in fullscreen this session.
        // We don't log a violation on the initial load before fullscreen is first entered.
        let hasBeenFullscreen = false;

        const handleFullScreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setState((prev) => ({ ...prev, isFullScreen: isFull }));

            if (isFull) {
                hasBeenFullscreen = true;
                // If restored within grace period, cancel the pending violation
                exitTime.current = null;
            } else if (hasBeenFullscreen) {
                exitTime.current = Date.now();
                // Delay the violation log — if fullscreen is restored quickly
                // (OS dialog dismissed, accidental ESC) we skip it entirely.
                const capturedExit = exitTime.current;
                setTimeout(() => {
                    if (exitTime.current !== capturedExit) return; // restored — cancel
                    const now = Date.now();
                    if (now - lastViolationTime.current > FULLSCREEN_COOLDOWN_MS) {
                        logViolation();
                        lastViolationTime.current = now;
                    }
                }, FULLSCREEN_RESTORE_GRACE_MS);
            }
        };

        // Initial state sync — deferred to avoid synchronous setState in effect body
        const isFs = !!document.fullscreenElement;
        if (isFs) hasBeenFullscreen = true;
        setTimeout(() => setState((prev) => ({ ...prev, isFullScreen: isFs })), 0);

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
    }, [enabled, logViolation]);

    return { ...state, requestFullScreen };
}
