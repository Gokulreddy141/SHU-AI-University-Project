"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface ScreenRecordingState {
    isRecordingSuspected: boolean;
    fpsDropDetected: boolean;
    displayMediaActive: boolean;
}

const FPS_CHECK_INTERVAL_MS = 5000;    // Check FPS every 5 seconds
// Lowered from 20 → 12 FPS: React's heavy animations, FaceMesh model loading,
// and MediaPipe processing can all push the browser below 20fps on mid-range
// hardware without any screen recording involved.
const FPS_DROP_THRESHOLD = 12;
// Raised from 3 → 5 consecutive low-FPS readings before flagging.
// This means 25 seconds of sustained low FPS — enough to rule out a
// temporary UI render spike or model initialisation.
const FPS_SAMPLES_NEEDED = 5;
const COOLDOWN_MS = 120000;             // Raised from 60s

/**
 * Detects screen recording by combining two heuristics:
 * 
 * 1. FPS Drop Detection — Screen recording software causes consistent FPS drops
 *    in the browser's rendering pipeline. We measure via requestAnimationFrame.
 * 
 * 2. Display Media Detection — Checks if getDisplayMedia was called (screen share
 *    is active). This catches Chrome's built-in screen share detection.
 * 
 * No npm dependencies. Pure browser APIs.
 */
export function useScreenRecordingDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<ScreenRecordingState>({
        isRecordingSuspected: false,
        fpsDropDetected: false,
        displayMediaActive: false,
    });

    const lastViolationTime = useRef<number>(0);
    const lowFpsCount = useRef<number>(0);
    const rafRef = useRef<number>(0);
    const frameCount = useRef<number>(0);
    const lastFpsCheck = useRef<number>(0);

    const logViolation = useCallback(
        async (reason: string) => {
            const now = Date.now();
            if (now - lastViolationTime.current < COOLDOWN_MS) return;
            lastViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "SCREEN_RECORDING_DETECTED",
                        timestamp: new Date().toISOString(),
                        confidence: 0.7,
                        direction: reason,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    // Heuristic 1: FPS drop monitoring via requestAnimationFrame
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        const countFrame = () => {
            if (cancelled) return;
            frameCount.current++;

            const now = performance.now();
            const elapsed = now - lastFpsCheck.current;

            if (elapsed >= FPS_CHECK_INTERVAL_MS) {
                const fps = (frameCount.current / elapsed) * 1000;
                frameCount.current = 0;
                lastFpsCheck.current = now;

                if (fps < FPS_DROP_THRESHOLD) {
                    lowFpsCount.current++;
                } else {
                    lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
                }

                const fpsDropDetected = lowFpsCount.current >= FPS_SAMPLES_NEEDED;

                setState((prev) => {
                    const isRecordingSuspected = fpsDropDetected || prev.displayMediaActive;
                    if (isRecordingSuspected && !prev.isRecordingSuspected) {
                        logViolation(fpsDropDetected ? "FPS_DROP" : "DISPLAY_MEDIA");
                    }
                    return { ...prev, fpsDropDetected, isRecordingSuspected };
                });
            }

            rafRef.current = requestAnimationFrame(countFrame);
        };

        rafRef.current = requestAnimationFrame(countFrame);

        return () => {
            cancelled = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [enabled, logViolation]);

    // Heuristic 2: Detect active display media tracks
    useEffect(() => {
        if (!enabled) return;

        // Override getDisplayMedia to detect screen sharing attempts
        const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
        if (!originalGetDisplayMedia) return;

        const interceptedGetDisplayMedia = (
            constraints?: DisplayMediaStreamOptions
        ): Promise<MediaStream> => {
            // Someone called getDisplayMedia — flag it immediately
            setState((prev) => ({
                ...prev,
                displayMediaActive: true,
                isRecordingSuspected: true,
            }));
            logViolation("DISPLAY_MEDIA_CALL");

            // Use navigator.mediaDevices as `this` — arrow functions don't bind `this`,
            // so `this` here would be the module scope (undefined in strict mode).
            const result = originalGetDisplayMedia.call(navigator.mediaDevices, constraints);

            // When the stream ends (user stops sharing), clear the active flag
            result.then((stream) => {
                const resetOnEnd = () => {
                    setState((prev) => ({ ...prev, displayMediaActive: false }));
                };
                stream.getTracks().forEach((track) => {
                    track.addEventListener("ended", resetOnEnd, { once: true });
                });
            }).catch(() => {
                // User denied / cancelled the share — clear the flag
                setState((prev) => ({ ...prev, displayMediaActive: false }));
            });

            return result;
        };

        navigator.mediaDevices.getDisplayMedia = interceptedGetDisplayMedia;

        return () => {
            // Restore original
            navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        };
    }, [enabled, logViolation]);

    return state;
}
