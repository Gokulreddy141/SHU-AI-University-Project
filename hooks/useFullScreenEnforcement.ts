"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface FullScreenState {
    isFullScreen: boolean;
    violationCount: number;
}

const FULLSCREEN_COOLDOWN_MS = 5000;

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

        const handleFullScreenChange = () => {
            const isFull = !!document.fullscreenElement;

            setState((prev) => ({ ...prev, isFullScreen: isFull }));

            if (!isFull) {
                // Determine if we should record a violation to avoid spam 
                const now = Date.now();
                if (now - lastViolationTime.current > FULLSCREEN_COOLDOWN_MS) {
                    logViolation();
                    lastViolationTime.current = now;
                }
            }
        };

        // Initial check 
        handleFullScreenChange();

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
    }, [enabled, logViolation]);

    return { ...state, requestFullScreen };
}
